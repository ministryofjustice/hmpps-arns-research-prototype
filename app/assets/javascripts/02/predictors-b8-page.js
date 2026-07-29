//
// b8 – thinking, attitudes and behaviours
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB8BackHref,
  getB8FieldsFromForm,
  getFirstIncompleteAlcoholPage,
  getPostB8ContinueHref,
  isB7Complete,
  isDynamicSectionReadyForB7,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const B8_FIELD_CHECKS = [
  {
    field: 'activitiesLinkedToOffending',
    name: 'activities_linked_to_offending',
    anchor: '#predictors-activities-linked-to-offending'
  },
  {
    field: 'manageTemper',
    name: 'manage_temper',
    anchor: '#predictors-manage-temper'
  },
  {
    field: 'actOnImpulse',
    name: 'act_on_impulse',
    anchor: '#predictors-act-on-impulse'
  },
  {
    field: 'supportCriminalBehaviour',
    name: 'support_criminal_behaviour',
    anchor: '#predictors-support-criminal-behaviour'
  }
]

const restoreRadioField = (form, name, value) => {
  if (!value) return

  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b8-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return
  if (!isB7Complete(session) && redirectUnlessCheckAnswersEdit('b7.html')) return

  const backLink = document.getElementById('predictors-b8-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB8BackHref())
  }

  B8_FIELD_CHECKS.forEach(({ field, name }) => {
    restoreRadioField(form, name, session[field])
  })

  if (isPredictorsCheckAnswersEdit()) {
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

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b8', getPostB8ContinueHref(), newFields)
    )
  })
})
