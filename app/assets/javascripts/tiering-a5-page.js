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
  isA5Required,
  isDateComplete,
  tieringJourneyHref
} from './tiering-journey.js'
import {
  formatDateFromParts,
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'
import { restoreDateInputs, setConditionalVisible } from './tiering-conditional-fields.js'

const RECENT_OFFENCE_CONDITIONAL_ID = 'conditional-offences-since-community-yes'

const setRecentOffenceConditionalVisible = (show) => {
  setConditionalVisible(RECENT_OFFENCE_CONDITIONAL_ID, show)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (window.location.pathname.includes('/02/') || window.location.pathname.includes('/03/') || window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-a5-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const formattedDate = formatDateFromParts(session.communityDate || {})

  if (!isA5Required(session)) {
    window.location.href = tieringJourneyHref('a6.html')
    return
  }

  if (!formattedDate) {
    window.location.href = tieringJourneyHref('a4.html')
    return
  }

  document.querySelectorAll('[data-community-date-display]').forEach((element) => {
    element.textContent = formattedDate
  })

  if (session.offencesSinceCommunity) {
    const input = form.querySelector(
      `input[name="offences_since_community"][value="${session.offencesSinceCommunity}"]`
    )
    if (input) input.checked = true
  }

  const hashTarget = window.location.hash.slice(1)
  const showRecentOffenceDate =
    session.offencesSinceCommunity === 'yes' ||
    hashTarget === TIERING_CHANGE_ANCHORS.recentOffenceDate

  if (showRecentOffenceDate) {
    setRecentOffenceConditionalVisible(true)
    restoreDateInputs(form, 'recent-offence-date', session.recentOffenceDate)
  }

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
      setRecentOffenceConditionalVisible(true)
      form.querySelector('#recent-offence-date-day')?.focus()
      return
    }

    const merged = applyBranchingCleanup('a5', getTieringAssessmentSession(), newFields)

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('a5', getPostA5ContinueHref(merged), newFields)
    )
  })
})
