# ---- Image nền nhẹ (alpine). Ứng dụng không cần cài thư viện ngoài ----
FROM node:20-alpine

# Nhận phiên bản từ CI (git sha / tag) để hiển thị ở chân trang web
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION \
    NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/shop.json

WORKDIR /app

# Copy theo thứ tự ít thay đổi -> hay thay đổi để tận dụng cache của Docker layer
COPY package.json ./
COPY public ./public
COPY src ./src

# Thư mục dữ liệu (gắn volume) và phân quyền cho user không phải root
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
