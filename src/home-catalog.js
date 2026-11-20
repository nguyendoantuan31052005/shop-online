// Starter household catalog. Existing products and order history are preserved.
const HOME_PRODUCTS = [
  ['Đèn bàn Nordic', 'Trang trí', 329000, '/images/home-lamp.svg', ['Tiêu chuẩn'], ['Kem', 'Đen'], 'Đèn trang trí bàn làm việc và góc đọc sách.'],
  ['Bình hoa tối giản', 'Trang trí', 189000, '/images/home-vase.svg', ['20cm', '28cm'], ['Kem', 'Nâu'], 'Điểm nhấn nhẹ nhàng cho bàn ăn và phòng khách.'],
  ['Kệ lưu trữ 3 tầng', 'Lưu trữ', 459000, '/images/home-shelf.svg', ['3 tầng'], ['Gỗ tự nhiên', 'Trắng'], 'Sắp xếp sách và đồ dùng để không gian gọn gàng hơn.'],
  ['Bộ hộp bảo quản 3 món', 'Nhà bếp', 159000, '/images/home-containers.svg', ['Bộ 3'], ['Trong suốt'], 'Bộ hộp nhiều kích thước cho căn bếp ngăn nắp.'],
  ['Đèn ngủ để bàn', 'Phòng ngủ', 249000, '/images/home-lamp.svg', ['Tiêu chuẩn'], ['Kem', 'Nâu'], 'Ánh sáng trang trí cho góc nghỉ ngơi.'],
  ['Bình trang trí dáng tròn', 'Phòng khách', 219000, '/images/home-vase.svg', ['18cm'], ['Kem', 'Nâu'], 'Kiểu dáng đơn giản, dễ phối với nhiều không gian.'],
  ['Kệ nhà tắm nhỏ gọn', 'Phòng tắm', 299000, '/images/home-shelf.svg', ['3 tầng'], ['Trắng', 'Đen'], 'Lưu trữ khăn và đồ dùng cá nhân gọn gàng.'],
  ['Bộ hộp sắp xếp đồ dùng', 'Lưu trữ', 129000, '/images/home-containers.svg', ['Bộ 3'], ['Trong suốt'], 'Sắp xếp những vật dụng nhỏ trong gia đình.'],
];
const HOME_PRODUCTS_V2 = [
  ['Gối tựa sofa Soft', 'Phòng khách', 149000, '/images/home-textiles.svg', ['40 × 40cm', '45 × 45cm'], ['Kem', 'Xanh sage'], 'Gối trang trí cho sofa và góc thư giãn.'],
  ['Chăn phủ sofa Cozy', 'Phòng khách', 279000, '/images/home-textiles.svg', ['130 × 170cm'], ['Kem', 'Nâu'], 'Chăn phủ mềm cho không gian nghỉ ngơi ấm cúng.'],
  ['Bộ khăn mặt Everyday', 'Phòng tắm', 99000, '/images/home-textiles.svg', ['Bộ 3'], ['Kem', 'Xanh sage'], 'Bộ khăn mặt đơn giản cho sinh hoạt hằng ngày.'],
  ['Thảm chân sọc nhỏ', 'Phòng tắm', 119000, '/images/home-textiles.svg', ['40 × 60cm'], ['Kem', 'Nâu'], 'Thảm trang trí nhỏ cho khu vực khô ráo trong nhà.'],
  ['Khay đựng đồ Oval', 'Lưu trữ', 89000, '/images/home-tray.svg', ['24cm', '30cm'], ['Gỗ tự nhiên'], 'Giữ chìa khóa, phụ kiện và đồ dùng nhỏ gọn gàng.'],
  ['Khay phục vụ trà', 'Nhà bếp', 179000, '/images/home-tray.svg', ['35cm'], ['Gỗ tự nhiên', 'Nâu'], 'Khay phục vụ đồ uống và trang trí bàn.'],
  ['Chậu cây để bàn', 'Trang trí', 129000, '/images/home-planter.svg', ['12cm', '16cm'], ['Kem', 'Xanh sage'], 'Chậu trang trí để bàn; cây trong hình chỉ để minh họa.'],
  ['Chậu cây dáng trụ', 'Trang trí', 199000, '/images/home-planter.svg', ['20cm'], ['Kem', 'Nâu'], 'Chậu dáng trụ cho góc nhà; không bao gồm cây.'],
  ['Bộ dụng cụ bếp 4 món', 'Nhà bếp', 229000, '/images/home-utensils.svg', ['Bộ 4'], ['Gỗ tự nhiên'], 'Bộ dụng cụ cơ bản cho việc chuẩn bị bữa ăn.'],
  ['Ống đựng dụng cụ bếp', 'Nhà bếp', 109000, '/images/home-utensils.svg', ['15cm'], ['Kem', 'Nâu'], 'Ống đựng đồ dùng nhà bếp; không kèm dụng cụ minh họa.'],
  ['Vỏ gối ngủ Essential', 'Phòng ngủ', 79000, '/images/home-textiles.svg', ['50 × 70cm'], ['Kem', 'Xanh sage'], 'Vỏ gối màu trơn, dễ phối với không gian phòng ngủ.'],
  ['Khay đầu giường Mini', 'Phòng ngủ', 69000, '/images/home-tray.svg', ['18cm'], ['Gỗ tự nhiên'], 'Khay nhỏ để đồng hồ và vật dụng cá nhân cạnh giường.'],
];
const HOME_PRODUCTS_V3 = [
  ['Kệ gia vị bậc thang 2 tầng', 'Nhà bếp', 249000, '/images/products/shelf.jpg', ['30cm', '40cm'], ['Gỗ tự nhiên', 'Trắng'], 'Kệ hai tầng giúp chai lọ gia vị luôn gọn và dễ lấy.'],
  ['Thớt tre đa năng', 'Nhà bếp', 129000, '/images/products/woodenTools.jpg', ['28cm', '35cm'], ['Gỗ tự nhiên'], 'Thớt tre dùng sơ chế thực phẩm và bày món ăn.'],
  ['Bộ 3 lọ gia vị thủy tinh', 'Nhà bếp', 149000, '/images/products/storage.jpg', ['Bộ 3'], ['Trong suốt'], 'Ba lọ đựng gia vị khô, tiện sắp xếp trên kệ bếp.'],
  ['Bình rót dầu gọn nhẹ', 'Nhà bếp', 89000, '/images/products/storage.jpg', ['300ml'], ['Trong suốt'], 'Bình nhỏ gọn để rót dầu ăn hoặc nước xốt khi nấu nướng.'],
  ['Khăn lau bếp cotton 2 chiếc', 'Nhà bếp', 79000, '/images/products/towels.jpg', ['Bộ 2', '30 × 50cm'], ['Kem', 'Xanh sage'], 'Khăn vải mềm dùng lau tay và bề mặt bếp hằng ngày.'],
  ['Khay ăn sáng chữ nhật', 'Nhà bếp', 169000, '/images/products/tray.jpg', ['32cm', '38cm'], ['Gỗ tự nhiên'], 'Khay chữ nhật phục vụ đồ uống và bữa sáng tại nhà.'],
  ['Vỏ gối sofa Linen', 'Phòng khách', 99000, '/images/products/pillow.jpg', ['40 × 40cm', '45 × 45cm'], ['Kem', 'Nâu'], 'Vỏ gối trang trí có khóa kéo, dễ phối cùng sofa sáng màu.'],
  ['Đệm lót ghế mềm', 'Phòng khách', 139000, '/images/products/pillow.jpg', ['40 × 40cm'], ['Kem', 'Xanh sage'], 'Đệm lót tăng độ êm cho ghế gỗ và ghế ăn.'],
  ['Chăn dệt nhẹ thư giãn', 'Phòng khách', 329000, '/images/products/blanket.jpg', ['130 × 170cm'], ['Kem', 'Nâu'], 'Chăn mỏng dùng phủ sofa hoặc giữ ấm khi nghỉ ngơi.'],
  ['Bình hoa gốm dáng thấp', 'Phòng khách', 159000, '/images/products/vaseRound.jpg', ['16cm', '22cm'], ['Kem', 'Nâu'], 'Bình hoa dáng thấp tạo điểm nhấn cho bàn trà và kệ tủ.'],
  ['Đèn bàn chụp vải', 'Phòng khách', 359000, '/images/products/lamp.jpg', ['38cm'], ['Kem', 'Nâu'], 'Đèn bàn ánh sáng dịu cho góc đọc sách và thư giãn.'],
  ['Kệ sách để bàn Mini', 'Phòng khách', 279000, '/images/products/shelf.jpg', ['2 tầng'], ['Gỗ tự nhiên', 'Trắng'], 'Kệ nhỏ để sách, khung ảnh và vật dụng trên bàn.'],
  ['Bộ ga gối cotton trơn', 'Phòng ngủ', 459000, '/images/products/blanket.jpg', ['1m2', '1m6'], ['Kem', 'Xanh sage'], 'Bộ ga gối màu trơn, dễ phối với không gian phòng ngủ.'],
  ['Khăn phủ cuối giường', 'Phòng ngủ', 219000, '/images/products/blanket.jpg', ['50 × 180cm'], ['Kem', 'Nâu'], 'Khăn phủ trang trí cuối giường, tạo cảm giác ấm cúng.'],
  ['Đèn ngủ để bàn dáng tròn', 'Phòng ngủ', 279000, '/images/products/lamp.jpg', ['30cm'], ['Kem', 'Nâu'], 'Đèn ngủ gọn nhẹ cho bàn đầu giường và góc nghỉ ngơi.'],
  ['Hộp phụ kiện đầu giường', 'Phòng ngủ', 119000, '/images/products/storage.jpg', ['3 ngăn'], ['Kem', 'Trong suốt'], 'Hộp chia ngăn để đồng hồ, kính và phụ kiện cá nhân.'],
  ['Thảm ngủ dệt mềm', 'Phòng ngủ', 179000, '/images/home-textiles.svg', ['45 × 70cm'], ['Kem', 'Xám'], 'Thảm dệt mềm đặt cạnh giường, tạo cảm giác dễ chịu khi bước xuống.'],
  ['Bình hoa cổ cao thanh lịch', 'Trang trí', 239000, '/images/products/vase.jpg', ['24cm', '30cm'], ['Kem', 'Nâu'], 'Bình trang trí cổ cao phù hợp với bàn ăn và kệ phòng khách.'],
  ['Chậu cây mini để bàn', 'Trang trí', 89000, '/images/products/planter.jpg', ['10cm', '14cm'], ['Kem', 'Xanh sage'], 'Chậu trang trí nhỏ cho bàn làm việc; cây trong ảnh chỉ minh họa.'],
  ['Bộ đôi chậu cây cân đối', 'Trang trí', 149000, '/images/products/planter.jpg', ['Bộ 2', '12cm'], ['Kem', 'Nâu'], 'Hai chậu nhỏ tạo điểm xanh cho bệ cửa sổ và bàn làm việc; không gồm cây.'],
  ['Bình gốm trang trí vân mờ', 'Trang trí', 199000, '/images/products/vaseRound.jpg', ['18cm'], ['Kem', 'Nâu'], 'Bình gốm trang trí tối giản cho kệ sách và bàn phụ.'],
  ['Chân nến gốm tối giản', 'Trang trí', 129000, '/images/products/vase.jpg', ['12cm'], ['Kem', 'Nâu'], 'Vật dụng trang trí bàn ăn; nến không đi kèm.'],
  ['Giỏ đựng đồ vải gấp gọn', 'Lưu trữ', 169000, '/images/products/storage.jpg', ['30 × 25cm', '40 × 30cm'], ['Kem', 'Xám'], 'Giỏ gấp gọn để khăn, đồ chơi nhỏ hoặc vật dụng gia đình.'],
  ['Hộp lưu trữ nắp rời', 'Lưu trữ', 79000, '/images/products/storage.jpg', ['Bộ 2', 'Bộ 4'], ['Trong suốt'], 'Hộp có nắp để sắp xếp đồ dùng nhỏ trong ngăn kéo.'],
  ['Khay chia ngăn bàn trang điểm', 'Lưu trữ', 99000, '/images/products/tray.jpg', ['20cm', '28cm'], ['Kem', 'Trong suốt'], 'Khay nhiều ngăn giúp sắp xếp phụ kiện và mỹ phẩm gọn gàng.'],
  ['Kệ để bàn hai tầng', 'Lưu trữ', 199000, '/images/products/shelf.jpg', ['2 tầng', '35cm'], ['Gỗ tự nhiên', 'Trắng'], 'Kệ nhỏ tận dụng chiều cao mặt bàn để cất đồ tiện lợi.'],
  ['Bộ khăn tắm mềm 3 món', 'Phòng tắm', 199000, '/images/products/towels.jpg', ['Bộ 3'], ['Kem', 'Xanh sage'], 'Bộ khăn tắm và khăn mặt cho nhu cầu sinh hoạt hằng ngày.'],
  ['Khăn quấn tóc nhanh khô', 'Phòng tắm', 69000, '/images/products/towels.jpg', ['Bộ 2'], ['Kem', 'Hồng nhạt'], 'Khăn quấn tóc nhẹ, tiện dùng sau khi gội đầu.'],
  ['Thảm chùi chân dệt mềm', 'Phòng tắm', 159000, '/images/home-textiles.svg', ['40 × 60cm'], ['Kem', 'Xám'], 'Thảm mềm đặt trước khu vực tắm; giặt riêng theo hướng dẫn.'],
  ['Kệ góc nhà tắm nhỏ gọn', 'Phòng tắm', 229000, '/images/home-shelf.svg', ['2 tầng', '3 tầng'], ['Trắng', 'Đen'], 'Kệ góc để chai lọ và vật dụng phòng tắm, giúp mặt lavabo thông thoáng.'],
];
function appendProducts(data, products) {
  for (const [name, category, price, image, sizes, colors, description] of products) {
    data.products.push({ id: data.nextProductId++, name, category, price, image, sizes, colors, description, stock: 20, gender: 'all', subCategory: 'home', emoji: '⌂' });
  }
}
function addHomeCatalog(data) {
  if (!(data.homeCatalogVersion >= 1)) appendProducts(data, HOME_PRODUCTS);
  if (!(data.homeCatalogVersion >= 2)) appendProducts(data, HOME_PRODUCTS_V2);
  if (!(data.homeCatalogVersion >= 3)) appendProducts(data, HOME_PRODUCTS_V3);
  data.homeCatalogVersion = Math.max(data.homeCatalogVersion || 0, 3);
  require('./home-photos').addHomePhotos(data);
}
module.exports = { addHomeCatalog };
