//
// b1 – dynamic assessment entry
//

import { getPredictorsBackLinkHref } from './predictors-change-scroll.js'
import { predictorsJourneyHref } from './predictors-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('predictors-b1-form')
  if (!form) return

  const backLink = document.getElementById('predictors-b1-back')
  if (backLink) {
    backLink.href = getPredictorsBackLinkHref(predictorsJourneyHref('a6.html'))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
  })
})
