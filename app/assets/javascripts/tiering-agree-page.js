//
// Research consent (agree page)
//

import { isSessionTelemetryUiEnabled, setTelemetryConsent } from './tiering-session-telemetry.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const agreeButton = document.querySelector('[data-telemetry-consent="agree"]')
  const declineButton = document.querySelector('[data-telemetry-consent="decline"]')

  if (!agreeButton && !declineButton) return

  // This script loads on every page; only redirect when actually on agree.html.
  if (!isSessionTelemetryUiEnabled()) {
    window.location.replace('/01/a1.html')
    return
  }

  agreeButton?.addEventListener('click', (event) => {
    event.preventDefault()
    setTelemetryConsent(true)
    window.location.href = '/01/a1.html'
  })

  declineButton?.addEventListener('click', (event) => {
    event.preventDefault()
    setTelemetryConsent(false)
    window.location.href = '/01/a1.html'
  })
})
