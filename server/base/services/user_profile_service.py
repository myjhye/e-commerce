from django.db.models import Count, Avg, Sum
from collections import Counter
from django.utils import timezone
from datetime import timedelta
from base.models import Product, ProductView, Order, OrderItem

# 사용자의 쇼핑 행동을 종합 분석해서 개인화 추천을 위한 데이터를 만들기
class UserProfileService:
    def __init__(self, user):
        self.user = user
        
    def generate_profile(self):
        """사용자 프로필 생성"""
        three_months_ago = timezone.now() - timedelta(days=90)
        
        return {
            'user_id': self.user.id,
            'username': self.user.username,
            'category_preferences': self._get_category_preferences(three_months_ago),
            'price_range': self._get_price_preferences(three_months_ago),
            'brand_preferences': self._get_brand_preferences(three_months_ago),
            'purchase_frequency': self._get_purchase_frequency(three_months_ago),
            'recent_interests': self._get_recent_interests(),
            'total_views': self._get_total_views(),
            'total_purchases': self._get_total_purchases(),
            'avg_rating_given': self._get_avg_rating(),
            'generated_at': timezone.now().isoformat()
        }
    
    def _get_category_preferences(self, since_date):
        """카테고리 선호도 분석"""

        # 1단계: 조회 이력 수집
        # 내(self.user)가 since_date 이후(최근 3개월)에 본 상품들을 카테고리별(product__category)로 묶어서 view_count를 전부 합함 → 조회 점수(view_weight)
        view_categories = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=since_date)
            .values('product__category')
            .annotate(view_weight=Sum('view_count'))
        )
        
        # 2단계: 구매 이력 수집 (3배 가중치)
        # 내(self.user)가 since_date 이후(최근 3개월)에 구매한 상품들을 카테고리별(product__category)로 묶어서 구매 건수를 전부 합하고 3을 곱함 (구매는 단순 조회부터 중요한 것으로 간주)
        purchase_categories = (
            OrderItem.objects
            .filter(order__user=self.user, order__createdAt__gte=since_date)
            .values('product__category')
            .annotate(purchase_weight=Count('pk') * 3)  # Count('pk') 사용
        )
        
        # 카테고리별 총 점수 계산
        category_scores = Counter()
        
        # 1단계: 조회 점수 합산
        for item in view_categories:
            category = item['product__category'] or 'Unknown'
            category_scores[category] += item['view_weight'] or 0

        # 2단계: 구매 점수 합산    
        for item in purchase_categories:
            category = item['product__category'] or 'Unknown'
            category_scores[category] += item['purchase_weight'] or 0
        
        # 백분율로 변환
        total_score = sum(category_scores.values())
        if total_score == 0:
            return {}
            
        return {
            category: round((score / total_score) * 100, 1)
            for category, score in category_scores.most_common() # 점수 높은 순으로 정렬
        }
    
    # 사용자가 평소에 어떤 가격대의 상품을 좋아하는지 파악하기
    def _get_price_preferences(self, since_date):
        """가격대 선호도 분석 (완전한 Decimal 처리)"""

        # 1단계: 구매한 상품 가격 수집
        purchased_prices = []
        for order_item in OrderItem.objects.filter(order__user=self.user, order__createdAt__gte=since_date):
            if order_item.price:
                purchased_prices.append(float(order_item.price))
        
        # 2단계: 조회한 상품 가격 수집 (가중치 적용!)
        viewed_prices = []
        for pv in ProductView.objects.filter(user=self.user, last_viewed__gte=since_date):
            if pv.product.price:
                price = float(pv.product.price)
                viewed_prices.extend([price] * min(pv.view_count, 5))
        
        # 3단계: 데이터 합치기
        all_prices = purchased_prices + viewed_prices
        
        if not all_prices:
            return {'min': 0, 'max': 0, 'avg': 0, 'median': 0, 'price_ranges': {}}
        
        # 4단계: 통계 계산
        all_prices.sort()
        n = len(all_prices)
        
        return {
            'min': round(min(all_prices), 2),
            'max': round(max(all_prices), 2),
            'avg': round(sum(all_prices) / n, 2),
            'median': round(all_prices[n // 2], 2),
            'price_ranges': self._categorize_prices(all_prices)
        }
    

    # 사용자의 가격 데이터를 4개 등급으로 분류해서 어떤 가격대를 얼마나 선호하는지 백분율로 보여주기
    def _categorize_prices(self, prices):
        """가격대별 선호도 분류"""
        ranges = {
            'budget': 0,      # 0-50k      (저가형)
            'mid': 0,         # 50k-200k   (중간가)  
            'premium': 0,     # 200k-500k  (고급형)
            'luxury': 0       # 500k+      (럭셔리)
        }
        
        # 각 가격을 하나씩 확인해서 해당 구간의 카운트를 1씩 증가
        for price in prices:
            if price < 50000:
                ranges['budget'] += 1 # 5만원 미만
            elif price < 200000:
                ranges['mid'] += 1 # 5-20만원
            elif price < 500000:
                ranges['premium'] += 1 # 20-50만원
            else:
                ranges['luxury'] += 1 # 50만원 이상
        
        # 각 구간의 개수를 전체로 나눠서 백분율로 변환
        total = len(prices)
        return {k: round((v / total) * 100, 1) for k, v in ranges.items()}
    


    # 사용자가 어떤 브랜드를 좋아하는지 분석
    def _get_brand_preferences(self, since_date):
        """브랜드 선호도 분석"""
        brand_scores = Counter()
        
        # 구매한 브랜드 (가중치 3)
        purchased_brands = (
            OrderItem.objects
            .filter(order__user=self.user, order__createdAt__gte=since_date)
            .values_list('product__brand', flat=True) # 브랜드명만 리스트로
        )
        
        for brand in purchased_brands:
            if brand:
                brand_scores[brand] += 3 # 구매 = 3점 (강한 선호도)
        
        # 조회한 브랜드 (조회수만큼 가중치)
        viewed_brands = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=since_date)
            .values('product__brand', 'view_count') # 브랜드와 조회수
        )
        
        for item in viewed_brands:
            brand = item['product__brand']
            if brand:
                brand_scores[brand] += item['view_count'] # 조회수만큼 점수
        
        return dict(brand_scores.most_common(10))  # 상위 10개 브랜드
    
    # 사용자가 얼마나 자주 쇼핑하는지 분석 (사용자의 구매 주기를 파악해서 "주간형", "월간형", "분기형", "가끔형" 중 하나로 분류)
    def _get_purchase_frequency(self, since_date):
        """구매 주기 분석"""

        # 최근 3개월간 주문을 시간순으로 가져오기
        orders = (
            Order.objects
            .filter(user=self.user, createdAt__gte=since_date)
            .order_by('createdAt') # 날짜순 정렬
        )
        
        # 주문이 2개 미만이면 → 주기 계산 불가능 (최소 2번은 사야 간격 계산 가능)
        if orders.count() < 2:
            return {'frequency': 'insufficient_data', 'avg_days_between': 0}
        
        # 1단계: 주문 날짜 리스트 만들기 (예: [2025-05-01, 2025-06-15, 2025-08-10])
        order_dates = [order.createdAt.date() for order in orders]
        
        # 2단계: 연속된 주문 간의 간격 계산
        intervals = []
        
        for i in range(1, len(order_dates)):
            interval = (order_dates[i] - order_dates[i-1]).days
            intervals.append(interval)
        
        # 3단계: 평균 간격 계산 (예: (45 + 56) / 2 = 50.5일)
        avg_interval = sum(intervals) / len(intervals)
        
        # 주기 분류
        if avg_interval <= 7:
            frequency = 'weekly' # 일주일 이내 - 주간 쇼핑족
        elif avg_interval <= 30:
            frequency = 'monthly' # 한 달 이내 - 월간 쇼핑족
        elif avg_interval <= 90:
            frequency = 'quarterly' # 3개월 이내 - 분기 쇼핑족
        else:
            frequency = 'rarely' # 3개월 이상 - 가끔 쇼핑족
        
        return {
            'frequency': frequency, # 주기 분류
            'avg_days_between': round(avg_interval, 1), # 평균 간격(일)
            'total_orders': orders.count() # 총 주문 수
        }
    
    # 사용자가 최근에 관심 있어 하는 상품들을 파악
    def _get_recent_interests(self, days=7): # 기본값 7일
        """최근 관심사 (최근 7일간 조회한 상품)"""
        recent_date = timezone.now() - timedelta(days=days)
        
        recent_views = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=recent_date) # 최근 7일간
            .select_related('product') # 상품 정보도 함께 가져오기 (성능 최적화)
            .order_by('-last_viewed')[:10] # 최신 순으로 정렬, 상위 10개만
        )
        
        return [
            {
                'product_name': pv.product.name, # 상품명
                'category': pv.product.category, # 카테고리
                'brand': pv.product.brand, # 브랜드 
                'view_count': pv.view_count, # 조회 횟수
                'last_viewed': pv.last_viewed.isoformat() # 마지막 조회 시간
            }
            for pv in recent_views
        ]
    
    # 사용자가 지금까지 본 상품의 총 개수 (기간 제한 없음, 단순 카운트)
    def _get_total_views(self):
        """총 조회수"""
        return ProductView.objects.filter(user=self.user).count()
    
    # 사용자가 지금까지 한 총 주문 횟수
    def _get_total_purchases(self):
        """총 구매수"""
        return Order.objects.filter(user=self.user).count()
    
    # 사용자가 작성한 리뷰들의 평균 별점
    def _get_avg_rating(self):
        """평균 리뷰 평점"""
        from base.models import Review
        avg_rating = (
            Review.objects
            .filter(user=self.user)
            .aggregate(avg=Avg('rating'))['avg']
        )
        return round(avg_rating, 1) if avg_rating else 0