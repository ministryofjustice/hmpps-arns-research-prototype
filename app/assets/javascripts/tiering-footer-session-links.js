//
// Footer links for Tiering session results (a7 + a8)
//

import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { isSessionTelemetryUiEnabled } from './tiering-session-telemetry.js'

export const insertTieringSessionFooterLinks = () => {
  if (!isSessionTelemetryUiEnabled()) return
  if (document.querySelector('[data-tiering-session-links]')) return

  // Only show after user has calculated the score (a7 submit).
  const session = getTieringAssessmentSession()
  if (session.scoreCalculated !== true) return

  const meta = document.querySelector('.govuk-footer__meta')
  if (!meta) return

  const wrapper = document.createElement('div')
  wrapper.className = 'tiering-footer-session-links'
  wrapper.setAttribute('data-tiering-session-links', 'true')

  wrapper.innerHTML = `
    <a href="session-results.html" class="govuk-link tiering-footer-session-links__link" data-tiering-session-results-link>
      <span class="tiering-footer-session-links__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle>
          <path d="M12 10.5v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
          <circle cx="12" cy="7.25" r="1.25" fill="currentColor"></circle>
        </svg>
      </span>
      <span class="tiering-footer-session-links__text">View session results</span>
    </a>
    <a href="#" class="govuk-link tiering-footer-session-links__link" data-tiering-session-pdf-link>
      <span class="tiering-footer-session-links__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
          <path d="M12 3v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
          <path d="M8.5 10.5 12 13.9l3.5-3.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M5 17.5h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
        </svg>
      </span>
      <span class="tiering-footer-session-links__text">Download session results</span>
    </a>
  `

  const licenceDescription = meta.querySelector('.govuk-footer__licence-description')
  if (licenceDescription) {
    licenceDescription.prepend(wrapper)
  } else {
    meta.prepend(wrapper)
  }

  const pdfLink = wrapper.querySelector('[data-tiering-session-pdf-link]')
  pdfLink?.addEventListener('click', (event) => {
    event.preventDefault()

    const iframe = document.createElement('iframe')
    iframe.title = 'Session results PDF'
    iframe.src = 'session-results.html?print=1'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'

    const cleanup = () => {
      try {
        iframe.remove()
      } catch (e) {
        // ignore
      }
    }

    iframe.addEventListener('load', () => {
      try {
        // Print the iframe content without navigating away.
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } finally {
        // Give the print dialog a moment to open before cleaning up.
        setTimeout(cleanup, 5000)
      }
    })

    document.body.appendChild(iframe)
  })
}

