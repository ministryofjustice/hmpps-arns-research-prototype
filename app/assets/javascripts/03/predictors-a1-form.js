//
// Save a1 answers and continue to a2
//

import {
  initConvictionDate,
  isConvictionDateEditPanelOpen,
  persistConvictionDateState
} from '../conviction-date.js'
import {
  captureCheckAnswersEditSnapshot,
  completePredictorsPageAndContinue,
  isPredictorsCheckAnswersEdit
} from './predictors-change-scroll.js'
import { initA1OffenceDisplayToggle } from '../tiering-a1-display-toggle.js'
import { getA1FieldsFromForm } from './predictors-journey.js'

const A1_PNC_VIEWER_URL = '/03/pnc'

const initA1FooterCrownLink = () => {
  const crown = document.querySelector('.govuk-footer__crown')
  if (!crown || crown.closest('[data-a1-footer-crown-link]')) return

  const link = document.createElement('a')
  link.href = A1_PNC_VIEWER_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.className = 'govuk-footer__crown-link'
  link.dataset.a1FooterCrownLink = 'true'
  link.setAttribute('aria-label', 'Open PNC record (opens in new tab)')

  crown.setAttribute('aria-hidden', 'true')
  crown.parentNode?.replaceChild(link, crown)
  link.appendChild(crown)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/03/')) return

  const form = document.getElementById('predictors-a1-form')
  if (!form) return

  initConvictionDate()
  initA1OffenceDisplayToggle()
  initA1FooterCrownLink()

  document.querySelector('[data-predictors-offence-browse-link]')?.addEventListener('click', () => {
    persistConvictionDateState({ editing: isConvictionDateEditPanelOpen() })
  })

  if (isPredictorsCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA1FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = {
      ...getA1FieldsFromForm(form),
      convictionDateEditMode: false
    }

    window.location.href = completePredictorsPageAndContinue('a1', 'a2.html', newFields)
  })
})
