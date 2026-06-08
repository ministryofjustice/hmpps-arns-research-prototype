//
// a2 – offending history
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import { getA2FieldsFromForm } from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a2-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const firstSanctionAge = form.querySelector('#first-sanction-age')

  if (session.firstSanctionAge && firstSanctionAge) {
    firstSanctionAge.value = session.firstSanctionAge
  }

  if (session.totalSanctions) {
    const totalSanctions = form.querySelector('#total-sanctions')
    if (totalSanctions) totalSanctions.value = session.totalSanctions
  }
  if (session.violentSanctions) {
    const violentSanctions = form.querySelector('#violent-sanctions-other')
    if (violentSanctions) violentSanctions.value = session.violentSanctions
  }
  if (session.sexualOffence) {
    const sexualOffenceInput = form.querySelector(`input[name="sexual_offence"][value="${session.sexualOffence}"]`)
    if (sexualOffenceInput) sexualOffenceInput.checked = true
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA2FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA2FieldsFromForm(form)

    if (!isTieringCheckAnswersEdit()) {
      if (!newFields.firstSanctionAge) newFields.firstSanctionAge = '16'
      if (!newFields.totalSanctions) newFields.totalSanctions = '6'
      if (!newFields.violentSanctions) newFields.violentSanctions = '2'
    }

    const sexualOffence = newFields.sexualOffence

    window.location.href = completeTieringPageAndContinue(
      'a2',
      sexualOffence === 'yes' ? 'a3.html' : 'a4.html',
      newFields
    )
  })
})
