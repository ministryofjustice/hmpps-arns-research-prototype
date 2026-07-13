//
// b3 – drug misuse
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB3FieldsFromForm,
  getPostB3ContinueHref,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b3-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return
  if (!session.accommodationSuitable && redirectUnlessCheckAnswersEdit('b1.html')) return
  if (!session.employmentHistory && redirectUnlessCheckAnswersEdit('b2.html')) return

  const backLink = document.getElementById('predictors-b3-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('b2.html')
  }

  if (session.drugsMisused) {
    const input = form.querySelector(`input[name="drugs_misused"][value="${session.drugsMisused}"]`)
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB3FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB3FieldsFromForm(form)

    if (!newFields.drugsMisused) {
      form.querySelector('input[name="drugs_misused"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b3', getPostB3ContinueHref, newFields)
    )
  })
})
