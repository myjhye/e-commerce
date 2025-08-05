from django.urls import path # URL 패턴 정의
from base.views import order_views as views # 실제 비즈니스 로직이 구현된 뷰 함수들

urlpatterns = [
    path('', views.getMyOrders, name="orders"), # 상품 목록 조회
]