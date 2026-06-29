//
// Session results page
//

import { analyseSessionTelemetry } from './tiering-session-telemetry.js'

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

window.GOVUKPrototypeKit.documentReady(() => {
  const root = document.querySelector('[data-session-results]')
  if (!root) return

  const analysis = analyseSessionTelemetry()
  const summaryEl = document.getElementById('tiering-session-results-summary')
  const metricsSection = document.getElementById('tiering-session-results-metrics')
  const riskPredictorsSection = document.getElementById('tiering-session-results-risk-predictors')
  const riskPredictorsBody = document.getElementById('tiering-session-results-risk-predictors-body')
  const tableBody = document.getElementById('tiering-session-results-table-body')
  const downloadButton = document.getElementById('tiering-session-results-download')
  const headerLinks = downloadButton?.closest('.tiering-session-results__header-links')

  if (downloadButton) {
    downloadButton.hidden = !analysis.recordingEnabled
    if (headerLinks) {
      headerLinks.hidden = !analysis.recordingEnabled
    }
  }

  downloadButton?.addEventListener('click', (event) => {
    event.preventDefault()
    window.print()
  })

  const printIfRequested = () => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('print') !== '1') return
    // If embedded (e.g. printed via hidden iframe), the parent triggers printing.
    try {
      if (window.self !== window.top) return
    } catch (e) {
      // ignore cross-origin edge cases
    }
    // Let the page render first.
    setTimeout(() => window.print(), 250)
  }

  const renderSectionRowValue = (row) => {
    if (row.listItems?.length) {
      return `<ul class="govuk-list govuk-!-margin-bottom-0">${row.listItems
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`
    }
    return escapeHtml(row.value ?? '')
  }

  const renderSectionTable = (section) => `
    <table class="govuk-table tiering-session-results__table">
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          <th scope="col" class="govuk-table__header">Metric</th>
          <th scope="col" class="govuk-table__header">Result</th>
        </tr>
      </thead>
      <tbody class="govuk-table__body">
        ${section.rows
          .map(
            (row) => `
          <tr class="govuk-table__row">
            <th scope="row" class="govuk-table__header govuk-table__header--sub">
              ${row.highlight ? '<span class="tiering-session-results__warning" aria-hidden="true">⚠</span> ' : ''}
              ${escapeHtml(row.metric)}
            </th>
            <td class="govuk-table__cell">${renderSectionRowValue(row)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `

  const renderCategoryTable = (categories) => `
    <table class="govuk-table tiering-session-results__table">
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          <th scope="col" class="govuk-table__header">Metric</th>
          <th scope="col" class="govuk-table__header">Result</th>
        </tr>
      </thead>
      <tbody class="govuk-table__body">
        ${categories
          .map(
            (category) => `
          <tr class="govuk-table__row tiering-session-results__category-row">
            <th scope="colgroup" colspan="2" class="govuk-table__header">
              ${escapeHtml(category.title)}
            </th>
          </tr>
          ${category.rows
            .map(
              (row) => `
            <tr class="govuk-table__row">
              <th scope="row" class="govuk-table__header govuk-table__header--sub">
                ${row.highlight ? '<span class="tiering-session-results__warning" aria-hidden="true">⚠</span> ' : ''}
                ${escapeHtml(row.metric)}
              </th>
              <td class="govuk-table__cell">${escapeHtml(row.value)}</td>
            </tr>
          `
            )
            .join('')}
        `
          )
          .join('')}
      </tbody>
    </table>
  `

  if (!analysis.recordingEnabled) {
    if (summaryEl) {
      summaryEl.innerHTML = `
        <h2 class="govuk-heading-m">Session not recorded</h2>
        <p class="govuk-body">You chose not to record this session, or recording was not enabled.</p>
      `
    }
    if (metricsSection) {
      metricsSection.hidden = true
    }
    if (riskPredictorsSection) {
      riskPredictorsSection.hidden = true
    }
    printIfRequested()
    return
  }

  const { band, usabilityScore, insights, categories, riskPredictorsSection: riskPredictors } = analysis

  if (summaryEl) {
    summaryEl.className = `tiering-session-results__summary ${band.className}`
    summaryEl.innerHTML = `
      <h2 class="govuk-heading-m tiering-session-results__rating-title govuk-!-margin-bottom-2">${escapeHtml(band.title)}</h2>
      <p class="govuk-body-l govuk-!-font-weight-bold">Overall usability: ${usabilityScore} / 10</p>
      <p class="govuk-body">${escapeHtml(band.message)}</p>
      <ul class="govuk-list govuk-list--bullet govuk-!-margin-top-3">
        ${insights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    `
  }

  if (riskPredictorsSection && riskPredictorsBody) {
    if (riskPredictors) {
      riskPredictorsSection.hidden = false
      riskPredictorsBody.closest('table').outerHTML = renderSectionTable(riskPredictors)
    } else {
      riskPredictorsSection.hidden = true
    }
  }

  if (tableBody) {
    tableBody.closest('table').outerHTML = renderCategoryTable(categories)
  }

  printIfRequested()
})
