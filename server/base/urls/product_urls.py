from django.urls import path # URL 패턴 정의
from base.views import product_views as views # 실제 비즈니스 로직이 구현된 뷰 함수들

urlpatterns = [
    # 기본 경로: /api/products/
    path('', views.getProducts, name="products"),
    
    # 제품 생성: /api/products/create/
    path('create/', views.createProduct, name="product-create"),
    
    # 이미지 업로드: /api/products/upload/
    path('upload/', views.uploadImage, name="image-upload"),
    
    # 리뷰 작성: /api/products/25/reviews/
    path('<str:pk>/reviews/', views.createProductReview, name="create-review"),
    
    # 인기 제품: /api/products/top/
    path('top/', views.getTopProducts, name='top-products'),
    
    # 특정 제품: /api/products/25/
    path('<str:pk>/', views.getProduct, name="product"),
    
    # 제품 수정: /api/products/update/25/
    path('update/<str:pk>/', views.updateProduct, name="product-update"),
    
    # 제품 삭제: /api/products/delete/25/
    path('delete/<str:pk>/', views.deleteProduct, name="product-delete"),
]