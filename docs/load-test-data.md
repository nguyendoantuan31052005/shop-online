# Dữ liệu giả kiểm thử tải

`scripts/generate-load-data.js` tạo file NDJSON chỉ dùng cho thử nghiệm đọc/ghi và dung lượng đĩa. Mặc định file được tạo tại `data/load-test/shop-events-20gb.ndjson` với kích thước 20 GB thập phân. Mỗi dòng là một sự kiện tổng hợp về lượt xem sản phẩm, tìm kiếm, giỏ hàng hoặc đơn hàng; không chứa thông tin khách hàng thật.

Chạy bằng `node scripts/generate-load-data.js`. Có thể đổi kích thước, ví dụ `node scripts/generate-load-data.js --size-gb 5`. Tùy chọn `--output` cho phép chọn đường dẫn khác. Công cụ kiểm tra còn đủ dung lượng và giữ lại 2 GB trống trước khi ghi; không ghi đè file đã có hoặc `data/shop.json`.

File này nằm ngoài database ứng dụng, bị Git bỏ qua cùng thư mục `data/`, và không được tải lên AWS production. Hãy dùng nó với công cụ đọc NDJSON hoặc môi trường kiểm thử riêng. Ứng dụng hiện tại dùng JSON database cho một instance; không nạp file lớn này vào `DB_PATH`.

Nén theo luồng để chuyển/lưu trữ tiết kiệm hơn: `node scripts/compress-load-data.js`. Bản gzip có thể nhỏ hơn nhiều vì payload đệm là dữ liệu lặp. Bản nén đã được tải lên bucket S3 riêng tư tại `daily/load-test/shop-events-20gb.ndjson.gz`, mã hóa AES256; rule của bucket tự xóa sau 30 ngày. Tải object về rồi giải nén bằng `gzip -d shop-events-20gb.ndjson.gz` để lấy lại NDJSON 20 GB.
