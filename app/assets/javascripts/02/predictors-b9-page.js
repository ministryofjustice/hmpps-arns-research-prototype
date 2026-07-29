//
// b9 – offence analysis
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import { setConditionalVisible } from './predictors-conditional-fields.js'
import {
  getB9BackHref,
  getB9FieldsFromForm,
  getB9ValidationError,
  getFirstIncompleteAlcoholPage,
  getPostB9ContinueHref,
  isB7Complete,
  isB8Complete,
  isDynamicSectionReadyForB7,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const PERPETRATOR_CONDITIONAL_ID = 'conditional-domestic-abuse-perpetrator-yes'
const VICTIM_CONDITIONAL_ID = 'conditional-domestic-abuse-victim-yes'

const restoreRadioField = (form, name, value) => {
  if (!value) return

  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

const restoreOffenceElements = (form, offenceElements = []) => {
  offenceElements.forEach((value) => {
    const checkbox = form.querySelector(`input[name="offence_elements"][value="${value}"]`)
    if (checkbox) checkbox.checked = true
  })
}

const restoreDomesticAbuseFields = (form, session) => {
  restoreRadioField(form, 'domestic_abuse_perpetrator', session.domesticAbusePerpetrator)

  if (session.domesticAbusePerpetrator === 'yes') {
    setConditionalVisible(PERPETRATOR_CONDITIONAL_ID, true)
    restoreRadioField(form, 'domestic_abuse_perpetrator_against', session.domesticAbusePerpetratorAgainst)
  }

  restoreRadioField(form, 'domestic_abuse_victim', session.domesticAbuseVictim)

  if (session.domesticAbuseVictim === 'yes') {
    setConditionalVisible(VICTIM_CONDITIONAL_ID, true)
    restoreRadioField(form, 'domestic_abuse_victim_by', session.domesticAbuseVictimBy)
  }
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b9-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (!isDynamicSectionReadyForB7(session) && redirectUnlessCheckAnswersEdit('b5.html')) return

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage && redirectUnlessCheckAnswersEdit(alcoholPage)) return
  if (!isB7Complete(session) && redirectUnlessCheckAnswersEdit('b7.html')) return
  if (!isB8Complete(session) && redirectUnlessCheckAnswersEdit('b8.html')) return

  const backLink = document.getElementById('predictors-b9-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(getB9BackHref())
  }

  restoreOffenceElements(form, session.offenceElements)
  restoreDomesticAbuseFields(form, session)

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot({ ...getB9FieldsFromForm(form), b9Complete: true })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const validationError = getB9ValidationError(form)
    if (validationError) {
      if (validationError.conditionalId) {
        setConditionalVisible(validationError.conditionalId, true)
      }

      if (validationError.anchor) {
        document.querySelector(validationError.anchor)?.scrollIntoView({ block: 'start' })
      }

      form.querySelector(validationError.focusSelector)?.focus()
      return
    }

    const newFields = getB9FieldsFromForm(form)

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b9', getPostB9ContinueHref(), {
        ...newFields,
        b9Complete: true
      })
    )
  })
})
