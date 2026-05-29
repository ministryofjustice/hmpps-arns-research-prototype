//
// Persist session completion events to the local server log
//

import { analyseSessionTelemetry, getSessionTelemetry, getTelemetrySessionId } from './tiering-session-telemetry.js'

const sendEvent = (event) => {
  const url = '/api/telemetry/event'

  try {
    const payload = new Blob([JSON.stringify(event)], { type: 'application/json' })
    if (navigator.sendBeacon(url, payload)) return
  } catch (e) {
    // ignore
  }

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true
    })
  } catch (e) {
    // ignore
  }
}

export const recordCalculateScore = () => {
  const telemetry = getSessionTelemetry()
  const sessionId = getTelemetrySessionId()
  if (!sessionId) return

  // If declined/no consent, persist a minimal entry only.
  if (telemetry.consent !== 'agreed') {
    sendEvent({ sessionId, type: 'completed', consent: telemetry.consent || null, results: null })
    return
  }

  const analysis = analyseSessionTelemetry()

  sendEvent({
    sessionId,
    type: 'completed',
    consent: telemetry.consent,
    usabilityScore: analysis.usabilityScore,
    bandTitle: analysis.band?.title || null,
    results: {
      usabilityScore: analysis.usabilityScore,
      band: analysis.band,
      insights: analysis.insights,
      categories: analysis.categories
    }
  })
}

export const recordSectionComplete = () => {
  const telemetry = getSessionTelemetry()
  const sessionId = getTelemetrySessionId()
  if (!sessionId) return

  if (telemetry.consent !== 'agreed') return

  sendEvent({ sessionId, type: 'sectionComplete', consent: telemetry.consent })
}
