from base.serializers import UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from base.serializers import UserSerializer
from django.contrib.auth.hashers import make_password
from rest_framework import status

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



# 회원가입 요청 처리 및 토큰 발급
@api_view(['POST'])
def registerUser(request):
    data = request.data
    try:
        # 사용자 생성 (비밀번호는 해시 처리하여 저장)
        user = User.objects.create(
            first_name=data['name'],
            username=data['email'], # username에 이메일 저장
            email=data['email'],
            password=make_password(data['password']) # 비밀번호 해싱
        )

        # JWT 토큰 직접 발급
        refresh = RefreshToken.for_user(user) # 리프레시 토큰 생성
        access_token = str(refresh.access_token) # 액세스 토큰 추출

        # 사용자 정보 직렬화 (UserSerializer 사용)
        serializer = UserSerializer(user, many=False)

        # 사용자 정보 + 토큰 함께 응답
        return Response({
            **serializer.data,
            'access': access_token,
            'refresh': str(refresh)
        })

    except:
        message = {'detail': 'User with this email already exists'}
        return Response(message, status=status.HTTP_400_BAD_REQUEST)