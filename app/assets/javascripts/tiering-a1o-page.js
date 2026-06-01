//
// a1o – browse all offences accordions (variant A)
//

import { fetchOffenceBrowseGroups, flattenOffenceSubOffences } from './offences-data.js'
import {
  initOffenceBrowseAccordion,
  initOffenceBrowseForm,
  initOffenceBrowsePagination,
  paginateOffenceBrowseGroups,
  renderOffenceAccordion,
  renderOffenceBrowsePagination
} from './tiering-offence-browse.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1o-form')
  const accordionsRoot = document.querySelector('[data-offence-accordions]')
  const paginationRoot = document.querySelector('[data-offence-pagination]')

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    telemetrySource: 'browse-a'
  })

  if (!browse || !accordionsRoot || !paginationRoot) return

  let allGroups = []

  const renderPage = (page) => {
    const { items, currentPage, totalPages } = paginateOffenceBrowseGroups(allGroups, page)

    browse.clearSelection()
    accordionsRoot.innerHTML = renderOffenceAccordion(items, 'offence-browse-a1o')
    initOffenceBrowseAccordion(accordionsRoot.querySelector('.offence-browse-accordion'))
    browse.bindSelectLinks(accordionsRoot)
    browse.restoreSelection()

    if (totalPages > 1) {
      paginationRoot.hidden = false
      paginationRoot.innerHTML = renderOffenceBrowsePagination({ currentPage, totalPages })
      initOffenceBrowsePagination(paginationRoot, renderPage)
    } else {
      paginationRoot.hidden = true
      paginationRoot.innerHTML = ''
    }

    accordionsRoot.scrollIntoView({ block: 'start' })
  }

  fetchOffenceBrowseGroups()
    .then((groups) => {
      allGroups = groups
      browse.registerOffences(flattenOffenceSubOffences(groups))
      renderPage(1)
    })
    .catch((error) => {
      console.error('Failed to load offence browse list:', error)
      paginationRoot.hidden = true
      browse.showLoadError(accordionsRoot)
    })
})
