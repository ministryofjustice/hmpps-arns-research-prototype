//
// a1o – browse all offences table
//

import { isCsrpCheckAnswersEdit, withFromCheckAnswers } from './csrp-change-scroll.js'
import { fetchOffenceSubOffences } from './offences-data.js'
import { getCsrpAssessmentSession, setCsrpAssessmentSession } from './csrp-assessment-session.js'

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('csrp-a1o-form')
  const tableBody = document.querySelector('[data-offences-table-body]')
  const summary = document.querySelector('[data-offence-selected-summary]')
  const summaryLabel = document.querySelector('[data-offence-selected-summary-label]')
  const summaryCode = document.querySelector('[data-offence-selected-summary-code]')
  const confirmButton = document.querySelector('[data-offence-confirm-button]')
  const hiddenInput = document.querySelector('[data-offence-selected-id]')

  if (!form || !tableBody) return

  if (isCsrpCheckAnswersEdit()) {
    const backLink = document.querySelector('.assessment-layout .govuk-back-link')
    if (backLink) backLink.href = withFromCheckAnswers('a1.html')
  }

  let selectedOffence = null
  let offences = []

  const setSelected = (offence) => {
    selectedOffence = offence
    if (hiddenInput) hiddenInput.value = offence.id

    tableBody.querySelectorAll('[data-offence-row]').forEach((row) => {
      const isSelected = row.dataset.offenceId === offence.id
      row.classList.toggle('offences-all-table__row--selected', isSelected)
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

  const renderTable = () => {
    tableBody.innerHTML = offences
      .map(
        (offence) => `
    <tr class="offences-all-table__row" data-offence-row data-offence-id="${escapeHtml(offence.id)}">
      <td class="govuk-table__cell">${escapeHtml(offence.label)}</td>
      <td class="govuk-table__cell">${escapeHtml(offence.code)}</td>
      <td class="govuk-table__cell offences-all-table__action-cell">
        <a class="govuk-link" href="#" data-select-offence data-offence-id="${escapeHtml(offence.id)}">
          Use this offence<span class="govuk-visually-hidden">, ${escapeHtml(offence.label)}</span>
        </a>
      </td>
    </tr>`
      )
      .join('')

    tableBody.querySelectorAll('[data-select-offence]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault()
        const offence = offences.find((item) => item.id === link.dataset.offenceId)
        if (offence) setSelected(offence)
      })
    })
  }

  const restoreSelection = () => {
    const session = getCsrpAssessmentSession()
    if (!session.currentOffence?.id) return

    const offence = offences.find((item) => item.id === session.currentOffence.id)
    if (offence) setSelected(offence)
  }

  fetchOffenceSubOffences()
    .then((list) => {
      offences = list
      renderTable()
      restoreSelection()
    })
    .catch(() => {
      tableBody.innerHTML = `
    <tr>
      <td class="govuk-table__cell" colspan="3">Offence list could not be loaded. Try refreshing the page.</td>
    </tr>`
    })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!selectedOffence) return

    setCsrpAssessmentSession({
      currentOffence: {
        id: selectedOffence.id,
        label: selectedOffence.label,
        code: selectedOffence.code || ''
      }
    })

    window.location.href = withFromCheckAnswers('a1.html')
  })
})
