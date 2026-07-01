//
// a2 – offending history
//

import {
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

const initSanctionDefinitionToggle = () => {
  const toggle = document.querySelector('[data-sanction-definition-toggle]')
  const headerSlot = document.querySelector('[data-sanction-inset-slot="header"]')
  const formSlot = document.querySelector('[data-sanction-inset-slot="form"]')
  const insetPanel = toggle?.querySelector('.sanction-definition-toggle__inset')
  const headingPanel = toggle?.querySelector('.sanction-definition-toggle__heading')

  if (!toggle || !headerSlot || !formSlot || !insetPanel || !headingPanel) return

  const applyMode = (mode) => {
    const isInset = mode === 'inset'
    const targetSlot = isInset ? headerSlot : formSlot

    targetSlot.appendChild(toggle)
    headerSlot.hidden = !isInset
    formSlot.hidden = isInset

    insetPanel.hidden = !isInset
    headingPanel.hidden = isInset

    toggle.dataset.sanctionDefinitionMode = mode
    toggle.setAttribute('aria-pressed', String(!isInset))
  }

  const toggleMode = () => {
    const nextMode = toggle.dataset.sanctionDefinitionMode === 'inset' ? 'heading' : 'inset'
    applyMode(nextMode)
  }

  toggle.addEventListener('click', toggleMode)
  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    toggleMode()
  })

  applyMode('heading')
}

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
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-a2-form')
  if (!form) return

  initSanctionDefinitionToggle()

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
    const sexualOffenceInput = form.querySelector(
      `input[name="sexual_offence"][value="${session.sexualOffence}"]`
    )
    if (sexualOffenceInput) sexualOffenceInput.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA2FieldsFromForm(form))
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
