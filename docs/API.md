# Home Shopping App — API reference

OpenAPI 3.0.3. Các ví dụ là dữ liệu minh họa; gọi API đọc để lấy ID thật.

Swagger: `/api-docs`. JSON: `/api/openapi.json`. Postman: `/api/postman.json`.

## Luồng thử nhanh

1. GET /api/products để chọn ID và biến thể.
2. POST /api/auth/register hoặc /api/auth/login, lấy token khách.
3. PUT /api/cart, POST /api/checkout/quote.
4. POST /api/orders với expectedTotal từ báo giá.
5. Quản trị xác nhận/giao/hoàn thành đơn theo trạng thái hợp lệ.
6. Khách xem đơn, đánh giá sau hoàn thành hoặc gửi yêu cầu hỗ trợ.

Cookie quản trị cần X-Requested-With: shop-admin khi ghi. JWT hết hạn sau 24 giờ; cookie quản trị 8 giờ. Secret chỉ cấu hình ở client riêng, không nằm trong file này.

## GET /health

Kiểm tra server

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "status": "ok",
  "version": "dev"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/auth/recovery-options

Available recovery methods

Returns emailEnabled and authenticatorEnabled flags for the storefront.

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/forgot-password

Yêu cầu email khôi phục mật khẩu

Phản hồi chung cho email có hoặc không có tài khoản. Liên kết dùng một lần, hết hạn sau 15 phút. Cần RESEND_API_KEY, MAIL_FROM và PUBLIC_URL; thiếu cấu hình trả 503. Không hỗ trợ tài khoản quản trị.

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "email": "customer@example.com"
}
```

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

### HTTP 503

Yêu cầu thất bại; xem error để biết nguyên nhân.

## POST /api/auth/reset-totp-password

Reset password with authenticator TOTP

Requires a previously enrolled TOTP secret. Codes are time-based, single-use, and old customer sessions are revoked.

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "phone": "0901234567",
  "otp": "123456",
  "newPassword": "Example-new-password-123"
}
```

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/auth/totp/status

Read current account TOTP status

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/totp/setup

Create a temporary TOTP enrollment secret

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/totp/enable

Confirm and enable TOTP

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "otp": "123456"
}
```

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/totp/disable

Disable TOTP with a current code

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "otp": "123456"
}
```

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/reset-password

Đặt mật khẩu mới từ liên kết khôi phục

