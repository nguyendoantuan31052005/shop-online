# Shop online — cửa hàng và quản trị

Giao diện Home Shopping App có danh mục theo không gian, bộ lọc giá/còn hàng, thanh điều hướng trên điện thoại, sản phẩm vừa xem và so sánh; khách đăng nhập có thể sửa hồ sơ, đổi mật khẩu, xem tiến trình và hủy đơn chưa được xác nhận. Các chức năng giỏ hàng, voucher, COD, tra cứu đơn, liên hệ và quản trị tiếp tục dùng backend hiện có.

Khi khởi động server, migration `homeCatalogVersion=1` bổ sung một lần 8 sản phẩm gia dụng mẫu có hình SVG minh họa, giữ nguyên sản phẩm, khách hàng và đơn cũ. Giá/tồn kho của danh mục mẫu cần được chủ shop chỉnh theo hàng thực tế trong quản trị. Migration không thêm lại sản phẩm khi đã có marker, kể cả sản phẩm mẫu đã bị xóa. Dữ liệu và ảnh upload tiếp tục nằm trên volume Docker.

Migration `homeCatalogVersion=2` bổ sung thêm 12 sản phẩm mẫu (tổng 20 sản phẩm gia dụng), chỉ chạy một lần và giữ nguyên các sản phẩm đã chỉnh sửa. Thêm ảnh SVG minh họa cho đồ vải, khay, chậu cây và dụng cụ bếp. Trang chủ dùng 8 ô danh mục chính, bảng màu và chiều rộng thống nhất; nhóm danh mục khác vẫn truy cập được qua bộ lọc sản phẩm.

Ứng dụng Node.js >= 20.12, HTML/CSS/JavaScript thuần, lưu dữ liệu JSON. Không cần cài thư viện để chạy website hoặc kiểm thử API.

## Chạy tại máy

Giao diện có hiệu ứng banner, chuyển cảnh khi cuộn, hover sản phẩm, gợn nút, tim yêu thích, mở bảng tài khoản, thanh tiến trình cuộn và hiệu ứng đặt hàng thành công. Nút **Hiệu ứng** ở góc trái bật/tắt và ghi nhớ theo trình duyệt. Chế độ giảm chuyển động của hệ điều hành được ưu tiên; nghiêng thẻ chỉ hoạt động với chuột, không áp dụng thao tác chạm.

```sh
npm run setup
npm test
npm start
```

- Cửa hàng: http://localhost:3000
- Quản trị: http://localhost:3000/admin.html
- Swagger UI: http://localhost:3000/api-docs (hoặc `/swagger`). Docker: http://localhost:8080/api-docs.
- OpenAPI JSON: `/api/openapi.json`. Swagger UI được phục vụ từ dự án, không cần CDN hay Internet. Chọn **Try it out → Execute** để thử API trên server hiện tại; thao tác ghi cập nhật dữ liệu thật.
- Trong Swagger, gọi `/api/auth/login` hoặc `/api/auth/register` để tự xác thực bằng token trả về; cũng có thể nhập token bằng **Authorize → CustomerBearer**. Quản trị dùng **Authorize → AdminToken** với `ADMIN_TOKEN` từ `.env`, hoặc gọi `/api/admin/login` bằng `{password: "<ADMIN_TOKEN>"}` để dùng cookie. Swagger tự thêm header `X-Requested-With` cho API quản trị. Token chỉ giữ trong bộ nhớ trang; đăng xuất/đổi mật khẩu gỡ token khách hàng, tải lại trang yêu cầu nhập lại Bearer/API key. Cookie quản trị vẫn theo thời hạn phiên server.
- `npm run setup` tạo `.env` hoặc bổ sung/thay secret bị thiếu, quá ngắn hay còn là mật khẩu mẫu; giữ nguyên secret hợp lệ và các cấu hình khác.
- Mở `.env`, lấy giá trị `ADMIN_TOKEN` để đăng nhập quản trị. Không có mật khẩu mặc định công khai.
- `ADMIN_TOKEN` tối thiểu 8 ký tự; `JWT_SECRET` tối thiểu 32 ký tự. Sau khi sửa cấu hình, khởi động lại server.
- Dữ liệu ở `data/shop.json`. Sao lưu file này trước khi chuyển máy hoặc triển khai. Không chạy nhiều tiến trình cùng ghi một file JSON.
- Nếu cổng bận, dừng tiến trình cũ hoặc đổi `PORT`; server báo lỗi thay vì tự đổi cổng.

## Quản trị

