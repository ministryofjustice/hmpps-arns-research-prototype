//
// a1o – browse all offences accordions (variant A)
//

import {
  fetchOffenceBrowseGroups,
  filterOffenceBrowseGroupsByCategory,
  flattenOffenceSubOffences
} from '../offences-data.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { withFromCheckAnswers } from './tiering-change-scroll.js'
import {
  initOffenceBrowseForm,
  initOffenceBrowsePagination,
  paginateOffenceBrowseGroups,
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
  const listContainer = document.querySelector('[data-offence-list-container]')
  const listRoot = document.querySelector('[data-offence-category-list]')
  const loadingStatus = document.querySelector('[data-offence-loading-status]')
  const emptyStatus = document.querySelector('[data-offence-category-empty]')
  const paginationRoot = document.querySelector('[data-offence-pagination]')
  const sortSelect = document.querySelector('[data-offence-sort-by]')
  const saveButton = form?.querySelector('[data-offence-save-continue]')
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
    browseContext,
    returnUrl,
    selectionErrorFocusSelector: '#offence-sort-by',
    categoryRequiredSelector: '#offence-sort-by',
    onStartNewSearch: () => {
      setActiveCategory('')
    }
  })

  if (!browse || !listRoot || !listContainer || !paginationRoot) return

  populateOffenceSortOptions(sortSelect)
  initOffenceSortSelectResize(sortSelect)

  let allGroups = []
  const initialCategory = new URLSearchParams(window.location.search).get('category') || ''
  let activeCategory = initialCategory

  const syncCategoryToUrl = (category) => {
    const params = new URLSearchParams(window.location.search)

    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }

    const query = params.toString()
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  }

  const getDisplayGroups = () => filterOffenceBrowseGroupsByCategory(allGroups, activeCategory)

  const updateSaveButtonVisibility = () => {
    if (!saveButton) return

    const hideSave = Boolean(activeCategory)
    saveButton.classList.toggle('offence-browse-save--hidden', hideSave)
    saveButton.toggleAttribute('hidden', hideSave)
    saveButton.disabled = hideSave
  }

  const updateCategoryFilterBar = () => {
    if (categoryFilter && categoryTitle) {
      if (activeCategory) {
        categoryFilter.hidden = false
        categoryTitle.textContent = "Offences in " + "'" + activeCategory + "'"
        if (sortSelect) sortSelect.value = activeCategory
      } else {
        categoryFilter.hidden = true
        categoryTitle.textContent = ''
        if (sortSelect) sortSelect.value = ''
      }
    }

    updateSaveButtonVisibility()
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
    syncCategoryToUrl(activeCategory)
    browse.clearSelection()
    updateCategoryFilterBar()
    renderPage(1, { scrollToTop: true })
  }

// Updated rendering logic inside your existing renderPage function
  const renderPage = (page, { scrollToTop = false } = {}) => {
    const displayGroups = getDisplayGroups()

    if (loadingStatus) loadingStatus.hidden = true

    if (activeCategory && displayGroups.length > 0) {
      listContainer.hidden = false
      if (emptyStatus) emptyStatus.hidden = true

      const { items, currentPage, totalPages } = paginateOffenceBrowseGroups(displayGroups, page)

      // Builds semantic, headerless single-column table row items
      listRoot.innerHTML = items.map((group) => {
        const count = group.subOffences ? group.subOffences.length : 0
        const offenceWord = count === 1 ? 'offence' : 'offences'
        const targetUrl = withFromCheckAnswers(
          `a1o3?category=${encodeURIComponent(group.label)}&categoryId=${encodeURIComponent(group.id)}&browseCategory=${encodeURIComponent(activeCategory)}`
        )

        // Spell out the link for screen readers: include the count and drop the
        // bracket symbols so they are not read out.
        const ariaLabel = `${group.label}, ${group.code}, ${count} ${offenceWord}`

        return `
          <tr class="govuk-table__row">
            <td class="govuk-table__cell govuk-!-padding-top-3 govuk-!-padding-bottom-3">
              <p class="govuk-heading-m govuk-!-margin-bottom-1">
                <a class="govuk-link" href="${targetUrl}" aria-label="${ariaLabel}">${group.label} <span aria-hidden="true">(${group.code})</span></a>
              </p>
              <p class="govuk-body-s govuk-hint govuk-!-margin-bottom-0" aria-hidden="true">
                ${count} ${offenceWord}
              </p>
            </td>
          </tr>
        `
      }).join('')

      if (totalPages > 1) {
        paginationRoot.hidden = false
        paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
        initOffenceBrowsePagination(paginationRoot, (nextPage) => renderPage(nextPage))
      } else {
        paginationRoot.hidden = true
        paginationRoot.innerHTML = ''
      }
    } else if (activeCategory) {
      listContainer.hidden = true
      listRoot.innerHTML = ''
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
      if (emptyStatus) emptyStatus.hidden = false
    } else {
      listContainer.hidden = true
      listRoot.innerHTML = ''
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
      if (emptyStatus) emptyStatus.hidden = true
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
        updateCategoryFilterBar()
        renderPage(1)
      })
      .catch((error) => {
        console.error('Failed to load offence browse list:', error)
        paginationRoot.hidden = true
        if (loadingStatus) loadingStatus.hidden = true
        browse.showLoadError(listRoot)
      })

  const restoreCategoryFromUrl = () => {
    const categoryFromUrl = new URLSearchParams(window.location.search).get('category') || ''
    if (!categoryFromUrl || categoryFromUrl === activeCategory) return

    activeCategory = categoryFromUrl
    updateCategoryFilterBar()
    if (allGroups.length) renderPage(1)
  }

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return
    restoreCategoryFromUrl()
  })
})