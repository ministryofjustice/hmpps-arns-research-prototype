//
// a2 Q1 – pre-populated first sanction date with optional change
//

import { TIERING_CHANGE_ANCHORS } from './tiering-change-scroll.js'
import {
  formatDateFromParts,
  getDefaultFirstSanctionDateParts,
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'
import { isDateComplete, normaliseDateParts } from './tiering-journey.js'

const SUMMARY_HIDDEN_CLASS = 'tiering-system-value--summary-hidden'
const EDIT_OPEN_CLASS = 'tiering-system-value__edit--open'

const setDateInputValues = (parts) => {
  const dayInput = document.getElementById('first-sanction-date-day')
  const monthInput = document.getElementById('first-sanction-date-month')
  const yearInput = document.getElementById('first-sanction-date-year')

  if (dayInput) dayInput.value = parts.day
  if (monthInput) monthInput.value = parts.month
  if (yearInput) yearInput.value = parts.year
}

const showFirstSanctionDateEdit = (selectedBox, editPanel) => {
  selectedBox.classList.add(SUMMARY_HIDDEN_CLASS)
  editPanel.classList.add(EDIT_OPEN_CLASS)
  document.getElementById('first-sanction-date-day')?.focus()
}

const showFirstSanctionDateSelected = (selectedBox, editPanel, display, parts) => {
  const formatted = formatDateFromParts(parts)
  if (!formatted) return

  display.textContent = formatted
  selectedBox.classList.remove(SUMMARY_HIDDEN_CLASS)
  editPanel.classList.remove(EDIT_OPEN_CLASS)
}

const isFirstSanctionDateEditMode = (session = getTieringAssessmentSession()) =>
  session.firstSanctionDateEditMode === true ||
  window.location.hash.slice(1) === TIERING_CHANGE_ANCHORS.firstSanctionDate

const getFirstSanctionDatePartsForDisplay = (session = getTieringAssessmentSession()) => {
  const stored = normaliseDateParts(session.firstSanctionDate || {})
  return isDateComplete(stored) ? stored : getDefaultFirstSanctionDateParts()
}

export const persistFirstSanctionDateState = ({ editing } = {}) => {
  if (!document.querySelector('[data-first-sanction-date-selected]')) return

  const updates = {}
  const parts = normaliseDateParts({
    day: document.getElementById('first-sanction-date-day')?.value,
    month: document.getElementById('first-sanction-date-month')?.value,
    year: document.getElementById('first-sanction-date-year')?.value
  })

  if (isDateComplete(parts) || parts.day || parts.month || parts.year) {
    updates.firstSanctionDate = parts
  }

  if (editing !== undefined) {
    updates.firstSanctionDateEditMode = editing
  }

  if (Object.keys(updates).length) {
    setTieringAssessmentSession(updates)
  }
}

const applyFirstSanctionDateUi = () => {
  const selectedBox = document.querySelector('[data-first-sanction-date-selected]')
  const editPanel = document.querySelector('[data-first-sanction-date-edit]')
  const display = document.querySelector('[data-first-sanction-date-display]')

  if (!selectedBox || !editPanel || !display) return

  const session = getTieringAssessmentSession()
  const parts = getFirstSanctionDatePartsForDisplay(session)

  setDateInputValues(parts)

  if (isFirstSanctionDateEditMode(session)) {
    showFirstSanctionDateEdit(selectedBox, editPanel)
  } else {
    showFirstSanctionDateSelected(selectedBox, editPanel, display, parts)
  }
}

export const initFirstSanctionDate = () => {
  const selectedBox = document.querySelector('[data-first-sanction-date-selected]')
  const editPanel = document.querySelector('[data-first-sanction-date-edit]')
  const display = document.querySelector('[data-first-sanction-date-display]')
  const changeLink = document.querySelector('[data-first-sanction-date-change]')

  if (!selectedBox || !editPanel || !display || !changeLink) return

  applyFirstSanctionDateUi()
  persistFirstSanctionDateState()

  changeLink.addEventListener('click', (event) => {
    event.preventDefault()
    persistFirstSanctionDateState({ editing: true })
    showFirstSanctionDateEdit(selectedBox, editPanel)
  })

  ;['first-sanction-date-day', 'first-sanction-date-month', 'first-sanction-date-year'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      persistFirstSanctionDateState()
    })
  })

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) applyFirstSanctionDateUi()
  })
}
