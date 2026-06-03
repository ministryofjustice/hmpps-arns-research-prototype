//
// a1o3 – category autocomplete, then category-scoped offence search
//

import {
  fetchOffenceBrowseGroups,
  filterOffenceBrowseGroupsByCategory,
  flattenOffenceSubOffences,
  getOffenceSearchMatches,
  OFFENCE_BROWSE_SORT_CATEGORIES
} from './offences-data.js'
import { withFromCheckAnswers } from './tiering-change-scroll.js'
import {
  initOffenceBrowseAccordion,
  initOffenceBrowseForm,
  initOffenceBrowsePagination,
  lookupOffenceIsViolent,
  paginateOffenceBrowseGroups,
  persistTieringCurrentOffenceAndReturn,
  renderOffenceAccordion,
  renderOffenceBrowsePagination
} from './tiering-offence-browse.js'

const formatSearchResultCount = (totalCount) => {
  if (totalCount === 0) return 'No results found'
  if (totalCount === 1) return '1 result found'
  return `${totalCount} results found`
}

const isValidCategory = (category) => OFFENCE_BROWSE_SORT_CATEGORIES.includes(category)

const readOffenceSelectionFromContainer = (offencesContainer) => {
  if (!offencesContainer) return null

  const selectedPanel = offencesContainer.querySelector('[data-offence-search-selected]')
  if (!selectedPanel || selectedPanel.hidden) return null

  const id = offencesContainer.querySelector('[data-offence-selected-id]')?.value?.trim()
  if (!id) return null

  const label = offencesContainer.querySelector('[data-offence-selected-label]')?.textContent?.trim() || ''
  const code = offencesContainer.querySelector('[data-offence-selected-code]')?.value?.trim() || ''
  const subcode = offencesContainer.querySelector('[data-offence-selected-subcode]')?.value?.trim() || ''
  const fullCode = code && subcode ? `${code}${subcode}` : code

  return {
    id,
    label,
    code,
    subcode,
    fullCode,
    isViolentOffence: lookupOffenceIsViolent(id)
  }
}

