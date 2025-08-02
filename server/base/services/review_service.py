from django.db import transaction
from django.db.models import Avg
from base.models import Review, Product
from rest_framework.exceptions import ValidationError

class ReviewService:
    """
    상품 리뷰 관리 클래스
    """

    @staticmethod
    def create_review(user, product_id, rating, comment):
        """
        리뷰 등록
        """

        # 상품 존재 여부 체크
        try:
            product = Product.objects.get(_id=product_id)
        except Product.DoesNotExist:
            raise ValidationError("존재하지 않는 상품입니다.")
        
        # 평점 유효성 검증
        if not (1 <= rating <= 5):
            raise ValidationError("평점은 1-5 사이의 값이어야 합니다.")
        
        # 데이터베이스 작업 처리 (리뷰 저장과 상품 정보 업데이트를 하나의 트랜잭션으로 묶음)
        with transaction.atomic():
            # 리뷰 등록
            review = Review.objects.create(
                product=product,
                user=user,
                name=user.username,
                rating=rating,
                comment=comment
            )
            
            # 상품 전체 평점과 리뷰 개수 자동 업데이트
            ReviewService._update_product_rating(product)
            
            return review
        

    @staticmethod
    def _update_product_rating(product):
        """
        상품의 평균 평점과 총 리뷰 개수를 다시 계산해서 업데이트
        """
        reviews = product.review_set.all() # 이 상품에 달린 모든 리뷰 조회
        product.numReviews = reviews.count() # 총 리뷰 개수 업데이트
        product.rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0 # 평균 평점 계산 및 업데이트
        product.save() # 변경된 상품 정보를 데이터베이스에 저장