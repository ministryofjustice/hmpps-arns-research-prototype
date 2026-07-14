//
// b5 – alcohol use
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB5FieldsFromForm,
  getPostB5ContinueHref,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const hasRequiredDynamicAnswers = (session) =>
  session.interviewDone === 'yes' &&
  session.accommodationSuitable &&
  session.employmentHistory &&
  session.drugsMisused

const hasCompletedB4 = (session) => Object.keys(session.misusedDrugs || {}).length > 0

const getB5BackHref = (session) =>
  session.drugsMisused === 'yes' ? 'b4.html' : 'b3.html'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b5-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!hasRequiredDynamicAnswers(session) && redirectUnlessCheckAnswersEdit('b3.html')) return
  if (
    session.drugsMisused === 'yes' &&
    !hasCompletedB4(session) &&
    redirectUnlessCheckAnswersEdit('b4.html')
  ) {
    return
  }

  const backLink = document.getElementById('predictors-b5-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB5BackHref(session))
  }

  if (session.alcoholUse) {
    const input = form.querySelector(`input[name="alcohol_use"][value="${session.alcoholUse}"]`)
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB5FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB5FieldsFromForm(form)

    if (!newFields.alcoholUse) {
      form.querySelector('input[name="alcohol_use"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b5', getPostB5ContinueHref, newFields)
    )
  })
})
