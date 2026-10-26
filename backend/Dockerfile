FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run database seed on startup and start uvicorn
EXPOSE 8000

CMD ["sh", "-c", "python -m app.scripts.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
