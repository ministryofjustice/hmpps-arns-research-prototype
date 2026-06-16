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
import { getA4FieldsFromForm, getFirstIncompleteA3Page, getPostA4ContinueHref, isDateComplete } from './tiering-journey.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'

const SUPERVISED_CONDITIONAL_ID = 'conditional-supervised-in-community-yes'
const COMMUNITY_DATE_CONDITIONAL_ID = 'conditional-supervised-in-community-no'

const getA4BackHref = (session) => {
  if (session.sexualOffence !== 'yes') return 'a2.html'
  return getFirstIncompleteA3Page(session) || 'a3ic.html'
}

const restoreDateInputs = (form, prefix, date = {}) => {
  const dayInput = form.querySelector(`#${prefix}-day`)
  const monthInput = form.querySelector(`#${prefix}-month`)
  const yearInput = form.querySelector(`#${prefix}-year`)

  if (dayInput) dayInput.value = date.day || ''
  if (monthInput) monthInput.value = date.month || ''
  if (yearInput) yearInput.value = date.year || ''
}

const setConditionalVisible = (id, show) => {
  const conditional = document.getElementById(id)
  if (!conditional) return

  conditional.classList.toggle('govuk-radios__conditional--hidden', !show)
}

window.GOVUKPrototypeKit.documentReady(() => {
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

  form.querySelectorAll('input[name="supervised_in_community"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const selected = form.querySelector('input[name="supervised_in_community"]:checked')?.value
      if (selected !== 'yes') restoreDateInputs(form, 'supervised-community-date')
      if (selected !== 'no') restoreDateInputs(form, 'community-date')
    })
  })

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
