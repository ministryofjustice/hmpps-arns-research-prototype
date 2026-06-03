//
// a7 – check your answers (summary list from session)
//

import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'
import {
  hasSeenStaticAssessmentComplete,
  redirectIfTieringJourneyIncomplete,
  syncTieringSessionBeforeCheckAnswers
} from './tiering-journey.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a7-form')
  if (!form) return

  const session = syncTieringSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('tiering-summary-list')
  const backLink = document.getElementById('tiering-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfTieringJourneyIncomplete(session)) return

  if (backLink) {
    backLink.href = hasSeenStaticAssessmentComplete(session) ? 'a5.html' : 'a6.html'
  }

  renderTieringSummaryList(summaryList, session, offenderFirstName)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    trackTelemetryMilestone('calculatedScore')
    setTieringAssessmentSession({ scoreCalculated: true })
    window.location.href = 'a8.html'
  })
})
