let customerOverview = null;
let profileRequest = 0;
const profileGenders = { female: 'Nữ', male: 'Nam', other: 'Khác', undisclosed: 'Không chia sẻ' };
const profileColors = new Set(['sage', 'teal', 'sand', 'rose', 'slate']);
document.getElementById('profileForm').insertAdjacentHTML('afterbegin', '<p id="profileIdentity" class="profile-identity"></p>');
document.querySelector('#profileForm button[type=submit]').insertAdjacentHTML('beforebegin', '<div class="profile-edit-grid"><label>Ngày sinh (không bắt buộc)<input name="birthday" type="date" min="1900-01-01" autocomplete="bday"></label><label>Giới tính (không bắt buộc)<select name="gender"><option value="">Chưa cung cấp</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option><option value="undisclosed">Không chia sẻ</option></select></label></div><label>Màu ảnh đại diện chữ cái<select name="avatarColor"><option value="sage">Xanh lá dịu</option><option value="teal">Xanh ngọc</option><option value="sand">Be cát</option><option value="rose">Hồng nhạt</option><option value="slate">Xám xanh</option></select></label><label>Giới thiệu ngắn (không bắt buộc)<textarea name="bio" maxlength="300" rows="3" placeholder="Một vài điều về bạn…"></textarea></label><p class="service-description">Thông tin này thuộc hồ sơ tài khoản của bạn. Email và điện thoại chưa được xác minh bằng OTP.</p>');
async function refreshCustomerOverview() {
  const token = localStorage.getItem('shop_token'), request = ++profileRequest;
  if (!token) { customerOverview = null; return; }
  try {
    const result = await api('/api/account/overview', { headers: { Authorization: 'Bearer ' + token } });
    if (request !== profileRequest || localStorage.getItem('shop_token') !== token) return;
    customerOverview = result;
    localStorage.setItem('shop_user', JSON.stringify(result.user));
    renderAccountSummary();
  } catch { /* Keep basic profile visible; individual actions report their errors. */ }
}
function renderProfileCard(container, user) {
  const overview = customerOverview?.user.id === user.id ? customerOverview : null;
  const completed = orderHistory.filter(order => order.status === 'done');
  const stats = overview?.stats || { orders: orderHistory.length, completed: completed.length, inProgress: orderHistory.filter(order => ['new', 'confirmed', 'shipping'].includes(order.status)).length, totalSpent: completed.reduce((sum, order) => sum + Number(order.total), 0) };
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
  const color = profileColors.has(user.avatarColor) ? user.avatarColor : 'sage';
  const address = overview?.defaultAddress;
  const addressText = address ? [address.address, address.ward, address.district, address.city].filter(Boolean).join(', ') : user.address || 'Chưa lưu địa chỉ';
  const birthday = user.birthday ? user.birthday.split('-').reverse().join('/') : 'Chưa cung cấp';
  container.innerHTML = `<div class="profile-intro"><span class="profile-avatar profile-${color}" aria-hidden="true">${esc(user.name.trim().split(/\s+/).slice(-1)[0].slice(0, 1).toUpperCase())}</span><div><strong>${esc(user.name)}</strong><span>@${esc(user.username)}</span><small>KH-${String(user.id).padStart(5, '0')} · Tham gia ${esc(joined)}</small></div></div>${user.bio ? `<p class="profile-bio">${esc(user.bio)}</p>` : ''}<div class="profile-metrics"><div><strong>${stats.orders}</strong><span>Tổng đơn mua</span></div><div><strong>${stats.inProgress}</strong><span>Đang xử lý</span></div><div><strong>${stats.completed}</strong><span>Đã hoàn thành</span></div><div><strong>${experienceMoney(stats.totalSpent)}</strong><span>Chi tiêu đơn hoàn thành</span></div></div><dl class="profile-data"><div><dt>Email</dt><dd>${esc(user.email || 'Chưa cung cấp')}</dd></div><div><dt>Điện thoại</dt><dd>${esc(user.phone || 'Chưa cung cấp')}</dd></div><div><dt>Ngày sinh</dt><dd>${esc(birthday)}</dd></div><div><dt>Giới tính</dt><dd>${esc(profileGenders[user.gender] || 'Chưa cung cấp')}</dd></div></dl><div class="profile-shipping"><span class="service-eyebrow">${address ? 'ĐỊA CHỈ MẶC ĐỊNH' : 'ĐỊA CHỈ LIÊN HỆ'}</span>${address ? `<strong>${esc(address.name)} · ${esc(address.phone)}</strong>` : ''}<p>${esc(addressText)}</p><small>${overview ? `${stats.addresses} địa chỉ · ${stats.reviews} đánh giá · ${stats.openSupport} yêu cầu đang xử lý` : 'Thống kê hồ sơ được cập nhật từ tài khoản.'}</small></div><div class="profile-actions"><button type="button" class="small-btn" data-edit-profile>Chỉnh sửa hồ sơ & mật khẩu →</button><button type="button" class="small-btn" data-profile-addresses>Sổ địa chỉ</button><button type="button" class="small-btn" data-profile-orders>Đơn mua của tôi</button></div>`;
}
document.addEventListener('click', event => {
  if (event.target.closest('[data-profile-addresses]')) document.getElementById('openAddresses').click();
  if (event.target.closest('[data-profile-orders]')) { document.getElementById('myOrderStatus').value = ''; document.getElementById('myOrderSearch').value = ''; renderOrderHistory(); document.getElementById('orderHistoryList').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
});
