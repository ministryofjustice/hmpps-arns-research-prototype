//
// a2 – offending history (restore session from a1)
//

import { initFirstSanctionDate } from './first-sanction-date.js'
import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import { getA2FieldsFromForm } from './tiering-journey.js'
import { formatOffenceCodeLabel } from './tiering-offence-browse.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a2-form')
  if (!form) return

  initFirstSanctionDate()

  const session = getTieringAssessmentSession()
  const previousOffence = document.querySelector('[data-tiering-previous-offence]')
  const previousLabel = document.querySelector('[data-tiering-previous-offence-label]')
  const previousCode = document.querySelector('[data-tiering-previous-offence-code]')

  if (session.currentOffence && previousOffence) {
    previousOffence.hidden = false
    if (previousLabel) previousLabel.textContent = session.currentOffence.label
    if (previousCode) {
      const codeLabel = formatOffenceCodeLabel(session.currentOffence)
      previousCode.textContent = codeLabel
      previousCode.hidden = !codeLabel
    }
  }

  if (session.totalSanctions) {
    const totalSanctions = form.querySelector('#total-sanctions')
    if (totalSanctions) totalSanctions.value = session.totalSanctions
  }
  if (session.violentSanctions) {
    const violentSanctions = form.querySelector('#violent-sanctions-other')
    if (violentSanctions) violentSanctions.value = session.violentSanctions
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
      { input: form.querySelector('#total-sanctions'), value: '6' },
      { input: form.querySelector('#violent-sanctions-other'), value: '2' }
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

    const newFields = {
      ...getA2FieldsFromForm(form),
      firstSanctionDateEditMode: false
    }

    if (!isTieringCheckAnswersEdit()) {
      if (!newFields.totalSanctions) newFields.totalSanctions = '6'
      if (!newFields.violentSanctions) newFields.violentSanctions = '2'
    }

    const sexualOffence = newFields.sexualOffence

    window.location.href = completeTieringPageAndContinue(
      'a2',
      sexualOffence === 'yes' ? 'a3.html' : 'a4.html',
      newFields
    )
  })
})
