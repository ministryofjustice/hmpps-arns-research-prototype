//
// a6 – interview done (continue assessment or view static scores)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringBackNavigation,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getA6BackHref,
  getA6FieldsFromForm,
  getPostInterviewYesContinueHref,
  getTieringResultsAnswersHref,
  getTieringResultsScoresHref,
  hasSeenStaticAssessmentComplete,
  isA4Complete,
  isA5Required,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-a6-form')
  if (!form) return

  const session = syncTieringSessionBeforeCheckAnswers()

  if (!isA4Complete(session)) {
    window.location.href = tieringJourneyHref('a4.html')
    return
  }

  if (isA5Required(session) && !session.offencesSinceCommunity) {
    window.location.href = tieringJourneyHref('a5.html')
    return
  }

  if (hasSeenStaticAssessmentComplete(session) && !isTieringCheckAnswersEdit() && !isTieringBackNavigation()) {
    window.location.href = tieringJourneyHref(
      session.scoreCalculated ? getTieringResultsScoresHref() : getTieringResultsAnswersHref()
    )
    return
  }

  const backLink = document.getElementById('tiering-a6-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(getA6BackHref(session))
  }

  if (session.interviewDone) {
    const input = form.querySelector(`input[name="interview_done"][value="${session.interviewDone}"]`)
    if (input) input.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA6FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA6FieldsFromForm(form)

    if (!newFields.interviewDone) {
      form.querySelector('input[name="interview_done"]')?.focus()
      return
    }

    if (newFields.interviewDone === 'yes') {
      window.location.href = tieringJourneyHref(
        completeTieringPageAndContinue('a6', getPostInterviewYesContinueHref, {
          ...newFields,
          staticAssessmentCompleteSeen: false,
          scoreCalculated: false
        })
      )
      return
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('a6', 'a7.html', {
        ...newFields,
        staticAssessmentCompleteSeen: true
      })
    )
  })
})
