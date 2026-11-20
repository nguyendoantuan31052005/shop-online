// Keep API documentation alongside the routes in app.js.
const { schemas, responseSchema } = require('./api-schemas');
const str = { type: 'string' };
const num = { type: 'integer', minimum: 0 };
const object = (properties, required = []) => ({ type: 'object', properties, required });
const strings = { type: 'array', items: str };
const item = object({ productId: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1, maximum: 99 }, size: str, color: str }, ['productId', 'quantity']);
const items = { type: 'array', items: item, maxItems: 100 };
const product = object({ name: { type: 'string', minLength: 1, maxLength: 200 }, category: { type: 'string', minLength: 1, maxLength: 80 }, brand: { type: 'string', maxLength: 100 }, salePrice: { type: 'integer', minimum: 1, maximum: 1000000000, nullable: true }, images: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 2000 } }, description: { type: 'string', maxLength: 5000 }, image: { type: 'string', maxLength: 2000 }, price: { ...num, maximum: 1000000000 }, stock: { ...num, maximum: 1000000 }, sizes: { type: 'array', minItems: 1, maxItems: 30, items: { type: 'string', minLength: 1, maxLength: 50 } }, colors: { type: 'array', minItems: 1, maxItems: 30, items: { type: 'string', minLength: 1, maxLength: 50 } }, gender: { type: 'string', maxLength: 20 }, subCategory: { type: 'string', maxLength: 80 }, emoji: { type: 'string', maxLength: 20 } }, ['name', 'category', 'price', 'stock']);
const voucher = object({ code: str, type: { type: 'string', enum: ['percent', 'fixed', 'shipping'] }, value: num, minOrder: num, maxDiscount: num, usageLimit: num, active: { type: 'boolean' }, startsAt: { type: 'string', nullable: true }, expiresAt: { type: 'string', nullable: true }, description: str }, ['code', 'type']);
const customer = [{ CustomerBearer: [] }];
const admin = [{ AdminToken: [] }, { AdminCookie: [] }];

