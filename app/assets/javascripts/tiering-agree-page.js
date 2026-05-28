//
// Research consent (agree page)
//

import { setTelemetryConsent } from './tiering-session-telemetry.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const agreeButton = document.querySelector('[data-telemetry-consent="agree"]')
  const declineButton = document.querySelector('[data-telemetry-consent="decline"]')

  if (!agreeButton && !declineButton) return

  agreeButton?.addEventListener('click', (event) => {
    event.preventDefault()
    setTelemetryConsent(true)
    window.location.href = 'a1.html'
  })

  declineButton?.addEventListener('click', (event) => {
    event.preventDefault()
    setTelemetryConsent(false)
    window.location.href = 'a1.html'
  })
})
