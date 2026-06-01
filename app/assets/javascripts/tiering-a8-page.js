//
// a8 – risk predictor scores
//

import { markSection1Complete } from './assessment-section-complete.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { insertTieringSessionFooterLinks } from './tiering-footer-session-links.js'
import {
  trackTelemetryRiskPredictorDetailsOpen,
  trackTelemetryRiskPredictorTabSwitch
} from './tiering-session-telemetry.js'
import { renderTieringSummaryList } from './tiering-summary.js'

const easeOutCubic = (progress) => 1 - (1 - progress) ** 3

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
    scrollToTopWithEaseOut(document.getElementById('top'))
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

  const tabsRoot = document.querySelector('.govuk-tabs')
  if (!tabsRoot) return

  let activeTab = 'scores'

  tabsRoot.querySelectorAll('.govuk-tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const href = tab.getAttribute('href') || ''
      const nextTab = href === '#answers' ? 'answers' : href === '#score' ? 'scores' : null
      if (!nextTab || nextTab === activeTab) return

      trackTelemetryRiskPredictorTabSwitch(activeTab, nextTab)
      activeTab = nextTab
    })
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('.risk-predictor-scores')) return

  const session = getTieringAssessmentSession()

  if (!session.offencesSinceCommunity) {
    window.location.href = 'a7.html'
    return
  }

  insertTieringSessionFooterLinks()
  initRiskPredictorBackToTop()
  initRiskPredictorTelemetry()

  const summaryList = document.getElementById('tiering-summary-list')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'
  if (summaryList) renderTieringSummaryList(summaryList, session, offenderFirstName)

  const markCompleteButton = document.getElementById('tiering-mark-section-complete')
  if (markCompleteButton) {
    markCompleteButton.addEventListener('click', () => {
      markSection1Complete()
    })
  }
})
