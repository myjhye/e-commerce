from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Review, ProductView, Order, OrderItem
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

# 상품 직렬화
class ProductSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    
    # image 필드를 ImageField로 변경하여 파일 업로드를 처리할 수 있도록 합니다.
    # required=False, allow_null=True는 이미지 없이 상품을 생성하는 것을 허용합니다.
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = '__all__'
    
    # get_image 메서드는 삭제합니다.

    def to_representation(self, instance):
        """
        객체를 JSON으로 변환(직렬화)할 때 호출되는 메서드입니다.
        여기서 이미지 URL을 절대 경로로 변환하고, 이미지가 없을 경우 placeholder 경로를 제공합니다.
        """
        # 기본 직렬화 결과를 가져옵니다.
        representation = super().to_representation(instance)
        request = self.context.get('request')

        # Product 인스턴스에 이미지가 실제로 존재하는지 확인합니다.
        if instance.image and hasattr(instance.image, 'url'):
            # request 객체가 존재하면 절대 URL(http://...)을 생성합니다.
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                # request가 없으면 상대 URL(/media/...)을 그대로 사용합니다.
                representation['image'] = instance.image.url
        # Product 인스턴스에 이미지가 없는 경우
        else:
            # request 객체가 있으면 placeholder 이미지의 절대 URL을 생성합니다.
            if request:
                representation['image'] = request.build_absolute_uri(settings.MEDIA_URL + 'placeholder.png')
            else:
                # request가 없으면 None을 반환하거나 상대 경로를 지정할 수 있습니다.
                representation['image'] = None

        return representation


# 사용자 직렬화
class UserSerializer(serializers.ModelSerializer):
    """
    User 모델의 'first_name'을 'name'으로, 'is_staff'를 'is_admin'으로 변환하여
    프론트엔드와 데이터 형식을 맞추는 시리얼라이저입니다.
    """
    # 'name' 이라는 이름의 커스텀 필드를 추가 (읽기 전용)
    name = serializers.SerializerMethodField(read_only=True)
    # 'is_admin' 이라는 이름의 커스텀 필드를 추가 (읽기 전용)
    is_admin = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        # API 응답에 포함될 필드 목록
        fields = ['id', 'username', 'email', 'name', 'is_admin']

    def get_name(self, obj):
        """
        'name' 필드의 값을 생성하는 메소드입니다.
        User 모델의 first_name 값을 가져옵니다.
        만약 first_name이 비어있다면, username을 대신 사용합니다.
        """
        name = obj.first_name
        if name == '':
            name = obj.username
        return name

    def get_is_admin(self, obj):
        """
        'is_admin' 필드의 값을 생성하는 메소드입니다.
        User 모델의 is_staff 속성 값을 사용합니다. (is_staff는 관리자 사이트 접근 권한)
        """
        return obj.is_staff


# 회원가입/로그인 시 토큰 발급을 위한 시리얼라이저
class UserSerializerWithToken(UserSerializer):
    """
    UserSerializer를 상속받아, 사용자 정보에 JWT 토큰을 추가로 포함시키는 시리얼라이저입니다.
    주로 회원가입이나 로그인 성공 시 사용됩니다.
    """
    # 'token' 이라는 이름의 커스텀 필드를 추가 (읽기 전용)
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        # 기존 UserSerializer의 필드에 'token'을 추가
        fields = ['id', 'username', 'email', 'name', 'is_admin', 'token']

    def get_token(self, obj):
        """
        'token' 필드의 값을 생성하는 메소드입니다.
        사용자 객체(obj)를 기반으로 새로운 RefreshToken을 생성하고,
        그 중 Access Token을 문자열로 반환합니다.
        """
        token = RefreshToken.for_user(obj)
        return str(token.access_token)
    
    

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