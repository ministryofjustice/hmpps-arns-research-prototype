//
// b6b – alcohol use details (question-level header variant)
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB6FieldsFromForm,
  getPostB6bContinueHref,
  hasAlcoholUseInLast3Months,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

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

  const form = document.getElementById('predictors-b6b-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!hasRequiredDynamicAnswers(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  if (!hasAlcoholUseInLast3Months(session)) {
    window.location.href = predictorsJourneyHref(
      session.alcoholUse === 'yes-not-in-last-3-months' ? 'b6c.html' : 'b7.html'
    )
    return
  }

  const backLink = document.getElementById('predictors-b6b-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('b5.html')
  }

  restoreRadioField(form, 'alcohol_frequency_last_3_months', session.alcoholFrequencyLast3Months)
  restoreRadioField(form, 'alcohol_units_typical_day', session.alcoholUnitsTypicalDay)
  restoreRadioField(form, 'alcohol_binge_evidence', session.alcoholBingeEvidence)

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB6FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB6FieldsFromForm(form)

    if (!newFields.alcoholFrequencyLast3Months) {
      document.getElementById('predictors-alcohol-frequency')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="alcohol_frequency_last_3_months"]')?.focus()
      return
    }

    if (!newFields.alcoholUnitsTypicalDay) {
      form.querySelector('#predictors-alcohol-units')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="alcohol_units_typical_day"]')?.focus()
      return
    }

    if (!newFields.alcoholBingeEvidence) {
      form.querySelector('#predictors-alcohol-binge-evidence')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="alcohol_binge_evidence"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b6b', getPostB6bContinueHref, newFields)
    )
  })
})
