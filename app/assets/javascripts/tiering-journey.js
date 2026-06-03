//
// Tiering journey routing and field helpers (branching, completeness)
//

import {
  formatDateFromParts,
  getDefaultConvictionDateParts,
  getDefaultFirstSanctionDateParts,
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'

const TIERING_JOURNEY_PATH = '/01/'

/** Absolute href for tiering pages (safe from index and /01/* routes) */
export const tieringJourneyHref = (page) => {
  if (!page) return TIERING_JOURNEY_PATH
  if (page.startsWith('/')) return page

  return `${TIERING_JOURNEY_PATH}${page}`
}

export const normaliseString = (value) => (value == null ? '' : String(value).trim())

export const normaliseDateParts = (date = {}) => ({
  day: normaliseString(date.day),
  month: normaliseString(date.month),
  year: normaliseString(date.year)
})

export const normaliseOffence = (offence) => {
  if (!offence?.id) return null

  return {
    id: normaliseString(offence.id),
    label: normaliseString(offence.label),
    code: normaliseString(offence.code),
    subcode: normaliseString(offence.subcode),
    fullCode: normaliseString(offence.fullCode)
  }
}

export const normaliseFields = (fields) => JSON.parse(JSON.stringify(fields))

export const fieldsChanged = (previousFields, newFields) =>
  JSON.stringify(normaliseFields(previousFields)) !== JSON.stringify(normaliseFields(newFields))

export const isDateComplete = (date) => {
  const parts = normaliseDateParts(date)
  return Boolean(parts.day && parts.month && parts.year)
}

const readDatePartsFromForm = (form, ids) =>
  normaliseDateParts({
    day: form.querySelector(ids.day)?.value,
    month: form.querySelector(ids.month)?.value,
    year: form.querySelector(ids.year)?.value
  })

/** Pre-populated dates shown in summary UI must still be saved to session */
export const resolveConvictionDateForSave = (form, session = getTieringAssessmentSession()) => {
  const fromForm = readDatePartsFromForm(form, {
    day: '#current-conviction-date-day',
    month: '#current-conviction-date-month',
    year: '#current-conviction-date-year'
  })

  if (isDateComplete(fromForm)) return fromForm

  const stored = normaliseDateParts(session.convictionDate || {})
  if (isDateComplete(stored)) return stored

  return getDefaultConvictionDateParts()
}

export const resolveFirstSanctionDateForSave = (form, session = getTieringAssessmentSession()) => {
  const fromForm = readDatePartsFromForm(form, {
    day: '#first-sanction-date-day',
    month: '#first-sanction-date-month',
    year: '#first-sanction-date-year'
  })

  if (isDateComplete(fromForm)) return fromForm

  const stored = normaliseDateParts(session.firstSanctionDate || {})
  if (isDateComplete(stored)) return stored

  return getDefaultFirstSanctionDateParts()
}

const A3_PROTOTYPE_DEFAULTS = {
  sexualMotivation: 'no',
  strangerContact: 'no',
  sexualSanctionDate: { day: '12', month: '8', year: '2021' },
  contactAdultSanctions: '2',
  contactChildSanctions: '1',
  indirectChildSanctions: '1',
  nonContactSanctions: '3'
}

/** Fill missing a3 answers when sexual history applies (matches on-focus autofill on a3) */
export const applyA3PrototypeDefaults = (fields, session = getTieringAssessmentSession()) => {
  if (session.sexualOffence !== 'yes') return fields

  const next = { ...fields }

  if (!next.sexualMotivation) next.sexualMotivation = A3_PROTOTYPE_DEFAULTS.sexualMotivation
  if (!next.strangerContact) next.strangerContact = A3_PROTOTYPE_DEFAULTS.strangerContact
  if (!isDateComplete(next.sexualSanctionDate)) {
    next.sexualSanctionDate = { ...A3_PROTOTYPE_DEFAULTS.sexualSanctionDate }
  }
  if (!normaliseString(next.contactAdultSanctions)) {
    next.contactAdultSanctions = A3_PROTOTYPE_DEFAULTS.contactAdultSanctions
  }
  if (!normaliseString(next.contactChildSanctions)) {
    next.contactChildSanctions = A3_PROTOTYPE_DEFAULTS.contactChildSanctions
  }
  if (!normaliseString(next.indirectChildSanctions)) {
    next.indirectChildSanctions = A3_PROTOTYPE_DEFAULTS.indirectChildSanctions
  }
  if (!normaliseString(next.nonContactSanctions)) {
    next.nonContactSanctions = A3_PROTOTYPE_DEFAULTS.nonContactSanctions
  }

  return next
}

/** Backfill prototype defaults before check answers when the user completed the static flow */
export const syncTieringSessionBeforeCheckAnswers = () => {
  const session = getTieringAssessmentSession()
  const updates = {}

  if (!isDateComplete(session.convictionDate)) {
    updates.convictionDate = getDefaultConvictionDateParts()
  }

  if (!isDateComplete(session.firstSanctionDate)) {
    updates.firstSanctionDate = getDefaultFirstSanctionDateParts()
  }

  if (!normaliseString(session.totalSanctions)) {
    updates.totalSanctions = '6'
  }

  if (!normaliseString(session.violentSanctions)) {
    updates.violentSanctions = '2'
  }

  if (session.sexualOffence === 'yes' && !isA3Complete(session)) {
    Object.assign(updates, applyA3PrototypeDefaults({}, session))
  }

  if (Object.keys(updates).length) {
    setTieringAssessmentSession(updates)
  }

  return { ...session, ...updates }
}

export const hasSeenStaticAssessmentComplete = (session = getTieringAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true

export const markStaticAssessmentCompleteSeen = () => {
  setTieringAssessmentSession({ staticAssessmentCompleteSeen: true })
}

/** After a5: first journey shows a6; return visits go to check answers or scores */
export const getPostA5ContinueHref = (session = getTieringAssessmentSession()) => {
  if (!hasSeenStaticAssessmentComplete(session)) {
    return 'a6.html'
  }

  return session.scoreCalculated ? 'a8.html' : 'a7.html'
}

/** Where repeat visitors to a6 should land (check answers or scores) */
export const getTieringReviewHref = (session = getTieringAssessmentSession()) =>
  session.scoreCalculated ? 'a8.html' : 'a7.html'

export const clearA3SessionFields = () => ({
  sexualMotivation: '',
  strangerContact: '',
  sexualSanctionDate: { day: '', month: '', year: '' },
  contactAdultSanctions: '',
  contactChildSanctions: '',
  indirectChildSanctions: '',
  nonContactSanctions: ''
})

export const clearA6SessionFields = () => ({
  recentOffenceDate: { day: '', month: '', year: '' }
})

export const isA3Complete = (session) => {
  if (session.sexualOffence !== 'yes') return true

  return (
    Boolean(session.sexualMotivation) &&
    Boolean(session.strangerContact) &&
    isDateComplete(session.sexualSanctionDate) &&
    normaliseString(session.contactAdultSanctions) !== '' &&
    normaliseString(session.contactChildSanctions) !== '' &&
    normaliseString(session.indirectChildSanctions) !== '' &&
    normaliseString(session.nonContactSanctions) !== ''
  )
}

export const isA2Complete = (session) =>
  Boolean(
    isDateComplete(session.firstSanctionDate) &&
      normaliseString(session.totalSanctions) &&
      normaliseString(session.violentSanctions) &&
      session.sexualOffence
  )

export const getFirstIncompleteTieringPage = (session) => {
  if (!session.currentOffence?.id) return 'a1.html'
  if (!isA2Complete(session)) return 'a2.html'
  if (!isA3Complete(session)) return 'a3.html'
  if (!isDateComplete(session.communityDate)) return 'a4.html'
  if (!session.offencesSinceCommunity) return 'a5.html'
  if (session.offencesSinceCommunity === 'yes' && !isDateComplete(session.recentOffenceDate)) {
    return 'a5.html'
  }
  return null
}

/** Redirect to the first incomplete page; returns true if a redirect was started */
export const redirectIfTieringJourneyIncomplete = (session) => {
  const currentPageId = document.querySelector('[data-tiering-telemetry-page]')?.dataset
    .tieringTelemetryPage

  // Only check answers (a7) and scores (a8) need full-journey validation – not a6
  if (currentPageId !== 'a7' && currentPageId !== 'a8') {
    return false
  }

  const page = getFirstIncompleteTieringPage(session)
  if (!page) return false

  window.location.href = tieringJourneyHref(page)
  return true
}

export const applyBranchingCleanup = (currentPage, session, updates) => {
  const merged = { ...session, ...updates }

  if (currentPage === 'a2' && merged.sexualOffence !== 'yes') {
    return { ...merged, ...clearA3SessionFields() }
  }

  if (currentPage === 'a5' && merged.offencesSinceCommunity !== 'yes') {
    return { ...merged, ...clearA6SessionFields() }
  }

  return merged
}

export const getPostCheckAnswersEditHref = (session) => getFirstIncompleteTieringPage(session) || 'a7.html'

/**
 * When editing from check answers (a7), only continue the journey for branching
 * changes that open a new required page — not for simple field updates (e.g. a4 date).
 */
export const getContinueHrefAfterCheckAnswersEdit = (currentPage, beforeSession, afterSession) => {
  if (currentPage === 'a2' && afterSession.sexualOffence === 'yes' && !isA3Complete(afterSession)) {
    return 'a3.html'
  }

  return null
}

export const getA1FieldsFromForm = (form) => {
  const offenceId = form.querySelector('[data-offence-selected-id]')?.value
  const offenceLabel = form.querySelector('[data-offence-selected-label]')?.textContent?.trim()
  const offenceCode = form.querySelector('[data-offence-selected-code]')?.value?.trim() || ''
  const offenceSubcode = form.querySelector('[data-offence-selected-subcode]')?.value?.trim() || ''

  return {
    currentOffence: normaliseOffence(
      offenceId
        ? {
            id: offenceId,
            label: offenceLabel,
            code: offenceCode,
            subcode: offenceSubcode,
            fullCode: offenceCode && offenceSubcode ? `${offenceCode}${offenceSubcode}` : offenceCode
          }
        : null
    ),
    convictionDate: resolveConvictionDateForSave(form)
  }
}

export const getA2FieldsFromForm = (form, session = getTieringAssessmentSession()) => ({
  firstSanctionDate: resolveFirstSanctionDateForSave(form, session),
  totalSanctions: normaliseString(form.querySelector('#total-sanctions')?.value),
  violentSanctions: normaliseString(form.querySelector('#violent-sanctions-other')?.value),
  sexualOffence: form.querySelector('input[name="sexual_offence"]:checked')?.value || ''
})

export const getA3FieldsFromForm = (form) => ({
  sexualMotivation: form.querySelector('input[name="sexual_motivation"]:checked')?.value || '',
  strangerContact: form.querySelector('input[name="stranger_contact"]:checked')?.value || '',
  sexualSanctionDate: normaliseDateParts({
    day: form.querySelector('#sexual-sanction-date-day')?.value,
    month: form.querySelector('#sexual-sanction-date-month')?.value,
    year: form.querySelector('#sexual-sanction-date-year')?.value
  }),
  contactAdultSanctions: normaliseString(form.querySelector('#contact-adult-sanctions')?.value),
  contactChildSanctions: normaliseString(form.querySelector('#contact-child-sanctions')?.value),
  indirectChildSanctions: normaliseString(form.querySelector('#indirect-child-sanctions')?.value),
  nonContactSanctions: normaliseString(form.querySelector('#non-contact-sanctions')?.value)
})

export const getA4FieldsFromForm = (form) => ({
  communityDate: normaliseDateParts({
    day: form.querySelector('#community-date-day')?.value,
    month: form.querySelector('#community-date-month')?.value,
    year: form.querySelector('#community-date-year')?.value
  })
})

export const getA5FieldsFromForm = (form) => ({
  offencesSinceCommunity: form.querySelector('input[name="offences_since_community"]:checked')?.value || '',
  recentOffenceDate: normaliseDateParts({
    day: form.querySelector('#recent-offence-date-day')?.value,
    month: form.querySelector('#recent-offence-date-month')?.value,
    year: form.querySelector('#recent-offence-date-year')?.value
  })
})

export const getA6FieldsFromForm = (form) => ({
  recentOffenceDate: normaliseDateParts({
    day: form.querySelector('#recent-offence-date-day')?.value,
    month: form.querySelector('#recent-offence-date-month')?.value,
    year: form.querySelector('#recent-offence-date-year')?.value
  })
})

/** Questions required for the journey that are missing from session storage */
export const getUnansweredTieringQuestions = (session, offenderFirstName = 'Alex') => {
  const name = offenderFirstName
  const unanswered = []

  const add = (pageId, pageLabel, question) => {
    unanswered.push({ pageId, pageLabel, question })
  }

  if (!session.currentOffence?.id) {
    add('a1', 'Current offence', `What is ${name}'s current offence?`)
  }
  if (!isDateComplete(session.convictionDate)) {
    add('a1', 'Current offence', `What is the date of ${name}'s current conviction?`)
  }

  if (!isDateComplete(session.firstSanctionDate)) {
    add('a2', 'Offending history', `What is the date of ${name}'s first sanction?`)
  }
  if (!normaliseString(session.totalSanctions)) {
    add('a2', 'Offending history', `How many sanctions does ${name} have in total for all offences?`)
  }
  if (!normaliseString(session.violentSanctions)) {
    add(
      'a2',
      'Offending history',
      `How many of ${name}'s total sanctions involved violent offences?`
    )
  }
  if (!session.sexualOffence) {
    add(
      'a2',
      'Offending history',
      `Has ${name} ever committed a sexual or sexually motivated offence?`
    )
  }

  if (session.sexualOffence === 'yes') {
    if (!session.sexualMotivation) {
      add(
        'a3',
        'Sexual offending',
        `Does ${name}'s current offence have a sexual motivation?`
      )
    }
    if (!session.strangerContact) {
      add(
        'a3',
        'Sexual offending',
        `Does ${name}'s current offence involve actual or attempted direct contact against a victim who was a stranger?`
      )
    }
    if (!isDateComplete(session.sexualSanctionDate)) {
      add(
        'a3',
        'Sexual offending',
        `What is the date of ${name}'s most recent sanction involving a sexual or sexually motivated offence?`
      )
    }
    if (normaliseString(session.contactAdultSanctions) === '') {
      add(
        'a3',
        'Sexual offending',
        `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`
      )
    }
    if (normaliseString(session.contactChildSanctions) === '') {
      add(
        'a3',
        'Sexual offending',
        `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`
      )
    }
    if (normaliseString(session.indirectChildSanctions) === '') {
      add(
        'a3',
        'Sexual offending',
        `How many sanctions does ${name} have for indecent child image or indirect contact child sexual or sexually motivated offences?`
      )
    }
    if (normaliseString(session.nonContactSanctions) === '') {
      add(
        'a3',
        'Sexual offending',
        `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`
      )
    }
  }

  if (!isDateComplete(session.communityDate)) {
    add(
      'a4',
      'Community date',
      `What is the earliest date ${name} could next be in the community once they've received their sentence?`
    )
  }

  if (!session.offencesSinceCommunity) {
    const communityDateLabel = formatDateFromParts(session.communityDate || {}) || 'that date'
    add(
      'a5',
      'Offences since community date',
      `Since ${communityDateLabel}, has ${name} committed any offences?`
    )
  }

  if (session.offencesSinceCommunity === 'yes' && !isDateComplete(session.recentOffenceDate)) {
    add('a5', 'Offences since community date', `What is the date of ${name}'s most recent offence?`)
  }

  return unanswered
}
