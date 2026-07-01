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
  getDynamicTieringCheckAnswersHref,
  getTieringResultsAnswersHref,
  normaliseFields,
  tieringJourneyHref
} from './tiering-journey.js'
import { getTieringAssessmentSession, setTieringAssessmentSession } from './tiering-assessment-session.js'

export const TIERING_FROM_CHECK_ANSWERS = 'a7'
export const TIERING_FROM_DYNAMIC_CHECK_ANSWERS = 'b11'
export const TIERING_FROM_B11_STATIC = 'b11-static'
export const TIERING_FROM_B11_DYNAMIC = 'b11-dynamic'
const TIERING_FROM_CHECK_ANSWERS_LEGACY = 'a8'
export const TIERING_BACK_FROM_CHECK_ANSWERS = 'a7-back'
export const TIERING_BACK_FROM_DYNAMIC_CHECK_ANSWERS = 'b11-back'

const CHECK_ANSWERS_RETURN_A7 = 'a7'
const CHECK_ANSWERS_RETURN_B11 = 'b11'

const isProto2TieringPage = () => window.location.pathname.includes('/02/')

const isB11FromParam = (from) =>
  from === TIERING_FROM_DYNAMIC_CHECK_ANSWERS ||
  from === TIERING_BACK_FROM_DYNAMIC_CHECK_ANSWERS ||
  from === TIERING_FROM_B11_STATIC ||
  from === TIERING_FROM_B11_DYNAMIC

const isFromCheckAnswersParam = (from) =>
  from === TIERING_FROM_CHECK_ANSWERS ||
  isB11FromParam(from) ||
  from === TIERING_FROM_CHECK_ANSWERS_LEGACY

const getFromParamFromHref = (href = '') => {
  const match = href.match(/[?&]from=([^&#]+)/)
  return match?.[1] || null
}

export const getTieringCheckAnswersReturnHref = (session = getTieringAssessmentSession()) => {
  if (session.checkAnswersReturnTarget === CHECK_ANSWERS_RETURN_B11) {
    return getDynamicTieringCheckAnswersHref()
  }

  if (session.checkAnswersReturnTarget === CHECK_ANSWERS_RETURN_A7) {
    return getTieringResultsAnswersHref()
  }

  const from = new URLSearchParams(window.location.search).get('from')

  if (isB11FromParam(from)) {
    return getDynamicTieringCheckAnswersHref()
  }

  return getTieringResultsAnswersHref()
}

export const getActiveCheckAnswersFromParam = () => {
  const from = new URLSearchParams(window.location.search).get('from')

  if (isB11FromParam(from)) {
    return from === TIERING_FROM_B11_STATIC
      ? TIERING_FROM_B11_STATIC
      : from === TIERING_FROM_B11_DYNAMIC
        ? TIERING_FROM_B11_DYNAMIC
        : TIERING_FROM_DYNAMIC_CHECK_ANSWERS
  }

  if (
    from === TIERING_FROM_CHECK_ANSWERS ||
    from === TIERING_BACK_FROM_CHECK_ANSWERS ||
    from === TIERING_FROM_CHECK_ANSWERS_LEGACY
  ) {
    return TIERING_FROM_CHECK_ANSWERS
  }

  const target = getTieringAssessmentSession().checkAnswersReturnTarget
  return target === CHECK_ANSWERS_RETURN_B11
    ? TIERING_FROM_DYNAMIC_CHECK_ANSWERS
    : TIERING_FROM_CHECK_ANSWERS
}

export const TIERING_CHANGE_ANCHORS = {
  currentOffence: 'tiering-current-offence',
  convictionDate: 'tiering-conviction-date',
  firstSanctionAge: 'tiering-first-sanction-date',
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
  supervisedInCommunity: 'tiering-supervised-in-community',
  supervisedCommunityDate: 'tiering-supervised-community-date',
  offencesSinceCommunity: 'tiering-offences-since-community',
  recentOffenceDate: 'tiering-recent-offence-date',
  interviewDone: 'tiering-interview-done'
}

export const tieringChangeHref = (page, anchorId, from = TIERING_FROM_CHECK_ANSWERS) => {
  const hash = anchorId ? `#${anchorId}` : ''
  return `${page}?from=${from}${hash}`
}

/** Keep ?from= on internal links while editing from check answers */
export const withFromCheckAnswers = (page) => {
  if (!isTieringCheckAnswersEdit()) return page

  const fromParam = getActiveCheckAnswersFromParam()
  if (page.includes(`from=${fromParam}`)) return page

  const [path, hash = ''] = page.split('#')
  const separator = path.includes('?') ? '&' : '?'

  return `${path}${separator}from=${fromParam}${hash ? `#${hash}` : ''}`
}

export const shouldEnforceTieringJourneyOrder = () => !isTieringCheckAnswersEdit()

/** Redirect to an earlier page unless the user is editing from check answers */
export const redirectUnlessCheckAnswersEdit = (page) => {
  if (!shouldEnforceTieringJourneyOrder()) return false

  window.location.href = tieringJourneyHref(page)
  return true
}

export const isTieringCheckAnswersEditFromUrl = () =>
  isFromCheckAnswersParam(new URLSearchParams(window.location.search).get('from'))

export const isTieringBackNavigation = () => {
  const from = new URLSearchParams(window.location.search).get('from')
  if (from === TIERING_BACK_FROM_CHECK_ANSWERS || from === TIERING_BACK_FROM_DYNAMIC_CHECK_ANSWERS) {
    return true
  }

  const nav = performance.getEntriesByType('navigation')[0]
  return nav?.type === 'back_forward'
}

export const startTieringCheckAnswersEdit = (fromParam) => {
  const session = getTieringAssessmentSession()
  const from = fromParam || new URLSearchParams(window.location.search).get('from')
  const updates = { returnToCheckAnswers: true }

  if (isB11FromParam(from)) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_B11
  } else if (from === TIERING_FROM_CHECK_ANSWERS || from === TIERING_FROM_CHECK_ANSWERS_LEGACY) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_A7
  } else if (from === TIERING_BACK_FROM_CHECK_ANSWERS) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_A7
  } else if (session.checkAnswersReturnTarget) {
    updates.checkAnswersReturnTarget = session.checkAnswersReturnTarget
  } else if (window.location.pathname.includes('/02/b11')) {
    updates.checkAnswersReturnTarget = CHECK_ANSWERS_RETURN_B11
  }

  setTieringAssessmentSession(updates)

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
  setTieringAssessmentSession({
    returnToCheckAnswers: false,
    checkAnswersReturnTarget: undefined,
    checkAnswersEditSnapshot: undefined
  })
}

