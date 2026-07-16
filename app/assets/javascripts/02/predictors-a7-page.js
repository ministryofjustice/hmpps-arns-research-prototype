//
// a7 – check your answers (summary list from session)
//

import { getPredictorsBackLinkHref } from './predictors-change-scroll.js'
import { getPredictorsAssessmentSession, setPredictorsAssessmentSession } from './predictors-assessment-session.js'
import { ensureOffenceSearchData } from './predictors-offence-browse.js'
import {
  getA7BackHref,
  getPostInterviewYesContinueHref,
  getPredictorsResultsScoresHref,
  redirectIfPredictorsJourneyIncomplete,
  restoreDynamicSectionSessionFields,
  SCORES_CHECK_ANSWERS_ORIGIN_A7,
  syncPredictorsSessionBeforeCheckAnswers,
  predictorsJourneyHref
} from './predictors-journey.js'
import { renderPredictorsSummaryList } from './predictors-summary.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-a7-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('predictors-summary-list')
  const backLink = document.getElementById('predictors-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfPredictorsJourneyIncomplete()) return

  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getA7BackHref())
  }

  renderPredictorsSummaryList(summaryList, session, offenderFirstName)

  const continueAssessmentButton = document.getElementById('predictors-a7-continue-assessment')
  if (continueAssessmentButton) {
    continueAssessmentButton.addEventListener('click', () => {
      const session = getPredictorsAssessmentSession()
      const restored = restoreDynamicSectionSessionFields(session)

      setPredictorsAssessmentSession({
        ...restored,
        interviewDone: 'yes',
        staticAssessmentCompleteSeen: false,
        scoreCalculated: false,
        section1Complete: false
      })

      window.location.href = predictorsJourneyHref(
        getPostInterviewYesContinueHref({ ...session, ...restored, interviewDone: 'yes' })
      )
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    setPredictorsAssessmentSession({
      scoreCalculated: true,
      scoresCheckAnswersOrigin: SCORES_CHECK_ANSWERS_ORIGIN_A7,
      section1Complete: false
    })
    window.location.href = predictorsJourneyHref(getPredictorsResultsScoresHref())
  })
})
