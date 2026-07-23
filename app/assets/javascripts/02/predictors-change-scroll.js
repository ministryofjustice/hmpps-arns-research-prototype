//
// Scroll to a question when arriving from a7 "Change" link (URL hash)
// Save and continue returns to a7 or next required page when editing from check answers
//

import { clearSection1Complete, isSection1Complete } from './assessment-section-complete.js'
import {
  applyBranchingCleanup,
  fieldsChanged,
  getCheckAnswersReturnHrefAfterEdit,
  getContinueHrefAfterCheckAnswersEdit,
  normaliseFields,
  predictorsJourneyHref
} from './predictors-journey.js'
import { getPredictorsAssessmentSession, setPredictorsAssessmentSession } from './predictors-assessment-session.js'

export const PREDICTORS_FROM_CHECK_ANSWERS = 'a7'
export const PREDICTORS_FROM_DYNAMIC_CHECK_ANSWERS = 'b11'
export const PREDICTORS_FROM_B11_STATIC = 'b11-static'
export const PREDICTORS_FROM_B11_DYNAMIC = 'b11-dynamic'
const PREDICTORS_FROM_CHECK_ANSWERS_LEGACY = 'a8'
export const PREDICTORS_BACK_FROM_CHECK_ANSWERS = 'a7-back'
export const PREDICTORS_BACK_FROM_DYNAMIC_CHECK_ANSWERS = 'b11-back'

const CHECK_ANSWERS_RETURN_A7 = 'a7'
const CHECK_ANSWERS_RETURN_B11 = 'b11'
const CHECK_ANSWERS_HREF_A7 = 'a7.html'
const CHECK_ANSWERS_HREF_B11 = 'b11.html'

const isProto2PredictorsPage = () => window.location.pathname.includes('/02/')

const isB11FromParam = (from) =>
  from === PREDICTORS_FROM_DYNAMIC_CHECK_ANSWERS ||
  from === PREDICTORS_BACK_FROM_DYNAMIC_CHECK_ANSWERS ||
  from === PREDICTORS_FROM_B11_STATIC ||
  from === PREDICTORS_FROM_B11_DYNAMIC

const isFromCheckAnswersParam = (from) =>
  from === PREDICTORS_FROM_CHECK_ANSWERS ||
  isB11FromParam(from) ||
  from === PREDICTORS_FROM_CHECK_ANSWERS_LEGACY

