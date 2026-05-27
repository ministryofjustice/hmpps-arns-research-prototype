//
// Save a1 answers and continue to a2
//

import { completeCsrpPageAndContinue } from './csrp-change-scroll.js'
import { getA1FieldsFromForm } from './csrp-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('csrp-a1-form')
  if (!form) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA1FieldsFromForm(form)

    window.location.href = completeCsrpPageAndContinue('a1', 'a2.html', newFields)
  })
})
