//
// Research prototypes home – clear session when starting CSRP assessment
//

import { clearPrototypeDataForCsrp } from './csrp-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-clear-session-on-start]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault()
      const href = link.getAttribute('href')
      if (!href) return

      await clearPrototypeDataForCsrp()
      window.location.href = href
    })
  })
})
