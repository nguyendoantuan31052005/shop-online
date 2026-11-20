(() => {
  const dialog = document.getElementById('accountDialog');
  const setupButton = document.getElementById('totpSetupButton');
  const enrollment = document.getElementById('totpEnrollment');
  const secretNode = document.getElementById('totpSecret');
  const statusNode = document.getElementById('totpStatus');
  const disableForm = document.getElementById('totpDisableForm');
  if (!dialog || !setupButton) return;

  async function refresh() {
    if (!localStorage.getItem('shop_token')) return;
    statusNode.textContent = 'Đang kiểm tra…';
    try {
      const result = await api('/api/auth/totp/status');
      statusNode.textContent = result.enabled
        ? 'Đã bật. Mã Authenticator hiện tại dùng được để khôi phục mật khẩu.'
        : 'Chưa bật. Hãy lưu số điện thoại trong hồ sơ rồi thiết lập Authenticator.';
      setupButton.hidden = result.enabled;
      disableForm.hidden = !result.enabled;
      if (result.enabled) enrollment.hidden = true;
    } catch (error) { statusNode.textContent = error.message; }
  }

  setupButton.addEventListener('click', async () => {
    setupButton.disabled = true;
    try {
      const result = await api('/api/auth/totp/setup', { method: 'POST', body: '{}' });
      secretNode.textContent = result.secret;
      enrollment.hidden = false;
      statusNode.textContent = 'Khóa thiết lập có hiệu lực 10 phút. Lưu khóa vào ứng dụng Authenticator rồi nhập mã xác nhận.';
    } catch (error) { statusNode.textContent = error.message; }
    finally { setupButton.disabled = false; }
  });

  document.getElementById('copyTotpSecret').addEventListener('click', async event => {
    try {
      await navigator.clipboard.writeText(secretNode.textContent);
      event.currentTarget.textContent = 'Đã sao chép';
    } catch { statusNode.textContent = 'Không sao chép tự động được. Hãy chọn và sao chép khóa thiết lập.'; }
  });

  document.getElementById('totpEnableForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      await api('/api/auth/totp/enable', { method: 'POST', body: JSON.stringify({ otp: form.elements.otp.value.trim() }) });
      form.reset();
      secretNode.textContent = '';
      enrollment.hidden = true;
      await refresh();
    } catch (error) { statusNode.textContent = error.message; }
    finally { button.disabled = false; }
  });

  disableForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      await api('/api/auth/totp/disable', { method: 'POST', body: JSON.stringify({ otp: form.elements.otp.value.trim() }) });
      form.reset();
      await refresh();
    } catch (error) { statusNode.textContent = error.message; }
    finally { button.disabled = false; }
  });

  document.addEventListener('totp:refresh', refresh);
})();
