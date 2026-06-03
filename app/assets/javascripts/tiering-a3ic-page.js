//
// a3ic – indirect contact (sexual offending branch)
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import {
  applyA3IndirectContactDefaults,
  getA3IndirectContactFieldsFromForm
} from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { initTieringInactiveLinks } from './tiering-inactive-links.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a3ic-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const backLink = document.getElementById('tiering-a3ic-back')

  if (session.sexualOffence !== 'yes') {
    window.location.href = 'a2.html'
    return
  }

  if (backLink) {
    backLink.href = getTieringBackLinkHref('a3dc.html')
  }

  initTieringInactiveLinks(form)

  const indirectChildSanctions = form.querySelector('#indirect-child-sanctions')
  const nonContactSanctions = form.querySelector('#non-contact-sanctions')

  if (session.indirectChildSanctions && indirectChildSanctions) {
    indirectChildSanctions.value = session.indirectChildSanctions
  }
  if (session.nonContactSanctions && nonContactSanctions) {
    nonContactSanctions.value = session.nonContactSanctions
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA3IndirectContactFieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    let newFields = getA3IndirectContactFieldsFromForm(form)

    if (!isTieringCheckAnswersEdit()) {
      newFields = applyA3IndirectContactDefaults(newFields, session)
    }

    window.location.href = completeTieringPageAndContinue('a3ic', 'a4.html', newFields)
  })
})
