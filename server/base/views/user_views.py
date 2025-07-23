from base.serializers import UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

# JWT 토큰 발급 시 사용자 정보도 함께 포함시키는 커스텀 시리얼라이저
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)  # 기본 access, refresh 토큰 생성

        user_data = UserSerializer(self.user).data  # token 없이 유저 정보만 가져옴
        data.update(user_data)  # 응답에 병합

        return data

# 커스텀 시리얼라이저를 사용하는 로그인 뷰 클래스
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer # 위에서 정의한 시리얼라이저를 사용