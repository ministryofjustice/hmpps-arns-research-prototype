//
// a8 – risk predictor scores
//

import { markSection1Complete } from './assessment-section-complete.js'
import { getTieringBackLinkHref } from './tiering-change-scroll.js'
import {
  redirectIfTieringJourneyIncomplete,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { insertTieringSessionFooterLinks } from './tiering-footer-session-links.js'
import { trackTelemetryRiskPredictorDetailsOpen } from './tiering-session-telemetry.js'
import { initTieringInactiveLinks } from './tiering-inactive-links.js'

const easeOutCubic = (progress) => 1 - (1 - progress) ** 3

const scrollA8ToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const clearFocusAfterScroll = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

const scrollToTopWithEaseOut = (targetEl) => {
  const targetTop = targetEl ? targetEl.getBoundingClientRect().top + window.scrollY : 0
  const start = window.scrollY
  const distance = start - targetTop

  if (distance <= 0) {
    clearFocusAfterScroll()
    return
  }

  const duration = Math.min(800, Math.max(400, distance * 0.45))
  const startTime = performance.now()

  const tick = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    window.scrollTo(0, start - distance * easeOutCubic(progress))

    if (progress < 1) {
      requestAnimationFrame(tick)
      return
    }

    clearFocusAfterScroll()
  }

  requestAnimationFrame(tick)
}

const initRiskPredictorBackToTop = () => {
  const link = document.querySelector('[data-risk-predictor-back-to-top]')
  if (!link) return

  link.addEventListener('click', (event) => {
    event.preventDefault()
    scrollToTopWithEaseOut()
  })
}

const SEXUAL_PREDICTOR_IDS = ['direct-contact-sexual', 'indirect-contact-sexual']

const hasSexualOffenceHistory = (session) => session.sexualOffence === 'yes'

const applySexualPredictorEmptyStates = (session) => {
  if (hasSexualOffenceHistory(session)) return

  SEXUAL_PREDICTOR_IDS.forEach((predictorId) => {
    const section = document.querySelector(`[data-risk-predictor-id="${predictorId}"]`)
    if (!section) return

    section.querySelector('[data-risk-predictor-score-content]')?.setAttribute('hidden', '')
    section.querySelector('[data-risk-predictor-empty]')?.removeAttribute('hidden')
    section.classList.add('risk-predictor-scores__section--not-applicable')
  })
}

const initRiskPredictorTelemetry = () => {
  document.querySelectorAll('.risk-predictor-scores__section[data-risk-predictor-id]').forEach((section) => {
    const details = section.querySelector('details.risk-predictor-scores__details')
    if (!details) return

    const predictorId = section.dataset.riskPredictorId
    const predictorLabel = section.dataset.riskPredictorLabel
    if (!predictorId) return

    details.addEventListener('toggle', () => {
      if (!details.open) return
      trackTelemetryRiskPredictorDetailsOpen(predictorId, predictorLabel)
    })
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
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

  if (redirectIfTieringJourneyIncomplete()) return

  const backLink = document.getElementById('tiering-a8-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('a7.html')
  }

  insertTieringSessionFooterLinks()
  applySexualPredictorEmptyStates(session)
  initTieringInactiveLinks()
  initRiskPredictorBackToTop()
  initRiskPredictorTelemetry()

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