Token hợp lệ dùng một lần; mật khẩu mới từ 8–256 ký tự. Thu hồi tất cả phiên đăng nhập khách hàng. Token hết hạn, đã dùng hoặc bị vô hiệu hóa trả 400.

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "token": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "newPassword": "Example-new-password-123"
}
```

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/addresses

Sổ địa chỉ của tôi

GET chỉ đọc sổ của tài khoản hiện tại. PUT thay thế toàn bộ sổ, tối đa 10 địa chỉ; ID không trùng và chỉ một địa chỉ mặc định. Danh sách rỗng xóa sổ. Nếu chưa có mặc định, server chọn địa chỉ đầu tiên.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "id": "1",
      "name": "Nguyễn Văn A",
      "phone": "0901234567",
      "city": "Hồ Chí Minh",
      "ward": "Phường Bến Nghé",
      "district": "",
      "address": "12 Nguyễn Huệ",
      "isDefault": true
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PUT /api/addresses

Lưu tối đa 10 địa chỉ

GET chỉ đọc sổ của tài khoản hiện tại. PUT thay thế toàn bộ sổ, tối đa 10 địa chỉ; ID không trùng và chỉ một địa chỉ mặc định. Danh sách rỗng xóa sổ. Nếu chưa có mặc định, server chọn địa chỉ đầu tiên.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "items": [
    {
      "id": "1",
      "name": "Nguyễn Văn A",
      "phone": "0901234567",
      "city": "Hồ Chí Minh",
      "ward": "Phường Bến Nghé",
      "district": "",
      "address": "12 Nguyễn Huệ",
      "isDefault": true
    }
  ]
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "id": "1",
      "name": "Nguyễn Văn A",
      "phone": "0901234567",
      "city": "Hồ Chí Minh",
      "ward": "Phường Bến Nghé",
      "district": "",
      "address": "12 Nguyễn Huệ",
      "isDefault": true
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/products/{id}/reviews

Đánh giá công khai từ người đã mua

GET công khai chỉ gồm đánh giá không bị ẩn; average và count tính từ dữ liệu thật. POST yêu cầu tài khoản có đơn done chứa sản phẩm. Mỗi tài khoản chỉ một đánh giá/sản phẩm; không tạo đánh giá giả.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "id": "1",
      "productId": 1,
      "name": "Nguyễn Văn A",
      "rating": 5,
      "comment": "Sản phẩm đúng mô tả, đóng gói cẩn thận.",
      "images": [
        "Ví dụ"
      ],
      "createdAt": "2026-10-19T01:00:00.000Z",
      "verified": true
    }
  ],
  "count": 1,
  "average": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/products/{id}/reviews

Đánh giá sản phẩm đã mua trong đơn hoàn thành

GET công khai chỉ gồm đánh giá không bị ẩn; average và count tính từ dữ liệu thật. POST yêu cầu tài khoản có đơn done chứa sản phẩm. Mỗi tài khoản chỉ một đánh giá/sản phẩm; không tạo đánh giá giả.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "rating": 5,
  "comment": "Sản phẩm đúng mô tả, đóng gói cẩn thận.",
  "images": [
    "Ví dụ"
  ]
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "id": "1",
      "productId": 1,
      "name": "Nguyễn Văn A",
      "rating": 5,
      "comment": "Sản phẩm đúng mô tả, đóng gói cẩn thận.",
      "images": [
        "Ví dụ"
      ],
      "createdAt": "2026-10-19T01:00:00.000Z",
      "verified": true
    }
  ],
  "count": 1,
  "average": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/products/{id}/reviews/images

Tải ảnh đánh giá đã mua (tối đa 5 MB)

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 201

Tạo tài nguyên thành công.

```json
{
  "image": "/images/products/lamp.jpg"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/orders/{id}/reorder

Thêm lại sản phẩm của đơn vào giỏ với giá và tồn kho hiện tại

Chỉ chủ đơn được mua lại. Thêm các dòng cũ vào giỏ hiện tại và kiểm tra theo catalog mới. Không tự tạo đơn, áp dụng lại voucher hay giữ giá cũ. Nếu có dòng không hợp lệ hoặc thiếu tồn kho, giỏ không thay đổi.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "added": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/support

Các phiếu hỗ trợ của tôi

Chỉ truy cập yêu cầu của chính tài khoản. Một đơn chỉ có một phiếu đang mở/xử lý. Loại return cần đơn done. Phiếu hỗ trợ không tự hoàn tiền, hoàn kho hoặc tạo vận đơn.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "id": "1",
      "userId": 1,
      "orderId": 1,
      "name": "Nguyễn Văn A",
      "type": "question",
      "message": "Tôi cần shop hỗ trợ kiểm tra đơn hàng.",
      "status": "open",
      "reply": "Shop đã tiếp nhận và đang kiểm tra.",
      "createdAt": "2026-10-19T01:00:00.000Z",
      "updatedAt": "2026-10-19T01:00:00.000Z"
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/support

Gửi yêu cầu hỗ trợ/đổi trả

Yêu cầu đổi trả cần đơn hoàn thành. Không tự hoàn tiền hoặc hoàn kho.

Chỉ truy cập yêu cầu của chính tài khoản. Một đơn chỉ có một phiếu đang mở/xử lý. Loại return cần đơn done. Phiếu hỗ trợ không tự hoàn tiền, hoàn kho hoặc tạo vận đơn.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "orderId": 1,
  "type": "question",
  "message": "Tôi cần shop hỗ trợ kiểm tra đơn hàng."
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": "1",
  "userId": 1,
  "orderId": 1,
  "name": "Nguyễn Văn A",
  "type": "question",
  "message": "Tôi cần shop hỗ trợ kiểm tra đơn hàng.",
  "status": "open",
  "reply": "Shop đã tiếp nhận và đang kiểm tra.",
  "createdAt": "2026-10-19T01:00:00.000Z",
  "updatedAt": "2026-10-19T01:00:00.000Z"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/support

Các yêu cầu hỗ trợ khách hàng

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": "1",
    "userId": 1,
    "orderId": 1,
    "name": "Nguyễn Văn A",
    "type": "question",
    "message": "Tôi cần shop hỗ trợ kiểm tra đơn hàng.",
    "status": "open",
    "reply": "Shop đã tiếp nhận và đang kiểm tra.",
    "createdAt": "2026-10-19T01:00:00.000Z",
    "updatedAt": "2026-10-19T01:00:00.000Z"
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/reviews

Các đánh giá của khách

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": "1",
    "productId": 1,
    "userId": 1,
    "name": "Nguyễn Văn A",
    "rating": 5,
    "comment": "Sản phẩm đúng mô tả, đóng gói cẩn thận.",
    "createdAt": "2026-10-19T01:00:00.000Z",
    "verified": true,
    "hidden": false
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/support/{ticketId}

Phản hồi phiếu hỗ trợ

Cập nhật trạng thái xử lý và phản hồi hiển thị cho chủ phiếu. Thao tác này không tự chuyển tiền hoặc thay đổi tồn kho/đơn hàng.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| ticketId | path | Có | UUID trả về khi tạo phiếu/đánh giá. |

Request mẫu:

```json
{
  "status": "open",
  "reply": "Shop đã tiếp nhận và đang kiểm tra."
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": "1",
  "userId": 1,
  "orderId": 1,
  "name": "Nguyễn Văn A",
  "type": "question",
  "message": "Tôi cần shop hỗ trợ kiểm tra đơn hàng.",
  "status": "open",
  "reply": "Shop đã tiếp nhận và đang kiểm tra.",
  "createdAt": "2026-10-19T01:00:00.000Z",
  "updatedAt": "2026-10-19T01:00:00.000Z"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/reviews/{reviewId}

Ẩn/hiện đánh giá

Chỉ cập nhật hidden kiểu boolean. Đánh giá ẩn không xuất hiện trong danh sách công khai và không tính vào trung bình sao.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| reviewId | path | Có | UUID trả về khi tạo phiếu/đánh giá. |

Request mẫu:

```json
{
  "hidden": false
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": "1",
  "productId": 1,
  "userId": 1,
  "name": "Nguyễn Văn A",
  "rating": 5,
  "comment": "Sản phẩm đúng mô tả, đóng gói cẩn thận.",
  "createdAt": "2026-10-19T01:00:00.000Z",
  "verified": true,
  "hidden": false
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/info

Thông tin phiên bản

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "name": "Home Shopping App",
  "status": "ok",
  "version": "dev"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/account/overview

Hồ sơ chi tiết và thống kê mua sắm riêng tư

Chỉ trả thống kê của khách đăng nhập: đơn theo trạng thái, chi tiêu đơn hoàn thành, số địa chỉ/đánh giá/yêu cầu đang xử lý và địa chỉ mặc định. Không nhận userId từ client.

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "username": "khachhang01",
    "email": "khach@example.com",
    "phone": "0901234567",
    "address": "12 Nguyễn Huệ",
    "birthday": "1995-05-20",
    "gender": "",
    "bio": "Ví dụ",
    "avatarColor": "sage",
    "createdAt": "2026-10-19T01:00:00.000Z"
  },
  "stats": {
    "orders": 1,
    "completed": 1,
    "inProgress": 1,
    "cancelled": 1,
    "totalSpent": 1,
    "addresses": 1,
    "reviews": 1,
    "openSupport": 1
  },
  "defaultAddress": {
    "id": "1",
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "city": "Hồ Chí Minh",
    "ward": "Phường Bến Nghé",
    "district": "",
    "address": "12 Nguyễn Huệ",
    "isDefault": true
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/contact

Thông tin liên hệ công khai của shop

Thông tin công khai của shop. Bỏ trống để ẩn kênh chưa dùng; Facebook/Messenger chỉ nhận HTTPS trên tên miền chính thức. PUT cập nhật các trường gửi lên và giữ các trường còn lại.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "phone": "0901234567",
  "zaloPhone": "",
  "facebookName": "Tên Facebook shop",
  "facebookUrl": "",
  "messengerUrl": "",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "hours": "8:00–21:00"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/contact

Đọc cấu hình liên hệ

Thông tin công khai của shop. Bỏ trống để ẩn kênh chưa dùng; Facebook/Messenger chỉ nhận HTTPS trên tên miền chính thức. PUT cập nhật các trường gửi lên và giữ các trường còn lại.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "phone": "0901234567",
  "zaloPhone": "",
  "facebookName": "Tên Facebook shop",
  "facebookUrl": "",
  "messengerUrl": "",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "hours": "8:00–21:00"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PUT /api/admin/contact

Lưu cấu hình liên hệ

Bỏ trống kênh không dùng. Facebook/Messenger phải là URL HTTPS trên tên miền chính thức.

Thông tin công khai của shop. Bỏ trống để ẩn kênh chưa dùng; Facebook/Messenger chỉ nhận HTTPS trên tên miền chính thức. PUT cập nhật các trường gửi lên và giữ các trường còn lại.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "phone": "0901234567",
  "zaloPhone": "",
  "facebookName": "Tên Facebook shop",
  "facebookUrl": "",
  "messengerUrl": "",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "hours": "8:00–21:00"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "phone": "0901234567",
  "zaloPhone": "",
  "facebookName": "Tên Facebook shop",
  "facebookUrl": "",
  "messengerUrl": "",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "hours": "8:00–21:00"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/products

Danh sách sản phẩm

Trả toàn bộ sản phẩm khớp q và category; endpoint này không phân trang. Dùng /api/v1/vn/vi/products nếu cần phân trang. Bộ lọc giá trên trang cửa hàng hiện được xử lý ở client.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| q | query | Không | Tìm kiếm theo nội dung sản phẩm. |
| category | query | Không | Tên danh mục chính xác. |

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "name": "Áo thun basic trắng",
    "category": "Thời trang",
    "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
    "image": "/images/product-placeholder.svg",
    "price": 149000,
    "stock": 20,
    "sizes": [
      "M",
      "L"
    ],
    "colors": [
      "Trắng",
      "Đen"
    ],
    "gender": "all",
    "subCategory": "home",
    "emoji": "⌂"
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/products/{id}

Chi tiết sản phẩm

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "name": "Áo thun basic trắng",
  "category": "Thời trang",
  "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
  "image": "/images/product-placeholder.svg",
  "price": 149000,
  "stock": 20,
  "sizes": [
    "M",
    "L"
  ],
  "colors": [
    "Trắng",
    "Đen"
  ],
  "gender": "all",
  "subCategory": "home",
  "emoji": "⌂"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/categories

Danh mục

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  "Ví dụ"
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/register

Đăng ký khách hàng

Tên, tên đăng nhập và mật khẩu bắt buộc; email tùy chọn. Mật khẩu tối thiểu 6 ký tự. Username/email được kiểm tra trùng không phân biệt hoa thường. Tên admin được dành riêng. Token hết hạn sau 24 giờ.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "name": "Nguyễn Văn A",
  "username": "khachhang01",
  "password": "MatKhau123!"
}
```

### HTTP 201

Tạo tài nguyên thành công.

```json
{
  "token": "<JWT nhận từ đăng nhập>",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "username": "khachhang01",
    "email": "khach@example.com",
    "phone": "0901234567",
    "address": "12 Nguyễn Huệ",
    "birthday": "1995-05-20",
    "gender": "",
    "bio": "Ví dụ",
    "avatarColor": "sage",
    "createdAt": "2026-10-19T01:00:00.000Z"
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/login

Đăng nhập lấy Bearer token

Nhập username hoặc email cùng password. Khách nhận JWT. Username admin dùng mật khẩu cấu hình server, nhận cookie HttpOnly và redirect /admin thay cho JWT. POST auth có giới hạn thử theo IP.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "username": "khachhang01",
  "password": "MatKhau123!"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "token": "<JWT nhận từ đăng nhập>",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "username": "khachhang01",
    "email": "khach@example.com",
    "phone": "0901234567",
    "address": "12 Nguyễn Huệ",
    "birthday": "1995-05-20",
    "gender": "",
    "bio": "Ví dụ",
    "avatarColor": "sage",
    "createdAt": "2026-10-19T01:00:00.000Z"
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/auth/me

Hồ sơ của tôi

GET đọc hồ sơ. PATCH nhận name, email, phone, address, birthday, gender, bio, avatarColor và ít nhất một trường. Ngày sinh/giới tính/giới thiệu là tùy chọn, có thể xóa bằng chuỗi rỗng. Email phải không trùng với tài khoản khác. Không thể đổi username hoặc vai trò qua API này.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "username": "khachhang01",
    "email": "khach@example.com",
    "phone": "0901234567",
    "address": "12 Nguyễn Huệ",
    "birthday": "1995-05-20",
    "gender": "",
    "bio": "Ví dụ",
    "avatarColor": "sage",
    "createdAt": "2026-10-19T01:00:00.000Z"
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/auth/me

Cập nhật hồ sơ

GET đọc hồ sơ. PATCH nhận name, email, phone, address, birthday, gender, bio, avatarColor và ít nhất một trường. Ngày sinh/giới tính/giới thiệu là tùy chọn, có thể xóa bằng chuỗi rỗng. Email phải không trùng với tài khoản khác. Không thể đổi username hoặc vai trò qua API này.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "name": "Nguyễn Văn A",
  "phone": "0901234567"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "username": "khachhang01",
    "email": "khach@example.com",
    "phone": "0901234567",
    "address": "12 Nguyễn Huệ",
    "birthday": "1995-05-20",
    "gender": "",
    "bio": "Ví dụ",
    "avatarColor": "sage",
    "createdAt": "2026-10-19T01:00:00.000Z"
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/password

Đổi mật khẩu và thu hồi token

Cần mật khẩu hiện tại và mật khẩu mới 8–256 ký tự. Thành công thu hồi mọi JWT hiện có của tài khoản; đăng nhập lại để tiếp tục.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "currentPassword": "MatKhau123!A",
  "newPassword": "MatKhauMoi456!"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "changed": true,
  "requiresLogin": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/auth/logout

Đăng xuất, thu hồi mọi token

Thu hồi mọi JWT hiện có của tài khoản, gồm token đang dùng. Xóa token trong ứng dụng sau khi thành công.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "loggedOut": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/cart

Đọc giỏ hàng

Giỏ riêng theo tài khoản. PUT thay thế toàn bộ giỏ; items rỗng làm trống giỏ. Server kiểm tra sản phẩm, quy cách, màu và tồn kho. DELETE làm trống giỏ. Giá trả về lấy từ catalog hiện tại.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "size": "M",
      "color": "Trắng",
      "product": {
        "id": 1,
        "name": "Áo thun basic trắng",
        "category": "Thời trang",
        "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
        "image": "/images/product-placeholder.svg",
        "price": 149000,
        "stock": 20,
        "sizes": [
          "M",
          "L"
        ],
        "colors": [
          "Trắng",
          "Đen"
        ],
        "gender": "all",
        "subCategory": "home",
        "emoji": "⌂"
      },
      "available": true
    }
  ],
  "subtotal": 149000
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PUT /api/cart

