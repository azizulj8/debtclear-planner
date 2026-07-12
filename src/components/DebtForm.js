import { STRINGS } from '../data/strings.js';
import { formatRupiah, parseRupiah } from '../utils/format.js';
import { validateDebtForm } from '../utils/validation.js';
import { addDebt, getDebt, updateDebt } from '../utils/storage.js';
import { PINJOL_TEMPLATES } from '../data/pinjolTemplates.js';

export async function renderDebtForm(container) {
  // Check if we are in Edit Mode
  const urlParams = new URLSearchParams(window.location.search);
  const editIdStr = urlParams.get('id');
  const editId = editIdStr ? parseInt(editIdStr, 10) : null;
  
  let existingDebt = null;
  if (editId && !isNaN(editId)) {
    existingDebt = await getDebt(editId);
    if (!existingDebt) {
      alert('Utang tidak ditemukan!');
      window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
      return;
    }
  }

  const title = existingDebt ? `Edit Utang: ${existingDebt.name}` : STRINGS.FORM_ADD_DEBT_TITLE;

  container.innerHTML = `
    <div class="container mt-4 mb-4">
      <div class="card debt-form-card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="section-title" style="text-align:left; margin-bottom:0;">${title}</h2>
          ${!existingDebt ? `
            <button type="button" class="btn btn--secondary" id="btn-use-template" style="gap:var(--spacing-1);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Gunakan Template Pinjol
            </button>
          ` : ''}
        </div>
        
        <form id="debt-form">
          <div class="form-group">
            <label class="form-label" for="debt-name">${STRINGS.FORM_LABEL_NAME}</label>
            <input type="text" id="debt-name" class="form-input" placeholder="Kartu Kredit Bank XYZ" value="${existingDebt ? existingDebt.name : ''}" />
            <span class="form-error" id="err-name"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="debt-type">${STRINGS.FORM_LABEL_TYPE}</label>
            <select id="debt-type" class="form-select">
              <option value="">-- Pilih Jenis Utang --</option>
              <option value="Pinjaman Online" ${existingDebt && existingDebt.type === 'Pinjaman Online' ? 'selected' : ''}>Pinjaman Online (Pinjol)</option>
              <option value="Kartu Kredit" ${existingDebt && existingDebt.type === 'Kartu Kredit' ? 'selected' : ''}>Kartu Kredit</option>
              <option value="KPR" ${existingDebt && existingDebt.type === 'KPR' ? 'selected' : ''}>KPR</option>
              <option value="Leasing/KKB" ${existingDebt && existingDebt.type === 'Leasing/KKB' ? 'selected' : ''}>Leasing Kendaraan</option>
              <option value="KTA" ${existingDebt && existingDebt.type === 'KTA' ? 'selected' : ''}>KTA / Pinjaman Bank</option>
              <option value="Lainnya" ${existingDebt && existingDebt.type === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
            </select>
            <span class="form-error" id="err-type"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="debt-principal">${STRINGS.FORM_LABEL_PRINCIPAL}</label>
            <input type="text" id="debt-principal" class="form-input text-right" placeholder="Rp 0" value="${existingDebt ? formatRupiah(existingDebt.principal) : ''}" />
            <span class="form-error" id="err-principal"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="debt-interest">${STRINGS.FORM_LABEL_INTEREST}</label>
            <input type="number" id="debt-interest" class="form-input" placeholder="12" step="0.1" value="${existingDebt ? existingDebt.interestRate : ''}" />
            <span class="form-error" id="err-interest"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="debt-min-payment">${STRINGS.FORM_LABEL_MIN_PAYMENT}</label>
            <input type="text" id="debt-min-payment" class="form-input text-right" placeholder="Rp 0" value="${existingDebt ? formatRupiah(existingDebt.minPayment) : ''}" />
            <span class="form-error" id="err-min-payment"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="debt-due-date">${STRINGS.FORM_LABEL_DUE_DATE}</label>
            <input type="number" id="debt-due-date" class="form-input" placeholder="15" min="1" max="31" value="${existingDebt ? existingDebt.dueDate : ''}" />
            <span class="form-error" id="err-due-date"></span>
          </div>

          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn--primary flex-1" id="btn-save">${STRINGS.FORM_BTN_SAVE}</button>
            <button type="button" class="btn btn--secondary flex-1" id="btn-cancel">${STRINGS.FORM_BTN_CANCEL}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Template Selection Modal -->
    ${!existingDebt ? `
      <div class="modal-overlay" id="template-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Pilih Template Pinjol (OJK Standard)</h3>
            <button type="button" class="modal-close" id="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="template-list">
              ${PINJOL_TEMPLATES.map(t => `
                <button type="button" class="template-item" data-id="${t.id}">
                  <div class="template-item__header">
                    <span class="template-item__name">${t.name}</span>
                    <span class="template-item__badge">Bunga ${t.interestRate}%/thn</span>
                  </div>
                  <p class="template-item__desc">${t.description}</p>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    ` : ''}
  `;

  setupEventListeners(container, existingDebt);
}

function setupEventListeners(container, existingDebt) {
  const form = container.querySelector('#debt-form');
  const principalInput = container.querySelector('#debt-principal');
  const minPaymentInput = container.querySelector('#debt-min-payment');
  const btnCancel = container.querySelector('#btn-cancel');
  
  // Template elements (only if not editing)
  const btnUseTemplate = container.querySelector('#btn-use-template');
  const templateModal = container.querySelector('#template-modal');
  const btnCloseModal = container.querySelector('#modal-close');
  const templateItems = container.querySelectorAll('.template-item');
  
  let selectedTemplate = null;

  // Input Masks for Currency
  const maskCurrency = (e) => {
    const input = e.target;
    let cursor = input.selectionStart;
    const oldLength = input.value.length;
    
    const parsed = parseRupiah(input.value);
    if (parsed > 0) {
      input.value = formatRupiah(parsed);
    } else {
      input.value = '';
    }

    const newLength = input.value.length;
    cursor = cursor + (newLength - oldLength);
    if (input.value.startsWith('Rp') && cursor < 3) cursor = 3;
    input.setSelectionRange(cursor, cursor);

    if (input === principalInput && selectedTemplate) {
      calculateEstimatedMinPayment();
    }
  };

  const calculateEstimatedMinPayment = () => {
    const principalVal = parseRupiah(principalInput.value);
    if (principalVal > 0 && selectedTemplate) {
      const estimatedMin = Math.round((principalVal * selectedTemplate.minPaymentPercent) / 100);
      minPaymentInput.value = formatRupiah(estimatedMin);
      triggerHighlight(minPaymentInput);
    }
  };

  const triggerHighlight = (element) => {
    element.classList.add('highlight-fill');
    setTimeout(() => element.classList.remove('highlight-fill'), 1000);
  };

  principalInput.addEventListener('input', maskCurrency);
  minPaymentInput.addEventListener('input', maskCurrency);

  // Template Modal Toggle
  if (btnUseTemplate) {
    btnUseTemplate.addEventListener('click', () => {
      templateModal.classList.add('active');
    });
  }

  const closeModal = () => {
    if (templateModal) templateModal.classList.remove('active');
  };

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) closeModal();
    });
  }

  // Handle template selection
  templateItems.forEach(item => {
    item.addEventListener('click', () => {
      const templateId = item.getAttribute('data-id');
      const template = PINJOL_TEMPLATES.find(t => t.id === templateId);
      
      if (template) {
        selectedTemplate = template;
        
        const nameInput = container.querySelector('#debt-name');
        const typeSelect = container.querySelector('#debt-type');
        const interestInput = container.querySelector('#debt-interest');
        const dueDateInput = container.querySelector('#debt-due-date');
        
        nameInput.value = template.name;
        typeSelect.value = template.type;
        interestInput.value = template.interestRate;
        dueDateInput.value = template.dueDate;
        
        triggerHighlight(nameInput);
        triggerHighlight(typeSelect);
        triggerHighlight(interestInput);
        triggerHighlight(dueDateInput);
        
        calculateEstimatedMinPayment();
        closeModal();
      }
    });
  });

  btnCancel.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(container);

    const formData = {
      name: container.querySelector('#debt-name').value,
      type: container.querySelector('#debt-type').value,
      principal: parseRupiah(principalInput.value),
      interestRate: parseFloat(container.querySelector('#debt-interest').value),
      minPayment: parseRupiah(minPaymentInput.value),
      dueDate: parseInt(container.querySelector('#debt-due-date').value, 10)
    };

    const validation = validateDebtForm(formData);

    if (!validation.isValid) {
      showErrors(container, validation.errors);
      return;
    }

    try {
      const btnSave = container.querySelector('#btn-save');
      btnSave.disabled = true;
      btnSave.textContent = 'Menyimpan...';

      if (existingDebt) {
        await updateDebt(existingDebt.id, formData);
      } else {
        await addDebt(formData);
      }
      
      window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
      
    } catch (err) {
      console.error('Failed to save debt:', err);
      alert('Terjadi kesalahan saat menyimpan data.');
      const btnSave = container.querySelector('#btn-save');
      btnSave.disabled = false;
      btnSave.textContent = STRINGS.FORM_BTN_SAVE;
    }
  });
}

function clearErrors(container) {
  const errorSpans = container.querySelectorAll('.form-error');
  errorSpans.forEach(span => span.textContent = '');
  
  const inputs = container.querySelectorAll('.form-input, .form-select');
  inputs.forEach(input => input.classList.remove('input-error'));
}

function showErrors(container, errors) {
  for (const [key, msg] of Object.entries(errors)) {
    let errorId = '';
    let inputId = '';
    
    switch(key) {
      case 'name': errorId = 'err-name'; inputId = 'debt-name'; break;
      case 'type': errorId = 'err-type'; inputId = 'debt-type'; break;
      case 'principal': errorId = 'err-principal'; inputId = 'debt-principal'; break;
      case 'interestRate': errorId = 'err-interest'; inputId = 'debt-interest'; break;
      case 'minPayment': errorId = 'err-min-payment'; inputId = 'debt-min-payment'; break;
      case 'dueDate': errorId = 'err-due-date'; inputId = 'debt-due-date'; break;
    }

    if (errorId) {
      const errSpan = container.querySelector(`#${errorId}`);
      if (errSpan) errSpan.textContent = msg;
    }
    if (inputId) {
      const inputEl = container.querySelector(`#${inputId}`);
      if (inputEl) inputEl.classList.add('input-error');
    }
  }
}