Trang quản trị mở tab **Tổng quan** sau đăng nhập, có lối tắt xử lý đơn mới và hàng sắp hết. Bảng sản phẩm, tài khoản và voucher phân trang 12 mục; sản phẩm hỗ trợ sắp xếp theo ngày thêm, tồn kho và giá. Tìm sản phẩm/tài khoản/voucher hỗ trợ tiếng Việt không dấu. Voucher có bộ lọc đang áp dụng, đã tắt, hết hạn/hết lượt và chưa bắt đầu. Thanh trạng thái hiển thị thời gian cập nhật dữ liệu; nút làm mới có trạng thái chờ trong khi tải.

Trong tab **Liên hệ shop**, quản trị sửa điện thoại, số Zalo, tên/link Facebook, Messenger, email, địa chỉ và giờ hỗ trợ. Thông tin được lưu cùng database JSON trên volume; khách tải lại trang sẽ thấy thay đổi. Kênh bỏ trống được ẩn, tên Facebook chưa có link chỉ hiển thị dạng chữ. Khách dùng thẻ liên hệ hoặc nút nổi **Liên hệ shop** để gọi điện/mở ứng dụng bên ngoài; website không tự gửi tin nhắn. API công khai: `GET /api/contact`; quản trị: `GET/PUT /api/admin/contact`.

Dashboard hiển thị doanh thu đơn hoàn thành theo từng tháng trong 6 tháng gần nhất, số đơn theo trạng thái và sản phẩm có tồn kho dưới 5. Có bộ lọc sản phẩm hết hàng/sắp hết/còn hàng và tài khoản hoạt động/đã khóa. Danh sách đơn hỗ trợ tìm mã đơn, khách hàng, điện thoại, email; lọc khoảng ngày theo lịch trên máy đang xem và xuất CSV theo toàn bộ bộ lọc hiện tại. CSV có BOM UTF-8 để mở tiếng Việt trong Excel và vô hiệu hóa nội dung có thể bị hiểu thành công thức. Tổng giá trị đơn lọc có thể bao gồm đơn hủy; doanh thu dashboard chỉ tính đơn hoàn thành.

Trang `/admin.html` có phiên đăng nhập cookie HttpOnly, SameSite=Strict, hết hạn sau 8 giờ. Đăng xuất hoặc khởi động lại server sẽ thu hồi phiên.

- **Sản phẩm:** thêm, sửa, xóa, tìm kiếm; quản lý tên, danh mục, thương hiệu, mô tả, ảnh chính và tối đa 8 ảnh chi tiết, giá gốc, giá khuyến mãi, tồn kho, size, màu, nhóm khách hàng và nhóm bộ sưu tập. Giá khuyến mãi phải thấp hơn giá gốc và được máy chủ áp dụng trong báo giá/đặt hàng. Size/màu nhập cách nhau bằng dấu phẩy. Tồn kho hiện được tính chung cho sản phẩm, chưa tách theo từng biến thể.
- **Danh mục:** tạo, đổi tên và xóa danh mục riêng trong quản trị. Đổi tên cập nhật sản phẩm đang dùng; không xóa danh mục còn sản phẩm.
- **Voucher:** thêm, sửa, xóa, bật/tắt; giảm theo phần trăm, số tiền cố định hoặc miễn phí ship. Có đơn tối thiểu, mức giảm tối đa, thời gian bắt đầu/hết hạn và giới hạn lượt dùng toàn cửa hàng. Giá trị 0 ở giới hạn lượt/mức giảm tối đa nghĩa là không giới hạn. Mỗi đơn áp dụng một voucher. Hủy đơn hoàn lại lượt dùng.
- **Đơn hàng:** xem khách hàng, địa chỉ, sản phẩm, size/màu, tổng tiền và voucher; lọc và đổi trạng thái. Luồng: Mới → Đã xác nhận → Đang giao → Hoàn thành. Có thể hủy trước khi hoàn thành nếu chưa thu tiền; hủy hoàn tồn kho đúng một lần. Shop có thể lưu hãng vận chuyển, mã vận đơn và link HTTPS để khách theo dõi. Với COD, quản trị xác nhận đã thu khi đơn đang giao/hoàn thành.
- **Thống kê:** số sản phẩm, đơn mới, voucher đang bật và doanh thu của đơn hoàn thành. Trang chủ có mục sản phẩm mới và bán chạy dựa trên các đơn chưa hủy.

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

