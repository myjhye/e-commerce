from django.urls import path # URL 패턴 정의
from base.views import product_views as views # 실제 비즈니스 로직이 구현된 뷰 함수들

urlpatterns = [
    path('', views.getProducts, name="products"), # 상품 목록 조회 (검색/페이지네이션 지원)
    path('create/', views.createProduct, name="product-create"), # 상품 등록 (로그인 필요)

    path('view/', views.add_product_view, name='product-add-view'), # 상품 조회 기록 추가 (POST)
    path('recent/', views.get_product_views, name='product-recent-view'), # 최근 본 상품 목록 조회 (GET)

    path('<str:pk>/purchase/', views.purchaseProduct, name="product-purchase"), # 특정 상품 구매
    path('orders/', views.getMyOrders, name="product-purchase-view"), # 상품 구매 목록 조회

    path('<str:pk>/', views.getProduct, name="product-detail-view"), # 특정 상품 상세 조회
]