//
// a5 – offences since community date (and most recent offence date when yes)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit,
  scrollToTieringChangeTarget,
  TIERING_CHANGE_ANCHORS
} from './tiering-change-scroll.js'
import {
  applyBranchingCleanup,
  getA5FieldsFromForm,
  getPostA5ContinueHref,
  isDateComplete,
  tieringJourneyHref
} from './tiering-journey.js'
import {
  formatDateFromParts,
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'

const showRecentOffenceDatePanel = (panel, show) => {
  if (panel) panel.hidden = !show
}

const restoreRecentOffenceDate = (form, date = {}) => {
  const dayInput = form.querySelector('#recent-offence-date-day')
  const monthInput = form.querySelector('#recent-offence-date-month')
  const yearInput = form.querySelector('#recent-offence-date-year')

  if (dayInput) dayInput.value = date.day || ''
  if (monthInput) monthInput.value = date.month || ''
  if (yearInput) yearInput.value = date.year || ''
}

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a5-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const datePanel = document.getElementById('tiering-recent-offence-date-panel')
  const formattedDate = formatDateFromParts(session.communityDate || {})

  if (!formattedDate) {
    window.location.href = tieringJourneyHref('a4.html')
    return
  }

  const dateDisplay = document.querySelector('[data-community-date-display]')
  if (dateDisplay) dateDisplay.textContent = formattedDate

  if (session.offencesSinceCommunity) {
    const input = form.querySelector(
      `input[name="offences_since_community"][value="${session.offencesSinceCommunity}"]`
    )
    if (input) input.checked = true
  }

  const hashTarget = window.location.hash.slice(1)
  const showDatePanel =
    session.offencesSinceCommunity === 'yes' ||
    hashTarget === TIERING_CHANGE_ANCHORS.recentOffenceDate

  if (showDatePanel) {
    showRecentOffenceDatePanel(datePanel, true)
    restoreRecentOffenceDate(form, session.recentOffenceDate)
  }

  form.querySelectorAll('input[name="offences_since_community"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isYes = form.querySelector('input[name="offences_since_community"]:checked')?.value === 'yes'
      showRecentOffenceDatePanel(datePanel, isYes)
      if (!isYes) restoreRecentOffenceDate(form)
    })
  })

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA5FieldsFromForm(form))
  }

  if (hashTarget === TIERING_CHANGE_ANCHORS.recentOffenceDate) {
    scrollToTieringChangeTarget(hashTarget)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA5FieldsFromForm(form)

    if (!newFields.offencesSinceCommunity) {
      form.querySelector('input[name="offences_since_community"]')?.focus()
      return
    }

    if (newFields.offencesSinceCommunity === 'yes' && !isDateComplete(newFields.recentOffenceDate)) {
      setTieringAssessmentSession(applyBranchingCleanup('a5', getTieringAssessmentSession(), newFields))
      showRecentOffenceDatePanel(datePanel, true)
      form.querySelector('#recent-offence-date-day')?.focus()
      return
    }

    const merged = applyBranchingCleanup('a5', getTieringAssessmentSession(), newFields)

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('a5', getPostA5ContinueHref(merged), newFields)
    )
  })
})
