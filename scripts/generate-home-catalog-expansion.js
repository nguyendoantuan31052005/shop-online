'use strict';

// Generates a 1,000 item household demo collection and small, distinct local
// still-life illustrations. No external image service or paid storage is used.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const artworkDir = path.join(root, 'public', 'images', 'generated-products');
const outputPath = path.join(root, 'src', 'home-catalog-expansion.json');
fs.mkdirSync(artworkDir, { recursive: true });
for (const file of fs.readdirSync(artworkDir)) {
  if (/^hsx-\d{4}(?:-v\d+)?\.svg$/i.test(file)) fs.unlinkSync(path.join(artworkDir, file));
}
const collections = [
  ['Mộc Tĩnh', 'gỗ sáng và đường nét giản lược'],
  ['An Nhiên', 'sắc kem dịu và chi tiết mềm'],
  ['Lụa Nắng', 'bề mặt ấm lấy cảm hứng từ nắng sớm'],
  ['Thảo Mộc', 'gam xanh sage thanh lịch'],
  ['Sương Mai', 'bảng màu sáng, trong và nhẹ'],
  ['Nếp Nhà', 'vẻ đẹp mộc mạc của vật liệu tự nhiên'],
  ['Lam Trà', 'sắc trà và nâu gỗ trầm'],
  ['Tĩnh Gia', 'hình khối cân đối cho không gian hiện đại'],
  ['Hương Gốm', 'chất gốm thủ công với sắc độ dịu'],
  ['Vân Mây', 'bề mặt mềm mại, màu trung tính'],
];
const palettes = [
  ['#e9dfcc','#b79b70','#355146','#d5c5a6'], ['#e5e9de','#84977f','#394b41','#c4cfbb'],
  ['#eee3d8','#c28e70','#6a493d','#d9b6a0'], ['#e8e5dd','#999487','#42433e','#c8c4ba'],
  ['#e4e9e8','#7c9a99','#344d4d','#b7cecb'], ['#eee4cf','#bd9b59','#544634','#dcc58b'],
  ['#e9dede','#ac7b76','#56403f','#d2ada7'], ['#e8e1d7','#9c8065','#423b33','#c6b39e'],
  ['#dfe8e1','#688876','#334c3c','#adbfaf'], ['#ece8de','#aa987c','#4b473e','#d2c8b7'],
];