Lưu giỏ hàng

Giỏ riêng theo tài khoản. PUT thay thế toàn bộ giỏ; items rỗng làm trống giỏ. Server kiểm tra sản phẩm, quy cách, màu và tồn kho. DELETE làm trống giỏ. Giá trả về lấy từ catalog hiện tại.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1
    }
  ]
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "size": "M",
      "color": "Trắng",
      "product": {
        "id": 1,
        "name": "Áo thun basic trắng",
        "category": "Thời trang",
        "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
        "image": "/images/product-placeholder.svg",
        "price": 149000,
        "stock": 20,
        "sizes": [
          "M",
          "L"
        ],
        "colors": [
          "Trắng",
          "Đen"
        ],
        "gender": "all",
        "subCategory": "home",
        "emoji": "⌂"
      },
      "available": true
    }
  ],
  "subtotal": 149000
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## DELETE /api/cart

Xóa giỏ hàng

Giỏ riêng theo tài khoản. PUT thay thế toàn bộ giỏ; items rỗng làm trống giỏ. Server kiểm tra sản phẩm, quy cách, màu và tồn kho. DELETE làm trống giỏ. Giá trả về lấy từ catalog hiện tại.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "size": "M",
      "color": "Trắng",
      "product": {
        "id": 1,
        "name": "Áo thun basic trắng",
        "category": "Thời trang",
        "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
        "image": "/images/product-placeholder.svg",
        "price": 149000,
        "stock": 20,
        "sizes": [
          "M",
          "L"
        ],
        "colors": [
          "Trắng",
          "Đen"
        ],
        "gender": "all",
        "subCategory": "home",
        "emoji": "⌂"
      },
      "available": true
    }
  ],
  "subtotal": 149000
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/wishlist

