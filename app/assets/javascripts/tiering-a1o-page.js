//
// a1o – browse all offences accordions (variant A)
//

import {
  fetchOffenceBrowseGroups,
  filterOffenceBrowseGroupsByCategory,
  flattenOffenceSubOffences
} from './offences-data.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { withFromCheckAnswers } from './tiering-change-scroll.js'
import {
  initOffenceBrowseAccordion,
  initOffenceBrowseForm,
  initOffenceBrowsePagination,
  paginateOffenceBrowseGroups,
  renderOffenceAccordion,
  renderOffenceBrowsePagination,
  VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT
} from './tiering-offence-browse.js'
import {
  initOffenceSortSelectResize,
  populateOffenceSortOptions,
  resizeOffenceSortSelect
} from './tiering-offence-sort-select.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1o-form')
  const accordionsRoot = document.querySelector('[data-offence-accordions]')
  const paginationRoot = document.querySelector('[data-offence-pagination]')
  const sortSelect = document.querySelector('[data-offence-sort-by]')
  const categoryFilter = document.querySelector('[data-offence-category-filter]')
  const categoryTitle = document.querySelector('[data-offence-category-title]')
  const viewAllLink = document.querySelector('[data-offence-view-all]')
  const session = getTieringAssessmentSession()
  const violentOffenceCheckBrowse = session.violentOffenceCheckBrowse === true
  const browseContext = violentOffenceCheckBrowse
    ? VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT
    : 'current-offence'
  const returnUrl = violentOffenceCheckBrowse ? 'a2.html#violent-offence-check' : 'a1.html'

  if (violentOffenceCheckBrowse) {
    document.querySelectorAll('.assessment-layout .govuk-back-link').forEach((link) => {
      link.href = withFromCheckAnswers('a2.html#violent-offence-check')
    })
  }

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    telemetrySource: 'browse-a',
    browseContext,
    returnUrl,
    onStartNewSearch: () => {
      setActiveCategory('')
    }
  })

  if (!browse || !accordionsRoot || !paginationRoot) return

  populateOffenceSortOptions(sortSelect)
  initOffenceSortSelectResize(sortSelect)

  let allGroups = []
  let activeCategory = ''

  const getDisplayGroups = () => filterOffenceBrowseGroupsByCategory(allGroups, activeCategory)

  const updateCategoryFilterBar = () => {
    if (!categoryFilter || !categoryTitle) return

    if (activeCategory) {
      categoryFilter.hidden = false
      categoryTitle.textContent = activeCategory
      if (sortSelect) sortSelect.value = activeCategory
    } else {
      categoryFilter.hidden = true
      categoryTitle.textContent = ''
      if (sortSelect) sortSelect.value = ''
    }

    resizeOffenceSortSelect(sortSelect)
  }

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }

  const setActiveCategory = (category) => {
    activeCategory = category || ''
    browse.clearSelection()
    updateCategoryFilterBar()
    renderPage(1, { scrollToTop: true })
  }

  const renderPage = (page, { scrollToTop = false } = {}) => {
    const displayGroups = getDisplayGroups()
    const { items, currentPage, totalPages } = paginateOffenceBrowseGroups(displayGroups, page)

    accordionsRoot.innerHTML = renderOffenceAccordion(items, 'offence-browse-a1o', {
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
      initOffenceBrowsePagination(paginationRoot, (nextPage) => renderPage(nextPage))
    } else {
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
    }

    if (scrollToTop) {
      scrollToPageTop()
    }
  }

  sortSelect?.addEventListener('change', () => {
    setActiveCategory(sortSelect.value)
  })

  viewAllLink?.addEventListener('click', (event) => {
    event.preventDefault()
    setActiveCategory('')
  })

  fetchOffenceBrowseGroups()
    .then((groups) => {
      allGroups = groups
      browse.registerOffences(flattenOffenceSubOffences(groups))
      browse.restoreSelection()
      renderPage(1)
    })
    .catch((error) => {
      console.error('Failed to load offence browse list:', error)
      paginationRoot.hidden = true
      browse.showLoadError(accordionsRoot)
    })
})
