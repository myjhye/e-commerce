# base/services/candidate_filter_service.py (Decimal 완전 수정)
from django.db.models import Count, Sum
from datetime import datetime, timedelta
from base.models import Product, ProductView, OrderItem

class CandidateFilterService:
    def __init__(self, user, user_profile):
        self.user = user
        self.profile = user_profile
        
    def get_candidate_products(self, limit=20):
        """개인 취향 기반 추천 후보 상품 필터링"""
        print(f"=== 개인 취향 기반 추천: {self.user.username} ===")
        
        # 1. 기본 필터링: 재고 있고, 이미 구매하지 않은 상품
        excluded_products = self._get_excluded_products()
        print(f"제외할 상품: {len(excluded_products)}개")
        
        base_candidates = (
            Product.objects
            .filter(countInStock__gt=0)
            .exclude(_id__in=excluded_products)
        )
        print(f"기본 후보 상품: {base_candidates.count()}개")
        
        # 2. 개인 취향 기반 필터링
        category_candidates = self._filter_by_category(base_candidates)
        print(f"카테고리 필터링 후: {category_candidates.count()}개")
        
        price_candidates = self._filter_by_price(category_candidates)
        print(f"가격 필터링 후: {price_candidates.count()}개")
        
        final_candidates = self._filter_by_brand_and_score(price_candidates, limit)
        print(f"최종 후보: {len(final_candidates)}개")
        
        return final_candidates
    
    def _get_excluded_products(self):
        """제외할 상품들 (구매한 상품만 제외)"""
        excluded = set()
        
        # 이미 구매한 상품들만 제외
        purchased = OrderItem.objects.filter(
            order__user=self.user
        ).values_list('product___id', flat=True)
        excluded.update(purchased)
        print(f"구매한 상품: {len(purchased)}개")
        
        return list(excluded)
    
    def _filter_by_category(self, queryset):
        """카테고리 선호도 기반 필터링 (완화)"""
        category_prefs = self.profile.get('category_preferences', {})
        print(f"카테고리 선호도: {category_prefs}")
        
        if not category_prefs:
            print("카테고리 선호도 없음 - 전체 반환")
            return queryset
        
        # 선호 카테고리 상품들
        top_categories = list(category_prefs.keys())
        category_products = queryset.filter(category__in=top_categories)
        print(f"선호 카테고리({top_categories}) 상품: {category_products.count()}개")
        
        # 선호 카테고리 상품이 적으면 다른 카테고리도 포함
        if category_products.count() < 10:
            print("선호 카테고리 상품 부족 - 다른 카테고리도 포함")
            other_products = queryset.exclude(category__in=top_categories)
            
            # 70% 선호 카테고리 + 30% 다른 카테고리
            combined_ids = (
                list(category_products.values_list('_id', flat=True)) + 
                list(other_products.values_list('_id', flat=True)[:10])
            )
            return Product.objects.filter(_id__in=combined_ids)
        
        return category_products
    
    def _filter_by_price(self, queryset):
        """가격대 선호도 기반 필터링 (범위 확대)"""
        price_prefs = self.profile.get('price_range', {})
        print(f"가격 선호도: {price_prefs}")
        
        if not price_prefs or price_prefs.get('avg', 0) == 0:
            print("가격 선호도 없음 - 전체 반환")
            return queryset
        
        avg_price = float(price_prefs['avg'])
        
        # 1차: 기본 범위 (50% ~ 150%)
        min_price = avg_price * 0.5
        max_price = avg_price * 1.5
        
        price_filtered = queryset.filter(
            price__gte=min_price,
            price__lte=max_price
        )
        print(f"기본 가격 범위({min_price:.0f}~{max_price:.0f}): {price_filtered.count()}개")
        
        # 2차: 범위 확대 (20% ~ 300%)
        if price_filtered.count() < 5:
            print("가격 범위 확대")
            min_price = avg_price * 0.2
            max_price = avg_price * 3.0
            
            price_filtered = queryset.filter(
                price__gte=min_price,
                price__lte=max_price
            )
            print(f"확대 가격 범위({min_price:.0f}~{max_price:.0f}): {price_filtered.count()}개")
        
        # 3차: 가격 제한 없음
        if price_filtered.count() < 3:
            print("가격 제한 제거")
            return queryset
        
        return price_filtered
    
    def _filter_by_brand_and_score(self, queryset, limit):
        """브랜드 선호도 반영하여 점수 계산 및 정렬 (Decimal 타입 안전)"""
        brand_prefs = self.profile.get('brand_preferences', {})
        category_prefs = self.profile.get('category_preferences', {})
        
        print(f"브랜드 선호도: {brand_prefs}")
        
        scored_products = []
        
        for product in queryset:
            # 모든 점수는 float로 통일
            score = 0.0  # float로 시작
            
            # 기본 점수 (모든 상품)
            score += 10.0
            
            # 카테고리 점수
            if product.category in category_prefs:
                category_score = float(category_prefs[product.category]) * 0.5
                score += category_score
                print(f"{product.name[:20]}... 카테고리({product.category}) +{category_score:.1f}")
            
            # 브랜드 점수
            if product.brand in brand_prefs:
                brand_score = min(float(brand_prefs[product.brand]) * 3.0, 50.0)
                score += brand_score
                print(f"{product.name[:20]}... 브랜드({product.brand}) +{brand_score:.1f}")
            
            # 인기도 점수 (Decimal 타입 안전 처리)
            if product.numReviews > 0:
                # numReviews는 int, rating은 Decimal일 수 있음
                review_score = min(float(product.numReviews) * 0.5, 15.0)
                rating_score = float(product.rating) * 3.0  # Decimal → float 변환
                popularity_score = review_score + rating_score
                score += popularity_score
            
            scored_products.append({
                'product': product,
                'score': score
            })
        
        # 점수 높은 순으로 정렬
        scored_products.sort(key=lambda x: x['score'], reverse=True)
        
        # 상위 결과 출력
        print("\n=== 상위 추천 상품 ===")
        for i, item in enumerate(scored_products[:5]):
            product = item['product']
            print(f"{i+1}. {product.name[:30]}... (점수: {item['score']:.1f}, 카테고리: {product.category}, 브랜드: {product.brand})")
        
        return [item['product'] for item in scored_products[:limit]]