//
// a5 – offences since community date
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import { getA5FieldsFromForm } from './tiering-journey.js'
import {
  formatDateFromParts,
  getTieringAssessmentSession
} from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a5-form')
  if (!form) return

  const session = getTieringAssessmentSession()
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

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA5FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA5FieldsFromForm(form)
    const offencesSinceCommunity = newFields.offencesSinceCommunity

    window.location.href = completeTieringPageAndContinue(
      'a5',
      offencesSinceCommunity === 'yes' ? 'a6.html' : 'a7.html',
      newFields
    )
  })
})
