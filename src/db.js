// Lớp dữ liệu: lưu trong bộ nhớ và ghi ra 1 file JSON (không cần cài thư viện, chạy được trên Node >= 18).
const fs = require('fs');
const path = require('path');

const MEN_CATEGORIES = [
  { id: 'ao-khoac', name: 'Áo khoác', parent: 'Nam' },
  { id: 'quan', name: 'Quần', parent: 'Nam' },
  { id: 'ao-so-mi', name: 'Áo sơ mi', parent: 'Nam' },
  { id: 'ao-thun-nỉ', name: 'Áo thun/Nỉ', parent: 'Nam' },
  { id: 'ao-len-det-kim', name: 'Áo len/Dệt kim', parent: 'Nam' },
  { id: 'do-mac-trong', name: 'Đồ mặc trong & Đồ lót', parent: 'Nam' },
  { id: 'phu-kien', name: 'Phụ kiện/Đồ dùng', parent: 'Nam' },
];

const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521369909026-2afc7c2a5f94?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
];

function normalizeProduct(product, index = 0) {
  const fallbackImage = FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length];
  const name = String(product?.name || 'Sản phẩm mới');
  const category = String(product?.category || 'Thời trang');
  const description = String(product?.description || 'Sản phẩm thời trang chất lượng cao.');
  return {
    ...product,
    id: Number(product?.id ?? index + 1),
    name,
    category,
    gender: product?.gender || 'men',
    subCategory: product?.subCategory || 'phu-kien',
    price: Number(product?.price ?? 0),
    stock: Number(product?.stock ?? 0),
    emoji: product?.emoji || '🛍️',
    description,
    image: typeof product?.image === 'string' && product.image.trim() ? product.image.trim() : fallbackImage,
    sizes: Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L'],
    colors: Array.isArray(product?.colors) && product.colors.length ? product.colors : ['Trắng'],
  };
}

