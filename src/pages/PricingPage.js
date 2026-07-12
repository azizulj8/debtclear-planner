import { STRINGS } from '../data/strings.js';
import { getCurrentUser, getUserSubscription } from '../utils/supabase.js';
import { renderAuthModal } from '../components/AuthModal.js';

export async function renderPricingPage(container) {
  const currentUser = await getCurrentUser();
  let subscription = null;
  let isPro = false;

  if (currentUser) {
    subscription = await getUserSubscription(currentUser.id);
    if (subscription) {
      isPro = subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
    }
  }

  const currentTheme = localStorage.getItem('debtclear_theme') || 'dark';

  let statusSectionHTML = '';
  if (currentUser) {
    if (isPro) {
      const expiryDate = new Date(subscription.expires_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      statusSectionHTML = `
        <div class="alert alert--success mb-6 text-center" style="max-width: 600px; margin: 0 auto var(--spacing-6) auto; padding: var(--spacing-4); border-radius: var(--radius-md);">
          🎉 <strong>Akun Anda adalah Pro!</strong> Langganan Anda aktif hingga <strong>${expiryDate}</strong>. Terima kasih atas dukungan Anda!
        </div>
      `;
    } else {
      statusSectionHTML = `
        <div class="alert alert--danger mb-6 text-center" style="max-width: 600px; margin: 0 auto var(--spacing-6) auto; padding: var(--spacing-4); border-radius: var(--radius-md);">
          💡 Akun Anda saat ini menggunakan <strong>Plan Free</strong>. Upgrade ke Pro untuk membuka fitur lengkap.
        </div>
      `;
    }
  }

  container.innerHTML = `
    <header class="app-header">
      <div class="container flex justify-between items-center">
        <div class="brand-logo" id="logo-pricing" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <div>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-back-dashboard">
            ⬅️ Kembali ke Dashboard
          </button>
        </div>
      </div>
    </header>

    <main class="container mt-8 mb-12">
      <div class="text-center mb-8">
        <h1 class="mb-2">Pilih Plan Terbaik Anda</h1>
        <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">Bebas dari utang dan pinjol secara terencana dengan visualisasi dan sinkronisasi data cloud yang aman.</p>
      </div>

      ${statusSectionHTML}

      <div class="pricing-grid grid" style="max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-6);">
        
        <!-- Free Plan -->
        <div class="pricing-card" style="border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--spacing-6); background-color: var(--color-surface); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 class="mb-2">Free Plan</h3>
            <p class="text-secondary mb-4" style="font-size: var(--font-size-sm);">Kalkulator pelunasan dasar untuk penggunaan personal satu perangkat.</p>
            <div class="price mb-6" style="font-size: 2rem; font-weight: 700; color: var(--color-text);">
              Rp 0 <span style="font-size: var(--font-size-sm); font-weight: normal; color: var(--color-text-secondary);">/ selamanya</span>
            </div>
            
            <ul style="list-style: none; padding: 0; margin: 0; font-size: var(--font-size-sm);">
              <li class="mb-3">✅ Tambah hingga 10 Data Utang</li>
              <li class="mb-3">✅ Simulasi Snowball & Avalanche</li>
              <li class="mb-3">✅ Grafik Grafik Timeline Interaktif</li>
              <li class="mb-3">❌ Simpan Data di Cloud (Supabase)</li>
              <li class="mb-3">❌ Sinkronisasi Multi-Perangkat</li>
              <li class="mb-3">❌ Ekspor PDF Tanpa Watermark</li>
            </ul>
          </div>
          
          <button type="button" class="btn btn--secondary w-full mt-6" id="btn-free-action" style="width: 100%;" disabled>
            Plan Anda Saat Ini
          </button>
        </div>

        <!-- Pro Plan -->
        <div class="pricing-card" style="border: 2px solid var(--color-primary); border-radius: var(--radius-lg); padding: var(--spacing-6); background-color: var(--color-surface); display: flex; flex-direction: column; justify-content: space-between; position: relative; box-shadow: 0 4px 20px rgba(15, 157, 88, 0.15);">
          <span style="position: absolute; top: -12px; right: var(--spacing-6); background-color: var(--color-primary); color: white; padding: 2px 10px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600;">POPULAR</span>
          
          <div>
            <h3 class="mb-2">Pro Plan</h3>
            <p class="text-secondary mb-4" style="font-size: var(--font-size-sm);">Akses penuh fitur premium, sinkronisasi otomatis, dan ekspor bersih.</p>
            <div class="price mb-6" style="font-size: 2rem; font-weight: 700; color: var(--color-primary);">
              Rp 29.900 <span style="font-size: var(--font-size-sm); font-weight: normal; color: var(--color-text-secondary);">/ bulan</span>
            </div>
            
            <ul style="list-style: none; padding: 0; margin: 0; font-size: var(--font-size-sm);">
              <li class="mb-3">✅ Tambah Utang Tanpa Batas</li>
              <li class="mb-3">✅ Simulasi Snowball & Avalanche</li>
              <li class="mb-3">✅ Grafik Timeline Interaktif</li>
              <li class="mb-3">✅ Simpan Data di Cloud (Supabase)</li>
              <li class="mb-3">✅ Sinkronisasi Multi-Perangkat</li>
              <li class="mb-3">✅ Ekspor PDF Tanpa Watermark</li>
            </ul>
          </div>
          
          <button type="button" class="btn btn--primary w-full mt-6" id="btn-pro-action" style="width: 100%; font-weight: 600;">
            ${isPro ? 'Sudah Aktif' : 'Upgrade ke Pro'}
          </button>
        </div>
      </div>
    </main>
  `;

  // Attach navigation listeners
  container.querySelector('#logo-pricing').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
  });

  container.querySelector('#btn-back-dashboard').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
  });

  const proBtn = container.querySelector('#btn-pro-action');
  if (proBtn) {
    if (isPro) {
      proBtn.disabled = true;
      proBtn.style.opacity = '0.7';
    } else {
      proBtn.addEventListener('click', async () => {
        if (!currentUser) {
          // If not logged in, show auth modal first
          renderAuthModal(() => {
            renderPricingPage(container);
          });
        } else {
          // Logged in but not Pro -> Trigger payment flow (handled in P4)
          // Dispatch a custom event to show payment modal
          window.dispatchEvent(new CustomEvent('open-payment-modal'));
        }
      });
    }
  }

  // Update Free button disabled status based on if user is actually free
  const freeBtn = container.querySelector('#btn-free-action');
  if (freeBtn) {
    if (!currentUser || !isPro) {
      freeBtn.textContent = 'Plan Anda Saat Ini';
      freeBtn.disabled = true;
    } else {
      freeBtn.textContent = 'Kembali ke Free';
      freeBtn.disabled = true; // Free plan downgrade not handled locally
    }
  }
}
