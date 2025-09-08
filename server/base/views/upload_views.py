from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def uploadImage(request):
    file = request.FILES.get('image')

    if not file:
        return Response({"detail": "이미지가 없습니다."}, status=400)

    # Django의 기본 저장 시스템을 사용하여 파일 저장
    saved_filename = default_storage.save(file.name, file)

    # 실제 서버에 저장된 파일 이름을 반환 - 이제 React는 서버에 100% 존재하는 파일의 이름을 받게 된다
    return Response({"image_name": saved_filename})