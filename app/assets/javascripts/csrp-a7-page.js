//
// a7 – check your answers (summary list from session)
//

import { getCsrpAssessmentSession } from './csrp-assessment-session.js'
import { renderCsrpSummaryList } from './csrp-summary.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('csrp-a7-form')
  if (!form) return

  const session = getCsrpAssessmentSession()
  const summaryList = document.getElementById('csrp-summary-list')
  const backLink = document.getElementById('csrp-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (!session.offencesSinceCommunity) {
    window.location.href = 'a5.html'
    return
  }

  if (backLink) {
    backLink.href = session.offencesSinceCommunity === 'yes' ? 'a6.html' : 'a5.html'
  }

  renderCsrpSummaryList(summaryList, session, offenderFirstName)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    window.location.href = 'a8.html'
  })
})
