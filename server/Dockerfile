FROM python:3.11-slim

WORKDIR /app

# pip 최신화
RUN pip install --upgrade pip

COPY requirements.txt /app/

# PyTorch CPU 전용 설치 (GPU 안 쓰니까 가볍고 안정적)
RUN pip install torch==2.1.0+cpu torchvision==0.16.0+cpu torchaudio==2.1.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# 나머지 requirements 설치 (타임아웃/재시도 옵션 추가)
RUN pip install --default-timeout=100 --retries=5 -r requirements.txt

COPY . /app

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
