# Sử dụng Python 3.12 slim
FROM python:3.12-slim

# Không tạo file .pyc và hiển thị log ngay lập tức
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Thư mục làm việc trong container
WORKDIR /app

# Cài đặt thư viện hệ thống cần thiết cho psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements trước để tận dụng Docker cache
COPY requirements.txt .

# Nâng cấp pip và cài dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy toàn bộ source code
COPY . .

# Expose cổng FastAPI
EXPOSE 8000

# Lệnh chạy ứng dụng
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]