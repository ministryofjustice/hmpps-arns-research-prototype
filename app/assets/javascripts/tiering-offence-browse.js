//
// Shared offence browse behaviour (a1o table and a1o2 tabs)
//

import { isTieringCheckAnswersEdit, withFromCheckAnswers } from './tiering-change-scroll.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'
import { trackTelemetryOffenceSearch } from './tiering-session-telemetry.js'

export const escapeOffenceHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const initOffenceBrowseVariantLinks = () => {
  document.querySelectorAll('.offence-browse-variant-toggle').forEach((link) => {
    const target = link.getAttribute('href')
    if (target) link.href = withFromCheckAnswers(target)
  })
}

export const renderOffenceTableRows = (offences) =>
  offences
    .map(
      (offence) => `
    <tr class="offences-all-table__row" data-offence-row data-offence-id="${escapeOffenceHtml(offence.id)}">
      <td class="govuk-table__cell">${escapeOffenceHtml(offence.label)}</td>
      <td class="govuk-table__cell">${escapeOffenceHtml(offence.code)}</td>
      <td class="govuk-table__cell offences-all-table__action-cell">
        <a class="govuk-link" href="#" data-select-offence data-offence-id="${escapeOffenceHtml(offence.id)}">
          Use this offence<span class="govuk-visually-hidden">, ${escapeOffenceHtml(offence.label)}</span>
        </a>
      </td>
    </tr>`
    )
    .join('')

export const initOffenceBrowseForm = ({
  form,
  getTableBodies,
  telemetrySource = 'browse'
}) => {
  if (!form) return null

  const summary = document.querySelector('[data-offence-selected-summary]')
  const summaryLabel = document.querySelector('[data-offence-selected-summary-label]')
  const summaryCode = document.querySelector('[data-offence-selected-summary-code]')
  const confirmButton = document.querySelector('[data-offence-confirm-button]')
  const hiddenInput = document.querySelector('[data-offence-selected-id]')

  trackTelemetryOffenceSearch({ action: 'browse-open' })
  initOffenceBrowseVariantLinks()

  if (isTieringCheckAnswersEdit()) {
    const backLink = document.querySelector('.assessment-layout .govuk-back-link')
    if (backLink) backLink.href = withFromCheckAnswers('a1.html')
  }

  let selectedOffence = null
  let offences = []

  const getBodies = () => {
    const bodies = getTableBodies()
    return bodies ? Array.from(bodies) : []
  }

  const setSelected = (offence) => {
    selectedOffence = offence
    if (hiddenInput) hiddenInput.value = offence.id

    getBodies().forEach((tableBody) => {
      tableBody.querySelectorAll('[data-offence-row]').forEach((row) => {
        const isSelected = row.dataset.offenceId === offence.id
        row.classList.toggle('offences-all-table__row--selected', isSelected)
      })
    })

    if (summary && summaryLabel && summaryCode) {
      summary.hidden = false
      summaryLabel.textContent = offence.label
      summaryCode.textContent = offence.code ? `Offence code: ${offence.code}` : ''
      summaryCode.hidden = !offence.code
    }

    if (confirmButton) {
      confirmButton.disabled = false
    }
  }

  const bindSelectLinks = (root) => {
    root.querySelectorAll('[data-select-offence]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault()
        const offence = offences.find((item) => item.id === link.dataset.offenceId)
        if (offence) setSelected(offence)
      })
    })
  }

  const renderIntoBody = (tableBody, bodyOffences) => {
    if (!bodyOffences.length) {
      tableBody.innerHTML = `
    <tr>
      <td class="govuk-table__cell" colspan="3">No offences in this category.</td>
    </tr>`
      return
    }

    tableBody.innerHTML = renderOffenceTableRows(bodyOffences)
    bindSelectLinks(tableBody)
  }

  const registerOffences = (list) => {
    offences = list
  }

  const restoreSelection = () => {
    const session = getTieringAssessmentSession()
    if (!session.currentOffence?.id) return

    const offence = offences.find((item) => item.id === session.currentOffence.id)
    if (offence) setSelected(offence)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!selectedOffence) return

    trackTelemetryOffenceSearch({
      action: 'select',
      query: {
        id: selectedOffence.id,
        label: selectedOffence.label,
        code: selectedOffence.code || '',
        source: telemetrySource
      }
    })

    setTieringAssessmentSession({
      currentOffence: {
        id: selectedOffence.id,
        label: selectedOffence.label,
        code: selectedOffence.code || ''
      }
    })

    window.location.href = withFromCheckAnswers('a1.html')
  })

  return {
    registerOffences,
    renderIntoBody,
    restoreSelection,
    setSelected,
    showLoadError: (tableBody) => {
      tableBody.innerHTML = `
    <tr>
      <td class="govuk-table__cell" colspan="3">Offence list could not be loaded. Try refreshing the page.</td>
    </tr>`
    }
  }
}

/** Simple tab switching for dynamically rendered offence category tabs */
export const initOffenceBrowseTabs = (root) => {
  if (!root) return

  root.setAttribute('data-module', 'govuk-tabs')

  const tabLinks = root.querySelectorAll('.govuk-tabs__tab')
  const panels = root.querySelectorAll('.govuk-tabs__panel')

  if (!tabLinks.length || !panels.length) return

  const showPanel = (panelId) => {
    tabLinks.forEach((link) => {
      const href = link.getAttribute('href') || ''
      const isSelected = href === `#${panelId}`
      link.closest('.govuk-tabs__list-item')?.classList.toggle(
        'govuk-tabs__list-item--selected',
        isSelected
      )
      link.setAttribute('aria-selected', isSelected ? 'true' : 'false')
    })

    panels.forEach((panel) => {
      const isVisible = panel.id === panelId
      panel.classList.toggle('govuk-tabs__panel--hidden', !isVisible)
      panel.setAttribute('aria-hidden', isVisible ? 'false' : 'true')
    })
  }

  tabLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const panelId = (link.getAttribute('href') || '').replace(/^#/, '')
      if (panelId) showPanel(panelId)
    })
  })

  const initialPanelId = (tabLinks[0].getAttribute('href') || '').replace(/^#/, '')
  if (initialPanelId) showPanel(initialPanelId)
}
