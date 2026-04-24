/* ================================================================
   CADASTRO FORNECEDOR – Script
   Etapas: 1-Identificação | 2-Endereço | 3-Bancário |
           4-Representante | 5-Segmentos | 6-Documentos
   ================================================================ */

'use strict';

/* ── Dados estáticos ── */

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '041', name: 'Banrisul' },
  { code: '070', name: 'BRB – Banco de Brasília' },
  { code: '077', name: 'Banco Inter' },
  { code: '085', name: 'Ailos' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '136', name: 'Unicred' },
  { code: '197', name: 'Stone Pagamentos' },
  { code: '208', name: 'BTG Pactual' },
  { code: '212', name: 'Banco Original' },
  { code: '237', name: 'Bradesco' },
  { code: '260', name: 'Nubank' },
  { code: '290', name: 'PagBank (PagSeguro)' },
  { code: '318', name: 'BMG' },
  { code: '323', name: 'Mercado Pago' },
  { code: '335', name: 'Banco Digio' },
  { code: '336', name: 'Banco C6' },
  { code: '341', name: 'Itaú Unibanco' },
  { code: '389', name: 'Mercantil do Brasil' },
  { code: '422', name: 'Banco Safra' },
  { code: '604', name: 'Banco Industrial' },
  { code: '633', name: 'Banco Rendimento' },
  { code: '655', name: 'Votorantim' },
  { code: '707', name: 'Daycoval' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Sicoob (Bancoob)' },
];

const SEGMENTS = [
  { id: 1,  name: 'Tecnologia da Informação e Software',    cnae: 'CNAE 62.01-5' },
  { id: 2,  name: 'Obras e Serviços de Engenharia Civil',   cnae: 'CNAE 41.20-4' },
  { id: 3,  name: 'Material de Escritório e Papelaria',     cnae: 'CNAE 47.61-0' },
  { id: 4,  name: 'Equipamentos e Mobiliário',              cnae: 'CNAE 31.00-1' },
  { id: 5,  name: 'Serviços de Limpeza e Conservação',      cnae: 'CNAE 81.21-4' },
  { id: 6,  name: 'Serviços de Segurança e Vigilância',     cnae: 'CNAE 80.11-1' },
  { id: 7,  name: 'Saúde – Medicamentos e Farmácia',        cnae: 'CNAE 47.71-7' },
  { id: 8,  name: 'Saúde – Equipamentos Médicos',           cnae: 'CNAE 33.41-5' },
  { id: 9,  name: 'Alimentação e Nutrição',                 cnae: 'CNAE 47.12-1' },
  { id: 10, name: 'Consultoria e Assessoria Técnica',       cnae: 'CNAE 70.20-4' },
  { id: 11, name: 'Transporte e Logística',                 cnae: 'CNAE 49.30-2' },
  { id: 12, name: 'Combustíveis e Lubrificantes',           cnae: 'CNAE 47.31-8' },
  { id: 13, name: 'Serviços Gráficos e Impressão',          cnae: 'CNAE 18.13-0' },
  { id: 14, name: 'Material Elétrico e Eletrônico',         cnae: 'CNAE 47.42-3' },
  { id: 15, name: 'Material Hidráulico e Sanitário',        cnae: 'CNAE 47.44-0' },
  { id: 16, name: 'Uniformes e Equipamentos de Proteção',   cnae: 'CNAE 14.12-6' },
  { id: 17, name: 'Capacitação e Treinamento',              cnae: 'CNAE 85.99-6' },
  { id: 18, name: 'Publicidade e Marketing',                cnae: 'CNAE 73.11-4' },
  { id: 19, name: 'Serviços Médicos e Ambulatoriais',       cnae: 'CNAE 86.30-5' },
  { id: 20, name: 'Agricultura e Pecuária',                 cnae: 'CNAE 01.11-3' },
  { id: 21, name: 'Serviços Jurídicos e Advocatícios',      cnae: 'CNAE 69.11-7' },
  { id: 22, name: 'Telecomunicações',                       cnae: 'CNAE 61.10-8' },
  { id: 23, name: 'Manutenção Predial e Reformas',          cnae: 'CNAE 43.29-1' },
  { id: 24, name: 'Veículos, Máquinas e Peças',             cnae: 'CNAE 45.11-1' },
];

