import os
import json
import base64
from typing import Dict, Any, List, Optional

# LangGraph 관련 import를 try-except로 감싸서 안전하게 처리
try:
    from langgraph.graph import StateGraph, END
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    from pydantic import BaseModel, Field
    LANGGRAPH_AVAILABLE = True
    print("✅ LangGraph 모듈 로드 성공")
except ImportError as e:
    print(f"❌ LangGraph 모듈 로드 실패: {e}")
    LANGGRAPH_AVAILABLE = False
    
    # Fallback 클래스들
    class BaseModel:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
    
    def Field(**kwargs):
        return None

# 허용 카테고리
ALLOWED_CATEGORIES = [
    "패션", "신발", "가방", "액세서리", "뷰티", "명품", "전자제품", "생활용품",
    "식품", "가구", "키즈", "스포츠용품", "취미 컬렉션", "자동차용품", "반려동물용품"
]

# 상태 모델 정의
class ProductState(BaseModel):
    # 입력 데이터
    product_name: str = ""
    image_path: str = ""
    image_base64: Optional[str] = None
    
    # 분석 결과
    image_analysis: Optional[Dict[str, Any]] = None
    brand_info: Optional[Dict[str, Any]] = None  # str -> Any로 변경
    category_info: Optional[Dict[str, Any]] = None  # str -> Any로 변경
    description: Optional[str] = None
    
    # 최종 결과
    final_result: Optional[Dict[str, Any]] = None
    
    # 메타데이터
    confidence_scores: Dict[str, float] = None
    processing_steps: List[str] = None
    errors: List[str] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.confidence_scores is None:
            self.confidence_scores = {}
        if self.processing_steps is None:
            self.processing_steps = []
        if self.errors is None:
            self.errors = []
    
    class Config:
        # Pydantic 설정: 추가 필드 허용
        extra = "allow"
        # 타입 강제 변환 허용
        arbitrary_types_allowed = True

