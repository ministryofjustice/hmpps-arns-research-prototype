//
// a8 – risk predictor scores
//

import { markSection1Complete } from './assessment-section-complete.js'
import { formatToday } from './tiering-assessment-session.js'
import { getTieringBackLinkHref } from './tiering-change-scroll.js'
import { syncTieringSessionBeforeCheckAnswers, tieringJourneyHref } from './tiering-journey.js'
import { initTieringInactiveLinks } from '../tiering-inactive-links.js'

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

const initCompletionDate = () => {
  const element = document.querySelector('[data-tiering-completion-date]')
  if (!element) return

  element.textContent = formatToday()
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return
  if (!document.getElementById('tiering-a8-back')) return

  if (window.location.hash === '#answers') {
    window.location.replace(tieringJourneyHref('a7.html'))
    return
  }

  if (window.location.hash === '#score') {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  scrollA8ToTop()

  const session = syncTieringSessionBeforeCheckAnswers()

  const backLink = document.getElementById('tiering-a8-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('a7.html')
  }

  initCompletionDate()
  applySexualPredictorEmptyStates(session)
  initTieringInactiveLinks()
  initRiskPredictorBackToTop()

  const markCompleteButton = document.getElementById('tiering-mark-section-complete')
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