const DOCUMENTS = [
  { id: 'contrato-social', name: 'Contrato Social / Estatuto / CCMEI', required: true,  desc: 'Última alteração consolidada ou CCMEI (MEI)' },
  { id: 'cartao-cnpj',     name: 'Cartão CNPJ',                         required: true,  desc: 'Emitido nos últimos 30 dias (Receita Federal)' },
  { id: 'cnd-federal',     name: 'Certidão de Débitos Federais (CND)',   required: true,  desc: 'Certidão Negativa ou Positiva com efeitos de negativa' },
  { id: 'cnd-estadual',    name: 'Certidão Negativa Estadual',           required: true,  desc: 'Certidão de regularidade fiscal estadual' },
  { id: 'cnd-municipal',   name: 'Certidão Negativa Municipal (ISS)',    required: true,  desc: 'Certidão de regularidade fiscal do município sede' },
  { id: 'fgts',            name: 'Certificado de Regularidade do FGTS',  required: true,  desc: 'CRF emitido pela Caixa Econômica Federal' },
  { id: 'cndt',            name: 'Certidão Neg. Débitos Trabalhistas',   required: true,  desc: 'CNDT emitida pelo TST (tst.jus.br)' },
  { id: 'balanco',         name: 'Balanço Patrimonial',                  required: false, desc: 'Último exercício social (com assinatura do contador)' },
  { id: 'atestado',        name: 'Atestado de Capacidade Técnica',       required: false, desc: 'Emitido por pessoa jurídica de direito público ou privado' },
];

/* ── Estado ── */
let currentStep = 1;
const TOTAL_STEPS = 6;
const selectedSegments = new Set();
const uploadedDocs = {};

/* ── DOM helpers ── */
const $ = id => document.getElementById(id);

function show(el)  { el && el.classList.remove('hidden'); }
function hide(el)  { el && el.classList.add('hidden'); }

function setError(inputEl, errEl, msg) {
  if (inputEl) inputEl.classList.add('form-input--error');
  if (errEl)   { errEl.textContent = msg; show(errEl); }
}

function clearError(inputEl, errEl) {
  if (inputEl) inputEl.classList.remove('form-input--error');
  if (errEl)   hide(errEl);
}

/* ── Progress helpers ── */
function updateProgress(step) {
  const fill  = $('fcProgressFill');
  const label = $('fcProgressLabel');
  if (fill)  fill.style.width = ((step / TOTAL_STEPS) * 100) + '%';
  if (label) label.textContent = `Etapa ${step} de ${TOTAL_STEPS}`;
}

function updateStepper(step) {
  document.querySelectorAll('.fc-step-item').forEach(li => {
    const s = parseInt(li.dataset.step, 10);
    li.classList.remove('fc-step-item--active', 'fc-step-item--done', 'fc-step-item--pending');
    if (s < step)  li.classList.add('fc-step-item--done');
    else if (s === step) li.classList.add('fc-step-item--active');
    else li.classList.add('fc-step-item--pending');

    const circle = li.querySelector('.fc-step-item__circle');
    if (circle) {
      if (s < step) {
        circle.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" style="width:13px;height:13px"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
      } else {
        circle.textContent = s;
      }
    }
  });
}

