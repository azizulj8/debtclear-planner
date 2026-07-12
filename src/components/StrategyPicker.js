export function renderStrategyPicker(container, initialStrategy, onStrategyChange) {
  let activeStrategy = initialStrategy || 'snowball';

  const render = () => {
    container.innerHTML = `
      <div class="card strategy-picker-card mb-6">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 class="font-bold mb-1" style="font-size: var(--font-size-lg);">Strategi Pelunasan</h3>
            <p class="text-secondary" style="font-size: var(--font-size-xs);">Pilih metode yang paling cocok untuk gaya finansial Anda.</p>
          </div>
          
          <div class="strategy-toggle-buttons flex gap-2">
            <button type="button" class="btn btn-strategy-toggle ${activeStrategy === 'snowball' ? 'btn-strategy-toggle--active' : ''}" data-strategy="snowball">
              Method Snowball
            </button>
            <button type="button" class="btn btn-strategy-toggle ${activeStrategy === 'avalanche' ? 'btn-strategy-toggle--active' : ''}" data-strategy="avalanche">
              Method Avalanche
            </button>
          </div>
        </div>

        <div class="strategy-explanation mt-4 p-3" style="background-color: var(--color-surface-hover); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          ${activeStrategy === 'snowball' ? `
            <div class="flex gap-2 items-start">
              <span style="font-size: 1.2rem;">💡</span>
              <div>
                <strong class="text-primary">Metode Snowball (Bola Salju)</strong>
                <p class="mt-1 text-secondary" style="font-size: var(--font-size-sm); line-height: 1.4;">
                  Fokus membayar utang dari <strong>nominal saldo terkecil</strong> hingga terbesar. 
                  Metode ini memberikan dorongan psikologis yang cepat karena Anda akan melihat utang-utang kecil cepat lunas (tereliminasi), memberikan momentum untuk melunasi utang yang lebih besar.
                </p>
              </div>
            </div>
          ` : `
            <div class="flex gap-2 items-start">
              <span style="font-size: 1.2rem;">⚡</span>
              <div>
                <strong class="text-primary">Metode Avalanche (Longsoran)</strong>
                <p class="mt-1 text-secondary" style="font-size: var(--font-size-sm); line-height: 1.4;">
                  Fokus membayar utang dengan <strong>persentase bunga tertinggi</strong> terlebih dahulu.
                  Secara matematis, metode ini adalah yang paling efisien karena meminimalkan akumulasi bunga, sehingga menghemat uang paling banyak dalam jangka panjang.
                </p>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    setupEventListeners();
  };

  const setupEventListeners = () => {
    container.querySelectorAll('.btn-strategy-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const strategy = btn.getAttribute('data-strategy');
        if (strategy !== activeStrategy) {
          activeStrategy = strategy;
          localStorage.setItem('debtclear_strategy', strategy);
          render();
          if (onStrategyChange) onStrategyChange(strategy);
        }
      });
    });
  };

  render();
}
