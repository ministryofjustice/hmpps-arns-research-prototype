//
// b1 – accommodation (living with + suitability)
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  getPredictorsBackLinkHref,
  isPredictorsCheckAnswersEdit,
  redirectUnlessCheckAnswersEdit
} from './predictors-change-scroll.js'
import {
  getB1FieldsFromForm,
  getB1ValidationError,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'

const B1_LIVING_WITH_SELECTOR = '[data-predictors-question="living-with"]'
const B1_LIVING_WITH_ERROR_ID = 'living-with-error'
const B1_ERROR_SUMMARY_ID = 'predictors-a3-error-summary'

const restoreLivingWith = (form, session) => {
  const livingWith = Array.isArray(session.livingWith) ? session.livingWith : []

  livingWith.forEach((value) => {
    const checkbox = form.querySelector(`input[name="living_with"][value="${value}"]`)
    if (checkbox) checkbox.checked = true
  })
}

const getB1ErrorSummary = () => document.getElementById(B1_ERROR_SUMMARY_ID)

const clearB1ErrorSummary = () => {
  const errorSummary = getB1ErrorSummary()
  if (!errorSummary) return

  errorSummary.hidden = true
  const list = errorSummary.querySelector('.govuk-error-summary__list')
  if (list) list.innerHTML = ''
}

const showB1ErrorSummary = (validationError) => {
  const errorSummary = getB1ErrorSummary()
  const list = errorSummary?.querySelector('.govuk-error-summary__list')
  if (!errorSummary || !list || !validationError.message) return

  const href = validationError.scrollId
    ? `#${validationError.scrollId}`
    : validationError.focusSelector || '#'

  list.innerHTML = `<li><a href="${href}">${validationError.message}</a></li>`
  errorSummary.hidden = false
  errorSummary.focus()

  const link = list.querySelector('a[href]')
  link?.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()

    const questionTarget =
      (validationError.scrollId && document.getElementById(validationError.scrollId)) ||
      document.querySelector(B1_LIVING_WITH_SELECTOR)

    questionTarget?.scrollIntoView({ behavior: 'auto', block: 'start' })
    questionTarget?.focus({ preventScroll: true })
  })
}

const clearB1LivingWithError = (form) => {
  const questionWrapper = form.querySelector(B1_LIVING_WITH_SELECTOR)
  if (!questionWrapper) return

  questionWrapper.classList.remove('govuk-form-group--error')
  questionWrapper.querySelector('.govuk-error-message')?.remove()

  const fieldset = questionWrapper.querySelector('#living-with-fieldset')
  if (!fieldset) return

  const describedBy = (fieldset.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== B1_LIVING_WITH_ERROR_ID)
    .join(' ')

  if (describedBy) {
    fieldset.setAttribute('aria-describedby', describedBy)
  } else {
    fieldset.removeAttribute('aria-describedby')
  }
}

const clearB1ValidationErrors = (form) => {
  clearB1LivingWithError(form)
  clearB1ErrorSummary()
}

const showB1LivingWithError = (form, validationError) => {
  const questionWrapper = form.querySelector(B1_LIVING_WITH_SELECTOR)
  const fieldset = questionWrapper?.querySelector('#living-with-fieldset')
  const heading = questionWrapper?.querySelector('h2')
  if (!questionWrapper || !fieldset || !heading) return

  questionWrapper.classList.add('govuk-form-group--error')

  const errorMessage = document.createElement('p')
  errorMessage.className = 'govuk-error-message'
  errorMessage.id = B1_LIVING_WITH_ERROR_ID
  errorMessage.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${validationError.message}`
  heading.insertAdjacentElement('afterend', errorMessage)

  const describedBy = (fieldset.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean)

  if (!describedBy.includes(B1_LIVING_WITH_ERROR_ID)) {
    describedBy.push(B1_LIVING_WITH_ERROR_ID)
  }

  fieldset.setAttribute('aria-describedby', describedBy.join(' '))
}

const showB1FieldError = (form, validationError) => {
  clearB1ValidationErrors(form)

  if (validationError.scrollId === 'predictors-living-with') {
    showB1LivingWithError(form, validationError)
    showB1ErrorSummary(validationError)
    return
  }

  if (validationError.scrollId) {
    document.getElementById(validationError.scrollId)?.scrollIntoView({ block: 'start' })
  }

  form.querySelector(validationError.focusSelector)?.focus()
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-b1-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (session.interviewDone !== 'yes' && redirectUnlessCheckAnswersEdit('a6.html')) return

  const backLink = document.getElementById('predictors-b1-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref('a6.html')
  }

  restoreLivingWith(form, session)

  if (session.accommodationSuitable) {
    const input = form.querySelector(
      `input[name="accommodation_suitable"][value="${session.accommodationSuitable}"]`
    )
    if (input) input.checked = true
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getB1FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const validationError = getB1ValidationError(form)
    if (validationError) {
      showB1FieldError(form, validationError)
      return
    }

    clearB1ValidationErrors(form)

    const newFields = getB1FieldsFromForm(form)

    window.location.href = predictorsJourneyHref(
      completePredictorsPageAndContinue('b1', 'b2.html', newFields)
    )
  })
})