Swagger `/api-docs` mô tả các thao tác API với xác thực, quy tắc nghiệp vụ, tham số, schema và ví dụ request/response. Tải OpenAPI tại `/api/openapi.json` hoặc Postman Collection tại `/api/postman.json`. Collection không chứa secret: đặt `baseUrl`, `adminToken`; gọi đăng nhập khách để tự lưu `customerToken` trong collection. API upload ảnh dùng body binary, không dùng multipart.

Chạy `node scripts/export-api.js` hoặc `npm run docs:api` để tạo lại [tài liệu chi tiết](docs/API.md), `docs/openapi.json` và `docs/postman.json` từ cùng đặc tả dùng bởi server. Ví dụ minh họa có thể không khớp ID/biến thể của dữ liệu shop hiện tại; đọc catalog trước khi thử ghi dữ liệu.

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

Sau khi cập nhật backend/Swagger, chạy `docker compose up -d --build --wait --wait-timeout 90`. Mở Swagger tại http://localhost:8080/api-docs, OpenAPI tại http://localhost:8080/api/openapi.json. Image chứa sẵn các tệp Swagger UI nên trình duyệt không cần tải thư viện từ Internet. Cổng 3000 là bên trong container; trên máy dùng cổng 8080 (hoặc `HOST_PORT` trong `.env`).

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

Thanh toán hiện hỗ trợ COD; chưa có adapter thanh toán online. Adapter GHN có thể tạo vận đơn thủ công hoặc tự gửi đơn ngay sau checkout khi đã bật cấu hình, đồng thời cập nhật trạng thái qua webhook; cần thêm thông tin GHN vào AWS Secrets Manager trước khi dùng thật. Email nhận đơn, cập nhật đơn và đặt lại mật khẩu cần cấu hình Resend (`PUBLIC_URL`, `RESEND_API_KEY`, `MAIL_FROM`). Trang admin hiển thị trạng thái cấu hình dịch vụ mà không tiết lộ secret. Tồn kho hiện theo sản phẩm, chưa theo từng biến thể; JSON database chỉ phù hợp với một instance. Các endpoint gợi ý size/catalog mở rộng vẫn phục vụ demo.

Để phát hành image mới lên EC2 hiện tại mà giữ nguyên stack và volume dữ liệu, đăng nhập AWS CLI đúng account, khởi động Docker Desktop rồi chạy `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-aws.ps1`. Script tạo backup S3 trước rollout, xác thực ECR trong bộ nhớ để tránh lỗi Windows Credential Manager và tự khôi phục container cũ nếu health check thất bại. Xem [trạng thái readiness và giới hạn còn lại](docs/shop-readiness.md).

## Ảnh sản phẩm và đăng nhập quản trị

Tại trang chủ, bấm Đăng nhập, dùng tên tài khoản `admin` và mật khẩu từ biến môi trường `ADMIN_TOKEN`. Đăng nhập thành công sẽ mở phần quản trị bằng cookie HttpOnly.

Bảng quản trị hiển thị ảnh nhỏ. Form Thêm/Sửa sản phẩm hỗ trợ URL ảnh hoặc tải JPG, PNG, WebP từ máy tính, tối đa 5 MB, có xem trước và bỏ ảnh. Sau khi chọn ảnh, bấm Lưu sản phẩm để áp dụng. Ảnh tải lên lưu trong thư mục `uploads` cạnh file `DB_PATH`, được giữ trong volume `/data` khi chạy Docker.

## Triển khai trên Render

Service Docker cần biến `ADMIN_TOKEN` (ít nhất 8 ký tự), `JWT_SECRET` (ít nhất 32 ký tự), `COOKIE_SECURE=true` và `DB_PATH` trỏ đến file trên persistent disk của service, ví dụ `/data/shop.json` nếu disk được mount tại `/data`. Không commit `.env` hoặc dữ liệu khách hàng. Service không có persistent disk sẽ mất dữ liệu và ảnh tải lên khi deploy lại.

Nếu service đã kết nối repository này và bật Auto Deploy cho nhánh `main`, push mới sẽ kích hoạt triển khai. Nếu tắt Auto Deploy, chọn Manual Deploy → Deploy latest commit trong Render.

## Backend khách hàng

### Sổ địa chỉ, đánh giá và hậu mãi

Hồ sơ khách hàng hiển thị mã KH, username, ngày tham gia, tên, email, điện thoại, địa chỉ mặc định, ngày sinh/giới tính tùy chọn, giới thiệu tối đa 300 ký tự và màu avatar chữ cái. `GET /api/account/overview` trả thống kê riêng tư tính từ server: tổng đơn, đang xử lý, hoàn thành, đã hủy, chi tiêu đơn hoàn thành, số địa chỉ/đánh giá và yêu cầu hỗ trợ đang mở. Ngày sinh phải hợp lệ từ 1900 đến hiện tại; các trường tùy chọn có thể xóa. Khôi phục mật khẩu có thể dùng mã TOTP offline từ ứng dụng Authenticator, không gửi SMS.

