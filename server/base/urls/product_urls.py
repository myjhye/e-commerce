from django.urls import path # URL 패턴 정의
from base.views import product_views as views # 실제 비즈니스 로직이 구현된 뷰 함수들

urlpatterns = [
    # 기본 경로: /api/products/ (전체 상품 조회만)
    path('', views.getProducts, name="products"),
]