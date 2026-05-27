//
// a8 – risk predictor scores
//

import { clearSection1CompleteSession, markSection1Complete } from './assessment-section-complete.js'
import { getCsrpAssessmentSession } from './csrp-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('.risk-predictor-scores')) return

  const session = getCsrpAssessmentSession()

  if (!session.offencesSinceCommunity) {
    window.location.href = 'a7.html'
    return
  }

  const markCompleteButton = document.getElementById('csrp-mark-section-complete')
  if (markCompleteButton) {
    markCompleteButton.addEventListener('click', () => {
      markSection1Complete()
    })
  }

  const returnToAssessmentLink = document.querySelector('[data-csrp-return-to-assessment]')
  if (returnToAssessmentLink) {
    returnToAssessmentLink.addEventListener('click', (event) => {
      event.preventDefault()
      clearSection1CompleteSession()
      window.location.assign('a7.html')
    })
  }
})
