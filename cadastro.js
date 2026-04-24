/* ================================================================
   CADASTRO – Registration flow (4 steps)
   Step 1: CPF  →  Step 2: Personal data  →
   Step 3: E-mail code  →  Step 4: Password  →  Success
   ================================================================ */

// ── Header scroll shadow ──────────────────────────────────────────
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

/* ================================================================
   UTILITIES
   ================================================================ */

function cpfMask(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}

function phoneMask(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d{1,4})$/,'$1-$2');
}

function digitsOnly(s) { return s.replace(/\D/g,''); }

function isCpfValid(cpf) {
  const d = digitsOnly(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i=0;i<9;i++) s += +d[i]*(10-i);
  let r = (s*10)%11; if (r===10||r===11) r=0;
  if (r!==+d[9]) return false;
  s=0;
  for (let i=0;i<10;i++) s += +d[i]*(11-i);
  r=(s*10)%11; if (r===10||r===11) r=0;
  return r===+d[10];
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = Math.min(3, local.length);
  return local.slice(0, visible) + '***@' + domain;
}

const SVG_OK = `<svg class="status-icon status-icon--ok" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
const SVG_ERROR = `<svg class="status-icon status-icon--error" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
const SVG_SPIN = `<svg class="status-icon status-icon--spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="40" stroke-dashoffset="10"/></svg>`;

/* ================================================================
   STATE
   ================================================================ */

const state = {
  cpf: '',
  name: '',
  phone: '',
  email: '',
  emailVerified: false,
};

/* ================================================================
   PROGRESS BAR helpers
   ================================================================ */

const DONE_SVG = `<svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M13.293 3.293L6 10.586 2.707 7.293 1.293 8.707l4 4a1 1 0 001.414 0l8-8-1.414-1.414z"/></svg>`;

function markDone(progId) {
  const el = document.getElementById(progId);
  el.classList.remove('reg-progress__step--active');
  el.classList.add('reg-progress__step--done');
  el.querySelector('.reg-progress__dot').innerHTML = DONE_SVG;
}

function markActive(progId) {
  const el = document.getElementById(progId);
  el.classList.add('reg-progress__step--active');
}

function markInactive(progId) {
  const el = document.getElementById(progId);
  el.classList.remove('reg-progress__step--active', 'reg-progress__step--done');
  el.querySelector('.reg-progress__dot').textContent = progId.replace('prog-','');
}

/* ================================================================
   STEP VISIBILITY
   ================================================================ */

function showStep(id) {
  ['step1','step2','step3','step4','stepSuccess'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}

/* ================================================================
   STEP 1 – CPF
   ================================================================ */

const cpfInput   = document.getElementById('cpfInput');
const cpfStatus  = document.getElementById('cpfStatus');
const cpfHint    = document.getElementById('cpfHint');
const btnNext    = document.getElementById('btnNext');

let cpfValidated = false;
let cpfDebounce;

function setCpfState(st, msg) {
  cpfInput.classList.remove('form-input--error','form-input--success');
  cpfHint.style.color = '';
  if (st === 'ok') {
    cpfInput.classList.add('form-input--success');
    cpfStatus.innerHTML = SVG_OK;
    cpfHint.textContent = msg || 'CPF disponível para cadastro.';
    cpfHint.style.color = 'var(--green-600)';
    cpfValidated = true; btnNext.disabled = false;
  } else if (st === 'error') {
    cpfInput.classList.add('form-input--error');
    cpfStatus.innerHTML = SVG_ERROR;
    cpfHint.textContent = msg || 'CPF inválido.';
    cpfHint.style.color = 'var(--red-600)';
    cpfValidated = false; btnNext.disabled = true;
  } else if (st === 'checking') {
    cpfStatus.innerHTML = SVG_SPIN;
    cpfHint.textContent = 'Verificando CPF na plataforma…';
    cpfHint.style.color = 'var(--blue-600)';
    cpfValidated = false; btnNext.disabled = true;
  } else {
    cpfStatus.innerHTML = '';
    cpfHint.textContent = 'Digite apenas números — a formatação é automática.';
    cpfValidated = false; btnNext.disabled = true;
  }
}

cpfInput.addEventListener('input', () => {
  cpfInput.value = cpfMask(cpfInput.value);
  const d = digitsOnly(cpfInput.value);
  clearTimeout(cpfDebounce);
  cpfValidated = false; btnNext.disabled = true;
  if (!d.length) { setCpfState('idle'); return; }
  if (d.length < 11) { setCpfState('idle'); return; }
  if (!isCpfValid(cpfInput.value)) { setCpfState('error','CPF inválido. Verifique os dígitos.'); return; }
  setCpfState('checking');
  cpfDebounce = setTimeout(async () => {
    try {
      const r = await fetch('/api/auth/register/citizen/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: d }),
      });
      const data = await r.json();
      if (data.errors?.cpf === 'CPF_TAKEN') {
        setCpfState('error', 'Este CPF já está cadastrado. Faça login para acessar.');
      } else {
        state.cpf = cpfInput.value;
        setCpfState('ok', 'CPF disponível para cadastro.');
      }
    } catch {
      state.cpf = cpfInput.value;
      setCpfState('ok', 'CPF disponível para cadastro.');
    }
  }, 500);
});

