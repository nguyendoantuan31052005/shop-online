# Gợi ý dàn ý báo cáo đồ án

1. **Giới thiệu**: bài toán bán hàng trực tuyến, mục tiêu áp dụng DevOps (Git, Docker, CI/CD), phạm vi.
2. **Cơ sở lý thuyết**
   - Git: commit, branch, pull request, merge, tag.
   - Container vs máy ảo; kiến trúc Docker (Client, Daemon, Image, Container, Registry); Dockerfile, volume, Compose.
   - CI, Continuous Delivery/Deployment; GitHub Actions (workflow, job, step, secrets).
3. **Phân tích & thiết kế**
   - Chức năng khách hàng / quản trị, sơ đồ use case.
   - Mô hình dữ liệu: `products`, `orders` (mỗi đơn chứa danh sách `items`), lưu trong file JSON (vẽ sơ đồ quan hệ).
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
6. **Đánh giá**: lợi ích (tự động, nhất quán, nhanh, dễ rollback), hạn chế (xem README mục 9). Nên bổ sung các điểm thiếu sót thực tế sau để báo cáo sát hơn với sản phẩm thương mại điện tử thực tế:
   - Data & Content: dữ liệu giả lập, thiếu nội dung sản phẩm thật, hình ảnh broken, thiếu trang thông tin bắt buộc, giá chưa chuẩn hóa tiền tệ, chưa có trạng thái hết hàng.
   - UX/UI: layout chưa responsive tốt, thiếu loading/empty state, chưa có toast xác nhận sau khi thêm giỏ, thiếu tìm kiếm và lọc nâng cao.
   - Checkout Flow: thiếu validation form, chưa có địa giới hành chính theo cấp, chưa tích hợp cổng thanh toán thực tế, chưa tính phí ship tự động.
   - Technical & Performance: mật khẩu chưa mã hóa, chưa có route guard, thiếu SEO metadata, ảnh chưa tối ưu, cấu hình hardcode trong source thay vì `.env`.

   **Bảng đối chiếu yêu cầu website hoàn chỉnh vs hiện trạng dự án:**

   | Hạng mục | Một website hoàn chỉnh bắt buộc phải có | Điểm dự án hiện đang thiếu / cần khắc phục |
   |---|---|---|
   | Trải nghiệm Sản phẩm | Lựa chọn biến thể, bắt buộc chọn biến thể trước khi mua, tồn kho & giá theo biến thể, đánh giá và bình luận từ khách hàng. | Chưa ràng buộc bắt buộc chọn Size/Màu trước khi mua; thiếu đánh giá thực tế từ người dùng. |
   | Giỏ hàng & Luồng Mua hàng | Toast/Popup phản hồi, màn hình giỏ hàng trống, chặn số lượng âm/chữ/quá lớn, auto-save khi reload. | Chưa có toast; giỏ hàng trống chưa có state rõ ràng; chưa validate số lượng. |
   | Thanh toán & Vận chuyển | Validation form chặt chẽ, chọn địa chỉ theo cấp, tính phí ship tự động, tích hợp cổng thanh toán. | Form chưa chặn tốt SĐT/Email; địa chỉ nhập text thô; phí ship chưa có logic. |
   | Tìm kiếm & Trạng thái Hệ thống | Tìm kiếm gợi ý, sắp xếp, trạng thái không tìm thấy, loading spinner/skeleton. | Tìm kiếm và bộ lọc còn sơ sài; khi không có kết quả thường bị trắng; thiếu loading. |
   | Giao diện Mobile & Trang Pháp lý | Responsive tốt, menu hamburger, đầy đủ trang chính sách. | Mobile còn vỡ khung; thiếu các trang pháp lý bắt buộc ở footer. |
   | Hệ thống Quản trị & Bảo mật | Admin quản lý đơn hàng, phân quyền Route, mã hóa mật khẩu, .env secrets, email xác nhận đơn hàng. | Chưa tối ưu phân quyền; console có warning; chưa có email xác nhận. |

I. TỔNG HỢP TOÀN BỘ CÁC ĐIỂM CẦN CẢI THIỆN (CHECKLIST)

1. Giao diện & Trải nghiệm Người dùng (UI/UX)
   - [ ] Đồng nhất tỷ lệ ảnh: Chuẩn hóa toàn bộ ảnh sản phẩm về tỷ lệ 3:4 (Thời trang) hoặc 1:1.
   - [ ] Chấm tròn màu sắc (Color Swatches): Đổi hiển thị màu sắc dạng text sang các chấm màu thật; rê chuột vào đổi ảnh đại diện sản phẩm.
   - [ ] Responsive Mobile: Chuyển Menu Header sang dạng Hamburger Menu (≡), thêm thanh điều hướng cố định dưới đáy màn hình (Bottom Bar) và thanh mua hàng cố định (Sticky Add-to-Cart).
   - [ ] Hiệu ứng chờ (Skeleton Screen): Dùng khung xương xám nhấp nháy thay vì để trang trắng khi gọi API.

