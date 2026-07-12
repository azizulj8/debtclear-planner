import { signIn, signUp } from '../utils/supabase.js';

export function renderAuthModal(onSuccessCallback) {
  const modalHTML = `
    <div class="modal-overlay" id="auth-modal">
      <div class="modal-box" style="max-width: 420px;">
        <div class="modal-header">
          <div class="flex gap-4" style="border-bottom: 2px solid var(--color-border); width: 100%;">
            <button type="button" class="auth-tab-btn active" id="tab-login" style="background: none; border: none; padding: var(--spacing-2) var(--spacing-4); color: var(--color-text); font-weight: 600; cursor: pointer; border-bottom: 2px solid var(--color-primary); margin-bottom: -2px;">Masuk</button>
            <button type="button" class="auth-tab-btn" id="tab-register" style="background: none; border: none; padding: var(--spacing-2) var(--spacing-4); color: var(--color-text-secondary); font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;">Daftar Akun</button>
          </div>
          <button type="button" class="modal-close" id="auth-modal-close" style="font-size: 1.5rem; background: none; border: none; color: var(--color-text-secondary); cursor: pointer;">&times;</button>
        </div>
        <div class="modal-body mt-4">
          <div id="auth-error-alert" class="alert alert--danger mb-4" style="display: none; padding: var(--spacing-3); border-radius: var(--radius-md); font-size: var(--font-size-sm);"></div>
          
          <form id="auth-form">
            <div class="form-group mb-4">
              <label for="auth-email" class="form-label" style="display: block; margin-bottom: var(--spacing-1); font-weight: 500; font-size: var(--font-size-sm);">Alamat Email</label>
              <input type="email" id="auth-email" class="form-input" placeholder="contoh@email.com" required style="width: 100%; padding: var(--spacing-3); background-color: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text);" />
            </div>
            
            <div class="form-group mb-4">
              <label for="auth-password" class="form-label" style="display: block; margin-bottom: var(--spacing-1); font-weight: 500; font-size: var(--font-size-sm);">Password</label>
              <input type="password" id="auth-password" class="form-input" placeholder="Minimal 8 karakter" required minlength="8" style="width: 100%; padding: var(--spacing-3); background-color: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text);" />
            </div>
            
            <button type="submit" class="btn btn--primary w-full mt-2" id="btn-auth-submit" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--spacing-2); font-weight: 600; padding: var(--spacing-3);">
              <span id="auth-btn-text">Masuk</span>
              <span class="spinner" id="auth-spinner" style="display: none; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  let modal = document.getElementById('auth-modal');
  if (modal) {
    modal.remove();
  }
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  modal = document.getElementById('auth-modal');

  // Trigger browser fade-in animation
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);

  const tabLogin = modal.querySelector('#tab-login');
  const tabRegister = modal.querySelector('#tab-register');
  const closeBtn = modal.querySelector('#auth-modal-close');
  const authForm = modal.querySelector('#auth-form');
  const emailInput = modal.querySelector('#auth-email');
  const passwordInput = modal.querySelector('#auth-password');
  const errorAlert = modal.querySelector('#auth-error-alert');
  const btnText = modal.querySelector('#auth-btn-text');
  const spinner = modal.querySelector('#auth-spinner');
  const submitBtn = modal.querySelector('#btn-auth-submit');

  let currentMode = 'login'; // 'login' or 'register'

  const closeModal = () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Switch tabs
  tabLogin.addEventListener('click', () => {
    if (currentMode === 'login') return;
    currentMode = 'login';
    tabLogin.style.borderBottom = '2px solid var(--color-primary)';
    tabLogin.style.color = 'var(--color-text)';
    tabRegister.style.borderBottom = '2px solid transparent';
    tabRegister.style.color = 'var(--color-text-secondary)';
    btnText.textContent = 'Masuk';
    errorAlert.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    if (currentMode === 'register') return;
    currentMode = 'register';
    tabRegister.style.borderBottom = '2px solid var(--color-primary)';
    tabRegister.style.color = 'var(--color-text)';
    tabLogin.style.borderBottom = '2px solid transparent';
    tabLogin.style.color = 'var(--color-text-secondary)';
    btnText.textContent = 'Daftar Akun';
    errorAlert.style.display = 'none';
  });

  // Handle Form Submission
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) return;

    // Show loading state
    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = currentMode === 'login' ? 'Menghubungkan...' : 'Mendaftar...';

    try {
      let response;
      if (currentMode === 'login') {
        response = await signIn(email, password);
      } else {
        response = await signUp(email, password);
      }

      const { data, error } = response;

      if (error) {
        throw error;
      }

      // Success
      if (currentMode === 'register' && data?.user && data?.session === null) {
        // Sign up success but needs email confirmation
        alert('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi akun.');
        closeModal();
      } else {
        // Login success or auto-login after sign up
        closeModal();
        if (onSuccessCallback) {
          onSuccessCallback(data.user);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      let localizedMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.';
      
      if (err.message === 'Invalid login credentials') {
        localizedMessage = 'Email atau password salah!';
      } else if (err.message === 'User already registered') {
        localizedMessage = 'Alamat email sudah terdaftar!';
      } else if (err.message) {
        localizedMessage = err.message;
      }
      
      errorAlert.textContent = localizedMessage;
      errorAlert.style.display = 'block';

      // Reset button
      submitBtn.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = currentMode === 'login' ? 'Masuk' : 'Daftar Akun';
    }
  });
}
