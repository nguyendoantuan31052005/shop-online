// Search locally so customer address text never leaves the shop.
function normalizeAddress(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
}

let vietnamAddressIndexPromise;
function loadVietnamAddressIndex() {
  if (!vietnamAddressIndexPromise) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    vietnamAddressIndexPromise = fetch('/data/vietnam-addresses.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Address data unavailable'); return response.json(); })
      .then(provinces => provinces.flatMap(province => (province.wards || []).map(ward => {
        const city = String(province.name || '');
        const wardName = String(ward.name || '');
        return { city, ward: wardName, label: `${wardName}, ${city}`, wardKey: normalizeAddress(wardName), cityKey: normalizeAddress(city) };
      })))
      .finally(() => clearTimeout(timeout))
      .catch(error => { vietnamAddressIndexPromise = null; throw error; });
  }
  return vietnamAddressIndexPromise;
}

async function findAddresses(query, limit = 12) {
  const normalized = normalizeAddress(query);
  const words = normalized.split(' ').filter(Boolean);
  if (!words.length) return [];
  const index = await loadVietnamAddressIndex();
  const matches = [];
  for (const item of index) {
    const full = `${item.wardKey} ${item.cityKey}`;
    if (!words.every(word => full.includes(word))) continue;
    const score = item.wardKey.startsWith(normalized) ? 0 : item.cityKey.startsWith(normalized) ? 1 : 2;
    matches.push({ ...item, score });
  }
  matches.sort((a, b) => a.score - b.score || a.city.localeCompare(b.city, 'vi') || a.ward.localeCompare(b.ward, 'vi'));
  return matches.slice(0, limit);
}

function installAddressAutocomplete({ input, results, status, onSelect, selectedMessage, getQuery, displaySelection, searchOnFocus = false }) {
  let generation = 0;
  let timer;
  const close = () => { generation++; clearTimeout(timer); results.hidden = true; };
  async function search() {
    const current = ++generation;
    const query = String(getQuery ? getQuery(input) : input.value).trim();
    results.hidden = true;
    if (query.length < 2) {
      status.textContent = 'Nhập ít nhất 2 ký tự để tìm phường/xã hoặc tỉnh/thành.';
      return;
    }
    status.textContent = 'Đang tìm địa chỉ…';
    try {
      const matches = await findAddresses(query);
      if (current !== generation) return;
      results.innerHTML = matches.map((item, index) => `<button type="button" data-address-index="${index}"><strong>${esc(item.ward)}</strong><span>${esc(item.city)}</span></button>`).join('');
      results.hidden = !matches.length;
      status.textContent = matches.length ? `Có ${matches.length} gợi ý phù hợp. Chọn phường/xã để điền nhanh.` : 'Chưa có kết quả. Hãy thử tên tỉnh hoặc phường/xã không dấu.';
      results.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        const selected = matches[Number(button.dataset.addressIndex)];
        onSelect(selected);
        input.value = displaySelection ? displaySelection(selected) : selected.label;
        close();
        status.textContent = selectedMessage;
      }));
    } catch {
      if (current === generation) status.textContent = 'Chưa tải được danh sách địa chỉ. Bạn vẫn có thể nhập thủ công.';
    }
  }
  input.addEventListener('input', () => { close(); timer = setTimeout(search, 120); });
  input.addEventListener('focus', () => {
    if (searchOnFocus && String(getQuery ? getQuery(input) : input.value).trim().length >= 2) search();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !results.hidden) { event.preventDefault(); results.querySelector('button')?.click(); }
    if (event.key === 'Enter' && results.hidden) { event.preventDefault(); clearTimeout(timer); search(); }
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
  document.addEventListener('click', event => { if (!results.parentElement.contains(event.target)) close(); });
  input.form?.addEventListener('reset', close);
  return { close };
}

(() => {
  const input = document.getElementById('checkoutAddressSearch');
  const results = document.getElementById('addressSearchResults');
  const status = document.getElementById('addressSearchStatus');
  const autocomplete = installAddressAutocomplete({ input, results, status,
    onSelect(selected) {
      document.getElementById('checkoutCity').value = selected.city;
      document.getElementById('checkoutWard').value = selected.ward;
      document.getElementById('checkoutDistrict').value = '';
      document.getElementById('checkoutAddress').focus();
    },
    selectedMessage: 'Đã điền tỉnh/thành và phường/xã. Hãy nhập số nhà, tên đường.'
  });
  window.installAddressAutocomplete = installAddressAutocomplete;
  const checkoutCity = document.getElementById('checkoutCity');
  const checkoutWard = document.getElementById('checkoutWard');
  const fillCheckoutAddress = selected => {
    checkoutCity.value = selected.city;
    checkoutWard.value = selected.ward;
    document.getElementById('checkoutDistrict').value = '';
  };
  installAddressAutocomplete({
    input: checkoutCity,
    results: document.getElementById('checkoutCityResults'),
    status: document.getElementById('checkoutCityStatus'),
    onSelect: fillCheckoutAddress,
    displaySelection: item => item.city,
    selectedMessage: 'Đã điền tỉnh/thành và phường/xã.'
  });
  installAddressAutocomplete({
    input: checkoutWard,
    results: document.getElementById('checkoutWardResults'),
    status: document.getElementById('checkoutWardStatus'),
    getQuery: input => [checkoutCity.value, input.value].filter(Boolean).join(' '),
    onSelect: fillCheckoutAddress,
    displaySelection: item => item.ward,
    searchOnFocus: true,
    selectedMessage: 'Đã chọn phường/xã thuộc tỉnh/thành này.'
  });
  checkoutCity.addEventListener('input', () => { checkoutWard.value = ''; });
  document.getElementById('checkoutForm').addEventListener('reset', () => {
    autocomplete.close();
    status.textContent = 'Có thể tìm không dấu theo tên phường/xã và tỉnh/thành.';
  });
})();
