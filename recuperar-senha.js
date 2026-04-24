/* ================================================================
   RECUPERAR SENHA
   Dois modos detectados automaticamente pelo ?token= na URL:

   Modo Solicitação (sem token):
     CPF → POST /api/auth/password-recovery → "verifique seu e-mail"

   Modo Reset (com token):
     Verifica token → POST /api/auth/password-recovery/verify-token
     Nova senha     → POST /api/auth/password-recovery/reset
   ================================================================ */

// Header scroll shadow
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

/* ================================================================
   UTILITÁRIOS
   ================================================================ */

function cpfMask(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function digitsOnly(s) { return s.replace(/\D/g, ''); }

function isCpfValid(cpf) {
  const d = digitsOnly(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +d[i] * (10 - i);
  let r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
  if (r !== +d[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +d[i] * (11 - i);
  r = (s * 10) % 11; if (r === 10 || r === 11) r = 0;
  return r === +d[10];
}

const DONE_SVG = `<svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M13.293 3.293L6 10.586 2.707 7.293 1.293 8.707l4 4a1 1 0 001.414 0l8-8-1.414-1.414z"/></svg>`;

function markDone(id) {
  const el = document.getElementById(id);
  el.classList.remove('reg-progress__step--active');
  el.classList.add('reg-progress__step--done');
  el.querySelector('.reg-progress__dot').innerHTML = DONE_SVG;
}

function markActive(id) {
  document.getElementById(id).classList.add('reg-progress__step--active');
}

/* ================================================================
   DETECÇÃO DE MODO
   ================================================================ */

const urlToken = new URLSearchParams(location.search).get('token');

if (urlToken) {
  // Modo Reset: oculta fase de solicitação, inicia verificação
  document.getElementById('phaseSolicitacao').classList.add('hidden');
  document.getElementById('phaseReset').classList.remove('hidden');
  verifyToken(urlToken);
} else {
  // Modo Solicitação: já está visível por padrão
  initSolicitacaoMode();
}

/* ================================================================
   MODO SOLICITAÇÃO – CPF → link por e-mail
   ================================================================ */

function initSolicitacaoMode() {
  const cpfInput       = document.getElementById('cpfInput');
  const cpfError       = document.getElementById('cpfError');
  const btnSolicitar   = document.getElementById('btnSolicitar');
  const btnSolLabel    = document.getElementById('btnSolicitarLabel');
  const btnSolSpinner  = document.getElementById('btnSolicitarSpinner');
  const btnReenviar    = document.getElementById('btnReenviar');

  let lastCpf = '';

  cpfInput.addEventListener('input', () => {
    cpfInput.value = cpfMask(cpfInput.value);
    cpfInput.classList.remove('form-input--error');
    cpfError.classList.add('hidden');
    const valid = isCpfValid(cpfInput.value);
    btnSolicitar.disabled = !valid;
  });

  cpfInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !btnSolicitar.disabled) btnSolicitar.click();
  });

  async function enviarLink(cpf) {
    btnSolicitar.disabled = true;
    btnSolLabel.textContent = 'Enviando…';
    btnSolSpinner.classList.remove('hidden');

    try {
      await fetch('/api/auth/password-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: digitsOnly(cpf) }),
      });
      // Sempre avança (sem revelar se CPF existe)
      lastCpf = cpf;
      markDone('prog-s1');
      markActive('prog-s2');
      document.getElementById('stepCpf').classList.add('hidden');
      document.getElementById('stepEmailSent').classList.remove('hidden');
    } catch {
      // Mesmo em erro de rede avança para não revelar informações
      lastCpf = cpf;
      markDone('prog-s1');
      markActive('prog-s2');
      document.getElementById('stepCpf').classList.add('hidden');
      document.getElementById('stepEmailSent').classList.remove('hidden');
    } finally {
      btnSolLabel.textContent = 'Enviar link de recuperação';
      btnSolSpinner.classList.add('hidden');
    }
  }

  btnSolicitar.addEventListener('click', () => {
    const cpf = cpfInput.value;
    if (!isCpfValid(cpf)) {
      cpfInput.classList.add('form-input--error');
      cpfError.textContent = 'Informe um CPF válido.';
      cpfError.classList.remove('hidden');
      return;
    }
    enviarLink(cpf);
  });

  btnReenviar.addEventListener('click', () => {
    if (lastCpf) enviarLink(lastCpf);
  });
}

/* ================================================================
   MODO RESET – verificar token e redefinir senha
   ================================================================ */