const SEED_PRODUCTS = [
  ['Áo thun basic trắng', 'Thời trang', 149000, 50, '👕', 'Áo thun cotton 100%, form rộng thoải mái.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-thun-nỉ', ['XS', 'S', 'M', 'L', 'XL'], ['Trắng', 'Đen', 'Xanh navy']],
  ['Quần jeans slim fit', 'Thời trang', 399000, 30, '👖', 'Quần jeans co giãn nhẹ, dễ phối đồ.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL', 'XXL'], ['Xanh', 'Đen', 'Nâu']],
  ['Giày sneaker trắng', 'Thời trang', 599000, 20, '👟', 'Giày sneaker đế êm, đi học đi chơi đều hợp.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['39', '40', '41', '42', '43'], ['Trắng', 'Đen']],
  ['Balo laptop 15.6"', 'Phụ kiện', 329000, 25, '🎒', 'Balo chống nước, ngăn laptop có đệm.', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Đen', 'Xám']],
  ['Mũ lưỡi trai', 'Phụ kiện', 89000, 60, '🧢', 'Mũ thêu logo, điều chỉnh được size.', 'https://images.unsplash.com/photo-1521369909026-2afc7c2a5f94?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['S', 'M', 'L'], ['Đen', 'Xanh', 'Be']],
  ['Kính râm thời trang', 'Phụ kiện', 199000, 40, '🕶️', 'Chống tia UV400.', 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Đen', 'Nâu']],
  ['Tai nghe bluetooth', 'Điện tử', 499000, 35, '🎧', 'Pin 30 giờ, chống ồn cơ bản.', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Trắng', 'Đen']],
  ['Chuột không dây', 'Điện tử', 179000, 45, '🖱️', 'Kết nối 2.4GHz, pin AA dùng 12 tháng.', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Đen', 'Xám']],
  ['Bàn phím cơ mini', 'Điện tử', 699000, 15, '⌨️', 'Switch red, đèn nền RGB.', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Đen', 'Trắng']],
  ['Cà phê rang xay 500g', 'Đồ ăn uống', 129000, 80, '☕', 'Robusta - Arabica nguyên chất, rang vừa.', 'https://images.unsplash.com/photo-1498804103079-a4f7d7e1a8a8?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['500g'], ['Nâu']],
  ['Trà xanh hộp 100g', 'Đồ ăn uống', 79000, 70, '🍵', 'Trà xanh Thái Nguyên hảo hạng.', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['100g'], ['Xanh']],
  ['Bình giữ nhiệt 500ml', 'Gia dụng', 159000, 55, '🥤', 'Inox 304 giữ nóng 12 giờ, giữ lạnh 24 giờ.', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['500ml'], ['Bạc', 'Đen']],
  ['Áo khoác bomber nâu', 'Thời trang', 689000, 24, '🧥', 'Áo khoác bomber form vừa, chất liệu bền đẹp.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Nâu', 'Đen', 'Xám']],
  ['Áo khoác gió trượt tuyết', 'Thời trang', 749000, 18, '🧥', 'Chống gió nhẹ, dễ mặc cho mọi thời tiết.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['M', 'L', 'XL'], ['Xanh', 'Đen']],
  ['Áo sơ mi oxford trắng', 'Thời trang', 429000, 28, '👔', 'Áo sơ mi Oxford premium, lịch sự và thanh thoát.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Trắng', 'Xanh nhạt']],
  ['Áo sơ mi linen xám', 'Thời trang', 459000, 26, '👔', 'Chất liệu linen thoáng mát, phù hợp mùa hè.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Xám', 'Nâu']],
  ['Quần chinos slim fit', 'Thời trang', 469000, 32, '👖', 'Quần chinos mềm mại, dáng slim hiện đại.', 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Be', 'Xanh', 'Đen']],
  ['Quần tây công sở', 'Thời trang', 519000, 22, '👖', 'Dáng chuẩn, chất liệu chắc chắn cho môi trường công sở.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['M', 'L', 'XL', 'XXL'], ['Đen', 'Xám', 'Nâu']],
  ['Quần short cargo', 'Thời trang', 329000, 36, '🩳', 'Quần short phong cách ngày hè, nhiều túi tiện dụng.', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Xanh', 'Nâu']],
  ['Áo len cardigan basic', 'Thời trang', 579000, 20, '🧶', 'Dệt kim mềm, giữ ấm tốt cho mùa thu đông.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 'men', 'ao-len-det-kim', ['S', 'M', 'L', 'XL'], ['Be', 'Xám', 'Đen']],
  ['Áo khoác dạ mỏng', 'Thời trang', 619000, 19, '🧥', 'Thiết kế tối giản, dễ phối với nhiều loại quần áo.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Đen', 'Xám']],
  ['Áo sơ mi họa tiết', 'Thời trang', 489000, 16, '👔', 'Họa tiết hiện đại, điểm nhấn phù hợp đi làm và đi chơi.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Xanh', 'Đen', 'Nâu']],
  ['Áo khoác parka xanh', 'Thời trang', 799000, 15, '🧥', 'Parka dày dặn, giữ ấm tốt dành cho mùa đông.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['M', 'L', 'XL'], ['Xanh rêu', 'Đen']],
  ['Áo khoác denim vintage', 'Thời trang', 739000, 17, '🧥', 'Áo khoác denim phong cách cổ điển nhưng hiện đại.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Xanh denim', 'Nâu']],
  ['Áo khoác gió không tay', 'Thời trang', 569000, 20, '🧥', 'Kiểu dáng gọn gàng, phù hợp cho thời tiết dễ gió.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Xám', 'Đen']],
  ['Quần jean rách nhẹ', 'Thời trang', 449000, 18, '👖', 'Quần jean dáng slim, thiết kế rách nhẹ thời trang.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Xanh', 'Nâu']],
  ['Quần slim cargo', 'Thời trang', 389000, 24, '👖', 'Dáng quần slim, nhiều túi tiện dụng cho ngày busy.', 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Xanh', 'Đen']],
  ['Quần âu tối giản', 'Thời trang', 489000, 21, '👖', 'Quần âu basic, sắc nét cho outfit công sở hoặc đi chơi.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['M', 'L', 'XL'], ['Đen', 'Xám']],
  ['Áo sơ mi dài tay đen', 'Thời trang', 459000, 25, '👔', 'Áo sơ mi tối giản, lịch lãm với màu đen cơ bản.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Đen', 'Xám']],
  ['Áo sơ mi navy basic', 'Thời trang', 439000, 29, '👔', 'Áo sơ mi xanh navy thanh thoát, dễ phối với quần jean.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Xanh navy', 'Trắng']],
  ['Áo sơ mi striped', 'Thời trang', 479000, 18, '👔', 'Họa tiết sọc nhẹ, mang phong cách casual nhưng tinh tế.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['M', 'L', 'XL'], ['Xanh', 'Be']],
  ['Áo thun thể thao nam', 'Thời trang', 259000, 42, '🏃', 'Chất liệu thấm hút mồ hôi, thoải mái khi vận động.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-thun-nỉ', ['S', 'M', 'L', 'XL'], ['Đen', 'Xanh', 'Trắng']],
  ['Quần jogger thể thao', 'Thời trang', 349000, 38, '🏃', 'Quần jogger co giãn, phù hợp tập luyện và đi dạo.', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Đen', 'Xám', 'Xanh']],
  ['Bộ sơ mi công sở cao cấp', 'Thời trang', 629000, 27, '👔', 'Phối áo sơ mi và quần tây hợp phong cách chuyên nghiệp.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['M', 'L', 'XL'], ['Xám', 'Đen']],
  ['Balo du lịch 35L', 'Phụ kiện', 499000, 22, '🎒', 'Thiết kế công thái, dễ mang đi làm và đi du lịch.', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80', 'all', 'phu-kien', ['One Size'], ['Đen', 'Nâu']],
  ['Đồng hồ thông minh trẻ em', 'Mẹ & Bé', 899000, 16, '⌚', 'Đồng hồ kiểm tra nhịp tim và hoạt động dành cho bé.', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80', 'all', 'me-be', ['One Size'], ['Hồng', 'Xanh']],
  ['Bình sữa 2 trong 1', 'Mẹ & Bé', 399000, 30, '🍼', 'Bình sữa an toàn, dễ vệ sinh và thiết kế tiện lợi.', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', 'all', 'me-be', ['240ml', '330ml'], ['Trắng', 'Hồng']],
  ['Đồ chơi phát triển trí não', 'Mẹ & Bé', 289000, 44, '🧩', 'Phát triển khả năng tư duy và màu sắc cho bé.', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', 'all', 'me-be', ['One Size'], ['Nhiều màu']],
  ['Bóng đá mini', 'Thể thao', 199000, 50, '⚽', 'Bóng đá mini chất lượng cao, phù hợp luyện kỹ năng.', 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=900&q=80', 'all', 'the-thao', ['One Size'], ['Trắng', 'Xanh']],
  ['Balo thể thao', 'Thể thao', 379000, 24, '🎒', 'Phù hợp đi chạy bộ, đi tập và du lịch ngắn ngày.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'all', 'the-thao', ['One Size'], ['Đen', 'Xám']],
  ['Vợt cầu lông', 'Thể thao', 459000, 18, '🏸', 'Vợt cân bằng, bền bỉ và dễ kiểm soát.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80', 'all', 'the-thao', ['One Size'], ['Xanh', 'Đen']],
  ['Viên uống vitamin tổng hợp', 'Sức khỏe', 239000, 60, '💊', 'Hỗ trợ bổ sung vitamin và khoáng chất mỗi ngày.', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80', 'all', 'suc-khoe', ['60 viên'], ['Trắng']],
  ['Máy đo huyết áp', 'Sức khỏe', 739000, 14, '🩺', 'Máy đo huyết áp tự động dễ dùng cho gia đình.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80', 'all', 'suc-khoe', ['One Size'], ['Trắng', 'Xanh']],
  ['Sách kỹ năng sống', 'Nhà sách', 119000, 52, '📚', 'Sách giúp phát triển kỹ năng quản lý thời gian và giao tiếp.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80', 'all', 'nha-sach', ['One Size'], ['Xanh', 'Đen']],
  ['Bộ truyện thiếu nhi', 'Nhà sách', 169000, 40, '📖', 'Bộ truyện đẹp, khuyến khích thói quen đọc sách cho bé.', 'https://images.unsplash.com/photo-1516979187454-437ec3f9d7d5?auto=format&fit=crop&w=900&q=80', 'all', 'nha-sach', ['One Size'], ['Màu sắc']],
  ['Nước hoa mini', 'Phụ kiện', 259000, 28, '🌿', 'Nước hoa hương nhẹ, phù hợp dùng hằng ngày.', 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80', 'all', 'phu-kien', ['50ml'], ['Hồng', 'Vàng']],
  ['Bếp điện mini', 'Gia dụng', 689000, 12, '🍳', 'Bếp điện nhỏ gọn, tiện dụng cho căn bếp hiện đại.', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80', 'all', 'gia-dung', ['One Size'], ['Đen', 'Bạc']],
  ['Máy xay sinh tố', 'Gia dụng', 899000, 10, '🥤', 'Máy xay mạnh mẽ, kèm cốc cầm tay tiện lợi.', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2b4e?auto=format&fit=crop&w=900&q=80', 'all', 'gia-dung', ['One Size'], ['Trắng', 'Đen']],
  ['Túi vải đa năng', 'Phụ kiện', 189000, 48, '👜', 'Túi vải bền đẹp dành cho đi làm và đi chợ.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80', 'all', 'phu-kien', ['One Size'], ['Be', 'Xanh']],
  ['Bộ dụng cụ sáng tạo', 'Xem thêm', 319000, 20, '✏️', 'Dụng cụ sáng tạo cho học tập và làm việc.', 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80', 'all', 'xem-them', ['One Size'], ['Xanh', 'Vàng']],
  ['Áo khoác du lịch camel', 'Thời trang', 699000, 18, '🧥', 'Áo khoác dáng dài, phong cách tối giản cho ngày se lạnh.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Camel', 'Đen', 'Be']],
  ['Áo khoác gió thể thao', 'Thời trang', 659000, 22, '🧥', 'Mang cảm giác nhẹ nhàng, thoáng khi di chuyển.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['M', 'L', 'XL'], ['Xám', 'Đen']],
  ['Áo khoác cotton oversized', 'Thời trang', 729000, 19, '🧥', 'Dáng oversized hiện đại, dễ phối theo nhiều phong cách.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Trắng', 'Xám']],
  ['Áo khoác bomber đen tối giản', 'Thời trang', 679000, 23, '🧥', 'Bomber basic với đường may sạch, phù hợp mọi outfit.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['S', 'M', 'L', 'XL'], ['Đen', 'Xanh']],
  ['Áo khoác woll premium', 'Thời trang', 899000, 15, '🧥', 'Chất liệu len mềm, giữ ấm tốt cho mùa đông.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'men', 'ao-khoac', ['M', 'L', 'XL'], ['Be', 'Xám']],
  ['Quần jean straight fit', 'Thời trang', 499000, 27, '👖', 'Dáng straight vừa vặn, tái hiện phong cách cổ điển nhưng hiện đại.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Xanh denim', 'Đen']],
  ['Quần jogger co giãn', 'Thời trang', 419000, 28, '👖', 'Quần jogger dễ mặc cho cả đi làm và đi chơi.', 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Đen', 'Xám']],
  ['Quần cargo utility', 'Thời trang', 469000, 25, '👖', 'Một túi lớn, phong cách mạnh và đa năng.', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['M', 'L', 'XL'], ['Xanh', 'Đen']],
  ['Quần khaki slim fit', 'Thời trang', 439000, 30, '👖', 'Màu khaki nhẹ, dễ phối với áo sơ mi và áo khoác.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'men', 'quan', ['S', 'M', 'L', 'XL'], ['Be', 'Xanh lục']],
  ['Áo sơ mi linen trắng', 'Thời trang', 479000, 26, '👔', 'Sơ mi linen mỏng, thoáng và thanh lịch cho mùa hè.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Trắng', 'Xanh nhạt']],
  ['Áo sơ mi checker navy', 'Thời trang', 509000, 20, '👔', 'Họa tiết kẻ nhỏ, cực phù hợp cho phong cách công sở.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['M', 'L', 'XL'], ['Xanh navy', 'Nâu']],
  ['Áo sơ mi bò cotton', 'Thời trang', 529000, 18, '👔', 'Mẫu sơ mi lép vế, đậm chất thời trang hiện đại.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', 'men', 'ao-so-mi', ['S', 'M', 'L', 'XL'], ['Đen', 'Nâu']],
  ['Áo thun oversize đen', 'Thời trang', 289000, 35, '👕', 'Áo thun oversize thoải mái, form rộng nhưng vẫn clean.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-thun-nỉ', ['S', 'M', 'L', 'XL'], ['Đen', 'Trắng']],
  ['Áo thun cổ tròn basic', 'Thời trang', 249000, 42, '👕', 'Mẫu áo cơ bản, dễ phối đồ từ đi học đến đi làm.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'men', 'ao-thun-nỉ', ['S', 'M', 'L', 'XL'], ['Trắng', 'Xanh', 'Đen']],
  ['Áo thun trơn tối giản', 'Thời trang', 279000, 39, '👕', 'Thiết kế đơn giản, chất liệu co giãn nhẹ.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'men', 'ao-thun-nỉ', ['S', 'M', 'L', 'XL'], ['Xám', 'Đen', 'Be']],
  ['Áo len cổ lọ', 'Thời trang', 599000, 17, '🧶', 'Áo len dệt kim mềm, đẹp và giữ ấm hiệu quả.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 'men', 'ao-len-det-kim', ['S', 'M', 'L', 'XL'], ['Xám', 'Đen', 'Nâu']],
  ['Áo len cardigan heather', 'Thời trang', 629000, 16, '🧶', 'Cardigan để lớp ngoài, sắc nét và dễ phối.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 'men', 'ao-len-det-kim', ['S', 'M', 'L', 'XL'], ['Xám heather', 'Nâu']],
  ['Giày sneaker low top', 'Thời trang', 619000, 20, '👟', 'Sneaker thời trang nâng đỡ tốt và rất dễ phối outfit.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['39', '40', '41', '42', '43'], ['Trắng', 'Xanh', 'Đen']],
  ['Giày derby da', 'Thời trang', 839000, 14, '👞', 'Giày da tối giản phù hợp đi làm và sự kiện.', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['40', '41', '42', '43', '44'], ['Nâu', 'Đen']],
  ['Dây nịt da thật', 'Phụ kiện', 199000, 32, '🧵', 'Dây nịt mỏng, lịch lãm và chắc chắn.', 'https://images.unsplash.com/photo-1521369909026-2afc7c2a5f94?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Đen', 'Camel']],
  ['Túi đeo chéo mini', 'Phụ kiện', 219000, 27, '👜', 'Túi chéo tiện lợi, phù hợp đi làm và đi chơi.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80', 'men', 'phu-kien', ['One Size'], ['Đen', 'Xám']]
];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function seedData() {
  return {
    nextProductId: SEED_PRODUCTS.length + 1,
    nextOrderId: 1,
    nextUserId: 1,
    products: SEED_PRODUCTS.map(([name, category, price, stock, emoji, description, image, gender, subCategory, sizes, colors], i) => (
      {
        id: i + 1,
        name,
        category,
        gender: gender || 'men',
        subCategory: subCategory || 'phu-kien',
        price,
        stock,
        emoji,
        description,
        image,
        sizes: sizes || ['S', 'M', 'L'],
        colors: colors || ['Trắng'],
      }
    )),
    orders: [],
    users: [],
  };
}

/** Mở "cơ sở dữ liệu". file = ':memory:' thì chỉ giữ trong bộ nhớ (dùng cho test). */
function openDb(file = ':memory:', { seed = true } = {}) {
  const persistent = file !== ':memory:';
  let data;
  if (persistent && fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    data = seed ? seedData() : { nextProductId: 1, nextOrderId: 1, nextUserId: 1, products: [], orders: [], users: [] };
  }

  if (!data.nextUserId) data.nextUserId = 1;
  if (!Array.isArray(data.users)) data.users = [];
  if (!Array.isArray(data.products)) data.products = [];
  data.products = data.products.map((product, index) => normalizeProduct(product, index));
  if (!data.nextProductId || Number(data.nextProductId) <= data.products.length) {
    data.nextProductId = data.products.length + 1;
  }

  const db = {
    file,
    data,
    save() {
      if (!persistent) return;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db.data));
      fs.renameSync(tmp, file); // ghi file tạm rồi đổi tên để không bị hỏng dữ liệu giữa chừng
    },
    close() { db.save(); },
  };
  if (persistent) db.save();
  return db;
}

const clone = (x) => structuredClone(x);

function listProducts(db, { q = '', category = '', gender = '' } = {}) {
  const kw = q.trim().toLowerCase();
  return clone(
    db.data.products.filter((p) => {
      const matchesText = !kw || p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw);
      const matchesCategory = !category || p.category === category || p.subCategory === category;
      const matchesGender = !gender || p.gender === gender;
      return matchesText && matchesCategory && matchesGender;
    })
  );
}

function listCategories(db) {
  return [...new Set(db.data.products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'vi'));
}

function getProduct(db, id) {
  const p = db.data.products.find((x) => x.id === id);
  return p ? clone(p) : null;
}

function nowString() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function createOrder(db, payload) {
  const c = payload && payload.customer;
  const items = payload && payload.items;
  if (!c || !String(c.name || '').trim() || !String(c.address || '').trim()) {
    throw new HttpError(400, 'Vui lòng nhập họ tên và địa chỉ giao hàng');
  }
  if (!/^0\d{9,10}$/.test(String(c.phone || '').trim())) {
    throw new HttpError(400, 'Số điện thoại không hợp lệ');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Giỏ hàng trống');
  }

  // Bước 1: kiểm tra toàn bộ, chưa thay đổi dữ liệu gì
  let total = 0;
  const lines = [];
  const seen = new Set();
  for (const it of items) {
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpError(400, 'Số lượng không hợp lệ');
    const pid = Number(it.productId);
    if (seen.has(pid)) throw new HttpError(400, 'Sản phẩm bị trùng trong giỏ hàng');
    seen.add(pid);
    const p = db.data.products.find((x) => x.id === pid);
    if (!p) throw new HttpError(400, `Sản phẩm #${it.productId} không tồn tại`);
    if (p.stock < qty) throw new HttpError(409, `"${p.name}" chỉ còn ${p.stock} sản phẩm`);
    total += p.price * qty; // giá luôn lấy từ server, không tin client
    lines.push({ p, qty });
  }

  // Bước 2: ghi dữ liệu; nếu lưu file lỗi thì khôi phục lại như cũ
  const backup = clone(db.data);
  try {
    const order = {
      id: db.data.nextOrderId++,
      customer_name: c.name.trim(),
      phone: c.phone.trim(),
      address: c.address.trim(),
      total,
      status: 'new',
      created_at: nowString(),
      items: lines.map(({ p, qty }) => ({ product_id: p.id, name: p.name, price: p.price, quantity: qty })),
    };
    for (const { p, qty } of lines) p.stock -= qty;
    db.data.orders.push(order);
    db.save();
    return clone(order);
  } catch (err) {
    db.data = backup;
    throw err;
  }
}

function getOrder(db, id) {
  const o = db.data.orders.find((x) => x.id === id);
  return o ? clone(o) : null;
}

function listOrders(db) {
  return clone([...db.data.orders].sort((a, b) => b.id - a.id).slice(0, 200));
}

function hashPassword(password, salt = require('crypto').randomBytes(16).toString('hex')) {
  const derived = require('crypto').scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password, stored) {
  if (!stored || !stored.salt || !stored.hash) return false;
  const derived = require('crypto').scryptSync(password, stored.salt, 64).toString('hex');
  return derived === stored.hash;
}

function createUser(db, { name, username, email, password }) {
  const cleanName = String(name || '').trim();
  const cleanUsername = String(username || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanName || !cleanUsername || !String(password || '').trim()) {
    throw new HttpError(400, 'Vui lòng nhập đầy đủ tên, tên đăng nhập và mật khẩu');
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new HttpError(400, 'Email không hợp lệ');
  }

  if (String(password).length < 6) {
    throw new HttpError(400, 'Mật khẩu phải có ít nhất 6 ký tự');
  }

  if (db.data.users.some((u) => u.username === cleanUsername || (cleanEmail && u.email === cleanEmail))) {
    throw new HttpError(409, 'Tên đăng nhập hoặc email đã tồn tại');
  }

  const { salt, hash } = hashPassword(String(password));
  const user = {
    id: db.data.nextUserId++,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail || '',
    password: { salt, hash },
    created_at: nowString(),
  };
  db.data.users.push(user);
  db.save();
  return clone({ ...user, password: undefined });
}

function findUserByUsername(db, username) {
  const cleanUsername = String(username || '').trim();
  if (!cleanUsername) return null;
  const user = db.data.users.find((u) => u.username === cleanUsername);
  return user ? clone(user) : null;
}

function findUserByEmail(db, email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  const user = db.data.users.find((u) => u.email === cleanEmail);
  return user ? clone(user) : null;
}

function findUserById(db, id) {
  const user = db.data.users.find((u) => u.id === Number(id));
  return user ? clone(user) : null;
}

const STATUSES = ['new', 'confirmed', 'shipping', 'done', 'cancelled'];

function updateOrderStatus(db, id, status) {
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
  const o = db.data.orders.find((x) => x.id === id);
  if (!o) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  o.status = status;
  db.save();
  return clone(o);
}

function getMenCatalog() {
  return {
    pageTitle: 'Nam | LifeWear',
    categories: MEN_CATEGORIES,
    collectionHighlights: [
      { title: 'LifeWear', description: 'Trang phục tối giản, bền bỉ cho mọi ngày.' },
      { title: 'UT Collection', description: 'Bộ sưu tập đặc biệt theo mùa và hợp tác.' },
      { title: 'Airism', description: 'Dòng đồ mát, thoáng, dễ mặc và vận động.' },
    ],
    stylingIdeas: [
      'Look 1: Layering tối giản',
      'Look 2: Mặc đi làm & đi chơi',
      'Look 3: Outfit mùa mát',
    ],
    filters: {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
      colors: ['Trắng', 'Đen', 'Xanh navy', 'Xanh', 'Nâu', 'Be'],
      priceRanges: ['Dưới 300k', '300k - 500k', '500k - 1 triệu', 'Trên 1 triệu'],
    },
  };
}

module.exports = {
  openDb, HttpError, listProducts, listCategories, getProduct,
  createOrder, getOrder, listOrders, updateOrderStatus, STATUSES,
  createUser, findUserByUsername, findUserByEmail, findUserById, verifyPassword,
  getMenCatalog, MEN_CATEGORIES,
};