export const initTieringCheckAnswersEditFromUrl = () => {
  if (!isProto2TieringPage()) return

  const from = new URLSearchParams(window.location.search).get('from')
  if (isFromCheckAnswersParam(from)) {
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

const resolveContinueHref = (defaultHref, merged) =>
  typeof defaultHref === 'function' ? defaultHref(merged) : defaultHref

const isOpeningDynamicFromInterviewEdit = (currentPage, beforeSession, afterSession) =>
  currentPage === 'a6' &&
  beforeSession.interviewDone !== 'yes' &&
  afterSession.interviewDone === 'yes'

export const completeTieringPageAndContinue = (currentPage, defaultHref, newFields) => {
  ensureTieringCheckAnswersEditMode()

  const session = getTieringAssessmentSession()
  const beforeSession = { ...session }
  const wasEdit = session.returnToCheckAnswers === true
  const snapshot = session.checkAnswersEditSnapshot
  const changed =
    wasEdit && snapshot && newFields && fieldsChanged(snapshot, newFields)

  const merged = applyBranchingCleanup(currentPage, session, newFields)
  const nextHref = resolveContinueHref(defaultHref, merged)

  if (wasEdit) {
    const checkAnswersReturnHref = getTieringCheckAnswersReturnHref(beforeSession)
    const sessionUpdates = {
      ...merged,
      checkAnswersEditSnapshot: undefined
    }

    const resolveReturnHref = () =>
      getCheckAnswersReturnHrefAfterEdit(
        currentPage,
        beforeSession,
        merged,
        checkAnswersReturnHref
      )

    if (changed && isSection1Complete()) {
      clearSection1Complete()
    }

    // No change on this page – return to summary (do not continue forward in the journey)
    if (!changed) {
      sessionUpdates.returnToCheckAnswers = false
      sessionUpdates.checkAnswersReturnTarget = undefined
      setTieringAssessmentSession(sessionUpdates)

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
      } else {
        sessionUpdates.returnToCheckAnswers = true
        if (beforeSession.checkAnswersReturnTarget) {
          sessionUpdates.checkAnswersReturnTarget = beforeSession.checkAnswersReturnTarget
        }
      }
      setTieringAssessmentSession(sessionUpdates)
      return continueHref
    }

    sessionUpdates.returnToCheckAnswers = false
    sessionUpdates.checkAnswersReturnTarget = undefined
    setTieringAssessmentSession(sessionUpdates)
    return resolveReturnHref()
  }

  setTieringAssessmentSession({
    ...merged,
    returnToCheckAnswers: false,
    checkAnswersReturnTarget: undefined,
    checkAnswersEditSnapshot: undefined
  })

  return nextHref
}

export const getTieringBackLinkHref = (defaultHref) =>
  isTieringCheckAnswersEdit() ? getTieringCheckAnswersReturnHref() : defaultHref

const scrollDelayMs = (anchorId) =>
  anchorId === TIERING_CHANGE_ANCHORS.currentOffence ? 150 : 0

const isA8LegacyTabHash = (anchorId = window.location.hash.slice(1)) => {
  if (anchorId !== 'answers' && anchorId !== 'score') return false
  return Boolean(document.getElementById('tiering-a8-back'))
}

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
  if (!isProto2TieringPage()) return

  document.addEventListener('click', (event) => {
    const changeLink = event.target.closest('.govuk-summary-list__actions a.govuk-link')
    const href = changeLink?.getAttribute('href') || ''
    const from = getFromParamFromHref(href)

    if (!isFromCheckAnswersParam(from)) {
      return
    }

    startTieringCheckAnswersEdit(from)
  })

  if (isTieringCheckAnswersEdit()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      if (link.id === 'tiering-a7-back' || link.id === 'tiering-a8-back' || link.id === 'tiering-b11-back') {
        return
      }
      link.href = getTieringCheckAnswersReturnHref()
    })

    document.querySelectorAll('[data-tiering-offence-browse-link]').forEach((link) => {
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

    document.querySelectorAll('[data-tiering-return-to-a1]').forEach((link) => {
      link.href = withFromCheckAnswers(link.getAttribute('href') || 'a1.html')
    })
  }

  if (new URLSearchParams(window.location.search).get('focus') === 'offence-search') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    return
  }

  if (!window.location.hash) return

  if (isA8LegacyTabHash()) return

  scrollToTieringChangeTarget()
})
