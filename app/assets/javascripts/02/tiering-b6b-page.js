//
// b6b – binge drinking evidence
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB6bBackHref,
  getB6bFieldsFromForm,
  getPostB6bContinueHref,
  hasAlcoholUseInLast3Months,
  hasAlcoholUseYesAnswer,
  isB6Complete,
  isDynamicSectionReadyForB7,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b6b-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return
  if (!hasAlcoholUseYesAnswer(session) && redirectUnlessCheckAnswersEdit('b7.html')) return

  if (hasAlcoholUseInLast3Months(session)) {
    window.location.href = tieringJourneyHref(isB6Complete(session) ? 'b7.html' : 'b6.html')
    return
  }

  const backLink = document.getElementById('tiering-b6b-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(getB6bBackHref(session))
  }

  if (session.alcoholBingeEvidence) {
    const input = form.querySelector(
      `input[name="alcohol_binge_evidence"][value="${session.alcoholBingeEvidence}"]`
    )
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB6bFieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB6bFieldsFromForm(form)

    if (!newFields.alcoholBingeEvidence) {
      form.querySelector('input[name="alcohol_binge_evidence"]')?.focus()
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b6b', getPostB6bContinueHref(), newFields)
    )
  })
})
