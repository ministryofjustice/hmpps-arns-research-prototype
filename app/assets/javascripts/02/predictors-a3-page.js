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
import { getA3FieldsFromForm, isA3Complete } from './predictors-journey.js'
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

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/02/')) return

  const form = document.getElementById('predictors-a3-form')
  if (!form) return

  const session = getPredictorsAssessmentSession()

  if (session.sexualOffence !== 'yes') {
    window.location.href = 'a2.html'
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

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA3FieldsFromForm(form)

    window.location.href = completePredictorsPageAndContinue('a3', 'a4.html', newFields)
  })
})