Danh sách yêu thích

Danh sách riêng theo tài khoản. PUT thay toàn bộ danh sách bằng productIds, tối đa 200 ID và loại bỏ ID trùng.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "products": [
    {
      "id": 1,
      "name": "Áo thun basic trắng",
      "category": "Thời trang",
      "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
      "image": "/images/product-placeholder.svg",
      "price": 149000,
      "stock": 20,
      "sizes": [
        "M",
        "L"
      ],
      "colors": [
        "Trắng",
        "Đen"
      ],
      "gender": "all",
      "subCategory": "home",
      "emoji": "⌂"
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PUT /api/wishlist

Lưu danh sách yêu thích

Danh sách riêng theo tài khoản. PUT thay toàn bộ danh sách bằng productIds, tối đa 200 ID và loại bỏ ID trùng.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "productIds": [
    1,
    2
  ]
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "productIds": [
    1
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/vouchers

Voucher còn hiệu lực

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "code": "DEMO10",
    "type": "percent",
    "value": 10,
    "minOrder": 0,
    "maxDiscount": 50000,
    "expiresAt": null,
    "description": "Mô tả sản phẩm hoặc chương trình ưu đãi."
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/checkout/quote

Tính giá và phí vận chuyển

Không tạo đơn hoặc giữ hàng. Server tính lại giá, gộp dòng cùng biến thể, kiểm tra tồn kho chung và voucher. parcel là kích thước, khối lượng ước tính theo các sản phẩm trong đơn; có thể nhập thông số đóng gói thực theo từng sản phẩm trong admin. Giỏ phải có 1–100 dòng, mỗi dòng 1–99 sản phẩm. Phí cơ bản 30.000 VND; voucher shipping có thể giảm phí về 0. Sử dụng total làm expectedTotal khi đặt hàng.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1
    }
  ]
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "product_id": 1,
      "name": "Nguyễn Văn A",
      "category": "Trang trí",
      "price": 149000,
      "size": "M",
      "color": "Trắng",
      "quantity": 1,
      "shippingWeightG": 1,
      "shippingLengthCm": 1,
      "shippingWidthCm": 1,
      "shippingHeightCm": 1
    }
  ],
  "parcel": {
    "weight": 1,
    "length": 1,
    "width": 1,
    "height": 1,
    "estimated": false
  },
  "subtotal": 149000,
  "shippingFee": 30000,
  "discount": 0,
  "total": 179000,
  "voucherCode": "",
  "voucherId": null
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/orders

Đặt hàng COD (cần đăng nhập)

