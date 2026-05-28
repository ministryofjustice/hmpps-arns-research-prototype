//
// Save a1 answers and continue to a2
//

import { completeTieringPageAndContinue } from './tiering-change-scroll.js'
import { getA1FieldsFromForm } from './tiering-journey.js'
import { trackTelemetryOffenceSearch } from './tiering-session-telemetry.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1-form')
  if (!form) return

  document.querySelector('[data-tiering-offence-browse-link]')?.addEventListener('click', () => {
    trackTelemetryOffenceSearch({ action: 'browse-open' })
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA1FieldsFromForm(form)

    window.location.href = completeTieringPageAndContinue('a1', 'a2.html', newFields)
  })
})