const groups = [
  {category:'Nhà bếp', art:'kitchen', types:[
    ['Khay phục vụ trà','tray',189000,'35 × 24cm','Gỗ sáng, Kem','Khay thanh lịch để phục vụ trà và bày món nhẹ.'],['Thớt gỗ bo góc','board',149000,'32 × 22cm','Gỗ tự nhiên','Thớt gỗ hoàn thiện mịn, có thể dùng sơ chế hoặc bày món.'],['Bình rót dầu gốm','bottle',129000,'300ml','Kem, Nâu','Bình rót nhỏ gọn với vòi rót gọn gàng cho mặt bếp.'],['Bộ lọ gia vị thủy tinh','jar',219000,'Bộ 3','Trong suốt, Nâu','Bộ lọ nắp kín để sắp xếp gia vị khô ngăn nắp.'],['Bộ bát ăn tối giản','bowl',329000,'Bộ 4','Trắng ngà, Đất nung','Bộ bát bàn ăn dáng thanh thoát, phối màu trung tính.'],['Cốc sứ men mờ','cup',89000,'320ml','Kem, Xanh sage','Cốc sứ men mờ dùng cho trà, cà phê và đồ uống hằng ngày.'],['Kệ gia vị hai tầng','shelf',279000,'2 tầng','Gỗ sáng, Đen','Kệ tầng giúp chai lọ và gia vị luôn trong tầm tay.'],['Ống đựng dụng cụ bếp','crock',119000,'16cm','Kem, Nâu','Ống sứ để thìa, muôi và dụng cụ nấu ăn thường dùng.'],['Tạp dề linen','textile',179000,'Free size','Be, Xanh olive','Tạp dề dáng gọn bằng vải dệt, có túi trước tiện dụng.'],['Bình nước thủy tinh','carafe',199000,'900ml','Trong suốt, Khói','Bình nước thân thanh, phù hợp bàn ăn và bàn làm việc.'],['Đĩa sứ viền mảnh','plate',139000,'20cm, 26cm','Trắng ngà','Đĩa sứ viền mảnh cho bữa ăn thường ngày.'],['Hũ bảo quản có nắp','jar',159000,'600ml','Kem, Trong suốt','Hũ có nắp để bảo quản nguyên liệu khô trên kệ bếp.'],['Ấm đun nước dáng cổ điển','kettle',449000,'1.2L','Kem, Đen','Ấm đun gọn gàng với tay cầm cách điệu và tông màu trang nhã.'],['Bộ muỗng gỗ','utensils',169000,'Bộ 4','Gỗ tự nhiên','Bộ muỗng gỗ cho việc đảo, trộn và phục vụ món ăn.'],['Khay đựng gia vị','tray',99000,'24cm','Gỗ sáng, Nâu','Khay nhỏ gom các lọ gia vị và chai dầu gọn trên mặt bếp.'],['Lót nồi dệt thủ công','textile',69000,'18cm','Kem, Nâu','Miếng lót nồi dệt chắc tay cho bàn ăn và khu vực nấu nướng.'],
  ]},
  {category:'Phòng khách', art:'living', types:[
    ['Gối tựa sofa','cushion',189000,'45 × 45cm','Kem, Xanh sage','Gối tựa có bề mặt dệt nhẹ, dễ phối với sofa trung tính.'],['Chăn phủ sofa','throw',329000,'130 × 170cm','Kem, Nâu','Chăn phủ dệt mềm tạo lớp ấm áp cho góc nghỉ ngơi.'],['Bình hoa gốm dáng cao','vase',289000,'28cm','Kem, Đất nung','Bình gốm tạo điểm nhấn thanh lịch cho bàn phụ và kệ tủ.'],['Đèn bàn chụp vải','lamp',559000,'42cm','Kem, Nâu gỗ','Đèn bàn ánh sáng dịu dành cho góc đọc sách và thư giãn.'],['Khay trà mặt bàn','tray',229000,'40cm','Gỗ sáng, Nâu','Khay trà phom rộng với tay cầm kín đáo hai bên.'],['Bình khuếch tán tinh dầu','diffuser',249000,'150ml','Hổ phách, Trong suốt','Lọ khuếch tán hương thơm nhẹ cho không gian sinh hoạt.'],['Đôn trang trí tròn','stool',699000,'38cm','Kem, Gỗ sáng','Đôn nhỏ linh hoạt làm ghế phụ hoặc bàn cạnh sofa.'],['Thảm dệt phòng khách','rug',589000,'80 × 140cm','Kem, Nâu cát','Thảm dệt họa tiết tinh giản cho khu vực tiếp khách.'],['Kệ sách thấp','shelf',899000,'3 tầng','Gỗ sáng, Nâu','Kệ thấp để sách và vật dụng trang trí trong tầm với.'],['Bình nến thủy tinh','candle',159000,'220g','Hổ phách, Kem','Nến thơm trong hũ thủy tinh tạo ánh sáng ấm.'],['Tượng trang trí trừu tượng','sculpture',349000,'22cm','Đất nung, Trắng ngà','Tượng decor hình khối tối giản cho bàn console.'],['Khay để điều khiển','tray',119000,'24cm','Gỗ sáng, Đen','Khay để điều khiển và vật dụng nhỏ cạnh sofa.'],['Vỏ gối linen','cushion',139000,'45 × 45cm','Trắng ngà, Sage','Vỏ gối dệt linen tạo lớp chất liệu tự nhiên cho phòng khách.'],['Bàn cạnh sofa mini','table',1090000,'42cm','Gỗ sáng, Đen mờ','Bàn cạnh dáng gọn cho đèn đọc sách và tách trà.'],['Khung ảnh để bàn','frame',129000,'13 × 18cm','Gỗ sáng, Đồng mờ','Khung ảnh tối giản để lưu giữ khoảnh khắc yêu thích.'],
  ]},
  {category:'Phòng ngủ', art:'bedroom', types:[
    ['Bộ ga cotton mềm','bedding',899000,'1m6, 1m8','Kem, Sage','Bộ ga cotton thoáng nhẹ cho không gian nghỉ ngơi.'],['Vỏ gối ngủ cotton','textile',99000,'50 × 70cm','Trắng ngà, Xanh nhạt','Vỏ gối cotton mềm, dễ giặt và phối đồng bộ với chăn ga.'],['Đèn ngủ đầu giường','lamp',429000,'32cm','Kem, Nâu gỗ','Đèn ngủ ánh sáng ấm với chụp đèn tán sáng dịu.'],['Khay đầu giường','tray',119000,'22cm','Gỗ sáng, Nâu','Khay nhỏ giữ đồng hồ và vật dụng cá nhân cạnh giường.'],['Chăn mỏng mùa hè','throw',499000,'150 × 200cm','Kem, Xanh khói','Chăn mỏng nhẹ để phủ giường hoặc dùng khi thư giãn.'],['Rèm cửa linen','textile',559000,'140 × 220cm','Be, Trắng ngà','Rèm dệt tông sáng giúp hoàn thiện khung cửa phòng ngủ.'],['Gối ôm dáng dài','cushion',219000,'35 × 100cm','Kem, Sage','Gối ôm bọc vải mềm, bổ sung điểm nhấn cho giường ngủ.'],['Hộp trang sức để bàn','box',249000,'3 ngăn','Kem, Nâu','Hộp chia ngăn để cất trang sức và phụ kiện cá nhân.'],['Thảm cạnh giường','rug',259000,'50 × 80cm','Kem, Nâu cát','Thảm dệt êm đặt cạnh giường với màu sắc nhẹ nhàng.'],['Gương để bàn','mirror',329000,'32cm','Đồng mờ, Gỗ sáng','Gương để bàn chân đế nhỏ cho bàn trang điểm.'],['Tủ đầu giường mini','table',1190000,'2 ngăn','Gỗ sáng, Trắng','Tủ đầu giường gọn với hai ngăn chứa đồ kín đáo.'],['Túi thơm tủ áo','sachet',79000,'Bộ 3','Linen, Lavender','Túi thơm treo tủ quần áo hương nhẹ nhàng.'],['Đệm trang trí cuối giường','throw',359000,'60 × 180cm','Kem, Nâu','Đệm phủ dệt trang trí ở cuối giường.'],['Kệ treo đầu giường','shelf',389000,'40cm','Gỗ sáng, Trắng','Kệ treo nhỏ cho sách và vật dụng cần thiết trước giờ ngủ.'],
  ]},
  {category:'Phòng tắm', art:'bath', types:[
    ['Khăn tắm cotton','textile',189000,'70 × 140cm','Trắng ngà, Sage','Khăn tắm cotton thấm hút tốt với bề mặt dệt mềm.'],['Khăn mặt cotton','textile',59000,'35 × 75cm','Kem, Trắng','Khăn mặt gọn nhẹ cho sinh hoạt mỗi ngày.'],['Thảm phòng tắm dệt','rug',159000,'45 × 70cm','Kem, Nâu cát','Thảm dệt có độ bám, đặt bên ngoài khu vực tắm.'],['Kệ lavabo hai tầng','shelf',329000,'2 tầng','Trắng, Đen mờ','Kệ lavabo sắp xếp chai lọ và vật dụng thường dùng.'],['Bình nhấn xà phòng','dispenser',119000,'300ml','Kem, Hổ phách','Bình nhấn tiện dụng, tạo góc lavabo đồng bộ.'],['Khay đựng đồ lavabo','tray',99000,'25cm','Đá kem, Nâu','Khay chống đọng nước để gom vật dụng cá nhân.'],['Giỏ đựng khăn','basket',229000,'32cm','Kem, Nâu tự nhiên','Giỏ đựng khăn và đồ giặt nhỏ với kiểu đan thoáng.'],['Cốc đựng bàn chải','cup',79000,'11cm','Trắng, Sage','Cốc sứ gọn gàng cho khu vực lavabo.'],['Hộp khăn giấy','box',169000,'20cm','Gỗ sáng, Trắng','Hộp khăn giấy nắp rời cho bàn lavabo hoặc kệ.'],['Bộ lọ chiết mỹ phẩm','bottle',149000,'Bộ 3','Hổ phách, Trong suốt','Bộ lọ chiết gọn nhẹ cho đồ dùng chăm sóc cá nhân.'],['Móc treo khăn tối giản','hook',89000,'Bộ 2','Đen mờ, Đồng','Móc treo tường nhỏ với lớp hoàn thiện bền đẹp.'],['Kệ góc phòng tắm','shelf',249000,'2 tầng','Trắng, Đen','Kệ góc tận dụng không gian để chai dầu gội và sữa tắm.'],
  ]},
  {category:'Trang trí', art:'decor', types:[
    ['Bình gốm trang trí','vase',219000,'20cm','Kem, Đất nung','Bình gốm thủ công dáng thanh cho bàn console và kệ.'],['Chậu cây để bàn','planter',139000,'14cm','Kem, Sage','Chậu cây trang trí để bàn; cây không đi kèm.'],['Chân nến gốm','candle',169000,'16cm','Trắng ngà, Nâu','Chân nến gốm tạo điểm nhấn trang nhã trên bàn ăn.'],['Tranh treo tường trừu tượng','frame',389000,'30 × 40cm','Kem, Nâu đất','Tranh hình khối tông đất cho bức tường cần điểm nhấn.'],['Đồng hồ để bàn','clock',289000,'18cm','Đồng mờ, Đen','Đồng hồ để bàn dáng thanh lịch cho phòng làm việc.'],['Gương treo tường bo tròn','mirror',599000,'45cm','Đồng, Đen mờ','Gương treo tường bo mềm cho hành lang hoặc phòng ngủ.'],['Đèn nến LED trang trí','lamp',249000,'18cm','Kem, Đồng','Đèn nến LED ánh sáng ấm, dùng làm điểm sáng trang trí.'],['Tượng gốm tối giản','sculpture',329000,'21cm','Đất nung, Trắng','Tượng gốm hình khối nhỏ cho kệ và bàn phụ.'],['Lọ khuếch tán hương','diffuser',229000,'120ml','Hổ phách, Khói','Lọ hương với que khuếch tán phù hợp không gian thư giãn.'],['Bộ bình trang trí mini','vase',279000,'Bộ 2','Kem, Nâu','Bộ bình nhỏ cùng tông để phối thành cụm trên kệ.'],['Đĩa decor để bàn','plate',159000,'22cm','Trắng ngà, Đất nung','Đĩa trang trí để giữ phụ kiện nhỏ và tạo điểm nhấn.'],['Chậu cây treo nhỏ','planter',179000,'16cm','Sage, Kem','Chậu cây dáng treo; cây trong ảnh minh họa không đi kèm.'],['Khay trưng bày trang sức','tray',139000,'20cm','Kem, Đồng','Khay nhỏ đặt nhẫn và phụ kiện trên bàn trang điểm.'],['Đèn tường chụp vải','lamp',729000,'28cm','Kem, Đồng mờ','Đèn tường chụp vải cho ánh sáng êm dịu.'],['Bó hoa khô trang trí','floral',199000,'35cm','Be, Nâu','Bó hoa khô tông tự nhiên dùng cắm bình trang trí.'],
  ]},
  {category:'Lưu trữ', art:'storage', types:[
    ['Giỏ đựng đồ đan','basket',189000,'30cm','Mây tự nhiên, Kem','Giỏ đan để sắp xếp khăn, đồ chơi hoặc phụ kiện gia đình.'],['Hộp vải có nắp','box',149000,'30 × 25cm','Kem, Xám','Hộp vải có nắp để lưu trữ đồ dùng theo mùa.'],['Kệ để bàn hai tầng','shelf',269000,'2 tầng','Gỗ sáng, Trắng','Kệ hai tầng mở rộng không gian lưu trữ trên mặt bàn.'],['Khay chia ngăn ngăn kéo','tray',129000,'6 ngăn','Gỗ sáng, Trắng','Khay chia ngăn cho phụ kiện nhỏ và vật dụng văn phòng.'],['Móc treo sau cửa','hook',99000,'Bộ 5','Đen, Đồng mờ','Bộ móc treo gọn nhẹ cho áo khoác và túi xách.'],['Túi vải đựng chăn','basket',159000,'60L','Kem, Sage','Túi vải thoáng để cất chăn gối khi không sử dụng.'],['Hộp đựng phụ kiện','box',89000,'20cm','Trong suốt, Trắng','Hộp chia ngăn trong suốt giúp dễ nhìn và tìm đồ.'],['Khay thư từ để bàn','tray',169000,'28cm','Gỗ sáng, Đen','Khay để thư từ và giấy tờ trên bàn làm việc.'],['Kệ giày thấp','shelf',589000,'3 tầng','Gỗ sáng, Đen','Kệ giày thấp giữ lối vào gọn gàng và thông thoáng.'],['Giỏ đựng đồ giặt','basket',299000,'45L','Kem, Nâu','Giỏ đựng đồ giặt có quai xách tiện di chuyển.'],['Hộp đựng trà nhiều ngăn','box',199000,'8 ngăn','Gỗ sáng, Nâu','Hộp nhiều ngăn sắp xếp túi trà theo từng vị.'],['Kệ treo tường thanh mảnh','shelf',329000,'50cm','Gỗ sáng, Đen','Kệ treo tường cho sách và vật dụng trang trí nhỏ.'],['Túi đựng đồ du lịch','basket',179000,'Bộ 3','Be, Sage','Bộ túi vải phân loại vật dụng trong hành lý.'],['Khay để chìa khóa','tray',79000,'18cm','Gỗ sáng, Nâu','Khay nhỏ gần cửa ra vào để chìa khóa và vật dụng hàng ngày.'],
  ]},
  {category:'Gia dụng', art:'appliance', types:[
    ['Ấm siêu tốc thân thủy tinh','kettle',589000,'1.5L','Trắng, Đen','Ấm siêu tốc thân thủy tinh với vạch mực nước dễ quan sát.'],['Máy xay cầm tay','blender',699000,'600ml','Kem, Đen','Máy xay cầm tay nhỏ gọn cho sinh tố và món trộn.'],['Đèn bàn cảm ứng','lamp',459000,'35cm','Trắng ngà, Đen','Đèn bàn cảm ứng với ánh sáng điều chỉnh linh hoạt.'],['Quạt bàn mini','fan',389000,'25cm','Trắng, Sage','Quạt bàn nhỏ với kiểu dáng tối giản cho góc làm việc.'],['Máy khuếch tán siêu âm','diffuser',429000,'300ml','Kem, Gỗ sáng','Máy khuếch tán hương có đèn dịu cho không gian thư giãn.'],['Cân nhà bếp điện tử','scale',249000,'5kg','Trắng, Đen','Cân nhà bếp gọn nhẹ với mặt kính dễ vệ sinh.'],['Máy pha cà phê nhỏ gọn','coffee',1290000,'600ml','Đen, Kem','Máy pha cà phê thiết kế gọn cho góc cà phê tại nhà.'],['Bình giữ nhiệt inox','carafe',329000,'500ml','Kem, Đen','Bình giữ nhiệt hai lớp dùng cho bàn làm việc và khi di chuyển.'],['Máy tạo ẩm để bàn','humidifier',499000,'2L','Trắng, Gỗ sáng','Máy tạo ẩm dáng gọn cho phòng ngủ và phòng làm việc.'],['Máy hút bụi mini','vacuum',899000,'0.8L','Trắng, Xám','Máy hút bụi cầm tay phục vụ dọn dẹp nhanh trong nhà.'],['Máy nướng bánh mini','toaster',759000,'2 lát','Kem, Bạc','Máy nướng bánh hai lát với thiết kế gọn gàng cho bếp nhỏ.'],['Hộp cơm giữ nhiệt','lunchbox',279000,'900ml','Kem, Sage','Hộp cơm nhiều ngăn có nắp kín dùng mang theo hàng ngày.'],['Đèn đọc sách kẹp bàn','lamp',229000,'38cm','Đen, Trắng','Đèn kẹp linh hoạt dành cho bàn học và đầu giường.'],['Bình lọc nước để bàn','carafe',419000,'1.2L','Trắng, Khói','Bình lọc để bàn dáng thanh, dễ đặt trong tủ lạnh.'],
  ]},
];

