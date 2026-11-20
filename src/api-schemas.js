// Public response models. Never describe internal password hashes or session secrets.
const string = { type: 'string' };
const integer = { type: 'integer' };
const boolean = { type: 'boolean' };
const ref = name => ({ $ref: '#/components/schemas/' + name });
const array = items => ({ type: 'array', items });
const object = properties => ({ type: 'object', properties });
const status = { type: 'string', enum: ['new', 'confirmed', 'shipping', 'done', 'cancelled'] };
const productFields = { id: integer, name: string, category: string, brand: string, description: string, image: string, images: array(string), price: integer, regularPrice: integer, salePrice: { type: 'integer', nullable: true }, stock: integer, soldCount: integer, shippingWeightG: { type: 'integer', nullable: true, description: 'Khối lượng đóng gói một sản phẩm, gram.' }, shippingLengthCm: { type: 'integer', nullable: true, description: 'Chiều dài đóng gói một sản phẩm, cm.' }, shippingWidthCm: { type: 'integer', nullable: true, description: 'Chiều rộng đóng gói một sản phẩm, cm.' }, shippingHeightCm: { type: 'integer', nullable: true, description: 'Chiều cao đóng gói một sản phẩm, cm.' }, sizes: array(string), colors: array(string), gender: string, subCategory: string, emoji: string };
const userFields = { id: integer, name: string, username: string, email: string, phone: string, address: string, birthday: { type: 'string', example: '1995-05-20', description: 'Ngày sinh YYYY-MM-DD hoặc chuỗi rỗng nếu không cung cấp.' }, gender: { type: 'string', enum: ['', 'female', 'male', 'other', 'undisclosed'], description: 'Thông tin giới tính khách tự chọn, không bắt buộc.' }, bio: { type: 'string', maxLength: 300 }, avatarColor: { type: 'string', enum: ['sage', 'teal', 'sand', 'rose', 'slate'] }, createdAt: string };
const quoteFields = { items: array(ref('OrderItem')), parcel: ref('ParcelEstimate'), subtotal: integer, shippingFee: integer, discount: integer, total: integer, voucherCode: { type: 'string', nullable: true }, voucherId: { type: 'integer', nullable: true } };
const voucherFields = { code: string, type: { type: 'string', enum: ['percent', 'fixed', 'shipping'] }, value: integer, minOrder: integer, maxDiscount: integer, expiresAt: { type: 'string', nullable: true }, description: string };
const schemas = {
  Category: object({ id: string, name: string, parent: string }),
  CatalogFilters: object({ sizes: array(string), colors: array(string), priceRanges: array(string) }),
  AdminReview: object({ id: string, productId: integer, userId: integer, name: string, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: string, createdAt: string, verified: boolean, hidden: boolean }),
  Address: object({ id: string, name: string, phone: string, city: string, ward: string, district: string, address: string, isDefault: boolean }),
  Review: object({ id: string, productId: integer, name: string, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: string, images: array(string), createdAt: string, verified: boolean }),
  SupportTicket: object({ id: string, userId: integer, orderId: integer, name: string, type: { type: 'string', enum: ['question', 'return'] }, message: string, status: { type: 'string', enum: ['open', 'reviewing', 'resolved', 'rejected'] }, reply: string, createdAt: string, updatedAt: string }),
  Product: object(productFields),
  User: object(userFields),
  AdminUser: object({ id: integer, name: string, username: string, email: string, createdAt: string, disabled: boolean, orderCount: integer }),
  Auth: object({ token: string, user: ref('User') }),
  AdminLogin: object({ role: { type: 'string', enum: ['admin'] }, redirect: string }),
  Profile: object({ user: ref('User') }),
  OrderItem: object({ product_id: integer, name: string, category: string, price: integer, size: string, color: string, quantity: integer, shippingWeightG: { type: 'integer', nullable: true }, shippingLengthCm: { type: 'integer', nullable: true }, shippingWidthCm: { type: 'integer', nullable: true }, shippingHeightCm: { type: 'integer', nullable: true } }),
  ParcelEstimate: object({ weight: integer, length: integer, width: integer, height: integer, estimated: boolean }),
  Quote: object(quoteFields),
  Order: object({ id: integer, customer_name: string, phone: string, email: string, address: string, user_id: { type: 'integer', nullable: true }, paymentMethod: { type: 'string', enum: ['cod'] }, paymentStatus: { type: 'string', enum: ['unpaid', 'paid'] }, paidAt: { type: 'string', nullable: true }, shipment: { type: 'object', nullable: true, properties: { carrier: string, trackingNumber: string, trackingUrl: string, updatedAt: string } }, ...quoteFields, status, created_at: string }),
  Voucher: object(voucherFields),
  AdminVoucher: object({ id: integer, ...voucherFields, startsAt: { type: 'string', nullable: true }, active: boolean, usageLimit: integer, used: integer }),
  Cart: object({ items: array(object({ productId: integer, quantity: integer, size: string, color: string, product: { allOf: [ref('Product')], nullable: true }, available: boolean })), subtotal: integer }),
  Wishlist: object({ products: array(ref('Product')) }),
  WishlistSaved: object({ productIds: array(integer) }),
  Stats: object({ users: integer, lockedUsers: integer, products: integer, lowStock: integer, orders: integer, ordersByStatus: { type: 'object', additionalProperties: integer }, revenue: integer }),
  IntegrationStatus: object({ emailConfigured: boolean, shipping: object({ provider: string, configured: boolean, automatic: boolean, webhookConfigured: boolean }), payment: object({ online: boolean, methods: array(string) }), storage: object({ type: string, multiInstance: boolean }) }),
  GhnSimulation: object({ mode: { type: 'string', enum: ['simulation'] }, clientOrderCode: string, trackingNumber: string, codAmount: integer, message: string }),
  Error: { ...object({ error: string }), required: ['error'] },
};

