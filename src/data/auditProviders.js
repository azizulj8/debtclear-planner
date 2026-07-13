/**
 * Popular legal lending providers in Indonesia, used by the debt-audit
 * checklist ("punya akun di sini? cek tagihannya"). Also the future seed
 * for provider presets (backlog #5).
 */
export const AUDIT_PROVIDERS = [
  // Paylater (attached to apps people already use — most often forgotten)
  { id: 'spaylater', name: 'SPayLater (Shopee)', category: 'PayLater' },
  { id: 'gopaylater', name: 'GoPay Later', category: 'PayLater' },
  { id: 'kredivo', name: 'Kredivo', category: 'PayLater' },
  { id: 'akulaku', name: 'Akulaku', category: 'PayLater' },
  { id: 'indodana', name: 'Indodana', category: 'PayLater' },
  { id: 'traveloka-paylater', name: 'Traveloka PayLater', category: 'PayLater' },
  { id: 'oneklik-paylater', name: 'Blibli PayLater', category: 'PayLater' },

  // Pinjol / cash loan apps
  { id: 'adakami', name: 'AdaKami', category: 'Pinjol' },
  { id: 'kredit-pintar', name: 'Kredit Pintar', category: 'Pinjol' },
  { id: 'easycash', name: 'Easycash', category: 'Pinjol' },
  { id: 'julo', name: 'JULO', category: 'Pinjol' },
  { id: 'rupiah-cepat', name: 'Rupiah Cepat', category: 'Pinjol' },
  { id: 'maucash', name: 'Maucash', category: 'Pinjol' },
  { id: 'uangme', name: 'UangMe', category: 'Pinjol' },
  { id: 'adapundi', name: 'AdaPundi', category: 'Pinjol' },
  { id: 'danamas', name: 'Danamas', category: 'Pinjol' },

  // Multiguna / bank-adjacent
  { id: 'home-credit', name: 'Home Credit', category: 'Cicilan Barang' },
  { id: 'kartu-kredit', name: 'Kartu Kredit Bank', category: 'Bank' },
  { id: 'kta-bank', name: 'KTA Bank', category: 'Bank' },
];

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
