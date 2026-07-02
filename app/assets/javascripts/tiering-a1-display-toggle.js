//
// a1 – toggle between summary list, summary card, and inline offence displays
//

import { applyConvictionDateUi } from './conviction-date.js'
import {
  formatDateFromParts,
  getDefaultConvictionDateParts,
  getTieringAssessmentSession,
  isDateComplete,
  normaliseDateParts
} from './tiering-page-apis.js'
import {
  populateOffenceInlineRow,
  populateOffenceNamedSummaryCard,
  populateOffenceSummaryList
} from './tiering-offence-browse.js'

const CONVICTION_DATE_INPUT_IDS = [
  'current-conviction-date-day',
  'current-conviction-date-month',
  'current-conviction-date-year'
]

const OFFENCE_DISPLAY_MODES = ['list', 'card', 'inline']

let lastA1OffenceSelection = null
let a1OffenceDisplayToggleReady = false

const getNextOffenceDisplayMode = (currentMode) => {
  const index = OFFENCE_DISPLAY_MODES.indexOf(currentMode)
  const nextIndex = index === -1 ? 0 : (index + 1) % OFFENCE_DISPLAY_MODES.length
  return OFFENCE_DISPLAY_MODES[nextIndex]
}

export const refreshA1OffenceDisplay = (container, selection) => {
  if (selection) lastA1OffenceSelection = selection

  const currentSelection = selection || lastA1OffenceSelection
  if (!container || !currentSelection) return

  const toggle = document.querySelector('[data-offence-display-toggle]')
  const mode = toggle?.dataset.offenceDisplayMode || 'list'

  if (mode === 'list') {
    const session = getTieringAssessmentSession()
    const stored = normaliseDateParts(session.convictionDate || {})
    const parts = isDateComplete(stored) ? stored : getDefaultConvictionDateParts()

    populateOffenceSummaryList(container, currentSelection, formatDateFromParts(parts), {
      listEl: container.querySelector('[data-offence-summary-list-list]')
    })
    return
  }

  if (mode === 'card') {
    populateOffenceNamedSummaryCard(container, currentSelection, {
      titleEl: container.querySelector('[data-offence-summary-card-title]'),
      listEl: container.querySelector('[data-offence-summary-list-card]')
    })
    return
  }

  populateOffenceInlineRow(container, currentSelection)
}

const setConvictionDateFieldMode = (mode) => {
  const isList = mode === 'list'
  const convictionFields = document.querySelector('[data-a1-conviction-fields]')
  const dateParts = document.querySelectorAll('[data-a1-conviction-date-part]')

  convictionFields?.classList.toggle('govuk-visually-hidden', isList)
  convictionFields?.classList.toggle('govuk-!-margin-bottom-0', isList)

  dateParts.forEach((part) => {
    part.classList.toggle('govuk-visually-hidden', isList)
  })

  CONVICTION_DATE_INPUT_IDS.forEach((id) => {
    const input = document.getElementById(id)
    if (!input) return

    if (isList) {
      input.type = 'hidden'
      input.classList.remove('govuk-input', 'govuk-date-input__input', 'govuk-input--width-2', 'govuk-input--width-4')
    } else {
      input.type = 'text'
      input.classList.add('govuk-input', 'govuk-date-input__input')
      input.classList.toggle('govuk-input--width-2', id !== 'current-conviction-date-year')
      input.classList.toggle('govuk-input--width-4', id === 'current-conviction-date-year')
    }
  })

  if (!isList) {
    applyConvictionDateUi()
  }
}

export const applyA1OffenceDisplayMode = (mode) => {
  const toggle = document.querySelector('[data-offence-display-toggle]')
  if (!toggle) return

  const form = document.getElementById('tiering-a1-form')
  const defaultMode = form?.dataset.a1OffenceDisplayDefault || 'list'
  const isList = mode === 'list'

  toggle.dataset.offenceDisplayMode = mode
  toggle.setAttribute('aria-pressed', String(mode !== defaultMode))

  toggle.querySelector('[data-offence-display-variant="list"]')?.toggleAttribute('hidden', mode !== 'list')
  toggle.querySelector('[data-offence-display-variant="card"]')?.toggleAttribute('hidden', mode !== 'card')
  toggle.querySelector('[data-offence-display-variant="inline"]')?.toggleAttribute('hidden', mode !== 'inline')

  document.getElementById('tiering-conviction-date')?.classList.toggle('govuk-visually-hidden', isList)

  setConvictionDateFieldMode(mode)

  const container = document.getElementById('current-offence-search')
  if (container && lastA1OffenceSelection) {
    refreshA1OffenceDisplay(container, lastA1OffenceSelection)
  }
}

export const initA1OffenceDisplayToggle = () => {
  const toggle = document.querySelector('[data-offence-display-toggle]')
  const form = document.getElementById('tiering-a1-form')
  if (!toggle || !form || a1OffenceDisplayToggleReady) return

  a1OffenceDisplayToggleReady = true

  const defaultMode = form.dataset.a1OffenceDisplayDefault || 'list'
  applyA1OffenceDisplayMode(defaultMode)

  const switchMode = () => {
    const nextMode = getNextOffenceDisplayMode(toggle.dataset.offenceDisplayMode || defaultMode)
    applyA1OffenceDisplayMode(nextMode)
  }

  toggle.addEventListener('click', switchMode)
  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    switchMode()
  })

  toggle.querySelector('.govuk-details__summary')?.addEventListener('click', (event) => {
    event.stopPropagation()
  })
}
