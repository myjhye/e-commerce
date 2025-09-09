from openai import OpenAI
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from django.conf import settings
import base64
import os
import httpx
from django.core.files.storage import default_storage

from base.services.review_analysis_service import get_review_analysis_service
from base.models import Product
import torch

# LangGraph 서비스 import (안전하게)
try:
    from base.services.langgraph_service import (
        is_langgraph_available, 
        get_langgraph_generator
    )
    print("✅ LangGraph 서비스 로드 성공")
except ImportError as e:
    print(f"⚠️ LangGraph 서비스 로드 실패: {e}")
    def is_langgraph_available():
        return False
    def get_langgraph_generator(api_key):
        return None

# 허용 카테고리
ALLOWED_CATEGORIES = [
    "패션", "신발", "가방", "액세서리", "뷰티", "명품", "전자제품", "생활용품",
    "식품", "가구", "키즈", "스포츠용품", "취미 컬렉션", "자동차용품", "반려동물용품"
]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generateProductInfo(request):
    """
    ⭐️ [수정됨] 기본 상품 정보 생성 API (파일 직접 수신)
    - 이제 image_url 대신 image 파일을 직접 받습니다.
    """
    # --- 1. 데이터 수신 방식 변경 ---
    product_name = request.data.get("name", "").strip()
    # image_url 대신 request.FILES에서 'image' 파일을 가져옵니다.
    image_file = request.FILES.get("image")

    if not product_name:
        return Response({"error": "상품명이 필요합니다."}, status=400)
    # image_file 객체가 있는지 확인합니다.
    if not image_file:
        return Response({"error": "상품 이미지 파일이 필요합니다."}, status=400)
    
    # --- 2. Base64 인코딩 방식 변경 ---
    # 파일 경로를 찾는 대신, 메모리에 있는 파일 객체(image_file)를 바로 읽습니다.
    try:
        image_base64 = base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        return Response({"error": f"이미지 파일을 처리하는 중 오류 발생: {e}"}, status=500)

    # --- 3. GPT 프롬프트 및 호출 (이 부분은 동일) ---
    prompt = f"""
        당신은 전자상거래 상품 정보 분석 전문가입니다.
        상품명: "{product_name}"
        아래 규칙을 지켜주세요:
        1. 브랜드 추출: 실제 존재하는 브랜드명을 영문으로 표기 (없으면 "Unknown")
        2. 카테고리 선택: 반드시 {", ".join(ALLOWED_CATEGORIES)} 중 하나만 선택
        3. 상품 설명: 100자 이상, 매력적인 마케팅 문구
        응답 형식 (JSON):
        {{
            "brand": "브랜드명",
            "category": "카테고리명",
            "description": "상품 설명"
        }}
        """
    try:
        http_client = httpx.Client()
        api_key = settings.OPENAI_API_KEY
        client = OpenAI(api_key=api_key, http_client=http_client)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 상품명과 이미지를 기반으로 브랜드/카테고리/설명을 생성하는 전문가야."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/webp;base64,{image_base64}"}}
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.3
        )

        raw_text = response.choices[0].message.content.strip()
        print("🔥 GPT 응답:", raw_text)

        if raw_text.startswith("```"):
            raw_text = raw_text.strip("`").replace("json", "", 1).strip()

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError:
            return JsonResponse({"error": "AI 응답 JSON 파싱 실패", "raw_response": raw_text}, status=500)

        if data.get("category") not in ALLOWED_CATEGORIES:
            data["category"] = "생활용품"

        return JsonResponse(data, safe=False)

    except Exception as e:
        import traceback
        print("🔥 GPT 호출 중 에러 발생!")
        print(traceback.format_exc())
        return JsonResponse({"error": "AI 생성 실패", "detail": str(e)}, status=500)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generateProductInfoWithLangGraph(request):
    """LangGraph 기반 상품 정보 생성 API"""
    
    # LangGraph 사용 가능 여부 확인
    if not is_langgraph_available():
        return Response({
            "error": "LangGraph가 설치되지 않았습니다.",
            "message": "기본 generateProductInfo API를 사용해주세요.",
            "fallback_endpoint": "/api/ai/generate-product-info/"
        }, status=501)
    
    product_name = request.data.get("name", "").strip()
    image_url = request.data.get("image_url", "").strip()

    if not product_name:
        return Response({"error": "상품명이 필요합니다."}, status=400)
    if not image_url:
        return Response({"error": "상품 이미지 URL이 필요합니다."}, status=400)
    
    # 이미지 경로 변환
    image_path = os.path.join(settings.MEDIA_ROOT, image_url.replace("/media/", ""))
    
    if not os.path.exists(image_path):
        return Response({"error": "이미지를 찾을 수 없습니다."}, status=404)
    
    try:
        # LangGraph 기반 처리기 초기화
        generator = get_langgraph_generator(settings.OPENAI_API_KEY)
        
        if generator is None:
            return Response({"error": "LangGraph 생성기 초기화 실패"}, status=500)
        
        # 상품 정보 생성
        result = generator.generate_product_info(product_name, image_path)
        
        if "error" in result:
            return Response(result, status=500)
        
        # 기본 형식으로 응답 (기존 API와 호환)
        response_data = {
            "brand": result["brand"],
            "category": result["category"],
            "description": result["description"]
        }
        
        # 디버그 정보 (선택적)
        if request.GET.get("debug") == "true":
            response_data["debug_info"] = {
                "confidence_scores": result["confidence_scores"],
                "processing_steps": result["processing_steps"],
                "errors": result["errors"]
            }
        
        return Response(response_data)
        
    except Exception as e:
        import traceback
        print("🔥 LangGraph 처리 중 에러 발생!")
        print(traceback.format_exc())
        return Response({"error": "AI 생성 실패", "detail": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkLangGraphStatus(request):
    """LangGraph 상태 확인 API"""
    return Response({
        "langgraph_available": is_langgraph_available(),
        "message": "LangGraph가 사용 가능합니다." if is_langgraph_available() else "LangGraph가 사용 불가능합니다."
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getProductReviewAnalysis(request, pk):
    """특정 상품 리뷰 AI 분석 (Hugging Face 버전)"""
    
    try:
        # 상품 조회
        product = Product.objects.get(_id=pk)
        
        # 리뷰 데이터 가져오기
        reviews = product.review_set.all().values('comment', 'rating')
        
        if not reviews:
            return Response({
                'detail': '분석할 리뷰가 없습니다.',
                'product_name': product.name,
                'review_count': 0
            }, status=200)
        
        # 리뷰 데이터 준비
        reviews_data = list(reviews)
        
        # AI 분석 실행
        analysis_service = get_review_analysis_service()
        result = analysis_service.analyze_reviews(reviews_data)
        
        # 응답 데이터 구성
        response_data = {
            'product_name': product.name,
            'product_id': pk,
            'sentiment_analysis': result['sentiment_analysis'],  # 긍정/부정 %
            'keywords': result['keywords'],                      # 자주 언급 단어들
            'summary': result['summary'],                        # 3줄 요약
            'total_reviews': result['total_reviews']
        }
        
        return Response(response_data)
        
    except Product.DoesNotExist:
        return Response({
            'detail': '존재하지 않는 상품입니다.'
        }, status=404)
        
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=400)
        
    except Exception as e:
        import traceback
        print("🔥 리뷰 분석 중 에러 발생!")
        print(traceback.format_exc())
        
        return Response({
            'error': '리뷰 분석 실패',
            'detail': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getHuggingFaceStatus(request):
    """Hugging Face 모델 상태 확인"""
    
    try:
        analysis_service = get_review_analysis_service()
        
        model_loaded = analysis_service.sentiment_model is not None
        device = analysis_service.device
        
        return Response({
            'status': 'active' if model_loaded else 'fallback',
            'model_loaded': model_loaded,
            'device': device,
            'gpu_available': torch.cuda.is_available() if 'torch' in globals() else False,
            'message': 'Hugging Face 모델이 정상 작동 중입니다.' if model_loaded 
                      else 'Hugging Face 모델 로딩 실패, 키워드 기반 분석을 사용합니다.'
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=500)