//
// b5 – alcohol use
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB5FieldsFromForm,
  getPostB5ContinueHref,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

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

  const form = document.getElementById('tiering-b5-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (!hasRequiredDynamicAnswers(session) && redirectUnlessCheckAnswersEdit('b3.html')) return
  if (
    session.drugsMisused === 'yes' &&
    !hasCompletedB4(session) &&
    redirectUnlessCheckAnswersEdit('b4.html')
  ) {
    return
  }

  const backLink = document.getElementById('tiering-b5-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(getB5BackHref(session))
  }

  if (session.alcoholUse) {
    const input = form.querySelector(`input[name="alcohol_use"][value="${session.alcoholUse}"]`)
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB5FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB5FieldsFromForm(form)

    if (!newFields.alcoholUse) {
      form.querySelector('input[name="alcohol_use"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b5', getPostB5ContinueHref, newFields)
    )
  })
})
