from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from base.models import Product
from base.serializers import ProductSerializer

# 전체 상품 목록 조회
@api_view(['GET'])
def getProducts(request):
    # 검색 키워드 가져오기 (없으면 빈 문자열)
    query = request.query_params.get('keyword', '')

    # 상품 이름에 keyword가 포함된 상품만 필터링하고, 생성일(createdAt) 기준으로 최신순 정렬
    products = Product.objects.filter(name__icontains=query).order_by('-createdAt')

    # DRF의 페이지네이션 클래스 사용 (설정된 PAGE_SIZE에 따라 자동 분할)
    paginator = PageNumberPagination()

    # 요청(request)에 담긴 page 정보에 따라 products를 자동으로 슬라이스함
    paginated_products = paginator.paginate_queryset(products, request)

    # 슬라이스된 상품 목록을 직렬화 (JSON 형태로 변경)
    serializer = ProductSerializer(paginated_products, many=True)
    
    # 페이지네이션 메타 정보(count, next, previous)와 함께 응답 반환
    return paginator.get_paginated_response(serializer.data)
