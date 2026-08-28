//
// Research prototypes home – clear session when starting Tiering assessment
//

import { clearPrototypeDataForTiering } from './tiering-assessment-session.js'
import { resetPredictorsSessionForFreshStart as resetProto2Session } from './02/predictors-assessment-session.js'
import { resetPredictorsSessionForFreshStart as resetProto3Session } from './03/predictors-assessment-session.js'
import { resetPredictorsSessionForFreshStart as resetDevSession } from './dev/predictors-assessment-session.js'

const PROTOTYPE_BASE_PATHS = {
  '01': '/01',
  '02': '/02',
  '03': '/03',
  dev: '/dev'
}

const clearSessionForPrototypeVersion = (version) => {
  if (version === '02') return resetProto2Session()
  if (version === '03') return resetProto3Session()
  if (version === 'dev') return resetDevSession()
  return clearPrototypeDataForTiering()
}

const resolvePrototypeHref = (version, href) => {
  const basePath = PROTOTYPE_BASE_PATHS[version]
  if (!basePath || !href) return href

  const pagePath = href.replace(/^\/(01|02|03|dev)\//, '')
  return `${basePath}/${pagePath}`
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-clear-session-on-start]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault()
      const version = link.getAttribute('data-prototype-version') || '01'
      const href = resolvePrototypeHref(version, link.getAttribute('href'))
      if (!href) return

      await clearSessionForPrototypeVersion(version)

      if (link.getAttribute('target') === '_blank') {
        window.open(href, '_blank', 'noopener,noreferrer')
        return
      }

      window.location.assign(href)
    })
  })
})
