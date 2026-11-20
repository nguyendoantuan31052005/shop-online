async function loadShopContact() {
  const node = document.getElementById('shopContact');
  try {
    const contact = await api('/api/contact');
    const channels = [];
    if (contact.phone) channels.push({ icon: '↗', title: 'Gọi trực tiếp', detail: contact.phone, href: 'tel:' + contact.phone });
    if (contact.zaloPhone) channels.push({ icon: 'Z', title: 'Nhắn qua Zalo', detail: 'Tư vấn sản phẩm & đơn hàng', href: 'https://zalo.me/' + contact.zaloPhone });
    if (contact.messengerUrl) channels.push({ icon: 'M', title: 'Messenger', detail: contact.facebookName || 'Nhắn tin cho shop', href: contact.messengerUrl });
    if (contact.facebookUrl) channels.push({ icon: 'f', title: 'Facebook', detail: contact.facebookName || 'Trang Facebook của shop', href: contact.facebookUrl });
    if (contact.email) channels.push({ icon: '@', title: 'Gửi email', detail: contact.email, href: 'mailto:' + contact.email });
    node.innerHTML = channels.map(channel => `<a class="contact-channel" href="${esc(channel.href)}" ${channel.href.startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : ''}><span class="contact-icon" aria-hidden="true">${channel.icon}</span><span><strong>${esc(channel.title)}</strong><small>${esc(channel.detail)}</small></span><span aria-hidden="true">↗</span></a>`).join('') + (contact.facebookName && !contact.facebookUrl && !contact.messengerUrl ? `<div class="contact-note">Facebook: <strong>${esc(contact.facebookName)}</strong></div>` : '') + (contact.address ? `<p class="contact-note"><strong>Địa chỉ shop</strong><br>${esc(contact.address)}</p>` : '') + (contact.hours ? `<p class="contact-note"><strong>Giờ hỗ trợ</strong><br>${esc(contact.hours)}</p>` : '');
    const methods = document.createElement('div'); methods.className = 'contact-methods';
    const meta = document.createElement('div'); meta.className = 'contact-meta';
    [...node.children].forEach(child => (child.classList.contains('contact-channel') ? methods : meta).append(child));
    node.replaceChildren(methods, meta);
    if (!node.textContent.trim()) node.textContent = 'Bạn có thể sử dụng các mục hỗ trợ đơn hàng bên trên.';
    if (channels.length) {
      const panel = document.createElement('details');
      panel.className = 'contact-float';
      panel.innerHTML = `<summary>Liên hệ shop <span aria-hidden="true">↗</span></summary><div><strong>Home Shopping · Luôn sẵn sàng hỗ trợ</strong>${channels.map(channel => `<a href="${esc(channel.href)}" ${channel.href.startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${esc(channel.title)} <span aria-hidden="true">↗</span></a>`).join('')}</div>`;
      document.body.append(panel);
      document.addEventListener('click', event => { if (!panel.contains(event.target)) panel.open = false; });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') panel.open = false; });
    }
  } catch { node.textContent = 'Chưa tải được thông tin liên hệ. Vui lòng tải lại trang.'; }
}
loadShopContact();
