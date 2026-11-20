# Ảnh sản phẩm

## Thêm sản phẩm và ảnh

1. Đăng nhập trang quản trị tại `/admin` bằng tài khoản quản trị.
2. Chọn **Sản phẩm → Thêm sản phẩm**.
3. Tải ảnh bìa từ máy tính; có thể thêm tối đa 8 ảnh góc khác. Hỗ trợ JPG, PNG và WebP, mỗi ảnh tối đa 5 MB.
4. Xem trước ảnh, bỏ ảnh không phù hợp bằng nút ×, điền thông tin sản phẩm rồi chọn **Lưu sản phẩm**.

Có thể dùng ảnh đã có trong `public/images/products/` bằng cách nhập đường dẫn tương đối như `/images/products/lamp.jpg` vào URL ảnh chính.

## Lưu trữ trên AWS

`src/product-images.js` tải ảnh qua IAM role của EC2 lên bucket riêng khi runtime có `PRODUCT_IMAGE_BUCKET`; bucket dùng mã hóa mặc định ở S3 và không mở public. Khách xem ảnh qua CloudFront `/product-images/...`. Nếu chưa cấu hình bucket, ứng dụng lưu ảnh trong thư mục `uploads` cạnh DB.

Trạng thái production được kiểm tra ngày 12/11/2026: stack đang chạy có bucket backup nhưng chưa có bucket ảnh sản phẩm. Vì vậy ảnh tải mới được lưu ở `/opt/shop/data/uploads` trên volume dữ liệu EC2, được phục vụ qua CloudFront và nằm trong vùng dữ liệu được backup; deploy image ứng dụng không xóa thư mục này. Không áp dụng thay đổi CloudFormation trong đợt rà soát này vì template hiện tại có thể thay đổi cấu hình EC2 đang giữ dữ liệu.

CloudFormation trong `deploy/aws-cloudformation.yml` khai báo bucket, quyền upload tối thiểu cho EC2, và CloudFront Origin Access Control. Việc sửa template chưa tự cập nhật AWS. Script `scripts/deploy-aws.ps1` chỉ phát hành image ứng dụng, không cập nhật CloudFormation. Trước khi áp dụng template lên stack đang chạy, cần xem Change Set kỹ: thay đổi UserData có thể thay EC2; phải bảo toàn volume đang chứa `/opt/shop/data` và kiểm tra dữ liệu trước khi chấp nhận.
