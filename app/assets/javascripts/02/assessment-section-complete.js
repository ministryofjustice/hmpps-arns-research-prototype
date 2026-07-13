//
// Predictors section 1 complete state (hide mark-complete button + success banner)
//

import { getPredictorsAssessmentSession, setPredictorsAssessmentSession } from './predictors-assessment-session.js'

export const isSection1Complete = () => getPredictorsAssessmentSession().section1Complete === true

export const markSection1Complete = () => {
  hideMarkSectionCompleteButton()
  setPredictorsAssessmentSession({ section1Complete: true })
  applySection1CompleteUi()
  setSectionCompleteSuccessBannerVisible(true)

  window.scrollTo(0, 0)
}

const setA8BackLinkVisible = (visible) => {
  const backLink = document.getElementById('predictors-a8-back')
  if (!backLink) return

  backLink.classList.toggle('assessment-layout__back-link--hidden', !visible)
  backLink.hidden = !visible
}

const setPredictorsCompletionInsetVisible = (visible) => {
  const inset = document.querySelector('[data-predictors-completion-inset]')
  if (!inset) return

  if (visible) {
    inset.removeAttribute('hidden')
  } else {
    inset.setAttribute('hidden', '')
  }
}

const setSectionCompleteSuccessBannerVisible = (visible) => {
  const banner = document.getElementById('predictors-section-complete-success-banner')
  if (!banner) return

  if (visible) {
    banner.removeAttribute('hidden')
    banner.setAttribute('tabindex', '-1')
    banner.focus({ preventScroll: true })
    return
  }

  banner.setAttribute('hidden', '')
  banner.removeAttribute('tabindex')
}

const hideMarkSectionCompleteButton = () => {
  const markBtn = document.getElementById('predictors-mark-section-complete')
  if (!markBtn) return

  markBtn.hidden = true
  markBtn.disabled = true
  markBtn.classList.add('predictors-mark-section-complete--hidden')

  const actions = markBtn.closest('.risk-predictor-scores__actions')
  if (actions) actions.classList.add('risk-predictor-scores__actions--section-complete')
}

export const resetSection1CompleteUi = () => {
  const markBtn = document.getElementById('predictors-mark-section-complete')
  if (markBtn) {
    markBtn.hidden = false
    markBtn.disabled = false
    markBtn.classList.remove('predictors-mark-section-complete--hidden')
  }

  document.querySelectorAll('.risk-predictor-scores__actions').forEach((actions) => {
    actions.classList.remove('risk-predictor-scores__actions--section-complete')
  })

  setA8BackLinkVisible(true)
  setPredictorsCompletionInsetVisible(false)
  setSectionCompleteSuccessBannerVisible(false)
}

export const applySection1CompleteUi = () => {
  if (!isSection1Complete()) {
    resetSection1CompleteUi()
    return
  }

  hideMarkSectionCompleteButton()
  setA8BackLinkVisible(false)
  setPredictorsCompletionInsetVisible(true)
}

export const clearSection1CompleteSession = () => {
  setPredictorsAssessmentSession({ section1Complete: false })
}

export const clearSection1Complete = () => {
  clearSection1CompleteSession()
  resetSection1CompleteUi()
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  applySection1CompleteUi()
})
