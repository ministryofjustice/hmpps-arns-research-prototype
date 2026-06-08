//
// a3dc – direct contact (sexual offending branch)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  applyA3DirectContactDefaults,
  getA3DirectContactFieldsFromForm
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { initTieringInactiveLinks } from './tiering-inactive-links.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a3dc-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const backLink = document.getElementById('tiering-a3dc-back')

  if (session.sexualOffence !== 'yes') {
    window.location.href = 'a2.html'
    return
  }

  if (backLink) {
    backLink.href = getTieringBackLinkHref('a3.html')
  }

  initTieringInactiveLinks(form)

  const contactAdultSanctions = form.querySelector('#contact-adult-sanctions')
  const contactChildSanctions = form.querySelector('#contact-child-sanctions')

  if (session.contactAdultSanctions && contactAdultSanctions) {
    contactAdultSanctions.value = session.contactAdultSanctions
  }
  if (session.contactChildSanctions && contactChildSanctions) {
    contactChildSanctions.value = session.contactChildSanctions
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA3DirectContactFieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    let newFields = getA3DirectContactFieldsFromForm(form)

    if (!isTieringCheckAnswersEdit()) {
      newFields = applyA3DirectContactDefaults(newFields, session)
    }

    window.location.href = completeTieringPageAndContinue('a3dc', 'a3ic.html', newFields)
  })
})
