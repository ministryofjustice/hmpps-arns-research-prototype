//
// Side navigation – clickable in the prototype, navigation disabled until pages exist
//

import { trackTelemetrySideNavClick } from './tiering-session-telemetry.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const nav = document.querySelector('.assessment-side-navigation')
  if (!nav) return

  nav.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const sectionLabel = link.textContent?.trim() || 'Unknown section'
      trackTelemetrySideNavClick(sectionLabel, true)
    })
  })
})
