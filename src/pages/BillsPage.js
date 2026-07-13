import { renderAppShell } from '../components/AppShell.js';
import { renderMonthlyBills } from '../components/MonthlyBills.js';
import { getAllDebts } from '../utils/storage.js';

/**
 * Tagihan page: the full combined monthly bills checklist.
 * @param {HTMLElement} container
 */
export async function renderBillsPage(container) {
  const content = await renderAppShell(container, { title: 'Tagihan', active: 'bills' });

  let debts = [];
  try {
    debts = await getAllDebts();
  } catch (err) {
    console.error('Failed to load debts:', err);
  }

  content.innerHTML = '<div id="monthly-bills-container"></div>';
  const billsContainer = content.querySelector('#monthly-bills-container');
  renderMonthlyBills(billsContainer, debts);

  if (debts.filter(d => !d.isPaidOff).length === 0) {
    content.innerHTML = `
      <div class="card text-center" style="padding: var(--spacing-8);">
        <h3 class="font-bold mb-2">Tidak ada tagihan</h3>
        <p class="text-secondary" style="font-size: var(--font-size-sm);">Belum ada utang aktif yang tercatat. Catat pinjamanmu dulu untuk melihat tagihan bulanan di sini.</p>
      </div>
    `;
  }
}
