import { getProviderById } from '../data/auditProviders.js';

/**
 * Groups monthly bills by provider. Debts on a consolidated-billing
 * provider (e.g. Kredivo) collapse into ONE bill row — in reality they
 * are paid as a single accumulated payment. Everything else stays as
 * individual rows.
 *
 * @param {Array} debts - Debts to show for the month
 * @returns {Array} Rows sorted by due date:
 *   { type: 'single', debt, provider } |
 *   { type: 'group', provider, debts, total, dueDate }
 */
export function groupBillsByProvider(debts) {
  const groups = new Map();
  const rows = [];

  for (const debt of debts) {
    const provider = debt.providerId ? getProviderById(debt.providerId) : null;

    if (provider && provider.billing === 'consolidated') {
      let group = groups.get(provider.id);
      if (!group) {
        group = { type: 'group', provider, debts: [], total: 0, dueDate: Infinity };
        groups.set(provider.id, group);
        rows.push(group);
      }
      group.debts.push(debt);
      group.total += debt.minPayment;
      // The combined bill is due at the earliest due day among its loans
      group.dueDate = Math.min(group.dueDate, debt.dueDate);
    } else {
      rows.push({ type: 'single', debt, provider });
    }
  }

  const dueOf = row => (row.type === 'group' ? row.dueDate : row.debt.dueDate);
  return rows.sort((a, b) => dueOf(a) - dueOf(b));
}