2. Luồng Mua hàng & Giỏ hàng (Shopping Flow)
   - [ ] Ràng buộc biến thể (Bắt buộc): Bắt buộc chọn đầy đủ Size + Màu sắc mới mở khóa nút "Thêm vào giỏ".
   - [ ] Phản hồi tương tác (Toast & Cart Drawer): Xuất hiện thông báo Toast hoặc mở Mini-cart trượt từ mép phải khi khách bấm mua.
   - [ ] Trạng thái giỏ hàng trống (Empty State): Thêm hình minh họa + nút "Tiếp tục mua sắm" khi giỏ chưa có đồ.
   - [ ] Lưu giỏ hàng: Đồng bộ giỏ hàng vào localStorage hoặc Database để F5 không bị mất sản phẩm.

3. Thanh toán, Vận chuyển & Pháp lý (Checkout & Policies)
   - [ ] Validate Form Thanh toán: Bắt lỗi chính xác định dạng SĐT, Email, Tên người nhận.
   - [ ] API Địa giới hành chính: Tích hợp 3 ô Dropdown (Tỉnh/Thành → Quận/Huyện → Phường/Xã).
   - [ ] Cổng Thanh toán tự động: Tích hợp VietQR / payOS (tự sinh mã QR chứa số tiền và mã đơn hàng).
   - [ ] Trang chính sách ở Footer: Bổ sung đầy đủ: Chính sách bảo mật, Chính sách đổi trả/bảo hành, Điều khoản dịch vụ, Trang liên hệ.

4. Hệ thống Quản trị & Kỹ thuật (Admin & Infrastructure)
   - [ ] Trang Admin Dashboard: Duyệt đơn hàng, chuyển trạng thái đơn, quản lý số lượng tồn kho theo SKU.
   - [ ] Email Tự động (Nodemailer): Tự động gửi email xác nhận đơn hàng kèm hóa đơn cho khách và thông báo cho Admin.
   - [ ] Bảo mật: Mã hóa mật khẩu (Bcrypt), phân quyền Route Guard (chặn người dùng truy cập /admin), đưa API Key vào file .env.
   - [ ] Deploy Cloud: Đưa Frontend (Vercel/Netlify), Backend (Render) và Database (MongoDB Atlas/Supabase) lên Internet.

II. LỘ TRÌNH THỰC THI 3 GIAI ĐOẠN (ACTION PLAN)

Để không bị ngợp, cần chia dự án thành 3 giai đoạn xử lý lần lượt:

- [Giai đoạn 1: Core UX & Logic Mua hàng] → [Giai đoạn 2: Thanh toán & Admin] → [Giai đoạn 3: Tối ưu & Deploy]
- (Tập trung Front-end & Giỏ hàng) | (Tập trung Backend & API) | (Tập trung Security & Hosting)

### Giai đoạn 1: Sửa Core UX & Ràng buộc Giỏ hàng (Làm trước)
- Cài đặt thư viện react-hot-toast làm thông báo khi thêm vào giỏ.
- Dùng React Hook Form + Yup / Zod để Validate toàn bộ các Form nhập liệu.
- Viết Component xử lý trạng thái "Giỏ hàng trống" và "Không tìm thấy sản phẩm".
- Ràng buộc logic bắt chọn Size / Màu mới mở khóa nút Thêm vào giỏ hàng.

### Giai đoạn 2: Kết nối API External & Hệ thống Admin (Làm tiếp theo)
- Tích hợp API Tỉnh/Thành phố công khai (provinces.open-api.vn) cho trang Checkout.
- Tích hợp API VietQR / payOS để tự tạo mã QR thanh toán tự động khi Đặt hàng.
- Viết tính năng gửi Email xác nhận đơn hàng bằng Nodemailer ở Backend Node.js.
- Hoàn thiện các trang Quản lý đơn hàng & Cập nhật kho trong Admin Dashboard.

### Giai đoạn 3: Hoàn thiện Pháp lý, Tối ưu & Deploy (Giai đoạn cuối)
- Thêm các trang tĩnh chính sách ở Footer (Đổi trả, Bảo mật, Liên hệ).
- Kiểm tra và dọn dẹp sạch sẽ các lỗi/cảnh báo màu đỏ trong Tab Console (F12).
- Nén toàn bộ ảnh sang định dạng WebP để tối ưu tốc độ tải trang.
- Triển khai chính thức: Vercel (Frontend) + Render (Backend) + Cloud Database.

7. **Kết luận & hướng phát triển.**
8. **Tài liệu tham khảo**: docs.docker.com, docs.github.com/actions, nodejs.org.

## Kịch bản demo (5–7 phút)
1. Mở web, thêm sản phẩm vào giỏ, đặt hàng; vào `/admin.html` đổi trạng thái đơn.
2. Tạo nhánh mới, sửa tên/giá một sản phẩm hoặc chữ trên giao diện, mở Pull Request → CI chạy test.
3. Merge vào `main` → mở tab Actions xem 3 job chạy.
4. Mở Docker Hub xem tag mới.
5. Tải lại web trên server: nội dung mới, chân trang hiển thị mã commit mới; đơn hàng cũ vẫn còn (nhờ volume).
