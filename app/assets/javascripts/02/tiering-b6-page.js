//
// b6 – alcohol use details
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB6FieldsFromForm,
  getPostB6bContinueHref,
  hasAlcoholUseInLast3Months,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

const hasRequiredDynamicAnswers = (session) =>
  session.interviewDone === 'yes' &&
  session.accommodationSuitable &&
  session.employmentHistory &&
  session.drugsMisused &&
  session.alcoholUse

const restoreRadioField = (form, name, value) => {
  if (!value) return

  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b6-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (!hasRequiredDynamicAnswers(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  if (!hasAlcoholUseInLast3Months(session)) {
    window.location.href = tieringJourneyHref(
      session.alcoholUse === 'yes-not-in-last-3-months' ? 'b6b.html' : 'b7.html'
    )
    return
  }

  const backLink = document.getElementById('tiering-b6-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('b5.html')
  }

  restoreRadioField(form, 'alcohol_frequency_last_3_months', session.alcoholFrequencyLast3Months)
  restoreRadioField(form, 'alcohol_units_typical_day', session.alcoholUnitsTypicalDay)
  restoreRadioField(form, 'alcohol_binge_evidence', session.alcoholBingeEvidence)

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB6FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB6FieldsFromForm(form)

    if (!newFields.alcoholFrequencyLast3Months) {
      form.querySelector('#tiering-alcohol-frequency')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="alcohol_frequency_last_3_months"]')?.focus()
      return
    }

    if (!newFields.alcoholUnitsTypicalDay) {
      form.querySelector('#tiering-alcohol-units')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="alcohol_units_typical_day"]')?.focus()
      return
    }

    if (!newFields.alcoholBingeEvidence) {
      form.querySelector('#tiering-alcohol-binge-evidence')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="alcohol_binge_evidence"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b6', getPostB6bContinueHref, newFields)
    )
  })
})
