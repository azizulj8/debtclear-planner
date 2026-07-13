import { formatRupiah, parseRupiah } from '../utils/format.js';

export function renderExtraPayment(container, initialExtra, onExtraChange) {
  let currentValue = initialExtra || 0;
  let debounceTimeout = null;

  const render = () => {
    container.innerHTML = `
      <div class="card extra-payment-card mb-6">
        <div class="flex justify-between items-center mb-3">
          <div>
            <h3 class="font-bold mb-1" style="font-size: var(--font-size-lg);">💵 Uang Lebih per Bulan</h3>
            <p class="text-secondary" style="font-size: var(--font-size-xs);">Berapa yang sanggup kamu sisihkan tiap bulan di luar semua cicilan minimum? Rp 0 tidak apa-apa — geser untuk lihat efeknya ke tanggal bebas utangmu.</p>
          </div>
          <div class="extra-input-wrapper">
            <input type="text" id="extra-payment-input" class="form-input text-right font-bold text-primary" style="width: 180px; font-size: var(--font-size-md);" placeholder="Rp 0" value="${currentValue > 0 ? formatRupiah(currentValue) : ''}" />
          </div>
        </div>
        
        <div class="slider-wrapper mt-4">
          <input type="range" id="extra-payment-slider" class="range-slider" min="0" max="5000000" step="100000" value="${currentValue}" />
          <div class="flex justify-between mt-1 text-secondary" style="font-size: var(--font-size-xs);">
            <span>Rp 0</span>
            <span>Rp 2.500.000</span>
            <span>Rp 5.000.000</span>
          </div>
        </div>
      </div>
    `;

    setupEventListeners();
  };

  const setupEventListeners = () => {
    const input = container.querySelector('#extra-payment-input');
    const slider = container.querySelector('#extra-payment-slider');

    const updateValues = (val, source) => {
      currentValue = val;
      localStorage.setItem('debtclear_extra_payment', currentValue);

      if (source !== 'input') {
        input.value = currentValue > 0 ? formatRupiah(currentValue) : '';
      }
      if (source !== 'slider') {
        slider.value = currentValue;
      }

      // Debounce Callback execution to prevent rendering chart on every drag step
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (onExtraChange) onExtraChange(currentValue);
      }, 300);
    };

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      updateValues(val, 'slider');
    });

    input.addEventListener('input', (e) => {
      let cursor = e.target.selectionStart;
      const oldLength = e.target.value.length;
      
      const parsed = parseRupiah(e.target.value);
      
      const newLength = parsed > 0 ? formatRupiah(parsed).length : 0;
      cursor = cursor + (newLength - oldLength);
      if (e.target.value.startsWith('Rp') && cursor < 3) cursor = 3;
      
      updateValues(parsed, 'input');
      
      e.target.setSelectionRange(cursor, cursor);
    });
  };

  render();
}
