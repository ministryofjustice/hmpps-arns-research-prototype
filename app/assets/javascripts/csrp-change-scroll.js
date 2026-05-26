//
// Scroll to a question when arriving from a7 "Change" link (URL hash)
// Save and continue returns to a7 or next required page when editing from check answers
//

import {
  applyBranchingCleanup,
  fieldsChanged,
  getFirstIncompleteCsrpPage,
  normaliseFields
} from './csrp-journey.js'
import { getCsrpAssessmentSession, setCsrpAssessmentSession } from './csrp-assessment-session.js'

export const CSRP_FROM_CHECK_ANSWERS = 'a7'

export const CSRP_CHANGE_ANCHORS = {
  currentOffence: 'csrp-current-offence',
  convictionDate: 'csrp-conviction-date',
  firstSanctionAge: 'csrp-first-sanction-age',
  totalSanctions: 'csrp-total-sanctions',
  violentSanctions: 'csrp-violent-sanctions',
  sexualOffence: 'csrp-sexual-offence',
  sexualMotivation: 'csrp-sexual-motivation',
  strangerContact: 'csrp-stranger-contact',
  sexualSanctionDate: 'csrp-sexual-sanction-date',
  contactAdultSanctions: 'csrp-contact-adult-sanctions',
  contactChildSanctions: 'csrp-contact-child-sanctions',
  indirectChildSanctions: 'csrp-indirect-child-sanctions',
  nonContactSanctions: 'csrp-non-contact-sanctions',
  communityDate: 'csrp-community-date',
  offencesSinceCommunity: 'csrp-offences-since-community',
  recentOffenceDate: 'csrp-recent-offence-date'
}

export const csrpChangeHref = (page, anchorId) => {
  const hash = anchorId ? `#${anchorId}` : ''
  return `${page}?from=${CSRP_FROM_CHECK_ANSWERS}${hash}`
}

/** Keep ?from=a7 on internal links while editing from check answers */
export const withFromCheckAnswers = (page) => {
  if (!isCsrpCheckAnswersEdit()) return page
  if (page.includes(`from=${CSRP_FROM_CHECK_ANSWERS}`)) return page

  const [path, hash = ''] = page.split('#')
  const separator = path.includes('?') ? '&' : '?'
  const query = `${separator}from=${CSRP_FROM_CHECK_ANSWERS}`

  return `${path}${query}${hash ? `#${hash}` : ''}`
}

export const isCsrpCheckAnswersEdit = () =>
  getCsrpAssessmentSession().returnToCheckAnswers === true

export const startCsrpCheckAnswersEdit = () => {
  setCsrpAssessmentSession({ returnToCheckAnswers: true })
}

export const clearCsrpCheckAnswersEdit = () => {
  setCsrpAssessmentSession({ returnToCheckAnswers: false })
}

export const initCsrpCheckAnswersEditFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('from') === CSRP_FROM_CHECK_ANSWERS) {
    startCsrpCheckAnswersEdit()
  }
}

export const captureCheckAnswersEditSnapshot = (fields) => {
  if (!isCsrpCheckAnswersEdit()) return

  setCsrpAssessmentSession({
    checkAnswersEditSnapshot: normaliseFields(fields)
  })
}

export const completeCsrpPageAndContinue = (currentPage, defaultHref, newFields) => {
  const session = getCsrpAssessmentSession()
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

    // No change on this page – return to summary (do not continue forward in the journey)
    if (!changed) {
      sessionUpdates.returnToCheckAnswers = false
      setCsrpAssessmentSession(sessionUpdates)
      return 'a7.html'
    }

    const nextIncomplete = getFirstIncompleteCsrpPage(merged)

    // Changed but another page is now required (e.g. sexual offence → yes needs a3)
    if (nextIncomplete) {
      sessionUpdates.returnToCheckAnswers = true
      setCsrpAssessmentSession(sessionUpdates)
      return nextIncomplete
    }

    sessionUpdates.returnToCheckAnswers = false
    setCsrpAssessmentSession(sessionUpdates)
    return 'a7.html'
  }

  setCsrpAssessmentSession({
    ...merged,
    returnToCheckAnswers: false,
    checkAnswersEditSnapshot: undefined
  })

  return defaultHref
}

export const getCsrpBackLinkHref = (defaultHref) =>
  isCsrpCheckAnswersEdit() ? 'a7.html' : defaultHref

const scrollDelayMs = (anchorId) =>
  anchorId === CSRP_CHANGE_ANCHORS.currentOffence ? 150 : 0

export const scrollToCsrpChangeTarget = (anchorId = window.location.hash.slice(1)) => {
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
  initCsrpCheckAnswersEditFromUrl()

  if (isCsrpCheckAnswersEdit()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      if (link.id === 'csrp-a7-back') return
      link.href = 'a7.html'
    })

    document.querySelectorAll('[data-csrp-offence-browse-link]').forEach((link) => {
      link.href = withFromCheckAnswers(link.getAttribute('href') || 'a1o.html')
    })

    document.querySelectorAll('[data-csrp-return-to-a1]').forEach((link) => {
      link.href = withFromCheckAnswers(link.getAttribute('href') || 'a1.html')
    })
  }

  if (!window.location.hash) return
  scrollToCsrpChangeTarget()
})
