const fieldInfo = {
  id: 'Định danh bản ghi; dùng giá trị trả về từ API, không tự suy đoán.',
  productId: 'ID sản phẩm hiện có trong catalog.', product_id: 'ID sản phẩm được lưu trong dòng đơn hàng.',
  quantity: 'Số lượng của biến thể. Server cộng gộp các biến thể để kiểm tra tồn kho chung.',
  items: 'Danh sách dữ liệu; cấu trúc từng phần tử được mô tả trong schema.',
  price: 'Đơn giá nguyên, đơn vị VND.', subtotal: 'Tiền hàng trước giảm giá và phí giao hàng, đơn vị VND.',
  shippingFee: 'Phí giao hàng sau ưu đãi vận chuyển, đơn vị VND.', discount: 'Số tiền giảm trên tiền hàng, đơn vị VND.',
  total: 'Tổng cần thanh toán = subtotal − discount + shippingFee, đơn vị VND.',
  expectedTotal: 'Tổng báo giá khách đã xác nhận. Khác tổng hiện tại sẽ trả 409, không tạo đơn.',
  stock: 'Tồn kho chung cho mọi màu và quy cách của sản phẩm.',
  sizes: 'Các quy cách/kích cỡ được phép chọn.', colors: 'Các màu được phép chọn.',
  size: 'Quy cách/kích cỡ chính xác trong sizes của sản phẩm.', color: 'Màu chính xác trong colors của sản phẩm.',
  name: 'Tên hiển thị.', username: 'Tên đăng nhập; admin được dành riêng cho quản trị.',
  email: 'Email; để chuỗi rỗng nếu trường này không bắt buộc và chưa cung cấp.',
  phone: 'Điện thoại Việt Nam bắt đầu bằng 0, gồm 10–11 chữ số.',
  password: 'Mật khẩu. Không có mật khẩu quản trị mặc định trong tài liệu.',
  currentPassword: 'Mật khẩu hiện tại để xác nhận quyền đổi mật khẩu.',
  newPassword: 'Mật khẩu mới 8–256 ký tự. Thành công sẽ thu hồi token hiện có.',
  address: 'Địa chỉ giao hàng hoặc địa chỉ shop tùy tài nguyên.', city: 'Tỉnh/thành phố.', ward: 'Phường/xã.', district: 'Quận/huyện nếu có.',
  isDefault: 'Đánh dấu địa chỉ mặc định; mỗi sổ chỉ có tối đa một địa chỉ mặc định.',
  voucherCode: 'Mã voucher; có thể bỏ qua nếu không áp dụng ưu đãi.',
  code: 'Mã voucher được chuẩn hóa thành chữ hoa.', minOrder: 'Giá trị tiền hàng tối thiểu để áp dụng voucher, đơn vị VND.',
  maxDiscount: 'Giảm tối đa, đơn vị VND. 0 nghĩa là không giới hạn.', usageLimit: 'Tổng lượt dùng cho cả shop. 0 nghĩa là không giới hạn.',
  used: 'Số lượt đã dùng; được hoàn lại khi hủy đơn hợp lệ.', active: 'Trạng thái bật/tắt voucher.',
  startsAt: 'Thời điểm bắt đầu ISO 8601; null hoặc chuỗi rỗng nghĩa là không giới hạn.',
  expiresAt: 'Thời điểm hết hạn ISO 8601; null hoặc chuỗi rỗng nghĩa là không giới hạn.',
  createdAt: 'Thời điểm tạo do server cấp.', created_at: 'Thời điểm tạo do server cấp.', updatedAt: 'Thời điểm cập nhật gần nhất.',
  token: 'Bearer JWT khách hàng, hết hạn sau 24 giờ. Không dùng token mẫu để xác thực.',
  disabled: 'true để khóa tài khoản, false để mở lại.', hidden: 'true để ẩn đánh giá công khai, false để hiện lại.',
  rating: 'Số sao nguyên từ 1 đến 5.', comment: 'Nội dung đánh giá của khách đã hoàn thành đơn.',
  verified: 'Đánh giá đã được server xác minh quyền mua hàng.',
  reply: 'Phản hồi của shop hiển thị cho chủ phiếu hỗ trợ.', message: 'Nội dung yêu cầu hỗ trợ.',
  orderId: 'ID đơn thuộc tài khoản đang đăng nhập.', image: 'URL http/https hoặc đường dẫn ảnh bắt đầu bằng /.',
  paymentMethod: 'Hiện chỉ hỗ trợ cod: thanh toán khi nhận hàng.',
  page: 'Trang, bắt đầu từ 1.', limit: 'Số sản phẩm mỗi trang, tối đa 100.',
  subCategory: 'Nhóm bộ sưu tập; home cho catalog gia dụng mẫu.', gender: 'Nhóm catalog; all cho sản phẩm không phân nhóm giới tính.',
  facebookUrl: 'Link HTTPS chính thức Facebook.', messengerUrl: 'Link HTTPS Messenger hoặc m.me.',
  zaloPhone: 'Số điện thoại đăng ký Zalo.', hours: 'Giờ hỗ trợ công khai của shop.',
};
const values = {
  id: 1, productId: 1, product_id: 1, orderId: 1, quantity: 1,
  name: 'Nguyễn Văn A', customer_name: 'Nguyễn Văn A', username: 'khachhang01', email: 'khach@example.com', phone: '0901234567',
  address: '12 Nguyễn Huệ', city: 'Hồ Chí Minh', ward: 'Phường Bến Nghé', district: '',
  password: 'MatKhau123!A', currentPassword: 'MatKhau123!A', newPassword: 'MatKhauMoi456!',
  size: 'M', color: 'Trắng', sizes: ['M', 'L'], colors: ['Trắng', 'Đen'],
  price: 149000, stock: 20, subtotal: 149000, shippingFee: 30000, discount: 0, total: 179000, expectedTotal: 179000,
  code: 'DEMO10', voucherCode: '', value: 10, minOrder: 0, maxDiscount: 50000, usageLimit: 100,
  rating: 5, comment: 'Sản phẩm đúng mô tả, đóng gói cẩn thận.', message: 'Tôi cần shop hỗ trợ kiểm tra đơn hàng.', reply: 'Shop đã tiếp nhận và đang kiểm tra.',
  category: 'Trang trí', description: 'Mô tả sản phẩm hoặc chương trình ưu đãi.', image: '/images/products/lamp.jpg', gender: 'all', subCategory: 'home', emoji: '⌂',
  token: '<JWT nhận từ đăng nhập>', version: 'dev', status: 'new', paymentMethod: 'cod',
  authenticated: true, loggedOut: true, changed: true, requiresLogin: true, deleted: true, active: true, available: true, verified: true, isDefault: true, redirect: '/admin',
  createdAt: '2026-10-19T01:00:00.000Z', created_at: '2026-10-19T01:00:00.000Z', updatedAt: '2026-10-19T01:00:00.000Z',
  startsAt: null, expiresAt: null, voucherId: null, facebookName: 'Tên Facebook shop', facebookUrl: '', messengerUrl: '', zaloPhone: '', hours: '8:00–21:00',
};
function sample(schema, schemas, name = '', depth = 0) {
  if (depth > 12) return null;
  if (schema.$ref) return sample(schemas[schema.$ref.split('/').pop()], schemas, name, depth + 1);
  if (schema.example !== undefined) return schema.example;
  if (schema.oneOf) return sample(schema.oneOf[0], schemas, name, depth + 1);
  if (schema.allOf) return sample(schema.allOf[0], schemas, name, depth + 1);
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'object' || schema.properties) return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, value]) => [key, sample(value, schemas, key, depth + 1)]));
  if (schema.type === 'array') return values[name] instanceof Array ? values[name] : [sample(schema.items, schemas, '', depth + 1)];
  if (Object.hasOwn(values, name) && (values[name] !== null || schema.nullable)) {
    const value = values[name];
    return schema.type === 'string' && value !== null ? String(value) : value;
  }
  if (schema.type === 'boolean') return false;
  if (['integer', 'number'].includes(schema.type)) return Math.max(schema.minimum || 0, 1);
  if (schema.format === 'uuid') return '0c395ad9-fd66-4225-867e-e4db9703ec90';
  if (schema.format === 'binary') return undefined;
  return 'Ví dụ';
}
const notes = {
  '/api/addresses': 'GET chỉ đọc sổ của tài khoản hiện tại. PUT thay thế toàn bộ sổ, tối đa 10 địa chỉ; ID không trùng và chỉ một địa chỉ mặc định. Danh sách rỗng xóa sổ. Nếu chưa có mặc định, server chọn địa chỉ đầu tiên.',
  '/api/cart': 'Giỏ riêng theo tài khoản. PUT thay thế toàn bộ giỏ; items rỗng làm trống giỏ. Server kiểm tra sản phẩm, quy cách, màu và tồn kho. DELETE làm trống giỏ. Giá trả về lấy từ catalog hiện tại.',
  '/api/wishlist': 'Danh sách riêng theo tài khoản. PUT thay toàn bộ danh sách bằng productIds, tối đa 200 ID và loại bỏ ID trùng.',
  '/api/checkout/quote': 'Không tạo đơn hoặc giữ hàng. Server tính lại giá, gộp dòng cùng biến thể, kiểm tra tồn kho chung và voucher. parcel là kích thước, khối lượng ước tính theo các sản phẩm trong đơn; có thể nhập thông số đóng gói thực theo từng sản phẩm trong admin. Giỏ phải có 1–100 dòng, mỗi dòng 1–99 sản phẩm. Phí cơ bản 30.000 VND; voucher shipping có thể giảm phí về 0. Sử dụng total làm expectedTotal khi đặt hàng.',
  '/api/orders': 'Cần khách đăng nhập. Server kiểm tra dữ liệu và tính lại báo giá trước khi tạo đơn. Thành công trừ tồn kho, tăng lượt voucher và xóa giỏ server của khách. expectedTotal sai trả 409 và không tạo đơn. Chỉ có COD.',
  '/api/auth/register': 'Tên, tên đăng nhập và mật khẩu bắt buộc; email tùy chọn. Mật khẩu tối thiểu 6 ký tự. Username/email được kiểm tra trùng không phân biệt hoa thường. Tên admin được dành riêng. Token hết hạn sau 24 giờ.',
  '/api/auth/login': 'Nhập username hoặc email cùng password. Khách nhận JWT. Username admin dùng mật khẩu cấu hình server, nhận cookie HttpOnly và redirect /admin thay cho JWT. POST auth có giới hạn thử theo IP.',
  '/api/auth/password': 'Cần mật khẩu hiện tại và mật khẩu mới 8–256 ký tự. Thành công thu hồi mọi JWT hiện có của tài khoản; đăng nhập lại để tiếp tục.',
  '/api/auth/logout': 'Thu hồi mọi JWT hiện có của tài khoản, gồm token đang dùng. Xóa token trong ứng dụng sau khi thành công.',
  '/api/auth/me': 'GET đọc hồ sơ. PATCH nhận name, email, phone, address, birthday, gender, bio, avatarColor và ít nhất một trường. Ngày sinh/giới tính/giới thiệu là tùy chọn, có thể xóa bằng chuỗi rỗng. Email phải không trùng với tài khoản khác. Không thể đổi username hoặc vai trò qua API này.',
  '/api/orders/mine': 'Chỉ trả đơn của tài khoản hiện tại, mới nhất trước. Không nhận userId từ client để chọn khách khác.',
  '/api/orders/{id}': 'Tra cứu bằng ID đơn và số điện thoại trùng với đơn. Sai số điện thoại hoặc không có đơn đều trả 404 để tránh lộ thông tin.',
  '/api/orders/{id}/cancel': 'Chỉ chủ đơn được hủy đơn new. Đơn đã cancelled trả kết quả cũ và không hoàn kho/lượt voucher lần hai. Đơn đã confirmed, shipping hoặc done không được khách tự hủy.',
  '/api/orders/{id}/reorder': 'Chỉ chủ đơn được mua lại. Thêm các dòng cũ vào giỏ hiện tại và kiểm tra theo catalog mới. Không tự tạo đơn, áp dụng lại voucher hay giữ giá cũ. Nếu có dòng không hợp lệ hoặc thiếu tồn kho, giỏ không thay đổi.',
  '/api/products/{id}/reviews': 'GET công khai chỉ gồm đánh giá không bị ẩn; average và count tính từ dữ liệu thật. POST yêu cầu tài khoản có đơn done chứa sản phẩm. Mỗi tài khoản chỉ một đánh giá/sản phẩm; không tạo đánh giá giả.',
  '/api/support': 'Chỉ truy cập yêu cầu của chính tài khoản. Một đơn chỉ có một phiếu đang mở/xử lý. Loại return cần đơn done. Phiếu hỗ trợ không tự hoàn tiền, hoàn kho hoặc tạo vận đơn.',
  '/api/admin/orders/{id}': 'Luồng hợp lệ: new → confirmed → shipping → done. Có thể chuyển sang cancelled từ new, confirmed hoặc shipping. Đơn done/cancelled không mở lại. Chủ shop có thể cập nhật số di động nhận hàng cho đơn new/confirmed chưa có vận đơn; số phải theo dạng 03/05/07/08/09 và đủ 10 số. Hủy đơn hoàn kho và lượt voucher đúng một lần.',
  '/api/admin/users/{id}': 'Chỉ cho phép trường disabled kiểu boolean. Tài khoản khóa không sử dụng được các API khách hàng; không thay đổi đơn lịch sử.',
  '/api/admin/support/{ticketId}': 'Cập nhật trạng thái xử lý và phản hồi hiển thị cho chủ phiếu. Thao tác này không tự chuyển tiền hoặc thay đổi tồn kho/đơn hàng.',
  '/api/admin/reviews/{reviewId}': 'Chỉ cập nhật hidden kiểu boolean. Đánh giá ẩn không xuất hiện trong danh sách công khai và không tính vào trung bình sao.',
  '/api/admin/images': 'Gửi trực tiếp byte ảnh, không gửi multipart/form-data hoặc JSON base64. Server kiểm tra chữ ký PNG/JPEG/WebP, tối đa 5 MB. Kết quả là đường dẫn /uploads/... dùng ở trường image của sản phẩm.',
  '/api/admin/login': 'Mật khẩu quản trị lấy từ cấu hình ADMIN_TOKEN. Thành công tạo cookie shop_admin HttpOnly, SameSite=Strict, hết hạn sau 8 giờ. Không có secret thật trong tài liệu.',
  '/api/admin/logout': 'Thu hồi phiên cookie hiện tại và xóa cookie. Xóa AdminToken trong client nếu trước đó đã Authorize bằng header; API key trong cấu hình server không bị thu hồi bởi logout.',
  '/api/products': 'Trả toàn bộ sản phẩm khớp q và category; endpoint này không phân trang. Dùng /api/v1/vn/vi/products nếu cần phân trang. Bộ lọc giá trên trang cửa hàng hiện được xử lý ở client.',
};
function enrichApi(spec) {
  // Schemas in openapi.js reuse scalar objects. Break aliases before annotating.
  spec = JSON.parse(JSON.stringify(spec));
  spec.components.schemas.Product.example = { id: 1, name: 'Áo thun basic trắng', category: 'Thời trang', description: 'Sản phẩm minh họa; hãy đọc catalog thật trước khi đặt hàng.', image: '/images/product-placeholder.svg', price: 149000, stock: 20, sizes: ['M', 'L'], colors: ['Trắng', 'Đen'], gender: 'all', subCategory: 'home', emoji: '⌂' };
  function annotate(schema) {
    if (!schema || typeof schema !== 'object') return;
    for (const [name, property] of Object.entries(schema.properties || {})) {
      if (!property.description && fieldInfo[name]) property.description = fieldInfo[name];
      annotate(property);
    }
    if (schema.items) annotate(schema.items);
  }
  for (const schema of Object.values(spec.components.schemas)) annotate(schema);
  const errors = { 400: 'Dữ liệu hoặc tham số không hợp lệ.', 401: 'Chưa đăng nhập, token/phiên không hợp lệ hoặc đã hết hạn.', 403: 'Tài khoản không có quyền thực hiện thao tác này.', 404: 'Không tìm thấy tài nguyên hoặc tài nguyên không thuộc tài khoản.', 405: 'Phương thức không được hỗ trợ.', 409: 'Xung đột trạng thái, tồn kho, dữ liệu trùng hoặc giá đã thay đổi.', 413: 'Nội dung vượt kích thước cho phép.', 429: 'Vượt số lần thử đăng nhập/đăng ký. Thử lại sau 15 phút.', 500: 'Máy chủ không xử lý được yêu cầu.' };
  for (const [route, operations] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(operations)) {
    const auth = operation.security.length ? (route.startsWith('/api/admin/') ? 'Quản trị: x-admin-token hoặc cookie phiên. Với cookie và thao tác ghi, gửi X-Requested-With: shop-admin.' : 'Khách hàng: Authorization: Bearer <token>.') : 'API công khai, không yêu cầu token.';
    const resourceNote = /^\/api\/admin\/products/.test(route) ? 'POST yêu cầu name, category, price, stock; sizes/colors mặc định One Size/Mặc định nếu bỏ qua. PATCH ghép với dữ liệu hiện có rồi kiểm tra toàn bộ sản phẩm. Giá không âm, tồn kho 0–1.000.000. Xóa sản phẩm không xóa bản chụp trong đơn cũ.' : /^\/api\/admin\/vouchers/.test(route) ? 'Loại percent: value 1–100; fixed: value từ 1 VND; shipping: value được đặt về 0. Mã chỉ gồm chữ/số/gạch ngang/gạch dưới và không được trùng. startsAt phải trước expiresAt. PATCH ghép dữ liệu hiện có. Xóa voucher không xóa thông tin trong đơn cũ.' : route.includes('/contact') ? 'Thông tin công khai của shop. Bỏ trống để ẩn kênh chưa dùng; Facebook/Messenger chỉ nhận HTTPS trên tên miền chính thức. PUT cập nhật các trường gửi lên và giữ các trường còn lại.' : '';
    const extra = notes[route] || resourceNote || (route.includes('/v1/') ? 'Catalog tương thích/demo được giữ cho API cũ. Quy tắc demo không phải dữ liệu hãng vận chuyển hoặc dịch vụ tư vấn thực tế.' : method === 'get' ? 'Đọc dữ liệu hiện tại; không thay đổi dữ liệu shop.' : 'Thao tác ghi được lưu vào database của shop. Khi ghi thất bại, thay đổi dữ liệu được hoàn tác.');
    operation.description = [operation.description, extra, auth, 'Mẫu bên dưới chỉ minh họa. Lấy ID/quy cách/màu từ API đọc trước khi thử thao tác ghi. Tiền tệ: VND, số nguyên. Lỗi trả JSON {error}.'].filter(Boolean).join('\n\n');
    for (const parameter of operation.parameters) {
      parameter.description = parameter.in === 'path' ? (parameter.schema.format === 'uuid' ? 'UUID trả về khi tạo phiếu/đánh giá.' : 'ID nguyên dương của tài nguyên.') : ({ q: 'Tìm kiếm theo nội dung sản phẩm.', query: 'Từ khóa tìm kiếm.', category: 'Tên danh mục chính xác.', gender: 'Nhóm catalog; dùng all hoặc tham số phù hợp dữ liệu.', phone: 'Số điện thoại đã dùng khi đặt đơn.', sort: 'Thứ tự sắp xếp kết quả.', page: 'Trang bắt đầu từ 1.', limit: 'Số kết quả mỗi trang: 1–100.' }[parameter.name] || 'Tham số lọc kết quả.');
      parameter.example = parameter.schema.format === 'uuid' ? '0c395ad9-fd66-4225-867e-e4db9703ec90' : parameter.in === 'path' ? 1 : parameter.schema.default ?? parameter.schema.enum?.[0] ?? (parameter.name === 'phone' ? values.phone : parameter.name === 'limit' ? 24 : parameter.name === 'page' ? 1 : parameter.name === 'category' ? 'Trang trí' : parameter.name === 'gender' ? 'all' : 'đèn');
    }
    for (const content of Object.values(operation.requestBody?.content || {})) {
      annotate(content.schema);
      if (!content.example && content.schema.type !== 'string') content.example = sample(content.schema, spec.components.schemas);
    }
    for (const [status, response] of Object.entries(operation.responses)) {
      if (Number(status) >= 400) {
        response.description = errors[status] || response.description;
        response.content['application/json'].example = { error: errors[status] || 'Yêu cầu không hợp lệ' };
      } else {
        response.content['application/json'].example = sample(response.content['application/json'].schema, spec.components.schemas);
        response.description = Number(status) === 201 ? 'Tạo tài nguyên thành công.' : 'Xử lý thành công.';
      }
    }
    if (!operation.security.length && !['/api/auth/login', '/api/admin/login'].includes(route)) for (const status of ['401', '403']) delete operation.responses[status];
    if (!(method === 'post' && (route.startsWith('/api/auth/') || route === '/api/admin/login'))) delete operation.responses[429];
    if (operation.requestBody) operation.responses[413] = { description: route === '/api/admin/images' ? 'Ảnh vượt 5 MB.' : 'Body JSON vượt 1.000.000 byte.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: route === '/api/admin/images' ? 'Ảnh tối đa 5 MB' : 'Request body quá lớn' } } } };
    if (route === '/health') operation.responses[200].content['application/json'].example = { status: 'ok', version: spec.info.version };
    if (route === '/api/info') operation.responses[200].content['application/json'].example = { name: 'Home Shopping App', status: 'ok', version: spec.info.version };
  }
  return spec;
}
module.exports = { enrichApi, sample };