btnNext.addEventListener('click', () => { if (cpfValidated) goToStep2(); });
cpfInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !btnNext.disabled) btnNext.click(); });

function goToStep2() {
  showStep('step2');
  markDone('prog-1');
  markActive('prog-2');
  document.getElementById('cpfConfirmed').innerHTML = `
    ${SVG_OK.replace('status-icon--ok','').replace('status-icon','')}
    CPF verificado: <strong>${state.cpf}</strong>`;
}

/* ================================================================
   STEP 2 – Personal data
   ================================================================ */

const nomeInput     = document.getElementById('nomeInput');
const telefoneInput = document.getElementById('telefoneInput');
const emailInput    = document.getElementById('emailInput');
const termsCheck    = document.getElementById('termsCheck');
const btnSubmit     = document.getElementById('btnSubmit');
const btnSubmitLabel   = document.getElementById('btnSubmitLabel');
const btnSubmitSpinner = document.getElementById('btnSubmitSpinner');

telefoneInput.addEventListener('input', () => { telefoneInput.value = phoneMask(telefoneInput.value); });

function showFieldErr(input, errId, msg) {
  input.classList.add('form-input--error');
  const el = document.getElementById(errId);
  el.textContent = msg; el.classList.remove('hidden');
}

function clearFieldErr(input, errId) {
  input.classList.remove('form-input--error');
  document.getElementById(errId).classList.add('hidden');
}

[nomeInput, telefoneInput, emailInput].forEach(el => {
  el.addEventListener('input', () => el.classList.remove('form-input--error'));
});

function validateStep2() {
  let ok = true;
  const nome = nomeInput.value.trim();
  if (nome.split(' ').filter(Boolean).length < 2) {
    showFieldErr(nomeInput,'nomeError','Informe seu nome completo (nome e sobrenome).'); ok=false;
  } else { clearFieldErr(nomeInput,'nomeError'); }

  const phone = digitsOnly(telefoneInput.value);
  if (phone.length < 10) {
    showFieldErr(telefoneInput,'telefoneError','Informe um telefone válido com DDD.'); ok=false;
  } else { clearFieldErr(telefoneInput,'telefoneError'); }

  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldErr(emailInput,'emailError','Informe um e-mail válido.'); ok=false;
  } else { clearFieldErr(emailInput,'emailError'); }

  if (!termsCheck.checked) {
    ok = false;
    const box = termsCheck.closest('.form-checkbox');
    box.style.color = 'var(--red-600)';
    setTimeout(() => { box.style.color = ''; }, 2000);
  }
  return ok;
}

document.getElementById('btnBack2').addEventListener('click', () => {
  showStep('step1');
  markInactive('prog-2');
  markActive('prog-1');
  document.getElementById('prog-1').querySelector('.reg-progress__dot').textContent = '1';
});

btnSubmit.addEventListener('click', async () => {
  if (!validateStep2()) return;

  state.name  = nomeInput.value.trim();
  state.phone = telefoneInput.value.trim();
  state.email = emailInput.value.trim();

  btnSubmit.disabled = true;
  btnSubmitLabel.textContent = 'Enviando código…';
  btnSubmitSpinner.classList.remove('hidden');

  try {
    const r = await fetch('/api/auth/email-verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.email, cpf: digitsOnly(state.cpf) }),
    });
    const data = await r.json();

    if (!r.ok) {
      if (data.error === 'EMAIL_TAKEN') {
        showFieldErr(emailInput,'emailError','Este e-mail já está cadastrado. Faça login para acessar.');
      } else {
        showFieldErr(emailInput,'emailError','Erro ao enviar o código. Tente novamente.');
      }
      return;
    }

    // Show dev code if SMTP not configured
    if (data.devCode) {
      document.getElementById('devCodeValue').textContent = data.devCode;
      document.getElementById('devCodeBanner').classList.remove('hidden');
    } else {
      document.getElementById('devCodeBanner').classList.add('hidden');
    }

    goToStep3(data.expiresIn || 300);
  } catch {
    showFieldErr(emailInput,'emailError','Erro de conexão. Tente novamente.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmitLabel.textContent = 'Verificar e-mail';
    btnSubmitSpinner.classList.add('hidden');
  }
});

