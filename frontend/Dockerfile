# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files và cài đặt dependencies sử dụng package-lock.json
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

# Nhận biến môi trường VITE_API_URL tại thời điểm build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build mã nguồn sang thư mục dist/
RUN npm run build

# Stage 2: Serve tĩnh bằng Nginx
FROM nginx:alpine

# Copy các file tĩnh sau khi build vào thư mục của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Ghi đè file cấu hình mặc định của Nginx bằng file cấu hình riêng của dự án
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose cổng 80 của container Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