const categoryPalettes = {
  'Nhà bếp': ['#e8dfcf','#9d7b51','#374c40','#c5a97c'],
  'Phòng khách': ['#eee8dd','#a88966','#35483d','#c5b29a'],
  'Phòng ngủ': ['#e9e9e2','#84907e','#37453b','#bdc5b6'],
  'Phòng tắm': ['#e3e9e6','#7d9992','#334d49','#b9ceca'],
  'Trang trí': ['#eee4d6','#ad8762','#594333','#d2b392'],
  'Lưu trữ': ['#e7e7df','#8e927f','#42483c','#b8bba8'],
  'Gia dụng': ['#e7e8e4','#8c9b94','#384542','#becbc5'],
};

function escapeXml(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch])); }

function objectArt(kind, a, b, c, variant) {
  if (kind === 'crock') kind = 'jar';
  const shift = (variant % 5) * 5;
  const parts = {
    vase: `<path d="M250 ${260+shift} C245 315 195 342 205 420 C213 490 387 490 395 420 C405 342 355 315 350 ${260+shift}Z" fill="${a}"/><ellipse cx="300" cy="260" rx="50" ry="13" fill="${b}"/><path d="M220 405 Q300 ${430+shift} 380 405" fill="none" stroke="${c}" stroke-opacity=".36" stroke-width="5"/>`,
    lamp: `<path d="M220 ${245+shift} L380 ${245+shift} L350 330 L250 330Z" fill="${a}"/><path d="M292 330 L308 330 L325 430 L275 430Z" fill="${b}"/><ellipse cx="300" cy="438" rx="70" ry="16" fill="${c}"/>`,
    cushion: `<rect x="200" y="275" width="200" height="175" rx="42" fill="${a}"/><rect x="218" y="293" width="164" height="139" rx="32" fill="none" stroke="${b}" stroke-width="4"/><path d="M240 315 Q300 360 360 315" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="5"/>`,
    throw: `<path d="M225 235 Q300 220 375 240 L360 445 Q300 465 240 445Z" fill="${a}"/><path d="M245 270 Q300 285 355 270 M242 310 Q300 325 352 310 M240 350 Q300 365 350 350 M238 390 Q300 405 348 390" fill="none" stroke="${b}" stroke-width="5"/><path d="M255 445v25m30-24v27m30-27v27m30-28v25" stroke="${c}" stroke-width="4"/>`,
    tray: `<rect x="182" y="300" width="236" height="130" rx="22" fill="${a}"/><rect x="202" y="316" width="196" height="98" rx="14" fill="none" stroke="${b}" stroke-width="5"/><ellipse cx="300" cy="365" rx="22" ry="9" fill="${c}"/>`,
    shelf: `<path d="M210 225v235m180-235v235M205 290h190M205 365h190M205 440h190" fill="none" stroke="${a}" stroke-width="16" stroke-linecap="round"/><path d="M220 282h160m-160 75h160m-160 75h160" stroke="${b}" stroke-width="5"/>`,
    jar: `<rect x="240" y="270" width="120" height="172" rx="22" fill="${a}"/><rect x="252" y="245" width="96" height="32" rx="8" fill="${b}"/><path d="M255 345h90" stroke="${c}" stroke-width="5" stroke-opacity=".65"/><rect x="272" y="310" width="56" height="62" rx="8" fill="${c}" fill-opacity=".13"/>`,
    bottle: `<path d="M270 248h60v44l45 42v116q0 20-22 20H247q-22 0-22-20V334l45-42Z" fill="${a}"/><rect x="274" y="225" width="52" height="30" rx="6" fill="${b}"/><path d="M240 370h120" stroke="${c}" stroke-width="5" stroke-opacity=".6"/>`,
    bowl: `<ellipse cx="300" cy="345" rx="112" ry="35" fill="${b}"/><path d="M190 346q15 106 110 106t110-106" fill="${a}"/><ellipse cx="300" cy="350" rx="78" ry="19" fill="${c}" fill-opacity=".55"/>`,
    cup: `<path d="M235 285h125v112q-5 48-62 48t-63-48Z" fill="${a}"/><path d="M360 305h32q40 0 30 44t-57 38" fill="none" stroke="${b}" stroke-width="15"/><ellipse cx="298" cy="285" rx="63" ry="13" fill="${c}"/>`,
    planter: `<path d="M230 330h140l-20 120q-50 25-100 0Z" fill="${a}"/><path d="M300 330v-90m0 52q-65-55-78-8 20 38 78 29m0-12q68-67 82-18-26 40-82 40m0-50q-8-55-43-54-14 32 43 54" fill="none" stroke="${b}" stroke-width="13" stroke-linecap="round"/><ellipse cx="300" cy="330" rx="72" ry="13" fill="${c}"/>`,
    candle: `<rect x="240" y="290" width="120" height="150" rx="18" fill="${a}" fill-opacity=".78"/><path d="M300 290v-25m0-20q-25 20 0 28 22-12 0-28" stroke="${b}" stroke-width="6" fill="${c}"/><ellipse cx="300" cy="300" rx="48" ry="8" fill="${c}" fill-opacity=".7"/>`,
    frame: `<rect x="210" y="235" width="180" height="215" rx="10" fill="${a}"/><rect x="228" y="253" width="144" height="179" fill="#f5f0e7"/><circle cx="330" cy="300" r="28" fill="${c}"/><path d="M242 400q40-80 78-50t48 50Z" fill="${b}"/>`,
    basket: `<path d="M215 300h170l-15 150q-70 38-140 0Z" fill="${a}"/><path d="M240 306v132m35-132v145m35-145v145m35-145v132M218 345h157m-152 40h147m-144 38h140" stroke="${b}" stroke-width="7" stroke-opacity=".7"/>`,
    box: `<rect x="215" y="290" width="170" height="155" rx="18" fill="${a}"/><path d="M215 325h170M245 290v155m110-155v155" stroke="${b}" stroke-width="6" stroke-opacity=".7"/><rect x="275" y="348" width="50" height="28" rx="8" fill="${c}"/>`,
    rug: `<rect x="210" y="250" width="180" height="200" rx="14" fill="${a}"/><path d="M232 275h136m-136 28h136m-136 28h136m-136 28h136m-136 28h136m-136 28h136" stroke="${b}" stroke-width="5" stroke-opacity=".62"/><circle cx="300" cy="350" r="35" fill="${c}" fill-opacity=".32"/>`,
    board: `<path d="M300 228q32 0 32 32v24q74 25 74 80v58q0 30-31 30H225q-31 0-31-30v-58q0-55 74-80v-24q0-32 32-32Z" fill="${a}"/><circle cx="300" cy="260" r="9" fill="${b}"/><path d="M230 390h140" stroke="${c}" stroke-width="5" stroke-opacity=".58"/>`,
    utensils: `<path d="M245 235v150m0-120q-26 10-26 60t26 60m0-120q26 10 26 60t-26 60m72-150v215m0-215q40 26 38 72t-38 45" fill="none" stroke="${a}" stroke-width="13" stroke-linecap="round"/>`,
    carafe: `<path d="M280 240h40v35q62 22 62 82v75q0 20-22 20h-120q-22 0-22-20v-75q0-60 62-82Z" fill="${a}"/><path d="M240 350h120" stroke="${b}" stroke-width="5"/><path d="M320 255h35" stroke="${c}" stroke-width="8"/>`,
    plate: `<circle cx="300" cy="350" r="108" fill="${a}"/><circle cx="300" cy="350" r="78" fill="none" stroke="${b}" stroke-width="6"/><circle cx="300" cy="350" r="58" fill="none" stroke="${c}" stroke-width="3"/>`,
    table: `<path d="M205 275h190v33H205Zm22 33h16v142h-16zm132 0h16v142h-16z" fill="${a}"/><path d="M220 318h160" stroke="${b}" stroke-width="4"/>`,
    stool: `<ellipse cx="300" cy="300" rx="90" ry="32" fill="${a}"/><path d="M225 300v145m150-145v145m-115-140v140m80-140v140" stroke="${b}" stroke-width="13"/><path d="M220 370h160" stroke="${c}" stroke-width="9"/>`,
    diffuser: `<rect x="250" y="330" width="100" height="115" rx="20" fill="${a}"/><path d="M270 330 245 220m45 110 8-125m28 125 40-100m-78 102-4-95" stroke="${b}" stroke-width="5" stroke-linecap="round"/><ellipse cx="300" cy="330" rx="50" ry="12" fill="${c}"/>`,
    textile: `<path d="M235 250h130v190H235z" rx="14" fill="${a}"/><path d="M255 270v150m35-150v150m35-150v150m35-150v150" stroke="${b}" stroke-width="6" stroke-opacity=".7"/><path d="M235 300h130m-130 48h130m-130 48h130" stroke="${c}" stroke-width="4" stroke-opacity=".55"/>`,
    stool: `<ellipse cx="300" cy="300" rx="90" ry="32" fill="${a}"/><path d="M225 300v145m150-145v145m-115-140v140m80-140v140" stroke="${b}" stroke-width="13"/>`,
    sculpture: `<path d="M300 230q75 35 25 98 90 25 35 102-27 43-60-8-37 51-68 8-55-77 35-102-50-63 33-98Z" fill="${a}"/><circle cx="300" cy="350" r="13" fill="${b}"/>`,
    clock: `<circle cx="300" cy="350" r="100" fill="${a}"/><circle cx="300" cy="350" r="82" fill="#f6f2e9"/><path d="M300 285v68l45 30" fill="none" stroke="${b}" stroke-width="8" stroke-linecap="round"/><circle cx="300" cy="350" r="8" fill="${c}"/>`,
    mirror: `<ellipse cx="300" cy="335" rx="83" ry="112" fill="${a}"/><ellipse cx="300" cy="335" rx="64" ry="90" fill="#dce4e1"/><path d="M250 300q28-42 58-39" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="10" stroke-linecap="round"/><path d="M260 450h80" stroke="${b}" stroke-width="12" stroke-linecap="round"/>`,
    floral: `<path d="M300 430V260m0 95q-68-64-86-24 20 44 86 37m0-35q60-74 86-33-18 46-86 46" fill="none" stroke="${b}" stroke-width="12" stroke-linecap="round"/><circle cx="300" cy="245" r="28" fill="${a}"/><circle cx="218" cy="270" r="22" fill="${c}"/><circle cx="380" cy="264" r="24" fill="${a}"/>`,
    hook: `<path d="M250 280v95q0 50 50 50t50-50v-25m-100-90q50-40 100 0" fill="none" stroke="${a}" stroke-width="18" stroke-linecap="round"/><circle cx="300" cy="275" r="18" fill="${b}"/>`,
    dispenser: `<rect x="250" y="295" width="100" height="150" rx="18" fill="${a}"/><path d="M280 295v-32h50v32m-15-32h70" fill="none" stroke="${b}" stroke-width="10" stroke-linecap="round"/><path d="M270 360h60" stroke="${c}" stroke-width="5"/>`,
    kettle: `<path d="M235 300q0-60 65-60t65 60v105q0 40-65 40t-65-40Z" fill="${a}"/><path d="M365 310q60-10 35 72h-35M275 240v-35h50v35" fill="none" stroke="${b}" stroke-width="13" stroke-linecap="round"/><path d="M250 345h100" stroke="${c}" stroke-width="5"/>`,
    blender: `<path d="M245 255h110l-10 135q-45 25-90 0Z" fill="${a}"/><rect x="230" y="395" width="140" height="48" rx="14" fill="${b}"/><path d="M265 280h70" stroke="${c}" stroke-width="5"/>`,
    fan: `<circle cx="300" cy="315" r="77" fill="none" stroke="${a}" stroke-width="12"/><circle cx="300" cy="315" r="14" fill="${b}"/><path d="M300 300q-20-80 3-74 45 13 13 76m-29 18q-85 10-72-15 24-39 76-8m19 17q32 80 8 80-45 0-29-73" fill="${c}"/><path d="M300 395v50m-45 0h90" stroke="${a}" stroke-width="12" stroke-linecap="round"/>`,
    scale: `<rect x="220" y="255" width="160" height="190" rx="24" fill="${a}"/><rect x="255" y="280" width="90" height="42" rx="12" fill="${b}"/><path d="M270 400h60" stroke="${c}" stroke-width="6"/>`,
    coffee: `<path d="M245 260h110v155H245z" rx="16" fill="${a}"/><rect x="230" y="410" width="140" height="30" rx="10" fill="${b}"/><path d="M355 290h30v70h-30m-85-30h60" fill="none" stroke="${c}" stroke-width="10"/><path d="M275 240h50" stroke="${b}" stroke-width="12" stroke-linecap="round"/>`,
    humidifier: `<path d="M235 320q65-40 130 0l-12 110q-53 28-106 0Z" fill="${a}"/><ellipse cx="300" cy="320" rx="65" ry="18" fill="${b}"/><path d="M280 285q-30-40 0-70m40 70q30-40 0-70" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`,
    vacuum: `<path d="M250 340q0-80 75-80t75 80v75h-50v-75q0-30-25-30t-25 30v85h-50Z" fill="${a}"/><circle cx="270" cy="440" r="16" fill="${b}"/><circle cx="360" cy="440" r="16" fill="${b}"/><path d="M325 275v-45h35" fill="none" stroke="${c}" stroke-width="12"/>`,
    toaster: `<rect x="220" y="300" width="160" height="120" rx="28" fill="${a}"/><path d="M250 300v-48m50 48v-48m50 48v-48" stroke="${b}" stroke-width="9" stroke-linecap="round"/><circle cx="350" cy="375" r="10" fill="${c}"/>`,
    lunchbox: `<rect x="220" y="300" width="160" height="135" rx="24" fill="${a}"/><path d="M220 340h160m-80-40v135" stroke="${b}" stroke-width="7"/><rect x="270" y="275" width="60" height="22" rx="8" fill="${c}"/>`,
    sachet: `<path d="M245 280h110l-8 155h-94Z" fill="${a}"/><path d="M265 315q35-34 70 0m-65 36q30 25 60 0" fill="none" stroke="${b}" stroke-width="6"/><circle cx="300" cy="405" r="10" fill="${c}"/>`,
  };
  return parts[kind] || parts.vase;
}

