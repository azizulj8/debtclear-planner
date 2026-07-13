/**
 * Popular legal lending providers in Indonesia. Used by the debt-audit
 * checklist and as provider presets for bill grouping.
 *
 * billing:
 *   'consolidated' - all active loans accumulate into ONE monthly bill
 *                    (e.g. Kredivo: cannot pay a single loan separately)
 *   'per-loan'     - each loan is billed and payable on its own
 *                    (e.g. SPayLater: settle one, others keep running)
 * autodebit: payment is taken automatically; the user's job is ensuring
 *   balance, not transferring.
 */
export const AUDIT_PROVIDERS = [
  // Paylater (attached to apps people already use — most often forgotten)
  { id: 'spaylater', name: 'SPayLater (Shopee)', category: 'PayLater', billing: 'per-loan', autodebit: false },
  { id: 'gopaylater', name: 'GoPay Later', category: 'PayLater', billing: 'consolidated', autodebit: false },
  { id: 'kredivo', name: 'Kredivo', category: 'PayLater', billing: 'consolidated', autodebit: false },
  { id: 'akulaku', name: 'Akulaku', category: 'PayLater', billing: 'consolidated', autodebit: false },
  { id: 'indodana', name: 'Indodana', category: 'PayLater', billing: 'consolidated', autodebit: false },
  { id: 'traveloka-paylater', name: 'Traveloka PayLater', category: 'PayLater', billing: 'consolidated', autodebit: false },
  { id: 'oneklik-paylater', name: 'Blibli PayLater', category: 'PayLater', billing: 'consolidated', autodebit: false },

  // Pinjol / cash loan apps
  { id: 'adakami', name: 'AdaKami', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'kredit-pintar', name: 'Kredit Pintar', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'easycash', name: 'Easycash', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'julo', name: 'JULO', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'rupiah-cepat', name: 'Rupiah Cepat', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'maucash', name: 'Maucash', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'uangme', name: 'UangMe', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'adapundi', name: 'AdaPundi', category: 'Pinjol', billing: 'per-loan', autodebit: false },
  { id: 'danamas', name: 'Danamas', category: 'Pinjol', billing: 'per-loan', autodebit: false },

  // Multiguna / bank-adjacent
  { id: 'home-credit', name: 'Home Credit', category: 'Cicilan Barang', billing: 'per-loan', autodebit: false },
  { id: 'kartu-kredit', name: 'Kartu Kredit Bank', category: 'Bank', billing: 'consolidated', autodebit: true },
  { id: 'kta-bank', name: 'KTA Bank', category: 'Bank', billing: 'per-loan', autodebit: true },
];

/**
 * Finds the provider preset matching a debt/loan name (loose,
 * case-insensitive). Used to auto-link quick-added debts.
 * @param {string} name
 * @returns {Object|null}
 */
export function findProviderPreset(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return (
    AUDIT_PROVIDERS.find(p => {
      const providerName = p.name.toLowerCase();
      const primary = providerName.split(' ')[0];
      return lower.includes(primary) || providerName.includes(lower);
    }) || null
  );
}

/**
 * Looks up a provider preset by id.
 * @param {string} providerId
 * @returns {Object|null}
 */
export function getProviderById(providerId) {
  return AUDIT_PROVIDERS.find(p => p.id === providerId) || null;
}

/**
 * Checks whether a provider already appears in the user's recorded debts
 * (loose match: either name contains the other, case-insensitive).
 * @param {Object} provider - Entry from AUDIT_PROVIDERS
 * @param {Array} debts
 * @returns {boolean}
 */
export function isProviderRecorded(provider, debts) {
  const providerName = provider.name.toLowerCase();
  // Match on the primary word too, e.g. "SPayLater (Shopee)" -> "spaylater"
  const primary = providerName.split(' ')[0];
  return debts.some(d => {
    const debtName = d.name.toLowerCase();
    return (
      debtName.includes(primary) ||
      providerName.includes(debtName) ||
      (debtName.length > 3 && providerName.includes(debtName))
    );
  });
}
