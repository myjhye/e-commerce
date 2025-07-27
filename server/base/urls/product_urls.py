from django.urls import path # URL 패턴 정의
from base.views import product_views as views # 실제 비즈니스 로직이 구현된 뷰 함수들

urlpatterns = [
    path('', views.getProducts, name="products"), # 상품 목록 조회
    path('create/', views.createProduct, name="product-create"), # 상품 등록
    path('<str:pk>/', views.getProduct, name="product"), # 상품 상세 조회
]