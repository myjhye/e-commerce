from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Review, ProductView, Order, OrderItem
from rest_framework_simplejwt.tokens import RefreshToken

# 상품 직렬화
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__' # Product 모델의 모든 필드를 JSON으로 변환


# 사용자 직렬화
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True) # first_name이 없으면 email을 반환
    _id = serializers.SerializerMethodField(read_only=True)# _id: User.id와 동일 (프론트에서 일관된 키 사용을 위해 추가)
    isAdmin = serializers.SerializerMethodField(read_only=True) # isAdmin: User.is_staff 값 리네이밍

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


# 리뷰 직렬화
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'   # or ['_id', 'name', 'rating', 'comment', 'createdAt']


# 최근 본 상품 직렬화
class ProductViewSerializer(serializers.ModelSerializer):
    product = ProductSerializer()  # Product를 중첩 직렬화하여 함께 반환

    class Meta:
        model = ProductView
        fields = ['product', 'last_viewed', 'view_count'] # 상품 정보 + 마지막 조회 시간 + 조회수


# 주문 아이템 직렬화
class OrderItemSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="product.category", read_only=True)

    class Meta:
        model = OrderItem
        fields = ['name', 'qty', 'price', 'image', 'category'] # product.category를 끌어와 category 필드 추가 조회


# 주문 직렬화
class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'  # 또는 필요한 필드만 선택

    def get_items(self, obj):
        items = obj.orderitem_set.all()
        serializer = OrderItemSerializer(items, many=True)
        return serializer.data