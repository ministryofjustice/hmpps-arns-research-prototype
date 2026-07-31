//
// b4 – which drugs misused (yes branch)
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import { getMisusedDrugConditionalId } from './predictors-b4-drugs.js'
import {
  getB4FieldsFromForm,
  getB4ValidationError,
  isB1Complete,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const hasRequiredDynamicAnswers = (session) =>
  session.interviewDone === 'yes' &&
  isB1Complete(session) &&
  session.employmentHistory &&
  session.drugsMisused

const setCheckboxConditionalVisible = (id, show) => {
  const conditional = document.getElementById(id)
  if (!conditional) return

  conditional.classList.toggle('govuk-checkboxes__conditional--hidden', !show)
}

const getMisusedDrugsFromSession = (session) => {
  const misusedDrugs = { ...(session.misusedDrugs || {}) }

  if (session.amphetaminesMisused && !misusedDrugs.amphetamines) {
    misusedDrugs.amphetamines = { period: session.amphetaminesPeriod || '' }
  }

  return misusedDrugs
}

const restoreMisusedDrugsToForm = (form, misusedDrugs) => {
  Object.entries(misusedDrugs).forEach(([id, data]) => {
    const checkbox = form.querySelector(`#drugs-${id}`)
    if (checkbox) {
      checkbox.checked = true
      setCheckboxConditionalVisible(getMisusedDrugConditionalId(id), true)
    }

    if (data.period) {
      const periodInput = form.querySelector(`input[name="${id}_period"][value="${data.period}"]`)
      if (periodInput) periodInput.checked = true
    }

    if (id === 'other' && data.name) {
      const nameInput = form.querySelector('#other-drug-name')
      if (nameInput) nameInput.value = data.name
    }
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-b4-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!hasRequiredDynamicAnswers(session) && redirectUnlessCheckAnswersEdit('b3.html')) return
  if (session.drugsMisused !== 'yes' && redirectUnlessCheckAnswersEdit('b5.html')) return

  const backLink = document.getElementById('predictors-b4-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('b3.html')
  }

  restoreMisusedDrugsToForm(form, getMisusedDrugsFromSession(session))

  if (session.drugsMotivation) {
    const motivationInput = form.querySelector(
      `input[name="drugs_motivation"][value="${session.drugsMotivation}"]`
    )
    if (motivationInput) motivationInput.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB4FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const validationError = getB4ValidationError(form)
    if (validationError) {
      if (validationError.conditionalId) {
        setCheckboxConditionalVisible(validationError.conditionalId, true)
      }

      form.querySelector(validationError.focusSelector)?.focus()
      return
    }

    const newFields = getB4FieldsFromForm(form)

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b4', 'b5.html', newFields)
    )
  })
})
