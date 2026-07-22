//
// Shared offence browse behaviour (a1o accordions and related browse pages)
//

import { isPredictorsCheckAnswersEdit, withFromCheckAnswers } from './predictors-change-scroll.js'
import { getPredictorsAssessmentSession, setPredictorsAssessmentSession } from './predictors-assessment-session.js'

export const escapeOffenceHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const padDigits = (value, width) => {
  const s = String(value ?? '').trim()
  if (!s) return ''
  if (!/^\d+$/.test(s)) return s
  return s.padStart(width, '0')
}

export const formatOffenceCode = (offence) => {
  if (!offence) return ''

  const code = String(offence.code ?? '').trim()
  const subcode = String(offence.subcode ?? '').trim()
  const fullCode = String(offence.fullCode ?? '').trim()

  if (code && subcode) return `${padDigits(code, 3)} ${padDigits(subcode, 2)}`

  // Prefer splitting a 5+ digit fullCode (e.g. 00301 → 003 01)
  if (fullCode && /^\d{5,}$/.test(fullCode)) {
    const c = fullCode.slice(0, -2)
    const s = fullCode.slice(-2)
    return `${padDigits(c, 3)} ${padDigits(s, 2)}`
  }

  // Fallback: code-only still renders with a subcode part for consistent display
  if (code) return `${padDigits(code, 3)} 00`

  // Unknown shape (non-numeric codes)
  if (fullCode) return fullCode

  return ''
}

export const formatOffenceCodeLabel = (offence) => {
  return formatOffenceCode(offence)
}

export const getOffenceCodeBracket = (offence) => {
  return formatOffenceCode(offence)
}

export const formatOffenceLabelWithCodes = (offence) => {
  const codeBracket = getOffenceCodeBracket(offence)
  return codeBracket ? `${offence.label}  ${codeBracket}` : offence.label
}

const normaliseOffenceId = (offenceId) => String(offenceId ?? '').trim().toLowerCase()

export const ensureOffenceSearchData = async () => {
  if (window.OFFENCE_SEARCH_DATA?.length) return window.OFFENCE_SEARCH_DATA

  try {
    const response = await fetch('/api/offences')
    if (!response.ok) return []
    window.OFFENCE_SEARCH_DATA = await response.json()
    return window.OFFENCE_SEARCH_DATA
  } catch {
    return []
  }
}

export const lookupOffenceDetails = (offenceId) => {
  const offences = window.OFFENCE_SEARCH_DATA
  if (!offences?.length || !offenceId) return null

  const targetId = normaliseOffenceId(offenceId)

  for (const group of offences) {
    const match = (group.subOffences || []).find((sub) => normaliseOffenceId(sub.id) === targetId)
    if (match) {
      return {
        id: match.id,
        label: match.label || '',
        code: match.code || '',
        subcode: match.subcode || '',
        fullCode: match.fullCode || '',
        parentGroupDescription: group.category || '',
        categoryDescription: group.label || '',
        subCategoryDescription: match.description || match.label || '',
        isViolentOffence: Boolean(match.isViolentOffence)
      }
    }
  }

  return null
}

export const lookupOffenceIsViolent = (offenceId) => {
  const offences = window.OFFENCE_SEARCH_DATA
  if (!offences?.length || !offenceId) return false

  const targetId = normaliseOffenceId(offenceId)

  for (const group of offences) {
    const match = (group.subOffences || []).find((sub) => normaliseOffenceId(sub.id) === targetId)
    if (match) return Boolean(match.isViolentOffence)
  }

  return false
}

export const applyOffenceViolentTag = (tagEl, isViolentOffence) => {
  if (!tagEl) return

  const isViolent = Boolean(isViolentOffence)
  const preservedClasses = [...tagEl.classList].filter(
    (className) => !className.startsWith('govuk-tag') && className !== 'offence-selected-card__tag'
  )

  tagEl.textContent = isViolent ? 'Violent' : 'Not violent'
  tagEl.className = [
    ...preservedClasses,
    'govuk-tag',
    'offence-selected-card__tag',
    isViolent ? 'govuk-tag--red' : 'govuk-tag--grey'
  ].join(' ')
  tagEl.hidden = false
}

