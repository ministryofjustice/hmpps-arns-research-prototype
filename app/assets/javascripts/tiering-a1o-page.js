//
// a1o – browse all offences table (variant A)
//

import { fetchOffenceSubOffences } from './offences-data.js'
import { initOffenceBrowseForm } from './tiering-offence-browse.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1o-form')
  const tableBody = document.querySelector('[data-offences-table-body]')

  const browse = initOffenceBrowseForm({
    form,
    getTableBodies: () => document.querySelectorAll('[data-offences-table-body]'),
    telemetrySource: 'browse-a'
  })

  if (!browse || !tableBody) return

  fetchOffenceSubOffences()
    .then((list) => {
      browse.registerOffences(list)
      browse.renderIntoBody(tableBody, list)
      browse.restoreSelection()
    })
    .catch(() => {
      browse.showLoadError(tableBody)
    })
})
