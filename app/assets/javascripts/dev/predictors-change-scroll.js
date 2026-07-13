//
// Scroll to a question when arriving from a7 "Change" link (URL hash)
// Save and continue returns to a7 or next required page when editing from check answers
//

import { clearSection1Complete, isSection1Complete } from './assessment-section-complete.js'
import {
  applyBranchingCleanup,
  fieldsChanged,
  getContinueHrefAfterCheckAnswersEdit,
  getPredictorsResultsAnswersHref,
  normaliseFields
} from './predictors-journey.js'
import { getPredictorsAssessmentSession, setPredictorsAssessmentSession } from './predictors-assessment-session.js'

export const PREDICTORS_FROM_CHECK_ANSWERS = 'a7'
const PREDICTORS_FROM_CHECK_ANSWERS_LEGACY = 'a8'
export const PREDICTORS_BACK_FROM_CHECK_ANSWERS = 'a7-back'

const isProtoDevPredictorsPage = () => window.location.pathname.includes('/dev/')

const isFromCheckAnswersParam = (from) =>
  from === PREDICTORS_FROM_CHECK_ANSWERS || from === PREDICTORS_FROM_CHECK_ANSWERS_LEGACY

export const getPredictorsCheckAnswersReturnHref = () => getPredictorsResultsAnswersHref()

export const PREDICTORS_CHANGE_ANCHORS = {
  currentOffence: 'predictors-current-offence',
  convictionDate: 'predictors-conviction-date',
  firstSanctionAge: 'predictors-first-sanction-date',
  totalSanctions: 'predictors-total-sanctions',
  violentSanctions: 'predictors-violent-sanctions',
  sexualOffence: 'predictors-sexual-offence',
  sexualMotivation: 'predictors-sexual-motivation',
  strangerContact: 'predictors-stranger-contact',
  sexualSanctionDate: 'predictors-sexual-sanction-date',
  contactAdultSanctions: 'predictors-contact-adult-sanctions',
  contactChildSanctions: 'predictors-contact-child-sanctions',
  indirectChildSanctions: 'predictors-indirect-child-sanctions',
  nonContactSanctions: 'predictors-non-contact-sanctions',
  communityDate: 'predictors-community-date',
  supervisedInCommunity: 'predictors-supervised-in-community',
  supervisedCommunityDate: 'predictors-supervised-community-date',
  offencesSinceCommunity: 'predictors-offences-since-community',
  recentOffenceDate: 'predictors-recent-offence-date',
  interviewDone: 'predictors-interview-done'
}

export const predictorsChangeHref = (page, anchorId) => {
  const hash = anchorId ? `#${anchorId}` : ''
  return `${page}?from=${PREDICTORS_FROM_CHECK_ANSWERS}${hash}`
}

/** Keep ?from=a7 on internal links while editing from check answers */
export const withFromCheckAnswers = (page) => {
  if (!isPredictorsCheckAnswersEdit()) return page
  if (page.includes(`from=${PREDICTORS_FROM_CHECK_ANSWERS}`)) return page

  const [path, hash = ''] = page.split('#')
  const separator = path.includes('?') ? '&' : '?'
  const query = `${separator}from=${PREDICTORS_FROM_CHECK_ANSWERS}`

  return `${path}${query}${hash ? `#${hash}` : ''}`
}

export const isPredictorsCheckAnswersEditFromUrl = () =>
  isFromCheckAnswersParam(new URLSearchParams(window.location.search).get('from'))

export const isPredictorsBackNavigation = () => {
  const from = new URLSearchParams(window.location.search).get('from')
  if (from === PREDICTORS_BACK_FROM_CHECK_ANSWERS) return true

  const nav = performance.getEntriesByType('navigation')[0]
  return nav?.type === 'back_forward'
}

export const startPredictorsCheckAnswersEdit = () => {
  setPredictorsAssessmentSession({ returnToCheckAnswers: true })

  if (isSection1Complete()) {
    clearSection1Complete()
  }
}

export const ensurePredictorsCheckAnswersEditMode = () => {
  if (isPredictorsCheckAnswersEditFromUrl()) {
    startPredictorsCheckAnswersEdit()
    return true
  }

  return getPredictorsAssessmentSession().returnToCheckAnswers === true
}

export const isPredictorsCheckAnswersEdit = () => ensurePredictorsCheckAnswersEditMode()

export const clearPredictorsCheckAnswersEdit = () => {
  setPredictorsAssessmentSession({ returnToCheckAnswers: false })
}

