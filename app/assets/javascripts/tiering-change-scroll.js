//
// Scroll to a question when arriving from a7 "Change" link (URL hash)
// Save and continue returns to a7 or next required page when editing from check answers
//

import { clearSection1Complete, isSection1Complete } from './assessment-section-complete.js'
import {
  applyBranchingCleanup,
  fieldsChanged,
  getContinueHrefAfterCheckAnswersEdit,
  normaliseFields
} from './tiering-journey.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'

export const TIERING_FROM_CHECK_ANSWERS = 'a7'

export const TIERING_CHANGE_ANCHORS = {
  currentOffence: 'tiering-current-offence',
  convictionDate: 'tiering-conviction-date',
  firstSanctionDate: 'tiering-first-sanction-date',
  totalSanctions: 'tiering-total-sanctions',
  violentSanctions: 'tiering-violent-sanctions',
  sexualOffence: 'tiering-sexual-offence',
  sexualMotivation: 'tiering-sexual-motivation',
  strangerContact: 'tiering-stranger-contact',
  sexualSanctionDate: 'tiering-sexual-sanction-date',
  contactAdultSanctions: 'tiering-contact-adult-sanctions',
  contactChildSanctions: 'tiering-contact-child-sanctions',
  indirectChildSanctions: 'tiering-indirect-child-sanctions',
  nonContactSanctions: 'tiering-non-contact-sanctions',
  communityDate: 'tiering-community-date',
  offencesSinceCommunity: 'tiering-offences-since-community',
  recentOffenceDate: 'tiering-recent-offence-date'
}

export const tieringChangeHref = (page, anchorId) => {
  const hash = anchorId ? `#${anchorId}` : ''
  return `${page}?from=${TIERING_FROM_CHECK_ANSWERS}${hash}`
}

/** Keep ?from=a7 on internal links while editing from check answers */
export const withFromCheckAnswers = (page) => {
  if (!isTieringCheckAnswersEdit()) return page
  if (page.includes(`from=${TIERING_FROM_CHECK_ANSWERS}`)) return page

  const [path, hash = ''] = page.split('#')
  const separator = path.includes('?') ? '&' : '?'
  const query = `${separator}from=${TIERING_FROM_CHECK_ANSWERS}`

  return `${path}${query}${hash ? `#${hash}` : ''}`
}

export const isTieringCheckAnswersEditFromUrl = () =>
  new URLSearchParams(window.location.search).get('from') === TIERING_FROM_CHECK_ANSWERS

export const startTieringCheckAnswersEdit = () => {
  setTieringAssessmentSession({ returnToCheckAnswers: true })

  if (isSection1Complete()) {
    clearSection1Complete()
  }
}

export const ensureTieringCheckAnswersEditMode = () => {
  if (isTieringCheckAnswersEditFromUrl()) {
    startTieringCheckAnswersEdit()
    return true
  }

  return getTieringAssessmentSession().returnToCheckAnswers === true
}

export const isTieringCheckAnswersEdit = () => ensureTieringCheckAnswersEditMode()

export const clearTieringCheckAnswersEdit = () => {
  setTieringAssessmentSession({ returnToCheckAnswers: false })
}

export const initTieringCheckAnswersEditFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('from') === TIERING_FROM_CHECK_ANSWERS) {
    startTieringCheckAnswersEdit()
  }
}

// IMPORTANT: initialise edit mode as early as possible.
// Some page scripts check `isTieringCheckAnswersEdit()` during their own documentReady handlers.
// If we wait until documentReady here, those scripts may run first (depending on import order),
// and we lose the "return to check answers" behaviour.
initTieringCheckAnswersEditFromUrl()

export const captureCheckAnswersEditSnapshot = (fields) => {
  if (!isTieringCheckAnswersEdit()) return

  setTieringAssessmentSession({
    checkAnswersEditSnapshot: normaliseFields(fields)
  })
}

export const completeTieringPageAndContinue = (currentPage, defaultHref, newFields) => {
  ensureTieringCheckAnswersEditMode()

  const session = getTieringAssessmentSession()
  const beforeSession = { ...session }
  const wasEdit = session.returnToCheckAnswers === true
  const snapshot = session.checkAnswersEditSnapshot
  const changed =
    wasEdit && snapshot && newFields && fieldsChanged(snapshot, newFields)

  const merged = applyBranchingCleanup(currentPage, session, newFields)

  if (wasEdit) {
    const sessionUpdates = {
      ...merged,
      checkAnswersEditSnapshot: undefined
    }

    if (changed && isSection1Complete()) {
      clearSection1Complete()
    }

    // No change on this page – return to summary (do not continue forward in the journey)
    if (!changed) {
      sessionUpdates.returnToCheckAnswers = false
      setTieringAssessmentSession(sessionUpdates)
      return 'a7.html'
    }

    const continueHref = getContinueHrefAfterCheckAnswersEdit(
      currentPage,
      beforeSession,
      merged
    )

    // Only continue for branching changes (e.g. sexual offence → yes, offences → yes)
    if (continueHref) {
      sessionUpdates.returnToCheckAnswers = true
      setTieringAssessmentSession(sessionUpdates)
      return continueHref
    }

    sessionUpdates.returnToCheckAnswers = false
    setTieringAssessmentSession(sessionUpdates)
    return 'a7.html'
  }

  setTieringAssessmentSession({
    ...merged,
    returnToCheckAnswers: false,
    checkAnswersEditSnapshot: undefined
  })

  return defaultHref
}

export const getTieringBackLinkHref = (defaultHref) =>
  isTieringCheckAnswersEdit() ? 'a7.html' : defaultHref

const scrollDelayMs = (anchorId) =>
  anchorId === TIERING_CHANGE_ANCHORS.currentOffence ? 150 : 0

export const scrollToTieringChangeTarget = (anchorId = window.location.hash.slice(1)) => {
  if (!anchorId) return

  const target = document.getElementById(decodeURIComponent(anchorId))
  if (!target) return

  const scroll = () => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  const delay = scrollDelayMs(anchorId)
  if (delay) {
    window.setTimeout(scroll, delay)
    return
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(scroll)
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.addEventListener('click', (event) => {
    const changeLink = event.target.closest('.govuk-summary-list__actions a.govuk-link')
    const href = changeLink?.getAttribute('href') || ''
    if (!href.includes(`from=${TIERING_FROM_CHECK_ANSWERS}`)) return

    startTieringCheckAnswersEdit()
  })

  if (isTieringCheckAnswersEdit()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      if (link.id === 'tiering-a7-back') return
      link.href = 'a7.html'
    })

    document.querySelectorAll('[data-tiering-offence-browse-link]').forEach((link) => {
      const href = link.getAttribute('href') || 'a1o.html'
      link.href = withFromCheckAnswers(href)
    })

    document.querySelectorAll('.offence-browse-variant-toggle').forEach((link) => {
      const href = link.getAttribute('href')
      if (href) link.href = withFromCheckAnswers(href)
    })

    document.querySelectorAll('[data-tiering-return-to-a1]').forEach((link) => {
      link.href = withFromCheckAnswers(link.getAttribute('href') || 'a1.html')
    })
  }

  if (!window.location.hash) return
  scrollToTieringChangeTarget()
})
