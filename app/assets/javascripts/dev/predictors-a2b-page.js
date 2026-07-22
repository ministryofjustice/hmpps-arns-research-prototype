//
// a2b – current offence + offending history (merged a1 + a2)
//

import {
  initConvictionDate
} from '../conviction-date.js'
import {
  getDefaultFirstSanctionDateParts,
  getPredictorsAssessmentSession
} from './predictors-assessment-session.js'
import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  isPredictorsCheckAnswersEdit
} from './predictors-change-scroll.js'
import { hydrateCurrentOffenceDisplay } from './predictors-current-offence-display.js'
import { getA1FieldsFromForm, getA2FieldsFromForm } from './predictors-journey.js'

const setFirstSanctionDateValues = (parts) => {
  const dayInput = document.getElementById('first-sanction-date-day')
  const monthInput = document.getElementById('first-sanction-date-month')
  const yearInput = document.getElementById('first-sanction-date-year')

  if (dayInput) dayInput.value = parts.day || ''
  if (monthInput) monthInput.value = parts.month || ''
  if (yearInput) yearInput.value = parts.year || ''
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-a2b-form')
  if (!form) return

  initConvictionDate()
  hydrateCurrentOffenceDisplay()

  const session = getPredictorsAssessmentSession()

  if (session.firstSanctionDate) {
    setFirstSanctionDateValues(session.firstSanctionDate)
  } else {
    setFirstSanctionDateValues(getDefaultFirstSanctionDateParts())
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
    const sexualOffenceInput = form.querySelector(
      `input[name="sexual_offence"][value="${session.sexualOffence}"]`
    )
    if (sexualOffenceInput) sexualOffenceInput.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot({
      ...getA1FieldsFromForm(form),
      ...getA2FieldsFromForm(form)
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = {
      ...getA1FieldsFromForm(form),
      ...getA2FieldsFromForm(form),
      convictionDateEditMode: false
    }

    const sexualOffence = newFields.sexualOffence

    window.location.href = completePredictorsPageAndContinue(
      'a2',
      sexualOffence === 'yes' ? 'a3.html' : 'a4.html',
      newFields
    )
  })
})
