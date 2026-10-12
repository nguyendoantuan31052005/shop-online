# Dữ liệu gợi ý địa chỉ

`vietnam-addresses.json` được tải ngày 2026-10-05 từ https://provinces.open-api.vn/api/v2/?depth=2 (Province Open API, Nguyễn Hồng Quân).

Phiên bản v2 dùng cấu trúc tỉnh/thành và phường/xã sau sáp nhập tháng 07/2025: 34 tỉnh/thành, 3.321 phường/xã. Đây là dữ liệu gợi ý, không dùng để từ chối địa chỉ người mua tự nhập. Tìm kiếm chạy trong trình duyệt; không gửi từ khóa hoặc thông tin khách hàng đến nhà cung cấp dữ liệu.

Khi cập nhật, tải lại endpoint trên và chạy `node --test test/address-search.test.js`. Tài liệu nguồn: https://provinces.open-api.vn/.
