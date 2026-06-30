//
// a1r – Offence search results page
// Lists offences matching a free-text query as selectable radio rows,
// paginated 20 per page, mirroring the a1o3 browse-results layout.
//

import { fetchOffenceBrowseGroups, getOffenceSearchMatches } from './offences-data.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'
import {
  formatOffenceCode,
  initOffenceBrowsePagination,
  paginateOffenceBrowseGroups,
  renderOffenceBrowsePagination
} from './tiering-offence-browse.js'

const VIOLENT_CONTEXT = 'violent-offence-check'
const VIOLENT_RETURN_URL = 'a2.html#violent-offence-check'

window.GOVUKPrototypeKit.documentReady(() => {
  if (window.location.pathname.includes('/02/')) return

  const form = document.getElementById('tiering-a1r-form')
  const heading = document.querySelector('[data-results-heading]')
  const countEl = document.querySelector('[data-results-count]')
  const statusEl = document.querySelector('[data-results-status]')
  const tableEl = document.querySelector('[data-results-table]')
  const root = document.querySelector('[data-results-root]')
  const paginationRoot = document.querySelector('[data-results-pagination]')

  const previewContainer = document.querySelector('[data-offence-preview-container]')
  const previewLabel = document.querySelector('[data-offence-preview-label]')
  const previewCode = document.querySelector('[data-offence-preview-code]')
  const previewRestart = document.querySelector('[data-offence-preview-restart]')

  if (!form || !root) return

  const saveButton = form.querySelector('[data-offence-save-continue]')
  const params = new URLSearchParams(window.location.search)
  const query = (params.get('q') || '').trim()
  const isViolentContext = params.get('context') === VIOLENT_CONTEXT

  if (heading) {
    heading.textContent = query ? `Search results for ‘${query}’` : 'Search results'
  }

  if (isViolentContext) {
    const caption = document.querySelector('[data-results-caption]')
    if (caption) caption.textContent = 'Check if an offence is violent'

    const restartLink = document.querySelector('[data-results-restart-link]')
    if (restartLink) restartLink.setAttribute('href', `a2.html?focus=offence-search#violent-offence-check`)

    document
      .querySelectorAll('.assessment-layout .govuk-back-link')
      .forEach((link) => link.setAttribute('href', VIOLENT_RETURN_URL))
  }

  let selectedOffenceObj = null
  let results = []

  const updateSaveButtonVisibility = () => {
    if (!saveButton) return
    const showSave = Boolean(selectedOffenceObj)
    saveButton.classList.toggle('offence-browse-save--hidden', !showSave)
    saveButton.toggleAttribute('hidden', !showSave)
    saveButton.disabled = !showSave
  }

  const updatePreview = () => {
    if (!previewContainer || !previewLabel || !previewCode) return

    if (!selectedOffenceObj) {
      previewContainer.hidden = true
      if (previewRestart) previewRestart.hidden = true
      return
    }

    const codeDisplay = formatOffenceCode(selectedOffenceObj)
    previewLabel.textContent = selectedOffenceObj.description || selectedOffenceObj.label
    previewCode.textContent = codeDisplay
    previewCode.hidden = !codeDisplay
    previewContainer.hidden = false
    if (previewRestart) previewRestart.hidden = false
  }

  const extractSelectedPayload = (radioInputElement) => {
    try {
      selectedOffenceObj = JSON.parse(decodeURIComponent(radioInputElement.dataset.offenceRawString))
      updatePreview()
      updateSaveButtonVisibility()
    } catch (err) {
      console.error('Failed to parse selected offence payload', err)
    }
  }

  const renderPage = (page) => {
    const { items, currentPage, totalPages } = paginateOffenceBrowseGroups(results, page)

    root.innerHTML = items
      .map((sub, index) => {
        const displayCode = formatOffenceCode(sub)
        const radioId = `offence-choice-${index}`
        const isChecked = selectedOffenceObj && String(selectedOffenceObj.id) === String(sub.id)

        return `
          <tr class="govuk-table__row" data-clickable-table-row>
            <td class="govuk-table__cell offence-result-table__name-cell">
              <div class="govuk-radios govuk-radios--small">
                <div class="govuk-radios__item">
                  <input class="govuk-radios__input"
                         id="${radioId}"
                         name="selected_sub_offence"
                         type="radio"
                         value="${sub.id}"
                         ${isChecked ? 'checked' : ''}
                         data-offence-raw-string="${encodeURIComponent(JSON.stringify(sub))}">
                  <label class="govuk-label govuk-radios__label" for="${radioId}">
                    ${sub.description || sub.label}<span class="govuk-visually-hidden">, code ${displayCode}</span>
                  </label>
                </div>
              </div>
            </td>
            <td class="govuk-table__cell offence-result-table__code-cell">
              <label class="offence-result-table__code-label" for="${radioId}">
                <span class="tiering-offence-code" aria-hidden="true">${displayCode}</span>
              </label>
            </td>
          </tr>
        `
      })
      .join('')

    root.querySelectorAll('[data-clickable-table-row]').forEach((row) => {
      row.addEventListener('click', (e) => {
        const targetRadio = row.querySelector('input[type="radio"]')
        if (targetRadio && e.target !== targetRadio && !e.target.closest('label')) {
          targetRadio.checked = true
          extractSelectedPayload(targetRadio)
        }
      })

      row.querySelector('input[type="radio"]')?.addEventListener('change', (e) => {
        extractSelectedPayload(e.target)
      })
    })

    if (paginationRoot) {
      if (totalPages > 1) {
        paginationRoot.hidden = false
        paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
        initOffenceBrowsePagination(paginationRoot, (nextPage) => {
          renderPage(nextPage)
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        })
      } else {
        paginationRoot.hidden = true
        paginationRoot.innerHTML = ''
      }
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!selectedOffenceObj) return

    const offencePayload = {
      id: selectedOffenceObj.id,
      label: selectedOffenceObj.label,
      code: selectedOffenceObj.code || '',
      subcode: selectedOffenceObj.subcode || '',
      fullCode: selectedOffenceObj.fullCode || '',
      isViolentOffence: Boolean(selectedOffenceObj.isViolentOffence)
    }

    if (isViolentContext) {
      setTieringAssessmentSession({
        violentOffenceCheckPending: offencePayload,
        violentOffenceCheckBrowse: false
      })
      window.location.href = VIOLENT_RETURN_URL
      return
    }

    const session = getTieringAssessmentSession()
    session.currentOffence = offencePayload

    const urlParams = new URLSearchParams()
    urlParams.set('returned_offence_id', offencePayload.id)
    urlParams.set('returned_offence_label', offencePayload.label)
    urlParams.set('returned_offence_code', offencePayload.code)
    urlParams.set('returned_offence_subcode', offencePayload.subcode)

    window.location.href = `a1?${urlParams.toString()}`
  })

  if (!query) {
    if (statusEl) statusEl.innerHTML = '<p class="govuk-body">Enter a search term to see results.</p>'
    return
  }

  fetchOffenceBrowseGroups()
    .then((groups) => {
      const { items } = getOffenceSearchMatches(groups, query)

      // Show specific offences (subs), mirroring the auto-suggest list and
      // avoiding parent/sub duplicates for the same code.
      const seen = new Set()
      results = items
        .filter((item) => item.type === 'sub')
        .filter((item) => {
          const key = String(item.id)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

      if (statusEl) statusEl.hidden = true

      if (!results.length) {
        if (statusEl) {
          statusEl.hidden = false
          statusEl.innerHTML =
            '<p class="govuk-body">No results found. Check your spelling or try a different term.</p>'
        }
        if (countEl) countEl.textContent = ''
        if (tableEl) tableEl.hidden = true
        return
      }

      if (countEl) {
        countEl.textContent = results.length === 1 ? '1 result found' : `${results.length} results found`
      }

      if (tableEl) tableEl.hidden = false
      renderPage(1)
    })
    .catch((error) => {
      console.error('Failed to load offence search results:', error)
      if (statusEl) {
        statusEl.hidden = false
        statusEl.innerHTML = '<p class="govuk-body">Error loading results.</p>'
      }
    })
})
