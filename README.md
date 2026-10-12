# Shop online — cửa hàng và quản trị

Ứng dụng Node.js >= 20.12, HTML/CSS/JavaScript thuần, lưu dữ liệu JSON. Không cần cài thư viện để chạy website hoặc kiểm thử API.

## Chạy tại máy

```sh
npm run setup
npm test
npm start
```

- Cửa hàng: http://localhost:3000
- Quản trị: http://localhost:3000/admin.html
- `npm run setup` tạo `.env` hoặc bổ sung/thay secret bị thiếu, quá ngắn hay còn là mật khẩu mẫu; giữ nguyên secret hợp lệ và các cấu hình khác.
- Mở `.env`, lấy giá trị `ADMIN_TOKEN` để đăng nhập quản trị. Không có mật khẩu mặc định công khai.
- `ADMIN_TOKEN` tối thiểu 12 ký tự; `JWT_SECRET` tối thiểu 32 ký tự. Sau khi sửa cấu hình, khởi động lại server.
- Dữ liệu ở `data/shop.json`. Sao lưu file này trước khi chuyển máy hoặc triển khai. Không chạy nhiều tiến trình cùng ghi một file JSON.
- Nếu cổng bận, dừng tiến trình cũ hoặc đổi `PORT`; server báo lỗi thay vì tự đổi cổng.

## Quản trị

Trang `/admin.html` có phiên đăng nhập cookie HttpOnly, SameSite=Strict, hết hạn sau 8 giờ. Đăng xuất hoặc khởi động lại server sẽ thu hồi phiên.

- **Sản phẩm:** thêm, sửa, xóa, tìm kiếm; quản lý tên, danh mục, mô tả, URL ảnh, giá, tồn kho, size, màu, nhóm khách hàng và nhóm bộ sưu tập. Size/màu nhập cách nhau bằng dấu phẩy. Tồn kho hiện được tính chung cho sản phẩm, chưa tách theo từng biến thể.
- **Voucher:** thêm, sửa, xóa, bật/tắt; giảm theo phần trăm, số tiền cố định hoặc miễn phí ship. Có đơn tối thiểu, mức giảm tối đa, thời gian bắt đầu/hết hạn và giới hạn lượt dùng toàn cửa hàng. Giá trị 0 ở giới hạn lượt/mức giảm tối đa nghĩa là không giới hạn. Mỗi đơn áp dụng một voucher. Hủy đơn hoàn lại lượt dùng.
- **Đơn hàng:** xem khách hàng, địa chỉ, sản phẩm, size/màu, tổng tiền và voucher; lọc và đổi trạng thái. Luồng: Mới → Đã xác nhận → Đang giao → Hoàn thành. Có thể hủy trước khi hoàn thành; hủy hoàn tồn kho đúng một lần. Đơn đã hoàn thành hoặc đã hủy không mở lại.
- **Thống kê:** số sản phẩm, đơn mới, voucher đang bật và doanh thu của đơn hoàn thành.

Xóa sản phẩm/voucher không xóa thông tin đã chụp lại trong lịch sử đơn. Sản phẩm đã xóa không được tự tạo lại khi hủy đơn cũ.

## Khách hàng và thanh toán

- Đăng ký, đăng nhập; mật khẩu khách hàng được băm bằng scrypt.
- Xem, tìm kiếm, lọc, sắp xếp sản phẩm; chọn size/màu; giỏ hàng và yêu thích lưu trên trình duyệt.
- Khi thanh toán, server tính lại giá, tồn kho, giảm giá và phí ship; giao diện sử dụng báo giá từ server. Phí ship cơ bản 30.000đ/đơn.
- Hiện chỉ hỗ trợ **COD**. VietQR, MoMo, VNPay chưa tích hợp, không hiển thị như phương thức có thể thanh toán.
- Địa chỉ nhập trực tiếp tỉnh/thành, phường/xã, địa chỉ chi tiết; quận/huyện tùy chọn.
- Đơn đặt khi đăng nhập gắn với tài khoản và hiển thị lịch sử từ server. Đơn khách vãng lai tra bằng mã đơn + số điện thoại. Các đơn cũ không có tài khoản vẫn tra cứu theo cách này.
- Nội dung động được escape trước khi hiển thị HTML để ngăn tên khách/sản phẩm chèn mã vào giao diện.

## API chính

| API | Chức năng |
|---|---|
| `GET /api/products`, `/api/products/:id`, `/api/categories` | Catalog |
| `POST /api/auth/register`, `/api/auth/login`; `GET /api/auth/me` | Tài khoản khách |
| `GET /api/vouchers` | Voucher còn hiệu lực |
| `POST /api/checkout/quote` | Báo giá `{items, voucherCode}` |
| `POST /api/orders` | Đặt hàng `{customer, items, voucherCode, paymentMethod:"cod"}` |
| `GET /api/orders/mine` | Đơn của tài khoản theo Bearer token |
| `GET /api/orders/:id?phone=...` | Tra cứu đơn |
| `POST /api/admin/login`, `/api/admin/logout` | Phiên quản trị |
| `GET /api/admin/session` | Kiểm tra phiên |
| `GET/POST /api/admin/products`, `PATCH/DELETE /api/admin/products/:id` | Quản lý sản phẩm |
| `GET/POST /api/admin/vouchers`, `PATCH/DELETE /api/admin/vouchers/:id` | Quản lý voucher |
| `GET /api/admin/orders`, `PATCH /api/admin/orders/:id` | Quản lý đơn |
| `GET /health`, `/api/info` | Health/version |