export const clearOffenceViolentTag = (tagEl) => {
  if (tagEl) tagEl.hidden = true
}

export const formatOffenceGroupCount = (count) => {
  const total = Number(count) || 0
  const word = total === 1 ? 'offence' : 'offences'
  return `(${total} ${word})`
}

export const OFFENCE_BROWSE_PAGE_SIZE = 20

const PAGINATION_PREV_ICON = `<svg class="govuk-pagination__icon govuk-pagination__icon--prev" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
        <path d="m6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z"></path>
      </svg>`

const PAGINATION_NEXT_ICON = `<svg class="govuk-pagination__icon govuk-pagination__icon--next" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
        <path d="m8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z"></path>
      </svg>`

export const paginateOffenceBrowseGroups = (groups, page, pageSize = OFFENCE_BROWSE_PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: groups.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalItems: groups.length
  }
}

export const buildOffenceBrowsePaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 1) return []

  const pages = new Set([1, totalPages, currentPage])

  pages.add(currentPage - 1)
  pages.add(currentPage + 1)
  pages.add(currentPage - 2)
  pages.add(currentPage + 2)

  const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)

  const items = []
  let previousPage = 0

  sortedPages.forEach((page) => {
    if (page - previousPage > 1) {
      items.push({ ellipsis: true })
    }

    items.push({
      number: page,
      current: page === currentPage
    })
    previousPage = page
  })

  return items
}

export const renderOffenceBrowsePagination = ({ currentPage, totalPages }) => {
  if (totalPages <= 1) return ''

  const items = buildOffenceBrowsePaginationItems(currentPage, totalPages)

  const pageItems = items
    .map((item) => {
      if (item.ellipsis) {
        return `
      <li class="govuk-pagination__item govuk-pagination__item--ellipsis">
        &ctdot;
      </li>`
      }

      const currentClass = item.current ? ' govuk-pagination__item--current' : ''

      return `
      <li class="govuk-pagination__item${currentClass}">
        <a class="govuk-link govuk-pagination__link" href="#" data-offence-page="${item.number}" aria-label="Page ${item.number}"${item.current ? ' aria-current="page"' : ''}>
          ${item.number}
        </a>
      </li>`
    })
    .join('')

  const previous =
    currentPage > 1
      ? `
  <div class="govuk-pagination__prev">
    <a class="govuk-link govuk-pagination__link" href="#" rel="prev" data-offence-page="${currentPage - 1}">
      ${PAGINATION_PREV_ICON}
      <span class="govuk-pagination__link-title">
        Previous<span class="govuk-visually-hidden"> page</span>
      </span>
    </a>
  </div>`
      : ''

  const next =
    currentPage < totalPages
      ? `
  <div class="govuk-pagination__next">
    <a class="govuk-link govuk-pagination__link" href="#" rel="next" data-offence-page="${currentPage + 1}">
      <span class="govuk-pagination__link-title">
        Next<span class="govuk-visually-hidden"> page</span>
      </span>
      ${PAGINATION_NEXT_ICON}
    </a>
  </div>`
      : ''

  return `
<nav class="govuk-pagination offence-browse-pagination" aria-label="Pagination">
  ${previous}
  <ul class="govuk-pagination__list">
    ${pageItems}
  </ul>
  ${next}
</nav>`
}

export const initOffenceBrowsePagination = (root, onPageChange) => {
  if (!root || !onPageChange) return

  root.querySelectorAll('[data-offence-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const page = Number(link.dataset.offencePage)
      if (!page) return
      onPageChange(page)
    })
  })
}

export const offenceRadioId = (offenceId) =>
  `offence-${String(offenceId).replace(/[^a-zA-Z0-9_-]/g, '-')}`

