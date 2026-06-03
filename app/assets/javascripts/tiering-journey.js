//
// Tiering journey routing and field helpers (branching, completeness)
//

import {
  formatDateFromParts,
  getDefaultConvictionDateParts,
  getDefaultFirstSanctionAge,
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
    fullCode: normaliseString(offence.fullCode),
    isViolentOffence: offence.isViolentOffence === true
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

  const inputOnlyConvictionDate = Boolean(form.querySelector('[data-conviction-date-input-only]'))
  if (inputOnlyConvictionDate) return fromForm

  if (isDateComplete(fromForm)) return fromForm

  const stored = normaliseDateParts(session.convictionDate || {})
  if (isDateComplete(stored)) return stored

  return getDefaultConvictionDateParts()
}

export const resolveFirstSanctionAgeForSave = (form, session = getTieringAssessmentSession()) => {
  const fromForm = normaliseString(form.querySelector('#first-sanction-age')?.value)
  if (fromForm) return fromForm

  const stored = normaliseString(session.firstSanctionAge)
  if (stored) return stored

  return getDefaultFirstSanctionAge()
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

const PROTOTYPE_DEFAULT_CURRENT_OFFENCE = {
  id: '04600',
  label: 'Stealing from shops and stalls (shoplifting)',
  code: '046',
  subcode: '00',
  fullCode: '04600'
}

const PROTOTYPE_DEFAULT_COMMUNITY_DATE = { day: '24', month: '7', year: '2026' }

const getDefaultRecentOffenceDateParts = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)

  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear())
  }
}

/** Fill missing sexual offending answers when continuing without input */
export const applyA3SexualOffendingDefaults = (fields, session = getTieringAssessmentSession()) => {
  if (session.sexualOffence !== 'yes') return fields

  const next = { ...fields }

  if (!next.sexualMotivation) next.sexualMotivation = A3_PROTOTYPE_DEFAULTS.sexualMotivation
  if (!next.strangerContact) next.strangerContact = A3_PROTOTYPE_DEFAULTS.strangerContact
  if (!isDateComplete(next.sexualSanctionDate)) {
    next.sexualSanctionDate = { ...A3_PROTOTYPE_DEFAULTS.sexualSanctionDate }
  }

  return next
}

/** Fill missing direct contact answers when continuing without input */
export const applyA3DirectContactDefaults = (fields, session = getTieringAssessmentSession()) => {
  if (session.sexualOffence !== 'yes') return fields

  const next = { ...fields }

  if (!normaliseString(next.contactAdultSanctions)) {
    next.contactAdultSanctions = A3_PROTOTYPE_DEFAULTS.contactAdultSanctions
  }
  if (!normaliseString(next.contactChildSanctions)) {
    next.contactChildSanctions = A3_PROTOTYPE_DEFAULTS.contactChildSanctions
  }

  return next
}

/** Fill missing indirect contact answers when continuing without input */
export const applyA3IndirectContactDefaults = (fields, session = getTieringAssessmentSession()) => {
  if (session.sexualOffence !== 'yes') return fields

  const next = { ...fields }

  if (!normaliseString(next.indirectChildSanctions)) {
    next.indirectChildSanctions = A3_PROTOTYPE_DEFAULTS.indirectChildSanctions
  }
  if (!normaliseString(next.nonContactSanctions)) {
    next.nonContactSanctions = A3_PROTOTYPE_DEFAULTS.nonContactSanctions
  }

  return next
}

/** Fill missing a3 answers when sexual history applies */
export const applyA3PrototypeDefaults = (fields, session = getTieringAssessmentSession()) =>
  applyA3IndirectContactDefaults(
    applyA3DirectContactDefaults(applyA3SexualOffendingDefaults(fields, session), session),
    session
  )

