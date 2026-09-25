//
// b10 – risk of serious harm convictions
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB10BackHref,
  getB10FieldsFromForm,
  getFirstIncompleteAlcoholPage,
  getPostB10ContinueHref,
  isB7Complete,
  isB8Complete,
  isDynamicSectionReadyForB10,
  isDynamicSectionReadyForB7,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const restoreSeriousHarmConvictions = (form, seriousHarmConvictions = []) => {
  seriousHarmConvictions.forEach((value) => {
    const checkbox = form.querySelector(`input[name="serious_harm_convictions"][value="${value}"]`)
    if (checkbox) checkbox.checked = true
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/03/')) return

  const form = document.getElementById('predictors-b10-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return
  if (!isB7Complete(session) && redirectUnlessCheckAnswersEdit('b7.html')) return
  if (!isB8Complete(session) && redirectUnlessCheckAnswersEdit('b8.html')) return
  if (!isDynamicSectionReadyForB10(session) && redirectUnlessCheckAnswersEdit('b9.html')) return

  const backLink = document.getElementById('predictors-b10-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB10BackHref())
  }

  restoreSeriousHarmConvictions(form, session.seriousHarmConvictions)

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot({ ...getB10FieldsFromForm(form), b10Complete: true })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB10FieldsFromForm(form)

    if (!newFields.seriousHarmConvictions.length) {
      document.querySelector('#predictors-serious-harm-convictions')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="serious_harm_convictions"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b10', getPostB10ContinueHref(), {
        ...newFields,
        b10Complete: true
      })
    )
  })
})
