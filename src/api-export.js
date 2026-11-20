function postmanCollection(spec) {
  const groups = new Map();
  for (const [route, operations] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(operations)) {
    const headers = [];
    const admin = operation.security.some(item => item.AdminToken);
    if (admin) headers.push({ key: 'x-admin-token', value: '{{adminToken}}' });
    if (operation.security.some(item => item.CustomerBearer)) headers.push({ key: 'Authorization', value: 'Bearer {{customerToken}}' });
    if (route.startsWith('/api/admin/') && !['get', 'head'].includes(method)) headers.push({ key: 'X-Requested-With', value: 'shop-admin' });
    let url = '{{baseUrl}}' + route.replace(/\{(\w+)\}/g, (_, name) => '{{' + name + '}}');
    const query = operation.parameters.filter(item => item.in === 'query');
    if (query.length) url += '?' + query.map(item => encodeURIComponent(item.name) + '=' + encodeURIComponent(item.example ?? '')).join('&');
    const request = { method: method.toUpperCase(), header: headers, url, description: operation.description };
    const json = operation.requestBody?.content['application/json'];
    if (json) {
      headers.push({ key: 'Content-Type', value: 'application/json' });
      request.body = { mode: 'raw', raw: JSON.stringify(json.example, null, 2), options: { raw: { language: 'json' } } };
    } else if (operation.requestBody) {
      headers.push({ key: 'Content-Type', value: 'image/png' });
      request.body = { mode: 'file', file: {} };
      request.description += '\n\nChọn file PNG trong tab Body → binary trước khi gửi.';
    }
    const item = { name: operation.summary, request, response: [] };
    if (['/api/auth/register', '/api/auth/login'].includes(route)) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: ['if (pm.response.code >= 200 && pm.response.code < 300) {', '  const payload = pm.response.json();', '  if (payload.token) pm.collectionVariables.set("customerToken", payload.token);', '}'] } }];
    if (!groups.has(operation.tags[0])) groups.set(operation.tags[0], []);
    groups.get(operation.tags[0]).push(item);
  }
  return {
    info: { name: spec.info.title, description: 'Các request mẫu gọi API thật. Đặt baseUrl, adminToken; đăng nhập khách sẽ tự cập nhật customerToken. Không chứa secret của shop.', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    variable: [{ key: 'baseUrl', value: 'http://localhost:8080' }, { key: 'customerToken', value: '' }, { key: 'adminToken', value: '' }, { key: 'id', value: '1' }, { key: 'ticketId', value: '' }, { key: 'reviewId', value: '' }],
    item: [...groups].map(([name, item]) => ({ name, item })),
  };
}
function apiMarkdown(spec) {
  const lines = ['# Home Shopping App — API reference', '', `OpenAPI ${spec.openapi}. Các ví dụ là dữ liệu minh họa; gọi API đọc để lấy ID thật.`, '', 'Swagger: `/api-docs`. JSON: `/api/openapi.json`. Postman: `/api/postman.json`.', '', '## Luồng thử nhanh', '', '1. GET /api/products để chọn ID và biến thể.', '2. POST /api/auth/register hoặc /api/auth/login, lấy token khách.', '3. PUT /api/cart, POST /api/checkout/quote.', '4. POST /api/orders với expectedTotal từ báo giá.', '5. Quản trị xác nhận/giao/hoàn thành đơn theo trạng thái hợp lệ.', '6. Khách xem đơn, đánh giá sau hoàn thành hoặc gửi yêu cầu hỗ trợ.', '', 'Cookie quản trị cần X-Requested-With: shop-admin khi ghi. JWT hết hạn sau 24 giờ; cookie quản trị 8 giờ. Secret chỉ cấu hình ở client riêng, không nằm trong file này.', ''];
  for (const [route, operations] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(operations)) {
    lines.push(`## ${method.toUpperCase()} ${route}`, '', operation.summary, '', operation.description, '');
    if (operation.parameters.length) lines.push('| Tham số | Vị trí | Bắt buộc | Mô tả |', '| --- | --- | --- | --- |', ...operation.parameters.map(item => `| ${item.name} | ${item.in} | ${item.required ? 'Có' : 'Không'} | ${item.description} |`), '');
    const body = operation.requestBody?.content['application/json'];
    if (body) lines.push('Request mẫu:', '', '```json', JSON.stringify(body.example, null, 2), '```', '');
    for (const [code, response] of Object.entries(operation.responses)) {
      lines.push(`### HTTP ${code}`, '', response.description, '');
      if (Number(code) < 300) lines.push('```json', JSON.stringify(response.content['application/json'].example, null, 2), '```', '');
    }
  }
  return lines.join('\n');
}
module.exports = { postmanCollection, apiMarkdown };
