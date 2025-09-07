from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from base.views.user_views import MyTokenObtainPairView
from base.views import upload_views as upload_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT 인증 엔드포인트
    path('api/users/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/users/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 앱 관련 API
    path('api/products/', include('base.urls.product_urls')), 
    path('api/reviews/', include('base.urls.review_urls')), 
    path('api/users/', include('base.urls.user_urls')), 
    path('api/ai/', include('base.urls.ai_urls')),
    path('api/recommendations/', include('base.urls.recommendation_urls')),
    path('api/upload/', upload_views.uploadImage, name="image-upload"),
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
