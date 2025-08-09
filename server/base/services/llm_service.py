import openai
from django.conf import settings

class LLMRecommendationService:
    def __init__(self):
        openai.api_key = getattr(settings, 'OPENAI_API_KEY', '')
    
    def generate_recommendations_with_reasons(self, user_profile, candidate_products, num_recommendations=5):
        """LLM을 사용해 추천 상품과 이유 생성"""
        
        # 상위 후보 상품들 선택
        top_candidates = candidate_products[:num_recommendations * 2]  # 여유분 확보
        
        # LLM용 프롬프트 생성
        prompt = self._create_recommendation_prompt(user_profile, top_candidates)
        
        try:
            # OpenAI API 호출
            response = openai.ChatCompletion.create(
                model="gpt-4o",
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
                max_tokens=1500,
                temperature=0.7
            )
            
            # 응답 파싱
            recommendations = self._parse_llm_response(response.choices[0].message.content)
            
            # 추천 결과와 상품 정보 매칭
            final_recommendations = self._match_recommendations_with_products(
                recommendations, top_candidates
            )
            
            return final_recommendations[:num_recommendations]
            
        except Exception as e:
            print(f"LLM 추천 생성 실패: {e}")
            # LLM 실패 시 기본 추천 반환
            return self._create_fallback_recommendations(candidate_products[:num_recommendations])
    
    def _create_recommendation_prompt(self, user_profile, candidate_products):
        """LLM용 프롬프트 생성"""
        
        # 사용자 프로필 요약
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
        
        # 후보 상품 목록
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
    
    def _parse_llm_response(self, response_text):
        """LLM 응답 파싱"""
        recommendations = []
        lines = response_text.strip().split('\n')
        
        current_rec = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 상품 번호와 이름 파싱
            if line.startswith('[') and ':' in line and ']' in line:
                if current_rec:  # 이전 추천 저장
                    recommendations.append(current_rec)
                
                # 새 추천 시작
                bracket_content = line[1:line.find(']')]
                if ':' in bracket_content:
                    product_num, product_name = bracket_content.split(':', 1)
                    current_rec = {
                        'product_number': int(product_num.strip()),
                        'product_name': product_name.strip(),
                        'reason': '',
                        'score': 5
                    }
            
            # 추천이유 파싱
            elif line.startswith('추천이유:'):
                if current_rec:
                    current_rec['reason'] = line.replace('추천이유:', '').strip()
            
            # 추천점수 파싱
            elif line.startswith('추천점수:'):
                if current_rec:
                    try:
                        score_text = line.replace('추천점수:', '').strip()
                        current_rec['score'] = int(score_text.split()[0])
                    except:
                        current_rec['score'] = 5
        
        # 마지막 추천 저장
        if current_rec:
            recommendations.append(current_rec)
        
        return recommendations
    
    def _match_recommendations_with_products(self, recommendations, candidate_products):
        """추천 결과와 실제 상품 매칭"""
        final_recommendations = []
        
        for rec in recommendations:
            product_num = rec.get('product_number', 0) - 1  # 0-based 인덱스
            
            if 0 <= product_num < len(candidate_products):
                product = candidate_products[product_num]
                
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
                        'image': product.image.url if product.image else '',
                        'description': product.description
                    }
                })
        
        return final_recommendations
    
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
                    'image': product.image.url if product.image else '',
                    'description': product.description
                }
            })
        
        return recommendations