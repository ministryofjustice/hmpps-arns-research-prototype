//
// a3 – sexual offending (only if history of sexual offending on a2)
//

import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  isPredictorsBackNavigation,
  isPredictorsCheckAnswersEdit,
  scrollToPredictorsChangeTarget
} from './predictors-change-scroll.js'
import { getA3FieldsFromForm, getA3ValidationError, isA3Complete } from './predictors-journey.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'
import { initPredictorsInactiveLinks } from './predictors-inactive-links.js'

const restoreRadio = (form, name, value) => {
  if (!value) return
  const input = form.querySelector(`input[name="${name}"][value="${value}"]`)
  if (input) input.checked = true
}

const clearA3Fields = (form) => {
  form
    .querySelectorAll('input[name="sexual_motivation"], input[name="stranger_contact"]')
    .forEach((input) => {
      input.checked = false
    })

  ;[
    '#sexual-sanction-date-day',
    '#sexual-sanction-date-month',
    '#sexual-sanction-date-year',
    '#contact-adult-sanctions',
    '#contact-child-sanctions',
    '#indirect-child-sanctions',
    '#non-contact-sanctions'
  ].forEach((selector) => {
    const input = form.querySelector(selector)
    if (input) input.value = ''
  })
}

const restoreA3Fields = (form, session) => {
  restoreRadio(form, 'sexual_motivation', session.sexualMotivation)
  restoreRadio(form, 'stranger_contact', session.strangerContact)

  const dayInput = form.querySelector('#sexual-sanction-date-day')
  const monthInput = form.querySelector('#sexual-sanction-date-month')
  const yearInput = form.querySelector('#sexual-sanction-date-year')

  if (session.sexualSanctionDate) {
    if (dayInput && session.sexualSanctionDate.day) dayInput.value = session.sexualSanctionDate.day
    if (monthInput && session.sexualSanctionDate.month) monthInput.value = session.sexualSanctionDate.month
    if (yearInput && session.sexualSanctionDate.year) yearInput.value = session.sexualSanctionDate.year
  }

  const contactAdultSanctions = form.querySelector('#contact-adult-sanctions')
  const contactChildSanctions = form.querySelector('#contact-child-sanctions')

  if (session.contactAdultSanctions && contactAdultSanctions) {
    contactAdultSanctions.value = session.contactAdultSanctions
  }
  if (session.contactChildSanctions && contactChildSanctions) {
    contactChildSanctions.value = session.contactChildSanctions
  }

  const indirectChildSanctions = form.querySelector('#indirect-child-sanctions')
  const nonContactSanctions = form.querySelector('#non-contact-sanctions')

  if (session.indirectChildSanctions && indirectChildSanctions) {
    indirectChildSanctions.value = session.indirectChildSanctions
  }
  if (session.nonContactSanctions && nonContactSanctions) {
    nonContactSanctions.value = session.nonContactSanctions
  }
}

const A3_SANCTION_INPUT_SELECTORS = ['#contact-adult-sanctions', '#contact-child-sanctions']
const A3_STRANGER_CONTACT_SELECTOR = '[data-predictors-question="stranger-contact"]'
const A3_STRANGER_CONTACT_ERROR_ID = 'stranger-contact-error'
const A3_ERROR_SUMMARY_ID = 'predictors-a3-error-summary'

const getA3ErrorSummary = () => document.getElementById(A3_ERROR_SUMMARY_ID)

const getA3QuestionWrapper = (input) =>
  input?.closest('[data-predictors-question]') || input?.closest('.govuk-form-group')

const clearA3ErrorSummary = () => {
  const errorSummary = getA3ErrorSummary()
  if (!errorSummary) return

  errorSummary.hidden = true
  const list = errorSummary.querySelector('.govuk-error-summary__list')
  if (list) list.innerHTML = ''
}

const showA3ErrorSummary = (validationError) => {
  const errorSummary = getA3ErrorSummary()
  const list = errorSummary?.querySelector('.govuk-error-summary__list')
  if (!errorSummary || !list) return

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
      document.querySelector(A3_STRANGER_CONTACT_SELECTOR)

    questionTarget?.scrollIntoView({ behavior: 'auto', block: 'start' })
    questionTarget?.focus({ preventScroll: true })
  })
}

