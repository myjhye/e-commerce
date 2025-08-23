from django.urls import path
from base.views import ai_views as views
from base.views import chatbot_views

urlpatterns = [
    # 상품 정보 생성 API
    path('generate-product-info/', views.generateProductInfo, name='generate_product_info'),
    path('generate-product-info-langgraph/', views.generateProductInfoWithLangGraph, name='generate_product_info_langgraph'),
    path('check-langgraph-status/', views.checkLangGraphStatus, name='check_langgraph_status'),

    # 리뷰 분석 API
    path('review-analysis/<str:pk>/', views.getProductReviewAnalysis, name='product_review_analysis'),
    path('huggingface-status/', views.getHuggingFaceStatus, name='huggingface_status'),

    # 상담 챗봇 API
    path('chatbot/', chatbot_views.chatbot_query, name='chatbot_query'),
    path('chatbot/status/', chatbot_views.chatbot_status, name='chatbot_status'),
]