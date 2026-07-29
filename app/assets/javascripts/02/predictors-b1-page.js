//
// b1 – accommodation (living with + suitability)
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
  getB1ValidationError,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const restoreLivingWith = (form, session) => {
  const livingWith = Array.isArray(session.livingWith) ? session.livingWith : []

  livingWith.forEach((value) => {
    const checkbox = form.querySelector(`input[name="living_with"][value="${value}"]`)
    if (checkbox) checkbox.checked = true
  })
}

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

  restoreLivingWith(form, session)

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

    const validationError = getB1ValidationError(form)
    if (validationError) {
      if (validationError.scrollId) {
        document.getElementById(validationError.scrollId)?.scrollIntoView({ block: 'start' })
      }

      form.querySelector(validationError.focusSelector)?.focus()
      return
    }

    const newFields = getB1FieldsFromForm(form)

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b1', 'b2.html', newFields)
    )
  })
})
