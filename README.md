# Đồ án DevOps: Web bán hàng trực tuyến (Git + Docker + CI/CD)

Website bán hàng trực tuyến gồm: xem/tìm kiếm/lọc sản phẩm, giỏ hàng, đặt hàng, tra cứu đơn và trang quản trị đơn hàng. Ứng dụng được **quản lý bằng Git**, **đóng gói bằng Docker** và **tự động test – build – deploy bằng GitHub Actions**.

## 1. Chức năng

| Nhóm | Chức năng |
|---|---|
| Khách hàng | Xem danh sách sản phẩm, tìm kiếm, lọc theo danh mục, giỏ hàng (lưu trên trình duyệt), đặt hàng, tra cứu đơn bằng mã đơn + số điện thoại |
| Quản trị | `/admin.html`: xem đơn, đổi trạng thái (Mới → Đã xác nhận → Đang giao → Hoàn thành / Hủy), bảo vệ bằng `ADMIN_TOKEN` |
| Bảo đảm dữ liệu | Server tự tính tổng tiền (không tin giá từ client), kiểm tra tồn kho, đặt hàng được kiểm tra trước rồi mới ghi (lưu lỗi thì khôi phục lại như cũ), chống XSS khi hiển thị, chống path traversal |

**Công nghệ:** Node.js 20 trở lên (không cần cài thư viện ngoài), lưu dữ liệu vào file JSON, HTML/CSS/JS thuần, Docker, GitHub Actions.

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
├── test/app.test.js        # 11 test tự động
├── Dockerfile
├── docker-compose.yml      # web + volume lưu dữ liệu
├── .env.example
├── .github/workflows/ci-cd.yml
└── docs/huong-dan-bao-cao.md
```

## 5. Chạy thử

### 5.1. Bằng Node.js (cần Node >= 20)
```bash
npm test
npm start            # http://localhost:3000  (dữ liệu ở data/shop.json)
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

- Image nhẹ (`node:20-alpine`), chạy bằng user `node` (không phải root), có `HEALTHCHECK`.
- Sắp xếp `COPY` để tận dụng cache layer; `.dockerignore` loại file thừa; CI dùng cache của GitHub Actions.
- **Docker volume** `shop-data` giúp dữ liệu đơn hàng không mất khi cập nhật container.
- CI chặn code lỗi: test hoặc smoke test thất bại thì không build/push/deploy.
- Tag image theo git SHA giúp truy vết và rollback:
  ```bash
  DOCKER_IMAGE=<user>/shop-online:sha-abc1234 docker compose up -d
  ```
- Chân trang web hiển thị phiên bản (commit SHA) và tên container, dễ chứng minh đã deploy bản mới.

## 9. Hạn chế & hướng phát triển

Hiện tại ứng dụng đang đáp ứng tốt mục tiêu DevOps và demo bán hàng nhanh, nhưng vẫn còn nhiều thiếu sót nếu muốn nâng lên mức sản phẩm thực tế. Một số điểm cần cải thiện gồm:

### 9.1. Data & Content
- Dữ liệu mẫu hiện chưa được thay thế hoàn toàn bằng thông tin sản phẩm thật, có thể còn các đoạn văn bản giả lập như "Lorem Ipsum" và hình ảnh lỗi nếu thiếu media local.
- Chưa có đủ các trang thông tin bắt buộc như Chính sách đổi trả/bảo hành, Chính sách bảo mật, Điều khoản dịch vụ, Trang liên hệ và Giới thiệu công ty.
- Hiển thị giá chưa được chuẩn hóa theo định dạng tiền tệ Việt Nam, ví dụ vẫn dùng `150000` thay vì `150.000 VNĐ`.
- Chưa có logic và giao diện rõ ràng khi sản phẩm hoặc biến thể (size, màu) đã hết hàng, dẫn đến tình trạng khách hàng không biết trạng thái tồn kho.

### 9.2. UX/UI
- Thiết kế chưa tối ưu trên màn hình mobile: có thể bị tràn layout, chữ đè, menu khó bấm hoặc table không co giãn đúng trên điện thoại.
- Chưa có trạng thái phản hồi rõ ràng khi chờ dữ liệu (loading spinner/skeleton) và empty state cho các trường hợp như giỏ hàng trống hoặc không tìm thấy sản phẩm theo bộ lọc.
- Sau khi nhấn thêm vào giỏ hoặc mua ngay, chưa có toast/ popup xác nhận nên người dùng dễ bấm lặp lại nhiều lần.
- Tìm kiếm và lọc còn cơ bản, chưa có gợi ý từ khóa (autocomplete) hoặc bộ lọc nâng cao theo khoảng giá, size và màu.

