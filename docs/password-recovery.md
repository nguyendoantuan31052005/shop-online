# Khôi phục mật khẩu khách hàng

Khách hàng có thể đặt lại mật khẩu bằng một trong hai cách:

- Dùng liên kết email một lần, hết hạn sau 15 phút. Cần cấu hình Resend.
- Dùng mã 6 số từ ứng dụng Authenticator trên điện thoại. Mã hoạt động offline theo chuẩn TOTP và không gửi SMS, không phát sinh phí tin nhắn.

## Bật Authenticator

Đăng nhập, mở **Tài khoản của tôi → Thông tin cá nhân → Khôi phục miễn phí bằng Authenticator**. Lưu số điện thoại di động trong hồ sơ, bấm **Thiết lập Authenticator**, rồi thêm khóa thiết lập vào Google Authenticator, Microsoft Authenticator hoặc ứng dụng TOTP tương thích. Nhập mã hiện tại để xác nhận.

Khóa thiết lập chỉ hiện trong lúc thiết lập và hết hạn sau 10 phút. Giữ khóa bí mật; ai có khóa có thể tạo mã khôi phục. Mã thay đổi mỗi 30 giây. Mỗi mã chỉ dùng một lần để đổi mật khẩu. Người dùng cần bật Authenticator trước khi mất quyền truy cập tài khoản; tài khoản chưa bật vẫn cần email hoặc liên hệ shop.

## API

- `GET /api/auth/totp/status` — trạng thái Authenticator của tài khoản đang đăng nhập.
- `POST /api/auth/totp/setup` — tạo khóa TOTP tạm thời, yêu cầu đăng nhập và có số di động hợp lệ.
- `POST /api/auth/totp/enable` — xác nhận mã TOTP rồi bật.
- `POST /api/auth/totp/disable` — yêu cầu mã mới để tắt.
- `POST /api/auth/reset-totp-password` — đổi mật khẩu bằng số điện thoại và mã TOTP.

Máy chủ lưu khóa TOTP đã mã hóa AES-GCM bằng `JWT_SECRET`; không ghi khóa hoặc mã OTP vào log. Mỗi yêu cầu khôi phục bị giới hạn theo IP; mã đã dùng bị từ chối. Đổi mật khẩu thu hồi các phiên đăng nhập cũ.

## Khôi phục qua email

Thiết lập trong `.env` hoặc AWS Secrets Manager:

```dotenv
PUBLIC_URL=https://ten-mien-shop-cua-ban
RESEND_API_KEY=your-private-key
MAIL_FROM=Home Shopping <noreply@ten-mien-da-xac-minh>
```

Xác minh tên miền người gửi tại Resend. Không commit API key. Email mở trên máy khác cần `PUBLIC_URL` truy cập được. Khi email chưa cấu hình, giao diện vẫn cho dùng Authenticator nếu tài khoản đã bật.