function createOpenApi(version = 'dev') {
  const paths = {};
  function add(method, path, tag, summary, options = {}) {
    const { schema, example, security = [], query = [], status = 200, description } = options;
    const parameters = [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({ name, in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }));
    for (const [name, schema = str, required = false] of query) parameters.push({ name, in: 'query', required, schema });
    const error = { description: 'Yêu cầu thất bại; xem error để biết nguyên nhân.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Thông tin không hợp lệ' } } } };
    const operation = { operationId: method + path.replace(/[^a-zA-Z0-9]+/g, '_'), tags: [tag], summary, security, parameters, responses: {
      [status]: { description: 'Thành công', content: { 'application/json': { schema: responseSchema(method, path) } } },
      400: error, 401: error, 403: error, 404: error, 409: error, 429: error, 500: error,
    } };
    if (description) operation.description = description;
    if (schema) operation.requestBody = { required: true, content: { 'application/json': { schema, ...(example ? { example } : {}) } } };
    (paths[path] ||= {})[method] = operation;
  }
  add('get', '/health', 'Hệ thống', 'Kiểm tra server');
  add('get', '/api/auth/recovery-options', 'Account', 'Available recovery methods', { description: 'Returns emailEnabled and authenticatorEnabled flags for the storefront.' });
  add('post', '/api/auth/forgot-password', 'Tài khoản', 'Yêu cầu email khôi phục mật khẩu', { schema: object({ email: { type: 'string', format: 'email', maxLength: 254 } }, ['email']), example: { email: 'customer@example.com' }, description: 'Phản hồi chung cho email có hoặc không có tài khoản. Liên kết dùng một lần, hết hạn sau 15 phút. Cần RESEND_API_KEY, MAIL_FROM và PUBLIC_URL; thiếu cấu hình trả 503. Không hỗ trợ tài khoản quản trị.' });
  add('post', '/api/auth/reset-totp-password', 'Account', 'Reset password with authenticator TOTP', { schema: object({ phone: { type: 'string' }, otp: { type: 'string', pattern: '^[0-9]{6}$' }, newPassword: { type: 'string', minLength: 8, maxLength: 256 } }, ['phone', 'otp', 'newPassword']), example: { phone: '0901234567', otp: '123456', newPassword: 'Example-new-password-123' }, description: 'Requires a previously enrolled TOTP secret. Codes are time-based, single-use, and old customer sessions are revoked.' });
  add('get', '/api/auth/totp/status', 'Account', 'Read current account TOTP status', { security: customer });
  add('post', '/api/auth/totp/setup', 'Account', 'Create a temporary TOTP enrollment secret', { security: customer });
  add('post', '/api/auth/totp/enable', 'Account', 'Confirm and enable TOTP', { security: customer, schema: object({ otp: { type: 'string', pattern: '^[0-9]{6}$' } }, ['otp']), example: { otp: '123456' } });
  add('post', '/api/auth/totp/disable', 'Account', 'Disable TOTP with a current code', { security: customer, schema: object({ otp: { type: 'string', pattern: '^[0-9]{6}$' } }, ['otp']), example: { otp: '123456' } });
  add('post', '/api/auth/reset-password', 'Tài khoản', 'Đặt mật khẩu mới từ liên kết khôi phục', { schema: object({ token: { type: 'string', pattern: '^[a-f0-9]{64}$' }, newPassword: { type: 'string', minLength: 8, maxLength: 256 } }, ['token', 'newPassword']), example: { token: 'a'.repeat(64), newPassword: 'Example-new-password-123' }, description: 'Token hợp lệ dùng một lần; mật khẩu mới từ 8–256 ký tự. Thu hồi tất cả phiên đăng nhập khách hàng. Token hết hạn, đã dùng hoặc bị vô hiệu hóa trả 400.' });
  paths['/api/auth/forgot-password'].post.responses[503] = structuredClone(paths['/api/auth/forgot-password'].post.responses[500]);
  const address = object({ id: str, name: str, phone: str, city: str, ward: str, district: str, address: str, isDefault: { type: 'boolean' } }, ['id', 'name', 'phone', 'city', 'ward', 'address']);
  add('get', '/api/addresses', 'Tài khoản', 'Sổ địa chỉ của tôi', { security: customer });
  add('put', '/api/addresses', 'Tài khoản', 'Lưu tối đa 10 địa chỉ', { security: customer, schema: object({ items: { type: 'array', items: address, maxItems: 10 } }, ['items']) });
  add('get', '/api/products/{id}/reviews', 'Sản phẩm', 'Đánh giá công khai từ người đã mua');
  add('post', '/api/products/{id}/reviews', 'Sản phẩm', 'Đánh giá sản phẩm đã mua trong đơn hoàn thành', { security: customer, schema: object({ rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string', maxLength: 2000 }, images: { type: 'array', maxItems: 3, items: str } }, ['rating', 'comment']) });
  add('post', '/api/products/{id}/reviews/images', 'Sản phẩm', 'Tải ảnh đánh giá đã mua (tối đa 5 MB)', { security: customer, status: 201 });
  paths['/api/products/{id}/reviews/images'].post.requestBody = { required: true, content: Object.fromEntries(['image/png', 'image/jpeg', 'image/webp'].map(type => [type, { schema: { type: 'string', format: 'binary' } }])) };
  paths['/api/products/{id}/reviews/images'].post.responses[201] = { description: 'Đã tải ảnh', content: { 'application/json': { schema: object({ image: str }) } } };
  add('post', '/api/orders/{id}/reorder', 'Đơn hàng', 'Thêm lại sản phẩm của đơn vào giỏ với giá và tồn kho hiện tại', { security: customer });
  add('get', '/api/support', 'Đơn hàng', 'Các phiếu hỗ trợ của tôi', { security: customer });
  add('post', '/api/support', 'Đơn hàng', 'Gửi yêu cầu hỗ trợ/đổi trả', { security: customer, schema: object({ orderId: num, type: { type: 'string', enum: ['question', 'return'] }, message: { type: 'string', maxLength: 3000 } }, ['orderId', 'type', 'message']), description: 'Yêu cầu đổi trả cần đơn hoàn thành. Không tự hoàn tiền hoặc hoàn kho.' });
  add('get', '/api/admin/support', 'Quản trị', 'Các yêu cầu hỗ trợ khách hàng', { security: admin });
  add('get', '/api/admin/reviews', 'Quản trị', 'Các đánh giá của khách', { security: admin });
  add('patch', '/api/admin/support/{ticketId}', 'Quản trị', 'Phản hồi phiếu hỗ trợ', { security: admin, schema: object({ status: { type: 'string', enum: ['open', 'reviewing', 'resolved', 'rejected'] }, reply: { type: 'string', maxLength: 3000 } }, ['status', 'reply']) });
  add('patch', '/api/admin/reviews/{reviewId}', 'Quản trị', 'Ẩn/hiện đánh giá', { security: admin, schema: object({ hidden: { type: 'boolean' } }, ['hidden']) });
  for (const route of ['/api/admin/support/{ticketId}', '/api/admin/reviews/{reviewId}']) paths[route].patch.parameters[0].schema = { type: 'string', format: 'uuid' };
  add('get', '/api/info', 'Hệ thống', 'Thông tin phiên bản');
  add('get', '/api/account/overview', 'Tài khoản', 'Hồ sơ chi tiết và thống kê mua sắm riêng tư', { security: customer, description: 'Chỉ trả thống kê của khách đăng nhập: đơn theo trạng thái, chi tiêu đơn hoàn thành, số địa chỉ/đánh giá/yêu cầu đang xử lý và địa chỉ mặc định. Không nhận userId từ client.' });
  const contactSchema = object(Object.fromEntries(['phone', 'zaloPhone', 'facebookName', 'facebookUrl', 'messengerUrl', 'email', 'address', 'hours'].map(key => [key, str])));
  add('get', '/api/contact', 'Hệ thống', 'Thông tin liên hệ công khai của shop');
  add('get', '/api/admin/contact', 'Quản trị', 'Đọc cấu hình liên hệ', { security: admin });
  add('put', '/api/admin/contact', 'Quản trị', 'Lưu cấu hình liên hệ', { security: admin, schema: contactSchema, description: 'Bỏ trống kênh không dùng. Facebook/Messenger phải là URL HTTPS trên tên miền chính thức.' });
  for (const [route, method] of [['/api/contact', 'get'], ['/api/admin/contact', 'get'], ['/api/admin/contact', 'put']]) paths[route][method].responses[200].content['application/json'].schema = contactSchema;
  add('get', '/api/products', 'Sản phẩm', 'Danh sách sản phẩm', { query: [['q'], ['category']] });
  add('get', '/api/products/{id}', 'Sản phẩm', 'Chi tiết sản phẩm');
  add('get', '/api/categories', 'Sản phẩm', 'Danh mục');
  add('post', '/api/auth/register', 'Tài khoản', 'Đăng ký khách hàng', { status: 201, schema: object({ name: str, username: str, email: str, password: { type: 'string', minLength: 6, maxLength: 256 } }, ['name', 'username', 'password']), example: { name: 'Nguyễn Văn A', username: 'khachhang01', password: 'MatKhau123!' } });
  add('post', '/api/auth/login', 'Tài khoản', 'Đăng nhập lấy Bearer token', { schema: object({ username: str, email: str, password: str }, ['password']), example: { username: 'khachhang01', password: 'MatKhau123!' } });
  add('get', '/api/auth/me', 'Tài khoản', 'Hồ sơ của tôi', { security: customer });
  add('patch', '/api/auth/me', 'Tài khoản', 'Cập nhật hồ sơ', { security: customer, schema: object({ name: str, email: str, phone: str, address: str }), example: { name: 'Nguyễn Văn A', phone: '0901234567' } });
  add('post', '/api/auth/password', 'Tài khoản', 'Đổi mật khẩu và thu hồi token', { security: customer, schema: object({ currentPassword: str, newPassword: { type: 'string', minLength: 8, maxLength: 256 } }, ['currentPassword', 'newPassword']) });
  add('post', '/api/auth/logout', 'Tài khoản', 'Đăng xuất, thu hồi mọi token', { security: customer });
  for (const method of ['get', 'put', 'delete']) add(method, '/api/cart', 'Giỏ hàng', { get: 'Đọc giỏ hàng', put: 'Lưu giỏ hàng', delete: 'Xóa giỏ hàng' }[method], { security: customer, ...(method === 'put' ? { schema: object({ items }, ['items']), example: { items: [{ productId: 1, quantity: 1 }] } } : {}) });
  add('get', '/api/wishlist', 'Giỏ hàng', 'Danh sách yêu thích', { security: customer });
  add('put', '/api/wishlist', 'Giỏ hàng', 'Lưu danh sách yêu thích', { security: customer, schema: object({ productIds: { type: 'array', items: { type: 'integer', minimum: 1 }, maxItems: 200 } }, ['productIds']), example: { productIds: [1, 2] } });
  add('get', '/api/vouchers', 'Thanh toán', 'Voucher còn hiệu lực');
  add('post', '/api/checkout/quote', 'Thanh toán', 'Tính giá và phí vận chuyển', { schema: object({ items, voucherCode: str }, ['items']), example: { items: [{ productId: 1, quantity: 1 }] } });
  add('post', '/api/orders', 'Đơn hàng', 'Đặt hàng COD (cần đăng nhập)', { security: customer, status: 201, schema: object({ customer: object({ name: str, phone: str, address: str, email: str }, ['name', 'phone', 'address']), items, voucherCode: str, paymentMethod: { type: 'string', enum: ['cod'] }, expectedTotal: num }, ['customer', 'items']), example: { customer: { name: 'Nguyễn Văn A', phone: '0901234567', address: '12 Bạch Đằng, Đà Nẵng' }, items: [{ productId: 1, quantity: 1 }], paymentMethod: 'cod' } });
  add('get', '/api/orders/mine', 'Đơn hàng', 'Lịch sử đơn của tôi', { security: customer });
  add('get', '/api/orders/{id}', 'Đơn hàng', 'Tra đơn bằng mã và số điện thoại', { query: [['phone', str, true]] });
  add('post', '/api/orders/{id}/cancel', 'Đơn hàng', 'Hủy đơn mới của tôi', { security: customer });
  add('post', '/api/admin/login', 'Quản trị', 'Đăng nhập chủ shop hoặc nhân viên bằng cookie', { schema: object({ username: str, password: str }, ['password']), description: 'Chủ shop dùng username admin và ADMIN_TOKEN. Nhân viên dùng tài khoản được chủ shop tạo trong trang quản trị.' });
  add('post', '/api/admin/logout', 'Quản trị', 'Đăng xuất quản trị', { security: admin });
  for (const [route, title] of [['session', 'Kiểm tra phiên'], ['stats', 'Thống kê'], ['users', 'Danh sách tài khoản'], ['users/{id}/orders', 'Đơn của tài khoản'], ['orders', 'Danh sách đơn']]) add('get', '/api/admin/' + route, 'Quản trị', title, { security: admin });
  add('get', '/api/admin/integrations', 'Quản trị', 'Trạng thái cấu hình dịch vụ', { security: admin, description: 'Chỉ trả trạng thái đã cấu hình, không trả token hay secret của nhà cung cấp.' });
  add('get', '/api/admin/staff', 'Quản trị', 'Danh sách nhân viên (chủ shop)', { security: admin, description: 'Chỉ chủ shop được xem và quản lý tài khoản nhân viên.' });
  add('post', '/api/admin/staff', 'Quản trị', 'Tạo tài khoản nhân viên (chủ shop)', { security: admin, status: 201, schema: object({ name: { type: 'string', maxLength: 120 }, username: { type: 'string', minLength: 3, maxLength: 40, pattern: '^[A-Za-z0-9._-]+$' }, password: { type: 'string', minLength: 12, maxLength: 256 } }, ['name', 'username', 'password']) });
  add('patch', '/api/admin/staff/{id}', 'Quản trị', 'Khóa/mở khóa hoặc đặt lại mật khẩu nhân viên (chủ shop)', { security: admin, schema: object({ disabled: { type: 'boolean' }, password: { type: 'string', minLength: 12, maxLength: 256 } }), description: 'Chỉ chủ shop được gọi. Đặt lại mật khẩu hoặc khóa tài khoản sẽ thu hồi phiên đăng nhập đang hoạt động.' });
  add('post', '/api/admin/orders/{id}/shipment/ghn/simulate', 'Quản trị', 'Mô phỏng tạo vận đơn GHN', { security: admin, description: 'Chỉ trả về mã mô phỏng. Không gọi GHN, không ghi dữ liệu đơn hàng và không tạo vận đơn thật.' });
  add('patch', '/api/admin/users/{id}', 'Quản trị', 'Khóa hoặc mở tài khoản', { security: admin, schema: object({ disabled: { type: 'boolean' } }, ['disabled']), example: { disabled: true } });
  add('patch', '/api/admin/orders/{id}', 'Quản trị', 'Cập nhật trạng thái, thanh toán COD hoặc vận đơn', { security: admin, schema: object({ status: { type: 'string', enum: ['new', 'confirmed', 'shipping', 'done', 'cancelled'] }, paymentStatus: { type: 'string', enum: ['paid'] }, shipment: object({ carrier: str, trackingNumber: str, trackingUrl: str }) }), description: 'Luồng đơn: new → confirmed → shipping → done. COD chỉ được đánh dấu đã thu khi đơn đang giao hoặc hoàn thành. Lưu thông tin vận chuyển thủ công; link tra cứu phải dùng HTTPS.' });
  add('get', '/api/admin/categories', 'Quản trị', 'Danh mục sản phẩm', { security: admin });
  add('post', '/api/admin/categories', 'Quản trị', 'Thêm danh mục', { security: admin, status: 201, schema: object({ name: { type: 'string', maxLength: 80 } }, ['name']) });
  add('patch', '/api/admin/categories/{name}', 'Quản trị', 'Đổi tên danh mục và cập nhật sản phẩm', { security: admin, schema: object({ name: { type: 'string', maxLength: 80 } }, ['name']) });
  add('delete', '/api/admin/categories/{name}', 'Quản trị', 'Xóa danh mục đang trống', { security: admin });
  for (const method of ['patch', 'delete']) paths['/api/admin/categories/{name}'][method].parameters[0].schema = str;
  for (const [resource, schema, example] of [
    ['products', product, { name: 'Áo thun demo', category: 'Áo', price: 199000, stock: 20, sizes: ['M', 'L'], colors: ['Đen'] }],
    ['vouchers', voucher, { code: 'DEMO10', type: 'percent', value: 10, minOrder: 0, maxDiscount: 50000, active: true }],
  ]) {
    const route = '/api/admin/' + resource;
    add('get', route, 'Quản trị', 'Danh sách ' + resource, { security: admin });
    add('post', route, 'Quản trị', 'Thêm ' + resource, { security: admin, status: 201, schema, example });
    add('patch', route + '/{id}', 'Quản trị', 'Sửa ' + resource, { security: admin, schema: { ...schema, required: [] }, example });
    add('delete', route + '/{id}', 'Quản trị', 'Xóa ' + resource, { security: admin });
  }
  add('post', '/api/admin/images', 'Quản trị', 'Tải ảnh (PNG/JPG/WebP, tối đa 5 MB)', { security: admin, status: 201 });
  paths['/api/admin/images'].post.requestBody = { required: true, content: Object.fromEntries(['image/png', 'image/jpeg', 'image/webp'].map(type => [type, { schema: { type: 'string', format: 'binary' } }])) };
  const prefix = '/api/v1/vn/vi';
  Object.assign(paths['/api/auth/me'].patch.requestBody.content['application/json'].schema.properties, {
    birthday: { type: 'string', example: '1995-05-20', description: 'YYYY-MM-DD, từ 1900 đến ngày hiện tại; để chuỗi rỗng để xóa.' },
    gender: { type: 'string', enum: ['', 'female', 'male', 'other', 'undisclosed'], description: 'Thông tin giới tính tùy chọn.' },
    bio: { type: 'string', maxLength: 300 }, avatarColor: { type: 'string', enum: ['sage', 'teal', 'sand', 'rose', 'slate', ''] },
  });
  add('get', prefix + '/categories', 'Catalog mở rộng', 'Danh mục nam');
  add('get', prefix + '/products/section/men', 'Catalog mở rộng', 'Bộ sưu tập nam');
  add('get', prefix + '/products', 'Catalog mở rộng', 'Lọc, sắp xếp và phân trang', { query: [['q'], ['category'], ['gender'], ['page', { type: 'integer', minimum: 1, default: 1 }], ['limit', { type: 'integer', minimum: 1, maximum: 100, default: 24 }], ['sort', { type: 'string', enum: ['rank', 'price_asc', 'price_desc', 'newest'] }]] });
  add('get', prefix + '/products/search', 'Catalog mở rộng', 'Tìm kiếm và gợi ý', { query: [['query'], ['gender']] });
  add('get', prefix + '/products/filters', 'Catalog mở rộng', 'Bộ lọc');
  add('get', prefix + '/products/{id}/stock', 'Catalog mở rộng', 'Tồn kho và biến thể');
  add('post', prefix + '/size-recommendation', 'Catalog mở rộng', 'Gợi ý size demo', { schema: object({ height: { type: 'number', minimum: 1 }, weight: { type: 'number', minimum: 1 }, fit: { type: 'string', enum: ['regular', 'loose'] } }, ['height', 'weight']), example: { height: 170, weight: 65, fit: 'regular' } });
  return require('./api-details').enrichApi({
    openapi: '3.0.3', info: { title: 'Home Shopping App Backend API', version, description: 'API đang chạy của cửa hàng. Dùng Authorize để nhập token. Các thao tác ghi cập nhật dữ liệu thật.' },
    servers: [{ url: '/', description: 'Server hiện tại' }], paths,
    tags: ['Hệ thống', 'Sản phẩm', 'Tài khoản', 'Giỏ hàng', 'Thanh toán', 'Đơn hàng', 'Quản trị', 'Catalog mở rộng'].map(name => ({ name })),
    components: { schemas, securitySchemes: {
      CustomerBearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token nhận từ đăng ký/đăng nhập khách hàng.' },
      AdminToken: { type: 'apiKey', in: 'header', name: 'x-admin-token', description: 'Giá trị ADMIN_TOKEN trong cấu hình server.' },
      AdminCookie: { type: 'apiKey', in: 'cookie', name: 'shop_admin', description: 'Gọi POST /api/admin/login; trình duyệt quản lý cookie HttpOnly tự động.' },
    } },
  });
}

module.exports = { createOpenApi };
