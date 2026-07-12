import { STRINGS } from '../data/strings.js';
import { getAllDebts, deleteDebt, getPaymentCountsPerDebt } from '../utils/storage.js';
import { formatRupiah } from '../utils/format.js';
import { renderDebtCard } from './DebtCard.js';

export async function renderDebtList(container) {
  let debts = [];
  let paymentCounts = new Map();
  try {
    debts = await getAllDebts();
    paymentCounts = await getPaymentCountsPerDebt();
  } catch (err) {
    console.error('Failed to load debts:', err);
    alert('Gagal memuat data utang. Pastikan browser Anda mengizinkan penyimpanan lokal (IndexedDB).');
  }

  let currentSort = 'principal-desc';

  const render = () => {
    const totalPrincipal = debts.reduce((sum, d) => sum + (d.isPaidOff ? 0 : d.principal), 0);
    
    if (debts.length === 0) {
      renderEmptyState(container);
      return;
    }

    // Sort debts
    const sortedDebts = sortDebts(debts, currentSort);

    container.innerHTML = `
      <div class="mt-4 mb-12">
        <!-- Dashboard Header / Overview -->
        <div class="card overview-card mb-6">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-secondary">${STRINGS.LIST_TOTAL_DEBT}</span>
              <h1 class="total-debt-amount mt-1 text-primary">${formatRupiah(totalPrincipal)}</h1>
            </div>
            <div class="flex gap-2 flex-wrap" style="justify-content: flex-end;">
              <button class="btn btn--primary" id="btn-quick-add-dashboard">⚡ Catat Cepat</button>
              <button class="btn btn--secondary" id="btn-add-debt-dashboard">
                ${STRINGS.LIST_BTN_ADD}
              </button>
            </div>
          </div>
        </div>

        <!-- Sort and Controls -->
        <div class="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 class="section-title" style="margin-bottom:0;">${STRINGS.LIST_TITLE}</h2>
          <div class="flex items-center gap-2">
            <label class="form-label" style="margin-bottom:0; font-size:var(--font-size-xs);" for="sort-select">
              ${STRINGS.LIST_SORT_LABEL}
            </label>
            <select id="sort-select" class="form-select form-select--sm" style="width:auto; padding: 4px 8px; font-size:var(--font-size-sm);">
              <option value="principal-desc" ${currentSort === 'principal-desc' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_PRINCIPAL_DESC}</option>
              <option value="principal-asc" ${currentSort === 'principal-asc' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_PRINCIPAL_ASC}</option>
              <option value="interest-desc" ${currentSort === 'interest-desc' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_INTEREST_DESC}</option>
              <option value="interest-asc" ${currentSort === 'interest-asc' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_INTEREST_ASC}</option>
              <option value="name-asc" ${currentSort === 'name-asc' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_NAME_ASC}</option>
              <option value="name-desc" ${currentSort === 'name-desc' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_NAME_DESC}</option>
              <option value="due-date" ${currentSort === 'due-date' ? 'selected' : ''}>${STRINGS.LIST_SORT_BY_DUE_DATE}</option>
            </select>
          </div>
        </div>

        <!-- Cards Container -->
        <div class="debts-grid">
          ${sortedDebts.map(d => renderDebtCard(d, paymentCounts.get(d.id) || 0)).join('')}
        </div>
      </div>
    `;

    setupEventListeners();
  };

  const setupEventListeners = () => {
    // Add Debt Buttons
    const btnAdd = container.querySelector('#btn-add-debt-dashboard');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/add-debt' } }));
      });
    }

    const btnQuickAdd = container.querySelector('#btn-quick-add-dashboard');
    if (btnQuickAdd) {
      btnQuickAdd.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/quick-add' } }));
      });
    }

    // Sort Dropdown
    const sortSelect = container.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        render();
      });
    }

    // Open detail page when the card body is clicked (not its buttons)
    container.querySelectorAll('.debt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const id = parseInt(card.getAttribute('data-id'), 10);
        window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/debt-detail?id=${id}` } }));
      });
    });

    // Edit and Delete handlers
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/edit-debt?id=${id}` } }));
      });
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const debt = debts.find(d => d.id === id);
        
        if (debt && confirm(STRINGS.LIST_CONFIRM_DELETE.replace('{name}', debt.name))) {
          try {
            await deleteDebt(id);
            debts = debts.filter(d => d.id !== id);
            render();
          } catch (err) {
            console.error('Failed to delete debt:', err);
            alert('Gagal menghapus utang.');
          }
        }
      });
    });
  };

  render();
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="container text-center mt-12 mb-12">
      <div class="empty-state-illustration mb-4">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
      </div>
      <h3 class="mb-2" style="font-weight: 600;">${STRINGS.LIST_EMPTY_STATE}</h3>
      <p class="text-secondary mb-6">Mulai catat utang Anda sekarang untuk menyusun rencana pelunasan cerdas.</p>
      <div class="flex gap-2 justify-center flex-wrap">
        <button class="btn btn--primary" id="btn-quick-add-empty">⚡ Catat Cepat Pinjaman</button>
        <button class="btn btn--secondary" id="btn-add-debt-empty">
          ${STRINGS.LIST_EMPTY_CTA}
        </button>
      </div>
    </div>
  `;

  container.querySelector('#btn-add-debt-empty').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/add-debt' } }));
  });
  container.querySelector('#btn-quick-add-empty').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/quick-add' } }));
  });
}

/**
 * Sorts debts based on selection.
 * @param {Array} debts - Array of debts
 * @param {string} sortKey - The sort identifier
 * @returns {Array} Sorted array
 */
export function sortDebts(debts, sortKey) {
  return [...debts].sort((a, b) => {
    // Put completed debts at the bottom always
    if (a.isPaidOff !== b.isPaidOff) {
      return a.isPaidOff ? 1 : -1;
    }
    
    switch (sortKey) {
      case 'principal-desc':
        return b.principal - a.principal;
      case 'principal-asc':
        return a.principal - b.principal;
      case 'interest-desc':
        return b.interestRate - a.interestRate;
      case 'interest-asc':
        return a.interestRate - b.interestRate;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'due-date':
        return a.dueDate - b.dueDate;
      default:
        return 0;
    }
  });
}
