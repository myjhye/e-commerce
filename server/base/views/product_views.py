from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from base.models import Product
from base.serializers import ProductSerializer
from django.shortcuts import get_object_or_404

# 전체 상품 목록 조회
@api_view(['GET'])
def getProducts(request):
    query = request.query_params.get('keyword', '') # 검색 키워드 가져오기 (없으면 빈 문자열)
    products = Product.objects.filter(name__icontains=query).order_by('-createdAt') # 상품 이름에 keyword가 포함된 상품만 필터링하고, 생성일(createdAt) 기준으로 최신순 정렬
    
    paginator = PageNumberPagination()  # DRF의 페이지네이션 클래스 사용 (설정된 PAGE_SIZE에 따라 자동 분할)
    paginated_products = paginator.paginate_queryset(products, request) # 요청(request)에 담긴 page 정보에 따라 products를 자동으로 슬라이스함
    serializer = ProductSerializer(paginated_products, many=True) # 슬라이스된 상품 목록을 직렬화 (JSON 형태로 변경)
    
    response = paginator.get_paginated_response(serializer.data) # 기본 응답 가져오기
    
    # 프론트엔드에서 필요한 page, pages 정보 추가
    current_page = int(request.GET.get('page', 1))
    total_pages = paginator.page.paginator.num_pages
    
    response.data['page'] = current_page
    response.data['pages'] = total_pages
    
    return response



# 상품 상세 조회
@api_view(['GET'])
def getProduct(request, pk):
    product = get_object_or_404(Product, _id=pk) # pk(기본키)를 기준으로 해당 상품 하나만 조회 (존재하지 않는 상품일 경우 404 반환)
    serializer = ProductSerializer(product, many=False) # 단일 상품 객체를 JSON으로 직렬화
    return Response(serializer.data) # 직렬화된 데이터를 응답으로 반환



# 상품 등록
@api_view(['POST'])
@permission_classes([IsAuthenticated]) # 로그인한 사용자만 등록 가능
def createProduct(request):
    user = request.user
    data = request.data  # 클라이언트에서 보낸 JSON

    product = Product.objects.create(
        user=user, # 상품 등록자
        name=data.get('name', ''),
        price=data.get('price', 0),
        brand=data.get('brand', ''),
        category=data.get('category', ''),
        description=data.get('description', ''),
        countInStock=data.get('countInStock', 0),
        image=data.get('image', None)  # 이미지 URL 또는 업로드 파일
    )

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data, status=status.HTTP_201_CREATED)