function responseSchema(method, route) {
  if (route === '/api/account/overview') return object({ user: ref('User'), stats: object({ orders: integer, completed: integer, inProgress: integer, cancelled: integer, totalSpent: integer, addresses: integer, reviews: integer, openSupport: integer }), defaultAddress: { allOf: [ref('Address')], nullable: true } });
  if (route === '/api/addresses') return object({ items: array(ref('Address')) });
  if (route === '/api/products/{id}/reviews') return object({ items: array(ref('Review')), count: integer, average: { type: 'number' } });
  if (route === '/api/orders/{id}/reorder') return object({ added: integer });
  if (route === '/api/support') return method === 'get' ? object({ items: array(ref('SupportTicket')) }) : ref('SupportTicket');
  if (route === '/api/admin/support') return array(ref('SupportTicket'));
  if (route === '/api/admin/support/{ticketId}') return ref('SupportTicket');
  if (route === '/api/admin/reviews') return array(ref('AdminReview'));
  if (route === '/api/admin/reviews/{reviewId}') return ref('AdminReview');
  const exact = {
    '/health': object({ status: string, version: string }),
    '/api/info': object({ name: string, status: string, version: string }),
    '/api/products': array(ref('Product')),
    '/api/products/{id}': ref('Product'),
    '/api/categories': array(string),
    '/api/auth/register': ref('Auth'),
    '/api/auth/login': { oneOf: [ref('Auth'), ref('AdminLogin')] },
    '/api/auth/me': ref('Profile'),
    '/api/auth/password': object({ changed: boolean, requiresLogin: boolean }),
    '/api/auth/logout': object({ loggedOut: boolean }),
    '/api/cart': ref('Cart'),
    '/api/wishlist': ref(method === 'put' ? 'WishlistSaved' : 'Wishlist'),
    '/api/vouchers': array(ref('Voucher')),
    '/api/checkout/quote': ref('Quote'),
    '/api/orders': ref('Order'),
    '/api/orders/mine': array(ref('Order')),
    '/api/orders/{id}': ref('Order'),
    '/api/orders/{id}/cancel': ref('Order'),
    '/api/admin/login': object({ authenticated: boolean }),
    '/api/admin/session': object({ authenticated: boolean }),
    '/api/admin/logout': object({ loggedOut: boolean }),
    '/api/admin/stats': ref('Stats'),
    '/api/admin/integrations': ref('IntegrationStatus'),
    '/api/admin/orders/{id}/shipment/ghn/simulate': ref('GhnSimulation'),
    '/api/admin/users': array(ref('AdminUser')),
    '/api/admin/users/{id}': ref('AdminUser'),
    '/api/admin/users/{id}/orders': array(ref('Order')),
    '/api/admin/orders': array(ref('Order')),
    '/api/admin/orders/{id}': ref('Order'),
    '/api/admin/categories': array(string),
    '/api/admin/categories/{name}': object({ name: string }),
    '/api/admin/images': object({ image: string }),
  };
  if (exact[route]) return exact[route];
  if (/^\/api\/admin\/(products|vouchers)(\/\{id\})?$/.test(route)) {
    if (method === 'delete') return object({ deleted: boolean });
    const model = ref(route.includes('/products') ? 'Product' : 'AdminVoucher');
    return method === 'get' ? array(model) : model;
  }
  const prefix = '/api/v1/vn/vi';
  if (route === prefix + '/categories') return object({ categories: array(ref('Category')), total: integer });
  if (route === prefix + '/products/filters') return ref('CatalogFilters');
  if (route === prefix + '/products/section/men') return object({ pageTitle: string, categories: array(ref('Category')), collectionHighlights: array(object({ title: string, description: string })), stylingIdeas: array(string), filters: ref('CatalogFilters'), products: array(ref('Product')) });
  if (route === prefix + '/products') return object({ items: array(ref('Product')), meta: object({ page: integer, limit: integer, sort: string, total: integer, totalPages: integer }) });
  if (route === prefix + '/products/search') return object({ query: string, suggestions: array(object({ name: string, price: integer, image: string })), results: array(ref('Product')) });
  if (route === prefix + '/products/{id}/stock') return object({ productId: integer, stock: integer, variants: array(object({ color: string, size: string, available: boolean })) });
  if (route === prefix + '/size-recommendation') return object({ recommendedSize: string, confidence: string, breakpoints: object({ height: { type: 'number' }, weight: { type: 'number' }, fit: string }) });
  // Demo catalog metadata is intentionally extensible.
  return { type: 'object', additionalProperties: true };
}

module.exports = { schemas, responseSchema };
