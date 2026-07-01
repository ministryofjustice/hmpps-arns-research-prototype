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

const A1_PNC_VIEWER_URL = '/01/pnc'

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
  if (window.location.pathname.includes('/02/') || window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-a1-form')
  if (!form) return

  initConvictionDate()
  initA1FooterCrownLink()

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