const clearA3FieldError = (input) => {
  if (!input) return

  const questionWrapper = getA3QuestionWrapper(input)
  questionWrapper?.classList.remove('govuk-form-group--error')
  input.classList.remove('govuk-input--error')
  questionWrapper?.querySelector('.govuk-error-message')?.remove()

  const describedBy = (input.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== `${input.id}-error`)
    .join(' ')

  if (describedBy) {
    input.setAttribute('aria-describedby', describedBy)
  } else {
    input.removeAttribute('aria-describedby')
  }
}

const clearA3StrangerContactError = (form) => {
  const questionWrapper = form.querySelector(A3_STRANGER_CONTACT_SELECTOR)
  if (!questionWrapper) return

  questionWrapper.classList.remove('govuk-form-group--error')
  questionWrapper.querySelector('.govuk-error-message')?.remove()

  const fieldset = questionWrapper.querySelector('#stranger-contact-fieldset')
  if (!fieldset) return

  const describedBy = (fieldset.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== A3_STRANGER_CONTACT_ERROR_ID)
    .join(' ')

  if (describedBy) {
    fieldset.setAttribute('aria-describedby', describedBy)
  } else {
    fieldset.removeAttribute('aria-describedby')
  }
}

const clearA3ValidationErrors = (form) => {
  A3_SANCTION_INPUT_SELECTORS.forEach((selector) => {
    clearA3FieldError(form.querySelector(selector))
  })
  clearA3StrangerContactError(form)
  clearA3ErrorSummary()
}

const showA3StrangerContactError = (form, validationError) => {
  const questionWrapper = form.querySelector(A3_STRANGER_CONTACT_SELECTOR)
  const fieldset = questionWrapper?.querySelector('#stranger-contact-fieldset')
  const heading = questionWrapper?.querySelector('h3')
  if (!questionWrapper || !fieldset || !heading) return

  questionWrapper.classList.add('govuk-form-group--error')

  const errorMessage = document.createElement('p')
  errorMessage.className = 'govuk-error-message'
  errorMessage.id = A3_STRANGER_CONTACT_ERROR_ID
  errorMessage.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${validationError.message}`
  heading.insertAdjacentElement('afterend', errorMessage)

  const describedBy = (fieldset.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean)

  if (!describedBy.includes(A3_STRANGER_CONTACT_ERROR_ID)) {
    describedBy.push(A3_STRANGER_CONTACT_ERROR_ID)
  }

  fieldset.setAttribute('aria-describedby', describedBy.join(' '))
}

const showA3FieldError = (form, validationError) => {
  clearA3ValidationErrors(form)

  if (validationError.scrollId === 'predictors-stranger-contact') {
    showA3StrangerContactError(form, validationError)
    showA3ErrorSummary(validationError)
    return
  }

  const input = form.querySelector(validationError.focusSelector)
  if (!input) return

  const questionWrapper = getA3QuestionWrapper(input)
  questionWrapper?.classList.add('govuk-form-group--error')
  input.classList.add('govuk-input--error')

  const errorId = `${input.id}-error`
  const errorMessage = document.createElement('p')
  errorMessage.className = 'govuk-error-message'
  errorMessage.id = errorId
  errorMessage.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${validationError.message}`
  input.parentNode?.insertBefore(errorMessage, input)

  const describedBy = (input.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean)

  if (!describedBy.includes(errorId)) {
    describedBy.push(errorId)
  }

  input.setAttribute('aria-describedby', describedBy.join(' '))
  showA3ErrorSummary(validationError)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-a3-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (session.sexualOffence !== 'yes') {
    window.location.href = 'a2b.html'
    return
  }

  initPredictorsInactiveLinks(form)

  const shouldRestoreSavedAnswers =
    isPredictorsCheckAnswersEdit() || isPredictorsBackNavigation() || isA3Complete(session)

  if (shouldRestoreSavedAnswers) {
    restoreA3Fields(form, session)
  } else {
    clearA3Fields(form)
  }

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA3FieldsFromForm(form))
  }

  if (window.location.hash) {
    scrollToPredictorsChangeTarget()
  }

  A3_SANCTION_INPUT_SELECTORS.forEach((selector) => {
    form.querySelector(selector)?.addEventListener('input', () => {
      clearA3ValidationErrors(form)
    })
  })

  form
    .querySelectorAll('input[name="stranger_contact"]')
    .forEach((input) => input.addEventListener('change', () => clearA3ValidationErrors(form)))

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const validationError = getA3ValidationError(form)
    if (validationError) {
      showA3FieldError(form, validationError)
      return
    }

    clearA3ValidationErrors(form)

    const newFields = getA3FieldsFromForm(form)

    window.location.href = completePredictorsPageAndContinue('a3', 'a4.html', newFields)
  })
})
