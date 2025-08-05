from django.urls import path
from base.views import review_views as views

urlpatterns = [
    path('<str:pk>/create/', views.createProductReview, name="review-create"), # 리뷰 등록
    path('<str:pk>/<str:review_id>/update/', views.updateProductReview, name="review-update"), # 리뷰 수정
    path('<str:pk>/<str:review_id>/delete/', views.deleteProductReview, name="review-delete"), # 리뷰 삭제
    path('<str:pk>/', views.getProductReviews, name="product-reviews"), # 리뷰 조회
]