Cần khách đăng nhập. Server kiểm tra dữ liệu và tính lại báo giá trước khi tạo đơn. Thành công trừ tồn kho, tăng lượt voucher và xóa giỏ server của khách. expectedTotal sai trả 409 và không tạo đơn. Chỉ có COD.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "customer": {
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "12 Bạch Đằng, Đà Nẵng"
  },
  "items": [
    {
      "productId": 1,
      "quantity": 1
    }
  ],
  "paymentMethod": "cod"
}
```

### HTTP 201

Tạo tài nguyên thành công.

```json
{
  "id": 1,
  "customer_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "user_id": 1,
  "paymentMethod": "cod",
  "paymentStatus": "unpaid",
  "paidAt": "Ví dụ",
  "shipment": {
    "carrier": "Ví dụ",
    "trackingNumber": "Ví dụ",
    "trackingUrl": "Ví dụ",
    "updatedAt": "2026-10-19T01:00:00.000Z"
  },
  "items": [
    {
      "product_id": 1,
      "name": "Nguyễn Văn A",
      "category": "Trang trí",
      "price": 149000,
      "size": "M",
      "color": "Trắng",
      "quantity": 1,
      "shippingWeightG": 1,
      "shippingLengthCm": 1,
      "shippingWidthCm": 1,
      "shippingHeightCm": 1
    }
  ],
  "parcel": {
    "weight": 1,
    "length": 1,
    "width": 1,
    "height": 1,
    "estimated": false
  },
  "subtotal": 149000,
  "shippingFee": 30000,
  "discount": 0,
  "total": 179000,
  "voucherCode": "",
  "voucherId": null,
  "status": "new",
  "created_at": "2026-10-19T01:00:00.000Z"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/orders/mine

Lịch sử đơn của tôi

Chỉ trả đơn của tài khoản hiện tại, mới nhất trước. Không nhận userId từ client để chọn khách khác.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "customer_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "khach@example.com",
    "address": "12 Nguyễn Huệ",
    "user_id": 1,
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "paidAt": "Ví dụ",
    "shipment": {
      "carrier": "Ví dụ",
      "trackingNumber": "Ví dụ",
      "trackingUrl": "Ví dụ",
      "updatedAt": "2026-10-19T01:00:00.000Z"
    },
    "items": [
      {
        "product_id": 1,
        "name": "Nguyễn Văn A",
        "category": "Trang trí",
        "price": 149000,
        "size": "M",
        "color": "Trắng",
        "quantity": 1,
        "shippingWeightG": 1,
        "shippingLengthCm": 1,
        "shippingWidthCm": 1,
        "shippingHeightCm": 1
      }
    ],
    "parcel": {
      "weight": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "estimated": false
    },
    "subtotal": 149000,
    "shippingFee": 30000,
    "discount": 0,
    "total": 179000,
    "voucherCode": "",
    "voucherId": null,
    "status": "new",
    "created_at": "2026-10-19T01:00:00.000Z"
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/orders/{id}

Tra đơn bằng mã và số điện thoại

Tra cứu bằng ID đơn và số điện thoại trùng với đơn. Sai số điện thoại hoặc không có đơn đều trả 404 để tránh lộ thông tin.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |
| phone | query | Có | Số điện thoại đã dùng khi đặt đơn. |

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "customer_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "user_id": 1,
  "paymentMethod": "cod",
  "paymentStatus": "unpaid",
  "paidAt": "Ví dụ",
  "shipment": {
    "carrier": "Ví dụ",
    "trackingNumber": "Ví dụ",
    "trackingUrl": "Ví dụ",
    "updatedAt": "2026-10-19T01:00:00.000Z"
  },
  "items": [
    {
      "product_id": 1,
      "name": "Nguyễn Văn A",
      "category": "Trang trí",
      "price": 149000,
      "size": "M",
      "color": "Trắng",
      "quantity": 1,
      "shippingWeightG": 1,
      "shippingLengthCm": 1,
      "shippingWidthCm": 1,
      "shippingHeightCm": 1
    }
  ],
  "parcel": {
    "weight": 1,
    "length": 1,
    "width": 1,
    "height": 1,
    "estimated": false
  },
  "subtotal": 149000,
  "shippingFee": 30000,
  "discount": 0,
  "total": 179000,
  "voucherCode": "",
  "voucherId": null,
  "status": "new",
  "created_at": "2026-10-19T01:00:00.000Z"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/orders/{id}/cancel

Hủy đơn mới của tôi

Chỉ chủ đơn được hủy đơn new. Đơn đã cancelled trả kết quả cũ và không hoàn kho/lượt voucher lần hai. Đơn đã confirmed, shipping hoặc done không được khách tự hủy.

Khách hàng: Authorization: Bearer <token>.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "customer_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "user_id": 1,
  "paymentMethod": "cod",
  "paymentStatus": "unpaid",
  "paidAt": "Ví dụ",
  "shipment": {
    "carrier": "Ví dụ",
    "trackingNumber": "Ví dụ",
    "trackingUrl": "Ví dụ",
    "updatedAt": "2026-10-19T01:00:00.000Z"
  },
  "items": [
    {
      "product_id": 1,
      "name": "Nguyễn Văn A",
      "category": "Trang trí",
      "price": 149000,
      "size": "M",
      "color": "Trắng",
      "quantity": 1,
      "shippingWeightG": 1,
      "shippingLengthCm": 1,
      "shippingWidthCm": 1,
      "shippingHeightCm": 1
    }
  ],
  "parcel": {
    "weight": 1,
    "length": 1,
    "width": 1,
    "height": 1,
    "estimated": false
  },
  "subtotal": 149000,
  "shippingFee": 30000,
  "discount": 0,
  "total": 179000,
  "voucherCode": "",
  "voucherId": null,
  "status": "new",
  "created_at": "2026-10-19T01:00:00.000Z"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/login

Đăng nhập chủ shop hoặc nhân viên bằng cookie

Chủ shop dùng username admin và ADMIN_TOKEN. Nhân viên dùng tài khoản được chủ shop tạo trong trang quản trị.

Mật khẩu quản trị lấy từ cấu hình ADMIN_TOKEN. Thành công tạo cookie shop_admin HttpOnly, SameSite=Strict, hết hạn sau 8 giờ. Không có secret thật trong tài liệu.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "username": "khachhang01",
  "password": "MatKhau123!A"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "authenticated": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 429

Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/logout

Đăng xuất quản trị

Thu hồi phiên cookie hiện tại và xóa cookie. Xóa AdminToken trong client nếu trước đó đã Authorize bằng header; API key trong cấu hình server không bị thu hồi bởi logout.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "loggedOut": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/session

Kiểm tra phiên

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "authenticated": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/stats

Thống kê

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "users": 1,
  "lockedUsers": 1,
  "products": 1,
  "lowStock": 1,
  "orders": 1,
  "ordersByStatus": {},
  "revenue": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/users

Danh sách tài khoản

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "name": "Nguyễn Văn A",
    "username": "khachhang01",
    "email": "khach@example.com",
    "createdAt": "2026-10-19T01:00:00.000Z",
    "disabled": false,
    "orderCount": 1
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/users/{id}/orders

Đơn của tài khoản

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "customer_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "khach@example.com",
    "address": "12 Nguyễn Huệ",
    "user_id": 1,
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "paidAt": "Ví dụ",
    "shipment": {
      "carrier": "Ví dụ",
      "trackingNumber": "Ví dụ",
      "trackingUrl": "Ví dụ",
      "updatedAt": "2026-10-19T01:00:00.000Z"
    },
    "items": [
      {
        "product_id": 1,
        "name": "Nguyễn Văn A",
        "category": "Trang trí",
        "price": 149000,
        "size": "M",
        "color": "Trắng",
        "quantity": 1,
        "shippingWeightG": 1,
        "shippingLengthCm": 1,
        "shippingWidthCm": 1,
        "shippingHeightCm": 1
      }
    ],
    "parcel": {
      "weight": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "estimated": false
    },
    "subtotal": 149000,
    "shippingFee": 30000,
    "discount": 0,
    "total": 179000,
    "voucherCode": "",
    "voucherId": null,
    "status": "new",
    "created_at": "2026-10-19T01:00:00.000Z"
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/orders

Danh sách đơn

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "customer_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "khach@example.com",
    "address": "12 Nguyễn Huệ",
    "user_id": 1,
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "paidAt": "Ví dụ",
    "shipment": {
      "carrier": "Ví dụ",
      "trackingNumber": "Ví dụ",
      "trackingUrl": "Ví dụ",
      "updatedAt": "2026-10-19T01:00:00.000Z"
    },
    "items": [
      {
        "product_id": 1,
        "name": "Nguyễn Văn A",
        "category": "Trang trí",
        "price": 149000,
        "size": "M",
        "color": "Trắng",
        "quantity": 1,
        "shippingWeightG": 1,
        "shippingLengthCm": 1,
        "shippingWidthCm": 1,
        "shippingHeightCm": 1
      }
    ],
    "parcel": {
      "weight": 1,
      "length": 1,
      "width": 1,
      "height": 1,
      "estimated": false
    },
    "subtotal": 149000,
    "shippingFee": 30000,
    "discount": 0,
    "total": 179000,
    "voucherCode": "",
    "voucherId": null,
    "status": "new",
    "created_at": "2026-10-19T01:00:00.000Z"
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/integrations

Trạng thái cấu hình dịch vụ

Chỉ trả trạng thái đã cấu hình, không trả token hay secret của nhà cung cấp.

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "emailConfigured": false,
  "shipping": {
    "provider": "Ví dụ",
    "configured": false,
    "automatic": false,
    "webhookConfigured": false
  },
  "payment": {
    "online": false,
    "methods": [
      "Ví dụ"
    ]
  },
  "storage": {
    "type": "Ví dụ",
    "multiInstance": false
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/staff

Danh sách nhân viên (chủ shop)

Chỉ chủ shop được xem và quản lý tài khoản nhân viên.

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/staff

Tạo tài khoản nhân viên (chủ shop)

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "name": "Nguyễn Văn A",
  "username": "khachhang01",
  "password": "MatKhau123!A"
}
```

### HTTP 201

Tạo tài nguyên thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/staff/{id}

Khóa/mở khóa hoặc đặt lại mật khẩu nhân viên (chủ shop)

Chỉ chủ shop được gọi. Đặt lại mật khẩu hoặc khóa tài khoản sẽ thu hồi phiên đăng nhập đang hoạt động.

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "disabled": false,
  "password": "MatKhau123!A"
}
```

### HTTP 200

Xử lý thành công.

```json
{}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/orders/{id}/shipment/ghn/simulate

Mô phỏng tạo vận đơn GHN

Chỉ trả về mã mô phỏng. Không gọi GHN, không ghi dữ liệu đơn hàng và không tạo vận đơn thật.

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "mode": "simulation",
  "clientOrderCode": "Ví dụ",
  "trackingNumber": "Ví dụ",
  "codAmount": 1,
  "message": "Tôi cần shop hỗ trợ kiểm tra đơn hàng."
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/users/{id}

Khóa hoặc mở tài khoản

Chỉ cho phép trường disabled kiểu boolean. Tài khoản khóa không sử dụng được các API khách hàng; không thay đổi đơn lịch sử.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "disabled": true
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "username": "khachhang01",
  "email": "khach@example.com",
  "createdAt": "2026-10-19T01:00:00.000Z",
  "disabled": false,
  "orderCount": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/orders/{id}

Cập nhật trạng thái, thanh toán COD hoặc vận đơn

Luồng đơn: new → confirmed → shipping → done. COD chỉ được đánh dấu đã thu khi đơn đang giao hoặc hoàn thành. Lưu thông tin vận chuyển thủ công; link tra cứu phải dùng HTTPS.

Luồng hợp lệ: new → confirmed → shipping → done. Có thể chuyển sang cancelled từ new, confirmed hoặc shipping. Đơn done/cancelled không mở lại. Chủ shop có thể cập nhật số di động nhận hàng cho đơn new/confirmed chưa có vận đơn; số phải theo dạng 03/05/07/08/09 và đủ 10 số. Hủy đơn hoàn kho và lượt voucher đúng một lần.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "status": "new",
  "paymentStatus": "paid",
  "shipment": {
    "carrier": "Ví dụ",
    "trackingNumber": "Ví dụ",
    "trackingUrl": "Ví dụ"
  }
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "customer_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "khach@example.com",
  "address": "12 Nguyễn Huệ",
  "user_id": 1,
  "paymentMethod": "cod",
  "paymentStatus": "unpaid",
  "paidAt": "Ví dụ",
  "shipment": {
    "carrier": "Ví dụ",
    "trackingNumber": "Ví dụ",
    "trackingUrl": "Ví dụ",
    "updatedAt": "2026-10-19T01:00:00.000Z"
  },
  "items": [
    {
      "product_id": 1,
      "name": "Nguyễn Văn A",
      "category": "Trang trí",
      "price": 149000,
      "size": "M",
      "color": "Trắng",
      "quantity": 1,
      "shippingWeightG": 1,
      "shippingLengthCm": 1,
      "shippingWidthCm": 1,
      "shippingHeightCm": 1
    }
  ],
  "parcel": {
    "weight": 1,
    "length": 1,
    "width": 1,
    "height": 1,
    "estimated": false
  },
  "subtotal": 149000,
  "shippingFee": 30000,
  "discount": 0,
  "total": 179000,
  "voucherCode": "",
  "voucherId": null,
  "status": "new",
  "created_at": "2026-10-19T01:00:00.000Z"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/categories

Danh mục sản phẩm

Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  "Ví dụ"
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/categories

Thêm danh mục

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "name": "Nguyễn Văn A"
}
```

### HTTP 201

Tạo tài nguyên thành công.

```json
[
  "Ví dụ"
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/categories/{name}

Đổi tên danh mục và cập nhật sản phẩm

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| name | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "name": "Nguyễn Văn A"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "name": "Nguyễn Văn A"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## DELETE /api/admin/categories/{name}

Xóa danh mục đang trống

Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| name | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "name": "Nguyễn Văn A"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/products

Danh sách products

POST yêu cầu name, category, price, stock; sizes/colors mặc định One Size/Mặc định nếu bỏ qua. PATCH ghép với dữ liệu hiện có rồi kiểm tra toàn bộ sản phẩm. Giá không âm, tồn kho 0–1.000.000. Xóa sản phẩm không xóa bản chụp trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "name": "Áo thun basic trắng",
    "category": "Thời trang",
    "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
    "image": "/images/product-placeholder.svg",
    "price": 149000,
    "stock": 20,
    "sizes": [
      "M",
      "L"
    ],
    "colors": [
      "Trắng",
      "Đen"
    ],
    "gender": "all",
    "subCategory": "home",
    "emoji": "⌂"
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/products

Thêm products

POST yêu cầu name, category, price, stock; sizes/colors mặc định One Size/Mặc định nếu bỏ qua. PATCH ghép với dữ liệu hiện có rồi kiểm tra toàn bộ sản phẩm. Giá không âm, tồn kho 0–1.000.000. Xóa sản phẩm không xóa bản chụp trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "name": "Áo thun demo",
  "category": "Áo",
  "price": 199000,
  "stock": 20,
  "sizes": [
    "M",
    "L"
  ],
  "colors": [
    "Đen"
  ]
}
```

### HTTP 201

Tạo tài nguyên thành công.

```json
{
  "id": 1,
  "name": "Áo thun basic trắng",
  "category": "Thời trang",
  "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
  "image": "/images/product-placeholder.svg",
  "price": 149000,
  "stock": 20,
  "sizes": [
    "M",
    "L"
  ],
  "colors": [
    "Trắng",
    "Đen"
  ],
  "gender": "all",
  "subCategory": "home",
  "emoji": "⌂"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/products/{id}

Sửa products

POST yêu cầu name, category, price, stock; sizes/colors mặc định One Size/Mặc định nếu bỏ qua. PATCH ghép với dữ liệu hiện có rồi kiểm tra toàn bộ sản phẩm. Giá không âm, tồn kho 0–1.000.000. Xóa sản phẩm không xóa bản chụp trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "name": "Áo thun demo",
  "category": "Áo",
  "price": 199000,
  "stock": 20,
  "sizes": [
    "M",
    "L"
  ],
  "colors": [
    "Đen"
  ]
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "name": "Áo thun basic trắng",
  "category": "Thời trang",
  "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
  "image": "/images/product-placeholder.svg",
  "price": 149000,
  "stock": 20,
  "sizes": [
    "M",
    "L"
  ],
  "colors": [
    "Trắng",
    "Đen"
  ],
  "gender": "all",
  "subCategory": "home",
  "emoji": "⌂"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## DELETE /api/admin/products/{id}

Xóa products

POST yêu cầu name, category, price, stock; sizes/colors mặc định One Size/Mặc định nếu bỏ qua. PATCH ghép với dữ liệu hiện có rồi kiểm tra toàn bộ sản phẩm. Giá không âm, tồn kho 0–1.000.000. Xóa sản phẩm không xóa bản chụp trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "deleted": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/admin/vouchers

Danh sách vouchers

Loại percent: value 1–100; fixed: value từ 1 VND; shipping: value được đặt về 0. Mã chỉ gồm chữ/số/gạch ngang/gạch dưới và không được trùng. startsAt phải trước expiresAt. PATCH ghép dữ liệu hiện có. Xóa voucher không xóa thông tin trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
[
  {
    "id": 1,
    "code": "DEMO10",
    "type": "percent",
    "value": 10,
    "minOrder": 0,
    "maxDiscount": 50000,
    "expiresAt": null,
    "description": "Mô tả sản phẩm hoặc chương trình ưu đãi.",
    "startsAt": null,
    "active": true,
    "usageLimit": 100,
    "used": 1
  }
]
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/vouchers

Thêm vouchers

Loại percent: value 1–100; fixed: value từ 1 VND; shipping: value được đặt về 0. Mã chỉ gồm chữ/số/gạch ngang/gạch dưới và không được trùng. startsAt phải trước expiresAt. PATCH ghép dữ liệu hiện có. Xóa voucher không xóa thông tin trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "code": "DEMO10",
  "type": "percent",
  "value": 10,
  "minOrder": 0,
  "maxDiscount": 50000,
  "active": true
}
```

### HTTP 201

Tạo tài nguyên thành công.

```json
{
  "id": 1,
  "code": "DEMO10",
  "type": "percent",
  "value": 10,
  "minOrder": 0,
  "maxDiscount": 50000,
  "expiresAt": null,
  "description": "Mô tả sản phẩm hoặc chương trình ưu đãi.",
  "startsAt": null,
  "active": true,
  "usageLimit": 100,
  "used": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## PATCH /api/admin/vouchers/{id}

Sửa vouchers

Loại percent: value 1–100; fixed: value từ 1 VND; shipping: value được đặt về 0. Mã chỉ gồm chữ/số/gạch ngang/gạch dưới và không được trùng. startsAt phải trước expiresAt. PATCH ghép dữ liệu hiện có. Xóa voucher không xóa thông tin trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

Request mẫu:

```json
{
  "code": "DEMO10",
  "type": "percent",
  "value": 10,
  "minOrder": 0,
  "maxDiscount": 50000,
  "active": true
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "id": 1,
  "code": "DEMO10",
  "type": "percent",
  "value": 10,
  "minOrder": 0,
  "maxDiscount": 50000,
  "expiresAt": null,
  "description": "Mô tả sản phẩm hoặc chương trình ưu đãi.",
  "startsAt": null,
  "active": true,
  "usageLimit": 100,
  "used": 1
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## DELETE /api/admin/vouchers/{id}

Xóa vouchers

Loại percent: value 1–100; fixed: value từ 1 VND; shipping: value được đặt về 0. Mã chỉ gồm chữ/số/gạch ngang/gạch dưới và không được trùng. startsAt phải trước expiresAt. PATCH ghép dữ liệu hiện có. Xóa voucher không xóa thông tin trong đơn cũ.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "deleted": true
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/admin/images

Tải ảnh (PNG/JPG/WebP, tối đa 5 MB)

Gửi trực tiếp byte ảnh, không gửi multipart/form-data hoặc JSON base64. Server kiểm tra chữ ký PNG/JPEG/WebP, tối đa 5 MB. Kết quả là đường dẫn /uploads/... dùng ở trường image của sản phẩm.

Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 201

Tạo tài nguyên thành công.

```json
{
  "image": "/images/products/lamp.jpg"
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 401

Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.

### HTTP 403

Tài khoản không có quyền thực hiện thao tác này.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Ảnh vượt 5 MB.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/v1/vn/vi/categories

Danh mục nam

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "categories": [
    {
      "id": "1",
      "name": "Nguyễn Văn A",
      "parent": "Ví dụ"
    }
  ],
  "total": 179000
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/v1/vn/vi/products/section/men

Bộ sưu tập nam

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "pageTitle": "Ví dụ",
  "categories": [
    {
      "id": "1",
      "name": "Nguyễn Văn A",
      "parent": "Ví dụ"
    }
  ],
  "collectionHighlights": [
    {
      "title": "Ví dụ",
      "description": "Mô tả sản phẩm hoặc chương trình ưu đãi."
    }
  ],
  "stylingIdeas": [
    "Ví dụ"
  ],
  "filters": {
    "sizes": [
      "M",
      "L"
    ],
    "colors": [
      "Trắng",
      "Đen"
    ],
    "priceRanges": [
      "Ví dụ"
    ]
  },
  "products": [
    {
      "id": 1,
      "name": "Áo thun basic trắng",
      "category": "Thời trang",
      "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
      "image": "/images/product-placeholder.svg",
      "price": 149000,
      "stock": 20,
      "sizes": [
        "M",
        "L"
      ],
      "colors": [
        "Trắng",
        "Đen"
      ],
      "gender": "all",
      "subCategory": "home",
      "emoji": "⌂"
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/v1/vn/vi/products

Lọc, sắp xếp và phân trang

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| q | query | Không | Tìm kiếm theo nội dung sản phẩm. |
| category | query | Không | Tên danh mục chính xác. |
| gender | query | Không | Nhóm catalog; dùng all hoặc tham số phù hợp dữ liệu. |
| page | query | Không | Trang bắt đầu từ 1. |
| limit | query | Không | Số kết quả mỗi trang: 1–100. |
| sort | query | Không | Thứ tự sắp xếp kết quả. |

### HTTP 200

Xử lý thành công.

```json
{
  "items": [
    {
      "id": 1,
      "name": "Áo thun basic trắng",
      "category": "Thời trang",
      "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
      "image": "/images/product-placeholder.svg",
      "price": 149000,
      "stock": 20,
      "sizes": [
        "M",
        "L"
      ],
      "colors": [
        "Trắng",
        "Đen"
      ],
      "gender": "all",
      "subCategory": "home",
      "emoji": "⌂"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 1,
    "sort": "Ví dụ",
    "total": 179000,
    "totalPages": 1
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/v1/vn/vi/products/search

Tìm kiếm và gợi ý

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| query | query | Không | Từ khóa tìm kiếm. |
| gender | query | Không | Nhóm catalog; dùng all hoặc tham số phù hợp dữ liệu. |

### HTTP 200

Xử lý thành công.

```json
{
  "query": "Ví dụ",
  "suggestions": [
    {
      "name": "Nguyễn Văn A",
      "price": 149000,
      "image": "/images/products/lamp.jpg"
    }
  ],
  "results": [
    {
      "id": 1,
      "name": "Áo thun basic trắng",
      "category": "Thời trang",
      "description": "Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.",
      "image": "/images/product-placeholder.svg",
      "price": 149000,
      "stock": 20,
      "sizes": [
        "M",
        "L"
      ],
      "colors": [
        "Trắng",
        "Đen"
      ],
      "gender": "all",
      "subCategory": "home",
      "emoji": "⌂"
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/v1/vn/vi/products/filters

Bộ lọc

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

### HTTP 200

Xử lý thành công.

```json
{
  "sizes": [
    "M",
    "L"
  ],
  "colors": [
    "Trắng",
    "Đen"
  ],
  "priceRanges": [
    "Ví dụ"
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## GET /api/v1/vn/vi/products/{id}/stock

Tồn kho và biến thể

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

| Tham số | Vị trí | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| id | path | Có | ID nguyên dương của tài nguyên. |

### HTTP 200

Xử lý thành công.

```json
{
  "productId": 1,
  "stock": 20,
  "variants": [
    {
      "color": "Trắng",
      "size": "M",
      "available": true
    }
  ]
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 500

Máy chủ không xử lý được yêu cầu.

## POST /api/v1/vn/vi/size-recommendation

Gợi ý size demo

Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.

API công khai, không yêu cầu token.

Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.

Request mẫu:

```json
{
  "height": 170,
  "weight": 65,
  "fit": "regular"
}
```

### HTTP 200

Xử lý thành công.

```json
{
  "recommendedSize": "Ví dụ",
  "confidence": "Ví dụ",
  "breakpoints": {
    "height": 1,
    "weight": 1,
    "fit": "Ví dụ"
  }
}
```

### HTTP 400

Dữ liệu hoặc tham số không hợp lệ.

### HTTP 404

Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.

### HTTP 409

Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.

### HTTP 413

Body JSON vượt 1.000.000 byte.

### HTTP 500

Máy chủ không xử lý được yêu cầu.
