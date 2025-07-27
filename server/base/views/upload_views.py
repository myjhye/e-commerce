from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def uploadImage(request):
    file = request.FILES.get('image')

    if not file:
        return Response({"detail": "이미지가 없습니다."}, status=400)

    # MEDIA_ROOT 기준으로 파일 저장
    file_path = settings.MEDIA_ROOT / file.name
    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    # URL을 반환하지 않고 파일 이름만 보냄
    return Response({"image_name": file.name})