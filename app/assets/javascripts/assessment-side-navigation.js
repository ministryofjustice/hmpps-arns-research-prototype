//
// Assessment section navigation – prototype only; links do not navigate
//

import { trackTelemetrySideNavClick } from './tiering-session-telemetry.js'

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('.assessment-section-navigation a[href="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const sectionLabel =
        link.querySelector('.assessment-section-navigation__label')?.textContent?.trim() ||
        link.textContent?.trim() ||
        'Unknown section'
      trackTelemetrySideNavClick(sectionLabel, true)
    })
  })
})
