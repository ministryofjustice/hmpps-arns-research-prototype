//
// a7 – check your answers (summary list from session)
//

import { getPredictorsBackLinkHref, scrollToPredictorsChangeTarget } from './predictors-change-scroll.js'
import { setPredictorsAssessmentSession } from './predictors-assessment-session.js'
import { ensureOffenceSearchData } from './predictors-offence-lookup.js'
import {
  getA7BackHref,
  getPredictorsResultsScoresHref,
  redirectIfPredictorsJourneyIncomplete,
  SCORES_CHECK_ANSWERS_ORIGIN_A7,
  syncPredictorsSessionBeforeCheckAnswers,
  predictorsJourneyHref
} from './predictors-journey.js'
import { renderPredictorsSummaryList } from './predictors-summary.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-a7-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('predictors-summary-list')
  const backLink = document.getElementById('predictors-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfPredictorsJourneyIncomplete()) return

  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getA7BackHref(session))
  }

  renderPredictorsSummaryList(summaryList, session, offenderFirstName)
  scrollToPredictorsChangeTarget()

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
