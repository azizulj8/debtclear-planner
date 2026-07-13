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

/**
 * Merges consolidated-provider debts into one virtual debt for the payoff
 * strategy engine. Kredivo-style providers demand full settlement across
 * all loans at once, so Snowball/Avalanche cannot eliminate one of their
 * loans separately — treating them as a single debt keeps the plan
 * executable in the real world.
 *
 * @param {Array} debts
 * @returns {Array} Debts with each consolidated provider collapsed into one
 */
export function mergeConsolidatedDebts(debts) {
  const rows = groupBillsByProvider(debts);
  return rows.map(row => {
    if (row.type === 'single') return row.debt;

    const principal = row.debts.reduce((s, d) => s + d.principal, 0);
    // Weighted average rate so total interest stays representative
    const weightedRate = principal > 0
      ? row.debts.reduce((s, d) => s + d.interestRate * d.principal, 0) / principal
      : 0;

    return {
      id: `provider:${row.provider.id}`,
      name: `${row.provider.name} (gabungan)`,
      type: row.debts[0].type,
      principal,
      minPayment: row.total,
      interestRate: Math.round(weightedRate * 10) / 10,
      dueDate: row.dueDate,
      isPaidOff: false,
    };
  });
}