/* ================================================================
   STEP 3 – E-mail code verification
   ================================================================ */

const codeDigits    = Array.from(document.querySelectorAll('.code-digit'));
const btnVerifyCode = document.getElementById('btnVerifyCode');
const btnVerifyLabel   = document.getElementById('btnVerifyLabel');
const btnVerifySpinner = document.getElementById('btnVerifySpinner');
const codeError     = document.getElementById('codeError');
const btnResend     = document.getElementById('btnResend');
const resendCountdown = document.getElementById('resendCountdown');

let countdownTimer = null;

function getCode() { return codeDigits.map(d => d.value).join(''); }

function setCodeError(msg) {
  codeDigits.forEach(d => d.classList.add('code-digit--error'));
  codeError.textContent = msg;
  codeError.classList.remove('hidden');
  setTimeout(() => codeDigits.forEach(d => d.classList.remove('code-digit--error')), 600);
}

function clearCodeError() {
  codeDigits.forEach(d => d.classList.remove('code-digit--error'));
  codeError.classList.add('hidden');
}

function updateVerifyBtn() {
  btnVerifyCode.disabled = getCode().length < 6;
}

// Segmented input behavior
codeDigits.forEach((input, idx) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      if (input.value) {
        input.value = '';
        input.classList.remove('code-digit--filled');
        updateVerifyBtn();
      } else if (idx > 0) {
        codeDigits[idx-1].focus();
        codeDigits[idx-1].value = '';
        codeDigits[idx-1].classList.remove('code-digit--filled');
        updateVerifyBtn();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      codeDigits[idx-1].focus(); e.preventDefault();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      codeDigits[idx+1].focus(); e.preventDefault();
    } else if (e.key === 'Enter' && !btnVerifyCode.disabled) {
      btnVerifyCode.click();
    }
  });

  input.addEventListener('input', () => {
    const val = input.value.replace(/\D/g,'');
    input.value = val ? val[val.length-1] : '';
    input.classList.toggle('code-digit--filled', !!input.value);
    clearCodeError();
    if (input.value && idx < 5) codeDigits[idx+1].focus();
    updateVerifyBtn();
  });

  // Handle paste on any digit
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
    pasted.slice(0, 6).split('').forEach((ch, i) => {
      if (codeDigits[i]) {
        codeDigits[i].value = ch;
        codeDigits[i].classList.add('code-digit--filled');
      }
    });
    const next = Math.min(pasted.length, 5);
    codeDigits[next].focus();
    updateVerifyBtn();
  });
});

function startCountdown(seconds) {
  clearInterval(countdownTimer);
  btnResend.classList.add('hidden');
  resendCountdown.textContent = '';

  let remaining = seconds;
  function tick() {
    const m = String(Math.floor(remaining / 60)).padStart(2,'0');
    const s = String(remaining % 60).padStart(2,'0');
    resendCountdown.textContent = `Reenviar em ${m}:${s}`;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      resendCountdown.textContent = '';
      btnResend.classList.remove('hidden');
    }
    remaining--;
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function resetCodeInputs() {
  codeDigits.forEach(d => { d.value=''; d.classList.remove('code-digit--filled','code-digit--error'); });
  clearCodeError();
  updateVerifyBtn();
  codeDigits[0].focus();
}

async function sendVerifyCode() {
  try {
    const r = await fetch('/api/auth/email-verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.email }),
    });
    const data = await r.json();
    if (data.devCode) {
      document.getElementById('devCodeValue').textContent = data.devCode;
      document.getElementById('devCodeBanner').classList.remove('hidden');
    }
    startCountdown(data.expiresIn || 300);
    resetCodeInputs();
  } catch {
    // silent – let the user retry
  }
}

btnResend.addEventListener('click', () => {
  btnResend.classList.add('hidden');
  sendVerifyCode();
});

