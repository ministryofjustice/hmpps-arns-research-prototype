//
// b7 – relationship status
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB7BackHref,
  getB7FieldsFromForm,
  getFirstIncompleteAlcoholPage,
  getPostB7ContinueHref,
  isDynamicSectionReadyForB7,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b7-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return

  const backLink = document.getElementById('tiering-b7-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(getB7BackHref(session))
  }

  if (session.relationshipStatus) {
    const input = form.querySelector(
      `input[name="relationship_status"][value="${session.relationshipStatus}"]`
    )
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB7FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB7FieldsFromForm(form)

    if (!newFields.relationshipStatus) {
      form.querySelector('input[name="relationship_status"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b7', getPostB7ContinueHref(), newFields)
    )
  })
})
