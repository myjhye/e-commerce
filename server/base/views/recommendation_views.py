from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.services.user_profile_service import UserProfileService
from base.services.candidate_filter_service import CandidateFilterService
from base.services.llm_service import LLMRecommendationService

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_recommendations(request):
    """사용자 맞춤 상품 추천 API"""
    try:
        # 1. 사용자 프로필 생성
        profile_service = UserProfileService(request.user)
        user_profile = profile_service.generate_profile()
        
        # 2. 후보 상품 필터링
        filter_service = CandidateFilterService(request.user, user_profile)
        candidate_products = filter_service.get_candidate_products(limit=20)
        
        if not candidate_products:
            return Response({
                'message': '추천할 상품이 없습니다. 더 많은 상품을 조회해보세요!',
                'recommendations': []
            })
        
        # 3. LLM으로 추천 이유 생성
        llm_service = LLMRecommendationService()
        recommendations = llm_service.generate_recommendations_with_reasons(
            user_profile, candidate_products, num_recommendations=5
        )
        
        return Response({
            'message': '추천 상품을 성공적으로 생성했습니다.',
            'user_profile': user_profile,
            'recommendations': [
                {
                    'product': rec['product_data'],
                    'reason': rec['reason'],
                    'score': rec['score']
                }
                for rec in recommendations
            ]
        })
        
    except Exception as e:
        return Response({
            'error': f'추천 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """사용자 프로필 조회 API (디버깅용)"""
    try:
        profile_service = UserProfileService(request.user)
        user_profile = profile_service.generate_profile()
        
        return Response(user_profile)
        
    except Exception as e:
        return Response({
            'error': f'프로필 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)