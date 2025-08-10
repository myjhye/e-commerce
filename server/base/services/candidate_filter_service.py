from django.db.models import Count, Sum
from datetime import datetime, timedelta
from base.models import Product, ProductView, OrderItem

class CandidateFilterService:
    def __init__(self, user, user_profile):
        self.user = user
        self.profile = user_profile
        
    # 최종적으로 반환할 후보 상품 개수 (기본 20개) -> 수천 개 상품 중에서 이 사용자에게 적합한 20개만 선별   
    def get_candidate_products(self, limit=20):
        """개인 취향 기반 추천 후보 상품 필터링"""
        
        # 1. 기본 필터링: 재고 있고, 이미 구매하지 않은 상품
        excluded_products = self._get_excluded_products()
        
        base_candidates = (
            Product.objects
            .filter(countInStock__gt=0) # 재고 있는 상품만
            .exclude(_id__in=excluded_products) # 이미 구매한 상품 제외
            .distinct()  # 중복 제거
        )
        
        # 2. 개인 취향 기반 필터링
        category_candidates = self._filter_by_category(base_candidates) # 카테고리 필터링
        price_candidates = self._filter_by_price(category_candidates) # 가격 필터링
        final_candidates = self._filter_by_brand_and_score(price_candidates, limit) # 브랜드 & 점수 계산

        # 3. 최종 중복 제거 (안전장치)
        unique_candidates = self._remove_duplicates(final_candidates)
        
        return unique_candidates



    def _remove_duplicates(self, products):
        """상품 리스트에서 중복 제거"""
        seen_ids = set()
        unique_products = []
        
        for product in products:
            product_id = product._id  # 또는 product.id (Product 모델에 따라)
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                unique_products.append(product)
            else:
                print(f"중복 상품 제거: {product.name} (ID: {product_id})")
        
        return unique_products
    
    

    # 사용자가 이미 구매한 상품들을 찾아서 추천에서 제외할 목록 생성
    def _get_excluded_products(self):
        """제외할 상품들 (구매한 상품만 제외)"""

        # 1단계: 빈 집합 (같은 상품 여러 번 구매 시 중복 제거)
        excluded = set() 
        
        # 2단계: 구매한 상품 ID 수집
        purchased = OrderItem.objects.filter(
            order__user=self.user # 이 사용자의 주문들만
        ).values_list('product___id', flat=True) # 상품 ID만 리스트로
        
        # 3단계: 집합에 추가
        excluded.update(purchased)
        
        # 4단계: 리스트로 변환 후 반환
        return list(excluded)
    

    # 사용자가 선호하는 카테고리를 기반으로 상품을 필터링
    def _filter_by_category(self, queryset):
        """카테고리 선호도 기반 필터링"""

        # 1단계: 프로필에서 선호 카테고리 가져오기
        category_prefs = self.profile.get('category_preferences', {})
        
        if not category_prefs:
            return queryset
        
        # 2단계: 선호 카테고리 상품 필터링
        top_categories = list(category_prefs.keys())
        category_products = queryset.filter(category__in=top_categories)
        
        # 3단계: 유연성 체크 (핵심 로직!) -> 선호 카테고리 상품이 10개 미만이면 → 다른 카테고리도 포함
        if category_products.count() < 10:
            # 4단계: 혼합 전략 (70% 선호 카테고리 + 30% 다른 카테고리)
            other_products = queryset.exclude(category__in=top_categories)
            combined_ids = list(set(
                list(category_products.values_list('_id', flat=True)) +  # 선호 카테고리 전체
                list(other_products.values_list('_id', flat=True)[:10]) # 다른 카테고리 10개
            ))
            return Product.objects.filter(_id__in=combined_ids)
        
        return category_products
    


    # 사용자의 가격 선호도를 기반으로 상품을 필터링하되, 단계적으로 범위를 넓혀가며 충분한 상품을 확보
    def _filter_by_price(self, queryset):
        """가격대 선호도 기반 필터링 (범위 확대)"""
        
        # 1단계: 데이터 유효성 검사
        price_prefs = self.profile.get('price_range', {}) # 예: {"avg": 1745.72, "min": 111.0, "max": 11111.0}
        
        if not price_prefs or price_prefs.get('avg', 0) == 0: # 가격 데이터 없으면 전체 반환
            return queryset 
        
        # 2단계: 기본 가격 범위 (±50%)
        avg_price = float(price_prefs['avg']) # 1745.72원
        
        # 50% ~ 150% 범위
        min_price = avg_price * 0.5 # 872.86원
        max_price = avg_price * 1.5 # 2618.58원
        
        price_filtered = queryset.filter(
            price__gte=min_price, # 872원 이상
            price__lte=max_price # 2618원 이하
        )
        
        # 3단계: 범위 확대 (20% ~ 300%)
        if price_filtered.count() < 5: # 5개 미만이면
            min_price = avg_price * 0.2 # 349.14원
            max_price = avg_price * 3.0 # 5237.16원
            
            price_filtered = queryset.filter(
                price__gte=min_price,
                price__lte=max_price
            )
        
        # 3차: 가격 제한 없음
        if price_filtered.count() < 3: # 여전히 3개 미만이면
            return queryset # 가격 상관없이 전체 반환
        
        return price_filtered
    

    # 각 상품에 종합 점수를 매겨서 순위를 정하고 상위 상품들만 선별 (개인화 점수 계산 + 최종 랭킹)
    def _filter_by_brand_and_score(self, queryset, limit):
        """브랜드 선호도 반영하여 점수 계산 및 정렬"""
        brand_prefs = self.profile.get('brand_preferences', {})
        category_prefs = self.profile.get('category_preferences', {})
        
        scored_products = []
        
        for product in queryset:
            # 1단계: 기본 점수 (모든 상품) -> 모든 상품이 최소한의 점수를 갖도록
            score = 0.0
            score += 10.0
            
            # 2단계: 카테고리 점수 (개인화)
            if product.category in category_prefs:
                category_score = float(category_prefs[product.category]) * 0.5
                score += category_score
            
            # 3단계: 브랜드 점수 (개인화 + 상한 제한)
            if product.brand in brand_prefs:
                brand_score = min(float(brand_prefs[product.brand]) * 3.0, 50.0)
                score += brand_score
            
            # 4단계: 인기도 점수 (객관적 지표)
            if product.numReviews > 0:
                review_score = min(float(product.numReviews) * 0.5, 15.0) # 리뷰 수
                rating_score = float(product.rating) * 3.0  # 평점
                popularity_score = review_score + rating_score
                score += popularity_score
            
            scored_products.append({
                'product': product,
                'score': score
            })
        
        # 점수 높은 순으로 정렬
        scored_products.sort(key=lambda x: x['score'], reverse=True)
        
        # 상위 결과 출력
        for i, item in enumerate(scored_products[:5]):
            product = item['product']
        
        return [item['product'] for item in scored_products[:limit]]