async function verifyToken(token) {
  try {
    const r = await fetch('/api/auth/password-recovery/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await r.json().catch(() => ({}));

    if (data.ok) {
      markDone('prog-r1');
      markActive('prog-r2');
      document.getElementById('stepVerifying').classList.add('hidden');
      document.getElementById('stepNewPassword').classList.remove('hidden');
      initPasswordForm(token);
    } else {
      showTokenError(data.error);
    }
  } catch {
    showTokenError(null);
  }
}

function showTokenError(errorCode) {
  document.getElementById('stepVerifying').classList.add('hidden');

  const msgEl = document.getElementById('tokenErrorMsg');
  if (errorCode === 'TOKEN_EXPIRED_OR_USED') {
    msgEl.textContent = 'Este link de recuperação já foi utilizado ou expirou. Solicite um novo link.';
  } else if (errorCode === 'TOKEN_NOT_FOUND') {
    msgEl.textContent = 'Link de recuperação inválido. Verifique se o link está completo ou solicite um novo.';
  } else {
    msgEl.textContent = 'Não foi possível validar o link. Tente novamente ou solicite um novo link.';
  }

  document.getElementById('stepTokenError').classList.remove('hidden');
}

/* ================================================================
   FORMULÁRIO DE NOVA SENHA
   ================================================================ */

function initPasswordForm(token) {
  const passwordInput    = document.getElementById('passwordInput');
  const passwordConfirm  = document.getElementById('passwordConfirm');
  const btnResetPassword = document.getElementById('btnResetPassword');
  const btnResetLabel    = document.getElementById('btnResetLabel');
  const btnResetSpinner  = document.getElementById('btnResetSpinner');
  const confirmError     = document.getElementById('confirmError');
  const pwdApiError      = document.getElementById('pwdApiError');

  const REQS = [
    { id: 'req-length',  test: p => p.length >= 8 },
    { id: 'req-upper',   test: p => /[A-Z]/.test(p) },
    { id: 'req-lower',   test: p => /[a-z]/.test(p) },
    { id: 'req-number',  test: p => /[0-9]/.test(p) },
    { id: 'req-special', test: p => /[^A-Za-z0-9]/.test(p) },
  ];

  function isStrong(p) { return REQS.every(r => r.test(p)); }

  function updateReqs(pwd) {
    let count = 0;
    REQS.forEach(r => {
      const el   = document.getElementById(r.id);
      const icon = el.querySelector('.req-icon');
      const ok   = r.test(pwd);
      if (ok) count++;
      el.classList.toggle('req--ok', ok);
      el.classList.toggle('req--fail', !ok && pwd.length > 0);
      icon.className = 'req-icon ' + (ok ? 'req-icon--ok' : pwd.length > 0 ? 'req-icon--fail' : 'req-icon--neutral');
    });
    return count;
  }

  function updateBar(pwd) {
    const passed = updateReqs(pwd);
    const fill  = document.getElementById('pwdStrengthFill');
    const label = document.getElementById('pwdStrengthLabel');
    const levels = [
      { pct: 0,   color: '',        text: '' },
      { pct: 20,  color: '#ef4444', text: 'Fraca' },
      { pct: 40,  color: '#f97316', text: 'Fraca' },
      { pct: 60,  color: '#eab308', text: 'Média' },
      { pct: 80,  color: '#84cc16', text: 'Boa'   },
      { pct: 100, color: '#22c55e', text: 'Forte' },
    ];
    const lv = levels[pwd.length === 0 ? 0 : passed];
    fill.style.width      = lv.pct + '%';
    fill.style.background = lv.color;
    label.textContent     = lv.text;
    label.style.color     = lv.color;
  }

  function syncBtn() {
    const pwd  = passwordInput.value;
    const conf = passwordConfirm.value;
    btnResetPassword.disabled = !(isStrong(pwd) && pwd === conf && conf.length > 0);
  }

  passwordInput.addEventListener('input', () => {
    updateBar(passwordInput.value);
    if (passwordConfirm.value) {
      const match = passwordInput.value === passwordConfirm.value;
      passwordConfirm.classList.toggle('form-input--error', !match);
      confirmError.classList.toggle('hidden', match);
    }
    pwdApiError.classList.add('hidden');
    syncBtn();
  });

  passwordConfirm.addEventListener('input', () => {
    const match = passwordInput.value === passwordConfirm.value;
    passwordConfirm.classList.toggle('form-input--error', !match && passwordConfirm.value.length > 0);
    confirmError.classList.toggle('hidden', match || !passwordConfirm.value.length);
    pwdApiError.classList.add('hidden');
    syncBtn();
  });

  // Show/hide toggles
  function setupToggle(btnId, showId, hideId, input) {
    document.getElementById(btnId).addEventListener('click', () => {
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      document.getElementById(showId).classList.toggle('hidden', !isText);
      document.getElementById(hideId).classList.toggle('hidden', isText);
    });
  }
  setupToggle('pwdToggle',  'eyeShow',  'eyeHide',  passwordInput);
  setupToggle('pwdToggle2', 'eyeShow2', 'eyeHide2', passwordConfirm);

  btnResetPassword.addEventListener('click', async () => {
    const pwd = passwordInput.value;
    if (!isStrong(pwd) || pwd !== passwordConfirm.value) return;

    btnResetPassword.disabled = true;
    btnResetLabel.textContent = 'Redefinindo…';
    btnResetSpinner.classList.remove('hidden');
    pwdApiError.classList.add('hidden');

    try {
      const r = await fetch('/api/auth/password-recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd }),
      });
      const data = await r.json().catch(() => ({}));

      if (r.ok) {
        document.getElementById('phaseReset').classList.add('hidden');
        document.getElementById('stepSuccess').classList.remove('hidden');
        return;
      }

      if (data.error === 'TOKEN_EXPIRED_OR_USED') {
        pwdApiError.textContent = 'Link expirado. Solicite um novo link de recuperação.';
      } else if (data.error === 'TOKEN_NOT_FOUND') {
        pwdApiError.textContent = 'Link inválido. Solicite um novo link de recuperação.';
      } else if (data.error) {
        pwdApiError.textContent = data.error;
      } else {
        pwdApiError.textContent = 'Erro ao redefinir senha. Tente novamente.';
      }
      pwdApiError.classList.remove('hidden');
    } catch {
      pwdApiError.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
      pwdApiError.classList.remove('hidden');
    } finally {
      if (document.getElementById('stepSuccess').classList.contains('hidden')) {
        btnResetPassword.disabled = false;
        btnResetLabel.textContent = 'Redefinir senha';
        btnResetSpinner.classList.add('hidden');
        syncBtn();
      }
    }
  });

  setTimeout(() => passwordInput.focus(), 100);
}
