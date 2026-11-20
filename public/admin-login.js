'use strict';
const form = document.getElementById('adminLoginForm');
const error = document.getElementById('adminLoginError');

fetch('/api/admin/session', { headers: { 'X-Requested-With': 'shop-admin' } })
  .then(response => { if (response.ok) location.replace('/admin'); })
  .catch(() => {});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  error.textContent = '';
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.elements.username.value.trim(),
        password: form.elements.password.value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể đăng nhập. Vui lòng thử lại.');
    location.replace('/admin');
  } catch (cause) {
    error.textContent = cause.message || 'Không thể kết nối đến máy chủ.';
  } finally {
    button.disabled = false;
  }
});