export const renderOffenceTableRows = (offences, selectedId = '') =>
  offences
    .map((offence) => {
      const radioId = offenceRadioId(offence.id)
      const isChecked = offence.id === selectedId
      const checkedAttr = isChecked ? ' checked' : ''

      return `
    <tr class="offences-all-table__row offences-all-table__row--selectable" data-offence-row data-offence-id="${escapeOffenceHtml(offence.id)}">
      <td class="govuk-table__cell offences-all-table__name-cell">
        <div class="govuk-radios govuk-radios--small offences-all-table__radio">
          <div class="govuk-radios__item">
            <input
              class="govuk-radios__input"
              id="${escapeOffenceHtml(radioId)}"
              name="current_offence_id"
              type="radio"
              value="${escapeOffenceHtml(offence.id)}"
              data-select-offence${checkedAttr}
            >
            <label class="govuk-label govuk-radios__label offences-all-table__name-label" for="${escapeOffenceHtml(radioId)}">
              ${escapeOffenceHtml(offence.label)}<span class="govuk-visually-hidden">, code ${escapeOffenceHtml(offence.code || '')}, subcode ${escapeOffenceHtml(offence.subcode || '')}</span>
            </label>
          </div>
        </div>
      </td>
      <td class="govuk-table__cell offences-all-table__code-cell">
        <label class="offences-all-table__cell-label" for="${escapeOffenceHtml(radioId)}">
          <span aria-hidden="true">${escapeOffenceHtml(offence.code || '')}</span>
        </label>
      </td>
      <td class="govuk-table__cell offences-all-table__subcode-cell">
        <label class="offences-all-table__cell-label" for="${escapeOffenceHtml(radioId)}">
          <span aria-hidden="true">${escapeOffenceHtml(offence.subcode || '')}</span>
        </label>
      </td>
    </tr>`
    })
    .join('')

const renderOffenceTable = (offences, selectedId = '') => `
  <table class="govuk-table offences-all-table offence-browse-accordion__table">
    <caption class="govuk-table__caption govuk-table__caption--m govuk-visually-hidden">
      Offences in this category
    </caption>
    <colgroup>
      <col class="offences-all-table__col offences-all-table__col--name">
      <col class="offences-all-table__col offences-all-table__col--code">
      <col class="offences-all-table__col offences-all-table__col--subcode">
    </colgroup>
    <thead class="govuk-table__head">
      <tr class="govuk-table__row">
        <th scope="col" class="govuk-table__header offences-all-table__header--name">Offence name</th>
        <th scope="col" class="govuk-table__header offences-all-table__header--code">Code</th>
        <th scope="col" class="govuk-table__header offences-all-table__header--subcode">Subcode</th>
      </tr>
    </thead>
    <tbody class="govuk-table__body" data-offences-table-body>
      ${
        offences.length
          ? renderOffenceTableRows(offences, selectedId)
          : `
      <tr>
        <td class="govuk-table__cell" colspan="3">No offences in this category.</td>
      </tr>`
      }
    </tbody>
  </table>`

export const renderOffenceAccordionSections = (groups, accordionId, selectedId = '') =>
  groups
    .map(
      (group, index) => {
        const offenceCount = group.subOffences?.length || group.subOffenceCount || 0

        return `
    <div class="govuk-accordion__section offence-browse-accordion__section">
      <div class="govuk-accordion__section-header offence-browse-accordion__header">
        <h2 class="govuk-accordion__section-heading">
          <span class="govuk-accordion__section-button" id="${escapeOffenceHtml(accordionId)}-heading-${index + 1}">
            <span class="offence-browse-accordion__header-layout">
              <span class="offence-browse-accordion__title">${escapeOffenceHtml(group.label)}</span>
              <span class="offence-browse-accordion__count govuk-body-s">${escapeOffenceHtml(formatOffenceGroupCount(offenceCount))}</span>
            </span>
            <span class="offence-browse-accordion__code govuk-body-s">${escapeOffenceHtml(group.code)}</span>
          </span>
        </h2>
      </div>
      <div id="${escapeOffenceHtml(accordionId)}-content-${index + 1}" class="govuk-accordion__section-content offence-browse-accordion__content">
        ${renderOffenceTable(group.subOffences || [], selectedId)}
      </div>
    </div>`
      }
    )
    .join('')

