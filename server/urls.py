from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from base.views import upload_views as upload_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/products/', include('base.urls.product_urls')), # 제품 관련 API
    path('api/reviews/', include('base.urls.review_urls')), # 제품 리뷰 관련 API
    path('api/orders/', include('base.urls.order_urls')), # 주문 리뷰 관련 API
    path('api/users/', include('base.urls.user_urls')), # 사용자 관련 API
    path('api/ai/', include('base.urls.ai_urls')),
    path('api/recommendations/', include('base.urls.recommendation_urls')),
    path('api/upload/', upload_views.uploadImage, name="image-upload"),
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)