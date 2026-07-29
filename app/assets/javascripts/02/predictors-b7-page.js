//
// b7 – important people + relationship status
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB7BackHref,
  getB7FieldsFromForm,
  getFirstIncompleteAlcoholPage,
  getPostB7ContinueHref,
  isDynamicSectionReadyForB7,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const restoreImportantPeople = (form, importantPeople = []) => {
  importantPeople.forEach((value) => {
    const checkbox = form.querySelector(`input[name="important_people"][value="${value}"]`)
    if (checkbox) checkbox.checked = true
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b7-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return

  const backLink = document.getElementById('predictors-b7-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB7BackHref(session))
  }

  restoreImportantPeople(form, session.importantPeople)

  if (session.relationshipStatus) {
    const input = form.querySelector(
      `input[name="relationship_status"][value="${session.relationshipStatus}"]`
    )
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB7FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB7FieldsFromForm(form)

    if (!newFields.importantPeople.length) {
      form.querySelector('input[name="important_people"]')?.focus()
      return
    }

    if (!newFields.relationshipStatus) {
      form.querySelector('input[name="relationship_status"]')?.focus()
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b7', getPostB7ContinueHref(), newFields)
    )
  })
})
