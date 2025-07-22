from base.serializers import UserSerializerWithToken, UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

# 사용자 정보와 함께 JWT 토큰을 반환하는 커스텀 뷰 설정

# JWT 토큰 발급 시 사용자 정보도 함께 포함시키는 커스텀 시리얼라이저
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs) # 부모 클래스(TokenObtainPairSerializer)의 기본 토큰 발급 로직 수행

        serializer = UserSerializerWithToken(self.user).data  # 추가로 사용자 정보를 시리얼라이즈해서 기존 응답에 병합
        for k, v in serializer.items():
            data[k] = v

        return data

# 커스텀 시리얼라이저를 사용하는 로그인 뷰 클래스
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer # 위에서 정의한 시리얼라이저를 사용