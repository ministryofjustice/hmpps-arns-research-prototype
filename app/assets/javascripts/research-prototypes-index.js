//
// Research prototypes home – clear session when starting Tiering assessment
//

import { clearPrototypeDataForTiering } from './tiering-assessment-session.js'
import { resetTieringSessionForFreshStart as resetProto2Session } from './02/tiering-assessment-session.js'
import { resetTieringSessionForFreshStart as resetDevSession } from './dev/tiering-assessment-session.js'

const clearSessionForPrototypeVersion = (version) => {
  if (version === '02') return resetProto2Session()
  if (version === 'dev') return resetDevSession()
  return clearPrototypeDataForTiering()
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-clear-session-on-start]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault()
      const href = link.getAttribute('href')
      if (!href) return

      const version = link.getAttribute('data-prototype-version') || '01'
      await clearSessionForPrototypeVersion(version)
      window.location.href = href
    })
  })
})
