//
// a3 – sexual offending (only if history of sexual offending on a2)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  applyA3SexualOffendingDefaults,
  getA3SexualOffendingFieldsFromForm
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

const restoreRadio = (form, name, value) => {
  if (!value) return
  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-a3-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (session.sexualOffence !== 'yes') {
    window.location.href = 'a2.html'
    return
  }

  restoreRadio(form, 'sexual_motivation', session.sexualMotivation)
  restoreRadio(form, 'stranger_contact', session.strangerContact)

  const dayInput = form.querySelector('#sexual-sanction-date-day')
  const monthInput = form.querySelector('#sexual-sanction-date-month')
  const yearInput = form.querySelector('#sexual-sanction-date-year')

  if (session.sexualSanctionDate) {
    if (dayInput && session.sexualSanctionDate.day) dayInput.value = session.sexualSanctionDate.day
    if (monthInput && session.sexualSanctionDate.month) monthInput.value = session.sexualSanctionDate.month
    if (yearInput && session.sexualSanctionDate.year) yearInput.value = session.sexualSanctionDate.year
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA3SexualOffendingFieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    let newFields = getA3SexualOffendingFieldsFromForm(form)

    if (!isTieringCheckAnswersEdit()) {
      newFields = applyA3SexualOffendingDefaults(newFields, session)
    }

    window.location.href = completeTieringPageAndContinue('a3', 'a3dc.html', newFields)
  })
})
