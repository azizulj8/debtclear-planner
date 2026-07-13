import { STRINGS } from '../data/strings.js';
import { getCurrentUser, signOut } from '../utils/supabase.js';
import { renderAuthModal } from './AuthModal.js';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { id: 'bills', label: 'Tagihan', path: '/bills', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>' },
  { id: 'debts', label: 'Utang Saya', path: '/debts', icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
  { id: 'strategy', label: 'Strategi', path: '/strategy', icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
  { id: 'audit', label: 'Audit Utang', path: '/audit', icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
  { id: 'simulate', label: 'Simulasi Pinjam', path: '/simulate', icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="8" y2="12.01"/><line x1="12" y1="12" x2="12" y2="12.01"/><line x1="16" y1="12" x2="16" y2="12.01"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="12" y1="16" x2="12" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/>' },
  { id: 'pricing', label: 'Upgrade Pro', path: '/pricing', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
];

const navigate = (path) => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
};

/**
 * Renders the app shell: fixed left sidebar with the feature menu,
 * fixed top bar (page title, theme toggle, account), and a content
 * area. Returns the content element for the page to render into.
 *
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {string} options.title - Page title shown in the top bar
 * @param {string} options.active - Active MENU_ITEMS id
 * @returns {Promise<HTMLElement>} The content element
 */
export async function renderAppShell(container, { title, active }) {
  const currentUser = await getCurrentUser();
  const currentTheme = localStorage.getItem('debtclear_theme') || 'dark';

  const menuHTML = MENU_ITEMS.map(item => `
    <button type="button" class="nav-item ${item.id === active ? 'nav-item--active' : ''}" data-path="${item.path}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
      <span>${item.label}</span>
    </button>
  `).join('');

  const authHTML = currentUser
    ? `
      <div class="flex items-center gap-2" style="font-size: var(--font-size-sm);">
        <span id="sync-indicator" title="Tersinkronisasi dengan cloud" style="cursor: help; opacity: 0.8;">☁️</span>
        <span class="text-secondary shell-user-email">${currentUser.email}</span>
        <button type="button" class="btn btn--secondary btn--sm" id="shell-logout">Keluar</button>
      </div>
    `
    : `
      <button type="button" class="btn btn--primary btn--sm" id="shell-login">🔑 Masuk</button>
    `;

  container.innerHTML = `
    <div class="shell">
      <aside class="shell-sidebar" id="shell-sidebar">
        <div class="shell-sidebar__brand brand-logo" id="shell-brand" style="cursor:pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <nav class="shell-sidebar__nav">
          ${menuHTML}
        </nav>
        <div class="shell-sidebar__footer">
          <button type="button" class="nav-item" id="shell-theme-toggle">
            <span style="font-size: 1rem;">${currentTheme === 'light' ? '🌙' : '☀️'}</span>
            <span>Tema ${currentTheme === 'light' ? 'Gelap' : 'Terang'}</span>
          </button>
        </div>
      </aside>
      <div class="shell-overlay" id="shell-overlay"></div>

      <div class="shell-main">
        <header class="shell-topbar">
          <div class="flex items-center gap-3">
            <button type="button" class="burger-menu-btn shell-burger" id="shell-burger" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
            <h1 class="shell-topbar__title">${title}</h1>
          </div>
          <div class="flex items-center gap-2" id="shell-auth-area">
            ${authHTML}
          </div>
        </header>
        <main class="shell-content" id="shell-content"></main>
      </div>
    </div>
  `;

  // Navigation
  container.querySelectorAll('.nav-item[data-path]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.getAttribute('data-path')));
  });
  container.querySelector('#shell-brand').addEventListener('click', () => navigate('/'));

  // Mobile drawer
  const sidebar = container.querySelector('#shell-sidebar');
  const overlay = container.querySelector('#shell-overlay');
  const burger = container.querySelector('#shell-burger');
  const closeDrawer = () => {
    sidebar.classList.remove('shell-sidebar--open');
    overlay.classList.remove('shell-overlay--visible');
  };
  burger.addEventListener('click', () => {
    sidebar.classList.toggle('shell-sidebar--open');
    overlay.classList.toggle('shell-overlay--visible');
  });
  overlay.addEventListener('click', closeDrawer);

  // Theme toggle
  container.querySelector('#shell-theme-toggle').addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('debtclear_theme', newTheme);
    // Re-render current route so charts pick up the new grid colors
    navigate(window.location.pathname + window.location.search);
  });

  // Auth
  const loginBtn = container.querySelector('#shell-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      renderAuthModal(() => navigate(window.location.pathname));
    });
  }
  const logoutBtn = container.querySelector('#shell-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut();
      navigate(window.location.pathname);
    });
  }

  // Cloud sync indicator updates
  window.addEventListener('sync-state-change', (e) => {
    const indicator = container.querySelector('#sync-indicator');
    if (!indicator) return;
    const { syncing, error } = e.detail;
    if (syncing) {
      indicator.textContent = '🔄';
      indicator.title = 'Sedang mensinkronisasi dengan cloud...';
      indicator.style.animation = 'spin 1s linear infinite';
    } else if (error) {
      indicator.textContent = '⚠️';
      indicator.title = 'Sinkronisasi gagal. Cek koneksi internet Anda.';
      indicator.style.animation = 'none';
    } else {
      indicator.textContent = '☁️';
      indicator.title = 'Tersinkronisasi dengan cloud';
      indicator.style.animation = 'none';
    }
  });

  // Trigger background sync when authenticated
  if (currentUser) {
    import('../utils/sync.js').then(({ syncAll }) => syncAll(currentUser.id));
  }

  return container.querySelector('#shell-content');
}
