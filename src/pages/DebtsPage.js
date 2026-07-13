import { renderAppShell } from '../components/AppShell.js';
import { renderDebtList } from '../components/DebtList.js';
import { renderCsvImport } from '../components/CsvImport.js';

/**
 * Utang Saya page: the debt list with add/import entry points.
 * @param {HTMLElement} container
 */
export async function renderDebtsPage(container) {
  const content = await renderAppShell(container, { title: 'Utang Saya', active: 'debts' });

  content.innerHTML = `
    <div class="flex justify-end mb-4">
      <button type="button" class="btn btn--secondary btn--sm" id="btn-csv-trigger">📂 Import CSV</button>
    </div>
    <div id="debt-list-container"></div>
  `;

  const listContainer = content.querySelector('#debt-list-container');
  renderDebtList(listContainer);

  const csvImport = renderCsvImport(content, () => renderDebtsPage(container));
  content.querySelector('#btn-csv-trigger').addEventListener('click', () => csvImport.open());
}
