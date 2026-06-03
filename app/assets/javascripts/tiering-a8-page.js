//
// a8 – risk predictor scores
//

import { markSection1Complete } from './assessment-section-complete.js'
import { getTieringBackLinkHref, isTieringCheckAnswersEdit } from './tiering-change-scroll.js'
import { redirectIfTieringJourneyIncomplete, syncTieringSessionBeforeCheckAnswers } from './tiering-journey.js'
import { insertTieringSessionFooterLinks } from './tiering-footer-session-links.js'
import {
  trackTelemetryRiskPredictorDetailsOpen,
  trackTelemetryRiskPredictorTabSwitch
} from './tiering-session-telemetry.js'
import { initTieringInactiveLinks } from './tiering-inactive-links.js'
import { renderTieringSummaryList } from './tiering-summary.js'

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

const initRiskPredictorTelemetry = (initialTab = 'scores') => {
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

  const tabsRoot = document.querySelector('.govuk-tabs')
  if (!tabsRoot) return () => {}

  let activeTab = initialTab === 'answers' ? 'answers' : 'scores'

  const trackTabSwitch = (fromTab, toTab) => {
    if (fromTab === toTab) return
    trackTelemetryRiskPredictorTabSwitch(fromTab, toTab)
    activeTab = toTab
  }

  tabsRoot.querySelectorAll('.govuk-tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const href = tab.getAttribute('href') || ''
      const nextTab = href === '#answers' ? 'answers' : href === '#score' ? 'scores' : null
      if (!nextTab || nextTab === activeTab) return

      trackTabSwitch(activeTab, nextTab)
    })
  })

  return trackTabSwitch
}

const getInitialA8Tab = () => (window.location.hash === '#answers' ? 'answers' : 'score')

const activateA8Tab = (tabId) => {
  const tabsRoot = document.querySelector('.govuk-tabs')
  if (!tabsRoot) return

  const targetHref = tabId === 'answers' ? '#answers' : '#score'
  const tabLink = tabsRoot.querySelector(`.govuk-tabs__tab[href="${targetHref}"]`)
  if (!tabLink) return

  tabsRoot.querySelectorAll('.govuk-tabs__list-item').forEach((item) => {
    item.classList.toggle('govuk-tabs__list-item--selected', item.contains(tabLink))
  })

  tabsRoot.querySelectorAll('.govuk-tabs__panel').forEach((panel) => {
    panel.classList.toggle('govuk-tabs__panel--hidden', panel.id !== tabId)
  })

  tabsRoot.querySelectorAll('.govuk-tabs__tab').forEach((tab) => {
    tab.setAttribute('aria-selected', tab === tabLink ? 'true' : 'false')
  })

  const hash = tabId === 'answers' ? '#answers' : '#score'
  if (window.location.hash !== hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
  }
}

const initA8ViewScoresButton = (onTabSwitch) => {
  const button = document.getElementById('tiering-a8-view-scores')
  if (!button) return

  button.addEventListener('click', () => {
    onTabSwitch?.('answers', 'scores')
    activateA8Tab('score')
    scrollA8ToTop()
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('.govuk-tabs')) return

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  scrollA8ToTop()

  const initialTab = getInitialA8Tab()
  activateA8Tab(initialTab)

  const session = syncTieringSessionBeforeCheckAnswers()

  if (redirectIfTieringJourneyIncomplete()) return

  const backLink = document.getElementById('tiering-a8-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('a6.html')
  }

  insertTieringSessionFooterLinks()
  applySexualPredictorEmptyStates(session)
  initTieringInactiveLinks()
  initRiskPredictorBackToTop()
  const trackTabSwitch = initRiskPredictorTelemetry(initialTab === 'answers' ? 'answers' : 'scores')
  initA8ViewScoresButton(trackTabSwitch)

  const summaryList = document.getElementById('tiering-summary-list')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'
  if (summaryList) renderTieringSummaryList(summaryList, session, offenderFirstName)

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
