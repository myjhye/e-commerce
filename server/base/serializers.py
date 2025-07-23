from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product
from rest_framework_simplejwt.tokens import RefreshToken

# 상품(Product) 정보를 직렬화하는 시리얼라이저
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__' # Product 모델의 모든 필드를 JSON으로 변환


# 사용자(User) 정보를 직렬화하는 기본 시리얼라이저
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True) # 사용자 이름: first_name이 비어 있으면 email 사용
    _id = serializers.SerializerMethodField(read_only=True) # _id: id와 동일한 값이지만, 프론트엔드에서 일관된 필드명으로 쓰기 위함
    isAdmin = serializers.SerializerMethodField(read_only=True) # isAdmin: User 모델의 is_staff 값을 리네이밍하여 반환

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'name', 'isAdmin']

    # _id 필드에 사용될 값 반환 (id 그대로)
    def get__id(self, obj):
        return obj.id

    # isAdmin 필드에 사용될 값 반환 (is_staff 그대로)
    def get_isAdmin(self, obj):
        return obj.is_staff

    # name 필드에 사용될 값 반환
    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.email # 이름이 비어있으면 email 사용

        return name