import { supabase, getUserSubscription } from '../utils/supabase.js';

export function showPaymentModal(onSuccessCallback) {
  const modalHTML = `
    <div class="modal-overlay" id="payment-modal">
      <div class="modal-box" style="max-width: 400px; text-align: center; padding: var(--spacing-6);">
        <div class="modal-header" style="justify-content: flex-end; border: none; padding: 0;">
          <button type="button" class="modal-close" id="payment-modal-close" style="font-size: 1.5rem; background: none; border: none; color: var(--color-text-secondary); cursor: pointer;">&times;</button>
        </div>
        
        <div class="modal-body mt-2">
          <div id="payment-loading-state">
            <div class="spinner mb-4" style="margin: 0 auto; width: 40px; height: 40px; border: 4px solid rgba(15, 157, 88, 0.2); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h4>Menyiapkan Tagihan Pembayaran</h4>
            <p class="text-secondary mt-2" style="font-size: var(--font-size-sm);">Kami sedang membuat invoice QRIS aman Anda via Xendit...</p>
          </div>

          <div id="payment-ready-state" style="display: none;">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-4);">📱</div>
            <h3 class="text-primary mb-2">Pembayaran Siap!</h3>
            <p class="mb-6" style="font-size: var(--font-size-sm);">Satu langkah lagi untuk menjadi member **Pro**. Invoice pembayaran Anda telah dibuka di tab baru.</p>
            
            <div class="alert alert--success mb-6" style="font-size: var(--font-size-sm); text-align: left; padding: var(--spacing-3); border-radius: var(--radius-md);">
              💡 <strong>Petunjuk:</strong><br/>
              1. Selesaikan pembayaran di halaman Xendit.<br/>
              2. Halaman ini akan mendeteksi otomatis jika pembayaran Anda sukses.
            </div>

            <button type="button" class="btn btn--primary w-full" id="btn-reopen-invoice" style="width: 100%; font-weight: 600; padding: var(--spacing-3); margin-bottom: var(--spacing-3);">
              Buka Ulang Halaman Pembayaran
            </button>
            
            <div class="flex items-center justify-center gap-2 text-secondary" style="font-size: var(--font-size-xs);">
              <span class="spinner" style="width: 12px; height: 12px; border: 1.5px solid rgba(255,255,255,0.3); border-top-color: var(--color-text-secondary); border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
              Menunggu konfirmasi pembayaran...
            </div>
          </div>

          <div id="payment-error-state" style="display: none;">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-4);">⚠️</div>
            <h3 class="text-danger mb-2">Gagal Membuat Tagihan</h3>
            <p class="text-secondary mb-6" id="payment-error-message" style="font-size: var(--font-size-sm);"></p>
            <button type="button" class="btn btn--secondary w-full" id="btn-retry-payment" style="width: 100%;">Coba Lagi</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing if any
  let modal = document.getElementById('payment-modal');
  if (modal) {
    modal.remove();
  }
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  modal = document.getElementById('payment-modal');

  setTimeout(() => modal.classList.add('active'), 10);

  const closeBtn = modal.querySelector('#payment-modal-close');
  const loadingState = modal.querySelector('#payment-loading-state');
  const readyState = modal.querySelector('#payment-ready-state');
  const errorState = modal.querySelector('#payment-error-state');
  const errorMsg = modal.querySelector('#payment-error-message');
  const retryBtn = modal.querySelector('#btn-retry-payment');
  const reopenBtn = modal.querySelector('#btn-reopen-invoice');

  let invoiceUrl = '';
  let pollingInterval = null;

  const closeModal = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const createInvoice = async () => {
    loadingState.style.display = 'block';
    readyState.style.display = 'none';
    errorState.style.display = 'none';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Anda harus login terlebih dahulu.');
      }

      // Invoke Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || !data || !data.invoice_url) {
        throw new Error(error?.message || 'Gagal menerima link invoice dari server.');
      }

      invoiceUrl = data.invoice_url;
      
      // Open in a new tab/window
      window.open(invoiceUrl, '_blank');

      // Update UI state
      loadingState.style.display = 'none';
      readyState.style.display = 'block';

      // Start polling database subscription status
      startPolling(session.user.id);

    } catch (err) {
      console.error('Payment preparation failed:', err);
      loadingState.style.display = 'none';
      errorMsg.textContent = err.message || 'Terjadi kesalahan koneksi internet.';
      errorState.style.display = 'block';
    }
  };

  const startPolling = (userId) => {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
      console.log('Polling subscription status...');
      const sub = await getUserSubscription(userId);
      if (sub && sub.status === 'active' && new Date(sub.expires_at) > new Date()) {
        console.log('Payment success detected!');
        clearInterval(pollingInterval);
        alert('🎉 Pembayaran sukses! Anda sekarang aktif sebagai member DebtClear Pro.');
        closeModal();
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      }
    }, 4000); // Poll every 4 seconds
  };

  reopenBtn.addEventListener('click', () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  });

  retryBtn.addEventListener('click', createInvoice);

  // Trigger invoice creation on load
  createInvoice();
}
