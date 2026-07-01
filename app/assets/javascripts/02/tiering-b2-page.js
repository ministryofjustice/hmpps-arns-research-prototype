//
// b2 – employment history
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB2FieldsFromForm,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b2-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return
  if (!session.accommodationSuitable && redirectUnlessCheckAnswersEdit('b1.html')) return

  const backLink = document.getElementById('tiering-b2-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('b1.html')
  }

  if (session.employmentHistory) {
    const input = form.querySelector(
      `input[name="employment_history"][value="${session.employmentHistory}"]`
    )
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB2FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB2FieldsFromForm(form)

    if (!newFields.employmentHistory) {
      form.querySelector('input[name="employment_history"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b2', 'b3.html', newFields)
    )
  })
})
