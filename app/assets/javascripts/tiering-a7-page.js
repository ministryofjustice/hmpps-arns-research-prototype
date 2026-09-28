//
// a7 – check your answers (summary list from session)
//

import { getTieringBackLinkHref } from './tiering-change-scroll.js'
import { setTieringAssessmentSession } from './tiering-assessment-session.js'
import {
  getA7BackHref,
  getTieringResultsScoresHref,
  redirectIfTieringJourneyIncomplete,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (window.location.pathname.includes('/02/') || window.location.pathname.includes('/03/') || window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-a7-form')
  if (!form) return

  const session = syncTieringSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('tiering-summary-list')
  const backLink = document.getElementById('tiering-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfTieringJourneyIncomplete()) return

  if (backLink) {
    backLink.href = getTieringBackLinkHref(getA7BackHref())
  }

  renderTieringSummaryList(summaryList, session, offenderFirstName)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    trackTelemetryMilestone('calculatedScore')
    setTieringAssessmentSession({ scoreCalculated: true })
    window.location.href = tieringJourneyHref(getTieringResultsScoresHref())
  })
})
