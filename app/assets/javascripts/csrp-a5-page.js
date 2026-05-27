//
// a5 – offences since community date
//

import {
  captureCheckAnswersEditSnapshot,
  completeCsrpPageAndContinue,
  isCsrpCheckAnswersEdit
} from './csrp-change-scroll.js'
import { getA5FieldsFromForm } from './csrp-journey.js'
import {
  formatDateFromParts,
  getCsrpAssessmentSession
} from './csrp-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('csrp-a5-form')
  if (!form) return

  const session = getCsrpAssessmentSession()
  const formattedDate = formatDateFromParts(session.communityDate || {})

  if (!formattedDate) {
    window.location.href = 'a4.html'
    return
  }

  const dateDisplay = document.querySelector('[data-community-date-display]')
  if (dateDisplay) dateDisplay.textContent = formattedDate

  if (session.offencesSinceCommunity) {
    const input = form.querySelector(
      `input[name="offences_since_community"][value="${session.offencesSinceCommunity}"]`
    )
    if (input) input.checked = true
  }

  if (isCsrpCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA5FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA5FieldsFromForm(form)
    const offencesSinceCommunity = newFields.offencesSinceCommunity

    window.location.href = completeCsrpPageAndContinue(
      'a5',
      offencesSinceCommunity === 'yes' ? 'a6.html' : 'a7.html',
      newFields
    )
  })
})
