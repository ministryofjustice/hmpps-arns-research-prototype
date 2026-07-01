//
// b8 – thinking, attitudes and behaviours
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  getB8BackHref,
  getB8FieldsFromForm,
  getFirstIncompleteAlcoholPage,
  getPostB8ContinueHref,
  isDynamicSectionReadyForB7,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

const B8_FIELD_CHECKS = [
  {
    field: 'activitiesLinkedToOffending',
    name: 'activities_linked_to_offending',
    anchor: '#tiering-activities-linked-to-offending'
  },
  {
    field: 'manageTemper',
    name: 'manage_temper',
    anchor: '#tiering-manage-temper'
  },
  {
    field: 'actOnImpulse',
    name: 'act_on_impulse',
    anchor: '#tiering-act-on-impulse'
  },
  {
    field: 'supportCriminalBehaviour',
    name: 'support_criminal_behaviour',
    anchor: '#tiering-support-criminal-behaviour'
  }
]

const restoreRadioField = (form, name, value) => {
  if (!value) return

  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-b8-form')
  if (!form) return

  const session = getTieringAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return
  if (!session.relationshipStatus && redirectUnlessCheckAnswersEdit('b7.html')) return

  const backLink = document.getElementById('tiering-b8-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(getB8BackHref())
  }

  B8_FIELD_CHECKS.forEach(({ field, name }) => {
    restoreRadioField(form, name, session[field])
  })

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB8FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getB8FieldsFromForm(form)

    for (const { field, name, anchor } of B8_FIELD_CHECKS) {
      if (!newFields[field]) {
        document.querySelector(anchor)?.scrollIntoView({ block: 'start' })
        form.querySelector(`input[name="${name}"]`)?.focus()
        return
      }
    }

    window.location.href = tieringJourneyHref(
      completeTieringPageAndContinue('b8', getPostB8ContinueHref(), newFields)
    )
  })
})
