import { STRINGS } from '../data/strings.js'

/**
 * Renders the Landing Page into the given container.
 * @param {HTMLElement} container - The DOM element to render into
 */
export function renderLandingPage(container) {
  container.innerHTML = `
    <header class="landing-header">
      <div class="container">
        <div class="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <nav>
          <!-- Future login button here -->
        </nav>
      </div>
    </header>

    <main>
      <section class="hero-section fade-in">
        <div class="container">
          <h1 class="hero-title">${STRINGS.LANDING_HERO_TITLE}</h1>
          <p class="hero-subtitle">${STRINGS.LANDING_HERO_SUBTITLE}</p>
          <button class="btn btn--primary" id="start-app-btn" style="padding: 12px 24px; font-size: 1.125rem;">
            ${STRINGS.LANDING_CTA_BUTTON}
          </button>
          <p class="text-secondary mt-3" style="font-size: var(--font-size-sm);">
            🔒 ${STRINGS.LANDING_PRIVACY_NOTE}
          </p>
        </div>
      </section>

      <section class="features-section fade-in">
        <div class="container">
          <h2 class="section-title">${STRINGS.LANDING_FEATURES_TITLE}</h2>
          <div class="features-grid">
            
            <div class="feature-card card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <h3 class="feature-title">${STRINGS.LANDING_FEATURE_1_TITLE}</h3>
              <p class="feature-desc">${STRINGS.LANDING_FEATURE_1_DESC}</p>
            </div>

            <div class="feature-card card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <h3 class="feature-title">${STRINGS.LANDING_FEATURE_2_TITLE}</h3>
              <p class="feature-desc">${STRINGS.LANDING_FEATURE_2_DESC}</p>
            </div>

            <div class="feature-card card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <h3 class="feature-title">${STRINGS.LANDING_FEATURE_3_TITLE}</h3>
              <p class="feature-desc">${STRINGS.LANDING_FEATURE_3_DESC}</p>
            </div>

          </div>
        </div>
      </section>

      <section class="how-it-works-section fade-in">
        <div class="container">
          <h2 class="section-title">${STRINGS.LANDING_HOW_IT_WORKS_TITLE}</h2>
          <div class="steps-list">
            
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>${STRINGS.LANDING_STEP_1_TITLE}</h3>
                <p>${STRINGS.LANDING_STEP_1_DESC}</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>${STRINGS.LANDING_STEP_2_TITLE}</h3>
                <p>${STRINGS.LANDING_STEP_2_DESC}</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>${STRINGS.LANDING_STEP_3_TITLE}</h3>
                <p>${STRINGS.LANDING_STEP_3_DESC}</p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>

    <footer class="landing-footer">
      <div class="container">
        <p>${STRINGS.LANDING_FOOTER_COPYRIGHT}</p>
      </div>
    </footer>
  `

  // Attach event listener for the CTA button
  container.querySelector('#start-app-btn').addEventListener('click', () => {
    // In a real app, this would use a router.
    // For now, we will dispatch a custom event to signify routing to dashboard.
    const event = new CustomEvent('navigate', { detail: { path: '/dashboard' } })
    window.dispatchEvent(event)
  })

  // Setup Intersection Observer for fade-in animations
  const fadeElements = container.querySelectorAll('.fade-in')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1 }
  )

  fadeElements.forEach((el) => observer.observe(el))
}
