# Đồ án DevOps: Web bán hàng trực tuyến (Git + Docker + CI/CD)

Website bán hàng trực tuyến gồm: xem/tìm kiếm/lọc sản phẩm, giỏ hàng, đặt hàng, tra cứu đơn và trang quản trị đơn hàng. Ứng dụng được **quản lý bằng Git**, **đóng gói bằng Docker** và **tự động test – build – deploy bằng GitHub Actions**.

## 1. Chức năng

| Nhóm | Chức năng |
|---|---|
| Khách hàng | Xem danh sách sản phẩm, tìm kiếm, lọc theo danh mục, giỏ hàng (lưu trên trình duyệt), đặt hàng, tra cứu đơn bằng mã đơn + số điện thoại |
| Quản trị | `/admin.html`: xem đơn, đổi trạng thái (Mới → Đã xác nhận → Đang giao → Hoàn thành / Hủy), bảo vệ bằng `ADMIN_TOKEN` |
| Bảo đảm dữ liệu | Server tự tính tổng tiền (không tin giá từ client), kiểm tra tồn kho, đặt hàng trong 1 transaction (lỗi thì rollback), chống XSS khi hiển thị, chống path traversal |

**Công nghệ:** Node.js 22 (không cần cài thư viện ngoài), SQLite (`node:sqlite` có sẵn), HTML/CSS/JS thuần, Docker, GitHub Actions.

## 2. Luồng CI/CD

```
Lập trình viên ──git push──▶ GitHub ──▶ GitHub Actions
                                          │
              ┌───────────────────────────┼────────────────────────┐
              ▼                           ▼                        ▼
   1. Test + Docker smoke test    2. Build & Push image      3. Deploy qua SSH
   npm test, build thử image,     lên Docker Hub             docker compose pull/up
   chạy container gọi /health     (latest, sha-xxx, v*)      trên server
```

- **Pull Request vào `main`:** chỉ chạy job 1.
- **Push lên `main`:** chạy cả 3 job (job 3 bỏ qua nếu chưa cấu hình server).
- **Push tag `v*`:** chạy job 1 và 2, image có tag theo phiên bản.

## 3. API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/products?q=&category=` | Danh sách sản phẩm |
| GET | `/api/products/:id` | Chi tiết sản phẩm |
| GET | `/api/categories` | Danh mục |
| POST | `/api/orders` | Đặt hàng `{customer:{name,phone,address}, items:[{productId,quantity}]}` |
| GET | `/api/orders/:id?phone=` | Tra cứu đơn |
| GET | `/api/admin/orders` | (Admin) danh sách đơn, header `x-admin-token` |
| PATCH | `/api/admin/orders/:id` | (Admin) đổi trạng thái `{status}` |
| GET | `/health`, `/api/info` | Kiểm tra sống, phiên bản/container |

## 4. Cấu trúc thư mục

```
.
├── src/                    # db.js (dữ liệu + nghiệp vụ), app.js (router), server.js
├── public/                 # index.html, admin.html, style.css, app.js (giao diện)
├── test/app.test.js        # 10 test tự động
├── Dockerfile
├── docker-compose.yml      # web + volume lưu dữ liệu
├── .env.example
├── .github/workflows/ci-cd.yml
└── docs/huong-dan-bao-cao.md
```

## 5. Chạy thử

### 5.1. Bằng Node.js (cần Node >= 22.13)
```bash
npm test
npm start            # http://localhost:3000  (dữ liệu ở thư mục data/)
```

### 5.2. Bằng Docker (các lệnh trong bài giảng)
```bash
docker build -t shop-online:local .
docker run -d --name shop -p 8080:3000 -v shop-data:/data shop-online:local

curl http://localhost:8080/health
docker ps -a                  # liệt kê container
docker logs shop              # xem log
docker stop shop              # dừng
docker rm shop                # xóa container (dữ liệu vẫn còn trong volume shop-data)
docker rmi shop-online:local  # xóa image
```

