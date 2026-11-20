(() => {
  let resetToken = '';
  let emailEnabled = false;
  let authenticatorEnabled = false;
  const emailForm = document.getElementById('forgotPasswordForm');
  const authenticatorForm = document.getElementById('forgotAuthenticatorForm');
  const emailTab = document.getElementById('recoveryEmailTab');
  const authenticatorTab = document.getElementById('recoveryTotpTab');

  function setRecoveryMethod(method) {
    const useAuthenticator = method === 'authenticator' && authenticatorEnabled;
    emailForm.classList.toggle('hidden', useAuthenticator);
    authenticatorForm.classList.toggle('hidden', !useAuthenticator);
    emailTab.setAttribute('aria-pressed', String(!useAuthenticator));
    authenticatorTab.setAttribute('aria-pressed', String(useAuthenticator));
    document.getElementById('recoveryUnavailable').classList.toggle('hidden', emailEnabled || authenticatorEnabled);
    setStatus('');
  }

  async function post(path, data) {
    const response = await fetch('/api/auth/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Chưa thể thực hiện. Vui lòng thử lại.');
    return result;
  }

  function finishReset() {
    resetToken = '';
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
    renderUserPanel();
    toggleAuth('login');
    setStatus('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
  }

  fetch('/api/auth/recovery-options').then(response => response.ok ? response.json() : {}).then(options => {
    emailEnabled = options.emailEnabled === true;
    authenticatorEnabled = options.authenticatorEnabled === true;
    window.recoveryOptions = { emailEnabled, authenticatorEnabled };
    emailTab.disabled = !emailEnabled;
    emailForm.querySelector('[type=submit]').disabled = !emailEnabled;
    authenticatorTab.disabled = !authenticatorEnabled;
    document.getElementById('recoveryUnavailable').classList.toggle('hidden', emailEnabled || authenticatorEnabled);
    if (!emailEnabled && authenticatorEnabled) setRecoveryMethod('authenticator');
  }).catch(() => {
    window.recoveryOptions = { emailEnabled: false, authenticatorEnabled: false };
    emailTab.disabled = true;
    emailForm.querySelector('[type=submit]').disabled = true;
    authenticatorTab.disabled = true;
    document.getElementById('recoveryUnavailable').classList.remove('hidden');
  });

  emailTab.addEventListener('click', () => setRecoveryMethod('email'));
  authenticatorTab.addEventListener('click', () => setRecoveryMethod('authenticator'));

  const fragment = new URLSearchParams(location.hash.slice(1));
  if (fragment.has('reset')) {
    resetToken = fragment.get('reset');
    history.replaceState(null, '', location.pathname + location.search);
    toggleAuth('reset');
    if (!/^[a-f0-9]{64}$/.test(resetToken)) setStatus('Liên kết không hợp lệ. Vui lòng yêu cầu liên kết mới.', true);
  }

  emailForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = emailForm.querySelector('[type=submit]');
    if (button.disabled) return;
    button.disabled = true; setStatus('Đang gửi yêu cầu…');
    try {
      const result = await post('forgot-password', { email: emailForm.elements.email.value.trim() });
      emailForm.reset(); setStatus(result.message);
    } catch (error) { setStatus(error.message, true); }
    finally { button.disabled = false; }
  });

  authenticatorForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.elements.newPassword.value !== form.elements.confirmPassword.value) return setStatus('Mật khẩu nhập lại chưa khớp.', true);
    const button = form.querySelector('[type=submit]');
    if (button.disabled) return;
    button.disabled = true; setStatus('Đang xác nhận mã Authenticator…');
    try {
      await post('reset-totp-password', {
        phone: form.elements.phone.value.trim(),
        otp: form.elements.otp.value.trim(),
        newPassword: form.elements.newPassword.value,
      });
      form.reset(); finishReset();
    } catch (error) { setStatus(error.message, true); }
    finally { button.disabled = false; }
  });

  document.getElementById('resetPasswordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.elements.newPassword.value !== form.elements.confirmPassword.value) return setStatus('Mật khẩu nhập lại chưa khớp.', true);
    const button = form.querySelector('[type=submit]');
    if (button.disabled) return;
    button.disabled = true; setStatus('Đang cập nhật mật khẩu…');
    try {
      await post('reset-password', { token: resetToken, newPassword: form.elements.newPassword.value });
      form.reset(); finishReset();
    } catch (error) { setStatus(error.message, true); }
    finally { button.disabled = false; }
  });
})();