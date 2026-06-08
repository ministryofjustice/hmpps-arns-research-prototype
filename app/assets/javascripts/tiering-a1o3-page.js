//
// a1o3 – category dropdown, then paginated offence code accordions
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
  paginateOffenceBrowseGroups,
  renderOffenceAccordion,
  renderOffenceBrowsePagination
} from './tiering-offence-browse.js'
import { populateOffenceSortOptions } from './tiering-offence-sort-select.js'

const isValidCategory = (category) => OFFENCE_BROWSE_SORT_CATEGORIES.includes(category)

window.GOVUKPrototypeKit.documentReady(async () => {
  const form = document.getElementById('tiering-a1o3-form')
  if (!form) return

  const categoryStep = document.querySelector('[data-offence-category-step]')
  const categorySelect = document.querySelector('[data-offence-category-select]')
  const categoryContent = document.querySelector('[data-offence-category-content]')
  const activeCategoryLabel = document.querySelector('[data-offence-active-category-label]')
  const accordionsRoot = document.querySelector('[data-offence-accordions]')
  const paginationRoot = document.querySelector('[data-offence-pagination]')

  const params = new URLSearchParams(window.location.search)
  const resultsQuery = params.get('q')?.trim() || ''
  const categoryFromUrl = params.get('category')?.trim() || ''

  const returnUrl = 'a1.html'

  document.querySelectorAll('.assessment-layout .govuk-back-link').forEach((link) => {
    link.href = withFromCheckAnswers(returnUrl)
  })

  const restartSearchLink = document.querySelector('[data-offence-restart-search]')
  if (restartSearchLink) {
    restartSearchLink.href = withFromCheckAnswers('a1o3.html')
  }

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    telemetrySource: 'browse-c',
    browseContext: 'current-offence',
    returnUrl,
    onStartNewSearch: () => {
      window.history.replaceState(null, '', window.location.pathname)
      setActiveCategory('', { scrollToTop: true })
      categorySelect?.focus()
    }
  })

  if (!browse || !accordionsRoot || !paginationRoot) return

  let allGroups = []
  let activeCategory = ''

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }

  const getDisplayGroups = () => {
    const categoryGroups = filterOffenceBrowseGroupsByCategory(allGroups, activeCategory)
    if (!resultsQuery) return categoryGroups
    return getOffenceSearchMatches(categoryGroups, resultsQuery).groups
  }

  const renderPage = (page, { scrollToTop = false } = {}) => {
    const displayGroups = getDisplayGroups()
    const { items, currentPage, totalPages } = paginateOffenceBrowseGroups(displayGroups, page)

    if (!displayGroups.length) {
      accordionsRoot.innerHTML = resultsQuery
        ? '<p class="govuk-body">No offences found.</p>'
        : '<p class="govuk-body">No offences in this category.</p>'
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
      browse.clearSelection()
      browse.registerOffences([])
      return
    }

    accordionsRoot.innerHTML = renderOffenceAccordion(items, 'offence-browse-a1o3', {
      rememberExpanded: false,
      selectedId: browse.getSelectedId()
    })
    initOffenceBrowseAccordion(accordionsRoot.querySelector('.offence-browse-accordion'), {
      rememberExpanded: false
    })
    browse.bindOffenceRadios(accordionsRoot)

    if (totalPages > 1) {
      paginationRoot.hidden = false
      paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
      initOffenceBrowsePagination(paginationRoot, (nextPage) =>
        renderPage(nextPage, { scrollToTop: true })
      )
    } else {
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
    }

    if (scrollToTop) {
      scrollToPageTop()
    }
  }

  const setActiveCategory = (category, { scrollToTop = false } = {}) => {
    activeCategory = category || ''
    browse.clearSelection()

    if (categorySelect) {
      categorySelect.value = activeCategory
    }

    if (categoryContent) {
      categoryContent.hidden = !activeCategory
    }

    if (activeCategoryLabel) {
      activeCategoryLabel.textContent = activeCategory
    }

    if (!activeCategory) {
      accordionsRoot.innerHTML = ''
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
      browse.registerOffences([])
      return
    }

    const groups = getDisplayGroups()
    browse.registerOffences(flattenOffenceSubOffences(groups))
    renderPage(1, { scrollToTop })
  }

  try {
    allGroups = await fetchOffenceBrowseGroups()
  } catch (error) {
    console.error('Failed to load offences for a1o3:', error)
    if (categoryStep) {
      categoryStep.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
    }
    browse.showLoadError(accordionsRoot)
    return
  }

  populateOffenceSortOptions(categorySelect)

  categorySelect?.addEventListener('change', () => {
    const category = categorySelect.value.trim()
    if (category && isValidCategory(category)) {
      setActiveCategory(category, { scrollToTop: true })
      return
    }
    setActiveCategory('')
  })

  if (categoryFromUrl && isValidCategory(categoryFromUrl)) {
    setActiveCategory(categoryFromUrl)
    browse.restoreSelection()
    renderPage(1)
  }
})
