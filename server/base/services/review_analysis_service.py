from transformers import AutoTokenizer, AutoModelForSequenceClassification
from collections import Counter
import torch
import re
import logging
from typing import List, Dict, Any
from django.conf import settings

# 로깅 설정
logging.getLogger("transformers").setLevel(logging.WARNING)

class HuggingFaceReviewAnalysisService:
    """Hugging Face 기반 리뷰 AI 분석 서비스"""
    
    def __init__(self):
        self.sentiment_model = None
        self.sentiment_tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # 모델 초기화
        self._initialize_models()
    
    def _initialize_models(self):
        """Hugging Face 모델들 초기화"""
        try:
            print("🤗 Hugging Face 모델 로딩 중...")
            
            # 한국어 감정분석 모델
            model_name = "alsgyu/sentiment-analysis-fine-tuned-model"
            
            self.sentiment_tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.sentiment_model = AutoModelForSequenceClassification.from_pretrained(model_name)
            
            if self.device == "cuda":
                self.sentiment_model = self.sentiment_model.to(self.device)
                print(f"✅ GPU 모드로 모델 로딩 완료")
            else:
                print("✅ CPU 모드로 모델 로딩 완료")
                
        except Exception as e:
            print(f"❌ 모델 로딩 실패: {e}")
            # 폴백: 키워드 기반 분석만 사용
            self.sentiment_model = None
            self.sentiment_tokenizer = None

    def analyze_reviews(self, reviews_data: List[Dict]) -> Dict[str, Any]:
        """
        리뷰 분석 (3가지 기능)
        reviews_data: [{'comment': str, 'rating': int}, ...]
        """
        if not reviews_data:
            raise ValueError("분석할 리뷰가 없습니다.")
        
        comments = [review['comment'] for review in reviews_data]
        
        # 1. Hugging Face 감정 분석
        sentiment_analysis = self._analyze_sentiment_with_hf(comments)
        
        # 2. 키워드 추출
        keywords = self._extract_keywords(comments)
        
        # 3. 간단한 요약
        summary = self._generate_simple_summary(comments, sentiment_analysis)
        
        return {
            'sentiment_analysis': sentiment_analysis,
            'keywords': keywords,
            'summary': summary,
            'total_reviews': len(reviews_data)
        }

    def _analyze_sentiment_with_hf(self, comments: List[str]) -> Dict[str, float]:
        """Hugging Face 모델을 사용한 감정 분석"""
        
        if not self.sentiment_model:
            print("⚠️ 모델이 로드되지 않아 키워드 기반 분석 사용")
            return self._fallback_sentiment_analysis(comments)
        
        try:
            print(f"🔍 {len(comments)}개 리뷰 감정 분석 중...")
            
            # 배치 처리 (메모리 절약)
            batch_size = 8
            all_predictions = []
            
            for i in range(0, len(comments), batch_size):
                batch_comments = comments[i:i + batch_size]
                
                # 토크나이징
                inputs = self.sentiment_tokenizer(
                    batch_comments,
                    return_tensors="pt",
                    truncation=True,
                    padding=True,
                    max_length=512
                )
                
                if self.device == "cuda":
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                # 예측
                with torch.no_grad():
                    outputs = self.sentiment_model(**inputs)
                    predictions = torch.argmax(outputs.logits, dim=-1)
                    all_predictions.extend(predictions.cpu().tolist())
            
            # 감정 분류 카운트
            label_counts = Counter(all_predictions)
            total = len(all_predictions)
            
            # 레이블 매핑 (0: 부정, 1: 중립, 2: 긍정)
            negative = label_counts.get(0, 0)
            neutral = label_counts.get(1, 0)
            positive = label_counts.get(2, 0)
            
            return {
                'positive': round(positive / total * 100, 1),
                'negative': round(negative / total * 100, 1),
                'neutral': round(neutral / total * 100, 1)
            }
            
        except Exception as e:
            print(f"❌ Hugging Face 감정 분석 실패: {e}")
            return self._fallback_sentiment_analysis(comments)

    def _fallback_sentiment_analysis(self, comments: List[str]) -> Dict[str, float]:
        """키워드 기반 폴백 감정 분석"""
        positive_keywords = ['좋아요', '만족', '추천', '훌륭', '최고', '괜찮', '완벽']
        negative_keywords = ['별로', '실망', '나빠요', '최악', '불만', '문제', '후회']
        
        positive_count = 0
        negative_count = 0
        
        for comment in comments:
            comment_lower = comment.lower()
            if any(keyword in comment_lower for keyword in positive_keywords):
                positive_count += 1
            elif any(keyword in comment_lower for keyword in negative_keywords):
                negative_count += 1
        
        total = len(comments)
        neutral_count = total - positive_count - negative_count
        
        return {
            'positive': round(positive_count / total * 100, 1),
            'negative': round(negative_count / total * 100, 1),
            'neutral': round(neutral_count / total * 100, 1)
        }

    def _extract_keywords(self, comments: List[str]) -> List[tuple]:
        """키워드 추출"""
        all_text = ' '.join(comments).lower()
        
        # 불용어
        stop_words = {
            '이', '가', '을', '를', '에', '와', '과', '도', '만', '에서', '으로', '로', '의', '는', '은',
            '정말', '너무', '진짜', '완전', '아주', '매우', '조금', '좀', '그냥',
            '그리고', '하지만', '그런데', '그래서', '또한',
            '것', '수', '등', '및', '또', '한', '다', '때', '곳'
        }
        
        # 한글 단어 추출 (2-6자)
        words = re.findall(r'[가-힣]{2,6}', all_text)
        filtered_words = [word for word in words if word not in stop_words]
        
        return Counter(filtered_words).most_common(10)

    def _generate_simple_summary(self, comments: List[str], sentiment: Dict[str, float]) -> str:
        """간단한 요약 생성"""
        total_reviews = len(comments)
        keywords = self._extract_keywords(comments)
        top_keywords = [word for word, count in keywords[:3]]
        
        # 3줄 요약
        line1 = f"총 {total_reviews}개 리뷰에서 {', '.join(top_keywords)} 등이 주요 관심사로 나타났습니다." if top_keywords else f"총 {total_reviews}개의 고객 리뷰를 분석했습니다."
        
        if sentiment['positive'] > 60:
            line2 = "대부분의 고객들이 긍정적인 평가를 하고 있습니다."
        elif sentiment['negative'] > 30:
            line2 = "일부 고객들이 개선이 필요한 부분을 지적하고 있습니다."
        else:
            line2 = "고객들의 의견이 다양하게 나타나고 있습니다."
        
        if sentiment['positive'] > sentiment['negative']:
            line3 = "전반적으로 만족도가 높은 상품으로 평가됩니다."
        else:
            line3 = "구매 전 상세한 리뷰 검토를 권장합니다."
        
        return f"{line1}\n{line2}\n{line3}"


# 싱글톤 인스턴스
_analysis_service_instance = None

def get_review_analysis_service() -> HuggingFaceReviewAnalysisService:
    """리뷰 분석 서비스 인스턴스 생성"""
    global _analysis_service_instance
    
    if _analysis_service_instance is None:
        _analysis_service_instance = HuggingFaceReviewAnalysisService()
    
    return _analysis_service_instance