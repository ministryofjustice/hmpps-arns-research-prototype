//
// a7 – check your answers (summary list from session)
//

import { getTieringBackLinkHref } from './tiering-change-scroll.js'
import { setTieringAssessmentSession } from './tiering-assessment-session.js'
import { ensureOffenceSearchData } from '../tiering-offence-browse.js'
import {
  getA7BackHref,
  getTieringResultsScoresHref,
  redirectIfTieringJourneyIncomplete,
  syncTieringSessionBeforeCheckAnswers,
  tieringJourneyHref
} from './tiering-journey.js'
import { renderTieringSummaryList } from './tiering-summary.js'

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!window.location.pathname.includes('/dev/')) return

  const form = document.getElementById('tiering-a7-form')
  if (!form) return

  await ensureOffenceSearchData()

  const session = syncTieringSessionBeforeCheckAnswers()
  const summaryList = document.getElementById('tiering-summary-list')
  const backLink = document.getElementById('tiering-a7-back')
  const offenderFirstName = summaryList?.dataset.offenderFirstName || 'Alex'

  if (redirectIfTieringJourneyIncomplete()) return

  if (backLink) {
    backLink.href = getTieringBackLinkHref(getA7BackHref())
  }

  renderTieringSummaryList(summaryList, session, offenderFirstName)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    setTieringAssessmentSession({ scoreCalculated: true })
    window.location.href = tieringJourneyHref(getTieringResultsScoresHref())
  })
})
