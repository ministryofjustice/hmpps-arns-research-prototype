//
// a7 – check your answers (summary list from session)
//

import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'
import { recordCalculateScore } from './tiering-session-history.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a7-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const summaryList = document.getElementById('tiering-summary-list')
  const backLink = document.getElementById('tiering-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (!session.offencesSinceCommunity) {
    window.location.href = 'a5.html'
    return
  }

  if (backLink) {
    backLink.href = session.offencesSinceCommunity === 'yes' ? 'a6.html' : 'a5.html'
  }

  renderTieringSummaryList(summaryList, session, offenderFirstName)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    trackTelemetryMilestone('calculatedScore')
    setTieringAssessmentSession({ scoreCalculated: true })
    recordCalculateScore()
    window.location.href = 'a8.html'
  })
})
