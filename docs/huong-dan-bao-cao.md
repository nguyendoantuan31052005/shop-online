# Gợi ý dàn ý báo cáo đồ án

1. **Giới thiệu**: bài toán bán hàng trực tuyến, mục tiêu áp dụng DevOps (Git, Docker, CI/CD), phạm vi.
2. **Cơ sở lý thuyết**
   - Git: commit, branch, pull request, merge, tag.
   - Container vs máy ảo; kiến trúc Docker (Client, Daemon, Image, Container, Registry); Dockerfile, volume, Compose.
   - CI, Continuous Delivery/Deployment; GitHub Actions (workflow, job, step, secrets).
3. **Phân tích & thiết kế**
   - Chức năng khách hàng / quản trị, sơ đồ use case.
   - CSDL 3 bảng: `products`, `orders`, `order_items` (vẽ ERD).
   - Danh sách API (README mục 3).
   - Sơ đồ luồng CI/CD (README mục 2).
4. **Triển khai**
   - Cài đặt ứng dụng và test (giải thích vì sao server tự tính tiền, transaction, kiểm tra tồn kho).
   - Giải thích từng dòng Dockerfile, docker-compose (volume, biến môi trường).
   - Giải thích từng job trong `ci-cd.yml`, cấu hình secrets, chuẩn bị server.
5. **Kết quả / Demo** (chụp màn hình)
   - Trang cửa hàng, giỏ hàng, đặt hàng thành công, trang quản trị.
   - Lịch sử commit, nhánh, Pull Request trên GitHub.
   - Tab Actions: pipeline xanh (test → build → deploy).
   - Docker Hub có các tag `latest`, `sha-...`.
   - `docker ps`, `docker volume ls` trên server.
   - **Một lần pipeline đỏ** do test lỗi (chứng minh CI chặn code lỗi), sau đó sửa và chạy lại.
6. **Đánh giá**: lợi ích (tự động, nhất quán, nhanh, dễ rollback), hạn chế (xem README mục 9).
7. **Kết luận & hướng phát triển.**
8. **Tài liệu tham khảo**: docs.docker.com, docs.github.com/actions, nodejs.org.

## Kịch bản demo (5–7 phút)
1. Mở web, thêm sản phẩm vào giỏ, đặt hàng; vào `/admin.html` đổi trạng thái đơn.
2. Tạo nhánh mới, sửa tên/giá một sản phẩm hoặc chữ trên giao diện, mở Pull Request → CI chạy test.
3. Merge vào `main` → mở tab Actions xem 3 job chạy.
4. Mở Docker Hub xem tag mới.
5. Tải lại web trên server: nội dung mới, chân trang hiển thị mã commit mới; đơn hàng cũ vẫn còn (nhờ volume).
