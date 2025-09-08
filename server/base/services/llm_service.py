from openai import OpenAI
from django.conf import settings
import os

class LLMRecommendationService:
    def __init__(self, request=None):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.request = request

    # OpenAI GPT를 활용해서 개인화된 추천 이유를 생성
    def generate_recommendations_with_reasons(self, user_profile, candidate_products, num_recommendations=5):
        """LLM을 사용해 추천 상품과 이유 생성"""
        
        # 1단계: 여유분 확보
        top_candidates = candidate_products[:num_recommendations * 2] # 5개 추천 → 10개 후보
        
        # 2단계: 프롬프트 생성 (사용자 데이터와 상품 정보를 GPT가 이해할 수 있는 형태로 변환)
        prompt = self._create_recommendation_prompt(user_profile, top_candidates)
        
        try:
            # 3단계: OpenAI API 호출
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "당신은 전문적인 상품 추천 시스템입니다. 사용자의 구매 패턴과 관심사를 분석하여 개인화된 상품을 추천하고, 각 추천에 대한 구체적이고 설득력 있는 이유를 제공해주세요."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.7
            )
            content = response.choices[0].message.content

            # 4단계: 응답 처리
            recommendations = self._parse_llm_response(content) # GPT 응답 파싱
            
            # 추천 결과와 상품 정보 매칭
            final_recommendations = self._match_recommendations_with_products(
                recommendations, top_candidates
            )
            
            return final_recommendations[:num_recommendations] # 최종 5개 선별
            
        except Exception as e:
            print(f"LLM 추천 생성 실패: {e}")
            # LLM 실패 시 기본 추천 반환
            return self._create_fallback_recommendations(candidate_products[:num_recommendations])
    


    # GPT가 이해할 수 있는 형태로 사용자 정보와 상품 정보를 정리해서, GPT에게 "무엇을, 어떻게, 왜" 추천해야 하는지 명확하게 알려주는 지시서
    def _create_recommendation_prompt(self, user_profile, candidate_products):
        """LLM용 프롬프트 생성"""
        
        # 1단계: 사용자 프로필 요약
        profile_summary = f"""
            사용자 프로필:
            - 이름: {user_profile.get('username', 'Unknown')}
            - 선호 카테고리: {', '.join([f"{cat}({pct}%)" for cat, pct in list(user_profile.get('category_preferences', {}).items())[:3]])}
            - 선호 브랜드: {', '.join(list(user_profile.get('brand_preferences', {}).keys())[:3])}
            - 평균 구매 가격대: {user_profile.get('price_range', {}).get('avg', 0):,.0f}원
            - 구매 주기: {user_profile.get('purchase_frequency', {}).get('frequency', 'unknown')}
            - 총 구매 횟수: {user_profile.get('total_purchases', 0)}회
            - 최근 관심 상품: {', '.join([item['product_name'] for item in user_profile.get('recent_interests', [])[:3]])}
        """

        """
        실제 결과 예시:
            사용자 프로필:
            - 이름: sim@example.com
            - 선호 카테고리: 신발(88.3%), 액세서리(11.7%), 의류(5.2%)
            - 선호 브랜드: Crocs, Nike, CASIO  
            - 평균 구매 가격대: 1,745원
            - 구매 주기: quarterly
            - 총 구매 횟수: 15회
            - 최근 관심 상품: 크록스 오프로드 클로그, 나이키 에어포스, 애플워치 밴드
        """
        
        # 2단계: 후보 상품 목록 생성
        products_list = ""
        for i, product in enumerate(candidate_products, 1):
            products_list += f"""
                {i}. {product.name}
                - 카테고리: {product.category}
                - 브랜드: {product.brand}
                - 가격: {product.price:,.0f}원
                - 평점: {product.rating}/5.0 ({product.numReviews}개 리뷰)
                - 설명: {product.description[:100]}...
            """

        """
        실제 결과 예시:
            1. 크록스 에코 마블드 클로그 문라이트 멀티
            - 카테고리: 신발
            - 브랜드: Crocs
            - 가격: 1,111원
            - 평점: 4.5/5.0 (25개 리뷰)
            - 설명: 편안하고 스타일리시한 크록스 클로그입니다. 다양한 환경에서 착용 가능하며...

            2. 나이키 에어포스 1 화이트
            - 카테고리: 신발
            - 브랜드: Nike
            - 가격: 2,222원
            - 평점: 4.8/5.0 (150개 리뷰)
            - 설명: 클래식한 농구화 스타일의 운동화입니다. 데일리 룩에 잘 어울리며...
        """
        
        # 3단계: 요청 사항과 형식 명시
        prompt = f"""
            {profile_summary}

            추천 후보 상품들:
            {products_list}

            위 사용자 프로필을 바탕으로, 후보 상품 중에서 5개를 선택하여 추천해주세요.
            각 추천에 대해 다음 형식으로 응답해주세요:

            [상품번호: 상품명]
            추천이유: (사용자의 구매 패턴, 관심사, 선호도를 근거로 한 구체적인 추천 이유를 2-3문장으로 작성)
            추천점수: (1-10점)

            예시:
            [3: 아이폰 15 Pro]
            추천이유: 전자제품을 60% 선호하시고 애플 브랜드를 자주 구매하시는 패턴을 보면, 최신 아이폰이 적합합니다. 평균 구매가격대인 50만원대에 맞고, 최근 스마트워치에 관심을 보이신 것으로 보아 애플 생태계 확장에 관심이 있으실 것 같습니다.
            추천점수: 9

            5개 추천 상품을 위 형식으로 작성해주세요.
        """
        
        return prompt
    


    # GPT가 생성한 텍스트 응답을 프로그램이 사용할 수 있는 구조화된 데이터로 변환
    def _parse_llm_response(self, response_text):
        """LLM 응답 파싱"""
        recommendations = []

        # 1단계: 텍스트 전처리
        lines = response_text.strip().split('\n') # 앞뒤 공백 제거 후 라인별로 분할
        
        current_rec = {}
        
        # 2단계: 라인별 순회 및 패턴 매칭
        for line in lines:
            line = line.strip()
            if not line:
                continue # 빈 라인 건너뛰기
                
            # 3단계: 상품 정보 파싱 (가장 중요!)
            if line.startswith('[') and ':' in line and ']' in line:
                if current_rec:  # 이전 추천이 있으면 저장
                    recommendations.append(current_rec)
                
                # 새 추천 시작
                bracket_content = line[1:line.find(']')] # 대괄호 안 내용 추출
                if ':' in bracket_content:
                    product_num, product_name = bracket_content.split(':', 1)
                    current_rec = {
                        'product_number': int(product_num.strip()),
                        'product_name': product_name.strip(),
                        'reason': '',
                        'score': 5
                    }
            
            # 4단계: 추천이유 파싱
            elif line.startswith('추천이유:'):
                if current_rec:
                    current_rec['reason'] = line.replace('추천이유:', '').strip()
            
            # 5단계: 추천점수 파싱 (에러 처리 포함)
            elif line.startswith('추천점수:'):
                if current_rec:
                    try:
                        score_text = line.replace('추천점수:', '').strip()
                        current_rec['score'] = int(score_text.split()[0])
                    except:
                        current_rec['score'] = 5
        
        # 6단계: 마지막 추천 저장
        if current_rec:
            recommendations.append(current_rec)
        
        return recommendations
    


    # GPT가 선택한 상품 번호를 실제 상품 객체와 연결해서 완전한 추천 데이터 만들기
    def _match_recommendations_with_products(self, recommendations, candidate_products):
        """추천 결과와 실제 상품 매칭"""
        final_recommendations = []
        used_product_ids = set()  # 사용된 상품 ID 추적
        
        for rec in recommendations:

            # 1단계: 상품 번호 → 배열 인덱스 변환
            product_num = rec.get('product_number', 0) - 1  # 0-based 인덱스
            
            # 2단계: 인덱스 유효성 검사
            if 0 <= product_num < len(candidate_products):

                # 3단계: 실제 상품 객체 가져오기
                product = candidate_products[product_num]

                # 중복 상품 확인
                if product._id in used_product_ids:
                    continue

                used_product_ids.add(product._id)

                image_url = ''
                if self.request and product.image and hasattr(product.image, 'url'):
                    image_url = self.request.build_absolute_uri(product.image.url)
                
                # 4단계: 완전한 추천 객체 생성
                final_recommendations.append({
                    'product': product,
                    'reason': rec.get('reason', '이 상품을 추천드립니다.'),
                    'score': rec.get('score', 5),
                    'product_data': {
                        'id': product._id,
                        'name': product.name,
                        'category': product.category,
                        'brand': product.brand,
                        'price': product.price,
                        'rating': product.rating,
                        'num_reviews': product.numReviews,
                        'image': image_url, # 수정된 전체 URL 사용
                        'description': product.description
                    }
                })
        
        return final_recommendations
    

    # OpenAI API가 실패했을 때 서비스 중단 없이 기본 추천을 제공하는 백업 시스템
    def _create_fallback_recommendations(self, products):
        """LLM 실패 시 기본 추천 생성"""
        fallback_reasons = [
            "고객님의 구매 패턴을 분석한 결과 이 상품을 추천드립니다.",
            "비슷한 취향의 고객들이 많이 선택한 인기 상품입니다.",
            "고객님이 관심있어 하신 카테고리의 우수한 상품입니다.",
            "최근 리뷰 평점이 높고 많은 고객들이 만족한 상품입니다.",
            "고객님의 평소 가격대에 맞는 추천 상품입니다."
        ]
        
        recommendations = []
        for i, product in enumerate(products):

            image_url = ''
            if self.request and product.image and hasattr(product.image, 'url'):
                image_url = self.request.build_absolute_uri(product.image.url)

            recommendations.append({
                'product': product,
                'reason': fallback_reasons[i % len(fallback_reasons)],
                'score': 7,
                'product_data': {
                    'id': product._id,
                    'name': product.name,
                    'category': product.category,
                    'brand': product.brand,
                    'price': product.price,
                    'rating': product.rating,
                    'num_reviews': product.numReviews,
                    'image': image_url,
                    'description': product.description
                }
            })
        
        return recommendations