### 5.3. Bằng Docker Compose
```bash
cp .env.example .env          # rồi sửa ADMIN_TOKEN
docker compose up -d --build  # http://localhost:8080
docker compose down           # dừng (thêm -v nếu muốn xóa cả dữ liệu)
```
Trang quản trị: http://localhost:8080/admin.html (nhập `ADMIN_TOKEN`; mặc định khi không đặt là `admin123` — **phải đổi khi triển khai thật**).

### 5.4. Đẩy image lên Docker Hub thủ công
```bash
docker login
docker tag shop-online:local <dockerhub-user>/shop-online:latest
docker push <dockerhub-user>/shop-online:latest
```

## 6. Quy trình Git

```bash
git init
git add .
git commit -m "feat: khởi tạo web bán hàng"
git branch -M main
git remote add origin https://github.com/<user>/shop-online.git
git push -u origin main
```

Làm việc theo nhánh:
```bash
git checkout -b feature/tim-kiem
# ... sửa code ...
git add . && git commit -m "feat: cải thiện tìm kiếm"
git push -u origin feature/tim-kiem
# Mở Pull Request -> CI chạy -> merge vào main -> tự build & deploy
```

Quy ước commit: `feat:` tính năng · `fix:` sửa lỗi · `docs:` tài liệu · `ci:` pipeline · `test:` kiểm thử.
Gắn phiên bản: `git tag v1.0.0 && git push origin v1.0.0`.

## 7. Cấu hình GitHub Actions

Vào **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DOCKERHUB_USERNAME` | Có | Tên tài khoản Docker Hub |
| `DOCKERHUB_TOKEN` | Có | Access Token tạo tại Docker Hub → Account settings → Security |
| `SERVER_HOST` | Không | IP/domain VPS. Bỏ trống thì bỏ qua bước deploy |
| `SERVER_USER` | Không | User SSH |
| `SERVER_SSH_KEY` | Không | Nội dung private key SSH |
| `ADMIN_TOKEN` | Nên có | Mật khẩu trang quản trị trên server (không đặt sẽ dùng mặc định `admin123`) |

### Chuẩn bị server (nếu deploy)
```bash
curl -fsSL https://get.docker.com | sh      # cài Docker trên Ubuntu
sudo usermod -aG docker $USER               # đăng nhập lại sau lệnh này
# Thêm public key tương ứng SERVER_SSH_KEY vào ~/.ssh/authorized_keys
# Mở port 8080 trên firewall
```
Sau khi pipeline xanh, truy cập `http://<SERVER_HOST>:8080`.

## 8. Điểm nổi bật về DevOps

- Image nhẹ (`node:22-alpine`), chạy bằng user `node` (không phải root), có `HEALTHCHECK`.
- Sắp xếp `COPY` để tận dụng cache layer; `.dockerignore` loại file thừa; CI dùng cache của GitHub Actions.
- **Docker volume** `shop-data` giúp dữ liệu đơn hàng không mất khi cập nhật container.
- CI chặn code lỗi: test hoặc smoke test thất bại thì không build/push/deploy.
- Tag image theo git SHA giúp truy vết và rollback:
  ```bash
  DOCKER_IMAGE=<user>/shop-online:sha-abc1234 docker compose up -d
  ```
- Chân trang web hiển thị phiên bản (commit SHA) và tên container, dễ chứng minh đã deploy bản mới.

## 9. Hạn chế & hướng phát triển

Chưa có đăng nhập tài khoản khách, thanh toán online, upload ảnh sản phẩm; SQLite phù hợp quy mô nhỏ.
Hướng mở rộng: chuyển sang PostgreSQL (thêm service vào Compose), thêm Nginx + HTTPS (Let's Encrypt), quét bảo mật image bằng Trivy, môi trường staging, thông báo Telegram/Slack khi deploy.