class LangGraphProductGenerator:
    def __init__(self, openai_api_key: str):
        if not LANGGRAPH_AVAILABLE:
            raise ImportError("LangGraph가 설치되지 않았습니다.")
        
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            model="gpt-4o",
            temperature=0.3
        )
        self.workflow = self._build_workflow()
    
    def _build_workflow(self):
        """LangGraph 워크플로우 구성"""
        try:
            workflow = StateGraph(ProductState)
            
            # 노드 추가
            workflow.add_node("preprocess", self._preprocess_node)
            workflow.add_node("analyze_image", self._analyze_image_node)
            workflow.add_node("extract_brand", self._extract_brand_node)
            workflow.add_node("classify_category", self._classify_category_node)
            workflow.add_node("generate_description", self._generate_description_node)
            workflow.add_node("validate_and_finalize", self._validate_and_finalize_node)
            
            # 엣지 연결
            workflow.set_entry_point("preprocess")
            workflow.add_edge("preprocess", "analyze_image")
            workflow.add_edge("analyze_image", "extract_brand")
            workflow.add_edge("extract_brand", "classify_category")
            workflow.add_edge("classify_category", "generate_description")
            workflow.add_edge("generate_description", "validate_and_finalize")
            workflow.add_edge("validate_and_finalize", END)
            
            return workflow.compile()
        except Exception as e:
            print(f"워크플로우 구성 실패: {e}")
            raise e
    
    def _preprocess_node(self, state: ProductState) -> ProductState:
        """전처리: 이미지 로드 및 Base64 인코딩"""
        try:
            state.processing_steps.append("전처리 시작")
            
            if not os.path.exists(state.image_path):
                state.errors.append("이미지 파일을 찾을 수 없습니다")
                return state
            
            with open(state.image_path, "rb") as img_file:
                state.image_base64 = base64.b64encode(img_file.read()).decode("utf-8")
            
            state.processing_steps.append("이미지 인코딩 완료")
            
        except Exception as e:
            state.errors.append(f"전처리 오류: {str(e)}")
        
        return state
    
    def _analyze_image_node(self, state: ProductState) -> ProductState:
        """이미지 분석"""
        try:
            state.processing_steps.append("이미지 분석 시작")
            
            if not state.image_base64:
                state.errors.append("이미지 데이터가 없습니다")
                return state
            
            prompt = """
                이미지를 자세히 분석하여 다음 정보를 추출해주세요:
                1. 상품의 외관적 특징
                2. 색상, 재질, 형태
                3. 브랜드 로고나 텍스트 유무
                4. 상품 카테고리 힌트
                
                JSON 형식으로 응답해주세요:
                {
                    "visual_features": "외관 특징",
                    "colors": ["색상1", "색상2"],
                    "materials": ["재질1", "재질2"],
                    "brand_hints": "브랜드 관련 단서",
                    "category_hints": "카테고리 힌트",
                    "confidence": 0.8
                }
            """
            
            messages = [
                SystemMessage(content="당신은 상품 이미지 분석 전문가입니다."),
                HumanMessage(content=[
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/webp;base64,{state.image_base64}"}}
                ])
            ]
            
            response = self.llm.invoke(messages)
            analysis_result = self._parse_json_response(response.content)
            
            state.image_analysis = analysis_result
            state.confidence_scores["image_analysis"] = analysis_result.get("confidence", 0.5)
            state.processing_steps.append("이미지 분석 완료")
            
        except Exception as e:
            state.errors.append(f"이미지 분석 오류: {str(e)}")
        
        return state
    
    def _extract_brand_node(self, state: ProductState) -> ProductState:
        """브랜드 추출"""
        try:
            state.processing_steps.append("브랜드 추출 시작")
            
            context = {
                "product_name": state.product_name,
                "image_analysis": state.image_analysis or {}
            }
            
            prompt = f"""
                상품명과 이미지 분석 결과를 바탕으로 브랜드를 추출해주세요.
                
                상품명: {context['product_name']}
                이미지 분석: {json.dumps(context['image_analysis'], ensure_ascii=False)}
                
                실제 존재하는 브랜드명만 추출하고, 확실하지 않으면 "Unknown"으로 표기하세요.
                
                JSON 형식:
                {{
                    "brand": "브랜드명",
                    "confidence": 0.8,
                    "reasoning": "추출 근거"
                }}
            """
            
            response = self.llm.invoke([
                SystemMessage(content="당신은 브랜드 식별 전문가입니다."),
                HumanMessage(content=prompt)
            ])
            
            brand_result = self._parse_json_response(response.content)
            state.brand_info = brand_result
            state.confidence_scores["brand"] = brand_result.get("confidence", 0.5)
            state.processing_steps.append("브랜드 추출 완료")
            
        except Exception as e:
            state.errors.append(f"브랜드 추출 오류: {str(e)}")
        
        return state
    
    def _classify_category_node(self, state: ProductState) -> ProductState:
        """카테고리 분류"""
        try:
            state.processing_steps.append("카테고리 분류 시작")
            
            context = {
                "product_name": state.product_name,
                "image_analysis": state.image_analysis or {},
                "brand_info": state.brand_info or {}
            }
            
            prompt = f"""
                다음 정보를 바탕으로 상품 카테고리를 분류해주세요.
                
                상품명: {context['product_name']}
                이미지 분석: {json.dumps(context['image_analysis'], ensure_ascii=False)}
                브랜드 정보: {json.dumps(context['brand_info'], ensure_ascii=False)}
                
                허용된 카테고리: {', '.join(ALLOWED_CATEGORIES)}
                
                위 카테고리 중 반드시 하나만 선택해주세요.
                
                JSON 형식:
                {{
                    "category": "선택된 카테고리",
                    "confidence": 0.9,
                    "reasoning": "분류 근거"
                }}
            """
            
            response = self.llm.invoke([
                SystemMessage(content="당신은 상품 카테고리 분류 전문가입니다."),
                HumanMessage(content=prompt)
            ])
            
            category_result = self._parse_json_response(response.content)
            
            # 카테고리 검증
            selected_category = category_result.get("category", "생활용품")
            if selected_category not in ALLOWED_CATEGORIES:
                selected_category = "생활용품"
                category_result["category"] = selected_category
                category_result["confidence"] = 0.3
            
            state.category_info = category_result
            state.confidence_scores["category"] = category_result.get("confidence", 0.5)
            state.processing_steps.append("카테고리 분류 완료")
            
        except Exception as e:
            state.errors.append(f"카테고리 분류 오류: {str(e)}")
        
        return state
    
    def _generate_description_node(self, state: ProductState) -> ProductState:
        """상품 설명 생성"""
        try:
            state.processing_steps.append("상품 설명 생성 시작")
            
            context = {
                "product_name": state.product_name,
                "image_analysis": state.image_analysis or {},
                "brand_info": state.brand_info or {},
                "category_info": state.category_info or {}
            }
            
            prompt = f"""
                다음 정보를 종합하여 매력적인 상품 설명을 작성해주세요.
                
                상품명: {context['product_name']}
                이미지 분석: {json.dumps(context['image_analysis'], ensure_ascii=False)}
                브랜드: {context['brand_info'].get('brand', 'Unknown')}
                카테고리: {context['category_info'].get('category', '생활용품')}
                
                요구사항:
                - 100자 이상 작성
                - 마케팅적으로 매력적인 문구
                - 상품의 특징과 장점 강조
                - 구매 욕구를 자극하는 표현
                
                JSON 형식:
                {{
                    "description": "상품 설명",
                    "key_features": ["특징1", "특징2", "특징3"],
                    "confidence": 0.8
                }}
            """
            
            response = self.llm.invoke([
                SystemMessage(content="당신은 상품 마케팅 카피라이터입니다."),
                HumanMessage(content=prompt)
            ])
            
            description_result = self._parse_json_response(response.content)
            state.description = description_result.get("description", "")
            state.confidence_scores["description"] = description_result.get("confidence", 0.5)
            state.processing_steps.append("상품 설명 생성 완료")
            
        except Exception as e:
            state.errors.append(f"상품 설명 생성 오류: {str(e)}")
        
        return state
    
    def _validate_and_finalize_node(self, state: ProductState) -> ProductState:
        """검증 및 최종 결과 생성"""
        try:
            state.processing_steps.append("결과 검증 및 최종화")
            
            # 필수 필드 검증
            brand_info = state.brand_info or {}
            category_info = state.category_info or {}
            
            brand = brand_info.get("brand", "Unknown") if isinstance(brand_info, dict) else "Unknown"
            category = category_info.get("category", "생활용품") if isinstance(category_info, dict) else "생활용품"
            description = state.description or "상품 설명을 생성할 수 없습니다."
            
            # 최종 결과 구성
            state.final_result = {
                "brand": brand,
                "category": category,
                "description": description,
                "confidence_scores": state.confidence_scores,
                "processing_steps": state.processing_steps,
                "errors": state.errors if state.errors else None
            }
            
            state.processing_steps.append("처리 완료")
            
        except Exception as e:
            state.errors.append(f"최종화 오류: {str(e)}")
        
        return state
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """JSON 응답 파싱"""
        try:
            # 코드 블록 제거
            if response.startswith("```"):
                response = response.strip("`")
                response = response.replace("json", "").strip()
            
            return json.loads(response)
        except json.JSONDecodeError:
            return {"error": "JSON 파싱 실패", "raw_response": response}
    
    def generate_product_info(self, product_name: str, image_path: str) -> Dict[str, Any]:
        """상품 정보 생성 실행"""
        try:
            initial_state = ProductState(
                product_name=product_name,
                image_path=image_path
            )
            
            print(f"초기 상태: {initial_state.product_name}, {initial_state.image_path}")
            
            # 워크플로우 실행
            final_state = self.workflow.invoke(initial_state)
            
            print(f"final_state 타입: {type(final_state)}")
            print(f"final_state 내용: {final_state}")
            
            # final_state가 딕셔너리인 경우 처리
            if isinstance(final_state, dict):
                brand_info = final_state.get('brand_info', {})
                category_info = final_state.get('category_info', {})
                
                brand = brand_info.get('brand', 'Unknown') if isinstance(brand_info, dict) else 'Unknown'
                category = category_info.get('category', '생활용품') if isinstance(category_info, dict) else '생활용품'
                description = final_state.get('description', '상품 설명을 생성할 수 없습니다.')
                
                return {
                    "brand": brand,
                    "category": category,
                    "description": description,
                    "confidence_scores": final_state.get('confidence_scores', {}),
                    "processing_steps": final_state.get('processing_steps', []),
                    "errors": final_state.get('errors', None)
                }
            
            # final_state가 객체인 경우 처리
            else:
                if hasattr(final_state, 'final_result') and final_state.final_result:
                    return final_state.final_result
                else:
                    # 수동으로 결과 구성
                    brand_info = getattr(final_state, 'brand_info', {})
                    category_info = getattr(final_state, 'category_info', {})
                    
                    brand = brand_info.get('brand', 'Unknown') if isinstance(brand_info, dict) else 'Unknown'
                    category = category_info.get('category', '생활용품') if isinstance(category_info, dict) else '생활용품'
                    description = getattr(final_state, 'description', '상품 설명을 생성할 수 없습니다.')
                    
                    return {
                        "brand": brand,
                        "category": category,
                        "description": description,
                        "confidence_scores": getattr(final_state, 'confidence_scores', {}),
                        "processing_steps": getattr(final_state, 'processing_steps', []),
                        "errors": getattr(final_state, 'errors', None)
                    }
                    
        except Exception as e:
            print(f"워크플로우 실행 실패: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": "처리 실패",
                "detail": str(e),
                "errors": [str(e)]
            }

# 유틸리티 함수
def is_langgraph_available() -> bool:
    """LangGraph 사용 가능 여부 확인"""
    return LANGGRAPH_AVAILABLE

def get_langgraph_generator(openai_api_key: str):
    """LangGraph 생성기 인스턴스 반환"""
    if not LANGGRAPH_AVAILABLE:
        return None
    return LangGraphProductGenerator(openai_api_key)