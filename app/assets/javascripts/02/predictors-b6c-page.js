//
// b6c – binge drinking evidence
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB6cBackHref,
  getB6cFieldsFromForm,
  getPostB6cContinueHref,
  hasAlcoholUseInLast3Months,
  hasAlcoholUseYesAnswer,
  isB6Complete,
  isDynamicSectionReadyForB7,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b6c-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return
  if (!hasAlcoholUseYesAnswer(session) && redirectUnlessCheckAnswersEdit('b7.html')) return

  if (hasAlcoholUseInLast3Months(session)) {
    window.location.href = predictorsJourneyHref(isB6Complete(session) ? 'b7.html' : 'b6.html')
    return
  }

  const backLink = document.getElementById('predictors-b6c-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB6cBackHref(session))
  }

  if (session.alcoholBingeEvidence) {
    const input = form.querySelector(
      `input[name="alcohol_binge_evidence"][value="${session.alcoholBingeEvidence}"]`
    )
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB6cFieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB6cFieldsFromForm(form)

    if (!newFields.alcoholBingeEvidence) {
      form.querySelector('input[name="alcohol_binge_evidence"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b6c', getPostB6cContinueHref(), newFields)
    )
  })
})
