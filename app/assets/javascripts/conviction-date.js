//
// a1 – conviction date inputs (optional OASys summary on other pages)
//

import {
  formatDateFromParts,
  getDefaultConvictionDateParts,
  getTieringAssessmentSession,
  setTieringAssessmentSession,
  TIERING_CHANGE_ANCHORS,
  isDateComplete,
  normaliseDateParts
} from './tiering-page-apis.js'

const SUMMARY_HIDDEN_CLASS = 'tiering-system-value--summary-hidden'
const EDIT_OPEN_CLASS = 'tiering-system-value__edit--open'

const setDateInputValues = (parts) => {
  const dayInput = document.getElementById('current-conviction-date-day')
  const monthInput = document.getElementById('current-conviction-date-month')
  const yearInput = document.getElementById('current-conviction-date-year')

  if (dayInput) dayInput.value = parts.day
  if (monthInput) monthInput.value = parts.month
  if (yearInput) yearInput.value = parts.year
}

const showConvictionDateEdit = (selectedBox, editPanel) => {
  if (selectedBox) selectedBox.classList.add(SUMMARY_HIDDEN_CLASS)
  editPanel.classList.add(EDIT_OPEN_CLASS)
  document.getElementById('current-conviction-date-day')?.focus()
}

const showConvictionDateSelected = (selectedBox, editPanel, display, parts) => {
  const formatted = formatDateFromParts(parts)
  if (!formatted) return

  display.textContent = formatted
  selectedBox.classList.remove(SUMMARY_HIDDEN_CLASS)
  editPanel.classList.remove(EDIT_OPEN_CLASS)
}

export const isConvictionDateEditPanelOpen = () => {
  const editPanel = document.querySelector('[data-conviction-date-edit]')
  if (editPanel?.hasAttribute('data-conviction-date-input-only')) return true
  return Boolean(editPanel?.classList.contains(EDIT_OPEN_CLASS))
}

export const getConvictionDatePartsFromDom = () =>
  normaliseDateParts({
    day: document.getElementById('current-conviction-date-day')?.value,
    month: document.getElementById('current-conviction-date-month')?.value,
    year: document.getElementById('current-conviction-date-year')?.value
  })

/** Keep date values and edit/summary mode across offence changes and page loads */
export const persistConvictionDateState = ({ editing } = {}) => {
  if (!document.querySelector('[data-conviction-date-edit]')) return

  const updates = {}
  const parts = getConvictionDatePartsFromDom()

  if (isDateComplete(parts)) {
    updates.convictionDate = parts
  } else if (parts.day || parts.month || parts.year) {
    updates.convictionDate = parts
  }

  if (editing !== undefined) {
    updates.convictionDateEditMode = editing
  }

  if (Object.keys(updates).length) {
    setTieringAssessmentSession(updates)
  }
}

const isConvictionDateEditMode = (session = getTieringAssessmentSession()) =>
  session.convictionDateEditMode === true ||
  window.location.hash.slice(1) === TIERING_CHANGE_ANCHORS.convictionDate

const getConvictionDatePartsForDisplay = (
  session = getTieringAssessmentSession(),
  { inputOnly = false } = {}
) => {
  const stored = normaliseDateParts(session.convictionDate || {})

  if (inputOnly) {
    if (stored.day || stored.month || stored.year) return stored
    return getDefaultConvictionDateParts()
  }

  return isDateComplete(stored) ? stored : getDefaultConvictionDateParts()
}

export const applyConvictionDateUi = () => {
  const selectedBox = document.querySelector('[data-conviction-date-selected]')
  const editPanel = document.querySelector('[data-conviction-date-edit]')
  const display = document.querySelector('[data-conviction-date-display]')

  if (!editPanel) return

  const session = getTieringAssessmentSession()
  const inputOnly = editPanel.hasAttribute('data-conviction-date-input-only')
  const parts = getConvictionDatePartsForDisplay(session, { inputOnly })

  setDateInputValues(parts)

  if (inputOnly) {
    editPanel.classList.add(EDIT_OPEN_CLASS)
    return
  }

  if (!selectedBox || !display) return

  if (isConvictionDateEditMode(session)) {
    showConvictionDateEdit(selectedBox, editPanel)
  } else {
    showConvictionDateSelected(selectedBox, editPanel, display, parts)
  }
}

export const initConvictionDate = () => {
  const selectedBox = document.querySelector('[data-conviction-date-selected]')
  const editPanel = document.querySelector('[data-conviction-date-edit]')
  const display = document.querySelector('[data-conviction-date-display]')
  const changeLink = document.querySelector('[data-conviction-date-change]')
  const inputOnly = editPanel?.hasAttribute('data-conviction-date-input-only')

  if (!editPanel) return

  applyConvictionDateUi()

  if (inputOnly) {
    ;['current-conviction-date-day', 'current-conviction-date-month', 'current-conviction-date-year'].forEach(
      (id) => {
        document.getElementById(id)?.addEventListener('input', () => {
          persistConvictionDateState()
        })
      }
    )

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) applyConvictionDateUi()
    })
    return
  }

  if (!selectedBox || !display || !changeLink) return

  changeLink.addEventListener('click', (event) => {
    event.preventDefault()
    persistConvictionDateState({ editing: true })
    showConvictionDateEdit(selectedBox, editPanel)
  })

  ;['current-conviction-date-day', 'current-conviction-date-month', 'current-conviction-date-year'].forEach(
    (id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        persistConvictionDateState()
      })
    }
  )

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) applyConvictionDateUi()
  })
}