const getFromParamFromHref = (href = '') => {
  const match = href.match(/[?&]from=([^&#]+)/)
  return match?.[1] || null
}

const withCheckAnswersReturnAnchor = (href, session = getPredictorsAssessmentSession()) => {
  const anchor = session.checkAnswersReturnAnchor
  if (!anchor || href.includes('#')) return href
  return `${href}#${anchor}`
}

// Keep a7/b11 hrefs as literals (do not import from predictors-journey).
// change-scroll ↔ offence-browse ↔ journey is circular; documentReady can run
// during module init while journey exports are still in the TDZ.
export const getPredictorsCheckAnswersReturnHref = (session = getPredictorsAssessmentSession()) => {
  let href = CHECK_ANSWERS_HREF_A7

  if (session.checkAnswersReturnTarget === CHECK_ANSWERS_RETURN_B11) {
    href = CHECK_ANSWERS_HREF_B11
  } else if (session.checkAnswersReturnTarget === CHECK_ANSWERS_RETURN_A7) {
    href = CHECK_ANSWERS_HREF_A7
  } else {
    const from = new URLSearchParams(window.location.search).get('from')

    if (isB11FromParam(from)) {
      href = CHECK_ANSWERS_HREF_B11
    }
  }

  return withCheckAnswersReturnAnchor(href, session)
}

export const getActiveCheckAnswersFromParam = () => {
  const from = new URLSearchParams(window.location.search).get('from')

  if (isB11FromParam(from)) {
    return from === PREDICTORS_FROM_B11_STATIC
      ? PREDICTORS_FROM_B11_STATIC
      : from === PREDICTORS_FROM_B11_DYNAMIC
        ? PREDICTORS_FROM_B11_DYNAMIC
        : PREDICTORS_FROM_DYNAMIC_CHECK_ANSWERS
  }

  if (
    from === PREDICTORS_FROM_CHECK_ANSWERS ||
    from === PREDICTORS_BACK_FROM_CHECK_ANSWERS ||
    from === PREDICTORS_FROM_CHECK_ANSWERS_LEGACY
  ) {
    return PREDICTORS_FROM_CHECK_ANSWERS
  }

  const target = getPredictorsAssessmentSession().checkAnswersReturnTarget
  return target === CHECK_ANSWERS_RETURN_B11
    ? PREDICTORS_FROM_DYNAMIC_CHECK_ANSWERS
    : PREDICTORS_FROM_CHECK_ANSWERS
}

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

export const predictorsChangeHref = (page, anchorId, from = PREDICTORS_FROM_CHECK_ANSWERS) => {
  const hash = anchorId ? `#${anchorId}` : ''
  return `${page}?from=${from}${hash}`
}

/** Keep ?from= on internal links while editing from check answers */
export const withFromCheckAnswers = (page) => {
  if (!isPredictorsCheckAnswersEdit()) return page

  const fromParam = getActiveCheckAnswersFromParam()
  if (page.includes(`from=${fromParam}`)) return page

  const [path, hash = ''] = page.split('#')
  const separator = path.includes('?') ? '&' : '?'

  return `${path}${separator}from=${fromParam}${hash ? `#${hash}` : ''}`
}

export const shouldEnforcePredictorsJourneyOrder = () => !isPredictorsCheckAnswersEdit()

/** Redirect to an earlier page unless the user is editing from check answers */
export const redirectUnlessCheckAnswersEdit = (page) => {
  if (!shouldEnforcePredictorsJourneyOrder()) return false

  window.location.href = predictorsJourneyHref(page)
  return true
}

export const isPredictorsCheckAnswersEditFromUrl = () =>
  isFromCheckAnswersParam(new URLSearchParams(window.location.search).get('from'))

export const isPredictorsBackNavigation = () => {
  const from = new URLSearchParams(window.location.search).get('from')
  if (from === PREDICTORS_BACK_FROM_CHECK_ANSWERS || from === PREDICTORS_BACK_FROM_DYNAMIC_CHECK_ANSWERS) {
    return true
  }

  const nav = performance.getEntriesByType('navigation')[0]
  return nav?.type === 'back_forward'
}

export const startPredictorsCheckAnswersEdit = (fromParam, returnAnchor) => {
  const session = getPredictorsAssessmentSession()
  const from = fromParam || new URLSearchParams(window.location.search).get('from')
  const updates = { returnToCheckAnswers: true }

  if (isB11FromParam(from)) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_B11
  } else if (from === PREDICTORS_FROM_CHECK_ANSWERS || from === PREDICTORS_FROM_CHECK_ANSWERS_LEGACY) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_A7
  } else if (from === PREDICTORS_BACK_FROM_CHECK_ANSWERS) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_A7
  } else if (session.checkAnswersReturnTarget) {
    updates.checkAnswersReturnTarget = session.checkAnswersReturnTarget
  } else if (window.location.pathname.includes('/02/b11')) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_B11
  }

  if (returnAnchor) {
    updates.checkAnswersReturnAnchor = returnAnchor
  } else if (session.checkAnswersReturnAnchor) {
    updates.checkAnswersReturnAnchor = session.checkAnswersReturnAnchor
  }

  setPredictorsAssessmentSession(updates)

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
  setPredictorsAssessmentSession({
    returnToCheckAnswers: false,
    checkAnswersReturnTarget: undefined,
    checkAnswersReturnAnchor: undefined,
    checkAnswersEditSnapshot: undefined
  })
}