### 9.3. Checkout Flow
- Chưa có xác thực dữ liệu đầu vào đầy đủ: email sai định dạng, số điện thoại trống hoặc địa chỉ không hợp lệ chưa được cảnh báo rõ ràng.
- Luồng nhập địa chỉ chưa theo phân cấp hành chính, chưa có chọn Tỉnh/Thành phố → Quận/Huyện → Phường/Xã theo dạng danh sách chuẩn.
- Chưa tích hợp cổng thanh toán thực tế như VietQR, MoMo, VNPay hoặc thẻ quốc tế; hiện chỉ có lựa chọn COD giả lập.
- Chưa có tính phí vận chuyển tự động dựa trên địa điểm nhận hàng, thiếu API hoặc công thức tính ship theo khu vực.

### 9.4. Technical & Performance
- Mật khẩu và thông tin nhạy cảm chưa được mã hóa (nên dùng bcrypt/argon2), đồng thời chưa có biện pháp bảo vệ cơ bản chống SQL Injection, XSS và dữ liệu thô trong database.
- Chưa có route guard để ngăn khách chưa đăng nhập truy cập trực tiếp vào trang admin hoặc lịch sử đơn hàng.
- Thiếu metadata SEO cơ bản như `<title>`, `<meta name="description">`, Open Graph ở từng trang sản phẩm chi tiết.
- Hình ảnh chưa được tối ưu hóa: có thể dùng kích thước lớn, chưa nén hoặc chuyển sang định dạng WebP, gây chậm tải trang.
- Cấu hình môi trường vẫn chưa tuân thủ chuẩn: khó tránh việc hardcode Database URL, API key và secret key trực tiếp trong mã nguồn; nên chuyển sang `.env` và quản lý secrets riêng.

### 9.5. Bảng đối chiếu: website cần có vs điểm dự án đang thiếu

| Hạng mục | Một website hoàn chỉnh bắt buộc phải có | Điểm dự án hiện đang thiếu / cần khắc phục |
|---|---|---|
| Trải nghiệm Sản phẩm | Lựa chọn biến thể (Size, Màu sắc) rõ ràng; bắt buộc chọn biến thể trước khi mua; tồn kho và giá thay đổi theo biến thể; đánh giá & bình luận từ khách hàng. | Chưa ràng buộc bắt buộc chọn Size/Màu trước khi bấm "Thêm vào giỏ"; thiếu các thông số đánh giá thực tế từ người dùng. |
| Giỏ hàng & Luồng Mua hàng | Thông báo Toast/Popup phản hồi khi thêm giỏ; màn hình "Giỏ hàng trống" kèm nút mua sắm; chặn số lượng âm/chữ/quá lớn; auto-save giỏ hàng khi reload F5. | Chưa có thông báo phản hồi khi thêm vào giỏ; khi giỏ hàng trống giao diện bị trống/đứt bố cục; chưa validate chặn các giá trị số lượng bất hợp lý. |
| Thanh toán & Vận chuyển | Validation form chặt chẽ; chọn địa chỉ cấp Tỉnh/Thành → Quận/Huyện → Phường/Xã; tính phí ship tự động; tích hợp cổng thanh toán thực tế. | Form thanh toán chưa chặn tốt định dạng SĐT/Email; ô nhập địa chỉ còn thô, chưa dùng API địa giới hành chính; phí ship đang cố định hoặc thiếu logic. |
| Tìm kiếm & Trạng thái Hệ thống | Thanh tìm kiếm gợi ý từ khóa; sắp xếp (giá tăng/giảm, mới nhất, bán chạy); thông báo "Không tìm thấy kết quả"; loading skeleton/spinner. | Bộ lọc và sắp xếp chưa mượt; khi từ khóa sai thường bị trang trắng; thiếu trạng thái loading khi gọi API. |
| Giao diện Mobile & Trang Pháp lý | Responsive 100% trên điện thoại; menu hamburger; footer đầy đủ các trang chính sách. | Giao diện mobile còn vỡ khung ở một số vị trí; menu header chưa tối ưu; thiếu các trang chính sách bắt buộc ở footer. |
| Hệ thống Quản trị & Bảo mật | Trang Admin quản lý đơn hàng, kho, sản phẩm; phân quyền Route; mã hóa mật khẩu và lưu secret trong .env; gửi email xác nhận đơn hàng. | Chưa tối ưu phân quyền giữa User/Admin; console vẫn có cảnh báo lỗi JS; chưa có email xác nhận đơn hàng tự động. |

### 9.6. Hướng phát triển
Chưa có đăng nhập tài khoản khách, thanh toán online, upload ảnh sản phẩm; file JSON phù hợp quy mô nhỏ.
Hướng mở rộng: chuyển sang PostgreSQL (thêm service vào Compose), thêm Nginx + HTTPS (Let's Encrypt), quét bảo mật image bằng Trivy, môi trường staging, thông báo Telegram/Slack khi deploy.
