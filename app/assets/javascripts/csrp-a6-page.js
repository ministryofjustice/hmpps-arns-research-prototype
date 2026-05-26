//
// a6 – most recent offence date (only if offences since community date on a5)
//

import {
  captureCheckAnswersEditSnapshot,
  completeCsrpPageAndContinue,
  isCsrpCheckAnswersEdit
} from './csrp-change-scroll.js'
import { getA6FieldsFromForm } from './csrp-journey.js'
import { getCsrpAssessmentSession } from './csrp-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('csrp-a6-form')
  if (!form) return

  const session = getCsrpAssessmentSession()

  if (session.offencesSinceCommunity !== 'yes') {
    window.location.href = 'a5.html'
    return
  }

  const dayInput = form.querySelector('#recent-offence-date-day')
  const monthInput = form.querySelector('#recent-offence-date-month')
  const yearInput = form.querySelector('#recent-offence-date-year')

  if (session.recentOffenceDate) {
    if (dayInput && session.recentOffenceDate.day) dayInput.value = session.recentOffenceDate.day
    if (monthInput && session.recentOffenceDate.month) monthInput.value = session.recentOffenceDate.month
    if (yearInput && session.recentOffenceDate.year) yearInput.value = session.recentOffenceDate.year
  }

  if (isCsrpCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA6FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA6FieldsFromForm(form)

    window.location.href = completeCsrpPageAndContinue('a6', 'a7.html', newFields)
  })
})
