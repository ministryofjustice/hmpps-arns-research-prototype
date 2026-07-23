//
// a8 – risk predictor scores
//

import { markSection1Complete } from './assessment-section-complete.js'
import { getPredictorsBackLinkHref } from './predictors-change-scroll.js'
import { syncPredictorsSessionBeforeCheckAnswers, predictorsJourneyHref } from './predictors-journey.js'
import { initPredictorsInactiveLinks } from './predictors-inactive-links.js'

const scrollA8ToTop = () => {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const initRiskPredictorBackToTop = () => {
  const link = document.querySelector('[data-risk-predictor-back-to-top]')
  if (!link) return

  link.addEventListener('click', (event) => {
    event.preventDefault()
    scrollA8ToTop()

    const top = document.getElementById('top')
    if (top) {
      top.focus({ preventScroll: true })
    }

    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
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

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return
  if (!document.getElementById('predictors-a8-back')) return

  if (window.location.hash === '#answers') {
    window.location.replace(predictorsJourneyHref('a7.html'))
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

  const backLink = document.getElementById('predictors-a8-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('a7.html')
  }

  applySexualPredictorEmptyStates(session)
  initPredictorsInactiveLinks()
  initRiskPredictorBackToTop()

  const markCompleteButton = document.getElementById('predictors-mark-section-complete')
  if (markCompleteButton) {
    markCompleteButton.addEventListener('click', () => {
      markSection1Complete()
    })
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(scrollA8ToTop)
  })

  window.addEventListener('pageshow', () => {
    scrollA8ToTop()
  })
})
