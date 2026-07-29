//
// b2 – current employment status
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB2FieldsFromForm,
  isB1Complete,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b2-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return
  if (!isB1Complete(session) && redirectUnlessCheckAnswersEdit('b1.html')) return

  const backLink = document.getElementById('predictors-b2-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('b1.html')
  }

  if (session.employmentHistory) {
    const input = form.querySelector(
      `input[name="employment_history"][value="${session.employmentHistory}"]`
    )
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB2FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB2FieldsFromForm(form)

    if (!newFields.employmentHistory) {
      form.querySelector('input[name="employment_history"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b2', 'b3.html', newFields)
    )
  })
})
