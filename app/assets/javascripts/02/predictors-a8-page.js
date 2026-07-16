//
// a8 – risk predictor scores
//

import { applySection1CompleteUi, markSection1Complete } from './assessment-section-complete.js'
import { formatToday } from './predictors-assessment-session.js'
import { getPredictorsBackLinkHref } from './predictors-change-scroll.js'
import { getDynamicPredictorsCheckAnswersHref, hasDynamicScoresOrigin, syncPredictorsSessionBeforeCheckAnswers, predictorsJourneyHref } from './predictors-journey.js'
import { initPredictorsInactiveLinks } from './predictors-inactive-links.js'

const scrollA8ToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const initRiskPredictorBackToTop = () => {
  const link = document.querySelector('[data-risk-predictor-back-to-top]')
  if (!link) return

  link.addEventListener('click', (event) => {
    event.preventDefault()
    scrollA8ToTop()
  })
}

const SEXUAL_PREDICTOR_IDS = ['direct-contact-sexual', 'indirect-contact-sexual']

const hasSexualOffenceHistory = (session) => session.sexualOffence === 'yes'

const applySexualPredictorEmptyStates = (session) => {
  const showScores = hasSexualOffenceHistory(session)

  SEXUAL_PREDICTOR_IDS.forEach((predictorId) => {
    const section = document.querySelector(`[data-risk-predictor-id="${predictorId}"]`)
    if (!section) return

    const scoreContent = section.querySelector('[data-risk-predictor-score-content]')
    const emptyState = section.querySelector('[data-risk-predictor-empty]')

    if (showScores) {
      scoreContent?.removeAttribute('hidden')
      emptyState?.setAttribute('hidden', '')
      section.classList.remove('risk-predictor-scores__section--not-applicable')
      return
    }

    scoreContent?.setAttribute('hidden', '')
    emptyState?.removeAttribute('hidden')
    section.classList.add('risk-predictor-scores__section--not-applicable')
  })
}

const applyRiskPredictorScoreTypeTags = (session) => {
  const isDynamic = hasDynamicScoresOrigin(session)
  const scoreType = isDynamic ? 'dynamic' : 'static'
  const label = isDynamic ? 'Dynamic' : 'Static'

  document.querySelectorAll('[data-risk-score-type]').forEach((section) => {
    section.dataset.riskScoreType = scoreType

    const tag = section.querySelector('.risk-predictor-scores__header .govuk-tag')
    if (tag) tag.textContent = label
  })
}

const initCompletionDate = () => {
  const element = document.querySelector('[data-predictors-completion-date]')
  if (!element) return

  element.textContent = formatToday()
}

const updateSectionCompleteBannerLink = (checkAnswersHref) => {
  const link = document.querySelector('#predictors-section-complete-success-banner a.govuk-link')
  if (!link) return

  link.href = predictorsJourneyHref(checkAnswersHref)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return
  if (!document.getElementById('predictors-a8-back')) return

  if (window.location.hash === '#answers') {
    const session = syncPredictorsSessionBeforeCheckAnswers()
    const checkAnswersHref = hasDynamicScoresOrigin(session)
      ? getDynamicPredictorsCheckAnswersHref()
      : 'a7.html'
    window.location.replace(predictorsJourneyHref(checkAnswersHref))
    return
  }

  if (window.location.hash === '#score') {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  scrollA8ToTop()

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const checkAnswersHref = hasDynamicScoresOrigin(session)
    ? getDynamicPredictorsCheckAnswersHref()
    : 'a7.html'

  const backLink = document.getElementById('predictors-a8-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(checkAnswersHref)
  }

  document.querySelectorAll('a[href="a7.html"]').forEach((link) => {
    link.href = predictorsJourneyHref(checkAnswersHref)
  })

  updateSectionCompleteBannerLink(checkAnswersHref)
  initCompletionDate()
  applyRiskPredictorScoreTypeTags(session)
  applySexualPredictorEmptyStates(session)
  initPredictorsInactiveLinks()
  initRiskPredictorBackToTop()

  const markCompleteButton = document.getElementById('predictors-mark-section-complete')
  if (markCompleteButton) {
    markCompleteButton.addEventListener('click', () => {
      markSection1Complete()
    })
  }

  applySection1CompleteUi()

  requestAnimationFrame(() => {
    requestAnimationFrame(scrollA8ToTop)
  })

  window.addEventListener('pageshow', () => {
    scrollA8ToTop()
  })
})
