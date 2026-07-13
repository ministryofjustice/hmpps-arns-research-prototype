//
// a4 – community supervision and date
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  scrollToPredictorsChangeTarget,
  PREDICTORS_CHANGE_ANCHORS
} from './predictors-change-scroll.js'
import { restoreDateInputs, setConditionalVisible } from '../tiering-conditional-fields.js'
import { getA4FieldsFromForm, getFirstIncompleteA3Page, getPostA4ContinueHref, isDateComplete } from './predictors-journey.js'
import { getPredictorsAssessmentSession, setPredictorsAssessmentSession } from './predictors-assessment-session.js'

const SUPERVISED_CONDITIONAL_ID = 'conditional-supervised-in-community-yes'

const getA4BackHref = (session) => {
  if (session.sexualOffence !== 'yes') return 'a2.html'
  return getFirstIncompleteA3Page(session) || 'a3.html'
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-a4-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()
  const backLink = document.getElementById('predictors-a4-back')

  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getA4BackHref(session))
  }

  if (session.supervisedInCommunity) {
    const input = form.querySelector(
      `input[name="supervised_in_community"][value="${session.supervisedInCommunity}"]`
    )
    if (input) input.checked = true
  }

  const hashTarget = window.location.hash.slice(1)
  const supervisedInCommunity = session.supervisedInCommunity
  const showSupervisedDate =
    supervisedInCommunity === 'yes' || hashTarget === PREDICTORS_CHANGE_ANCHORS.supervisedCommunityDate

  if (showSupervisedDate) {
    setConditionalVisible(SUPERVISED_CONDITIONAL_ID, true)
    restoreDateInputs(form, 'supervised-community-date', session.communityDate)
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA4FieldsFromForm(form))
  }

  if (hashTarget === PREDICTORS_CHANGE_ANCHORS.supervisedInCommunity || hashTarget === PREDICTORS_CHANGE_ANCHORS.supervisedCommunityDate) {
    scrollToPredictorsChangeTarget(hashTarget)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA4FieldsFromForm(form)

    if (!newFields.supervisedInCommunity) {
      form.querySelector('input[name="supervised_in_community"]')?.focus()
      return
    }

    if (newFields.supervisedInCommunity === 'yes' && !isDateComplete(newFields.communityDate)) {
      setPredictorsAssessmentSession({ ...getPredictorsAssessmentSession(), ...newFields })
      setConditionalVisible(SUPERVISED_CONDITIONAL_ID, true)
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
