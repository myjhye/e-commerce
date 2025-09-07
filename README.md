# AI 기반 E-commerce 플랫폼 프로젝트

<br>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=black">
  <img src="https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=Redux&logoColor=white">
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=Django&logoColor=white">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=OpenAI&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white">
  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=AmazonAWS&logoColor=white">
</p>

<br>

단순한 쇼핑몰 기능을 넘어, AI를 통해 사용자 경험을 향상시키고 운영을 자동화하는 것을 목표로 합니다. <br />
**Docker**를 활용한 컨테이너 기반으로 설계되어, 일관성 있는 개발 및 실행 환경을 제공합니다.

<br><br>

<img width="2880" height="3297" alt="image" src="https://github.com/user-attachments/assets/98e446f9-25c4-46d5-92c7-fcc038f03fa8" />

<br><br>

## 목차
- [주요 기능 (Features)](#주요-기능-features)
- [AI 기반 특화 기능 (AI Features)](#ai-기반-특화-기능-ai-features)
- [인프라 및 배포 (Infrastructure & Deployment)](#인프라-및-배포-infrastructure--deployment)
- [기술 스택 (Tech Stack)](#기술-스택-tech-stack)
- [주요 문제 해결 및 학습 경험 (Troubleshooting & Learnings)](#주요-문제-해결-및-학습-경험-troubleshooting--learnings)

<br>


## 주요 기능 (Features)

### E-commerce 핵심 기능
- **상품 관리**: 상품 목록/상세 조회 및 등록/수정/삭제 (CRUD)  
- **리뷰 시스템**: 상품별 리뷰 작성/조회/수정/삭제 및 페이지네이션  
- **사용자 인증**: JWT(Access/Refresh Token) 기반 회원가입, 로그인/로그아웃  
- **토큰 자동 갱신**: Axios Interceptor를 활용해 사용자 경험 향상  

<br>


## AI 기반 특화 기능 (AI Features)

- **상품 정보 자동 생성 (with LangGraph):** 상품명과 이미지만으로 브랜드, 카테고리, 마케팅 설명을 자동 생성하는 AI 워크플로우 구축  
- **실시간 RAG 챗봇 (with LangChain):** 자체 문서(`.md` 파일) 기반으로 정확한 답변을 제공하는 검색 증강 생성(RAG) 챗봇 구현  
- **개인 맞춤형 상품 추천 (LLM-based):** 사용자 행동을 분석하여 LLM이 "추천 이유"까지 생성하는 개인화 추천 시스템  
- **리뷰 텍스트 AI 분석 (with Hugging Face):** Hugging Face의 공개 감정 분석 모델(`alsgyu/sentiment-analysis-fine-tuned-model`)을 활용해 리뷰의 긍/부정 감성을 분류하고, 부적절 콘텐츠를 필터링    

<br>


## 인프라 및 배포 (Infrastructure & Deployment)
- **Docker 컨테이너화:** Backend(Django), Frontend(React), Proxy(Nginx) 환경 분리 및 `Docker Compose`를 통한 통합 관리
- **Nginx 리버스 프록시:** API 요청(`/api/*`)과 정적 파일 요청(`/`)을 효율적으로 분배하여 서버 부하 감소

<br>


## 기술 스택 (Tech Stack)

| 구분 | 기술 | 설명 |
|---|---|---|
| **Frontend** | **`React`** | UI 구축을 위한 핵심 라이브러리 |
| | **`Redux (Redux Thunk)`** | 전역 상태 관리 및 비동기 로직 처리 |
| | **`React Router DOM`** | 클라이언트 사이드 라우팅 관리 |
| | **`Axios`** | 서버와의 비동기 HTTP 통신 |
| | **`React-Bootstrap` & `Tailwind CSS`** | 컴포넌트 기반 UI 구현 및 세부 스타일링 |
| **Backend** | `Python`, `Django`, `Django REST Framework` | RESTful API 서버 구축 |
| | `Simple JWT` | JWT 기반의 안전한 사용자 인증 구현 |
| **AI** | `OpenAI GPT-4o`, `LangChain`, `LangGraph` | AI 워크플로우 및 RAG 챗봇, 추천 시스템 구현 |
| | `Hugging Face Transformers` | 텍스트 감성 분석 |
| | `ChromaDB` | RAG 챗봇을 위한 벡터 데이터베이스 |
| **DevOps** | `Docker`, `Docker Compose`, `Nginx`| 컨테이너화, 배포 및 운영 |

<br>


## 주요 문제 해결 및 학습 경험 (Troubleshooting & Learnings)
- **AI 워크플로우 설계**: 단일 LLM 호출의 ‘블랙박스’ 문제를 해소하기 위해, LangGraph로 추론 과정을 단계별로 분해하고 각 단계의 신뢰도를 추적할 수 있는 파이프라인을 구축했습니다. 이를 통해 제어 가능하고 안정적인 AI 서비스를 설계하는 경험을 쌓았습니다.  

- **프론트엔드 안정성 강화**: 고급 AI 기능이 실패할 경우 자동으로 기본 API를 재호출하는 **스마트 폴백(Fallback)** 로직을 적용했습니다. 특정 기능 장애가 전체 서비스 중단으로 이어지지 않도록 방어적인 코드를 작성하며 안정적인 UX를 구축했습니다.  

- **Docker 기반 배포 환경 구축**: 개발 환경과 실제 배포 환경 간 차이로 인해 발생하던 문제를 Docker로 해결했습니다. 또한 Nginx 리버스 프록시를 활용해 복잡한 요청을 효율적으로 분배하며, 재현 가능하고 확장성 있는 배포 환경을 학습했습니다.  


