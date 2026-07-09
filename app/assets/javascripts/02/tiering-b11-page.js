//
// b11 – check your answers (static + dynamic summary)
//

import { getTieringBackLinkHref, TIERING_FROM_B11_DYNAMIC, TIERING_FROM_B11_STATIC } from './tiering-change-scroll.js'
import { setTieringAssessmentSession } from './tiering-assessment-session.js'
import { ensureOffenceSearchData } from '../tiering-offence-browse.js'
import {
  getB11BackHref,
  getTieringResultsScoresHref,
  redirectIfDynamicCheckAnswersIncomplete,
  SCORES_CHECK_ANSWERS_ORIGIN_B11,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b11-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncTieringSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('tiering-summary-list')
  const backLink = document.getElementById('tiering-b11-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfDynamicCheckAnswersIncomplete()) return

  if (backLink) {
    backLink.href = getTieringBackLinkHref(getB11BackHref())
  }

  renderTieringSummaryList(summaryList, session, offenderFirstName, {
    includeDynamic: true,
    staticCheckAnswersFrom: TIERING_FROM_B11_STATIC,
    dynamicCheckAnswersFrom: TIERING_FROM_B11_DYNAMIC
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    trackTelemetryMilestone('calculatedScore')
    setTieringAssessmentSession({
      scoreCalculated: true,
      staticAssessmentCompleteSeen: true,
      scoresCheckAnswersOrigin: SCORES_CHECK_ANSWERS_ORIGIN_B11,
      section1Complete: false
    })
    window.location.href = tieringJourneyHref(getTieringResultsScoresHref())
  })
})