export const initPredictorsCheckAnswersEditFromUrl = () => {
  if (!isProtoDevPredictorsPage()) return

  const from = new URLSearchParams(window.location.search).get('from')
  if (isFromCheckAnswersParam(from)) {
    startPredictorsCheckAnswersEdit()
  }
}

// IMPORTANT: initialise edit mode as early as possible.
// Some page scripts check `isPredictorsCheckAnswersEdit()` during their own documentReady handlers.
// If we wait until documentReady here, those scripts may run first (depending on import order),
// and we lose the "return to check answers" behaviour.
initPredictorsCheckAnswersEditFromUrl()

export const captureCheckAnswersEditSnapshot = (fields) => {
  if (!isPredictorsCheckAnswersEdit()) return

  setPredictorsAssessmentSession({
    checkAnswersEditSnapshot: normaliseFields(fields)
  })
}

export const completePredictorsPageAndContinue = (currentPage, defaultHref, newFields) => {
  ensurePredictorsCheckAnswersEditMode()

  const session = getPredictorsAssessmentSession()
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
      setPredictorsAssessmentSession(sessionUpdates)
      return getPredictorsCheckAnswersReturnHref()
    }

    const continueHref = getContinueHrefAfterCheckAnswersEdit(
      currentPage,
      beforeSession,
      merged
    )

    // Only continue for branching changes (e.g. sexual offence → yes, offences → yes)
    if (continueHref) {
      sessionUpdates.returnToCheckAnswers = true
      setPredictorsAssessmentSession(sessionUpdates)
      return continueHref
    }

    sessionUpdates.returnToCheckAnswers = false
    setPredictorsAssessmentSession(sessionUpdates)
    return getPredictorsCheckAnswersReturnHref()
  }

  setPredictorsAssessmentSession({
    ...merged,
    returnToCheckAnswers: false,
    checkAnswersEditSnapshot: undefined
  })

  return defaultHref
}

export const getPredictorsBackLinkHref = (defaultHref) =>
  isPredictorsCheckAnswersEdit() ? getPredictorsCheckAnswersReturnHref() : defaultHref

const scrollDelayMs = (anchorId) =>
  anchorId === PREDICTORS_CHANGE_ANCHORS.currentOffence ? 150 : 0

const isA8LegacyTabHash = (anchorId = window.location.hash.slice(1)) => {
  if (anchorId !== 'answers' && anchorId !== 'score') return false
  return Boolean(document.getElementById('predictors-a8-back'))
}

export const scrollToPredictorsChangeTarget = (anchorId = window.location.hash.slice(1)) => {
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
  if (!isProtoDevPredictorsPage()) return

  document.addEventListener('click', (event) => {
    const changeLink = event.target.closest('.govuk-summary-list__actions a.govuk-link')
    const href = changeLink?.getAttribute('href') || ''
    if (
      !href.includes(`from=${PREDICTORS_FROM_CHECK_ANSWERS}`) &&
      !href.includes(`from=${PREDICTORS_FROM_CHECK_ANSWERS_LEGACY}`)
    ) {
      return
    }

    startPredictorsCheckAnswersEdit()
  })

  if (isPredictorsCheckAnswersEdit()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      if (link.id === 'predictors-a7-back' || link.id === 'predictors-a8-back') return
      link.href = getPredictorsCheckAnswersReturnHref()
    })

    document.querySelectorAll('[data-predictors-offence-browse-link]').forEach((link) => {
      const href = link.getAttribute('href') || 'a1o.html'
      link.href = withFromCheckAnswers(href)
    })

    document.querySelectorAll('[data-violent-offence-browse-link]').forEach((link) => {
      const href = link.getAttribute('href') || 'a1o.html'
      link.href = withFromCheckAnswers(href)
    })

    document.querySelectorAll('.offence-browse-variant-toggle').forEach((link) => {
      const href = link.getAttribute('href')
      if (href) link.href = withFromCheckAnswers(href)
    })

    document.querySelectorAll('[data-predictors-return-to-a1]').forEach((link) => {
      link.href = withFromCheckAnswers(link.getAttribute('href') || 'a1.html')
    })
  }

  if (new URLSearchParams(window.location.search).get('focus') === 'offence-search') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    return
  }

  if (!window.location.hash) return

  if (isA8LegacyTabHash()) return

  scrollToPredictorsChangeTarget()
})

// Shared script compatibility (offence-search, conviction-date, etc.)
export const isTieringCheckAnswersEdit = isPredictorsCheckAnswersEdit
export const TIERING_CHANGE_ANCHORS = PREDICTORS_CHANGE_ANCHORS
