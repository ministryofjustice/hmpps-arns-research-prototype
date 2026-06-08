//
// Save a1 answers and continue to a2
//

import {
  initConvictionDate,
  isConvictionDateEditPanelOpen,
  persistConvictionDateState
} from './conviction-date.js'
import { completeTieringPageAndContinue } from './tiering-change-scroll.js'
import { getA1FieldsFromForm } from './tiering-journey.js'
import { trackTelemetryOffenceSearch } from './tiering-session-telemetry.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  const form = document.getElementById('tiering-a1-form')
  if (!form) return

  initConvictionDate()

  const searchContainer = document.getElementById('current-offence-search')
  if (searchContainer) {
    await window.initOffenceSearch(searchContainer)
  }

  document.querySelector('[data-tiering-offence-browse-link]')?.addEventListener('click', () => {
    persistConvictionDateState({ editing: isConvictionDateEditPanelOpen() })
    trackTelemetryOffenceSearch({ action: 'browse-open' })
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = {
      ...getA1FieldsFromForm(form),
      convictionDateEditMode: false
    }

    window.location.href = completeTieringPageAndContinue('a1', 'a2.html', newFields)
  })
})
