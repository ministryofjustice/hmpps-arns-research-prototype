//
// b10 – risk of serious harm convictions
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB10BackHref,
  getB10FieldsFromForm,
  getFirstIncompleteAlcoholPage,
  getPostB10ContinueHref,
  isB8Complete,
  isDynamicSectionReadyForB10,
  isDynamicSectionReadyForB7,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

const restoreSeriousHarmConvictions = (form, seriousHarmConvictions = []) => {
  seriousHarmConvictions.forEach((value) => {
    const checkbox = form.querySelector(`input[name="serious_harm_convictions"][value="${value}"]`)
    if (checkbox) checkbox.checked = true
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b10-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return
  if (!session.relationshipStatus && redirectUnlessCheckAnswersEdit('b7.html')) return
  if (!isB8Complete(session) && redirectUnlessCheckAnswersEdit('b8.html')) return
  if (!isDynamicSectionReadyForB10(session) && redirectUnlessCheckAnswersEdit('b9.html')) return

  const backLink = document.getElementById('tiering-b10-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(getB10BackHref())
  }

  restoreSeriousHarmConvictions(form, session.seriousHarmConvictions)

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot({ ...getB10FieldsFromForm(form), b10Complete: true })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB10FieldsFromForm(form)

    if (!newFields.seriousHarmConvictions.length) {
      document.querySelector('#tiering-serious-harm-convictions')?.scrollIntoView({ block: 'start' })
      form.querySelector('input[name="serious_harm_convictions"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b10', getPostB10ContinueHref(), {
        ...newFields,
        b10Complete: true
      })
    )
  })
})