export const initPredictorsCheckAnswersEditFromUrl = () => {
  if (!isProto2PredictorsPage()) return

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

const resolveContinueHref = (defaultHref, merged) =>
  typeof defaultHref === 'function' ? defaultHref(merged) : defaultHref

const isOpeningDynamicFromInterviewEdit = (currentPage, beforeSession, afterSession) =>
  currentPage === 'a6' &&
  beforeSession.interviewDone !== 'yes' &&
  afterSession.interviewDone === 'yes'

export const completePredictorsPageAndContinue = (currentPage, defaultHref, newFields) => {
  ensurePredictorsCheckAnswersEditMode()

  const session = getPredictorsAssessmentSession()
  const beforeSession = { ...session }
  const wasEdit = session.returnToCheckAnswers === true
  const snapshot = session.checkAnswersEditSnapshot
  const changed =
    wasEdit && snapshot && newFields && fieldsChanged(snapshot, newFields)

  const merged = applyBranchingCleanup(currentPage, session, newFields)
  const nextHref = resolveContinueHref(defaultHref, merged)

  if (wasEdit) {
    const checkAnswersReturnHref = getPredictorsCheckAnswersReturnHref(beforeSession)
    const sessionUpdates = {
      ...merged,
      checkAnswersEditSnapshot: undefined
    }

    const resolveReturnHref = () =>
      withCheckAnswersReturnAnchor(
        getCheckAnswersReturnHrefAfterEdit(
          currentPage,
          beforeSession,
          merged,
          checkAnswersReturnHref
        ),
        beforeSession
      )

    if (changed && isSection1Complete()) {
      clearSection1Complete()
    }

    // No change on this page – return to summary (do not continue forward in the journey)
    if (!changed) {
      sessionUpdates.returnToCheckAnswers = false
      sessionUpdates.checkAnswersReturnTarget = undefined
      sessionUpdates.checkAnswersReturnAnchor = undefined
      setPredictorsAssessmentSession(sessionUpdates)

      if (wasEdit || snapshot) {
        return resolveReturnHref()
      }

      return nextHref
    }

    const continueHref = getContinueHrefAfterCheckAnswersEdit(
      currentPage,
      beforeSession,
      merged
    )

    // Only continue for branching changes (e.g. sexual offence → yes, offences → yes)
    if (continueHref) {
      if (isOpeningDynamicFromInterviewEdit(currentPage, beforeSession, merged)) {
        sessionUpdates.returnToCheckAnswers = false
        sessionUpdates.checkAnswersReturnTarget = undefined
        sessionUpdates.checkAnswersReturnAnchor = undefined
      } else {
        sessionUpdates.returnToCheckAnswers = true
        if (beforeSession.checkAnswersReturnTarget) {
          sessionUpdates.checkAnswersReturnTarget = beforeSession.checkAnswersReturnTarget
        }
        if (beforeSession.checkAnswersReturnAnchor) {
          sessionUpdates.checkAnswersReturnAnchor = beforeSession.checkAnswersReturnAnchor
        }
      }
      setPredictorsAssessmentSession(sessionUpdates)
      return continueHref
    }

    sessionUpdates.returnToCheckAnswers = false
    sessionUpdates.checkAnswersReturnTarget = undefined
    sessionUpdates.checkAnswersReturnAnchor = undefined
    setPredictorsAssessmentSession(sessionUpdates)
    return resolveReturnHref()
  }

  setPredictorsAssessmentSession({
    ...merged,
    returnToCheckAnswers: false,
    checkAnswersReturnTarget: undefined,
    checkAnswersReturnAnchor: undefined,
    checkAnswersEditSnapshot: undefined
  })

  return nextHref
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
    const section = target.closest?.('.predictors-summary-section')
    const scrollTarget = section || target
    scrollTarget.scrollIntoView({ behavior: 'auto', block: 'start' })

    if (typeof target.focus === 'function' && target.matches?.('a.govuk-link, a')) {
      target.focus({ preventScroll: true })
    }
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
  if (!isProto2PredictorsPage()) return

  document.addEventListener('click', (event) => {
    const changeLink = event.target.closest('.govuk-summary-list__actions a.govuk-link')
    const href = changeLink?.getAttribute('href') || ''
    const from = getFromParamFromHref(href)

    if (!isFromCheckAnswersParam(from)) {
      return
    }

    const returnAnchor =
      changeLink.id || changeLink.closest('.predictors-summary-section')?.id || null
    startPredictorsCheckAnswersEdit(from, returnAnchor)
  })

  if (isPredictorsCheckAnswersEdit()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      if (link.id === 'predictors-a7-back' || link.id === 'predictors-a8-back' || link.id === 'predictors-b11-back') {
        return
      }
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
      link.href = withFromCheckAnswers(link.getAttribute('href') || 'a2b.html')
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
