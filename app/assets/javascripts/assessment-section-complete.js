//
// Tiering section 1 complete state (side nav tick + hide mark-complete button)
//

import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'
import { trackTelemetryMilestone } from './tiering-session-telemetry.js'

export const isSection1Complete = () => getTieringAssessmentSession().section1Complete === true

export const markSection1Complete = () => {
  hideMarkSectionCompleteButton()
  setTieringAssessmentSession({ section1Complete: true })
  trackTelemetryMilestone('markSectionComplete')
  applySection1CompleteUi()
}

const hideMarkSectionCompleteButton = () => {
  const markBtn = document.getElementById('tiering-mark-section-complete')
  if (!markBtn) return

  markBtn.hidden = true
  markBtn.setAttribute('aria-hidden', 'true')
  markBtn.classList.add('tiering-mark-section-complete--hidden')

  const actions = markBtn.closest('.risk-predictor-scores__actions')
  if (actions) actions.classList.add('risk-predictor-scores__actions--section-complete')
}

export const resetSection1CompleteUi = () => {
  document.querySelectorAll('[data-section-complete="section-1"]').forEach((icon) => {
    icon.classList.remove('assessment-side-navigation__complete-icon--visible')
    icon.setAttribute('aria-hidden', 'true')
  })

  document.querySelectorAll('[data-section="section-1"]').forEach((link) => {
    const item = link.closest('.moj-side-navigation__item')
    if (item) item.classList.remove('moj-side-navigation__item--complete')
  })

  const markBtn = document.getElementById('tiering-mark-section-complete')
  if (markBtn) {
    markBtn.hidden = false
    markBtn.removeAttribute('aria-hidden')
    markBtn.classList.remove('tiering-mark-section-complete--hidden')
  }

  document.querySelectorAll('.risk-predictor-scores__actions').forEach((actions) => {
    actions.classList.remove('risk-predictor-scores__actions--section-complete')
  })
}

export const applySection1CompleteUi = () => {
  if (!isSection1Complete()) {
    resetSection1CompleteUi()
    return
  }

  document.querySelectorAll('[data-section-complete="section-1"]').forEach((icon) => {
    icon.classList.add('assessment-side-navigation__complete-icon--visible')
    icon.setAttribute('aria-hidden', 'false')
  })

  document.querySelectorAll('[data-section="section-1"]').forEach((link) => {
    const item = link.closest('.moj-side-navigation__item')
    if (item) item.classList.add('moj-side-navigation__item--complete')
  })

  hideMarkSectionCompleteButton()
}

export const clearSection1CompleteSession = () => {
  setTieringAssessmentSession({ section1Complete: false })
}

export const clearSection1Complete = () => {
  clearSection1CompleteSession()
  resetSection1CompleteUi()
}

window.GOVUKPrototypeKit.documentReady(() => {
  applySection1CompleteUi()
})
