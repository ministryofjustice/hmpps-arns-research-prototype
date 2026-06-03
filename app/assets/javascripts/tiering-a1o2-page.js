//
// a1o2 – browse offences by category tabs (variant B)
//

import { fetchOffenceCategoryTabs, flattenOffenceSubOffences } from './offences-data.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { withFromCheckAnswers } from './tiering-change-scroll.js'
import {
  escapeOffenceHtml,
  initOffenceBrowseAccordion,
  initOffenceBrowseForm,
  initOffenceBrowsePagination,
  initOffenceBrowseTabs,
  paginateOffenceBrowseGroups,
  renderOffenceAccordion,
  renderOffenceBrowsePagination,
  VIOLENT_OFFENCE_CHECK_BROWSE_CONTEXT
} from './tiering-offence-browse.js'

const renderTabPage = (tabId, page, browse, tabGroups, tabPages) => {
  const panel = document.getElementById(tabId)
  if (!panel) return

  const accordionsRoot = panel.querySelector('[data-offence-accordions]')
  const paginationRoot = panel.querySelector('[data-offence-pagination]')
  const groups = tabGroups.get(tabId) || []

  if (!accordionsRoot || !paginationRoot) return

  const { items, currentPage, totalPages } = paginateOffenceBrowseGroups(groups, page)
  tabPages.set(tabId, currentPage)

  browse.clearSelection()
  accordionsRoot.innerHTML = renderOffenceAccordion(items, `offence-browse-${tabId}`, {
    rememberExpanded: false
  })
  initOffenceBrowseAccordion(accordionsRoot.querySelector('.offence-browse-accordion'), {
    rememberExpanded: false
  })
  browse.bindSelectLinks(panel)

  if (totalPages > 1) {
    paginationRoot.hidden = false
    paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
    initOffenceBrowsePagination(paginationRoot, (nextPage) =>
      renderTabPage(tabId, nextPage, browse, tabGroups, tabPages)
    )
  } else {
    paginationRoot.hidden = true
    paginationRoot.innerHTML = ''
  }
}

const renderCategoryTabs = (tabsRoot, tabs, browse) => {
  const list = tabsRoot.querySelector('[data-offence-tabs-list]')
  const loadingPanel = tabsRoot.querySelector('[data-offence-tabs-loading]')

  if (!list) return

  const tabGroups = new Map()
  const tabPages = new Map()

  list.innerHTML = tabs
    .map(
      (tab, index) => `
    <li class="govuk-tabs__list-item${index === 0 ? ' govuk-tabs__list-item--selected' : ''}">
      <a class="govuk-tabs__tab" href="#${escapeOffenceHtml(tab.id)}">${escapeOffenceHtml(tab.label)}</a>
    </li>`
    )
    .join('')

  loadingPanel?.remove()

  tabs.forEach((tab, index) => {
    tabGroups.set(tab.id, tab.groups)
    tabPages.set(tab.id, 1)

    const panel = document.createElement('div')
    panel.className = `govuk-tabs__panel offence-browse-tabs__panel${index === 0 ? '' : ' govuk-tabs__panel--hidden'}`
    panel.id = tab.id

    panel.innerHTML = `
      <div class="offence-browse-accordions govuk-!-margin-bottom-6" data-offence-accordions></div>
      <div data-offence-pagination hidden></div>`

    tabsRoot.appendChild(panel)
  })

  initOffenceBrowseTabs(tabsRoot)

  tabs.forEach((tab) => {
    renderTabPage(tab.id, 1, browse, tabGroups, tabPages)
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1o2-form')
  const tabsRoot = document.querySelector('[data-offence-category-tabs]')
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
    telemetrySource: 'browse-b',
    browseContext,
    returnUrl
  })

  if (!browse || !tabsRoot) return

  fetchOffenceCategoryTabs()
    .then((tabs) => {
      if (!tabs.length) {
        throw new Error('No offence categories returned')
      }

      const allGroups = tabs.flatMap((tab) => tab.groups)
      browse.registerOffences(flattenOffenceSubOffences(allGroups))

      renderCategoryTabs(tabsRoot, tabs, browse)
    })
    .catch((error) => {
      console.error('Failed to load offence categories:', error)
      tabsRoot.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
    })
})