export const renderOffenceAccordion = (groups, accordionId, options = {}) => {
  if (!groups.length) {
    return '<p class="govuk-body">No offences found.</p>'
  }

  const rememberExpandedAttr =
    options.rememberExpanded === false ? ' data-remember-expanded="false"' : ''
  const selectedId = options.selectedId || ''

  return `
    <div class="govuk-accordion offence-browse-accordion" data-module="govuk-accordion" id="${escapeOffenceHtml(accordionId)}"${rememberExpandedAttr}>
      ${renderOffenceAccordionSections(groups, accordionId, selectedId)}
    </div>`
}

export const syncOffenceAccordionSectionInert = (root) => {
  if (!root || !('inert' in HTMLElement.prototype)) return

  root.querySelectorAll('.govuk-accordion__section').forEach((section) => {
    const content = section.querySelector('.govuk-accordion__section-content')
    if (!content) return

    content.inert = !section.classList.contains('govuk-accordion__section--expanded')
  })
}

export const initOffenceBrowseAccordion = (root, options = {}) => {
  const { rememberExpanded = true } = options

  if (!root || root.dataset.accordionReady === 'true') return

  try {
    if (window.GOVUKFrontend?.Accordion) {
      // GOV.UK Frontend v6 initialises in the constructor (no .init() method).
      new window.GOVUKFrontend.Accordion(root, { rememberExpanded })
    }
  } catch (error) {
    console.error('Offence browse accordion could not be initialised:', error)
  }

  // GOV.UK moves all header content into heading-text; pull code out beside Show/Hide.
  root.querySelectorAll('.govuk-accordion__section-button').forEach((button) => {
    const code = button.querySelector('.offence-browse-accordion__code')
    const toggle = button.querySelector('.govuk-accordion__section-toggle')
    if (!code || !toggle || code.dataset.repositioned === 'true') return

    button.insertBefore(code, toggle)
    code.dataset.repositioned = 'true'
  })

  syncOffenceAccordionSectionInert(root)

  root.addEventListener('click', () => {
    requestAnimationFrame(() => syncOffenceAccordionSectionInert(root))
  })

  root.dataset.accordionReady = 'true'
}

export const initOffenceBrowseVariantLinks = () => {
  document.querySelectorAll('.offence-browse-variant-toggle').forEach((link) => {
    const target = link.getAttribute('href')
    if (target) link.href = withFromCheckAnswers(target)
  })
}

export const VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT = 'violent-offence-check'

export const OFFENCE_SEARCH_RESULTS_BROWSE_CONTEXT = 'search-results'

/** Save current offence to session and return to a2b (or other returnUrl). */
export const persistPredictorsCurrentOffenceAndReturn = ({
  offence,
  returnUrl = 'a2b.html',
  preserveConvictionDateEditMode = true
}) => {
  if (!offence?.id) return false

  const session = getPredictorsAssessmentSession()
  const updates = {
    currentOffence: {
      id: offence.id,
      label: offence.label || '',
      code: offence.code || '',
      subcode: offence.subcode || '',
      fullCode: offence.fullCode || '',
      isViolentOffence: Boolean(offence.isViolentOffence)
    }
  }

  if (preserveConvictionDateEditMode) {
    updates.convictionDateEditMode = session.convictionDateEditMode === true
  }

  setPredictorsAssessmentSession(updates)
  window.location.href = withFromCheckAnswers(returnUrl)
  return true
}

