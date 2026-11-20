// Read-only audit. Outputs counts and product IDs, never customer records or secrets.
const fs = require('fs');
const path = require('path');
const file = process.env.DB_PATH || path.join(process.cwd(), 'data', 'shop.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const products = data.products || [], users = data.users || [], orders = data.orders || [], vouchers = data.vouchers || [];
const ids = values => new Set(values.map(v => v.id));
const productIds = ids(products), userIds = ids(users), voucherIds = ids(vouchers);
const duplicateIds = values => values.length - ids(values).size;
const badProduct = predicate => products.filter(predicate).map(p => p.id);
const sum = values => values.reduce((a, b) => a + b, 0);
const localImageMissing = badProduct(p => typeof p.image === 'string' && p.image.startsWith('/') && !fs.existsSync(path.join(process.cwd(), 'public', p.image)));
const report = {
  totals: { products: products.length, users: users.length, orders: orders.length, vouchers: vouchers.length, reviews: (data.reviews || []).length, support: (data.support || []).length },
  duplicateIds: Object.fromEntries(Object.entries({ products, users, orders, vouchers }).map(([key, values]) => [key, duplicateIds(values)])),
  products: {
    categories: Object.fromEntries([...new Set(products.map(p => p.category))].map(c => [c, products.filter(p => p.category === c).length])),
    household: products.filter(p => p.subCategory === 'home').length,
    missingName: badProduct(p => !p.name?.trim()), missingCategory: badProduct(p => !p.category?.trim()),
    invalidPrice: badProduct(p => !Number.isSafeInteger(p.price) || p.price <= 0), invalidStock: badProduct(p => !Number.isSafeInteger(p.stock) || p.stock < 0),
    missingDescription: badProduct(p => !p.description?.trim()), shortDescription: products.filter(p => (p.description || '').trim().length < 80).length,
    missingSizes: badProduct(p => !Array.isArray(p.sizes) || !p.sizes.length), missingColors: badProduct(p => !Array.isArray(p.colors) || !p.colors.length),
    missingImage: badProduct(p => !p.image), localImageMissing, illustrativeImages: products.filter(p => p.image?.startsWith('/images/products/')).length,
    externalImages: products.filter(p => /^https?:/.test(p.image || '')).length,
    noGallery: products.filter(p => !Array.isArray(p.images) || p.images.length < 2).length,
    duplicateNames: products.length - new Set(products.map(p => p.name?.trim().toLowerCase())).size,
  },
  orders: {
    statuses: Object.fromEntries([...new Set(orders.map(o => o.status))].map(s => [s, orders.filter(o => o.status === s).length])),
    missingUsers: orders.filter(o => o.user_id != null && !userIds.has(o.user_id)).length,
    missingProductReferences: sum(orders.map(o => (o.items || []).filter(i => !productIds.has(i.product_id)).length)),
    missingVoucherReferences: orders.filter(o => o.voucherId != null && !voucherIds.has(o.voucherId)).length,
    missingPriceBreakdown: orders.filter(o => ['subtotal', 'shippingFee', 'discount'].some(k => !Number.isFinite(o[k]))).map(o => o.id),
    badTotals: orders.filter(o => ['subtotal', 'shippingFee', 'discount'].every(k => Number.isFinite(o[k])) && (o.total !== o.subtotal + o.shippingFee - o.discount || o.subtotal !== sum((o.items || []).map(i => i.price * i.quantity)))).length,
    invalidItems: orders.filter(o => !o.items?.length || o.items.some(i => !Number.isSafeInteger(i.quantity) || i.quantity < 1 || !Number.isSafeInteger(i.price) || i.price < 0)).length,
    completedRevenue: sum(orders.filter(o => o.status === 'done').map(o => o.total)),
  },
  users: { withoutEmail: users.filter(u => !u.email).length, invalidEmail: users.filter(u => u.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)).length, withoutPhone: users.filter(u => !u.phone).length, withoutAddress: users.filter(u => !u.address).length, missingPasswordHash: users.filter(u => !u.password?.hash || !u.password?.salt).length },
  vouchers: { active: vouchers.filter(v => v.active).length, expired: vouchers.filter(v => v.expiresAt && new Date(v.expiresAt).getTime() < Date.now()).length, invalidUsage: vouchers.filter(v => !Number.isSafeInteger(v.used) || v.used < 0).length },
  contactMissingFields: ['phone', 'zaloPhone', 'email', 'address', 'hours', 'facebookUrl', 'messengerUrl'].filter(k => !data.contact?.[k]),
  recoveryEmailConfigured: !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM && process.env.PUBLIC_URL),
};
console.log(JSON.stringify(report, null, 2));
