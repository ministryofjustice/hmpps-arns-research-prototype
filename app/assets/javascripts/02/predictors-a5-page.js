//
// a5 – offences since community date (and most recent offence date when yes)
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  isPredictorsCheckAnswersEdit,
  scrollToPredictorsChangeTarget,
  PREDICTORS_CHANGE_ANCHORS
} from './predictors-change-scroll.js'
import {
  applyBranchingCleanup,
  getA5FieldsFromForm,
  getPostA5ContinueHref,
  isA5Required,
  isDateComplete,
  predictorsJourneyHref
} from './predictors-journey.js'
import {
  formatDateFromParts,
  getPredictorsAssessmentSession,
  setPredictorsAssessmentSession
} from './predictors-assessment-session.js'
import { restoreDateInputs, setConditionalVisible } from '../tiering-conditional-fields.js'

const RECENT_OFFENCE_CONDITIONAL_ID = 'conditional-offences-since-community-yes'

const setRecentOffenceConditionalVisible = (show) => {
  setConditionalVisible(RECENT_OFFENCE_CONDITIONAL_ID, show)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-a5-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()
  const formattedDate = formatDateFromParts(session.communityDate || {})

  if (!isA5Required(session)) {
    window.location.href = predictorsJourneyHref('a6.html')
    return
  }

  if (!formattedDate) {
    window.location.href = predictorsJourneyHref('a4.html')
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
    hashTarget === PREDICTORS_CHANGE_ANCHORS.recentOffenceDate

  if (showRecentOffenceDate) {
    setRecentOffenceConditionalVisible(true)
    restoreDateInputs(form, 'recent-offence-date', session.recentOffenceDate)
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA5FieldsFromForm(form))
  }

  if (hashTarget === PREDICTORS_CHANGE_ANCHORS.recentOffenceDate) {
    scrollToPredictorsChangeTarget(hashTarget)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA5FieldsFromForm(form)

    if (!newFields.offencesSinceCommunity) {
      form.querySelector('input[name="offences_since_community"]')?.focus()
      return
    }

    if (newFields.offencesSinceCommunity === 'yes' && !isDateComplete(newFields.recentOffenceDate)) {
      setPredictorsAssessmentSession(applyBranchingCleanup('a5', getPredictorsAssessmentSession(), newFields))
      setRecentOffenceConditionalVisible(true)
      form.querySelector('#recent-offence-date-day')?.focus()
      return
    }

    const merged = applyBranchingCleanup('a5', getPredictorsAssessmentSession(), newFields)

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('a5', getPostA5ContinueHref(merged), newFields)
    )
  })
})
