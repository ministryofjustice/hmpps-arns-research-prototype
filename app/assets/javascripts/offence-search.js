//
// Offence autocomplete – prototype search for Tiering assessment
// Data: /api/offences (app/data/offences.json)
//

import {
  isConvictionDateEditPanelOpen,
  persistConvictionDateState
} from './conviction-date.js'
import {
  captureCheckAnswersEditSnapshot,
  formatDateFromParts,
  getA1FieldsFromForm,
  getA1FormElement,
  getDefaultConvictionDateParts,
  getPrototypeDefaultCurrentOffence,
  getTieringAssessmentSession,
  isDateComplete,
  isTieringCheckAnswersEdit,
  normaliseDateParts,
  setTieringAssessmentSession,
  trackTelemetryOffenceSearch
} from './tiering-page-apis.js'
import {
  formatOffenceCode,
  formatOffenceCodeLabel,
  formatOffenceLabelWithCodes,
  lookupOffenceDetails,
  lookupOffenceIsViolent,
  populateOffenceSummaryCard,
  populateOffenceSummaryList
} from './tiering-offence-browse.js'
import { initA1OffenceDisplayToggle, refreshA1OffenceDisplay } from './tiering-a1-display-toggle.js'

const offenceSearchMatches = (item, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return false

  const haystack = [
    item.label,
    item.code,
    item.subcode,
    item.fullCode,
    item.category,
    item.code && item.subcode ? `${item.code} ${item.subcode}` : '',
    item.code && item.subcode ? `${item.code}${item.subcode}` : '',
    ...(item.searchTerms || [])
  ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

  return haystack.includes(q)
}

const offenceSearchFormatViolentTag = (option) => {
  if (option.type !== 'sub') return ''

  const isViolent =
    option.isViolentOffence === true || lookupOffenceIsViolent(option.id)
  const tagClass = isViolent ? 'govuk-tag--red' : 'govuk-tag--grey'
  const label = isViolent ? 'Violent' : 'Not violent'

  return `<strong class="govuk-tag offence-autocomplete__option-tag ${tagClass}">${label}</strong>`
}

const offenceSearchFormatOptionMeta = (option, showViolentTags) => {
  const meta = offenceSearchFormatMeta(option)
  if (!meta) return ''

  if (!showViolentTags) {
    return `<span class="offence-autocomplete__option-meta">${meta}</span>`
  }

  return `
    <span class="offence-autocomplete__option-aside">
      <span class="offence-autocomplete__option-code">${meta}</span>
      ${offenceSearchFormatViolentTag(option)}
    </span>
  `
}

const offenceSearchFormatMeta = (item) => {
  if (item.type === 'parent' && item.subOffenceCount > 1) {
    return `(${item.subOffenceCount} offences)`
  }
  if (item.code && item.subcode) {
    return formatOffenceCode(item)
  }
  if (item.fullCode) {
    return formatOffenceCode(item)
  }
  if (item.code) {
    return formatOffenceCode(item)
  }
  return ''
}

const offenceSearchFormatStatus = (count, browseParent) => {
  if (browseParent) {
    const total = browseParent.subOffences.length
    const offenceWord = total === 1 ? 'offence' : 'offences'

    if (count === 0) {
      return `${browseParent.label} (no matching ${offenceWord})`
    }


    return `${browseParent.label} (${total} ${offenceWord})`
  }

  if (count === 0) return 'No results found'
  if (count === 1) return '1 result found'
  return `${count} results found`
}

const offenceSearchBuildIndex = (offences) => {
  // parent
  const parents = offences.map((offence) => ({
    type: 'parent',
    id: offence.id,
    label: offence.label,
    code: offence.code,
    subcode: '00',
    fullCode: `${offence.code}00`,
    category: offence.category,
    subOffenceCount: offence.subOffenceCount || 0,
    subOffences: offence.subOffences || [],
    searchTerms: offence.searchTerms || []
  }))

  const subs = offences.flatMap((offence) =>
      (offence.subOffences || []).map((sub) => ({
        type: 'sub',
        id: sub.id,
        label: sub.label,
        code: sub.code,
        subcode: sub.subcode,
        fullCode: sub.fullCode,
        category: offence.category,
        parentId: offence.id,
        parentLabel: offence.label,
        isViolentOffence: Boolean(sub.isViolentOffence),
        searchTerms: [
          sub.label,
          sub.code,
          sub.subcode,
          sub.fullCode,
          offence.label,
          offence.code,
          ...(sub.searchTerms || []),
          ...(offence.searchTerms || [])
        ]
      }))
  )

  return { parents, subs, all: [...parents, ...subs] }
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

window.initOffenceSearchV2 = async (container) => {
  if (
    container.id === 'current-offence-search' &&
    getA1FormElement() &&
    document.querySelector('[data-offence-display-toggle]')
  ) {
    initA1OffenceDisplayToggle()
  }
  if (!container) return null
  if (container._offenceSearchHandle) return container._offenceSearchHandle

  const isCheckMode = Boolean(container.dataset.offenceSearchCheck)
  const useSummaryCard = container.dataset.offenceSearchSummaryCard === 'true'
  const showViolentTags = Boolean(container.dataset.offenceSearchSuggestViolentTags)
  const resultsUrl = container.dataset.offenceSearchResultsUrl || ''
  const resultsContext = container.dataset.offenceSearchResultsContext || ''
  const staticDescribedBy = container.dataset.offenceSearchDescribedby || ''
  const input = container.querySelector('[data-offence-search-input]')
  const listbox = container.querySelector('[data-offence-search-listbox]')
  const searchPanel = container.querySelector('[data-offence-search-panel]')
  const selectedPanel = container.querySelector('[data-offence-search-selected]')
  const selectedLabel = container.querySelector('[data-offence-selected-label]')
  const selectedMeta = container.querySelector('[data-offence-selected-meta]')
  const hiddenInput = container.querySelector('[data-offence-selected-id]')
  const hiddenCodeInput = container.querySelector('[data-offence-selected-code]')
  const hiddenSubcodeInput = container.querySelector('[data-offence-selected-subcode]')
  const changeLink = container.querySelector('[data-offence-change]')

  if (!input || !listbox || !searchPanel) return null
  if (!isCheckMode && !selectedPanel) return null

  if (showViolentTags) {
    listbox.classList.add('offence-autocomplete__menu--with-violent-tags')
  }

  const resizeSearchInput = () => {
    input.style.height = 'auto'
    input.style.height = `${Math.max(40, input.scrollHeight)}px`
  }

  let pendingCheckSelection = null

  let index = { parents: [], subs: [], all: [] }
  let activeIndex = -1
  let browseParent = null
  let dataReady = false

  try {
    const response = await fetch('/api/offences')
    if (!response.ok) throw new Error('Failed to load offences')
    const offences = await response.json()
    index = offenceSearchBuildIndex(offences)
    window.OFFENCE_SEARCH_DATA = offences
    dataReady = true
    container.dataset.offenceSearchReady = 'true'
  } catch (error) {
    listbox.innerHTML =
        '<li class="offence-autocomplete__results-status" role="presentation">Offence list could not be loaded</li>'
    listbox.hidden = false
    input.setAttribute('aria-expanded', 'true')
    return
  }

  const setExpanded = (expanded) => {
    input.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    listbox.hidden = !expanded
  }

  const setInputDescribedBy = (...dynamicIds) => {
    const ids = [staticDescribedBy, ...dynamicIds].filter(Boolean).join(' ').trim()
    if (ids) {
      input.setAttribute('aria-describedby', ids)
      return
    }

    input.removeAttribute('aria-describedby')
  }

  const clearListbox = () => {
    listbox.innerHTML = ''
    activeIndex = -1
    input.removeAttribute('aria-activedescendant')
  }

  const renderStatus = (count) => {
    const status = document.createElement('li')
    status.id = `${listbox.id}-results-status`
    status.className = 'offence-autocomplete__results-status'
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.setAttribute('aria-atomic', 'true')
    status.textContent = offenceSearchFormatStatus(count, browseParent)
    listbox.appendChild(status)
    setInputDescribedBy(status.id)
    return status
  }

  const renderOptions = (options) => {
    clearListbox()
    renderStatus(options.length)

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

      if (showViolentTags && meta) {
        li.classList.add('offence-autocomplete__option--with-violent-tag')
      }

      li.innerHTML = `
        <span class="offence-autocomplete__option-label">${option.label}</span>
        ${meta ? offenceSearchFormatOptionMeta(option, showViolentTags) : ''}
      `

      if (showViolentTags && option.type === 'sub' && meta) {
        const isViolent =
          option.isViolentOffence === true || lookupOffenceIsViolent(option.id)
        const typeLabel = isViolent ? 'Violent' : 'Not violent'
        li.setAttribute(
          'aria-label',
          `Offence: ${option.label}, code: ${meta}, type: ${typeLabel}`
        )
      }

      listbox.appendChild(li)
    })

    const showMenu = Boolean(input.value.trim()) || browseParent
    setExpanded(showMenu)
  }

  const getSubOffenceOptions = (parent, filterQuery = null) => {
    const subOptions = offenceSearchMapSubOptions(parent, parent.subOffences)

    if (!filterQuery || !filterQuery.trim()) {
      return subOptions
    }

    return subOptions.filter((item) => offenceSearchMatches(item, filterQuery))
  }

  const getMatches = (query) => {
    const q = query.trim()
    if (!q) return []
    // parent
    // const parentMatches = index.parents.filter((item) => offenceSearchMatches(item, q))
    const subMatches = index.subs.filter((item) => offenceSearchMatches(item, q))

    // return [...parentMatches, ...subMatches].slice(0, 15)
    return [...subMatches]
  }

  const showSubOffenceList = (parent, filterQuery = null) => {
    browseParent = parent
    const subOptions = getSubOffenceOptions(parent, filterQuery)
    renderOptions(subOptions)
  }

  const persistA1ConvictionDateState = () => {
    if (!getA1FormElement()) return
    persistConvictionDateState({ editing: isConvictionDateEditPanelOpen() })
  }

  const showSearch = () => {
    persistA1ConvictionDateState()
    if (searchPanel) searchPanel.hidden = false
    if (selectedPanel) selectedPanel.hidden = true
    input.value = ''
    browseParent = null
    clearListbox()
    setExpanded(false)
    resizeSearchInput()
    if (hiddenInput) hiddenInput.value = ''
    if (hiddenCodeInput) hiddenCodeInput.value = ''
    if (hiddenSubcodeInput) hiddenSubcodeInput.value = ''
    setInputDescribedBy()
    if (!isCheckMode && getA1FormElement()) {
      setTieringAssessmentSession({ currentOffence: null })
    }
    input.focus()
  }

  const storeCheckSelection = (selection) => {
    pendingCheckSelection = selection
    input.value = formatOffenceLabelWithCodes(selection)
    browseParent = null
    clearListbox()
    setExpanded(false)
    resizeSearchInput()
    container.dispatchEvent(
        new CustomEvent('offence-search:selected', {
          bubbles: true,
          detail: selection
        })
    )
  }

  const showSelected = (selection) => {
    if (isCheckMode || !selectedPanel) {
      storeCheckSelection(selection)
      return
    }

    persistA1ConvictionDateState()
    searchPanel.hidden = true
    selectedPanel.hidden = false
    if (useSummaryCard) {
      if (document.querySelector('[data-offence-display-toggle]')) {
        refreshA1OffenceDisplay(container, selection)
      } else if (container.dataset.offenceSearchSummaryListOnly === 'true') {
        const session = getTieringAssessmentSession()
        const stored = normaliseDateParts(session.convictionDate || {})
        const parts = isDateComplete(stored) ? stored : getDefaultConvictionDateParts()
        populateOffenceSummaryList(container, selection, formatDateFromParts(parts))
      } else {
        populateOffenceSummaryCard(container, selection)
      }
    } else {
      if (selectedLabel) selectedLabel.textContent = selection.label
      if (selectedMeta) {
        const codeLabel = formatOffenceCodeLabel(selection)
        selectedMeta.textContent = codeLabel
        selectedMeta.hidden = !codeLabel
      }
    }
    if (hiddenInput) hiddenInput.value = selection.id
    if (hiddenCodeInput) hiddenCodeInput.value = selection.code || ''
    if (hiddenSubcodeInput) hiddenSubcodeInput.value = selection.subcode || ''
    browseParent = null
    clearListbox()
    setExpanded(false)
    setInputDescribedBy()

    if (getA1FormElement()) {
      const details = lookupOffenceDetails(selection.id)
      setTieringAssessmentSession({
        currentOffence: {
          id: selection.id,
          label: details?.label || selection.label || '',
          code: selection.code || details?.code || '',
          subcode: selection.subcode || details?.subcode || '',
          fullCode: selection.fullCode || details?.fullCode || '',
          isViolentOffence: Boolean(selection.isViolentOffence ?? details?.isViolentOffence)
        }
      })
    }

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

  const offenceSelectionFromOption = (option) => ({
    id: option.id,
    label: option.label,
    code: option.code || '',
    subcode: option.subcode || '',
    fullCode: option.fullCode || '',
    isViolentOffence: Boolean(option.isViolentOffence)
  })

  const selectOption = (option) => {
    if (!option || option.type === 'back') {
      browseParent = null
      renderOptions(getMatches(input.value))
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

  const highlightOption = (newIndex) => {
    const items = getSelectableOptions()
    if (!items.length) return

    activeIndex = (newIndex + items.length) % items.length
    const activeItem = items[activeIndex]
    items.forEach((item, i) => {
      item.classList.toggle('offence-autocomplete__option--focused', i === activeIndex)
    })
    input.setAttribute('aria-activedescendant', activeItem.id)
    activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  const activateHighlighted = () => {
    if (activeIndex < 0) return
    const optionEl = getSelectableOptions()[activeIndex]
    if (!optionEl) return

    if (optionEl.dataset.optionType === 'back') {
      selectOption({ type: 'back' })
      return
    }

    const optionId = optionEl.dataset.optionId
    const optionType = optionEl.dataset.optionType

    if (browseParent) {
      const sub = browseParent.subOffences.find((item) => String(item.id) === optionId)
      if (sub) {
        selectOption({
          type: 'sub',
          id: sub.id,
          label: sub.label,
          code: sub.code,
          subcode: sub.subcode,
          fullCode: sub.fullCode
        })
      }
      return
    }

    if (optionType === 'parent') {
      const parent = index.parents.find((item) => String(item.id) === optionId)
      if (parent) selectOption(parent)
    } else if (optionType === 'sub') {
      const sub = index.subs.find((item) => String(item.id) === optionId)
      if (sub) selectOption(sub)
    }
  }

  // Free-text search: navigate to a results page when the user submits a typed
  // query without picking an option from the auto-suggest list.
  const submitFreeTextSearch = () => {
    if (!resultsUrl) return false

    // If the user has highlighted an auto-suggest option, treat as a selection.
    if (!listbox.hidden && activeIndex >= 0) {
      activateHighlighted()
      return true
    }

    const query = input.value.trim()
    if (!query) {
      input.focus()
      return true
    }

    const params = new URLSearchParams()
    params.set('q', query)
    if (resultsContext) params.set('context', resultsContext)
    window.location.href = `${resultsUrl}?${params.toString()}`
    return true
  }

  let searchTrackTimeout
  let lastLoggedSearchQuery = ''

  input.addEventListener('input', () => {
    if (!dataReady) return

    resizeSearchInput()

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
            : getMatches(currentQuery).length

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

    renderOptions(getMatches(input.value))
  })

  input.addEventListener('keydown', (event) => {
    const items = getSelectableOptions()

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (listbox.hidden && input.value.trim()) {
        if (browseParent) {
          showSubOffenceList(browseParent, input.value)
        } else {
          renderOptions(getMatches(input.value))
        }
      }
      if (!listbox.hidden && items.length) highlightOption(activeIndex + 1)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!listbox.hidden && items.length) highlightOption(activeIndex - 1)
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (!listbox.hidden && activeIndex >= 0) {
        activateHighlighted()
      } else if (submitFreeTextSearch()) {
        // Free-text search navigated away – prevent other Enter handlers
        // (e.g. the violent offence check inline handler) from also firing.
        event.stopImmediatePropagation()
      }
    }

    if (event.key === 'Escape') {
      if (browseParent) {
        browseParent = null
        renderOptions(getMatches(input.value))
        return
      }
      clearListbox()
      setExpanded(false)
      setInputDescribedBy()
    }
  })

  input.addEventListener('focus', () => {
    if (!dataReady || !input.value.trim()) return

    if (browseParent) {
      showSubOffenceList(browseParent, input.value)
      return
    }

    renderOptions(getMatches(input.value))
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

    const optionId = optionEl.dataset.optionId
    const optionType = optionEl.dataset.optionType

    if (browseParent) {
      const sub = browseParent.subOffences.find((item) => String(item.id) === optionId)
      if (sub) {
        selectOption({
          type: 'sub',
          id: sub.id,
          label: sub.label,
          code: sub.code,
          subcode: sub.subcode,
          fullCode: sub.fullCode
        })
      }
      return
    }

    if (optionType === 'parent') {
      const parent = index.parents.find((item) => String(item.id) === optionId)
      if (parent) selectOption(parent)
    } else if (optionType === 'sub') {
      const sub = index.subs.find((item) => String(item.id) === optionId)
      if (sub) selectOption(sub)
    }
  })

  if (changeLink) {
    changeLink.addEventListener('click', (event) => {
      event.preventDefault()
      showSearch()
    })
  }

  const searchSubmit = container.querySelector('[data-offence-search-submit]')
  if (searchSubmit) {
    searchSubmit.addEventListener('click', (event) => {
      // Progressive enhancement: submit buttons use a GET form when JS is off.
      event.preventDefault()
      if (!dataReady) return

      if (submitFreeTextSearch()) return

      // No results page configured: fall back to opening the dropdown.
      input.focus()
      if (!input.value.trim()) return
      if (browseParent) {
        showSubOffenceList(browseParent, input.value)
      } else {
        renderOptions(getMatches(input.value))
      }
    })
  }

  const returnedParams = new URLSearchParams(window.location.search)
  if (returnedParams.get('returned_offence_id')) {
    const session = getTieringAssessmentSession()
    session.currentOffence = {
      id: returnedParams.get('returned_offence_id'),
      label: returnedParams.get('returned_offence_label'),
      code: returnedParams.get('returned_offence_code'),
      subcode: returnedParams.get('returned_offence_subcode')
    }
  }

// Locate this block at the very bottom of window.initOffenceSearchV2:
  if (dataReady && !isCheckMode) {

    // 1. Intercept returned URL variables from the advanced list first
    const returnedParams = new URLSearchParams(window.location.search)

    if (returnedParams.get('restart_search') && getA1FormElement()) {
      // Arriving from "Start a new search": clear any selection and focus an
      // empty search box.
      showSearch()
    } else if (returnedParams.get('returned_offence_id')) {
      const urlOffencePayload = {
        id: returnedParams.get('returned_offence_id'),
        label: returnedParams.get('returned_offence_label'),
        code: returnedParams.get('returned_offence_code') || '',
        subcode: returnedParams.get('returned_offence_subcode') || '',
        fullCode: returnedParams.get('returned_offence_code') + (returnedParams.get('returned_offence_subcode') || '00')
      }

      // Sync to your prototype session object so refreshes maintain state
      const session = getTieringAssessmentSession()
      session.currentOffence = urlOffencePayload

      // Force-populate data-offence-search-selected layout elements instantly
      showSelected(urlOffencePayload)

    } else {
      // 2. Fallback to standard check if user simply loaded the page without a redirect
      const session = getTieringAssessmentSession()
      if (session.currentOffence) {
        showSelected(session.currentOffence)
      } else if (getA1FormElement()) {
        const defaultOffence = { ...getPrototypeDefaultCurrentOffence() }
        setTieringAssessmentSession({ currentOffence: defaultOffence })
        showSelected(defaultOffence)
      }
    }

    if (isTieringCheckAnswersEdit()) {
      const a1Form = getA1FormElement()
      if (a1Form) captureCheckAnswersEditSnapshot(getA1FieldsFromForm(a1Form))
    }
  }

  delete container.dataset.offenceSearchInitializing

  resizeSearchInput()

  const handle = {
    getPendingSelection: () => pendingCheckSelection,
    resizeSearchInput
  }
  container._offenceSearchHandle = handle
  return handle
}

window.initOffenceSearch = window.initOffenceSearchV2

window.GOVUKPrototypeKit.documentReady(() => {
  document
    .querySelectorAll('[data-module="offence-search"]:not([data-offence-search-check])')
    .forEach((container) => {
      window.initOffenceSearchV2(container)
    })
})