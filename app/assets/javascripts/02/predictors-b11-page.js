//
// b11 – check your answers (static + dynamic summary)
//

import { getPredictorsBackLinkHref, PREDICTORS_FROM_B11_DYNAMIC, PREDICTORS_FROM_B11_STATIC } from './predictors-change-scroll.js'
import { setPredictorsAssessmentSession } from './predictors-assessment-session.js'
import { ensureOffenceSearchData } from './predictors-offence-browse.js'
import {
  getB11BackHref,
  getPredictorsResultsScoresHref,
  redirectIfDynamicCheckAnswersIncomplete,
  SCORES_CHECK_ANSWERS_ORIGIN_B11,
  syncPredictorsSessionBeforeCheckAnswers,
  predictorsJourneyHref
} from './predictors-journey.js'
import { renderPredictorsSummaryList } from './predictors-summary.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b11-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('predictors-summary-list')
  const backLink = document.getElementById('predictors-b11-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfDynamicCheckAnswersIncomplete()) return

  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB11BackHref())
  }

  renderPredictorsSummaryList(summaryList, session, offenderFirstName, {
    includeDynamic: true,
    staticCheckAnswersFrom: PREDICTORS_FROM_B11_STATIC,
    dynamicCheckAnswersFrom: PREDICTORS_FROM_B11_DYNAMIC
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    setPredictorsAssessmentSession({
      scoreCalculated: true,
      staticAssessmentCompleteSeen: true,
      scoresCheckAnswersOrigin: SCORES_CHECK_ANSWERS_ORIGIN_B11,
      section1Complete: false
    })
    window.location.href = predictorsJourneyHref(getPredictorsResultsScoresHref())
  })
})
