// Search the bundled administrative address list without sending customer input elsewhere.
function normalizeAddress(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}

function findAddresses(provinces, query) {
  const words = normalizeAddress(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const matches = [];
  for (const province of provinces) {
    for (const ward of province.wards || []) {
      const label = `${ward.name}, ${province.name}`;
      if (words.every(word => normalizeAddress(label).includes(word))) {
        matches.push({ city: province.name, ward: ward.name, label });
        if (matches.length === 20) return matches;
      }
    }
  }
  return matches;
}

(() => {
  const input = document.getElementById('checkoutAddressSearch');
  const results = document.getElementById('addressSearchResults');
  const status = document.getElementById('addressSearchStatus');
  let dataPromise;
  let generation = 0;
  let timer;
  const close = () => { generation++; clearTimeout(timer); results.hidden = true; };
  async function search() {
    const current = ++generation;
    const query = input.value.trim();
    results.hidden = true;
    if (query.length < 2) {
      status.textContent = 'Nhập ít nhất 2 ký tự. Bạn cũng có thể điền địa chỉ bên dưới.';
      return;
    }
    status.textContent = 'Đang tìm địa chỉ…';
    try {
      if (!dataPromise) dataPromise = fetch('/data/vietnam-addresses.json').then(response => {
        if (!response.ok) throw new Error('Address data unavailable');
        return response.json();
      }).catch(error => { dataPromise = null; throw error; });
      const data = await dataPromise;
      if (current !== generation) return;
      const matches = findAddresses(data, query);
      results.innerHTML = matches.map((item, index) => `<button type="button" data-address-index="${index}"><strong>${esc(item.ward)}</strong><span>${esc(item.city)}</span></button>`).join('');
      results.hidden = !matches.length;
      status.textContent = matches.length ? `${matches.length === 20 ? 'Hiển thị 20' : matches.length} địa chỉ phù hợp. Chọn một kết quả hoặc nhập cụ thể hơn.` : 'Không tìm thấy. Hãy thử tên mới hoặc nhập địa chỉ bên dưới.';
      results.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        const selected = matches[Number(button.dataset.addressIndex)];
        document.getElementById('checkoutCity').value = selected.city;
        document.getElementById('checkoutWard').value = selected.ward;
        document.getElementById('checkoutDistrict').value = '';
        input.value = selected.label;
        close();
        status.textContent = 'Đã điền tỉnh/thành và phường/xã. Hãy bổ sung số nhà, tên đường.';
        document.getElementById('checkoutAddress').focus();
      }));
    } catch {
      if (current === generation) status.textContent = 'Chưa tải được gợi ý. Bạn vẫn có thể nhập địa chỉ vào các ô bên dưới.';
    }
  }
  input.addEventListener('input', () => { close(); timer = setTimeout(search, 180); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); clearTimeout(timer); search(); }
    if (event.key === 'ArrowDown' && !results.hidden) { event.preventDefault(); results.querySelector('button')?.focus(); }
    if (event.key === 'Escape' && !results.hidden) { event.stopPropagation(); close(); }
  });
  results.addEventListener('keydown', event => {
    const buttons = [...results.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }
    if (event.key === 'Escape') { event.stopPropagation(); close(); input.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.checkout-address-search')) close(); });
  document.getElementById('checkoutForm').addEventListener('reset', () => {
    close();
    status.textContent = 'Có thể tìm không dấu theo tên phường/xã và tỉnh/thành.';
  });
})();