btnVerifyCode.addEventListener('click', async () => {
  const code = getCode();
  if (code.length < 6) return;

  btnVerifyCode.disabled = true;
  btnVerifyLabel.textContent = 'Verificando…';
  btnVerifySpinner.classList.remove('hidden');

  try {
    const r = await fetch('/api/auth/email-verify/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.email, code }),
    });
    const data = await r.json();

    if (data.ok) {
      state.emailVerified = true;
      clearInterval(countdownTimer);
      goToStep4();
    } else if (data.error === 'CODE_EXPIRED') {
      setCodeError('Código expirado. Clique em "Reenviar código".');
      clearInterval(countdownTimer);
      resendCountdown.textContent = '';
      btnResend.classList.remove('hidden');
    } else if (data.error === 'TOO_MANY_ATTEMPTS') {
      setCodeError('Muitas tentativas incorretas. Solicite um novo código.');
      clearInterval(countdownTimer);
      resendCountdown.textContent = '';
      btnResend.classList.remove('hidden');
    } else {
      const left = data.attemptsLeft ?? '';
      setCodeError(`Código incorreto.${left ? ` ${left} tentativa(s) restante(s).` : ''}`);
    }
  } catch {
    setCodeError('Erro de conexão. Tente novamente.');
  } finally {
    btnVerifyCode.disabled = false;
    btnVerifyLabel.textContent = 'Verificar código';
    btnVerifySpinner.classList.add('hidden');
    if (!state.emailVerified) updateVerifyBtn();
  }
});

document.getElementById('btnBack3').addEventListener('click', () => {
  clearInterval(countdownTimer);
  showStep('step2');
  markInactive('prog-3');
  markActive('prog-2');
  document.getElementById('prog-2').querySelector('.reg-progress__dot').textContent = '2';
});

function goToStep3(expiresIn) {
  showStep('step3');
  markDone('prog-2');
  markActive('prog-3');
  document.getElementById('emailMasked').textContent = maskEmail(state.email);
  resetCodeInputs();
  startCountdown(expiresIn);
}

/* ================================================================
   STEP 4 – Password creation
   ================================================================ */

const passwordInput   = document.getElementById('passwordInput');
const passwordConfirm = document.getElementById('passwordConfirm');
const btnFinish       = document.getElementById('btnFinish');
const btnFinishLabel  = document.getElementById('btnFinishLabel');
const btnFinishSpinner= document.getElementById('btnFinishSpinner');
const confirmError    = document.getElementById('confirmError');
const pwdApiError     = document.getElementById('pwdApiError');

// Requirements
const REQS = [
  { id: 'req-length',  test: p => p.length >= 8 },
  { id: 'req-upper',   test: p => /[A-Z]/.test(p) },
  { id: 'req-lower',   test: p => /[a-z]/.test(p) },
  { id: 'req-number',  test: p => /[0-9]/.test(p) },
  { id: 'req-special', test: p => /[^A-Za-z0-9]/.test(p) },
];

function isPasswordStrong(p) { return REQS.every(r => r.test(p)); }

function updateRequirements(pwd) {
  let passedCount = 0;
  REQS.forEach(r => {
    const el = document.getElementById(r.id);
    const icon = el.querySelector('.req-icon');
    const ok = r.test(pwd);
    if (ok) passedCount++;
    el.classList.toggle('req--ok', ok);
    el.classList.toggle('req--fail', !ok && pwd.length > 0);
    icon.className = 'req-icon ' + (ok ? 'req-icon--ok' : (pwd.length > 0 ? 'req-icon--fail' : 'req-icon--neutral'));
  });
  return passedCount;
}

function updateStrengthBar(pwd) {
  const passed = updateRequirements(pwd);
  const fill = document.getElementById('pwdStrengthFill');
  const label = document.getElementById('pwdStrengthLabel');

  const levels = [
    { pct: 0,   color: '',          text: '' },
    { pct: 20,  color: '#ef4444',   text: 'Fraca' },
    { pct: 40,  color: '#f97316',   text: 'Fraca' },
    { pct: 60,  color: '#eab308',   text: 'Média' },
    { pct: 80,  color: '#84cc16',   text: 'Boa' },
    { pct: 100, color: '#22c55e',   text: 'Forte' },
  ];

  const lv = levels[pwd.length === 0 ? 0 : passed];
  fill.style.width = lv.pct + '%';
  fill.style.background = lv.color;
  label.textContent = lv.text;
  label.style.color = lv.color;
}

