//
// b1 – dynamic assessment entry
//

import { getTieringBackLinkHref } from './tiering-change-scroll.js'
import { tieringJourneyHref } from './tiering-journey.js'

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-b1-form')
  if (!form) return

  const backLink = document.getElementById('tiering-b1-back')
  if (backLink) {
    backLink.href = getTieringBackLinkHref(tieringJourneyHref('a6.html'))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
  })
})
