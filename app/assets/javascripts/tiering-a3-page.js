//
// a3 – sexual offending (only if history of sexual offending on a2)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import { applyA3PrototypeDefaults, getA3FieldsFromForm } from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { initTieringInactiveLinks } from './tiering-inactive-links.js'

const restoreRadio = (form, name, value) => {
  if (!value) return
  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a3-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (session.sexualOffence !== 'yes') {
    window.location.href = 'a2.html'
    return
  }

  initTieringInactiveLinks(form)

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

  const textFields = {
    contactAdultSanctions: form.querySelector('#contact-adult-sanctions'),
    contactChildSanctions: form.querySelector('#contact-child-sanctions'),
    indirectChildSanctions: form.querySelector('#indirect-child-sanctions'),
    nonContactSanctions: form.querySelector('#non-contact-sanctions')
  }

  if (session.contactAdultSanctions && textFields.contactAdultSanctions) {
    textFields.contactAdultSanctions.value = session.contactAdultSanctions
  }
  if (session.contactChildSanctions && textFields.contactChildSanctions) {
    textFields.contactChildSanctions.value = session.contactChildSanctions
  }
  if (session.indirectChildSanctions && textFields.indirectChildSanctions) {
    textFields.indirectChildSanctions.value = session.indirectChildSanctions
  }
  if (session.nonContactSanctions && textFields.nonContactSanctions) {
    textFields.nonContactSanctions.value = session.nonContactSanctions
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA3FieldsFromForm(form))
  }

  if (!isTieringCheckAnswersEdit()) {
    const autofillOnFocus = [
      { input: textFields.contactAdultSanctions, value: '2' },
      { input: textFields.contactChildSanctions, value: '1' },
      { input: textFields.indirectChildSanctions, value: '1' },
      { input: textFields.nonContactSanctions, value: '3' }
    ]

    autofillOnFocus.forEach(({ input, value }) => {
      if (!input) return
      input.addEventListener('focus', () => {
        input.value = value
      })
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    let newFields = getA3FieldsFromForm(form)

    if (!isTieringCheckAnswersEdit()) {
      newFields = applyA3PrototypeDefaults(newFields, session)
    }

    window.location.href = completeTieringPageAndContinue('a3', 'a4.html', newFields)
  })
})
