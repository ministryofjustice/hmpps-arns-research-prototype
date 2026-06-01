//
// a1o2 – browse offences by category tabs (variant B)
//

import { fetchOffenceCategoryTabs, flattenOffenceSubOffences } from './offences-data.js'
import {
  escapeOffenceHtml,
  initOffenceBrowseAccordion,
  initOffenceBrowseForm,
  initOffenceBrowseTabs,
  renderOffenceAccordion
} from './tiering-offence-browse.js'

const renderCategoryTabs = (tabsRoot, tabs) => {
  const list = tabsRoot.querySelector('[data-offence-tabs-list]')
  const loadingPanel = tabsRoot.querySelector('[data-offence-tabs-loading]')

  if (!list) return []

  list.innerHTML = tabs
    .map(
      (tab, index) => `
    <li class="govuk-tabs__list-item${index === 0 ? ' govuk-tabs__list-item--selected' : ''}">
      <a class="govuk-tabs__tab" href="#${escapeOffenceHtml(tab.id)}">${escapeOffenceHtml(tab.label)}</a>
    </li>`
    )
    .join('')

  loadingPanel?.remove()

  const accordionRoots = tabs.map((tab, index) => {
    const panel = document.createElement('div')
    panel.className = `govuk-tabs__panel offence-browse-tabs__panel${index === 0 ? '' : ' govuk-tabs__panel--hidden'}`
    panel.id = tab.id

    panel.innerHTML = `
      <div class="offence-browse-accordions" data-offence-accordions>
        ${renderOffenceAccordion(tab.groups, `offence-browse-${tab.id}`)}
      </div>`

    tabsRoot.appendChild(panel)
    return panel.querySelector('.offence-browse-accordion')
  })

  initOffenceBrowseTabs(tabsRoot)

  accordionRoots.filter(Boolean).forEach((accordionRoot) => {
    initOffenceBrowseAccordion(accordionRoot)
  })

  return accordionRoots
}

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1o2-form')
  const tabsRoot = document.querySelector('[data-offence-category-tabs]')

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    telemetrySource: 'browse-b'
  })

  if (!browse || !tabsRoot) return

  fetchOffenceCategoryTabs()
    .then((tabs) => {
      if (!tabs.length) {
        throw new Error('No offence categories returned')
      }

      const allGroups = tabs.flatMap((tab) => tab.groups)
      browse.registerOffences(flattenOffenceSubOffences(allGroups))

      renderCategoryTabs(tabsRoot, tabs)
      browse.bindSelectLinks(tabsRoot)
      browse.restoreSelection()
    })
    .catch((error) => {
      console.error('Failed to load offence categories:', error)
      tabsRoot.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
    })
})
