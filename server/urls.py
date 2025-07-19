from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [

    # 사용자가 웹사이트에 처음 접속할 때 보는 페이지
    path('', TemplateView.as_view(template_name='index.html')), 
    
    # 제품 관련 모든 API: http://localhost:8000/api/products/
    # base/urls/product_urls.py 파일의 모든 URL 패턴들을 포함
    path('api/products/', include('base.urls.product_urls')),
]

# 사용자가 업로드한 파일들(제품 이미지, 프로필 사진 등)을 웹브라우저에서 볼 수 있게 해주는 설정 
# 개발 환경에서만 사용, 실제 배포시에는 Nginx 등이 처리
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)                                                                         