import { formatRupiah, parseRupiah } from '../utils/format.js';
import {
  getMonthlyCommitment,
  computeRatio,
  getStoredIncome,
  setStoredIncome,
} from '../utils/ratio.js';

const ZONE_COPY = {
  green: { label: 'Aman', sentence: 'Cicilanmu masih di bawah batas sehat 30% penghasilan.' },
  yellow: { label: 'Waspada', sentence: 'Cicilanmu mendekati batas aman. Pikir dua kali sebelum menambah pinjaman.' },
  red: { label: 'Bahaya', sentence: 'Cicilanmu melebihi 50% penghasilan — prioritaskan pelunasan.' },
};

/**
 * Renders the debt-to-income ratio meter ("Takar"): a big percentage,
 * a colored zone chip, and a one-line status. Income is stored on the
 * device only.
 * @param {HTMLElement} container
 * @param {Array} debts
 */
export function renderIncomeRatio(container, debts) {
  const render = (editing = false) => {
    const income = getStoredIncome();
    const commitment = getMonthlyCommitment(debts);

    // --- Input / edit state ---
    if (!income || editing) {
      container.innerHTML = `
        <div class="card ratio-card mb-6">
          <h3 class="font-bold mb-1" style="font-size: var(--font-size-lg);">📊 Takar Kemampuan Bayar</h3>
          <p class="text-secondary mb-3" style="font-size: var(--font-size-xs);">
            Masukkan penghasilan bulananmu untuk melihat berapa persen yang habis untuk cicilan.
            Perkiraan kasar tidak apa-apa — angka ini <strong>hanya tersimpan di HP kamu</strong>.
          </p>
          <div class="flex gap-2">
            <input type="text" id="income-input" class="form-input text-right" placeholder="Rp 5.000.000" value="${income ? formatRupiah(income) : ''}" style="flex:1;" />
            <button type="button" class="btn btn--primary" id="income-save">Lihat Rasio</button>
            ${editing ? '<button type="button" class="btn btn--secondary" id="income-cancel">Batal</button>' : ''}
          </div>
        </div>
      `;

      const input = container.querySelector('#income-input');
      input.addEventListener('input', () => {
        const parsed = parseRupiah(input.value);
        input.value = parsed > 0 ? formatRupiah(parsed) : '';
      });
      const save = () => {
        const value = parseRupiah(input.value);
        if (value <= 0) {
          input.classList.add('input-error');
          return;
        }
        setStoredIncome(value);
        render();
      };
      container.querySelector('#income-save').addEventListener('click', save);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
      });
      const cancel = container.querySelector('#income-cancel');
      if (cancel) cancel.addEventListener('click', () => render());
      return;
    }

    // --- Meter state ---
    const ratio = computeRatio(commitment, income);
    const copy = ZONE_COPY[ratio.zone];
    const sentence = ratio.exceedsIncome
      ? 'Cicilanmu melebihi penghasilanmu. Segera susun rencana pelunasan.'
      : copy.sentence;

    container.innerHTML = `
      <div class="card ratio-card ratio-card--${ratio.zone} mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold" style="font-size: var(--font-size-lg);">📊 Takar Kemampuan Bayar</h3>
            <p class="text-secondary" style="font-size: var(--font-size-xs);">Porsi penghasilan untuk cicilan bulanan</p>
          </div>
          <button type="button" class="btn btn--secondary btn--sm" id="income-edit" title="Ubah penghasilan">✏️</button>
        </div>

        <div class="flex items-center gap-4 mt-3 flex-wrap">
          <span class="ratio-pct ratio-pct--${ratio.zone}">${ratio.pct}%</span>
          <div>
            <span class="badge ratio-chip--${ratio.zone}">${copy.label}</span>
            <p class="mt-1" style="font-size: var(--font-size-sm);">${sentence}</p>
          </div>
        </div>

        <p class="text-secondary mt-3" style="font-size: var(--font-size-xs);">
          Cicilan ${formatRupiah(commitment)} / bln dari penghasilan ${formatRupiah(income)} · hijau &lt;30% · kuning 30–50% · merah &gt;50%
        </p>

        <button type="button" class="btn btn--secondary btn--sm mt-3" id="btn-simulate" style="width:100%;">
          🧮 Mau pinjam lagi? Cek dampaknya dulu
        </button>
      </div>
    `;

    container.querySelector('#income-edit').addEventListener('click', () => render(true));
    container.querySelector('#btn-simulate').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/simulate' } }));
    });
  };

  render();
}
