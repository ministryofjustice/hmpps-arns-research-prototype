//
// a6 – static assessment complete (static continue or start dynamic)
//

import { getTieringBackLinkHref, isTieringCheckAnswersEdit } from './tiering-change-scroll.js'
import {
  getTieringReviewHref,
  hasSeenStaticAssessmentComplete,
  markStaticAssessmentCompleteSeen,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('.tiering-a6-options')) return

  const session = getTieringAssessmentSession()

  if (hasSeenStaticAssessmentComplete(session) && !isTieringCheckAnswersEdit()) {
    syncTieringSessionBeforeCheckAnswers()
    window.location.href = tieringJourneyHref(getTieringReviewHref(session))
    return
  }

  const backLink = document.getElementById('tiering-a6-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('a5.html')
  }

  const doneButton = document.querySelector('[data-tiering-a6-action="done"]')
  if (doneButton) {
    doneButton.addEventListener('click', () => {
      markStaticAssessmentCompleteSeen()
      syncTieringSessionBeforeCheckAnswers()
      window.location.href = tieringJourneyHref('a7.html')
    })
  }
})
