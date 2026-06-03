//
// Shared offence browse behaviour (a1o accordions and a1o2 tabs)
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

export const formatOffenceCodeLabel = (offence) => {
  if (offence.code && offence.subcode) {
    return `Offence code: ${offence.code}, subcode: ${offence.subcode}`
  }
  if (offence.fullCode) {
    return `Offence code: ${offence.fullCode}`
  }
  return offence.code ? `Offence code: ${offence.code}` : ''
}

export const lookupOffenceIsViolent = (offenceId) => {
  const offences = window.OFFENCE_SEARCH_DATA
  if (!offences?.length || !offenceId) return false

  for (const group of offences) {
    const match = (group.subOffences || []).find((sub) => sub.id === offenceId)
    if (match) return Boolean(match.isViolentOffence)
  }

  return false
}

export const applyOffenceViolentTag = (tagEl, isViolentOffence) => {
  if (!tagEl) return

  const isViolent = Boolean(isViolentOffence)
  tagEl.textContent = isViolent ? 'Violent offence' : 'Not violent'
  tagEl.className = `govuk-tag offence-selected-card__tag ${isViolent ? 'govuk-tag--red' : 'govuk-tag--green'}`
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

export const OFFENCE_BROWSE_PAGE_SIZE = 30

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

export const renderOffenceTableRows = (offences) =>
  offences
    .map(
      (offence) => `
    <tr class="offences-all-table__row" data-offence-row data-offence-id="${escapeOffenceHtml(offence.id)}">
      <td class="govuk-table__cell">${escapeOffenceHtml(offence.label)}</td>
      <td class="govuk-table__cell">${escapeOffenceHtml(offence.code || '')}</td>
      <td class="govuk-table__cell">${escapeOffenceHtml(offence.subcode || '')}</td>
      <td class="govuk-table__cell offences-all-table__action-cell">
        <a class="govuk-link" href="#" data-select-offence data-offence-id="${escapeOffenceHtml(offence.id)}">
          Use this offence<span class="govuk-visually-hidden">, ${escapeOffenceHtml(offence.label)}</span>
        </a>
      </td>
    </tr>`
    )
    .join('')

const renderOffenceTable = (offences) => `
  <table class="govuk-table offences-all-table offence-browse-accordion__table">
    <caption class="govuk-table__caption govuk-table__caption--m govuk-visually-hidden">
      Offences in this category
    </caption>
    <colgroup>
      <col class="offences-all-table__col offences-all-table__col--name">
      <col class="offences-all-table__col offences-all-table__col--code">
      <col class="offences-all-table__col offences-all-table__col--subcode">
      <col class="offences-all-table__col offences-all-table__col--action">
    </colgroup>
    <thead class="govuk-table__head">
      <tr class="govuk-table__row">
        <th scope="col" class="govuk-table__header offences-all-table__header--name">Offence name</th>
        <th scope="col" class="govuk-table__header offences-all-table__header--code">Code</th>
        <th scope="col" class="govuk-table__header offences-all-table__header--subcode">Subcode</th>
        <th scope="col" class="govuk-table__header offences-all-table__action-header"><span class="govuk-visually-hidden">Action</span></th>
      </tr>
    </thead>
    <tbody class="govuk-table__body" data-offences-table-body>
      ${
        offences.length
          ? renderOffenceTableRows(offences)
          : `
      <tr>
        <td class="govuk-table__cell" colspan="4">No offences in this category.</td>
      </tr>`
      }
    </tbody>
  </table>`

export const renderOffenceAccordionSections = (groups, accordionId) =>
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
        ${renderOffenceTable(group.subOffences || [])}
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

  return `
    <div class="govuk-accordion offence-browse-accordion" data-module="govuk-accordion" id="${escapeOffenceHtml(accordionId)}"${rememberExpandedAttr}>
      ${renderOffenceAccordionSections(groups, accordionId)}
    </div>`
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

/** Save current offence to session and return to a1 (or other returnUrl). */
export const persistTieringCurrentOffenceAndReturn = ({
  offence,
  returnUrl = 'a1.html',
  telemetrySource = 'browse',
  preserveConvictionDateEditMode = true
}) => {
  if (!offence?.id) return false

  trackTelemetryOffenceSearch({
    action: 'select',
    query: {
      id: offence.id,
      label: offence.label || '',
      code: offence.code || '',
      subcode: offence.subcode || '',
      fullCode: offence.fullCode || '',
      source: telemetrySource
    }
  })

  const session = getTieringAssessmentSession()
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

  setTieringAssessmentSession(updates)
  window.location.href = withFromCheckAnswers(returnUrl)
  return true
}

export const initOffenceBrowseForm = ({
  form,
  getTableBodies,
  telemetrySource = 'browse',
  browseContext = 'current-offence',
  returnUrl = 'a1.html'
}) => {
  if (!form) return null

  const hiddenInput = form.querySelector('[data-offence-selected-id]')

  if (browseContext !== OFFENCE_SEARCH_RESULTS_BROWSE_CONTEXT) {
    trackTelemetryOffenceSearch({ action: 'browse-open' })
  }

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

  const removeInlineActions = () => {
    document.querySelectorAll('[data-offence-inline-actions]').forEach((row) => row.remove())
  }

  const insertInlineActions = (selectedRow) => {
    removeInlineActions()

    const actionsRow = document.createElement('tr')
    actionsRow.className = 'offences-all-table__inline-actions'
    actionsRow.dataset.offenceInlineActions = ''
    actionsRow.innerHTML = `
      <td class="govuk-table__cell offences-all-table__inline-actions-cell" colspan="4">
        <div class="offences-all-table__inline-actions-inner">
          <button type="button" class="govuk-button govuk-button--secondary" data-offence-deselect data-module="govuk-button">Cancel</button>
          <button type="submit" class="govuk-button" data-module="govuk-button">Save and continue</button>
        </div>
      </td>`

    selectedRow.insertAdjacentElement('afterend', actionsRow)
  }

  const clearSelection = () => {
    selectedOffence = null
    if (hiddenInput) hiddenInput.value = ''

    getBodies().forEach((tableBody) => {
      tableBody.querySelectorAll('[data-offence-row]').forEach((row) => {
        row.classList.remove('offences-all-table__row--selected')
      })
    })

    removeInlineActions()
  }

  const setSelected = (offence) => {
    selectedOffence = offence
    if (hiddenInput) hiddenInput.value = offence.id

    let selectedRow = null

    getBodies().forEach((tableBody) => {
      tableBody.querySelectorAll('[data-offence-row]').forEach((row) => {
        const isSelected = row.dataset.offenceId === offence.id
        row.classList.toggle('offences-all-table__row--selected', isSelected)
        if (isSelected) selectedRow = row
      })
    })

    if (selectedRow) {
      insertInlineActions(selectedRow)
      selectedRow.scrollIntoView({ block: 'nearest' })
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
      <td class="govuk-table__cell" colspan="4">No offences in this category.</td>
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
    if (
      browseContext === VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT ||
      browseContext === OFFENCE_SEARCH_RESULTS_BROWSE_CONTEXT
    ) {
      return
    }

    const session = getTieringAssessmentSession()
    if (!session.currentOffence?.id) return

    const offence = offences.find((item) => item.id === session.currentOffence.id)
    if (offence) setSelected(offence)
  }

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-offence-deselect]')) {
      event.preventDefault()
      clearSelection()
    }
  })

  form.addEventListener('submit', (event) => {
    const a1o3SearchView = document.querySelector('[data-offence-a1o3-search-view]')
    const searchSaveActions = document.querySelector('[data-offence-search-submit-actions]')
    if (
      a1o3SearchView &&
      !a1o3SearchView.hidden &&
      searchSaveActions &&
      !searchSaveActions.hidden
    ) {
      return
    }

    event.preventDefault()
    if (!selectedOffence) return

    if (browseContext === VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT) {
      trackTelemetryOffenceSearch({
        action: 'select',
        query: {
          id: selectedOffence.id,
          label: selectedOffence.label,
          code: selectedOffence.code || '',
          subcode: selectedOffence.subcode || '',
          fullCode: selectedOffence.fullCode || '',
          source: telemetrySource
        }
      })

      setTieringAssessmentSession({
        violentOffenceCheckPending: {
          id: selectedOffence.id,
          label: selectedOffence.label,
          code: selectedOffence.code || '',
          subcode: selectedOffence.subcode || '',
          fullCode: selectedOffence.fullCode || '',
          isViolentOffence: Boolean(selectedOffence.isViolentOffence)
        },
        violentOffenceCheckBrowse: false
      })

      window.location.href = withFromCheckAnswers(returnUrl)
      return
    }

    persistTieringCurrentOffenceAndReturn({
      offence: selectedOffence,
      returnUrl,
      telemetrySource
    })
  })

  return {
    registerOffences,
    renderIntoBody,
    restoreSelection,
    setSelected,
    clearSelection,
    bindSelectLinks,
    showLoadError: (container) => {
      container.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
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
