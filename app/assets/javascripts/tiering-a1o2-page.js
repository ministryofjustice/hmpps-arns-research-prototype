//
// a1o2 – browse offences by category tabs (variant B)
//

import { fetchOffenceCategoryTabs } from './offences-data.js'
import {
  escapeOffenceHtml,
  initOffenceBrowseForm,
  initOffenceBrowseTabs,
  renderOffenceTableRows
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

  const panels = tabs.map((tab, index) => {
    const panel = document.createElement('div')
    panel.className = `govuk-tabs__panel${index === 0 ? '' : ' govuk-tabs__panel--hidden'}`
    panel.id = tab.id

    panel.innerHTML = `
    <table class="govuk-table offences-all-table offence-browse-tabs__table">
      <caption class="govuk-table__caption govuk-table__caption--m govuk-visually-hidden">
        ${escapeOffenceHtml(tab.label)}
      </caption>
      <colgroup>
        <col class="offence-browse-tabs__col offence-browse-tabs__col--name">
        <col class="offence-browse-tabs__col offence-browse-tabs__col--code">
        <col class="offence-browse-tabs__col offence-browse-tabs__col--action">
      </colgroup>
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          <th scope="col" class="govuk-table__header offence-browse-tabs__header--name">Offence name</th>
          <th scope="col" class="govuk-table__header offence-browse-tabs__header--code">Code</th>
          <th scope="col" class="govuk-table__header offences-all-table__action-header offence-browse-tabs__header--action"><span class="govuk-visually-hidden">Action</span></th>
        </tr>
      </thead>
      <tbody class="govuk-table__body" data-offences-table-body data-offence-category="${escapeOffenceHtml(tab.id)}">
        ${tab.offences.length ? renderOffenceTableRows(tab.offences) : `
        <tr>
          <td class="govuk-table__cell" colspan="3">No offences in this category.</td>
        </tr>`}
      </tbody>
    </table>`

    tabsRoot.appendChild(panel)
    return panel.querySelector('[data-offences-table-body]')
  })

  initOffenceBrowseTabs(tabsRoot)

  return panels.filter(Boolean)
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

      const allOffences = tabs.flatMap((tab) => tab.offences)
      browse.registerOffences(allOffences)

      const tableBodies = renderCategoryTabs(tabsRoot, tabs)
      tableBodies.forEach((tableBody, index) => {
        browse.renderIntoBody(tableBody, tabs[index].offences)
      })

      browse.restoreSelection()
    })
    .catch((error) => {
      console.error('Failed to load offence categories:', error)
      tabsRoot.innerHTML =
        '<p class="govuk-body">Offence list could not be loaded. Try refreshing the page.</p>'
    })
})