function svgFor(product, ordinal) {
  const palette = categoryPalettes[product.category];
  const colors = palettes[ordinal % palettes.length];
  const [bg, accent, dark, highlight] = colors;
  const shift = ordinal % 7;
  const art = objectArt(product.imageType || product.art, accent, dark, highlight, ordinal);
  const title = escapeXml(product.name.split(' — ')[0]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 640" role="img" aria-label="Minh họa ${title}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${bg}"/></linearGradient><radialGradient id="glow"><stop stop-color="#fff" stop-opacity=".52"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="600" height="640" fill="url(#bg)"/><circle cx="${445+shift*7}" cy="${158+shift*4}" r="145" fill="${highlight}" opacity=".17"/><ellipse cx="300" cy="474" rx="145" ry="28" fill="${dark}" opacity=".14" filter="url(#shadow)"/><ellipse cx="190" cy="175" rx="185" ry="150" fill="url(#glow)"/><g transform="translate(300 350) scale(1.34) translate(-300 -350)">${art}</g><path d="M0 518 Q160 489 300 518 T600 512V640H0Z" fill="#fff" opacity=".2"/><text x="38" y="568" fill="${dark}" font-family="Georgia,serif" font-size="13" letter-spacing="3">HOME SHOPPING · STUDIO</text><text x="540" y="568" text-anchor="end" fill="${dark}" font-family="Arial,sans-serif" font-size="12" letter-spacing="2">${String(ordinal+1).padStart(4,'0')}</text><path d="M38 586h524" stroke="${accent}" stroke-opacity=".35"/><text x="38" y="612" fill="${dark}" fill-opacity=".7" font-family="Arial,sans-serif" font-size="10" letter-spacing="1.6">${escapeXml(product.category.toUpperCase())}</text></svg>`;
}

const products = [];
for (const group of groups) {
  for (const [name, art, basePrice, size, color, description] of group.types) {
    for (let variant = 0; variant < collections.length; variant++) {
      const ordinal = products.length;
      const [collection, finish] = collections[variant];
      const sku = `HSX-${String(ordinal + 1).padStart(4, '0')}`;
      const image = `/images/generated-products/${sku.toLowerCase()}-v3.svg`;
      const tone = color.split(', ')[variant % color.split(', ').length];
      products.push({
        sku,
        name: `${name} — ${collection}`,
        category: group.category,
        subCategory: 'home',
        gender: 'all',
        brand: 'Home Shopping Studio',
        price: basePrice + variant * 7000,
        stock: 8 + ((ordinal * 7 + variant) % 18),
        shippingWeightG: 250 + ((ordinal * 83) % 3600),
        shippingLengthCm: 18 + ((ordinal * 3) % 48),
        shippingWidthCm: 14 + ((ordinal * 5) % 36),
        shippingHeightCm: 8 + ((ordinal * 7) % 44),
        emoji: '⌂',
        description: `${description} Phiên bản ${collection.toLowerCase()}, hoàn thiện theo tinh thần ${finish}. Tông màu: ${tone}.`,
        image,
        imageType: art,
        images: [],
        sizes: size.split(', '),
        colors: color.split(', '),
        art,
      });
      fs.writeFileSync(path.join(artworkDir, `${sku.toLowerCase()}-v3.svg`), svgFor(products.at(-1), ordinal), 'utf8');
    }
  }
}

if (products.length !== 1000) throw new Error(`Expected 1000 products; generated ${products.length}`);
fs.writeFileSync(outputPath, `${JSON.stringify(products.map(({art, ...product}) => product), null, 2)}\n`, 'utf8');
console.log(`Generated ${products.length} products and ${products.length} distinct SVG illustrations.`);
