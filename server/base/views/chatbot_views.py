from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from base.services.chatbot_service import get_vector_db, check_docs_folder
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# 커스텀 프롬프트 템플릿
CUSTOM_PROMPT = PromptTemplate(
    template="""당신은 친절한 이커머스 고객 상담 챗봇입니다.
    
다음 문서 내용을 바탕으로 질문에 답변해주세요:
{context}

질문: {question}

답변 시 주의사항:
1. 문서에 있는 내용만을 바탕으로 정확하게 답변하세요
2. 문서에 없는 내용은 추측하지 마세요
3. 친절하고 이해하기 쉽게 설명하세요
4. 문서에 정보가 없다면 "죄송합니다. 해당 정보를 찾을 수 없습니다"라고 답변하세요

답변:""",
    input_variables=["context", "question"]
)

@api_view(["POST"])
def chatbot_query(request):
    """
    📌 상담 챗봇 API 엔드포인트
    - 사용자가 질문을 보내면 → 벡터DB 검색 → LLM 답변 → 결과 반환
    """
    try:
        question = request.data.get("question") # 요청에서 질문 추출
        
        if not question: # 질문이 없으면 400 에러 반환
            return Response(
                {"error": "질문을 입력해주세요"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"📝 받은 질문: {question}")
        
        # 1. 벡터DB 가져오기 (문서 검색용)
        vectordb = get_vector_db()
        
        # 2. Retriever 설정 (상위 3개 유사 문서 검색)
        retriever = vectordb.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}
        )
        
        # 3. LLM 설정
        llm = ChatOpenAI(
            model="gpt-4o-mini",  # 가벼운 모델 사용
            temperature=0.3,  # 낮게 설정 → 일관성 있는 답변
            api_key=settings.OPENAI_API_KEY
        )
        
        # 4. RetrievalQA 체인 생성 (retriever로 찾은 문서를 LLM에 넣어 답변 생성)
        qa = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",  # 검색된 문서를 한꺼번에 넣음
            retriever=retriever,
            return_source_documents=True,  # 참조한 문서도 반환
            chain_type_kwargs={
                "prompt": CUSTOM_PROMPT, # 위에서 정의한 프롬프트 적용
                "verbose": True  # 디버깅 로그 출력
            }
        )
        
        # 5. 실제 답변 생성
        result = qa({"query": question})
        
        # 6. 참조 문서 정보 정리 (어떤 문서를 근거로 답했는지)
        sources = []
        if "source_documents" in result:
            for doc in result["source_documents"]:
                sources.append({
                    "source": doc.metadata.get("source", "Unknown"),
                    "content_preview": doc.page_content[:200] + "..."
                })
        
        logger.info(f"✅ 답변 생성 완료")
        
        # 7. 최종 응답 반환
        return Response({
            "question": question,
            "answer": result.get("result", "답변을 생성할 수 없습니다"),
            "sources": sources
        })
        
    except Exception as e:
        logger.error(f"❌ 챗봇 에러: {e}")
        return Response(
            {"error": f"처리 중 오류가 발생했습니다: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
def chatbot_status(request):
    """
    📌 챗봇 상태 확인 API
    - 벡터DB 상태, 문서 개수 등 확인
    """
    try:
        from base.services.chatbot_service import DOCS_PATH, _is_initialized, _vectordb_instance
        
        # 1. docs 폴더 확인
        folder_exists, md_files = check_docs_folder()
        
        # 2. 벡터DB 상태 확인
        try:
            if _is_initialized and _vectordb_instance:
                collection_count = _vectordb_instance._collection.count()
                db_status = "정상 (메모리)"
            else:
                collection_count = 0
                db_status = "초기화 필요"
        except:
            collection_count = 0
            db_status = "오류"
        
        # 3. 결과 반환
        return Response({
            "status": "ok" if folder_exists and collection_count > 0 else "error",
            "docs_folder": {
                "exists": folder_exists,
                "path": str(DOCS_PATH),
                "md_files": [f.name for f in md_files] if folder_exists else []
            },
            "vector_db": {
                "status": db_status,
                "document_count": collection_count,
                "type": "memory-based"  # 메모리 기반임을 표시
            }
        })
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )