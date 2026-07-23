//
// a1os – offence search results (accordion browse, same format as a1o)
//

import {
  fetchOffenceBrowseGroups,
  flattenOffenceSubOffences,
  getOffenceSearchMatches
} from '../offences-data.js'
import { withFromCheckAnswers } from './predictors-change-scroll.js'
import {
  initOffenceBrowseAccordion,
  initOffenceBrowseForm,
  initOffenceBrowsePagination,
  paginateOffenceBrowseGroups,
  renderOffenceAccordion,
  renderOffenceBrowsePagination,
  OFFENCE_SEARCH_RESULTS_BROWSE_CONTEXT,
  VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT
} from './predictors-offence-browse.js'

const formatSearchResultCount = (totalCount) => {
  if (totalCount === 0) return 'No results found'
  if (totalCount === 1) return '1 result found'
  return `${totalCount} results found`
}

const getRestartSearchUrl = (returnUrl) => {
  const pathPart = returnUrl.replace(/\.html$/, '').split('#')[0]
  return `${pathPart}?focus=offence-search`
}

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('predictors-a1os-form')
  if (!form) return

  const accordionsRoot = document.querySelector('[data-offence-accordions]')
  const paginationRoot = document.querySelector('[data-offence-pagination]')
  const queryEl = document.querySelector('[data-offence-search-query]')
  const countEl = document.querySelector('[data-offence-search-count]')

  const params = new URLSearchParams(window.location.search)
  const query = params.get('q')?.trim() || ''
  const violentOffenceCheckBrowse = params.get('context') === 'violent-offence-check'
  const browseContext = violentOffenceCheckBrowse
    ? VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT
    : OFFENCE_SEARCH_RESULTS_BROWSE_CONTEXT
  const returnUrl = violentOffenceCheckBrowse ? 'a2b.html#violent-offence-check' : 'a2b.html'

  if (!query) {
    window.location.replace(withFromCheckAnswers(returnUrl))
    return
  }

  document.querySelectorAll('.assessment-layout .govuk-back-link').forEach((link) => {
    link.href = withFromCheckAnswers(returnUrl)
  })

  const restartSearchLink = document.querySelector('[data-offence-restart-search]')
  if (restartSearchLink) {
    restartSearchLink.href = withFromCheckAnswers(getRestartSearchUrl(returnUrl))
  }

  if (queryEl) queryEl.textContent = query

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    browseContext,
    returnUrl,
    onStartNewSearch: () => {
      browse.clearSelection()
      renderPage(1, { scrollToTop: true })
    }
  })

  if (!browse || !accordionsRoot || !paginationRoot) return

  let allGroups = []

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }

  const renderPage = (page, { scrollToTop = false } = {}) => {
    const { totalCount, groups } = getOffenceSearchMatches(allGroups, query)

    if (countEl) countEl.textContent = formatSearchResultCount(totalCount)

    if (!groups.length) {
      accordionsRoot.innerHTML = ''
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
      browse.clearSelection()
      browse.registerOffences([])
      return
    }

    const { items: pageGroups, currentPage, totalPages } = paginateOffenceBrowseGroups(
      groups,
      page
    )

    accordionsRoot.innerHTML = renderOffenceAccordion(pageGroups, 'offence-browse-a1os', {
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

  fetchOffenceBrowseGroups()
    .then((groups) => {
      allGroups = groups
      browse.registerOffences(flattenOffenceSubOffences(getOffenceSearchMatches(groups, query).groups))
      renderPage(1)
    })
    .catch((error) => {
      console.error('Failed to load offence search results:', error)
      paginationRoot.hidden = true
      browse.showLoadError(accordionsRoot)
    })
})
