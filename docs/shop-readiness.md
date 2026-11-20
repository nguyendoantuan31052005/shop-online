# Rà soát Home Shopping App so với trải nghiệm mua sắm Shopee

Rà soát ngày 19/10/2026. Phạm vi triển khai: cửa hàng một chủ, không phải sàn nhiều người bán.

Nguồn đối chiếu chính thức:
- [Shopee: câu hỏi thường gặp về đánh giá sản phẩm](https://help.shopee.vn/portal/4/article/79050).
- [Shopee: quy trình xử lý yêu cầu trả hàng/hoàn tiền](https://help.shopee.vn/portal/4/article/190242).
- [Shopee: mua sắm an toàn](https://shopee.vn/m/cung-shopee-mua-sam-an-toan).

| Nhóm trải nghiệm | Home Shopping App hiện tại |
| --- | --- |
| Tìm kiếm, danh mục, lọc giá/quy cách/màu/tồn kho | Đã có |
| Giỏ tài khoản, yêu thích, so sánh, vừa xem | Đã có |
| Voucher và báo giá từ server | Đã có |
| Sổ địa chỉ | Bổ sung tối đa 10 địa chỉ, mặc định, chọn khi thanh toán |
| Mua lại | Bổ sung; kiểm tra biến thể, tồn kho, giá hiện tại trước khi thêm giỏ |
| Đơn mua | Bổ sung lọc trạng thái/tên sản phẩm, giữ tiến trình và hủy đơn mới |
| Đánh giá | Bổ sung 1 đánh giá/tài khoản/sản phẩm, chỉ khi có đơn hoàn thành; hiển thị trung bình sao và số lượng thật; admin ẩn/hiện |
| Hậu mãi | Bổ sung phiếu hỗ trợ/đổi trả và phản hồi từ quản trị, cách ly theo chủ đơn |
| Trả hàng/hoàn tiền tự động | Chưa có. Phiếu hỗ trợ không tự chuyển tiền, tạo vận đơn hay hoàn kho |
| Thanh toán | COD; chưa tích hợp nhà cung cấp thanh toán online |
| Vận chuyển | GHN production token/Shop ID đã cấu hình và tự tạo vận đơn COD đang bật. Chưa xác minh một vận đơn thật sau bản triển khai mới nhất; webhook cần đăng ký trong cổng GHN. Checkout hiện dùng phí cơ bản, chưa gọi GHN báo phí theo tuyến |
| Khôi phục mật khẩu | Authenticator TOTP hoạt động miễn phí; email Resend chưa cấu hình. Người dùng cần bật Authenticator trước khi mất quyền truy cập. |
| Nội dung sản phẩm | Có 1.121 sản phẩm mẫu. Ảnh chụp tham khảo được dùng chung theo nhóm; shop cần xác minh giá/tồn kho và thay bằng ảnh, mô tả đúng hàng thực trước khi mở bán chính thức |
| Vận hành nhiều instance | Chưa có; hiện JSON cho một tiến trình, cần database và lưu trữ ảnh dùng chung khi mở rộng |
| Chính sách giao nhận, bảo hành, đổi trả | Cần chủ shop cung cấp điều khoản áp dụng thực tế; không sao chép cam kết Shopee |

Các nút gọi điện/Zalo/Facebook mở kênh ngoài. Website không có chat thời gian thực, ví, xu, flash sale hoặc lượt mua/đánh giá giả. Các tính năng đó chưa được triển khai.

## Kiểm chứng

Kiểm thử API bao gồm quyền sở hữu sổ địa chỉ, đơn mua, phiếu hỗ trợ; điều kiện đánh giá; chặn đánh giá trùng; mua lại không vượt tồn kho; rollback khi ghi file thất bại; API admin yêu cầu xác thực. Kiểm thử trình duyệt thực hiện lưu địa chỉ, đánh giá, mua lại, gửi yêu cầu, quản trị phản hồi và ẩn đánh giá; nội dung đánh giá được escape trước khi render.

## Cập nhật hoàn thiện giao diện và vận hành

Trang chủ hiện có slider banner, sản phẩm mới và sản phẩm bán chạy tính từ đơn chưa hủy. Catalog hỗ trợ lọc thương hiệu. Quản trị sản phẩm có thương hiệu, giá khuyến mãi, tối đa 8 ảnh chi tiết; giá khuyến mãi được kiểm tra và áp dụng ở báo giá máy chủ. Danh mục có thể tạo, đổi tên (cập nhật sản phẩm liên quan) và xóa khi không còn sản phẩm. Khách đủ điều kiện có thể gửi tối đa 3 ảnh đánh giá, được kiểm tra chữ ký tệp và xác nhận đã mua trước khi tải.

Quản trị có thể đánh dấu đã thu COD và ghi thông tin hãng vận chuyển/mã vận đơn/link HTTPS; khách xem link ở chi tiết đơn. Adapter GHN hỗ trợ tự gửi đơn ngay sau checkout, thử lại khi shop xác nhận, tạo từ admin và cập nhật trạng thái từ webhook. Phí vận chuyển chưa được GHN báo giá theo địa chỉ ở bước checkout. Cổng thanh toán online và PostgreSQL cho nhiều instance chưa được tích hợp.

## Trạng thái triển khai AWS

Ứng dụng đang chạy trên một EC2 instance; dữ liệu JSON và ảnh tải lên nằm trên EBS mã hóa. CloudFormation tạo bucket S3 riêng tư, chặn truy cập công khai, mã hóa AES256 và xóa bản sao sau 30 ngày. Systems Manager chạy backup thư mục `/opt/shop/data` mỗi ngày lúc 02:15 UTC. Đây là backup phục hồi sự cố, không biến JSON thành cơ sở dữ liệu hỗ trợ nhiều instance.

Để khôi phục: dừng container `shop-online`, tải một file `daily/shop-*.tar.gz` từ bucket backup qua AWS Console, giải nén vào `/opt/shop`, đặt lại quyền thư mục data cho UID 1000 rồi khởi động container. Không giải nén khi ứng dụng đang ghi dữ liệu.

Thanh toán online chưa được tích hợp; hiện chỉ có COD. GHN_TOKEN, GHN_SHOP_ID, GHN_AUTO_CREATE_ORDERS và GHN_WEBHOOK_SECRET hiện có trong AWS Secrets Manager; cờ tự tạo vận đơn đang bật. Việc có khóa không đảm bảo GHN sẽ nhận mọi địa chỉ hoặc số điện thoại, vì vậy cần xác nhận trên một đơn thật trước khi dựa vào luồng tự động. Đăng ký webhook trong cổng GHN là thao tác thủ công. Email nhận đơn/trạng thái và khôi phục qua email chưa hoạt động vì chưa cấu hình Resend; Authenticator TOTP không cần dịch vụ trả phí. Không thay các dịch vụ này bằng phản hồi thanh toán/vận chuyển giả.

Script triển khai EC2 đọc các khóa tùy chọn từ secret JSON trong AWS Secrets Manager và truyền chúng vào container. Để bật email cần `PUBLIC_URL`, `RESEND_API_KEY` và `MAIL_FROM` đã xác minh. GHN dùng token và Shop ID; người gửi mặc định lấy từ hồ sơ Shop ID. Khối lượng/kích thước được ước tính theo các dòng hàng trong mỗi đơn và có thể khai báo chính xác theo từng sản phẩm trong admin. Đặt `GHN_AUTO_CREATE_ORDERS` thành `true` để gửi đơn COD mới tự động; `GHN_WEBHOOK_SECRET` bật callback trạng thái vận đơn. Cập nhật secret không đổi tiến trình đang chạy cho đến lần deploy tiếp theo. Hiện trạng dịch vụ được hiển thị trong trang admin sau khi đăng nhập; chỉ báo cấu hình không thay cho giao dịch thử trực tiếp với nhà cung cấp.

## Phân quyền nhân viên

Chủ shop đăng nhập bằng `admin` cùng `ADMIN_TOKEN`, có thể tạo/khóa tài khoản nhân viên và giữ quyền xóa dữ liệu, khóa khách hàng, quản lý nhân viên. Nhân viên dùng username/mật khẩu riêng (mật khẩu tối thiểu 12 ký tự), có thể xử lý sản phẩm, voucher và đơn hàng. Khóa tài khoản hoặc đổi mật khẩu sẽ vô hiệu hóa phiên đang hoạt động.

Image `aws-20261102-staff-v1` trước đó đã được triển khai lên EC2 hiện tại qua SSM mà không cập nhật CloudFormation. Ngày 08/11/2026, bản `release-20261108-145937` được rollout thành công, tiếp tục sửa hiển thị chữ/form tiếng Việt, áp dụng giao diện đen trắng, tối ưu bố cục điện thoại, thẻ sản phẩm hai cột, điều hướng dưới màn hình và form co giãn theo chiều cao thiết bị. Health check công khai qua CloudFront trả `status: ok` và đúng version. Cache CloudFront đã được invalidated; HTML, CSS giao diện tối và stylesheet mobile mới đã được tải thành công từ URL public; tương phản khối hỗ trợ, FAQ, liên kết điều hướng, chip lọc, nút phân trang, nút đăng xuất, nút thao tác sản phẩm, select lọc, hộp thoại thanh toán, thẻ tài khoản và biểu mẫu hỗ trợ ở chế độ tối đã được rà soát và sửa; nhãn địa chỉ được chuyển sang màu tối và màu bôi chọn văn bản được điều chỉnh cho dễ nhìn. Backup mã hóa AES256 trước rollout nằm tại `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-145937.tar.gz`. Chưa kiểm tra end-to-end luồng tạo tài khoản, đăng nhập và giới hạn quyền nhân viên; chưa tạo tài khoản nhân viên production.

Script `scripts/deploy-aws.ps1` đóng gói và đẩy image lên ECR, xác nhận đúng AWS account/stack, tạo backup mã hóa trước khi đổi image, rollout qua SSM trên EC2 hiện tại và khôi phục container cũ nếu health check thất bại. Script dùng token ECR trong bộ nhớ, không lưu token vào Windows Credential Manager. Script không cập nhật CloudFormation nên không thay EC2/data volume. Cần AWS CLI đăng nhập với quyền ECR, CloudFormation read, SSM và Docker đang chạy.

Ngày 08/11/2026, bản `release-20261108-151002` được triển khai sau khi sửa trang quản trị: tab Người dùng tải mới danh sách mỗi lần mở và tự cập nhật 30 giây một lần khi đang hiển thị. Kiểm tra trình duyệt trên DB thử nghiệm đã đăng ký một tài khoản bằng API trong lúc trang admin đang mở, sau đó xác nhận tài khoản hiện ra khi mở lại tab; không tạo tài khoản thử trên dữ liệu production. Health check CloudFront trả `status: ok` với đúng version. Cache CloudFront đã được invalidated (ID `I811F7E568TDE5IKPPXCVIKKRG`). Backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-151002.tar.gz`.

Sau đó, bản `release-20261108-151431` thêm nút chuyển giao diện sáng/tối cho admin. Lựa chọn được lưu riêng trên thiết bị, khởi tạo trước khi trang vẽ để tránh nháy màu; đã triển khai lên EC2, health check CloudFront trả `status: ok` đúng version và CSS mới được tải qua CloudFront. Invalidation ID `I37FG5VCUTBMQ4WBK099SM4Q4S`; backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-151431.tar.gz`.

Bản `release-20261108-151839` cho phép chủ shop đặt lại mật khẩu khách hàng từ tab Người dùng. API giới hạn quyền chủ shop, yêu cầu mật khẩu 12–256 ký tự, lưu dạng băm và thu hồi phiên đăng nhập cũ của khách. Đã kiểm tra cú pháp Node và xác nhận phiên bản health check cùng mã giao diện mới qua CloudFront. Invalidation ID `I71PLF36EYCAU63PS4AZ35SBJB`; backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-151839.tar.gz`.

Bản `release-20261108-152239` bảo vệ trang quản trị: chưa có phiên hợp lệ, `/admin` chuyển tới màn hình đăng nhập riêng; toàn bộ `/api/admin/*` vẫn yêu cầu xác thực ngoại trừ endpoint đăng nhập. Cookie phiên có Path `/` để máy chủ xác thực khi trả dashboard và cookie cũ giới hạn `/api/admin` được xóa lúc đăng nhập/đăng xuất. Đã kiểm tra qua CloudFront: `/admin` trả 302 đến `/admin-login`, màn hình đăng nhập trả 200, `/api/admin/users` chưa đăng nhập trả 401 và health check trả đúng version. Invalidation ID `I65IY98FYNC9JL1AY2HDSEMN45`; backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-152239.tar.gz`.

Bản `release-20261108-152702` bổ sung `mobile-balance.css` cho trang cửa hàng, admin và đăng nhập admin: thu gọn chiều cao hero/header, cân lại cỡ chữ và khoảng cách thẻ sản phẩm, tinh chỉnh thanh điều hướng dưới và bố cục admin cho màn hình nhỏ. Health check CloudFront trả đúng version; stylesheet mới được tải thành công. Invalidation ID `IES20U3E08Q36YCOMNJZJYEPMZ`; backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-152702.tar.gz`.

Bản `release-20261108-181928` thêm batch catalog gia dụng V3 gồm 30 mặt hàng; migration theo version chỉ thêm batch một lần và giữ lại dữ liệu sản phẩm/tài khoản/đơn hiện có. Sau rollout, API công khai xác nhận 121 sản phẩm tổng cộng, trong đó 50 sản phẩm có nhãn catalog gia dụng. Health check trả đúng version; CloudFront đã invalidated (ID `IEXJV63DMDUC5J1FYFC6LVOB6Y`). Backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-181928.tar.gz`.

Bản `release-20261108-182303` thêm chuyển sáng/tối cho tài liệu `/api-docs`, lưu lựa chọn cùng khóa `home-shopping-theme` với cửa hàng và đồng bộ giữa các tab. Bản tối phủ đầu trang, hướng dẫn, khối endpoint Swagger, bảng, biểu mẫu, phản hồi và code. Health check trả đúng version; HTML trỏ tới CSS/JS mới và hai tài nguyên tải qua CloudFront thành công. Invalidation ID `IQ4MIZD8RA351AAKFXCM6S70T`; backup trước rollout: `s3://shop-online-prod-shopbackupbucket-mjzm5qdghjil/daily/predeploy-release-20261108-182303.tar.gz`.

## Trạng thái production ngày 12/11/2026

Phiên bản `real-photos-20261120-2` đang trả health `ok` qua CloudFront. Tự tạo vận đơn COD GHN đã bật trong cấu hình. Chủ shop cần đăng ký URL `https://dd7z91m61r0gy.cloudfront.net/api/webhooks/ghn` trong cổng GHN, dùng header `X-GHN-Webhook-Token` với giá trị `GHN_WEBHOOK_SECRET` trong Secrets Manager để nhận cập nhật hành trình.

Không tạo thêm dịch vụ AWS tính phí theo yêu cầu giữ chi phí. Production vẫn là một EC2, dữ liệu JSON trên volume và ảnh tải lên ở volume đó; backup định kỳ lên S3 vẫn hoạt động. Chưa bật thanh toán online vì cần tài khoản merchant và khóa ký từ nhà cung cấp. Không gửi khóa merchant hoặc dữ liệu ngân hàng trong chat; thêm chúng qua Secrets Manager khi sẵn sàng.

## Mở bán trong giới hạn hiện tại

- Không tạo thêm dịch vụ AWS hoặc tích hợp thanh toán có phí định kỳ. Website chỉ nhận COD; phí GHN của từng kiện hàng vẫn áp dụng theo hợp đồng/tuyến và không thể cam kết miễn phí.
- Trước khi quảng bá hàng hóa thật, shop phải thay catalog mẫu bằng giá, tồn kho, mô tả và ảnh đúng sản phẩm. Ảnh stock hiện tại chỉ dùng tham khảo, không chứng minh đó là chính xác mặt hàng giao cho khách.
- Đăng ký webhook GHN nêu trên và xác minh một đơn thật từ cổng quản trị. Thao tác gửi đơn có thể phát sinh cước vận chuyển; không dùng đơn mô phỏng để kết luận GHN đã nhận đơn thật.
- Email thông báo và khôi phục qua email vẫn tắt đến khi có khóa dịch vụ gửi thư; luồng Authenticator miễn phí vẫn dùng được.
- Phù hợp chạy thử hoặc cửa hàng nhỏ trên một EC2. Trước khi tăng lưu lượng cần database/ảnh dùng chung và kiểm tra chính sách backup, phục hồi.
