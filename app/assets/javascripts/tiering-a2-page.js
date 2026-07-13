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
  if (window.location.pathname.includes('/02/') || window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-a2-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const offenderFirstName = form.dataset.offenderFirstName || 'Alex'
  const ageResult = document.getElementById('first-sanction-age-result')
  let ageResultAnnounceTimeoutId = null

  if (session.firstSanctionDate) {
    setFirstSanctionDateValues(session.firstSanctionDate)
  } else {
    setFirstSanctionDateValues(getDefaultFirstSanctionDateParts())
  }

  const hideAgeResult = () => {
    if (!ageResult) return
    if (ageResultAnnounceTimeoutId) {
      window.clearTimeout(ageResultAnnounceTimeoutId)
      ageResultAnnounceTimeoutId = null
    }
    ageResult.textContent = ''
    ageResult.removeAttribute('data-age-message')
    ageResult.classList.add('first-sanction-age-result--hidden')
  }

  const showAgeResult = (age) => {
    if (!ageResult) return
    const message = `Age: ${offenderFirstName} was ${age} on this date`
    if (ageResult.getAttribute('data-age-message') === message) return

    const previousMessage = ageResult.getAttribute('data-age-message')
    ageResult.setAttribute('data-age-message', message)
    ageResult.classList.remove('first-sanction-age-result--hidden')

    const render = () => {
      ageResult.innerHTML = `<strong>Age:</strong> ${offenderFirstName} was ${age} on this date`
    }

    // First paint can update immediately; later changes clear first so aria-live
    // re-announces while focus remains in the date fields.
    if (!previousMessage) {
      render()
      return
    }

    if (ageResultAnnounceTimeoutId) window.clearTimeout(ageResultAnnounceTimeoutId)
    ageResult.textContent = ''
    ageResultAnnounceTimeoutId = window.setTimeout(() => {
      ageResultAnnounceTimeoutId = null
      if (ageResult.getAttribute('data-age-message') !== message) return
      render()
    }, 0)
  }

  const updateFirstSanctionAgeResult = ({ hideWhenInvalid = true } = {}) => {
    const dateParts = getFirstSanctionDatePartsFromDom()

    if (!isValidDateParts(dateParts)) {
      if (hideWhenInvalid) hideAgeResult()
      return
    }

    const age = calculateAgeOnDate(getOffenderDateOfBirthParts(), dateParts)
    if (age == null) {
      if (hideWhenInvalid) hideAgeResult()
      return
    }

    showAgeResult(age)
  }

  // Update as soon as a complete valid date is typed so aria-live announces
  // without waiting for blur / focus leaving the year field.
  FIRST_SANCTION_DATE_INPUT_IDS.forEach((id) => {
    const input = document.getElementById(id)
    if (!input) return
    input.addEventListener('input', () => updateFirstSanctionAgeResult({ hideWhenInvalid: false }))
    input.addEventListener('blur', () => updateFirstSanctionAgeResult())
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
