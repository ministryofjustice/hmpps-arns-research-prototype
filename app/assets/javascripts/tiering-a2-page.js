//
// a2 – offending history
//

import {
  getDefaultFirstSanctionAge,
  getDefaultFirstSanctionDateParts,
  getOffenderDateOfBirthParts,
  getTieringAssessmentSession
} from './tiering-assessment-session.js'
import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  calculateAgeOnDate,
  getA2FieldsFromForm,
  isValidDateParts,
  normaliseDateParts
} from './tiering-journey.js'

const FIRST_SANCTION_DATE_INPUT_IDS = [
  'first-sanction-date-day',
  'first-sanction-date-month',
  'first-sanction-date-year'
]

const setFirstSanctionDateValues = (parts) => {
  const dayInput = document.getElementById('first-sanction-date-day')
  const monthInput = document.getElementById('first-sanction-date-month')
  const yearInput = document.getElementById('first-sanction-date-year')

  if (dayInput) dayInput.value = parts.day || ''
  if (monthInput) monthInput.value = parts.month || ''
  if (yearInput) yearInput.value = parts.year || ''
}

const getFirstSanctionDatePartsFromDom = () =>
  normaliseDateParts({
    day: document.getElementById('first-sanction-date-day')?.value,
    month: document.getElementById('first-sanction-date-month')?.value,
    year: document.getElementById('first-sanction-date-year')?.value
  })

window.GOVUKPrototypeKit.documentReady(() => {
  if (window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-a2-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const offenderFirstName = form.dataset.offenderFirstName || 'Alex'
  const ageResult = document.getElementById('first-sanction-age-result')

  if (session.firstSanctionDate) {
    setFirstSanctionDateValues(session.firstSanctionDate)
  } else {
    setFirstSanctionDateValues(getDefaultFirstSanctionDateParts())
  }

  const hideAgeResult = () => {
    if (!ageResult) return
    ageResult.textContent = ''
    ageResult.classList.add('first-sanction-age-result--hidden')
  }

  const showAgeResult = (age) => {
    if (!ageResult) return
    ageResult.innerHTML = `<strong>Age:</strong> ${offenderFirstName} was ${age} on this date`
    ageResult.classList.remove('first-sanction-age-result--hidden')
  }

  const updateFirstSanctionAgeResult = () => {
    const dateParts = getFirstSanctionDatePartsFromDom()

    if (!isValidDateParts(dateParts)) {
      hideAgeResult()
      return
    }

    const age = calculateAgeOnDate(getOffenderDateOfBirthParts(), dateParts)
    if (age == null) {
      hideAgeResult()
      return
    }

    showAgeResult(age)
  }

  FIRST_SANCTION_DATE_INPUT_IDS.forEach((id) => {
    document.getElementById(id)?.addEventListener('blur', updateFirstSanctionAgeResult)
  })

  form.querySelector('[data-first-sanction-date-field]')?.addEventListener('focusout', (event) => {
    const dateField = event.currentTarget
    if (dateField.contains(event.relatedTarget)) return
    updateFirstSanctionAgeResult()
  })

  updateFirstSanctionAgeResult()

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

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA2FieldsFromForm(form)

    if (!isTieringCheckAnswersEdit()) {
      if (!newFields.firstSanctionAge) newFields.firstSanctionAge = getDefaultFirstSanctionAge()
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
