/* ================================================================
   LOGIN – Script
   ================================================================ */

// Header scroll shadow
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

// Elements
const loginForm          = document.getElementById('loginForm');
const loginIdentifier    = document.getElementById('loginIdentifier');
const loginPassword      = document.getElementById('loginPassword');
const btnLogin           = document.getElementById('btnLogin');
const btnLoginLabel      = document.getElementById('btnLoginLabel');
const btnLoginSpinner    = document.getElementById('btnLoginSpinner');
const loginAlert         = document.getElementById('loginAlert');
const loginAlertMsg      = document.getElementById('loginAlertMsg');
const identifierError    = document.getElementById('identifierError');
const passwordError      = document.getElementById('passwordError');

// CPF mask (applied when input looks like digits only)
function cpfMask(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

loginIdentifier.addEventListener('input', () => {
  loginIdentifier.classList.remove('form-input--error');
  identifierError.classList.add('hidden');
  hideAlert();

  // Auto-mask when the user is typing a CPF (only digits so far)
  const raw = loginIdentifier.value;
  if (/^\d[\d.\-]*$/.test(raw) && !raw.includes('@')) {
    loginIdentifier.value = cpfMask(raw);
  }
});

loginPassword.addEventListener('input', () => {
  loginPassword.classList.remove('form-input--error');
  passwordError.classList.add('hidden');
  hideAlert();
});

// Password visibility toggle
document.getElementById('pwdToggle').addEventListener('click', () => {
  const isText = loginPassword.type === 'text';
  loginPassword.type = isText ? 'password' : 'text';
  document.getElementById('eyeShow').classList.toggle('hidden', !isText);
  document.getElementById('eyeHide').classList.toggle('hidden', isText);
});

function showAlert(msg) {
  loginAlertMsg.textContent = msg;
  loginAlert.classList.remove('hidden');
}

function hideAlert() {
  loginAlert.classList.add('hidden');
}

function showFieldError(input, errEl, msg) {
  input.classList.add('form-input--error');
  errEl.textContent = msg;
  errEl.classList.remove('hidden');
}

function isEmailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isCpfDigits(v)  { return /^\d{11}$/.test(v.replace(/\D/g, '')); }

function validate() {
  let ok = true;
  const val = loginIdentifier.value.trim();

  if (!val || (!isEmailValid(val) && !isCpfDigits(val))) {
    showFieldError(loginIdentifier, identifierError, 'Informe um CPF ou e-mail válido.');
    ok = false;
  }

  if (!loginPassword.value) {
    showFieldError(loginPassword, passwordError, 'Informe sua senha.');
    ok = false;
  }

  return ok;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  if (!validate()) return;

  btnLogin.disabled = true;
  btnLoginLabel.textContent = 'Entrando…';
  btnLoginSpinner.classList.remove('hidden');

  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        identifier: loginIdentifier.value.trim(),
        password: loginPassword.value,
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (r.ok) {
      window.location.href = data.redirectTo || '/app';
      return;
    }

    if (r.status === 401) {
      showAlert('CPF/e-mail ou senha incorretos. Verifique seus dados e tente novamente.');
      loginIdentifier.classList.add('form-input--error');
      loginPassword.classList.add('form-input--error');
    } else if (r.status === 403 && data.error === 'ACCOUNT_DISABLED') {
      showAlert('Sua conta está desativada. Entre em contato com o suporte.');
    } else if (r.status === 429) {
      showAlert('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
    } else {
      showAlert('Erro ao realizar login. Tente novamente.');
    }
  } catch {
    showAlert('Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    btnLogin.disabled = false;
    btnLoginLabel.textContent = 'Entrar na plataforma';
    btnLoginSpinner.classList.add('hidden');
  }
});
