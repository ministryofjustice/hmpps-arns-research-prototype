//
// a4 – community supervision and date
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  scrollToTieringChangeTarget,
  TIERING_CHANGE_ANCHORS
} from './tiering-change-scroll.js'
import { restoreDateInputs, setConditionalVisible } from '../tiering-conditional-fields.js'
import { getA4FieldsFromForm, getFirstIncompleteA3Page, getPostA4ContinueHref, isDateComplete } from './tiering-journey.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'

const SUPERVISED_CONDITIONAL_ID = 'conditional-supervised-in-community-yes'
const COMMUNITY_DATE_CONDITIONAL_ID = 'conditional-supervised-in-community-no'

const getA4BackHref = (session) => {
  if (session.sexualOffence !== 'yes') return 'a2.html'
  return getFirstIncompleteA3Page(session) || 'a3.html'
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-a4-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const backLink = document.getElementById('tiering-a4-back')

  if (backLink) {
    backLink.href = getTieringBackLinkHref(getA4BackHref(session))
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
    supervisedInCommunity === 'yes' || hashTarget === TIERING_CHANGE_ANCHORS.supervisedCommunityDate
  const showCommunityDate =
    supervisedInCommunity === 'no' || hashTarget === TIERING_CHANGE_ANCHORS.communityDate

  if (showSupervisedDate) {
    setConditionalVisible(SUPERVISED_CONDITIONAL_ID, true)
    restoreDateInputs(form, 'supervised-community-date', session.communityDate)
  }

  if (showCommunityDate) {
    setConditionalVisible(COMMUNITY_DATE_CONDITIONAL_ID, true)
    restoreDateInputs(form, 'community-date', session.communityDate)
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA4FieldsFromForm(form))
  }

  if (hashTarget === TIERING_CHANGE_ANCHORS.supervisedInCommunity || hashTarget === TIERING_CHANGE_ANCHORS.communityDate || hashTarget === TIERING_CHANGE_ANCHORS.supervisedCommunityDate) {
    scrollToTieringChangeTarget(hashTarget)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA4FieldsFromForm(form)

    if (!newFields.supervisedInCommunity) {
      form.querySelector('input[name="supervised_in_community"]')?.focus()
      return
    }

    if (!isDateComplete(newFields.communityDate)) {
      setTieringAssessmentSession({ ...getTieringAssessmentSession(), ...newFields })
      if (newFields.supervisedInCommunity === 'yes') {
        setConditionalVisible(SUPERVISED_CONDITIONAL_ID, true)
        form.querySelector('#supervised-community-date-day')?.focus()
      } else {
        setConditionalVisible(COMMUNITY_DATE_CONDITIONAL_ID, true)
        form.querySelector('#community-date-day')?.focus()
      }
      return
    }

    window.location.href = completeTieringPageAndContinue(
      'a4',
      getPostA4ContinueHref({ ...getTieringAssessmentSession(), ...newFields }),
      newFields
    )
  })
})
