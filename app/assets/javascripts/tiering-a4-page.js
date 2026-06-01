//
// a4 – earliest date in the community
//

import {
  captureCheckAnswersEditSnapshot,
  completeTieringPageAndContinue,
  getTieringBackLinkHref,
  isTieringCheckAnswersEdit
} from './tiering-change-scroll.js'
import { getA4FieldsFromForm } from './tiering-journey.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a4-form')
  if (!form) return

  const session = getTieringAssessmentSession()
  const backLink = document.getElementById('tiering-a4-back')

  if (backLink) {
    backLink.href = getTieringBackLinkHref(
      session.sexualOffence === 'yes' ? 'a3.html' : 'a2.html'
    )
  }

  const dayInput = form.querySelector('#community-date-day')
  const monthInput = form.querySelector('#community-date-month')
  const yearInput = form.querySelector('#community-date-year')

  if (session.communityDate) {
    if (dayInput && session.communityDate.day) dayInput.value = session.communityDate.day
    if (monthInput && session.communityDate.month) monthInput.value = session.communityDate.month
    if (yearInput && session.communityDate.year) yearInput.value = session.communityDate.year
  }

  if (isTieringCheckAnswersEdit()) {
    captureCheckAnswersEditSnapshot(getA4FieldsFromForm(form))
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const newFields = getA4FieldsFromForm(form)

    window.location.href = completeTieringPageAndContinue('a4', 'a5.html', newFields)
  })
})