Item đặt hàng: `{productId, quantity, size, color}`. Server cộng tồn kho của tất cả size/màu cùng sản phẩm để tránh bán vượt kho. API admin nhận cookie phiên; lệnh ghi từ giao diện gửi `X-Requested-With: shop-admin`. Header `x-admin-token` vẫn được hỗ trợ cho tác vụ quản trị từ server, không nhúng giá trị vào frontend.

## Docker

### Docker Desktop trên Windows

Mở Docker Desktop, chờ Engine sẵn sàng, rồi nhấp đúp **`start-shop.cmd`** trong thư mục dự án. Có thể chạy `node scripts/docker-start.js` hoặc `npm run docker:start` trong terminal.

Script tạo/sửa khóa thiếu trong `.env`, build mã nguồn hiện tại và chờ service khỏe. Trong Docker Desktop chọn **Containers → shop-online**, mở cổng **8080:3000**. Truy cập http://localhost:8080 và http://localhost:8080/admin.html; mật khẩu quản trị là `ADMIN_TOKEN` trong `.env`.

Không bấm **Images → Run** với cấu hình trống: container đó không có khóa đăng nhập hay cổng host. Nếu chủ động chạy image riêng, phải truyền `--env-file`, `-p` và volume như lệnh bên dưới. Cổng 3000 trong log là cổng bên trong container; địa chỉ trên máy là cổng host 8080.

Để dừng: `docker compose stop`. Để chạy lại và cập nhật: nhấp đúp `start-shop.cmd`. Không xóa volume nếu muốn giữ sản phẩm, người dùng và đơn hàng. Các container khác như `strange_shtern` có volume riêng; dữ liệu của chúng không tự đồng bộ với `shop-online`.

```sh
npm run setup
docker compose up -d --build
# http://localhost:8080
# http://localhost:8080/admin.html
docker compose ps
docker compose logs web
docker compose down
```

Cổng trong container và healthcheck đều là 3000. `HOST_PORT` mặc định 8080. Volume `shop-data` giữ dữ liệu khi thay container; không dùng `down -v` nếu muốn giữ dữ liệu.

Build/chạy riêng:

```sh
docker build -t shop-online:local .
docker run -d --name shop -p 8080:3000 --env-file .env -v shop-data:/data shop-online:local
```

Để dùng image đã push, đặt `DOCKER_IMAGE=<user>/shop-online:<tag>` và chạy `docker compose pull`, `docker compose up -d --no-build --wait`.

## CI/CD

GitHub Actions chạy test, Docker smoke test, Trivy và build/push image. Deploy qua SSH khi đã cấu hình server. Image được gắn SHA đầy đủ; triển khai dùng đúng SHA đó. Secrets cần cấu hình:

- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` để deploy
- `ADMIN_TOKEN` và `JWT_SECRET` cho server (dùng chuỗi ngẫu nhiên hex/base64url)

Deploy lưu cấu hình vào `.env` trên server với quyền hạn chế, pull image rồi chờ container healthy. Service Compose là `web`. Khi đưa lên HTTPS, cấu hình `COOKIE_SECURE=true` cho cookie quản trị.

Không commit `.env`, khóa SSH hoặc file dữ liệu. `deploy_key*` và secrets được loại khỏi Docker build context. Nếu khóa từng bị công khai, cần thay khóa trên máy chủ/GitHub.

## Kiểm thử

```sh
npm test
# Kiểm tra UI trên Chrome/Edge cài sẵn (Windows):
node --experimental-websocket scripts/browser-check.js
```

Kiểm thử browser dùng database trong bộ nhớ và profile riêng tại `.browser-test`, không ghi vào dữ liệu cửa hàng. Có kiểm tra đăng nhập admin, CRUD, chọn hai biến thể, voucher, checkout, lịch sử tài khoản, hủy đơn và escape HTML. Ảnh chụp mobile lưu tại `.browser-test`.

## Phạm vi còn lại

Chưa có thanh toán online, gửi email, tồn kho từng biến thể, phân vai nhiều quản trị viên, tích hợp hãng vận chuyển hoặc cơ sở dữ liệu cho nhiều instance. Các endpoint gợi ý size/catalog mở rộng vẫn phục vụ demo. Không coi kiểm thử local là xác nhận pipeline đã deploy thành công lên server thật.

## Ảnh sản phẩm và đăng nhập quản trị

Tại trang chủ, bấm Đăng nhập, dùng tên tài khoản `admin` và mật khẩu từ biến môi trường `ADMIN_TOKEN`. Đăng nhập thành công sẽ mở phần quản trị bằng cookie HttpOnly.

Bảng quản trị hiển thị ảnh nhỏ. Form Thêm/Sửa sản phẩm hỗ trợ URL ảnh hoặc tải JPG, PNG, WebP từ máy tính, tối đa 5 MB, có xem trước và bỏ ảnh. Sau khi chọn ảnh, bấm Lưu sản phẩm để áp dụng. Ảnh tải lên lưu trong thư mục `uploads` cạnh file `DB_PATH`, được giữ trong volume `/data` khi chạy Docker.

## Triển khai trên Render

Service Docker cần biến `ADMIN_TOKEN` (ít nhất 8 ký tự), `JWT_SECRET` (ít nhất 32 ký tự), `COOKIE_SECURE=true` và `DB_PATH` trỏ đến file trên persistent disk của service, ví dụ `/data/shop.json` nếu disk được mount tại `/data`. Không commit `.env` hoặc dữ liệu khách hàng. Service không có persistent disk sẽ mất dữ liệu và ảnh tải lên khi deploy lại.

Nếu service đã kết nối repository này và bật Auto Deploy cho nhánh `main`, push mới sẽ kích hoạt triển khai. Nếu tắt Auto Deploy, chọn Manual Deploy → Deploy latest commit trong Render.
