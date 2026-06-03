//
// Offence autocomplete – prototype search for Tiering assessment
// Data: /api/offences (app/data/offences.json)
//

import {
  isConvictionDateEditPanelOpen,
  persistConvictionDateState
} from './conviction-date.js'
import { captureCheckAnswersEditSnapshot, isTieringCheckAnswersEdit, withFromCheckAnswers } from './tiering-change-scroll.js'
import { getA1FieldsFromForm } from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import {
  applyOffenceViolentTag,
  clearOffenceViolentTag,
  formatOffenceCodeLabel,
  lookupOffenceIsViolent
} from './tiering-offence-browse.js'
import {
  buildOffenceSearchIndex,
  filterOffenceBrowseGroupsByCategory,
  OFFENCE_BROWSE_SORT_CATEGORIES,
  offenceMatchesSearchQuery
} from './offences-data.js'
import { trackTelemetryOffenceSearch } from './tiering-session-telemetry.js'

const offenceSearchFormatMeta = (item) => {
  if (item.type === 'category') return ''
  if (item.type === 'parent' && item.subOffenceCount > 1) {
    return `(${item.subOffenceCount} offences)`
  }
  if (item.code && item.subcode) {
    return `${item.code} / ${item.subcode}`
  }
  if (item.fullCode) {
    return item.fullCode
  }
  if (item.code) {
    return item.code
  }
  return ''
}

const OFFENCE_SEARCH_RESULTS_LIMIT = 30
const OFFENCE_SEARCH_SECTION_RESULTS_LIMIT = 30

const offenceSearchFormatStatus = (displayedCount, browseParent, totalCount = displayedCount) => {
  if (browseParent) {
    const total = browseParent.subOffences.length
    const offenceWord = total === 1 ? 'offence' : 'offences'

    if (displayedCount === 0) {
      return `${browseParent.label} (no matching ${offenceWord})`
    }

    if (totalCount > displayedCount) {
      return `${browseParent.label} (showing ${displayedCount} of ${totalCount} matching ${offenceWord})`
    }

    return `${browseParent.label} (${totalCount} matching ${offenceWord})`
  }

  if (displayedCount === 0) return 'No results found'
  if (totalCount === 1) return '1 result found'
  if (totalCount > displayedCount) {
    return `Showing ${displayedCount} of ${totalCount} results found`
  }
  return `${totalCount} results found`
}

const offenceSearchMapSubOptions = (parent, subOffences) =>
  subOffences.map((sub) => ({
    type: 'sub',
    id: sub.id,
    label: sub.label,
    code: sub.code,
    subcode: sub.subcode,
    fullCode: sub.fullCode,
    category: parent.category,
    parentId: parent.id,
    parentLabel: parent.label,
    isViolentOffence: Boolean(sub.isViolentOffence),
    searchTerms: [sub.label, sub.code, sub.subcode, sub.fullCode]
  }))

const buildOffenceCategorySearchIndex = () => ({
  parents: OFFENCE_BROWSE_SORT_CATEGORIES.map((category) => ({
    type: 'category',
    id: category,
    label: category,
    searchTerms: [category]
  })),
  subs: [],
  all: []
})

