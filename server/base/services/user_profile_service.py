from django.db.models import Count, Avg, Sum
from collections import Counter
from datetime import datetime, timedelta
from base.models import Product, ProductView, Order, OrderItem

class UserProfileService:
    def __init__(self, user):
        self.user = user
        
    def generate_profile(self):
        """사용자 프로필 생성"""
        # 최근 3개월 데이터만 사용
        three_months_ago = datetime.now() - timedelta(days=90)
        
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
            'generated_at': datetime.now().isoformat()
        }
    
    def _get_category_preferences(self, since_date):
        """카테고리 선호도 분석 (조회수 + 구매수 가중합)"""
        # 조회 이력에서 카테고리별 가중치
        view_categories = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=since_date)
            .values('product__category')
            .annotate(
                view_weight=Sum('view_count')
            )
        )
        
        # 구매 이력에서 카테고리별 가중치 (구매는 조회보다 3배 중요)
        # base/services/user_profile_service.py (수정된 버전)
from django.db.models import Count, Avg, Sum
from collections import Counter
from datetime import datetime, timedelta
from base.models import Product, ProductView, Order, OrderItem

class UserProfileService:
    def __init__(self, user):
        self.user = user
        
    def generate_profile(self):
        """사용자 프로필 생성"""
        three_months_ago = datetime.now() - timedelta(days=90)
        
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
            'generated_at': datetime.now().isoformat()
        }
    
    def _get_category_preferences(self, since_date):
        """카테고리 선호도 분석"""
        view_categories = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=since_date)
            .values('product__category')
            .annotate(view_weight=Sum('view_count'))
        )
        
        # 수정: Count('id') → Count('_id') 또는 Count('*')
        purchase_categories = (
            OrderItem.objects
            .filter(order__user=self.user, order__createdAt__gte=since_date)
            .values('product__category')
            .annotate(purchase_weight=Count('pk') * 3)  # Count('pk') 사용
        )
        
        # 카테고리별 총 점수 계산
        category_scores = Counter()
        
        for item in view_categories:
            category = item['product__category'] or 'Unknown'
            category_scores[category] += item['view_weight'] or 0
            
        for item in purchase_categories:
            category = item['product__category'] or 'Unknown'
            category_scores[category] += item['purchase_weight'] or 0
        
        # 백분율로 변환
        total_score = sum(category_scores.values())
        if total_score == 0:
            return {}
            
        return {
            category: round((score / total_score) * 100, 1)
            for category, score in category_scores.most_common()
        }
    
    def _get_price_preferences(self, since_date):
        """가격대 선호도 분석 (완전한 Decimal 처리)"""
        purchased_prices = []
        for order_item in OrderItem.objects.filter(order__user=self.user, order__createdAt__gte=since_date):
            if order_item.price:
                purchased_prices.append(float(order_item.price))
        
        # 조회한 상품들의 가격 분석 (가중치 적용)
        viewed_prices = []
        for pv in ProductView.objects.filter(user=self.user, last_viewed__gte=since_date):
            if pv.product.price:
                price = float(pv.product.price)
                viewed_prices.extend([price] * min(pv.view_count, 5))
        
        all_prices = purchased_prices + viewed_prices
        
        if not all_prices:
            return {'min': 0, 'max': 0, 'avg': 0, 'median': 0, 'price_ranges': {}}
        
        all_prices.sort()
        n = len(all_prices)
        
        return {
            'min': round(min(all_prices), 2),
            'max': round(max(all_prices), 2),
            'avg': round(sum(all_prices) / n, 2),
            'median': round(all_prices[n // 2], 2),
            'price_ranges': self._categorize_prices(all_prices)
        }
    
    def _categorize_prices(self, prices):
        """가격대별 선호도 분류"""
        ranges = {
            'budget': 0,      # 0-50k
            'mid': 0,         # 50k-200k  
            'premium': 0,     # 200k-500k
            'luxury': 0       # 500k+
        }
        
        for price in prices:
            if price < 50000:
                ranges['budget'] += 1
            elif price < 200000:
                ranges['mid'] += 1
            elif price < 500000:
                ranges['premium'] += 1
            else:
                ranges['luxury'] += 1
        
        total = len(prices)
        return {k: round((v / total) * 100, 1) for k, v in ranges.items()}
    
    def _get_brand_preferences(self, since_date):
        """브랜드 선호도 분석"""
        brand_scores = Counter()
        
        # 구매한 브랜드 (가중치 3)
        purchased_brands = (
            OrderItem.objects
            .filter(order__user=self.user, order__createdAt__gte=since_date)
            .values_list('product__brand', flat=True)
        )
        
        for brand in purchased_brands:
            if brand:
                brand_scores[brand] += 3
        
        # 조회한 브랜드 (조회수만큼 가중치)
        viewed_brands = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=since_date)
            .values('product__brand', 'view_count')
        )
        
        for item in viewed_brands:
            brand = item['product__brand']
            if brand:
                brand_scores[brand] += item['view_count']
        
        return dict(brand_scores.most_common(10))  # 상위 10개 브랜드
    
    def _get_purchase_frequency(self, since_date):
        """구매 주기 분석"""
        orders = (
            Order.objects
            .filter(user=self.user, createdAt__gte=since_date)
            .order_by('createdAt')
        )
        
        if orders.count() < 2:
            return {'frequency': 'insufficient_data', 'avg_days_between': 0}
        
        order_dates = [order.createdAt.date() for order in orders]
        intervals = []
        
        for i in range(1, len(order_dates)):
            interval = (order_dates[i] - order_dates[i-1]).days
            intervals.append(interval)
        
        avg_interval = sum(intervals) / len(intervals)
        
        # 주기 분류
        if avg_interval <= 7:
            frequency = 'weekly'
        elif avg_interval <= 30:
            frequency = 'monthly'
        elif avg_interval <= 90:
            frequency = 'quarterly'
        else:
            frequency = 'rarely'
        
        return {
            'frequency': frequency,
            'avg_days_between': round(avg_interval, 1),
            'total_orders': orders.count()
        }
    
    def _get_recent_interests(self, days=7):
        """최근 관심사 (최근 7일간 조회한 상품)"""
        recent_date = datetime.now() - timedelta(days=days)
        
        recent_views = (
            ProductView.objects
            .filter(user=self.user, last_viewed__gte=recent_date)
            .select_related('product')
            .order_by('-last_viewed')[:10]
        )
        
        return [
            {
                'product_name': pv.product.name,
                'category': pv.product.category,
                'brand': pv.product.brand,
                'view_count': pv.view_count,
                'last_viewed': pv.last_viewed.isoformat()
            }
            for pv in recent_views
        ]
    
    def _get_total_views(self):
        """총 조회수"""
        return ProductView.objects.filter(user=self.user).count()
    
    def _get_total_purchases(self):
        """총 구매수"""
        return Order.objects.filter(user=self.user).count()
    
    def _get_avg_rating(self):
        """평균 리뷰 평점"""
        from base.models import Review
        avg_rating = (
            Review.objects
            .filter(user=self.user)
            .aggregate(avg=Avg('rating'))['avg']
        )
        return round(avg_rating, 1) if avg_rating else 0