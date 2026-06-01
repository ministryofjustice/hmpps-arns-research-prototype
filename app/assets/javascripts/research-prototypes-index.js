//
// Research prototypes home – clear session when starting Tiering assessment
//

import { clearPrototypeDataForTiering } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-clear-session-on-start]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault()
      const href = link.getAttribute('href')
      if (!href) return

      await clearPrototypeDataForTiering()
      window.location.href = href
    })
  })
})