window.initOffenceSearch = async (container, options = {}) => {
  if (!container) return

  const scope = options.scope || container.dataset.offenceSearchScope || 'default'
  const isCategoryScope = scope === 'category'
  const isCategoryOffencesScope = scope === 'category-offences'
  const getCategoryFilter = () =>
    options.categoryFilter || container.dataset.offenceSearchCategory || ''
  const getSearchResultsUrlOverride = options.getSearchResultsUrl

  if (container.dataset.offenceSearchReady === 'true') {
    return {
      getPendingSelection: () => container._pendingCheckSelection ?? null,
      setCategoryFilter: options.setCategoryFilter
    }
  }

  if (container.dataset.offenceSearchInitializing === 'true') {
    await new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (container.dataset.offenceSearchReady === 'true') {
          observer.disconnect()
          resolve()
        }
      })
      observer.observe(container, {
        attributes: true,
        attributeFilter: ['data-offence-search-ready']
      })
    })
    return {
      getPendingSelection: () => container._pendingCheckSelection ?? null,
      setCategoryFilter: options.setCategoryFilter
    }
  }

  container.dataset.offenceSearchInitializing = 'true'

  // Empty data-offence-search-check="" is falsy via dataset; use hasAttribute instead
  const isCheckMode = container.hasAttribute('data-offence-search-check')
  const requiresSelectedPanel = !isCheckMode && !isCategoryScope
  const input = container.querySelector('[data-offence-search-input]')
  const listbox = container.querySelector('[data-offence-search-listbox]')
  const searchPanel = container.querySelector('[data-offence-search-panel]')
  const selectedPanel = container.querySelector('[data-offence-search-selected]')
  const selectedLabel = container.querySelector('[data-offence-selected-label]')
  const selectedMeta = container.querySelector('[data-offence-selected-meta]')
  const violentTag = container.querySelector('[data-offence-violent-tag]')
  const hiddenInput = container.querySelector('[data-offence-selected-id]')
  const hiddenCodeInput = container.querySelector('[data-offence-selected-code]')
  const hiddenSubcodeInput = container.querySelector('[data-offence-selected-subcode]')
  const changeLink = container.querySelector('[data-offence-change]')

  if (!input || !listbox || !searchPanel) {
    delete container.dataset.offenceSearchInitializing
    return
  }

  if (requiresSelectedPanel && !selectedPanel) {
    delete container.dataset.offenceSearchInitializing
    return
  }

  let pendingCheckSelection = null

  let index = { parents: [], subs: [], all: [] }
  let activeIndex = -1
  let browseParent = null
  let dataReady = false

  try {
    if (isCategoryScope) {
      index = buildOffenceCategorySearchIndex()
      dataReady = true
      container.dataset.offenceSearchReady = 'true'
    } else {
      const response = await fetch('/api/offences')
      if (!response.ok) throw new Error('Failed to load offences')
      let offences = await response.json()
      const categoryFilter = getCategoryFilter()

      if (isCategoryOffencesScope && categoryFilter) {
        offences = filterOffenceBrowseGroupsByCategory(offences, categoryFilter)
      }

      index = buildOffenceSearchIndex(offences)
      if (!isCategoryOffencesScope) {
        window.OFFENCE_SEARCH_DATA = offences
      }
      dataReady = true
      container.dataset.offenceSearchReady = 'true'
    }
  } catch (error) {
    listbox.innerHTML =
      '<li class="offence-autocomplete__results-status" role="presentation">Offence list could not be loaded</li>'
    listbox.hidden = false
    input.setAttribute('aria-expanded', 'true')
    container.dataset.offenceSearchReady = 'true'
    delete container.dataset.offenceSearchInitializing
    return
  }

  const setExpanded = (expanded) => {
    input.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    listbox.hidden = !expanded
  }

  const resizeSearchInput = () => {
    input.style.height = 'auto'
    input.style.height = `${Math.max(40, input.scrollHeight)}px`
  }

  const clearListbox = () => {
    listbox.innerHTML = ''
    activeIndex = -1
    input.removeAttribute('aria-activedescendant')
  }

  const searchHintId = () =>
    (input.getAttribute('aria-describedby') || 'current-offence-search-hint')
      .split(/\s+/)[0]
      .trim() || 'current-offence-search-hint'

  const renderStatus = (displayedCount, totalCount = displayedCount) => {
    const status = document.createElement('li')
    status.id = `${listbox.id}-results-status`
    status.className = 'offence-autocomplete__results-status'
    status.setAttribute('role', 'presentation')
    let statusText = offenceSearchFormatStatus(displayedCount, browseParent, totalCount)

    if (isCategoryScope && !input.value.trim() && totalCount > 0) {
      statusText = totalCount === 1 ? '1 category' : `${totalCount} categories`
    }

    status.textContent = statusText
    listbox.appendChild(status)
    input.setAttribute(
      'aria-describedby',
      `${searchHintId()} ${listbox.id}-results-status`
    )
    return status
  }

  const getSearchResultsUrl = (query) => {
    const trimmed = query.trim()
    if (!trimmed) return null

    if (getSearchResultsUrlOverride) {
      return getSearchResultsUrlOverride(trimmed)
    }

    if (isCategoryOffencesScope) {
      const category = getCategoryFilter()
      if (!category) return null

      const params = new URLSearchParams({
        q: trimmed,
        category
      })
      return withFromCheckAnswers(`a1o3?${params.toString()}`)
    }

    const params = new URLSearchParams({ q: trimmed })
    if (isCheckMode) params.set('context', 'violent-offence-check')
    // Use clean URL (a1os not a1os.html) – Prototype Kit strips query params on .html redirects
    return withFromCheckAnswers(`a1os?${params.toString()}`)
  }

  const renderOptions = (options, totalCount = options.length) => {
    clearListbox()
    renderStatus(options.length, totalCount)

    if (browseParent) {
      const back = document.createElement('li')
      back.setAttribute('role', 'option')
      back.id = `${listbox.id}-option-back`
      back.className = 'offence-autocomplete__option offence-autocomplete__option--back'
      back.dataset.optionType = 'back'
      back.innerHTML = `
        <span class="offence-autocomplete__option-label">
          <svg class="offence-autocomplete__back-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
          Back to all results
        </span>
      `
      listbox.appendChild(back)
    }

    options.forEach((option, optionIndex) => {
      const li = document.createElement('li')
      const optionId = `${listbox.id}-option-${optionIndex}`
      li.id = optionId
      li.setAttribute('role', 'option')
      li.className = 'offence-autocomplete__option'
      li.dataset.optionType = option.type
      li.dataset.optionId = option.id

      const meta = offenceSearchFormatMeta(option)
      const categoryHint =
        option.type === 'sub' && option.parentLabel && !browseParent
          ? `<span class="offence-autocomplete__option-category">${option.parentLabel}</span>`
          : option.category && !browseParent
            ? `<span class="offence-autocomplete__option-category">${option.category}</span>`
            : ''

      li.innerHTML = `
        <span class="offence-autocomplete__option-label">${option.label}</span>
        ${meta ? `<span class="offence-autocomplete__option-meta">${meta}</span>` : ''}
        ${categoryHint}
      `

      listbox.appendChild(li)
    })

    const query = input.value.trim()
    const hasMoreResults = !isCategoryScope && totalCount > options.length && query

    if (hasMoreResults) {
      const viewAll = document.createElement('li')
      viewAll.setAttribute('role', 'option')
      viewAll.id = `${listbox.id}-option-view-all`
      viewAll.className = 'offence-autocomplete__option offence-autocomplete__option--view-all'
      viewAll.dataset.optionType = 'view-all'
      viewAll.innerHTML = `
        <span class="offence-autocomplete__option-label offence-autocomplete__view-all-label">View all results (${totalCount})</span>
      `
      listbox.appendChild(viewAll)
    }

    const showMenu = browseParent || options.length > 0
    setExpanded(showMenu)

    if (browseParent) {
      listbox.scrollTop = 0
      syncStickyHeaderOffsets()
    }
  }

  const syncStickyHeaderOffsets = () => {
    const statusEl = listbox.querySelector('.offence-autocomplete__results-status')
    const backEl = listbox.querySelector('.offence-autocomplete__option--back')

    if (backEl && statusEl) {
      backEl.style.top = `${statusEl.offsetHeight}px`
    }
  }

  const getSubOffenceOptions = (parent, filterQuery = null) => {
    const subOptions = offenceSearchMapSubOptions(parent, parent.subOffences)

    if (!filterQuery || !filterQuery.trim()) {
      return subOptions
    }

    return subOptions.filter((item) => offenceMatchesSearchQuery(item, filterQuery))
  }

  const getCategoryMatchResults = (query) => {
    const q = query.trim()
    const allCategories = index.parents

    if (!q) {
      return {
        items: allCategories.slice(0, OFFENCE_SEARCH_RESULTS_LIMIT),
        totalCount: allCategories.length
      }
    }

    const categoryMatches = allCategories.filter((item) => offenceMatchesSearchQuery(item, q))
    return {
      items: categoryMatches.slice(0, OFFENCE_SEARCH_RESULTS_LIMIT),
      totalCount: categoryMatches.length
    }
  }

  const getMatchResults = (query) => {
    const q = query.trim()
    if (!q && !isCategoryScope) return { items: [], totalCount: 0 }

    if (isCategoryScope) {
      return getCategoryMatchResults(query)
    }

    const parentMatches = index.parents.filter((item) => offenceMatchesSearchQuery(item, q))
    const subMatches = index.subs.filter((item) => offenceMatchesSearchQuery(item, q))
    const allMatches = [...parentMatches, ...subMatches]

    return {
      items: allMatches.slice(0, OFFENCE_SEARCH_RESULTS_LIMIT),
      totalCount: allMatches.length
    }
  }

  const renderQueryMatches = (query) => {
    const { items, totalCount } = getMatchResults(query)
    renderOptions(items, totalCount)
  }

  const showSubOffenceList = (parent, filterQuery = null) => {
    browseParent = parent
    const subOptions = getSubOffenceOptions(parent, filterQuery)
    renderOptions(
      subOptions.slice(0, OFFENCE_SEARCH_SECTION_RESULTS_LIMIT),
      subOptions.length
    )
  }

  const persistA1ConvictionDateState = () => {
    if (!document.getElementById('tiering-a1-form')) return
    persistConvictionDateState({ editing: isConvictionDateEditPanelOpen() })
  }

  const showSearch = ({ focusInput = true } = {}) => {
    const hadCategorySelection = isCategoryScope && selectedPanel && !selectedPanel.hidden
    const hadOffenceSelection =
      isCategoryOffencesScope && selectedPanel && !selectedPanel.hidden

    persistA1ConvictionDateState()
    searchPanel.hidden = false
    if (selectedPanel) selectedPanel.hidden = true
    input.value = ''
    browseParent = null
    clearListbox()
    setExpanded(false)

    if (hadCategorySelection) {
      options.onCategoryCleared?.()
    }

    if (hadOffenceSelection) {
      options.onOffenceCleared?.()
    }
    if (hiddenInput) hiddenInput.value = ''
    if (hiddenCodeInput) hiddenCodeInput.value = ''
    if (hiddenSubcodeInput) hiddenSubcodeInput.value = ''
    clearOffenceViolentTag(violentTag)
    input.setAttribute('aria-describedby', searchHintId())
    resizeSearchInput()
    if (focusInput) {
      input.focus()
    } else if (document.activeElement === input) {
      input.blur()
    }
  }

  const offenceSelectionFromOption = (option) => ({
    id: option.id,
    label: option.label,
    code: option.code || '',
    subcode: option.subcode || '',
    fullCode: option.fullCode || '',
    isViolentOffence: Boolean(option.isViolentOffence)
  })

  const storeCheckSelection = (selection) => {
    pendingCheckSelection = selection
    container._pendingCheckSelection = selection
    input.value = selection.label
    resizeSearchInput()
    browseParent = null
    clearListbox()
    setExpanded(false)
    container.dispatchEvent(
      new CustomEvent('offence-search:selected', {
        bubbles: true,
        detail: selection
      })
    )
  }

  const showSelected = (selection) => {
    if (isCategoryScope) {
      if (selectedPanel) {
        searchPanel.hidden = true
        selectedPanel.hidden = false
        if (selectedLabel) selectedLabel.textContent = selection.label
        if (selectedMeta) selectedMeta.hidden = true
      }
      input.value = selection.label
      resizeSearchInput()
      browseParent = null
      clearListbox()
      setExpanded(false)
      options.onCategorySelected?.(selection.label)
      container.dispatchEvent(
        new CustomEvent('offence-search:category-selected', {
          bubbles: true,
          detail: { category: selection.label }
        })
      )
      return
    }

    if (isCheckMode || !selectedPanel) {
      storeCheckSelection(selection)
      return
    }

    persistA1ConvictionDateState()
    searchPanel.hidden = true
    selectedPanel.hidden = false
    if (selectedLabel) selectedLabel.textContent = selection.label
    if (selectedMeta) {
      const codeLabel = formatOffenceCodeLabel(selection)
      selectedMeta.textContent = codeLabel
      selectedMeta.hidden = !codeLabel
    }
    if (hiddenInput) hiddenInput.value = selection.id
    if (hiddenCodeInput) hiddenCodeInput.value = selection.code || ''
    if (hiddenSubcodeInput) hiddenSubcodeInput.value = selection.subcode || ''
    const isViolent =
      selection.isViolentOffence === true ||
      lookupOffenceIsViolent(selection.id)
    applyOffenceViolentTag(violentTag, isViolent)
    browseParent = null
    clearListbox()
    setExpanded(false)
    input.setAttribute('aria-describedby', searchHintId())

    if (!isCategoryOffencesScope) {
      trackTelemetryOffenceSearch({
        action: 'select',
        query: {
          id: selection.id,
          label: selection.label,
          code: selection.code || '',
          source: 'search'
        }
      })
    }

    if (isCategoryOffencesScope) {
      options.onOffenceSelected?.(selection)
    }

    container.dispatchEvent(
      new CustomEvent('offence-search:selected', {
        bubbles: true,
        detail: selection
      })
    )
  }

  const selectOption = (option) => {
    if (option?.type === 'category') {
      showSelected({ id: option.id, label: option.label })
      return
    }

    if (!option || option.type === 'back') {
      browseParent = null
      renderQueryMatches(input.value)
      return
    }

    const hasSubOffences =
      option.type === 'parent' && option.subOffenceCount && option.subOffenceCount > 1

    if (hasSubOffences) {
      showSubOffenceList(option)
      return
    }

    showSelected(offenceSelectionFromOption(option))
  }

  const getSelectableOptions = () => listbox.querySelectorAll('[role="option"]')

  const highlightOption = (direction) => {
    const items = getSelectableOptions()
    if (!items.length) return

    let newIndex = activeIndex

    if (activeIndex < 0 && direction > 0) {
      newIndex = 0
    } else if (activeIndex >= 0) {
      newIndex = activeIndex + direction
      if (newIndex < 0) newIndex = 0
      if (newIndex >= items.length) newIndex = items.length - 1
    }

    if (newIndex === activeIndex) return

    activeIndex = newIndex
    const activeItem = items[activeIndex]
    items.forEach((item, i) => {
      item.classList.toggle('offence-autocomplete__option--focused', i === activeIndex)
    })
    input.setAttribute('aria-activedescendant', activeItem.id)
    activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  const navigateToSearchResults = () => {
    const url = getSearchResultsUrl(input.value)
    if (!url) return
    window.location.assign(url)
  }

  const activateHighlighted = () => {
    if (activeIndex < 0) return
    const optionEl = getSelectableOptions()[activeIndex]
    if (!optionEl) return

    if (optionEl.dataset.optionType === 'back') {
      selectOption({ type: 'back' })
      return
    }

    if (optionEl.dataset.optionType === 'view-all') {
      navigateToSearchResults()
      return
    }

    const optionId = optionEl.dataset.optionId

    if (browseParent) {
      const sub = browseParent.subOffences.find((item) => item.id === optionId)
      if (sub) {
        selectOption(
          offenceSelectionFromOption({
            type: 'sub',
            ...sub,
            isViolentOffence: sub.isViolentOffence
          })
        )
      }
      return
    }

    const parent = index.parents.find((item) => item.id === optionId)
    if (parent) {
      selectOption(parent)
      return
    }

    const sub = index.subs.find((item) => item.id === optionId)
    if (sub) selectOption(sub)
  }

  let searchTrackTimeout
  let lastLoggedSearchQuery = ''

  input.addEventListener('input', () => {
    resizeSearchInput()

    if (!dataReady) return

    const query = input.value.trim()

    if (!query) {
      lastLoggedSearchQuery = ''
    } else {
      clearTimeout(searchTrackTimeout)
      searchTrackTimeout = setTimeout(() => {
        const currentQuery = input.value.trim()
        if (!currentQuery || currentQuery === lastLoggedSearchQuery) return

        lastLoggedSearchQuery = currentQuery
        const resultCount = browseParent
          ? getSubOffenceOptions(browseParent, currentQuery).length
          : getMatchResults(currentQuery).totalCount

        trackTelemetryOffenceSearch({
          query: currentQuery,
          resultCount,
          action: 'search'
        })
      }, 700)
    }

    if (browseParent) {
      showSubOffenceList(browseParent, input.value)
      return
    }

    renderQueryMatches(input.value)
  })

  input.addEventListener('keydown', (event) => {
    const items = getSelectableOptions()

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (listbox.hidden && (input.value.trim() || isCategoryScope)) {
        if (browseParent) {
          showSubOffenceList(browseParent, input.value)
        } else {
          renderQueryMatches(input.value)
        }
      }
      if (!listbox.hidden && items.length) highlightOption(1)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!listbox.hidden && items.length) highlightOption(-1)
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      if (!listbox.hidden && activeIndex >= 0) {
        event.preventDefault()
        event.stopPropagation()
        activateHighlighted()
      } else if (!listbox.hidden) {
        event.preventDefault()
      }
    }

    if (event.key === 'Escape') {
      if (browseParent) {
        browseParent = null
        renderQueryMatches(input.value)
        return
      }
      clearListbox()
      setExpanded(false)
      input.setAttribute('aria-describedby', searchHintId())
    }
  })

  input.addEventListener('focus', () => {
    if (!dataReady) return
    if (!input.value.trim() && !isCategoryScope) return

    if (browseParent) {
      showSubOffenceList(browseParent, input.value)
      return
    }

    renderQueryMatches(input.value)
  })

  document.addEventListener('click', (event) => {
    const clickedInside = event.composedPath().includes(container)
    if (!clickedInside) {
      setExpanded(false)
    }
  })

  // Keep focus on the input and stop the outside-click handler closing the menu
  // before the option click is handled (the option node is removed during render).
  listbox.addEventListener('mousedown', (event) => {
    const optionEl = event.target.closest('[role="option"]')
    if (optionEl?.dataset.optionType === 'view-all') {
      event.preventDefault()
      navigateToSearchResults()
      return
    }
    event.preventDefault()
  })

  listbox.addEventListener('click', (event) => {
    event.stopPropagation()

    const optionEl = event.target.closest('[role="option"]')
    if (!optionEl) return

    if (optionEl.dataset.optionType === 'back') {
      selectOption({ type: 'back' })
      return
    }

    if (optionEl.dataset.optionType === 'view-all') {
      navigateToSearchResults()
      return
    }

    const optionId = optionEl.dataset.optionId

    if (browseParent) {
      const sub = browseParent.subOffences.find((item) => item.id === optionId)
      if (sub) {
        selectOption(
          offenceSelectionFromOption({
            type: 'sub',
            ...sub,
            isViolentOffence: sub.isViolentOffence
          })
        )
      }
      return
    }

    const parent = index.parents.find((item) => item.id === optionId)
    if (parent) {
      selectOption(parent)
      return
    }

    const sub = index.subs.find((item) => item.id === optionId)
    if (sub) selectOption(sub)
  })

  if (changeLink) {
    changeLink.addEventListener('click', (event) => {
      event.preventDefault()
      if (isCategoryScope) {
        options.onCategoryCleared?.()
      }
      showSearch()
    })
  }

  const setCategoryFilter = async (category) => {
    if (!isCategoryOffencesScope) return

    container.dataset.offenceSearchCategory = category || ''

    if (!category) return

    try {
      const response = await fetch('/api/offences')
      if (!response.ok) throw new Error('Failed to load offences')
      const offences = await response.json()
      const filtered = filterOffenceBrowseGroupsByCategory(offences, category)
      index = buildOffenceSearchIndex(filtered)
    } catch (error) {
      console.error('Failed to load category offences:', error)
    }
  }

  if (dataReady && !isCheckMode && !isCategoryScope && !isCategoryOffencesScope) {
    const focusSearchRequested =
      new URLSearchParams(window.location.search).get('focus') === 'offence-search'

    if (focusSearchRequested) {
      showSearch()
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      requestAnimationFrame(() => input.focus())
    } else {
      const session = getTieringAssessmentSession()

      if (session.currentOffence) {
        showSelected(session.currentOffence)
      }
    }

    if (isTieringCheckAnswersEdit()) {
      const a1Form = document.getElementById('tiering-a1-form')
      if (a1Form) captureCheckAnswersEditSnapshot(getA1FieldsFromForm(a1Form))
    }
  }

  delete container.dataset.offenceSearchInitializing

  resizeSearchInput()

  return {
    getPendingSelection: () => pendingCheckSelection,
    resizeSearchInput,
    setCategoryFilter,
    showSearch,
    showSelected
  }
}

window.GOVUKPrototypeKit.documentReady(() => {
  document
    .querySelectorAll(
      '[data-module="offence-search"]:not([data-offence-search-check]):not([data-offence-search-manual])'
    )
    .forEach((container) => {
      window.initOffenceSearch(container)
    })
})
