//
// Save a1 answers and continue to a2
//

import {
  initConvictionDate,
  isConvictionDateEditPanelOpen,
  persistConvictionDateState
} from '../conviction-date.js'
import { completePredictorsPageAndContinue } from './predictors-change-scroll.js'
import { initA1OffenceDisplayToggle } from '../tiering-a1-display-toggle.js'
import { getA1FieldsFromForm } from './predictors-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-a1-form')
  if (!form) return

  initConvictionDate()
  initA1OffenceDisplayToggle()

  document.querySelector('[data-predictors-offence-browse-link]')?.addEventListener('click', () => {
    persistConvictionDateState({ editing: isConvictionDateEditPanelOpen() })
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = {
      ...getA1FieldsFromForm(form),
      convictionDateEditMode: false
    }

    window.location.href = completePredictorsPageAndContinue('a1', 'a2.html', newFields)
  })
})