export const initOffenceBrowseForm = ({
  form,
  getTableBodies,
  browseContext = 'current-offence',
  returnUrl = 'a2b.html',
  onStartNewSearch = null,
  selectionErrorFocusSelector = null,
  categoryRequiredSelector = null,
  validateOffenceSelection = true
}) => {
  if (!form) return null

  const errorSummary = document.querySelector('[data-offence-browse-error-summary]')
  const fieldset = form.querySelector('#offence-browse-fieldset')
  const selectionSummary = form.querySelector('[data-offence-selection-summary]')
  const selectionSummaryValue = form.querySelector('[data-offence-selection-summary-value]')
  const selectionErrorFocusTarget = selectionErrorFocusSelector
    ? document.querySelector(selectionErrorFocusSelector)
    : null
  const selectionErrorFieldGroup =
    selectionErrorFocusTarget?.closest('[data-offence-category-field]') ||
    selectionErrorFocusTarget?.closest('.govuk-form-group') ||
    null

  const getSelectionErrorMessage = () =>
    selectionErrorFieldGroup?.querySelector('.govuk-error-message') || null

  const createSelectionErrorMessage = () => {
    if (!selectionErrorFieldGroup || !selectionErrorFocusTarget) return null

    const existing = getSelectionErrorMessage()
    if (existing) return existing

    const messageText =
      selectionErrorFieldGroup.dataset.offenceErrorMessage || 'Select an offence'
    const message = document.createElement('p')
    message.className = 'govuk-error-message'
    message.id = `${selectionErrorFocusTarget.id}-error`
    message.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${messageText}`
    selectionErrorFocusTarget.before(message)
    return message
  }

  initOffenceBrowseVariantLinks()

  const startNewSearchLink = form.querySelector('[data-offence-start-new-search]')
  if (startNewSearchLink) {
    startNewSearchLink.addEventListener('click', (event) => {
      event.preventDefault()
      if (typeof onStartNewSearch === 'function') {
        onStartNewSearch()
        return
      }
      clearSelection()
    })
  }

  if (isPredictorsCheckAnswersEdit()) {
    const backLink = document.querySelector('.assessment-layout .govuk-back-link')
    if (backLink) backLink.href = withFromCheckAnswers('a2b.html')
  }

  let selectedOffence = null
  let offences = []

  const getSelectedId = () => selectedOffence?.id || ''

  const updateSelectionSummary = () => {
    if (!selectionSummary || !selectionSummaryValue) return

    if (selectedOffence) {
      const code = formatOffenceCode(selectedOffence)
      selectionSummaryValue.innerHTML = `
        <span class="offence-browse-selection-summary__name">${escapeOffenceHtml(selectedOffence.label)}</span>
        <span class="offence-browse-selection-summary__code">${escapeOffenceHtml(code)}</span>`
      selectionSummary.hidden = false
      return
    }

    selectionSummaryValue.innerHTML = ''
    selectionSummary.hidden = true
  }

  const clearSelectionError = () => {
    if (errorSummary) errorSummary.hidden = true
    fieldset?.classList.remove('govuk-fieldset--error')
    selectionErrorFocusTarget?.classList.remove('govuk-select--error')
    selectionErrorFieldGroup?.classList.remove('govuk-form-group--error')
    getSelectionErrorMessage()?.remove()
    selectionErrorFocusTarget?.removeAttribute('aria-describedby')
  }

  const showSelectionError = () => {
    if (errorSummary) {
      errorSummary.hidden = false
      errorSummary.focus()
    }

    if (selectionErrorFocusTarget) {
      selectionErrorFocusTarget.classList.add('govuk-select--error')
      selectionErrorFieldGroup?.classList.add('govuk-form-group--error')
      const selectionErrorMessage = createSelectionErrorMessage()
      if (selectionErrorMessage?.id) {
        selectionErrorFocusTarget.setAttribute('aria-describedby', selectionErrorMessage.id)
      }
      return
    }

    fieldset?.classList.add('govuk-fieldset--error')
  }

  const errorSummaryLink = errorSummary?.querySelector('a[href]')
  if (errorSummaryLink && selectionErrorFocusTarget) {
    errorSummaryLink.addEventListener('click', (event) => {
      event.preventDefault()
      selectionErrorFocusTarget.focus({ preventScroll: false })
      selectionErrorFocusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const clearSelection = () => {
    selectedOffence = null

    form.querySelectorAll('[data-select-offence]').forEach((radio) => {
      radio.checked = false
    })

    if (browseContext === 'current-offence') {
      setPredictorsAssessmentSession({ currentOffence: null })
    }

    updateSelectionSummary()
    clearSelectionError()
  }

  const setSelected = (offence, { scrollToRow = false } = {}) => {
    if (!offence?.id) return

    selectedOffence = offence
    clearSelectionError()

    form.querySelectorAll('[data-select-offence]').forEach((radio) => {
      radio.checked = radio.value === offence.id
    })

    updateSelectionSummary()

    if (scrollToRow) {
      const selectedRow = form.querySelector(`[data-offence-row][data-offence-id="${CSS.escape(offence.id)}"]`)
      selectedRow?.scrollIntoView({ block: 'nearest' })
    }
  }

  const syncRadioSelection = () => {
    const selectedId = getSelectedId()

    form.querySelectorAll('[data-select-offence]').forEach((radio) => {
      radio.checked = radio.value === selectedId
    })

    updateSelectionSummary()
  }

  const bindOffenceRadios = (root) => {
    root.querySelectorAll('[data-select-offence]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return

        const offence = offences.find((item) => item.id === radio.value)
        if (offence) setSelected(offence)
      })
    })

    root.querySelectorAll('[data-offence-row]').forEach((row) => {
      row.addEventListener('click', (event) => {
        const radio = row.querySelector('[data-select-offence]')
        if (!radio || radio.disabled) return
        if (event.target === radio) return

        if (!radio.checked) {
          radio.checked = true
          radio.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
    })

    syncRadioSelection()
  }

  const renderIntoBody = (tableBody, bodyOffences) => {
    if (!bodyOffences.length) {
      tableBody.innerHTML = `
    <tr>
      <td class="govuk-table__cell" colspan="3">No offences in this category.</td>
    </tr>`
      return
    }

    tableBody.innerHTML = renderOffenceTableRows(bodyOffences, getSelectedId())
    bindOffenceRadios(tableBody)
  }

  const registerOffences = (list) => {
    offences = list

    if (selectedOffence && !offences.some((item) => item.id === selectedOffence.id)) {
      clearSelection()
    }
  }

  const restoreSelection = () => {
    if (
      browseContext === VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT ||
      browseContext === OFFENCE_SEARCH_RESULTS_BROWSE_CONTEXT
    ) {
      return
    }

    const session = getPredictorsAssessmentSession()
    if (!session.currentOffence?.id) return

    const offence = offences.find((item) => item.id === session.currentOffence.id)
    if (offence) setSelected(offence)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    if (categoryRequiredSelector) {
      const categoryField = document.querySelector(categoryRequiredSelector)
      if (!categoryField?.value) {
        showSelectionError()
        return
      }
      return
    }

    if (!validateOffenceSelection) return

    const checkedRadio = form.querySelector('[data-select-offence]:checked')
    const offence =
      selectedOffence ||
      (checkedRadio ? offences.find((item) => item.id === checkedRadio.value) : null)

    if (!offence) {
      showSelectionError()
      return
    }

    if (browseContext === VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT) {
      setPredictorsAssessmentSession({
        violentOffenceCheckPending: {
          id: offence.id,
          label: offence.label,
          code: offence.code || '',
          subcode: offence.subcode || '',
          fullCode: offence.fullCode || '',
          isViolentOffence: Boolean(offence.isViolentOffence)
        },
        violentOffenceCheckBrowse: false
      })

      window.location.href = withFromCheckAnswers(returnUrl)
      return
    }

    persistPredictorsCurrentOffenceAndReturn({
      offence,
      returnUrl
    })
  })

  return {
    registerOffences,
    renderIntoBody,
    restoreSelection,
    setSelected,
    clearSelection,
    syncRadioSelection,
    bindOffenceRadios,
    getSelectedId,
    showLoadError: (container) => {
      container.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
    }
  }
}
