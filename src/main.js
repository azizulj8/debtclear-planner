import './styles/index.css';
import './styles/pages.css';
import './styles/components.css';
import { renderLandingPage } from './pages/LandingPage.js';
import { renderDebtForm } from './components/DebtForm.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderPricingPage } from './pages/PricingPage.js';
import { renderDebtDetailPage } from './pages/DebtDetailPage.js';
import { renderQuickAddPage } from './pages/QuickAddPage.js';
import { renderAuditPage } from './pages/AuditPage.js';
import { requestNotificationPermission, scheduleNativeReminders } from './utils/notifications.js';
import { getAllDebts, backfillProviderIds } from './utils/storage.js';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';


const appContainer = document.querySelector('#app');

// Link pre-provider debts to presets, then sync reminders at startup
backfillProviderIds().catch(err => console.warn('Provider backfill failed:', err));

// Request notifications permission and sync reminders at startup
requestNotificationPermission().then(() => {
  getAllDebts().then(debts => {
    scheduleNativeReminders(debts);
  });
});

// Simple routing mechanism
function renderRoute(path) {
  // Normalize path if it contains query params (pathname itself doesn't, but let's be safe)
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/' || cleanPath === '/index.html') {
    renderLandingPage(appContainer);
  } else if (cleanPath === '/dashboard') {
    renderDashboardPage(appContainer);
  } else if (cleanPath === '/pricing') {
    renderPricingPage(appContainer);
  } else if (cleanPath === '/add-debt' || cleanPath === '/edit-debt') {
    renderDebtForm(appContainer);
  } else if (cleanPath === '/debt-detail') {
    renderDebtDetailPage(appContainer);
  } else if (cleanPath === '/quick-add') {
    renderQuickAddPage(appContainer);
  } else if (cleanPath === '/audit') {
    renderAuditPage(appContainer);
  } else {
    appContainer.innerHTML = '<div class="container mt-4"><h1>404 Not Found</h1></div>';
  }


  // Hide native splash screen if running on device
  if (Capacitor.isNativePlatform()) {
    SplashScreen.hide().catch(err => {
      console.warn('Failed to hide splash screen:', err);
    });
  }
}


// Initial render
renderRoute(window.location.pathname);

// Listen for custom navigation events
window.addEventListener('navigate', (e) => {
  const path = e.detail.path;
  window.history.pushState({}, '', path);
  renderRoute(path);
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname);
});

// Register PWA Service Worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });
}

