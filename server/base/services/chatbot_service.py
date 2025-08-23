# 챗봇이 참고할 문서 데이터베이스(Vector DB)를 만들고 관리하는 서비스 모듈
# - Markdown 문서를 읽어서 벡터화(임베딩)하고
# - 메모리 기반 Chroma DB에 저장하여
# - 챗봇 질의 시 유사 문서 검색에 활용한다.

import os
from pathlib import Path
from langchain.text_splitter import MarkdownHeaderTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from django.conf import settings
import logging

# 로깅 설정
logger = logging.getLogger(__name__)

# Django 프로젝트 루트 디렉토리 기준으로 경로 설정
BASE_DIR = Path(settings.BASE_DIR)
DOCS_PATH = BASE_DIR / "docs"

# 전역 벡터DB 인스턴스 (메모리에만 저장)
_vectordb_instance = None
_is_initialized = False

def check_docs_folder():
    """
    📌 docs 폴더와 파일 존재 여부 확인
    - 폴더가 없거나 md 파일이 없으면 False 반환
    - 정상인 경우 발견된 md 파일 리스트를 함께 반환
    """
    if not DOCS_PATH.exists():
        logger.error(f"❌ Docs 폴더가 없습니다: {DOCS_PATH}")
        return False, []
    
    md_files = list(DOCS_PATH.glob("*.md"))
    if not md_files:
        logger.error(f"❌ {DOCS_PATH}에 .md 파일이 없습니다")
        return False, []
    
    logger.info(f"✅ 발견된 MD 파일들: {[f.name for f in md_files]}")
    return True, md_files

def build_vector_db(force_rebuild=False):
    """
    📌 .md 파일들을 읽어서 메모리 기반 벡터DB를 생성하는 함수
    - Markdown 문서를 헤더 단위(#, ##, ###)로 쪼갬
    - 조각을 Document 객체로 변환하고 메타데이터(source, chunk_id, headers) 부여
    - OpenAI Embeddings으로 벡터화하여 메모리 기반 Chroma DB 생성
    """
    global _vectordb_instance, _is_initialized
    
    # 이미 초기화되었고 강제 재빌드가 아니면 기존 인스턴스 반환
    if _is_initialized and not force_rebuild:
        logger.info("✅ 기존 메모리 벡터DB 사용")
        return _vectordb_instance
    
    # docs 폴더와 md 파일 존재 여부 확인
    folder_exists, md_files = check_docs_folder()
    if not folder_exists:
        raise FileNotFoundError(f"Docs 폴더를 찾을 수 없습니다: {DOCS_PATH}")
    
    docs = []
    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "header1"),
            ("##", "header2"),
            ("###", "header3"),
        ]
    )
    
    # 각 md 파일을 읽어서 분할 → Document 객체로 변환
    for file_path in md_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            
            if not text.strip():
                logger.warning(f"⚠️ 빈 파일: {file_path.name}")
                continue
            
            split_docs = splitter.split_text(text) # 헤더 단위로 텍스트 분리
            for i, doc in enumerate(split_docs):
                if isinstance(doc, str): # 문자열인 경우와 Document 객체인 경우 모두 처리
                    content = doc
                    metadata = {
                        "source": file_path.name, # 출처 파일명
                        "chunk_id": i # 조각 번호
                    }
                else:
                    content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
                    metadata = { # 메타데이터를 단순한 형태로 변환
                        "source": file_path.name,
                        "chunk_id": i
                    }
                    if hasattr(doc, 'metadata') and 'headers' in doc.metadata: # Document.metadata에 headers가 있으면 문자열로 변환
                        headers = doc.metadata.get('headers', {})
                        if headers:
                            header_str = ", ".join([f"{k}: {v}" for k, v in headers.items() if v]) # 딕셔너리를 문자열로 변환
                            if header_str:
                                metadata["headers"] = header_str
                
                docs.append(Document( # LangChain Document 객체 생성
                    page_content=content,
                    metadata=metadata
                ))
            
            logger.info(f"✅ {file_path.name} 처리 완료 ({len(split_docs)}개 청크)")
            
        except Exception as e:
            logger.error(f"❌ {file_path.name} 처리 실패: {e}")
    
    if not docs:
        raise ValueError("처리된 문서가 없습니다. MD 파일 내용을 확인하세요.")
    
    logger.info(f"📊 총 {len(docs)}개의 문서 청크 생성")
    
    # OpenAI 임베딩을 이용해 메모리 기반 Chroma DB 생성
    try:
        embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
        
        # 메모리에만 저장 (파일 시스템 사용 안 함)
        _vectordb_instance = Chroma.from_documents(
            documents=docs,
            embedding=embeddings
            # persist_directory 제거 - 메모리에만 저장
        )
        
        _is_initialized = True
        logger.info("✅ 메모리 기반 벡터DB 생성 완료")
        return _vectordb_instance
        
    except Exception as e:
        logger.error(f"❌ 벡터DB 생성 실패: {e}")
        _vectordb_instance = None
        _is_initialized = False
        raise

def get_vector_db():
    """
    📌 벡터DB 인스턴스를 반환하는 함수
    - 이미 초기화된 DB가 있으면 그대로 반환
    - 초기화되지 않았거나 무효화되면 build_vector_db()로 새로 생성
    """
    global _vectordb_instance, _is_initialized
    
    # 이미 초기화되어 있으면 기존 인스턴스 반환
    if _is_initialized and _vectordb_instance:
        try:
            _vectordb_instance._collection.count() # 간단한 검증 (DB 접근 가능 여부)
            return _vectordb_instance
        except:
            logger.warning("⚠️ 기존 인스턴스 무효, 재생성")
            _is_initialized = False
    
    # 초기화되지 않았으면 새로 생성
    logger.info("📂 메모리 기반 벡터DB 초기화 중...")
    return build_vector_db()