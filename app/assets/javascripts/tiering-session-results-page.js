//
// Session results page
//

import { analyseSessionTelemetry, getTelemetrySessionId } from './tiering-session-telemetry.js'
import { deleteSessionFromHistory, fetchSessionHistory } from './tiering-session-history.js'

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
  const tableBody = document.getElementById('tiering-session-results-table-body')
  const historyRoot = document.getElementById('tiering-session-results-history')
  const downloadButton = document.getElementById('tiering-session-results-download')

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

  const formatSessionDate = (iso) => {
    if (!iso) return 'Unknown date'
    try {
      const d = new Date(iso)
      const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      const time = d
        .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
        .replace(' ', '')
        .toLowerCase()
      return `${date} (${time})`
    } catch (e) {
      return iso
    }
  }

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

  const renderSessionResultsSnapshot = (results) => {
    if (!results) {
      return `
        <p class="govuk-body">Session not recorded.</p>
      `
    }

    const bandClass = results.band?.className || ''

    return `
      <div class="tiering-session-results__summary ${bandClass}">
        <h4 class="govuk-heading-s tiering-session-results__rating-title govuk-!-margin-bottom-2">${escapeHtml(
          results.band?.title || 'Session results'
        )}</h4>
        <p class="govuk-body govuk-!-font-weight-bold">Overall usability: ${results.usabilityScore} / 10</p>
        <ul class="govuk-list govuk-list--bullet govuk-!-margin-top-3">
          ${(results.insights || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>

      <div class="govuk-!-margin-top-6">
        ${renderCategoryTable(results.categories || [])}
      </div>
    `
  }

  const renderHistory = async () => {
    if (!historyRoot) return
    try {
      const currentSessionId = getTelemetrySessionId()
      const sessions = (await fetchSessionHistory()).filter((s) => s.sessionId !== currentSessionId)
      if (!sessions.length) {
        historyRoot.innerHTML = '<p class="govuk-body">There are no previous sessions</p>'
        return
      }

      const sessionRowId = (sessionId) => `tiering-session-history-row-${String(sessionId).replace(/[^a-z0-9_-]/gi, '')}`
      const detailRowId = (sessionId) =>
        `tiering-session-history-details-${String(sessionId).replace(/[^a-z0-9_-]/gi, '')}`

      const statusLabel = (s) => {
        if (s.consent !== 'agreed') return 'Not recorded'
        return s.sectionCompleteAt ? 'Section complete' : 'Completed'
      }

      const scoreLabel = (s) => (s.consent === 'agreed' && typeof s.usabilityScore === 'number' ? String(s.usabilityScore) : '')

      historyRoot.innerHTML = `
        <table class="govuk-table tiering-session-results__history-table">
          <thead class="govuk-table__head">
            <tr class="govuk-table__row">
              <th scope="col" class="govuk-table__header">Session</th>
              <th scope="col" class="govuk-table__header">Date</th>
              <th scope="col" class="govuk-table__header">Status</th>
              <th scope="col" class="govuk-table__header">Score</th>
            </tr>
          </thead>
          <tbody class="govuk-table__body">
            ${sessions
              .map((s) => {
                const date = formatSessionDate(s.completedAt)
                const sessionLabel = `Session ${escapeHtml(String(s.sessionId).slice(-3))}`
                const isRecorded = s.consent === 'agreed'

                return `
                  <tr class="govuk-table__row" id="${sessionRowId(s.sessionId)}">
                    <th scope="row" class="govuk-table__header">
                      <div class="tiering-session-results__history-session-cell">
                        <div class="tiering-session-results__history-session-label">${sessionLabel}</div>
                        <div class="tiering-session-results__history-actions">
                          ${
                            isRecorded
                              ? `<a class="govuk-link" href="#" data-history-action="toggle" data-session-id="${escapeHtml(
                                  s.sessionId
                                )}">Show results</a>`
                              : ''
                          }
                          <a class="govuk-link" href="#" data-history-action="delete" data-session-id="${escapeHtml(
                            s.sessionId
                          )}">Delete</a>
                        </div>
                      </div>
                    </th>
                    <td class="govuk-table__cell">${escapeHtml(date)}</td>
                    <td class="govuk-table__cell">${escapeHtml(statusLabel(s))}</td>
                    <td class="govuk-table__cell">${escapeHtml(scoreLabel(s))}</td>
                  </tr>
                  ${
                    isRecorded
                      ? `<tr class="govuk-table__row tiering-session-results__history-details-row" id="${detailRowId(
                          s.sessionId
                        )}" hidden>
                    <td class="govuk-table__cell" colspan="4">
                      <dl class="govuk-summary-list govuk-!-margin-bottom-4">
                        <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">Completed (Calculate score)</dt>
                          <dd class="govuk-summary-list__value">Yes</dd>
                        </div>
                        <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">Section complete (Mark this section complete)</dt>
                          <dd class="govuk-summary-list__value">${s.sectionCompleteAt ? 'Yes' : 'No'}</dd>
                        </div>
                      </dl>

                      ${renderSessionResultsSnapshot(s.results)}
                    </td>
                  </tr>`
                      : ''
                  }
                `
              })
              .join('')}
          </tbody>
        </table>
      `

      historyRoot.querySelectorAll('[data-history-action="toggle"]').forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault()
          const sessionId = link.dataset.sessionId
          if (!sessionId) return
          const details = document.getElementById(detailRowId(sessionId))
          if (!details) return
          const isHidden = details.hidden
          details.hidden = !isHidden
          link.setAttribute('aria-expanded', isHidden ? 'true' : 'false')
          link.textContent = isHidden ? 'Hide results' : 'Show results'
        })
      })

      historyRoot.querySelectorAll('[data-history-action="delete"]').forEach((link) => {
        link.addEventListener('click', async (event) => {
          event.preventDefault()
          const sessionId = link.dataset.sessionId
          if (!sessionId) return

          link.setAttribute('aria-disabled', 'true')
          const ok = await deleteSessionFromHistory(sessionId)
          if (!ok) {
            link.removeAttribute('aria-disabled')
            return
          }
          const row = document.getElementById(sessionRowId(sessionId))
          const details = document.getElementById(detailRowId(sessionId))
          row?.remove()
          details?.remove()
        })
      })
    } catch (e) {
      historyRoot.innerHTML = '<p class="govuk-body">Could not load session history.</p>'
    }
  }

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
    renderHistory()
    printIfRequested()
    return
  }

  const { band, usabilityScore, insights, categories } = analysis

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

  if (tableBody) {
    // Reuse the same renderer for current-session table
    tableBody.closest('table').outerHTML = renderCategoryTable(categories)
  }

  renderHistory()
  printIfRequested()
})