/** Backfill prototype defaults before check answers or scores */
export const syncTieringSessionBeforeCheckAnswers = () => {
  const session = getTieringAssessmentSession()
  const updates = {}

  if (!session.currentOffence?.id) {
    updates.currentOffence = { ...PROTOTYPE_DEFAULT_CURRENT_OFFENCE }
  }

  if (!isDateComplete(session.convictionDate)) {
    updates.convictionDate = getDefaultConvictionDateParts()
  }

  if (!normaliseString(session.firstSanctionAge)) {
    updates.firstSanctionAge = getDefaultFirstSanctionAge()
  }

  if (!normaliseString(session.totalSanctions)) {
    updates.totalSanctions = '6'
  }

  if (!normaliseString(session.violentSanctions)) {
    updates.violentSanctions = '2'
  }

  if (!session.sexualOffence) {
    updates.sexualOffence = 'no'
  }

  if (!isDateComplete(session.communityDate)) {
    updates.communityDate = { ...PROTOTYPE_DEFAULT_COMMUNITY_DATE }
  }

  if (!session.offencesSinceCommunity) {
    updates.offencesSinceCommunity = 'no'
  }

  const merged = { ...session, ...updates }
  const offencesSinceCommunity = merged.offencesSinceCommunity

  if (offencesSinceCommunity === 'yes' && !isDateComplete(merged.recentOffenceDate)) {
    updates.recentOffenceDate = getDefaultRecentOffenceDateParts()
  }

  if (merged.sexualOffence === 'yes' && !isA3Complete(merged)) {
    Object.assign(updates, applyA3PrototypeDefaults({}, merged))
  }

  if (Object.keys(updates).length) {
    setTieringAssessmentSession(updates)
  }

  return { ...session, ...updates }
}

