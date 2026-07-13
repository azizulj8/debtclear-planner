import { STRINGS } from '../data/strings.js';
import { formatRupiah, parseRupiah } from '../utils/format.js';
import { deriveDebtFromQuickAdd } from '../utils/quickAdd.js';
import { findProviderPreset } from '../data/auditProviders.js';
import { addDebt } from '../utils/storage.js';

/**
 * Quick-add capture page: three numbers in pinjol language
 * (received, per-installment payment, number of installments) —
 * interest rate and obligation are derived automatically.
 * @param {HTMLElement} container
 */
export function renderQuickAddPage(container) {
  const urlParams = new URLSearchParams(window.location.search);
  const prefillName = urlParams.get('name') || '';
  const fromAudit = urlParams.get('from') === 'audit';
  // After saving/cancel, return to the audit checklist when we came from it
  const backPath = fromAudit ? '/audit' : '/dashboard';

  container.innerHTML = `
    <div class="container mt-4 mb-4" style="max-width: 560px;">
      <div class="card debt-form-card">
        <h2 class="section-title" style="text-align:left;">⚡ Catat Cepat Pinjaman</h2>
        <p class="text-secondary mb-4" style="font-size: var(--font-size-sm);">
          Cukup 3 angka yang kamu tahu dari aplikasi pinjolnya — bunga dihitung otomatis.
        </p>

        <form id="quick-add-form">
          <div class="form-group">
            <label class="form-label" for="qa-name">Pinjam di mana?</label>
            <input type="text" id="qa-name" class="form-input" placeholder="mis: AdaKami, Kredivo, SPayLater" value="${prefillName.replace(/"/g, '&quot;')}" />
            <span class="form-error" id="qa-err-name"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="qa-received">Uang yang kamu terima (Rp)</label>
            <input type="text" id="qa-received" class="form-input text-right" placeholder="Rp 1.000.000" inputmode="numeric" />
            <span class="form-error" id="qa-err-received"></span>
          </div>

          <div class="grid-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="qa-installment">Bayar per bulan (Rp)</label>
              <input type="text" id="qa-installment" class="form-input text-right" placeholder="Rp 410.000" inputmode="numeric" />
              <span class="form-error" id="qa-err-installment"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="qa-tenor">Berapa kali bayar?</label>
              <input type="number" id="qa-tenor" class="form-input" placeholder="3" min="1" max="600" inputmode="numeric" />
              <span class="form-error" id="qa-err-tenor"></span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="qa-due-date">Tanggal jatuh tempo tiap bulan (1-31)</label>
            <input type="number" id="qa-due-date" class="form-input" placeholder="5" min="1" max="31" inputmode="numeric" />
            <span class="form-error" id="qa-err-due-date"></span>
          </div>

          <div id="qa-preview" class="alert mb-4" style="display:none; padding: var(--spacing-3); border-radius: var(--radius-md); font-size: var(--font-size-sm);"></div>

          <div class="flex gap-4">
            <button type="submit" class="btn btn--primary flex-1" id="qa-save">Simpan</button>
            <button type="button" class="btn btn--secondary flex-1" id="qa-cancel">${STRINGS.FORM_BTN_CANCEL}</button>
          </div>
        </form>

        <p class="text-secondary mt-4" style="font-size: var(--font-size-xs);">
          Butuh field lengkap (jenis utang, cicilan sudah berjalan, dll)?
          <a href="#" id="qa-full-form" class="text-primary" style="font-weight:600;">Pakai form lengkap</a>
        </p>
      </div>
    </div>
  `;

  const nameInput = container.querySelector('#qa-name');
  const receivedInput = container.querySelector('#qa-received');
  const installmentInput = container.querySelector('#qa-installment');
  const tenorInput = container.querySelector('#qa-tenor');
  const dueDateInput = container.querySelector('#qa-due-date');
  const preview = container.querySelector('#qa-preview');

  const maskCurrency = (input) => {
    const parsed = parseRupiah(input.value);
    input.value = parsed > 0 ? formatRupiah(parsed) : '';
  };

  const updatePreview = () => {
    const derived = deriveDebtFromQuickAdd({
      amountReceived: parseRupiah(receivedInput.value),
      installment: parseRupiah(installmentInput.value),
      tenorMonths: parseInt(tenorInput.value, 10) || 0,
    });

    if (!derived) {
      preview.style.display = 'none';
      return;
    }

    preview.style.display = 'block';
    preview.innerHTML = `
      Total yang akan kamu bayar: <strong>${formatRupiah(derived.totalObligation)}</strong>
      (bunga ${formatRupiah(derived.totalMarkup)} ≈ <strong>${derived.interestRate}%/thn</strong>)
    `;
  };

  [receivedInput, installmentInput].forEach(input => {
    input.addEventListener('input', () => {
      maskCurrency(input);
      updatePreview();
    });
  });
  tenorInput.addEventListener('input', updatePreview);

  container.querySelector('#qa-cancel').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: backPath } }));
  });

  container.querySelector('#qa-full-form').addEventListener('click', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/add-debt' } }));
  });

  container.querySelector('#quick-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    container.querySelectorAll('.form-error').forEach(s => (s.textContent = ''));
    container.querySelectorAll('.form-input').forEach(i => i.classList.remove('input-error'));

    const setError = (field, msg) => {
      container.querySelector(`#qa-err-${field}`).textContent = msg;
      container.querySelector(`#qa-${field}`).classList.add('input-error');
    };

    const name = nameInput.value.trim();
    const derived = deriveDebtFromQuickAdd({
      amountReceived: parseRupiah(receivedInput.value),
      installment: parseRupiah(installmentInput.value),
      tenorMonths: parseInt(tenorInput.value, 10) || 0,
    });
    const dueDate = parseInt(dueDateInput.value, 10);

    let hasError = false;
    if (!name) { setError('name', STRINGS.ERR_REQUIRED_NAME); hasError = true; }
    if (parseRupiah(receivedInput.value) <= 0) { setError('received', 'Masukkan jumlah uang yang kamu terima.'); hasError = true; }
    if (parseRupiah(installmentInput.value) <= 0) { setError('installment', 'Masukkan cicilan per bulan.'); hasError = true; }
    if (!(parseInt(tenorInput.value, 10) > 0)) { setError('tenor', 'Masukkan berapa kali bayar.'); hasError = true; }
    if (isNaN(dueDate) || dueDate < 1 || dueDate > 31) { setError('due-date', STRINGS.ERR_INVALID_DUE_DATE); hasError = true; }
    if (hasError || !derived) return;

    try {
      const btnSave = container.querySelector('#qa-save');
      btnSave.disabled = true;
      btnSave.textContent = 'Menyimpan...';

      await addDebt({
        name,
        type: 'Pinjaman Online',
        principal: derived.principal,
        interestRate: derived.interestRate,
        minPayment: derived.minPayment,
        dueDate,
        tenorMonths: derived.tenorMonths,
        priorPayments: null,
        // Auto-link to a provider preset when the name matches one
        providerId: findProviderPreset(name)?.id || null,
      });

      window.dispatchEvent(new CustomEvent('navigate', { detail: { path: backPath } }));
    } catch (err) {
      console.error('Failed to quick-add debt:', err);
      alert('Terjadi kesalahan saat menyimpan data.');
      const btnSave = container.querySelector('#qa-save');
      btnSave.disabled = false;
      btnSave.textContent = 'Simpan';
    }
  });
}
