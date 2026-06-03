//
// a6 – section 1 complete (static scores available)
//

import { getTieringBackLinkHref, isTieringCheckAnswersEdit } from './tiering-change-scroll.js'
import {
  getTieringResultsAnswersHref,
  hasSeenStaticAssessmentComplete,
  markStaticAssessmentCompleteSeen,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { setTieringAssessmentSession } from './tiering-assessment-session.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'
import { initTieringInactiveLinks } from './tiering-inactive-links.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('.tiering-a6-options')) return

  const session = syncTieringSessionBeforeCheckAnswers()

  if (!session.offencesSinceCommunity) {
    window.location.href = tieringJourneyHref('a5.html')
    return
  }

  if (hasSeenStaticAssessmentComplete(session) && !isTieringCheckAnswersEdit()) {
    window.location.href = tieringJourneyHref(getTieringResultsAnswersHref())
    return
  }

  const backLink = document.getElementById('tiering-a6-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('a5.html')
  }

  initTieringInactiveLinks(document.querySelector('.tiering-a6-options'))

  document.querySelector('[data-tiering-a6-action="done"]')?.addEventListener('click', () => {
    markStaticAssessmentCompleteSeen()
    syncTieringSessionBeforeCheckAnswers()
    trackTelemetryMilestone('calculatedScore')
    setTieringAssessmentSession({ scoreCalculated: true })
    window.location.href = tieringJourneyHref(getTieringResultsAnswersHref())
  })
})
