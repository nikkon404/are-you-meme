FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860 \
    HOME=/tmp \
    MPLCONFIGDIR=/tmp/mpl \
    CLIP_CACHE_DIR=/tmp/clip

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt -f https://download.pytorch.org/whl/cpu

# Copy backend app files
COPY . .

EXPOSE 7860

CMD uvicorn app:app --host 0.0.0.0 --port ${PORT}


