//
// a1o3 – Sub-offence listing grid loader
//

import { fetchOffenceBrowseGroups } from '../offences-data.js'
import { getPredictorsAssessmentSession } from './predictors-assessment-session.js'
import {
  formatOffenceCode,
  initOffenceBrowsePagination,
  OFFENCE_BROWSE_PAGE_SIZE,
  renderOffenceBrowsePagination
} from './predictors-offence-browse.js'
import { withFromCheckAnswers } from './predictors-change-scroll.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/03/')) return

  const form = document.getElementById('predictors-a1o3-form')
  const heading = document.querySelector('[data-active-category-heading]')
  const tableRoot = document.querySelector('[data-sub-offences-root]')
  const offencesTable = document.querySelector('[data-sub-offences-table]')
  const statusMessage = document.querySelector('[data-table-status-message]')
  const paginationRoot = document.querySelector('[data-sub-offences-pagination]')

  // NEW DOM References for the Selected Summary Display Box
  const previewContainer = document.querySelector('[data-offence-preview-container]')
  const previewLabel = document.querySelector('[data-offence-preview-label]')
  const previewCode = document.querySelector('[data-offence-preview-code]')
  const previewRestart = document.querySelector('[data-offence-preview-restart]')

  // Extract targeted string straight out of the window URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const categoryName = urlParams.get('category')
  const categoryId = urlParams.get('categoryId')
  const browseCategory = urlParams.get('browseCategory')

  if (!form || !tableRoot) return

  const saveButton = form.querySelector('[data-offence-save-continue]')

  const updateBackLinks = (parentCategory) => {
    const backUrl = parentCategory
      ? `a1o?category=${encodeURIComponent(parentCategory)}`
      : 'a1o'

    document
      .querySelectorAll('.assessment-layout .govuk-back-link, .offence-browse-variant-toggle')
      .forEach((link) => {
        link.href = withFromCheckAnswers(backUrl)
      })
  }

  if (browseCategory) {
    updateBackLinks(browseCategory)
  }

  if (!categoryName) {
    if (heading) heading.textContent = 'No Category Selected'
    if (statusMessage) statusMessage.innerHTML = '<p class="govuk-body">Error: Missing category query parameter.</p>'
    return
  }

  // Display clean target description text
  if (heading) heading.textContent = categoryName

  let selectedOffenceObj = null
  let allSubOffences = []

  const updateSaveButtonVisibility = () => {
    if (!saveButton) return

    const showSave = Boolean(selectedOffenceObj)
    saveButton.classList.toggle('offence-browse-save--hidden', !showSave)
    saveButton.toggleAttribute('hidden', !showSave)
    saveButton.disabled = !showSave
  }

  const showNoResults = () => {
    selectedOffenceObj = null
    allSubOffences = []
    if (previewContainer) previewContainer.hidden = true
    if (previewRestart) previewRestart.hidden = true
    if (tableRoot) tableRoot.innerHTML = ''
    if (offencesTable) offencesTable.hidden = true
    if (paginationRoot) {
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
    }
    if (statusMessage) {
      statusMessage.hidden = false
      statusMessage.innerHTML = '<p class="govuk-body">No results found</p>'
    }
    updateSaveButtonVisibility()
  }

  const scrollToListTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }

  const renderSubOffencesPage = (page, { scrollToTop = false } = {}) => {
    const totalPages = Math.max(1, Math.ceil(allSubOffences.length / OFFENCE_BROWSE_PAGE_SIZE))
    const currentPage = Math.min(Math.max(page, 1), totalPages)
    const start = (currentPage - 1) * OFFENCE_BROWSE_PAGE_SIZE
    const pageItems = allSubOffences.slice(start, start + OFFENCE_BROWSE_PAGE_SIZE)

    // Inject matching semantic single rows with custom micro-wrapped radio tokens
    tableRoot.innerHTML = pageItems.map((sub, i) => {
      const index = start + i
      const displayCode = formatOffenceCode(sub)
      const radioId = `offence-choice-${index}`
      // Show the exact offence name. `label` is a shortened version (truncated
      // at the first "." or "["), so prefer the full `description`.
      const display = sub.description || sub.label;

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
                       data-offence-raw-string="${encodeURIComponent(JSON.stringify(sub))}">
                
                <label class="govuk-label govuk-radios__label" for="${radioId}">
                  ${display}<span class="govuk-visually-hidden">, code ${displayCode}</span>
                </label>
              </div>
            </div>
          </td>
          <td class="govuk-table__cell offence-result-table__code-cell">
            <label class="offence-result-table__code-label" for="${radioId}">
              <span class="predictors-offence-code" aria-hidden="true">${displayCode}</span>
            </label>
          </td>
        </tr>
      `
    }).join('')

    // Accessibility feature: Make the entire physical table row clickable to pick the radio target
    tableRoot.querySelectorAll('[data-clickable-table-row]').forEach((row) => {
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

    // Keep the previously chosen offence checked when returning to its page
    if (selectedOffenceObj) {
      const selectedRadio = tableRoot.querySelector(
        `input[type="radio"][value="${CSS.escape(selectedOffenceObj.id)}"]`
      )
      if (selectedRadio) selectedRadio.checked = true
    }

    if (paginationRoot) {
      if (totalPages > 1) {
        paginationRoot.hidden = false
        paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
        initOffenceBrowsePagination(paginationRoot, (nextPage) =>
          renderSubOffencesPage(nextPage, { scrollToTop: true })
        )
      } else {
        paginationRoot.hidden = true
        paginationRoot.innerHTML = ''
      }
    }

    if (scrollToTop) scrollToListTop()
  }

  const renderSubOffencesTable = (categoryGroup) => {
    allSubOffences = categoryGroup.subOffences || []

    if (allSubOffences.length === 0) {
      showNoResults()
      return
    }

    selectedOffenceObj = null
    if (previewContainer) previewContainer.hidden = true
    if (previewRestart) previewRestart.hidden = true
    if (offencesTable) offencesTable.hidden = false
    if (statusMessage) statusMessage.hidden = true
    updateSaveButtonVisibility()

    renderSubOffencesPage(1)
  }

  // Parses payload data and mirrors selection configuration to visual preview block
  const extractSelectedPayload = (radioInputElement) => {
    try {
      selectedOffenceObj = JSON.parse(decodeURIComponent(radioInputElement.dataset.offenceRawString))

      // Update our explicit preview targets immediately
      if (previewContainer && previewLabel && previewCode) {
        const codeDisplay = formatOffenceCode(selectedOffenceObj)

        previewLabel.textContent = selectedOffenceObj.description || selectedOffenceObj.label
        previewCode.textContent = codeDisplay
        previewCode.hidden = !codeDisplay

        // Remove 'hidden' attribute to slide summary block into layout visibility
        previewContainer.hidden = false
        if (previewRestart) previewRestart.hidden = false
      }
      updateSaveButtonVisibility()
    } catch (err) {
      console.error('Failed to parse active option state token string', err)
    }
  }

  // Handle final choice submission inside your sub-offence script
  form.addEventListener('submit', (event) => {
    event.preventDefault()

    if (!selectedOffenceObj) {
      alert('Please select an offence from the list to continue.')
      return
    }

    // 1. Save to your local assessment session cache object
    const session = getPredictorsAssessmentSession()
    const offencePayload = {
      id: selectedOffenceObj.id,
      label: selectedOffenceObj.label,
      code: selectedOffenceObj.code || '',
      subcode: selectedOffenceObj.subcode || '',
      fullCode: selectedOffenceObj.fullCode || '',
      isViolentOffence: Boolean(selectedOffenceObj.isViolentOffence)
    }
    session.currentOffence = offencePayload

    // 2. Build explicit URL parameters to pass the choice back
    const urlParams = new URLSearchParams()
    urlParams.set('returned_offence_id', offencePayload.id)
    urlParams.set('returned_offence_label', offencePayload.label)
    urlParams.set('returned_offence_code', offencePayload.code)
    urlParams.set('returned_offence_subcode', offencePayload.subcode)

    // Redirect with data cleanly appended to the path string
    window.location.href = `a2b?${urlParams.toString()}`
  })

  // Bootstrapping
  fetchOffenceBrowseGroups()
      .then((groups) => {
        const matchedGroup =
          (categoryId && groups.find(g => g.id === categoryId)) ||
          groups.find(g => g.label === categoryName)
        if (matchedGroup) {
          updateBackLinks(browseCategory || matchedGroup.category)
          renderSubOffencesTable(matchedGroup)
        } else {
          updateBackLinks(browseCategory || '')
          showNoResults()
        }
      })
      .catch((error) => {
        console.error('Failed processing category layout sequence data view:', error)
        if (statusMessage) {
          statusMessage.hidden = false
          statusMessage.innerHTML = '<p class="govuk-body">Error loading records database payload.</p>'
        }
      })
})