function goToStep(step) {
  hide($(`fcPanel${currentStep}`));
  currentStep = step;
  show($(`fcPanel${currentStep}`));
  updateProgress(currentStep);
  updateStepper(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────────────────────────────────────
   MÁSCARAS
───────────────────────────────────────── */
function maskCNPJ(v) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskCPF(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCEP(v) {
  return v.replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function maskCPForCNPJ(v) {
  const d = v.replace(/\D/g, '');
  if (d.length <= 11) return maskCPF(d);
  return maskCNPJ(d);
}

/* ─────────────────────────────────────────
   VALIDAÇÕES
───────────────────────────────────────── */
function isEmailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isCNPJValid(v)  {
  const d = v.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  const calc = (n, len) => {
    let s = 0, pos = len - 7;
    for (let i = len; i >= 1; i--) {
      s += parseInt(d.charAt(len - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    return s % 11 < 2 ? 0 : 11 - (s % 11);
  };
  return calc(d, 12) === parseInt(d.charAt(12), 10) &&
         calc(d, 13) === parseInt(d.charAt(13), 10);
}
function isCPFValid(v) {
  const d = v.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const r = (s, n) => {
    let t = 0;
    for (let i = 0; i < s; i++) t += parseInt(d.charAt(i)) * (s + 1 - i);
    const rem = (t * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };
  return r(9, 10) === parseInt(d.charAt(9)) && r(10, 11) === parseInt(d.charAt(10));
}
function isPhoneValid(v) {
  return v.replace(/\D/g, '').length >= 10;
}

/* ─────────────────────────────────────────
   STEP 1 – Identificação
───────────────────────────────────────── */
function validateStep1() {
  let ok = true;

  const cnpjEl   = $('cnpj');
  const razaoEl  = $('razaoSocial');
  const porteEl  = $('porte');
  const telEl    = $('telefoneEmpresa');
  const emailEl  = $('emailEmpresa');
  const dataEl   = $('dataAbertura');

  clearError(cnpjEl,  $('cnpjError'));
  clearError(razaoEl, $('razaoSocialError'));
  clearError(porteEl, $('porteError'));
  clearError(telEl,   $('telefoneEmpresaError'));
  clearError(emailEl, $('emailEmpresaError'));

  if (!isCNPJValid(cnpjEl.value)) {
    setError(cnpjEl, $('cnpjError'), 'Informe um CNPJ válido.');
    ok = false;
  }
  if (!razaoEl.value.trim()) {
    setError(razaoEl, $('razaoSocialError'), 'Informe a razão social.');
    ok = false;
  }
  if (!porteEl.value) {
    setError(porteEl, $('porteError'), 'Selecione o porte da empresa.');
    ok = false;
  }
  if (!isPhoneValid(telEl.value)) {
    setError(telEl, $('telefoneEmpresaError'), 'Informe um telefone válido.');
    ok = false;
  }
  if (!isEmailValid(emailEl.value.trim())) {
    setError(emailEl, $('emailEmpresaError'), 'Informe um e-mail válido.');
    ok = false;
  }
  if (!dataEl.value) {
    dataEl.classList.add('form-input--error');
    ok = false;
  } else {
    dataEl.classList.remove('form-input--error');
  }

  return ok;
}

/* ─────────────────────────────────────────
   STEP 2 – Endereço
───────────────────────────────────────── */
async function buscarCEP(cep) {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!r.ok) return null;
    const data = await r.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

function validateStep2() {
  let ok = true;
  const fields = [
    ['cep',        'cepError',        'Informe um CEP válido.'],
    ['logradouro', 'logradouroError', 'Informe o logradouro.'],
    ['numero',     'numeroError',     'Informe o número.'],
    ['bairro',     'bairroError',     'Informe o bairro.'],
    ['municipio',  'municipioError',  'Informe o município.'],
    ['uf',         'ufError',         'Selecione o estado.'],
  ];
  fields.forEach(([id, errId, msg]) => {
    const el = $(id);
    clearError(el, $(errId));
    if (!el || !el.value.trim()) {
      setError(el, $(errId), msg);
      ok = false;
    }
  });
  return ok;
}

/* ─────────────────────────────────────────
   STEP 3 – Dados bancários
───────────────────────────────────────── */
function validateStep3() {
  let ok = true;
  const banco      = $('banco');
  const agencia    = $('agencia');
  const conta      = $('conta');
  const titular    = $('titularConta');
  const cpfCnpj    = $('cpfCnpjTitular');

  [['banco', 'bancoError'], ['agencia', 'agenciaError'], ['conta', 'contaError'],
   ['titularConta', 'titularContaError']].forEach(([id, errId]) => {
    const el = $(id);
    clearError(el, $(errId));
    if (el && !el.value.trim()) {
      setError(el, $(errId), 'Campo obrigatório.');
      ok = false;
    }
  });

  clearError(cpfCnpj, $('cpfCnpjTitularError'));
  const raw = cpfCnpj?.value.replace(/\D/g, '') || '';
  if (raw.length !== 11 && raw.length !== 14) {
    setError(cpfCnpj, $('cpfCnpjTitularError'), 'Informe CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
    ok = false;
  }

  return ok;
}

/* ─────────────────────────────────────────
   STEP 4 – Representante legal
───────────────────────────────────────── */
function validateStep4() {
  let ok = true;
  const fields = [
    ['repNome',     'repNomeError',     'Informe o nome completo.'],
    ['repCargo',    'repCargoError',    'Informe o cargo/função.'],
  ];
  fields.forEach(([id, errId, msg]) => {
    const el = $(id);
    clearError(el, $(errId));
    if (!el?.value.trim()) { setError(el, $(errId), msg); ok = false; }
  });

  const cpfEl = $('repCpf');
  clearError(cpfEl, $('repCpfError'));
  if (!isCPFValid(cpfEl?.value || '')) {
    setError(cpfEl, $('repCpfError'), 'Informe um CPF válido.');
    ok = false;
  }

  const telEl = $('repTelefone');
  clearError(telEl, $('repTelefoneError'));
  if (!isPhoneValid(telEl?.value || '')) {
    setError(telEl, $('repTelefoneError'), 'Informe um telefone válido.');
    ok = false;
  }

  const emailEl = $('repEmail');
  clearError(emailEl, $('repEmailError'));
  if (!isEmailValid(emailEl?.value.trim() || '')) {
    setError(emailEl, $('repEmailError'), 'Informe um e-mail válido.');
    ok = false;
  }

  const nascEl = $('repNasc');
  if (!nascEl?.value) {
    nascEl?.classList.add('form-input--error');
    ok = false;
  } else {
    nascEl?.classList.remove('form-input--error');
  }

  return ok;
}

/* ─────────────────────────────────────────
   STEP 5 – Segmentos
───────────────────────────────────────── */
function validateStep5() {
  const errEl = $('segmentoError');
  if (selectedSegments.size === 0) {
    show(errEl);
    return false;
  }
  hide(errEl);
  return true;
}

/* ─────────────────────────────────────────
   BANK SELECT – populate
───────────────────────────────────────── */
function populateBanks() {
  const sel = $('banco');
  if (!sel) return;
  BANKS.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.code;
    opt.textContent = `${b.code} – ${b.name}`;
    sel.appendChild(opt);
  });
}

/* ─────────────────────────────────────────
   SEGMENTS – render & search
───────────────────────────────────────── */
function renderSegments(filter = '') {
  const grid = $('fcSegmentsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const q = filter.toLowerCase();
  SEGMENTS.forEach(seg => {
    const matches = !q || seg.name.toLowerCase().includes(q) || seg.cnae.toLowerCase().includes(q);
    const item = document.createElement('label');
    item.className = 'fc-seg-item' + (selectedSegments.has(seg.id) ? ' selected' : '') + (matches ? '' : ' hidden-seg');
    item.dataset.id = seg.id;
    item.innerHTML = `
      <input type="checkbox" ${selectedSegments.has(seg.id) ? 'checked' : ''} />
      <div class="fc-seg-item__check"></div>
      <div class="fc-seg-item__text">
        <span class="fc-seg-item__name">${seg.name}</span>
        <span class="fc-seg-item__cnae">${seg.cnae}</span>
      </div>`;
    item.addEventListener('click', () => toggleSegment(seg.id, item));
    grid.appendChild(item);
  });
}

function toggleSegment(id, itemEl) {
  if (selectedSegments.has(id)) {
    selectedSegments.delete(id);
    itemEl.classList.remove('selected');
    itemEl.querySelector('input').checked = false;
  } else {
    selectedSegments.add(id);
    itemEl.classList.add('selected');
    itemEl.querySelector('input').checked = true;
  }
  renderSelectedTags();
}

function renderSelectedTags() {
  const wrap = $('fcSelectedSegs');
  const tagsEl = $('fcSelectedTags');
  if (!wrap || !tagsEl) return;
  tagsEl.innerHTML = '';
  if (selectedSegments.size === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  selectedSegments.forEach(id => {
    const seg = SEGMENTS.find(s => s.id === id);
    if (!seg) return;
    const tag = document.createElement('span');
    tag.className = 'fc-tag';
    tag.innerHTML = `${seg.name}<button type="button" class="fc-tag__remove" aria-label="Remover ${seg.name}"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></button>`;
    tag.querySelector('.fc-tag__remove').addEventListener('click', () => {
      selectedSegments.delete(id);
      renderSegments($('segSearch')?.value || '');
      renderSelectedTags();
    });
    tagsEl.appendChild(tag);
  });
}

/* ─────────────────────────────────────────
   DOCUMENTS – render
───────────────────────────────────────── */
function renderDocuments() {
  const list = $('fcDocsList');
  if (!list) return;
  list.innerHTML = '';
  DOCUMENTS.forEach(doc => {
    const item = document.createElement('div');
    item.className = 'fc-doc-item';
    item.id = `docItem_${doc.id}`;
    item.innerHTML = `
      <div class="fc-doc-item__status">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
      </div>
      <div class="fc-doc-item__body">
        <div class="fc-doc-item__name">
          ${doc.name}
          <span class="fc-doc-item__req ${doc.required ? 'fc-doc-item__req--required' : 'fc-doc-item__req--optional'}">${doc.required ? 'Obrigatório' : 'Facultativo'}</span>
        </div>
        <p class="fc-doc-item__desc">${doc.desc}</p>
        <p class="fc-doc-item__filename" id="docFilename_${doc.id}"></p>
      </div>
      <div class="fc-doc-item__actions">
        <label class="fc-doc-upload-btn" for="docInput_${doc.id}">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
          <span id="docBtnLabel_${doc.id}">Enviar</span>
        </label>
        <input type="file" class="fc-doc-input" id="docInput_${doc.id}" accept=".pdf,.jpg,.jpeg,.png" data-docid="${doc.id}" />
      </div>`;
    list.appendChild(item);

    const input = item.querySelector(`#docInput_${doc.id}`);
    input.addEventListener('change', e => handleDocUpload(e, doc.id));
  });
}

function handleDocUpload(e, docId) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert('Arquivo muito grande. O tamanho máximo permitido é 10 MB.');
    return;
  }
  uploadedDocs[docId] = file.name;
  const item     = $(`docItem_${docId}`);
  const filename = $(`docFilename_${docId}`);
  const btnLabel = $(`docBtnLabel_${docId}`);
  if (item)     item.classList.add('uploaded');
  if (filename) filename.textContent = file.name;
  if (btnLabel) btnLabel.textContent = 'Substituir';

  const statusIcon = item?.querySelector('.fc-doc-item__status svg');
  if (statusIcon) {
    statusIcon.innerHTML = '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>';
  }
}

/* ─────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────── */

/* ── STEP 1 ── */
const cnpjInput = $('cnpj');
if (cnpjInput) cnpjInput.addEventListener('input', e => {
  e.target.value = maskCNPJ(e.target.value);
  clearError(cnpjInput, $('cnpjError'));
});

const telEmpInput = $('telefoneEmpresa');
if (telEmpInput) telEmpInput.addEventListener('input', e => {
  e.target.value = maskPhone(e.target.value);
  clearError(telEmpInput, $('telefoneEmpresaError'));
});

// Tipo de pessoa toggle
document.querySelectorAll('input[name="tipoPessoa"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.fc-toggle-opt').forEach(opt => {
      const r = opt.querySelector('input[name="tipoPessoa"]');
      if (r) opt.classList.toggle('fc-toggle-opt--active', r.checked);
    });
  });
});

// IE isento
const ieCheck = $('ieIsento');
if (ieCheck) ieCheck.addEventListener('change', () => {
  const ie = $('inscricaoEstadual');
  if (ie) { ie.value = ''; ie.disabled = ieCheck.checked; }
});
const imCheck = $('imIsento');
if (imCheck) imCheck.addEventListener('change', () => {
  const im = $('inscricaoMunicipal');
  if (im) { im.value = ''; im.disabled = imCheck.checked; }
});

const fcNext1 = $('fcNext1');
if (fcNext1) fcNext1.addEventListener('click', () => {
  if (validateStep1()) goToStep(2);
});

/* ── STEP 2 ── */
const cepInput = $('cep');
if (cepInput) cepInput.addEventListener('input', e => {
  e.target.value = maskCEP(e.target.value);
  clearError(cepInput, $('cepError'));
});

const btnBuscarCep = $('btnBuscarCep');
if (btnBuscarCep) btnBuscarCep.addEventListener('click', async () => {
  const cepVal   = cepInput?.value || '';
  const spinner  = $('cepSpinner');
  const label    = $('cepBtnLabel');
  if (cepVal.replace(/\D/g, '').length < 8) {
    setError(cepInput, $('cepError'), 'Digite um CEP completo (8 dígitos).');
    return;
  }
  if (label)  label.textContent = '…';
  if (spinner) show(spinner);
  btnBuscarCep.disabled = true;

  const data = await buscarCEP(cepVal);

  if (label)  label.textContent = 'Buscar';
  if (spinner) hide(spinner);
  btnBuscarCep.disabled = false;

  if (!data) {
    setError(cepInput, $('cepError'), 'CEP não encontrado. Verifique e tente novamente.');
    return;
  }
  clearError(cepInput, $('cepError'));

  const fill = (id, val) => { const el = $(id); if (el) el.value = val || ''; };
  fill('logradouro', data.logradouro);
  fill('bairro',     data.bairro);
  fill('municipio',  data.localidade);
  const uf = $('uf');
  if (uf && data.uf) uf.value = data.uf;
  $('numero')?.focus();
});

// Also auto-search when 8 digits complete
if (cepInput) cepInput.addEventListener('input', () => {
  if (cepInput.value.replace(/\D/g, '').length === 8) {
    btnBuscarCep?.click();
  }
});

const fcPrev2 = $('fcPrev2');
const fcNext2 = $('fcNext2');
if (fcPrev2) fcPrev2.addEventListener('click', () => goToStep(1));
if (fcNext2) fcNext2.addEventListener('click', () => {
  if (validateStep2()) goToStep(3);
});

/* ── STEP 3 ── */
const cpfCnpjInput = $('cpfCnpjTitular');
if (cpfCnpjInput) cpfCnpjInput.addEventListener('input', e => {
  e.target.value = maskCPForCNPJ(e.target.value);
  clearError(cpfCnpjInput, $('cpfCnpjTitularError'));
});

const agenciaSemDigito = $('agenciaSemDigito');
if (agenciaSemDigito) agenciaSemDigito.addEventListener('change', () => {
  const dEl = $('agenciaDigito');
  if (dEl) { dEl.disabled = agenciaSemDigito.checked; dEl.value = ''; }
});

const pixTipo = $('pixTipo');
if (pixTipo) pixTipo.addEventListener('change', () => {
  const grp = $('pixValorGroup');
  if (grp) grp.style.display = pixTipo.value ? '' : 'none';
});

// Tipo de conta toggle
document.querySelectorAll('input[name="tipoConta"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.fc-toggle-opt').forEach(opt => {
      const r = opt.querySelector('input[name="tipoConta"]');
      if (r) opt.classList.toggle('fc-toggle-opt--active', r.checked);
    });
  });
});