- Khách dùng **Sổ địa chỉ** trong khu vực đơn mua để lưu tối đa 10 địa chỉ, chọn mặc định và dùng ở checkout.
- Chi tiết đơn có **Mua lại đơn này** (thêm vào giỏ, không tự đặt hàng) và **Liên hệ về đơn / đổi trả**. Yêu cầu đổi trả chỉ mở cho đơn hoàn thành; shop xem xét và phản hồi trong tab quản trị **Hậu mãi & đánh giá**. Đây là phiếu hỗ trợ, chưa tự hoàn tiền/hoàn kho.
- Khách có đơn hoàn thành mới được đánh giá sản phẩm, mỗi tài khoản một đánh giá/sản phẩm. Nội dung, sao và số lượng lấy từ dữ liệu thật; admin có thể ẩn/hiện. Đánh giá nằm cuối phần chi tiết sản phẩm.
- Swagger đã mô tả API `/api/addresses`, `/api/products/{id}/reviews`, `/api/orders/{id}/reorder`, `/api/support`, `/api/admin/support` và `/api/admin/reviews`.
- Xem [bản rà soát chức năng và phần chưa tích hợp](docs/shop-readiness.md).

Backend chạy Node.js, phục vụ giao diện và API cùng origin. Các endpoint khách hàng dùng `Authorization: Bearer <token>`; token hết hạn sau 24 giờ. Đổi mật khẩu hoặc đăng xuất thu hồi mọi phiên của tài khoản. Tài khoản bị khóa không thể dùng API mua hàng.

| Endpoint | Chức năng |
| --- | --- |
| `PATCH /api/auth/me` | Sửa `name`, `email`, `phone`, `address`; kiểm tra trùng email |
| `POST /api/auth/password` | Nhận `currentPassword`, `newPassword`; yêu cầu đăng nhập lại |
| `POST /api/auth/logout` | Thu hồi các token đang tồn tại |
| `GET /api/cart` | Giỏ riêng của khách, giá hiện tại và trạng thái còn hàng |
| `PUT /api/cart` | Lưu `{items:[{productId,quantity,size,color}]}`; kiểm tra biến thể và tồn kho |
| `DELETE /api/cart` | Xóa giỏ |
| `GET /api/wishlist`, `PUT /api/wishlist` | Đọc/lưu danh sách yêu thích; PUT nhận `{productIds:[1,2]}` |
| `POST /api/orders/:id/cancel` | Khách hủy đơn mới của chính mình, hoàn kho và voucher một lần |
| `GET /api/admin/stats` | Thống kê người dùng, tài khoản khóa, tồn kho thấp, trạng thái đơn và doanh thu |

Giỏ và danh sách yêu thích được tải theo tài khoản khi đăng nhập; giỏ được xóa trên server sau khi đặt hàng thành công. Trong phần Hồ sơ khách hàng, chọn **Chỉnh sửa hồ sơ & mật khẩu** để cập nhật tên, email, điện thoại, địa chỉ hoặc đổi mật khẩu. Đổi mật khẩu yêu cầu mật khẩu hiện tại và đăng nhập lại; token cũ bị thu hồi. Ghi dữ liệu lỗi sẽ hoàn tác thay đổi trong bộ nhớ.

Giao diện TLuxury có nút **So sánh sản phẩm** trên thẻ và trang chi tiết: chọn tối đa 3 sản phẩm, mở bảng so sánh giá, danh mục, size, màu và tình trạng hàng. Danh sách so sánh giữ trong bộ nhớ trang. Mục **Bạn vừa xem** lưu tối đa 8 mã sản phẩm trên trình duyệt, hiển thị 4 sản phẩm gần nhất còn trong catalog; có nút xóa lịch sử xem.

Hệ thống hiện hỗ trợ thanh toán COD và ghi nhận thủ công trạng thái đã thu tiền; chưa kết nối cổng thanh toán online. Vận đơn có thể nhập thủ công; chưa gọi API hãng vận chuyển để tạo vận đơn hoặc đồng bộ trạng thái. Khôi phục mật khẩu qua email cần cấu hình Resend. Cơ sở dữ liệu vẫn là JSON cho một instance; trên Render phải cấu hình persistent disk để giữ dữ liệu và ảnh sau deploy, hoặc chuyển sang PostgreSQL trước khi chạy nhiều instance.