function validatePasswords() {
  const pwd = passwordInput.value;
  const conf = passwordConfirm.value;
  const strong = isPasswordStrong(pwd);
  const match  = pwd === conf && conf.length > 0;
  btnFinish.disabled = !(strong && match);
}

passwordInput.addEventListener('input', () => {
  const pwd = passwordInput.value;
  updateStrengthBar(pwd);
  if (passwordConfirm.value) {
    const match = pwd === passwordConfirm.value;
    passwordConfirm.classList.toggle('form-input--error', !match);
    confirmError.classList.toggle('hidden', match);
  }
  pwdApiError.classList.add('hidden');
  validatePasswords();
});

passwordConfirm.addEventListener('input', () => {
  const match = passwordInput.value === passwordConfirm.value;
  passwordConfirm.classList.toggle('form-input--error', !match && passwordConfirm.value.length > 0);
  confirmError.classList.toggle('hidden', match || !passwordConfirm.value.length);
  pwdApiError.classList.add('hidden');
  validatePasswords();
});

// Show/hide toggles
function setupPasswordToggle(btnId, eyeShowId, eyeHideId, inputEl) {
  document.getElementById(btnId).addEventListener('click', () => {
    const isText = inputEl.type === 'text';
    inputEl.type = isText ? 'password' : 'text';
    document.getElementById(eyeShowId).classList.toggle('hidden', !isText);
    document.getElementById(eyeHideId).classList.toggle('hidden', isText);
  });
}

setupPasswordToggle('pwdToggle',  'eyeShow',  'eyeHide',  passwordInput);
setupPasswordToggle('pwdToggle2', 'eyeShow2', 'eyeHide2', passwordConfirm);

btnFinish.addEventListener('click', async () => {
  const pwd = passwordInput.value;
  if (!isPasswordStrong(pwd)) return;
  if (pwd !== passwordConfirm.value) return;

  btnFinish.disabled = true;
  btnFinishLabel.textContent = 'Criando conta…';
  btnFinishSpinner.classList.remove('hidden');
  pwdApiError.classList.add('hidden');

  try {
    const r = await fetch('/api/auth/register/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        cpf: digitsOnly(state.cpf),
        name: state.name,
        phone: state.phone,
        email: state.email,
        password: pwd,
      }),
    });
    const data = await r.json();

    if (r.status === 201) {
      goToSuccess();
    } else if (r.status === 403 && data.error === 'EMAIL_NOT_VERIFIED') {
      pwdApiError.textContent = 'E-mail não verificado. Volte e reenvie o código.';
      pwdApiError.classList.remove('hidden');
    } else if (r.status === 409) {
      pwdApiError.textContent = data.error === 'CPF_TAKEN'
        ? 'Este CPF já está cadastrado.' : 'Este e-mail já está cadastrado.';
      pwdApiError.classList.remove('hidden');
    } else if (data.errors?.password) {
      pwdApiError.textContent = 'Senha não atende aos requisitos mínimos.';
      pwdApiError.classList.remove('hidden');
    } else {
      pwdApiError.textContent = 'Erro ao criar conta. Tente novamente.';
      pwdApiError.classList.remove('hidden');
    }
  } catch {
    pwdApiError.textContent = 'Erro de conexão. Tente novamente.';
    pwdApiError.classList.remove('hidden');
  } finally {
    if (!document.getElementById('stepSuccess').classList.contains('hidden') === false) {
      btnFinish.disabled = false;
      btnFinishLabel.textContent = 'Criar minha conta';
      btnFinishSpinner.classList.add('hidden');
      validatePasswords();
    }
  }
});

function goToStep4() {
  showStep('step4');
  markDone('prog-3');
  markActive('prog-4');
  // Reset password fields
  passwordInput.value = '';
  passwordConfirm.value = '';
  updateStrengthBar('');
  REQS.forEach(r => {
    const el = document.getElementById(r.id);
    el.classList.remove('req--ok','req--fail');
    el.querySelector('.req-icon').className = 'req-icon req-icon--neutral';
  });
  confirmError.classList.add('hidden');
  pwdApiError.classList.add('hidden');
  btnFinish.disabled = true;
  setTimeout(() => passwordInput.focus(), 100);
}

/* ================================================================
   SUCCESS
   ================================================================ */

function goToSuccess() {
  showStep('stepSuccess');
  markDone('prog-4');
}
