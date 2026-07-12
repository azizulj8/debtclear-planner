import { STRINGS } from '../data/strings.js';
import { formatRupiah } from '../utils/format.js';

/**
 * Renders a single debt card.
 * @param {Object} debt - The debt object
 * @param {number} debt.id - The debt ID
 * @param {string} debt.name - Name of the debt
 * @param {string} debt.type - Type of the debt (e.g. Pinjaman Online)
 * @param {number} debt.principal - Remaining principal amount
 * @param {number} debt.interestRate - Annual interest rate (%)
 * @param {number} debt.minPayment - Minimum monthly payment
 * @param {number} debt.dueDate - Due date day
 * @param {boolean} debt.isPaidOff - Whether the debt is paid off
 * @returns {string} HTML string for the debt card
 */
export function renderDebtCard(debt) {
  const badgeClass = getBadgeClass(debt.type);
  const isLunas = debt.isPaidOff;

  return `
    <div class="card debt-card ${isLunas ? 'debt-card--lunas' : ''}" data-id="${debt.id}">
      <div class="debt-card__header flex justify-between items-start mb-3">
        <div>
          <h3 class="debt-card__title">${debt.name}</h3>
          <span class="badge ${badgeClass} mt-1">${debt.type}</span>
          ${isLunas ? `<span class="badge badge--success mt-1">${STRINGS.LIST_BADGE_LUNAS}</span>` : ''}
        </div>
        <div class="debt-card__actions flex gap-2">
          <button type="button" class="btn btn--secondary btn--sm btn-edit" data-id="${debt.id}">
            ${STRINGS.LIST_BTN_EDIT}
          </button>
          <button type="button" class="btn btn--danger btn--sm btn-delete" data-id="${debt.id}">
            ${STRINGS.LIST_BTN_DELETE}
          </button>
        </div>
      </div>

      <div class="debt-card__body grid-2">
        <div class="debt-card__info-group">
          <span class="debt-card__info-label">Sisa Pokok</span>
          <span class="debt-card__info-value text-primary font-bold">${formatRupiah(debt.principal)}</span>
        </div>
        <div class="debt-card__info-group">
          <span class="debt-card__info-label">${STRINGS.LIST_LABEL_MIN_PAYMENT}</span>
          <span class="debt-card__info-value">${formatRupiah(debt.minPayment)}</span>
        </div>
        <div class="debt-card__info-group">
          <span class="debt-card__info-label">${STRINGS.LIST_LABEL_INTEREST}</span>
          <span class="debt-card__info-value">${debt.interestRate}% / thn</span>
        </div>
        <div class="debt-card__info-group">
          <span class="debt-card__info-label">${STRINGS.LIST_LABEL_DUE_DATE}</span>
          <span class="debt-card__info-value">${debt.dueDate}</span>
        </div>
      </div>
    </div>
  `;
}

function getBadgeClass(type) {
  switch (type) {
    case 'Pinjaman Online':
      return 'badge--danger';
    case 'Kartu Kredit':
      return 'badge--warning';
    case 'KPR':
      return 'badge--info';
    case 'Leasing/KKB':
      return 'badge--primary';
    default:
      return 'badge--gray';
  }
}
