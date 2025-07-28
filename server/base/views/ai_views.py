from openai import OpenAI
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from django.conf import settings
import base64
import os

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
    """기존 상품 정보 생성 API (OpenAI 직접 호출)"""
    product_name = request.data.get("name", "").strip()
    image_url = request.data.get("image_url", "").strip()

    if not product_name:
        return Response({"error": "상품명이 필요합니다."}, status=400)
    if not image_url:
        return Response({"error": "상품 이미지 URL이 필요합니다."}, status=400)
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # 1. 실제 서버 파일 경로로 변환
    image_path = os.path.join(settings.MEDIA_ROOT, image_url.replace("/media/", ""))

    if not os.path.exists(image_path):
        return Response({"error": "이미지를 찾을 수 없습니다."}, status=404)

    # 2. Base64 인코딩
    with open(image_path, "rb") as img_file:
        image_base64 = base64.b64encode(img_file.read()).decode("utf-8")

    # 3. GPT 프롬프트
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
        response = client.chat.completions.create(
            model="gpt-4o",
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
            raw_text = raw_text.strip("`")
            raw_text = raw_text.replace("json", "")
            raw_text = raw_text.strip()

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError:
            return JsonResponse({"error": "AI 응답 JSON 파싱 실패", "raw_response": raw_text}, status=500)

        # 카테고리 안전망
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