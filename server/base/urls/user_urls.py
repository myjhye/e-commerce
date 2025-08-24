from django.urls import path
from base.views import user_views as views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.registerUser, name='register'), # 회원가입
    path('login/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # 로그인
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'), # 토큰 갱신
    path('profile/', views.getUserProfile, name="users-profile"), # 프로필 조회
]