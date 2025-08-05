from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from base.services.review_service import ReviewService
from base.models import Product, Review
from base.serializers import ReviewSerializer
from rest_framework.pagination import PageNumberPagination

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createProductReview(request, pk):
    """
    상품 리뷰 등록
    """
    user = request.user # 요청한 사용자 정보 가져오기
    data = request.data # 클라이언트가 보낸 데이터 추출
    rating = data.get('rating') # # 평점 (예: 4)
    comment = data.get('comment') # 리뷰 내용 (예: "좋은 상품입니다")

    try:
        review = ReviewService.create_review( # 비즈니스 로직 처리
            user=user,           # 현재 로그인한 사용자
            product_id=pk,       # URL 파라미터로 받은 상품 ID
            rating=int(rating),  # 평점을 정수로 변환
            comment=comment      # 리뷰 텍스트
        )
        return Response(
            {'detail': '리뷰가 등록되었습니다.'}, 
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},  # 구체적인 오류 메시지 (예: "이미 리뷰를 작성하셨습니다")
            status=status.HTTP_400_BAD_REQUEST
        )
    

@api_view(['GET'])
def getProductReviews(request, pk):
    """
    특정 상품의 리뷰 목록 조회
    """
    try:
        product = Product.objects.get(_id=pk)
        reviews = product.review_set.all().order_by('-createdAt')  # 최신순 정렬

        # 페이지네이션
        paginator = PageNumberPagination()
        paginated_reviews = paginator.paginate_queryset(reviews, request)
        serializer = ReviewSerializer(paginated_reviews, many=True)

        response = paginator.get_paginated_response(serializer.data)

        # 프론트엔드에 필요한 page, pages 정보 추가
        current_page = int(request.GET.get('page', 1))
        total_pages = paginator.page.paginator.num_pages

        response.data['page'] = current_page
        response.data['pages'] = total_pages

        return response
    
    except Product.DoesNotExist:
        return Response(
            {'detail': '존재하지 않는 상품입니다.'},
            status=status.HTTP_404_NOT_FOUND
        )
    


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateProductReview(request, pk, review_id):
    """
    리뷰 수정
    """
    user = request.user
    data = request.data
    rating = data.get('rating')
    comment = data.get('comment')

    try:
        # 리뷰 존재 확인 및 권한 검증
        review = Review.objects.get(_id=review_id, product___id=pk)
        
        # 작성자 본인인지 확인
        if review.user != user:
            return Response(
                {'detail': '자신이 작성한 리뷰만 수정할 수 있습니다.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 리뷰 업데이트
        if rating is not None:
            review.rating = int(rating)
        if comment is not None:
            review.comment = comment
        
        review.save()

        # 상품 평점 재계산
        try:
            ReviewService._update_product_rating(pk)
        except AttributeError:
            pass # ReviewService에 해당 메소드가 없는 경우 무시

        return Response(
            {'detail': '리뷰가 수정되었습니다.'},
            status=status.HTTP_200_OK
        )

    except Review.DoesNotExist:
        return Response(
            {'detail': '존재하지 않는 리뷰입니다.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except ValueError:
        return Response(
            {'detail': '평점은 숫자여야 합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteProductReview(request, pk, review_id):
    """
    리뷰 삭제
    """
    user = request.user

    try:
        # 리뷰 존재 확인 및 권한 검증
        review = Review.objects.get(_id=review_id, product___id=pk)
        
        # 작성자 본인인지 확인
        if review.user != user:
            return Response(
                {'detail': '자신이 작성한 리뷰만 삭제할 수 있습니다.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 리뷰 삭제
        review.delete()

        # 상품 평점 재계산
        try:
            ReviewService._update_product_rating(pk)
        except AttributeError:
            pass # ReviewService에 해당 메소드가 없는 경우 무시

        return Response(
            {'detail': '리뷰가 삭제되었습니다.'},
            status=status.HTTP_200_OK
        )

    except Review.DoesNotExist:
        return Response(
            {'detail': '존재하지 않는 리뷰입니다.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )