//
// a8 – risk predictor scores
//

import { markSection1Complete } from './assessment-section-complete.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { insertTieringSessionFooterLinks } from './tiering-footer-session-links.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('.risk-predictor-scores')) return

  const session = getTieringAssessmentSession()

  if (!session.offencesSinceCommunity) {
    window.location.href = 'a7.html'
    return
  }

  insertTieringSessionFooterLinks()

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
