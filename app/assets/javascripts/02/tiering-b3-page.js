//
// b3 – drug misuse
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB3FieldsFromForm,
  getPostB3ContinueHref,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b3-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return
  if (!session.accommodationSuitable && redirectUnlessCheckAnswersEdit('b1.html')) return
  if (!session.employmentHistory && redirectUnlessCheckAnswersEdit('b2.html')) return

  const backLink = document.getElementById('tiering-b3-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref('b2.html')
  }

  if (session.drugsMisused) {
    const input = form.querySelector(`input[name="drugs_misused"][value="${session.drugsMisused}"]`)
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB3FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB3FieldsFromForm(form)

    if (!newFields.drugsMisused) {
      form.querySelector('input[name="drugs_misused"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b3', getPostB3ContinueHref, newFields)
    )
  })
})
