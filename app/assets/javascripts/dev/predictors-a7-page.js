//
// a7 – check your answers (summary list from session)
//

import { getPredictorsBackLinkHref } from './predictors-change-scroll.js'
import { setPredictorsAssessmentSession } from './predictors-assessment-session.js'
import { ensureOffenceSearchData } from '../tiering-offence-browse.js'
import {
  getA7BackHref,
  getPredictorsResultsScoresHref,
  redirectIfPredictorsJourneyIncomplete,
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
    backLink.href = getPredictorsBackLinkHref(getA7BackHref())
  }

  renderPredictorsSummaryList(summaryList, session, offenderFirstName)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    setPredictorsAssessmentSession({ scoreCalculated: true })
    window.location.href = predictorsJourneyHref(getPredictorsResultsScoresHref())
  })
})
