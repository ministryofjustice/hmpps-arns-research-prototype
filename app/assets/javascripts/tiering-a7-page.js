//
// a7 – legacy check your answers (redirects to a8 Answers tab)
//

import { getTieringResultsAnswersHref } from './tiering-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.getElementById('tiering-a7-form')) return

  window.location.replace(getTieringResultsAnswersHref())
})
