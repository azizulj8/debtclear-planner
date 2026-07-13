import { STRINGS } from '../data/strings.js';
import { AUDIT_PROVIDERS, isProviderRecorded } from '../data/auditProviders.js';
import { getAllDebts } from '../utils/storage.js';

/**
 * Guided debt-audit page: a checklist of popular providers so users can
 * rediscover forgotten loans ("provider B") one app at a time, then record
 * each via quick-add prefilled with the provider name.
 * @param {HTMLElement} container
 */
export async function renderAuditPage(container) {
  let debts = [];
  try {
    debts = await getAllDebts();
  } catch (err) {
    console.error('Failed to load debts:', err);
  }

  const recordedCount = debts.filter(d => !d.isPaidOff).length;

  const categories = [...new Set(AUDIT_PROVIDERS.map(p => p.category))];

  const sectionsHTML = categories.map(category => {
    const rows = AUDIT_PROVIDERS
      .filter(p => p.category === category)
      .map(provider => {
        const recorded = isProviderRecorded(provider, debts);
        return `
          <div class="audit-row ${recorded ? 'audit-row--recorded' : ''}">
            <div class="audit-row__info">
              <span class="audit-row__name">${provider.name}</span>
              ${recorded ? '<span class="badge badge--success">✓ Sudah tercatat</span>' : ''}
            </div>
            <button type="button" class="btn ${recorded ? 'btn--secondary' : 'btn--primary'} btn--sm audit-record-btn" data-name="${provider.name}">
              ${recorded ? '+ Tambah lagi' : '⚡ Catat'}
            </button>
          </div>
        `;
      }).join('');

    return `
      <div class="mb-6">
        <h3 class="font-bold mb-2" style="font-size: var(--font-size-md);">${category}</h3>
        <div class="audit-list">${rows}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <header class="app-header">
      <div class="container flex justify-between items-center">
        <div class="brand-logo" id="logo-audit" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-audit-done">Selesai →</button>
      </div>
    </header>

    <main class="container mt-4 mb-12" style="max-width: 640px;">
      <div class="card mb-6">
        <h2 class="section-title" style="text-align:left;">🔍 Audit Utangmu</h2>
        <p class="text-secondary" style="font-size: var(--font-size-sm);">
          Kaget tagihan bulanan membengkak? Biasanya karena ada pinjaman yang terlupa.
          <strong>Buka satu-satu aplikasi di bawah ini di HP-mu</strong>, cek menu tagihan/limit,
          dan catat setiap pinjaman aktif yang kamu temukan. 2 menit sekarang, tidak ada kejutan bulan depan.
        </p>
        ${recordedCount > 0 ? `
          <div class="alert alert--success mt-3" style="padding: var(--spacing-2) var(--spacing-3); border-radius: var(--radius-md); font-size: var(--font-size-sm);">
            ${recordedCount} utang aktif sudah tercatat sejauh ini.
          </div>
        ` : ''}
      </div>

      ${sectionsHTML}

      <div class="card">
        <div class="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h3 class="font-bold" style="font-size: var(--font-size-md);">Pinjam di tempat lain?</h3>
            <p class="text-secondary" style="font-size: var(--font-size-xs);">Koperasi, teman, keluarga, atau provider yang tidak ada di daftar.</p>
          </div>
          <button type="button" class="btn btn--primary btn--sm" id="btn-audit-other">⚡ Catat</button>
        </div>
      </div>
    </main>
  `;

  const goDashboard = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
  };
  container.querySelector('#logo-audit').addEventListener('click', goDashboard);
  container.querySelector('#btn-audit-done').addEventListener('click', goDashboard);

  container.querySelectorAll('.audit-record-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { path: `/quick-add?name=${encodeURIComponent(name)}&from=audit` }
      }));
    });
  });

  container.querySelector('#btn-audit-other').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/quick-add?from=audit' } }));
  });
}