/** After a5: first journey shows a6; return visits go to check answers or scores */
export const hasSeenStaticAssessmentComplete = (session = getTieringAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true

export const markStaticAssessmentCompleteSeen = () => {
  setTieringAssessmentSession({ staticAssessmentCompleteSeen: true })
}

export const getTieringResultsAnswersHref = () => 'a8.html#answers'

export const getPostA5ContinueHref = (session = getTieringAssessmentSession()) => {
  if (!hasSeenStaticAssessmentComplete(session)) {
    return 'a6.html'
  }

  return getTieringResultsAnswersHref()
}

/** Where repeat visitors to a6 should land */
export const getTieringReviewHref = () => getTieringResultsAnswersHref()

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

export const isA3SexualOffendingComplete = (session) => {
  if (session.sexualOffence !== 'yes') return true

  return (
    Boolean(session.sexualMotivation) &&
    Boolean(session.strangerContact) &&
    isDateComplete(session.sexualSanctionDate)
  )
}

export const isA3DirectContactComplete = (session) => {
  if (session.sexualOffence !== 'yes') return true

  return (
    normaliseString(session.contactAdultSanctions) !== '' &&
    normaliseString(session.contactChildSanctions) !== ''
  )
}

export const isA3IndirectContactComplete = (session) => {
  if (session.sexualOffence !== 'yes') return true

  return (
    normaliseString(session.indirectChildSanctions) !== '' &&
    normaliseString(session.nonContactSanctions) !== ''
  )
}

export const isA3Complete = (session) =>
  isA3SexualOffendingComplete(session) &&
  isA3DirectContactComplete(session) &&
  isA3IndirectContactComplete(session)

export const getFirstIncompleteA3Page = (session) => {
  if (session.sexualOffence !== 'yes') return null
  if (!isA3SexualOffendingComplete(session)) return 'a3.html'
  if (!isA3DirectContactComplete(session)) return 'a3dc.html'
  if (!isA3IndirectContactComplete(session)) return 'a3ic.html'
  return null
}

export const isA2Complete = (session) =>
  Boolean(
    normaliseString(session.firstSanctionAge) &&
      normaliseString(session.totalSanctions) &&
      normaliseString(session.violentSanctions) &&
      session.sexualOffence
  )

export const getFirstIncompleteTieringPage = (session) => {
  if (!session.currentOffence?.id) return 'a1.html'
  if (!isA2Complete(session)) return 'a2.html'
  if (!isA3Complete(session)) return getFirstIncompleteA3Page(session) || 'a3.html'
  if (!isDateComplete(session.communityDate)) return 'a4.html'
  if (!session.offencesSinceCommunity) return 'a5.html'
  if (session.offencesSinceCommunity === 'yes' && !isDateComplete(session.recentOffenceDate)) {
    return 'a5.html'
  }
  return null
}

/** Redirect to the first incomplete page; returns true if a redirect was started */
export const redirectIfTieringJourneyIncomplete = () => {
  const currentPageId = document.querySelector('[data-tiering-telemetry-page]')?.dataset
    .tieringTelemetryPage

  // Only a8 (answers/scores) needs full-journey validation; a7 redirects to a8
  if (currentPageId !== 'a7' && currentPageId !== 'a8') {
    return false
  }

  const session = syncTieringSessionBeforeCheckAnswers()
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

export const getPostCheckAnswersEditHref = (session) =>
  getFirstIncompleteTieringPage(session) || getTieringResultsAnswersHref()

/**
 * When editing from check answers (a8), only continue the journey for branching
 * changes that open a new required page — not for simple field updates (e.g. a4 date).
 */
export const getContinueHrefAfterCheckAnswersEdit = (currentPage, beforeSession, afterSession) => {
  if (currentPage === 'a2' && afterSession.sexualOffence === 'yes' && !isA3Complete(afterSession)) {
    return getFirstIncompleteA3Page(afterSession) || 'a3.html'
  }

  return null
}

export const getA1FieldsFromForm = (form, session = getTieringAssessmentSession()) => {
  const offenceId = form.querySelector('[data-offence-selected-id]')?.value
  const offenceLabel = form.querySelector('[data-offence-selected-label]')?.textContent?.trim()
  const offenceCode = form.querySelector('[data-offence-selected-code]')?.value?.trim() || ''
  const offenceSubcode = form.querySelector('[data-offence-selected-subcode]')?.value?.trim() || ''

  const fromForm = normaliseOffence(
    offenceId
      ? {
          id: offenceId,
          label: offenceLabel,
          code: offenceCode,
          subcode: offenceSubcode,
          fullCode: offenceCode && offenceSubcode ? `${offenceCode}${offenceSubcode}` : offenceCode
        }
      : null
  )

  return {
    currentOffence: fromForm?.id ? fromForm : normaliseOffence(session.currentOffence),
    convictionDate: resolveConvictionDateForSave(form, session)
  }
}

export const getA2FieldsFromForm = (form, session = getTieringAssessmentSession()) => ({
  firstSanctionAge: resolveFirstSanctionAgeForSave(form, session),
  totalSanctions: normaliseString(form.querySelector('#total-sanctions')?.value),
  violentSanctions: normaliseString(form.querySelector('#violent-sanctions-other')?.value),
  sexualOffence: form.querySelector('input[name="sexual_offence"]:checked')?.value || ''
})

export const getA3SexualOffendingFieldsFromForm = (form) => ({
  sexualMotivation: form.querySelector('input[name="sexual_motivation"]:checked')?.value || '',
  strangerContact: form.querySelector('input[name="stranger_contact"]:checked')?.value || '',
  sexualSanctionDate: normaliseDateParts({
    day: form.querySelector('#sexual-sanction-date-day')?.value,
    month: form.querySelector('#sexual-sanction-date-month')?.value,
    year: form.querySelector('#sexual-sanction-date-year')?.value
  })
})

export const getA3DirectContactFieldsFromForm = (form) => ({
  contactAdultSanctions: normaliseString(form.querySelector('#contact-adult-sanctions')?.value),
  contactChildSanctions: normaliseString(form.querySelector('#contact-child-sanctions')?.value)
})

export const getA3IndirectContactFieldsFromForm = (form) => ({
  indirectChildSanctions: normaliseString(form.querySelector('#indirect-child-sanctions')?.value),
  nonContactSanctions: normaliseString(form.querySelector('#non-contact-sanctions')?.value)
})

export const getA3FieldsFromForm = (form) => ({
  ...getA3SexualOffendingFieldsFromForm(form),
  ...getA3DirectContactFieldsFromForm(form),
  ...getA3IndirectContactFieldsFromForm(form)
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

  if (!normaliseString(session.firstSanctionAge)) {
    add('a2', 'Offending history', `What was ${name}'s age at first sanction?`)
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
        'a3dc',
        'Direct contact',
        `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`
      )
    }
    if (normaliseString(session.contactChildSanctions) === '') {
      add(
        'a3dc',
        'Direct contact',
        `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`
      )
    }
    if (normaliseString(session.indirectChildSanctions) === '') {
      add(
        'a3ic',
        'Indirect contact',
        `How many sanctions does ${name} have for indecent child image or indirect contact child sexual or sexually motivated offences?`
      )
    }
    if (normaliseString(session.nonContactSanctions) === '') {
      add(
        'a3ic',
        'Indirect contact',
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
