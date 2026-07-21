//
// a4 – community supervision start date
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  scrollToPredictorsChangeTarget,
  PREDICTORS_CHANGE_ANCHORS
} from './predictors-change-scroll.js'
import { restoreDateInputs } from './predictors-conditional-fields.js'
import {
  getA4FieldsFromForm,
  getDefaultCommunityDateParts,
  getFirstIncompleteA3Page,
  getPostA4ContinueHref,
  isDateComplete
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const getA4BackHref = (session) => {
  if (session.sexualOffence !== 'yes') return 'a2b.html'
  return getFirstIncompleteA3Page(session) || 'a3.html'
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-a4-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()
  const backLink = document.getElementById('predictors-a4-back')

  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getA4BackHref(session))
  }

  const communityDate = isDateComplete(session.communityDate)
    ? session.communityDate
    : getDefaultCommunityDateParts()

  restoreDateInputs(form, 'supervised-community-date', communityDate)

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA4FieldsFromForm(form))
  }

  const hashTarget = window.location.hash.slice(1)
  if (
    hashTarget === PREDICTORS_CHANGE_ANCHORS.supervisedCommunityDate ||
    hashTarget === PREDICTORS_CHANGE_ANCHORS.supervisedInCommunity
  ) {
    scrollToPredictorsChangeTarget(PREDICTORS_CHANGE_ANCHORS.supervisedCommunityDate)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA4FieldsFromForm(form)

    if (!isDateComplete(newFields.communityDate)) {
      form.querySelector('#supervised-community-date-day')?.focus()
      return
    }

    window.location.href = completePredictorsPageAndContinue(
      'a4',
      getPostA4ContinueHref({ ...getPredictorsAssessmentSession(), ...newFields }),
      newFields
    )
  })
})
