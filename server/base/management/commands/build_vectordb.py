from django.core.management.base import BaseCommand
from base.services.chatbot_service import build_vector_db, test_retrieval, check_docs_folder
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Build or rebuild the vector database from markdown files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force rebuild even if database exists',
        )
        parser.add_argument(
            '--test',
            action='store_true',
            help='Test the vector database after building',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🚀 벡터DB 빌드 시작...'))
        
        # 1. docs 폴더 확인
        folder_exists, md_files = check_docs_folder()
        if not folder_exists:
            self.stdout.write(self.style.ERROR('❌ docs 폴더를 찾을 수 없습니다!'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'✅ {len(md_files)}개의 MD 파일 발견:'))
        for f in md_files:
            self.stdout.write(f'  - {f.name}')
        
        # 2. 벡터DB 빌드
        try:
            vectordb = build_vector_db(force_rebuild=options['force'])
            count = vectordb._collection.count()
            self.stdout.write(
                self.style.SUCCESS(f'✅ 벡터DB 빌드 완료! (문서 수: {count})')
            )
            
            # 3. 테스트 실행 (옵션)
            if options['test']:
                self.stdout.write(self.style.WARNING('\n📝 테스트 질문 실행...'))
                test_questions = [
                    "환불 정책은 어떻게 되나요?",
                    "배송 기간은 얼마나 걸리나요?",
                    "결제 방법에는 어떤 것들이 있나요?"
                ]
                
                for q in test_questions:
                    results = test_retrieval(q)
                    if results:
                        self.stdout.write(self.style.SUCCESS(f'✅ "{q}" → {len(results)}개 결과'))
                    else:
                        self.stdout.write(self.style.ERROR(f'❌ "{q}" → 결과 없음'))
                        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ 빌드 실패: {e}'))