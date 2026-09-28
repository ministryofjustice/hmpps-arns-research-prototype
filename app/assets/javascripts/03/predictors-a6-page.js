//
// a6 – interview done (continue assessment or view static scores)
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsBackNavigation,
  isPredictorsCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getA6BackHref,
  getA6FieldsFromForm,
  getPostInterviewYesContinueHref,
  getPredictorsResultsAnswersHref,
  getPredictorsResultsScoresHref,
  hasSeenStaticAssessmentComplete,
  isA4Complete,
  isA5Required,
  syncPredictorsSessionBeforeCheckAnswers,
  predictorsJourneyHref
} from './predictors-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/03/')) return

  const form = document.getElementById('predictors-a6-form')
  if (!form) return

  const session = syncPredictorsSessionBeforeCheckAnswers()

  if (!isA4Complete(session)) {
    window.location.href = predictorsJourneyHref('a4.html')
    return
  }

  if (isA5Required(session) && !session.offencesSinceCommunity) {
    window.location.href = predictorsJourneyHref('a5.html')
    return
  }

  if (hasSeenStaticAssessmentComplete(session) && !isPredictorsCheckAnswersEdit() && !isPredictorsBackNavigation()) {
    window.location.href = predictorsJourneyHref(
      session.scoreCalculated ? getPredictorsResultsScoresHref() : getPredictorsResultsAnswersHref()
    )
    return
  }

  const backLink = document.getElementById('predictors-a6-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getA6BackHref(session))
  }

  if (session.interviewDone) {
    const input = form.querySelector(`input[name="interview_done"][value="${session.interviewDone}"]`)
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
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
      window.location.href = predictorsJourneyHref(
        completePredictorsPageAndContinue('a6', getPostInterviewYesContinueHref, {
          ...newFields,
          staticAssessmentCompleteSeen: false,
          scoreCalculated: false
        })
      )
      return
    }

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('a6', 'a7.html', {
        ...newFields,
        staticAssessmentCompleteSeen: true
      })
    )
  })
})
