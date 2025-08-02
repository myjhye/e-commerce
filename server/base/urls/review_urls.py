from django.urls import path
from base.views import review_views as views

urlpatterns = [
    path('<str:pk>/create/', views.createProductReview, name="review-create"), # 리뷰 등록
    path('<str:pk>/', views.getProductReviews, name="product-reviews"), # 리뷰 조회
]