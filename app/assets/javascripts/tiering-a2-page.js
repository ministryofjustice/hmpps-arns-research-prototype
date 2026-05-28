//
// a2 – offending history (restore session from a1)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import { getA2FieldsFromForm } from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a2-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const previousOffence = document.querySelector('[data-tiering-previous-offence]')
  const previousLabel = document.querySelector('[data-tiering-previous-offence-label]')
  const previousCode = document.querySelector('[data-tiering-previous-offence-code]')

  if (session.currentOffence && previousOffence) {
    previousOffence.hidden = false
    if (previousLabel) previousLabel.textContent = session.currentOffence.label
    if (previousCode) {
      previousCode.textContent = session.currentOffence.code
        ? `Offence code: ${session.currentOffence.code}`
        : ''
      previousCode.hidden = !session.currentOffence.code
    }
  }

  const fields = {
    firstSanctionAge: form.querySelector('#first-sanction-age'),
    totalSanctions: form.querySelector('#total-sanctions'),
    violentSanctions: form.querySelector('#violent-sanctions-other')
  }

  if (session.firstSanctionAge && fields.firstSanctionAge) {
    fields.firstSanctionAge.value = session.firstSanctionAge
  }
  if (session.totalSanctions && fields.totalSanctions) {
    fields.totalSanctions.value = session.totalSanctions
  }
  if (session.violentSanctions && fields.violentSanctions) {
    fields.violentSanctions.value = session.violentSanctions
  }
  if (session.sexualOffence) {
    const sexualOffenceInput = form.querySelector(`input[name="sexual_offence"][value="${session.sexualOffence}"]`)
    if (sexualOffenceInput) sexualOffenceInput.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA2FieldsFromForm(form))
  }

  if (!isTieringCheckAnswersEdit()) {
    const autofillOnFocus = [
      { input: fields.firstSanctionAge, value: '23' },
      { input: fields.totalSanctions, value: '6' },
      { input: fields.violentSanctions, value: '2' }
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

    const newFields = getA2FieldsFromForm(form)
    const sexualOffence = newFields.sexualOffence

    window.location.href = completeTieringPageAndContinue(
      'a2',
      sexualOffence === 'yes' ? 'a3.html' : 'a4.html',
      newFields
    )
  })
})
