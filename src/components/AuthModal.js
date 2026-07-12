import { signIn, signUp, signInWithGoogle } from '../utils/supabase.js';

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

          <div style="display: flex; align-items: center; margin: var(--spacing-4) 0;">
            <hr style="flex: 1; border: none; border-top: 1px solid var(--color-border);" />
            <span style="padding: 0 var(--spacing-3); color: var(--color-text-secondary); font-size: var(--font-size-xs); font-weight: 500;">ATAU</span>
            <hr style="flex: 1; border: none; border-top: 1px solid var(--color-border);" />
          </div>

          <button type="button" class="btn btn--secondary w-full" id="btn-auth-google" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--spacing-2); font-weight: 600; padding: var(--spacing-3); background-color: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Lanjutkan dengan Google
          </button>

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

  // Handle Google Auth
  const btnGoogle = modal.querySelector('#btn-auth-google');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      try {
        errorAlert.style.display = 'none';
        btnGoogle.disabled = true;
        btnGoogle.style.opacity = '0.7';
        btnGoogle.innerHTML = `<span class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid var(--color-text-secondary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span> Menghubungkan...`;
        
        const { error } = await signInWithGoogle();
        if (error) throw error;
        // Redirect happens automatically
      } catch (err) {
        console.error('Google Auth error:', err);
        errorAlert.textContent = 'Gagal terhubung dengan Google. Silakan coba lagi.';
        errorAlert.style.display = 'block';
        btnGoogle.disabled = false;
        btnGoogle.style.opacity = '1';
        btnGoogle.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Lanjutkan dengan Google
        `;
      }
    });
  }
}
