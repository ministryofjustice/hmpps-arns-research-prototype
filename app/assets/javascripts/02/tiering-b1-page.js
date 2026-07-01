//
// b1 – accommodation suitability
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB1FieldsFromForm,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b1-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return

  const backLink = document.getElementById('tiering-b1-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('a6.html')
  }

  if (session.accommodationSuitable) {
    const input = form.querySelector(
      `input[name="accommodation_suitable"][value="${session.accommodationSuitable}"]`
    )
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB1FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB1FieldsFromForm(form)

    if (!newFields.accommodationSuitable) {
      form.querySelector('input[name="accommodation_suitable"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b1', 'b2.html', newFields)
    )
  })
})
