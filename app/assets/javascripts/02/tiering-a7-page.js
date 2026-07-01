//
// a7 – check your answers (summary list from session)
//

import { getTieringBackLinkHref } from './tiering-change-scroll.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'
import { ensureOffenceSearchData } from '../tiering-offence-browse.js'
import {
  getA7BackHref,
  getPostInterviewYesContinueHref,
  getTieringResultsScoresHref,
  redirectIfTieringJourneyIncomplete,
  restoreDynamicSectionSessionFields,
  SCORES_CHECK_ANSWERS_ORIGIN_A7,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-a7-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncTieringSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('tiering-summary-list')
  const backLink = document.getElementById('tiering-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfTieringJourneyIncomplete()) return

  if (backLink) {
    backLink.href = getTieringBackLinkHref(getA7BackHref())
  }

  renderTieringSummaryList(summaryList, session, offenderFirstName)

  const continueAssessmentButton = document.getElementById('tiering-a7-continue-assessment')
  if (continueAssessmentButton) {
    continueAssessmentButton.addEventListener('click', () => {
      const session = getTieringAssessmentSession()
      const restored = restoreDynamicSectionSessionFields(session)

      setTieringAssessmentSession({
        ...restored,
        interviewDone: 'yes',
        staticAssessmentCompleteSeen: false,
        scoreCalculated: false
      })

      window.location.href = tieringJourneyHref(
        getPostInterviewYesContinueHref({ ...session, ...restored, interviewDone: 'yes' })
      )
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    trackTelemetryMilestone('calculatedScore')
    setTieringAssessmentSession({
      scoreCalculated: true,
      scoresCheckAnswersOrigin: SCORES_CHECK_ANSWERS_ORIGIN_A7
    })
    window.location.href = tieringJourneyHref(getTieringResultsScoresHref())
  })
})