window.GOVUKPrototypeKit.documentReady(async () => {
  const form = document.getElementById('tiering-a1o3-form')
  if (!form) return

  const searchView = document.querySelector('[data-offence-a1o3-search-view]')
  const resultsView = document.querySelector('[data-offence-a1o3-results-view]')
  const categoryStep = document.querySelector('[data-offence-category-step]')
  const getCategoryDisplayButton = () =>
    document.querySelector('#offence-category-search .offence-autocomplete__category-select-display')
  const offencesStep = document.querySelector('[data-offence-offences-step]')
  const activeCategoryLabel = document.querySelector('[data-offence-active-category-label]')
  const offencesInCategoryHeading = document.querySelector('[data-offence-search-in-category-heading]')
  const submitActions = document.querySelector('[data-offence-search-submit-actions]')
  const accordionsRoot = document.querySelector('[data-offence-accordions]')
  const accordionsPlaceholder = document.querySelector('[data-offence-accordions-placeholder]')
  const paginationRoot = document.querySelector('[data-offence-pagination]')
  const queryEl = document.querySelector('[data-offence-search-query]')
  const categoryLabelEl = document.querySelector('[data-offence-search-category-label]')
  const countEl = document.querySelector('[data-offence-search-count]')
  const restartSearchLinks = document.querySelectorAll('[data-offence-restart-search]')
  const formHiddenInput = form.querySelector('[data-offence-selected-id]')

  const params = new URLSearchParams(window.location.search)
  const resultsQuery = params.get('q')?.trim() || ''
  const resultsCategory = params.get('category')?.trim() || ''
  const isResultsView = Boolean(resultsQuery && resultsCategory && isValidCategory(resultsCategory))

  const returnUrl = 'a1.html'
  const restartSearchUrl = withFromCheckAnswers('a1o3.html')
  let pendingSearchOffence = null

  const getSearchViewOffenceSelection = () => {
    if (pendingSearchOffence?.id) return pendingSearchOffence

    const offencesContainer = document.getElementById('offence-category-offences-search')
    const fromContainer = readOffenceSelectionFromContainer(offencesContainer)
    if (fromContainer) return fromContainer

    const id = formHiddenInput?.value?.trim()
    if (!id) return null

    return {
      id,
      label: '',
      code: '',
      subcode: '',
      fullCode: '',
      isViolentOffence: lookupOffenceIsViolent(id)
    }
  }

  const saveSearchSelectionAndReturn = () => {
    const offence = getSearchViewOffenceSelection()
    if (!offence) return false

    return persistTieringCurrentOffenceAndReturn({
      offence,
      returnUrl,
      telemetrySource: 'browse-c-search'
    })
  }

  document.querySelectorAll('[data-offence-search-save]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      saveSearchSelectionAndReturn()
    })
  })

  document.querySelectorAll('.assessment-layout .govuk-back-link').forEach((link) => {
    link.href = withFromCheckAnswers(returnUrl)
  })

  restartSearchLinks.forEach((link) => {
    link.href = restartSearchUrl
  })

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    telemetrySource: 'browse-c',
    browseContext: 'current-offence',
    returnUrl
  })

  if (!browse || !accordionsRoot || !paginationRoot) return

  let allGroups = []
  let activeCategory = ''
  let offenceSearchApi = null
  let categorySearchApi = null
  let offenceSearchListenerBound = false

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }

  const renderPage = (groups, page, { scrollToTop = false } = {}) => {
    const { items: pageGroups, currentPage, totalPages } = paginateOffenceBrowseGroups(groups, page)

    browse.clearSelection()
    accordionsRoot.innerHTML = renderOffenceAccordion(pageGroups, 'offence-browse-a1o3', {
      rememberExpanded: false
    })
    initOffenceBrowseAccordion(accordionsRoot.querySelector('.offence-browse-accordion'), {
      rememberExpanded: false
    })
    browse.bindSelectLinks(accordionsRoot)

    if (totalPages > 1) {
      paginationRoot.hidden = false
      paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
      initOffenceBrowsePagination(paginationRoot, (nextPage) =>
        renderPage(groups, nextPage, { scrollToTop: true })
      )
    } else {
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
    }

    if (scrollToTop) {
      scrollToPageTop()
    }
  }

  const showResultsView = () => {
    searchView.hidden = true
    resultsView.hidden = false
    accordionsPlaceholder?.remove()

    if (queryEl) queryEl.textContent = resultsQuery
    if (categoryLabelEl) categoryLabelEl.textContent = resultsCategory

    const categoryGroups = filterOffenceBrowseGroupsByCategory(allGroups, resultsCategory)
    const { totalCount, groups } = getOffenceSearchMatches(categoryGroups, resultsQuery)

    if (countEl) countEl.textContent = formatSearchResultCount(totalCount)

    if (!groups.length) {
      accordionsRoot.innerHTML = '<p class="govuk-body">No offences found.</p>'
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
      browse.registerOffences([])
      return
    }

    browse.registerOffences(flattenOffenceSubOffences(groups))
    renderPage(groups, 1)
  }

  const setSubmitActionsVisible = (visible) => {
    if (submitActions) submitActions.hidden = !visible
  }

  const setOffencesInCategoryHeadingVisible = (visible) => {
    if (offencesInCategoryHeading) offencesInCategoryHeading.hidden = !visible
  }

  const setCategoryDisplayEnabled = (enabled) => {
    const categoryDisplayButton = getCategoryDisplayButton()
    if (!categoryDisplayButton) return
    categoryDisplayButton.disabled = !enabled
    categoryDisplayButton.classList.toggle(
      'offence-autocomplete__category-select-display--inactive',
      !enabled
    )
  }

  const syncFormSelectionFromSearch = (selection) => {
    if (!selection?.id) {
      pendingSearchOffence = null
      if (formHiddenInput) formHiddenInput.value = ''
      setSubmitActionsVisible(false)
      setOffencesInCategoryHeadingVisible(true)
      setCategoryDisplayEnabled(true)
      return
    }

    const code = selection.code || ''
    const subcode = selection.subcode || ''
    pendingSearchOffence = {
      id: selection.id,
      label: selection.label || '',
      code,
      subcode,
      fullCode: selection.fullCode || (code && subcode ? `${code}${subcode}` : code),
      isViolentOffence:
        selection.isViolentOffence === true || lookupOffenceIsViolent(selection.id)
    }

    if (formHiddenInput) formHiddenInput.value = pendingSearchOffence.id
    setSubmitActionsVisible(true)
    setOffencesInCategoryHeadingVisible(false)
    setCategoryDisplayEnabled(false)
  }

  const bindOffenceSearchSelection = (offencesContainer) => {
    if (!offencesContainer || offenceSearchListenerBound) return
    offenceSearchListenerBound = true

    offencesContainer.addEventListener('offence-search:selected', (event) => {
      syncFormSelectionFromSearch(event.detail)
    })

    offencesContainer.addEventListener('click', (event) => {
      if (event.target.closest('[data-offence-change]')) {
        setOffencesInCategoryHeadingVisible(true)
        setCategoryDisplayEnabled(true)
      }
    })
  }

  const initOffenceSearchForCategory = async (category) => {
    const offencesContainer = document.getElementById('offence-category-offences-search')
    if (!offencesContainer) return

    offencesContainer.dataset.offenceSearchCategory = category

    if (!offenceSearchApi) {
      offenceSearchApi = await window.initOffenceSearch(offencesContainer, {
        scope: 'category-offences',
        categoryFilter: category,
        onOffenceSelected: (selection) => syncFormSelectionFromSearch(selection),
        onOffenceCleared: () => {
          syncFormSelectionFromSearch(null)
        }
      })
      bindOffenceSearchSelection(offencesContainer)
      return
    }

    await offenceSearchApi.setCategoryFilter(category)
    offenceSearchApi.showSearch?.()
  }

  const updateActiveCategoryLabel = () => {
    if (activeCategoryLabel) activeCategoryLabel.textContent = activeCategory
  }

  const revealOffencesStep = async (category) => {
    activeCategory = category
    offencesStep.hidden = false
    updateActiveCategoryLabel()
    syncFormSelectionFromSearch(null)
    await initOffenceSearchForCategory(category)
  }

  const hideOffencesStep = () => {
    activeCategory = ''
    offencesStep.hidden = true
    syncFormSelectionFromSearch(null)

    const offencesContainer = document.getElementById('offence-category-offences-search')
    if (offencesContainer) {
      delete offencesContainer.dataset.offenceSearchCategory
      offenceSearchApi?.showSearch?.({ focusInput: false })
    }
  }

  const resetCategorySearch = () => {
    categorySearchApi?.showSearch?.({ focusInput: false })
  }

  const showSearchView = () => {
    searchView.hidden = false
    resultsView.hidden = true
    paginationRoot.hidden = true
    paginationRoot.innerHTML = ''
    accordionsRoot.innerHTML = ''
    if (accordionsPlaceholder) {
      accordionsRoot.appendChild(accordionsPlaceholder)
      accordionsPlaceholder.hidden = true
    }
  }

  const setActiveCategory = (category) => {
    if (!category) {
      resetCategorySearch()
      return
    }

    categorySearchApi?.showSelected?.({ id: category, label: category })
  }

  try {
    allGroups = await fetchOffenceBrowseGroups()
  } catch (error) {
    console.error('Failed to load offences for a1o3:', error)
    if (isResultsView) {
      browse.showLoadError(accordionsRoot)
    } else if (categoryStep) {
      categoryStep.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
    }
    return
  }

  const categoryContainer = document.getElementById('offence-category-search')

  categorySearchApi = await window.initOffenceSearch(categoryContainer, {
    scope: 'category',
    onCategorySelected: (category) => {
      revealOffencesStep(category)
    },
    onCategoryCleared: () => {
      hideOffencesStep()
    }
  })

  restartSearchLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (isResultsView) return
      event.preventDefault()
      resetCategorySearch()
      scrollToPageTop()
    })
  })

  if (isResultsView) {
    setActiveCategory(resultsCategory)
    showResultsView()
    return
  }

  showSearchView()
  accordionsPlaceholder?.remove()

  const categoryFromUrl = params.get('category')?.trim() || ''
  if (categoryFromUrl && isValidCategory(categoryFromUrl)) {
    setActiveCategory(categoryFromUrl)
  }
})
