from django.urls import path
from base.views import ai_views as views

urlpatterns = [
    path('generate-product-info/', views.generateProductInfo, name='generate_product_info'),
    path('generate-product-info-langgraph/', views.generateProductInfoWithLangGraph, name='generate_product_info_langgraph'),
    path('check-langgraph-status/', views.checkLangGraphStatus, name='check_langgraph_status'),
]