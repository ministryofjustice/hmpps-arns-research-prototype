//
// Offence autocomplete – prototype search for Tiering assessment
// Data: /api/offences (app/data/offences.json)
//

import { captureCheckAnswersEditSnapshot, isTieringCheckAnswersEdit } from './tiering-change-scroll.js'
import { getA1FieldsFromForm } from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { trackTelemetryOffenceSearch } from './tiering-session-telemetry.js'

const offenceSearchMatches = (item, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return false

  const haystack = [
    item.label,
    item.code,
    item.category,
    ...(item.searchTerms || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

const offenceSearchFormatMeta = (item) => {
  if (item.subOffenceCount && item.subOffenceCount > 0) {
    return `(${item.subOffenceCount} offences)`
  }
  if (item.code) {
    return item.code
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
  const parents = offences.map((offence) => ({
    type: 'parent',
    id: offence.id,
    label: offence.label,
    code: offence.code,
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
      category: offence.category,
      parentId: offence.id,
      parentLabel: offence.label,
      searchTerms: [sub.label, sub.code, offence.label, offence.code, ...(offence.searchTerms || [])]
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
    category: parent.category,
    parentId: parent.id,
    parentLabel: parent.label,
    searchTerms: [sub.label, sub.code]
  }))

window.initOffenceSearch = async (container) => {
  if (!container || container.dataset.offenceSearchReady === 'true') return

  const isCheckMode = Boolean(container.dataset.offenceSearchCheck)
  const input = container.querySelector('[data-offence-search-input]')
  const listbox = container.querySelector('[data-offence-search-listbox]')
  const searchPanel = container.querySelector('[data-offence-search-panel]')
  const selectedPanel = container.querySelector('[data-offence-search-selected]')
  const selectedLabel = container.querySelector('[data-offence-selected-label]')
  const selectedMeta = container.querySelector('[data-offence-selected-meta]')
  const hiddenInput = container.querySelector('[data-offence-selected-id]')
  const changeLink = container.querySelector('[data-offence-change]')

  if (!input || !listbox || !searchPanel) return
  if (!isCheckMode && !selectedPanel) return

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

  const clearListbox = () => {
    listbox.innerHTML = ''
    activeIndex = -1
    input.removeAttribute('aria-activedescendant')
  }

  const renderStatus = (count) => {
    const status = document.createElement('li')
    status.id = `${listbox.id}-results-status`
    status.className = 'offence-autocomplete__results-status'
    status.setAttribute('role', 'presentation')
    status.textContent = offenceSearchFormatStatus(count, browseParent)
    listbox.appendChild(status)
    input.setAttribute('aria-describedby', 'current-offence-search-hint current-offence-search-listbox-results-status')
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

    const parentMatches = index.parents.filter((item) => offenceSearchMatches(item, q))
    const subMatches = index.subs.filter((item) => offenceSearchMatches(item, q))

    return [...parentMatches, ...subMatches].slice(0, 15)
  }

  const showSubOffenceList = (parent, filterQuery = null) => {
    browseParent = parent
    const subOptions = getSubOffenceOptions(parent, filterQuery)
    renderOptions(subOptions)
  }

  const showSearch = () => {
    searchPanel.hidden = false
    selectedPanel.hidden = true
    input.value = ''
    browseParent = null
    clearListbox()
    setExpanded(false)
    if (hiddenInput) hiddenInput.value = ''
    input.setAttribute('aria-describedby', 'current-offence-search-hint')
    input.focus()
  }

  const storeCheckSelection = (selection) => {
    pendingCheckSelection = selection
    input.value = selection.label
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
    if (isCheckMode || !selectedPanel) {
      storeCheckSelection(selection)
      return
    }

    searchPanel.hidden = true
    selectedPanel.hidden = false
    if (selectedLabel) selectedLabel.textContent = selection.label
    if (selectedMeta) {
      selectedMeta.textContent = selection.code ? `Offence code: ${selection.code}` : ''
      selectedMeta.hidden = !selection.code
    }
    if (hiddenInput) hiddenInput.value = selection.id
    browseParent = null
    clearListbox()
    setExpanded(false)
    input.setAttribute('aria-describedby', 'current-offence-search-hint')

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

  const selectOption = (option) => {
    if (!option || option.type === 'back') {
      browseParent = null
      renderOptions(getMatches(input.value))
      return
    }

    const hasSubOffences = option.type === 'parent' && option.subOffences && option.subOffences.length > 0

    if (hasSubOffences) {
      showSubOffenceList(option)
      return
    }

    showSelected({
      id: option.id,
      label: option.label,
      code: option.code || ''
    })
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

    if (browseParent) {
      const sub = browseParent.subOffences.find((item) => item.id === optionId)
      if (sub) {
        selectOption({
          type: 'sub',
          id: sub.id,
          label: sub.label,
          code: sub.code
        })
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
      if (!listbox.hidden && activeIndex >= 0) {
        event.preventDefault()
        activateHighlighted()
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
      input.setAttribute('aria-describedby', 'current-offence-search-hint')
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

    if (browseParent) {
      const sub = browseParent.subOffences.find((item) => item.id === optionId)
      if (sub) {
        selectOption({
          type: 'sub',
          id: sub.id,
          label: sub.label,
          code: sub.code
        })
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
      showSearch()
    })
  }

  if (dataReady && !isCheckMode) {
    const session = getTieringAssessmentSession()

    if (session.currentOffence) {
      showSelected(session.currentOffence)
    }

    const convictionDate = session.convictionDate
    if (convictionDate) {
      const dayInput = document.getElementById('current-conviction-date-day')
      const monthInput = document.getElementById('current-conviction-date-month')
      const yearInput = document.getElementById('current-conviction-date-year')
      if (dayInput && convictionDate.day) dayInput.value = convictionDate.day
      if (monthInput && convictionDate.month) monthInput.value = convictionDate.month
      if (yearInput && convictionDate.year) yearInput.value = convictionDate.year
    }

    if (isTieringCheckAnswersEdit()) {
      const a1Form = document.getElementById('tiering-a1-form')
      if (a1Form) captureCheckAnswersEditSnapshot(getA1FieldsFromForm(a1Form))
    }
  }

  return { getPendingSelection: () => pendingCheckSelection }
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-module="offence-search"]').forEach((container) => {
    window.initOffenceSearch(container)
  })
})
