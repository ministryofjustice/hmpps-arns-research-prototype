//
// a7 – check your answers (summary list from session)
// Return to OASys toggles the community questions between
// "Time since last offence" (default) and split community sections
//

import { getPredictorsBackLinkHref } from './predictors-change-scroll.js'
import { setPredictorsAssessmentSession } from './predictors-assessment-session.js'
import { ensureOffenceSearchData } from './predictors-offence-lookup.js'
import {
  getA7BackHref,
  getPredictorsResultsScoresHref,
  redirectIfPredictorsJourneyIncomplete,
  syncPredictorsSessionBeforeCheckAnswers,
  predictorsJourneyHref
} from './predictors-journey.js'
import {
  A7_SUMMARY_LAYOUTS,
  renderPredictorsSummaryList
} from './predictors-summary.js'

const STORAGE_KEY = 'predictors-dev-a7-summary-layout'
const LAYOUTS = [A7_SUMMARY_LAYOUTS.timeSinceLastOffence, A7_SUMMARY_LAYOUTS.default]

const getStoredLayout = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return LAYOUTS.includes(stored) ? stored : A7_SUMMARY_LAYOUTS.timeSinceLastOffence
}

const setStoredLayout = (layout) => {
  sessionStorage.setItem(STORAGE_KEY, layout)
}

const getNextLayout = (current) => {
  const index = LAYOUTS.indexOf(current)
  return LAYOUTS[(index + 1) % LAYOUTS.length]
}

const activateSummaryLayoutToggle = (button) => {
  button.removeAttribute('aria-disabled')
  button.removeAttribute('tabindex')
  button.removeAttribute('data-predictors-inactive-link')
  button.removeAttribute('data-tiering-inactive-link')
  button.querySelector(
    '[data-tiering-prototype-only-hint], [data-predictors-prototype-only-hint]'
  )?.remove()
  button.setAttribute('href', '#')
  button.dataset.a7SummaryLayoutToggle = 'true'
}

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-a7-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('predictors-summary-list')
  const backLink = document.getElementById('predictors-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'
  const returnToOasysButton = document.querySelector(
    '.assessment-service-header .assessment-layout__return-to-oasys'
  )

  if (redirectIfPredictorsJourneyIncomplete()) return

  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getA7BackHref(session))
  }

  const renderSummary = (layout) => {
    renderPredictorsSummaryList(summaryList, session, offenderFirstName, { layout })
  }

  renderSummary(getStoredLayout())

  if (returnToOasysButton) {
    activateSummaryLayoutToggle(returnToOasysButton)

    returnToOasysButton.addEventListener('click', (event) => {
      event.preventDefault()
      const nextLayout = getNextLayout(getStoredLayout())
      setStoredLayout(nextLayout)
      renderSummary(nextLayout)
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    setPredictorsAssessmentSession({ scoreCalculated: true })
    window.location.href = predictorsJourneyHref(getPredictorsResultsScoresHref())
  })
})
