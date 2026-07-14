//
// b1 – accommodation suitability
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB1FieldsFromForm,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b1-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return

  const backLink = document.getElementById('predictors-b1-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('a6.html')
  }

  if (session.accommodationSuitable) {
    const input = form.querySelector(
      `input[name="accommodation_suitable"][value="${session.accommodationSuitable}"]`
    )
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB1FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB1FieldsFromForm(form)

    if (!newFields.accommodationSuitable) {
      form.querySelector('input[name="accommodation_suitable"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b1', 'b2.html', newFields)
    )
  })
})