const fcPrev3 = $('fcPrev3');
const fcNext3 = $('fcNext3');
if (fcPrev3) fcPrev3.addEventListener('click', () => goToStep(2));
if (fcNext3) fcNext3.addEventListener('click', () => {
  if (validateStep3()) goToStep(4);
});

/* ── STEP 4 ── */
const repCpfInput = $('repCpf');
if (repCpfInput) repCpfInput.addEventListener('input', e => {
  e.target.value = maskCPF(e.target.value);
  clearError(repCpfInput, $('repCpfError'));
});

const repTelInput = $('repTelefone');
if (repTelInput) repTelInput.addEventListener('input', e => {
  e.target.value = maskPhone(e.target.value);
  clearError(repTelInput, $('repTelefoneError'));
});

const fcPrev4 = $('fcPrev4');
const fcNext4 = $('fcNext4');
if (fcPrev4) fcPrev4.addEventListener('click', () => goToStep(3));
if (fcNext4) fcNext4.addEventListener('click', () => {
  if (validateStep4()) goToStep(5);
});

/* ── STEP 5 ── */
const segSearch = $('segSearch');
if (segSearch) segSearch.addEventListener('input', () => {
  renderSegments(segSearch.value);
});

const fcPrev5 = $('fcPrev5');
const fcNext5 = $('fcNext5');
if (fcPrev5) fcPrev5.addEventListener('click', () => goToStep(4));
if (fcNext5) fcNext5.addEventListener('click', () => {
  if (validateStep5()) goToStep(6);
});

/* ── STEP 6 ── */
const fcPrev6  = $('fcPrev6');
const fcFinish = $('fcFinish');
if (fcPrev6)  fcPrev6.addEventListener('click', () => goToStep(5));
if (fcFinish) fcFinish.addEventListener('click', () => {
  // Show success screen
  hide($('fcPanel6'));
  show($('fcPanelSuccess'));
  updateProgress(6);
  updateStepper(7); // all done
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
function init() {
  populateBanks();
  renderSegments();
  renderDocuments();
  updateProgress(1);
  updateStepper(1);
}

document.addEventListener('DOMContentLoaded', init);
