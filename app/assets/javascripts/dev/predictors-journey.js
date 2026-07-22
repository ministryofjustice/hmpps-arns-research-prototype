//
// Predictors journey routing and field helpers (branching, completeness)
//
// Dev static journey: a2b → a3 (if sexual) → a4 → a5 (if needed) → a7 → a8
//

import {
  formatDateFromParts,
  getDefaultConvictionDateParts,
  getDefaultFirstSanctionAge,
  getDefaultFirstSanctionDateParts,
  getOffenderDateOfBirthParts,
  getPredictorsAssessmentSession,
  setPredictorsAssessmentSession
} from './predictors-assessment-session.js'
import { lookupOffenceDetails } from './predictors-offence-lookup.js'

const PREDICTORS_JOURNEY_PATH = '/dev/'

/** Absolute href for predictors pages (safe from index and /dev/* routes) */
export const predictorsJourneyHref = (page) => {
  if (!page) return PREDICTORS_JOURNEY_PATH
  if (page.startsWith('/')) return page

  return `${PREDICTORS_JOURNEY_PATH}${page}`
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

export const enrichOffenceFromLookup = (offence) => {
  const normalised = normaliseOffence(offence)
  if (!normalised?.id || normalised.label) return normalised

  const details = lookupOffenceDetails(normalised.id)
  if (!details) return normalised

  return normaliseOffence({
    ...normalised,
    label: details.label,
    code: normalised.code || details.code,
    subcode: normalised.subcode || details.subcode,
    fullCode: normalised.fullCode || details.fullCode,
    isViolentOffence: normalised.isViolentOffence || details.isViolentOffence
  })
}

export const normaliseFields = (fields) => JSON.parse(JSON.stringify(fields))

export const fieldsChanged = (previousFields, newFields) =>
  JSON.stringify(normaliseFields(previousFields)) !== JSON.stringify(normaliseFields(newFields))

export const isDateComplete = (date) => {
  const parts = normaliseDateParts(date)
  return Boolean(parts.day && parts.month && parts.year)
}

export const isValidDateParts = (date) => {
  const parts = normaliseDateParts(date)
  if (!isDateComplete(parts)) return false

  const day = parseInt(parts.day, 10)
  const month = parseInt(parts.month, 10)
  const year = parseInt(parts.year, 10)

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false
  if (month < 1 || month > 12 || day < 1 || year < 1000) return false

  const parsed = new Date(year, month - 1, day)

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  )
}

export const calculateAgeOnDate = (dateOfBirth, targetDate) => {
  if (!isValidDateParts(dateOfBirth) || !isValidDateParts(targetDate)) return null

  const dob = new Date(
    parseInt(dateOfBirth.year, 10),
    parseInt(dateOfBirth.month, 10) - 1,
    parseInt(dateOfBirth.day, 10)
  )
  const target = new Date(
    parseInt(targetDate.year, 10),
    parseInt(targetDate.month, 10) - 1,
    parseInt(targetDate.day, 10)
  )

  let age = target.getFullYear() - dob.getFullYear()
  const birthdayNotYetThisYear =
    target.getMonth() < dob.getMonth() ||
    (target.getMonth() === dob.getMonth() && target.getDate() < dob.getDate())

  if (birthdayNotYetThisYear) age -= 1

  return age >= 0 ? age : null
}

const readDatePartsFromForm = (form, ids) =>
  normaliseDateParts({
    day: form.querySelector(ids.day)?.value,
    month: form.querySelector(ids.month)?.value,
    year: form.querySelector(ids.year)?.value
  })

/** Pre-populated dates shown in summary UI must still be saved to session */
export const resolveConvictionDateForSave = (form, session = getPredictorsAssessmentSession()) => {
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

export const resolveFirstSanctionDateForSave = (form, session = getPredictorsAssessmentSession()) => {
  const fromForm = normaliseDateParts({
    day: form.querySelector('#first-sanction-date-day')?.value,
    month: form.querySelector('#first-sanction-date-month')?.value,
    year: form.querySelector('#first-sanction-date-year')?.value
  })

  if (isDateComplete(fromForm)) return fromForm

  const stored = normaliseDateParts(session.firstSanctionDate || {})
  if (isDateComplete(stored)) return stored

  return { day: '', month: '', year: '' }
}

export const resolveFirstSanctionAgeForSave = (form, session = getPredictorsAssessmentSession()) => {
  const firstSanctionDate = resolveFirstSanctionDateForSave(form, session)
  const dateOfBirth = getOffenderDateOfBirthParts()

  if (isValidDateParts(firstSanctionDate)) {
    const age = calculateAgeOnDate(dateOfBirth, firstSanctionDate)
    if (age != null) return String(age)
  }

  const stored = normaliseString(session.firstSanctionAge)
  if (stored) return stored

  return ''
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

export const PROTOTYPE_DEFAULT_CURRENT_OFFENCE = {
  id: '00842',
  label: 'Religiously aggravated common assault',
  code: '008',
  subcode: '42',
  fullCode: '00842',
  isViolentOffence: true
}

const PROTOTYPE_DEFAULT_COMMUNITY_DATE = { day: '2', month: '5', year: '2015' }

export const getDefaultCommunityDateParts = () => ({ ...PROTOTYPE_DEFAULT_COMMUNITY_DATE })

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
export const applyA3SexualOffendingDefaults = (fields, session = getPredictorsAssessmentSession()) => {
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
export const applyA3DirectContactDefaults = (fields, session = getPredictorsAssessmentSession()) => {
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
export const applyA3IndirectContactDefaults = (fields, session = getPredictorsAssessmentSession()) => {
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
export const applyA3PrototypeDefaults = (fields, session = getPredictorsAssessmentSession()) =>
  applyA3IndirectContactDefaults(
    applyA3DirectContactDefaults(applyA3SexualOffendingDefaults(fields, session), session),
    session
  )

/** Backfill prototype defaults before check answers or scores */
export const syncPredictorsSessionBeforeCheckAnswers = () => {
  const session = getPredictorsAssessmentSession()
  const updates = {}

  if (!session.currentOffence?.id) {
    updates.currentOffence = { ...PROTOTYPE_DEFAULT_CURRENT_OFFENCE }
  } else {
    const enrichedOffence = enrichOffenceFromLookup(session.currentOffence)
    if (enrichedOffence?.label && enrichedOffence.label !== session.currentOffence.label) {
      updates.currentOffence = enrichedOffence
    }
  }

  if (!isDateComplete(session.convictionDate)) {
    updates.convictionDate = getDefaultConvictionDateParts()
  }

  if (!isDateComplete(session.firstSanctionDate) && !normaliseString(session.firstSanctionAge)) {
    updates.firstSanctionDate = getDefaultFirstSanctionDateParts()
    updates.firstSanctionAge = getDefaultFirstSanctionAge()
  } else if (isDateComplete(session.firstSanctionDate) && !normaliseString(session.firstSanctionAge)) {
    const age = calculateAgeOnDate(getOffenderDateOfBirthParts(), session.firstSanctionDate)
    if (age != null) updates.firstSanctionAge = String(age)
  } else if (!normaliseString(session.firstSanctionAge)) {
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

  if (!session.supervisedInCommunity) {
    updates.supervisedInCommunity = 'yes'
  }

  if (!isDateComplete(session.communityDate)) {
    updates.communityDate = { ...PROTOTYPE_DEFAULT_COMMUNITY_DATE }
  }

  if (!session.offencesSinceCommunity && isA5Required({ ...session, ...updates })) {
    updates.offencesSinceCommunity = 'no'
  }

  const merged = { ...session, ...updates }
  const offencesSinceCommunity = merged.offencesSinceCommunity

  if (offencesSinceCommunity === 'yes' && !isDateComplete(merged.recentOffenceDate)) {
    updates.recentOffenceDate = getDefaultRecentOffenceDateParts()
  }

  if (merged.sexualOffence === 'yes' && !isA3Complete(merged) && session.returnToCheckAnswers !== true) {
    Object.assign(updates, applyA3PrototypeDefaults({}, merged))
  }

  if (Object.keys(updates).length) {
    setPredictorsAssessmentSession(updates)
  }

  return { ...session, ...updates }
}

/** After a5: journey continues to check answers */
export const hasSeenStaticAssessmentComplete = (session = getPredictorsAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true

export const markStaticAssessmentCompleteSeen = () => {
  setPredictorsAssessmentSession({ staticAssessmentCompleteSeen: true })
}

export const getPredictorsResultsAnswersHref = () => 'a7.html'

export const getPredictorsResultsScoresHref = () => 'a8.html'

export const getPostA5ContinueHref = () => getPredictorsResultsAnswersHref()

export const clearA3SessionFields = () => ({
  sexualMotivation: '',
  strangerContact: '',
  sexualSanctionDate: { day: '', month: '', year: '' },
  contactAdultSanctions: '',
  contactChildSanctions: '',
  indirectChildSanctions: '',
  nonContactSanctions: ''
})

export const clearRecentOffenceDateFields = () => ({
  recentOffenceDate: { day: '', month: '', year: '' }
})

export const isA5Required = (session) => isDateComplete(session.communityDate)

export const getPostA4ContinueHref = (session = getPredictorsAssessmentSession()) =>
  isA5Required(session) ? 'a5.html' : getPredictorsResultsAnswersHref()

export const getA7BackHref = (session = getPredictorsAssessmentSession()) =>
  isA5Required(session) ? 'a5.html' : 'a4.html'

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
  if (!isA3Complete(session)) return 'a3.html'
  return null
}

export const isA2Complete = (session) =>
  Boolean(
    (isDateComplete(session.firstSanctionDate) || normaliseString(session.firstSanctionAge)) &&
      normaliseString(session.totalSanctions) &&
      normaliseString(session.violentSanctions) &&
      session.sexualOffence
  )

export const isA4Complete = (session) => isDateComplete(session.communityDate)

export const getFirstIncompletePredictorsPage = (session) => {
  if (!session.currentOffence?.id || !isA2Complete(session)) return 'a2b.html'
  if (!isA3Complete(session)) return getFirstIncompleteA3Page(session) || 'a3.html'
  if (!isA4Complete(session)) return 'a4.html'
  if (isA5Required(session)) {
    if (!session.offencesSinceCommunity) return 'a5.html'
    if (session.offencesSinceCommunity === 'yes' && !isDateComplete(session.recentOffenceDate)) {
      return 'a5.html'
    }
  }
  return null
}

/** Redirect to the first incomplete page; returns true if a redirect was started */
export const redirectIfPredictorsJourneyIncomplete = () => {
  if (!window.location.pathname.includes('/dev/')) return false

  const currentPageId = window.location.pathname.match(/\/([^/]+)\.html?$/)?.[1]

  // a7 (check your answers) validates the journey is complete first
  if (currentPageId !== 'a7') {
    return false
  }

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const page = getFirstIncompletePredictorsPage(session)
  if (!page) return false

  window.location.href = predictorsJourneyHref(page)
  return true
}

export const applyBranchingCleanup = (currentPage, session, updates) => {
  const merged = { ...session, ...updates }

  if (currentPage === 'a2' && merged.sexualOffence !== 'yes') {
    return { ...merged, ...clearA3SessionFields() }
  }

  if (currentPage === 'a5' && merged.offencesSinceCommunity !== 'yes') {
    return { ...merged, ...clearRecentOffenceDateFields() }
  }

  return merged
}

export const getPostCheckAnswersEditHref = (session) =>
  getFirstIncompletePredictorsPage(session) || getPredictorsResultsAnswersHref()

/**
 * When editing from check answers (a8), only continue the journey for branching
 * changes that open a new required page — not for simple field updates (e.g. a4 date).
 */
export const getContinueHrefAfterCheckAnswersEdit = (currentPage, beforeSession, afterSession) => {
  if (currentPage === 'a2' && afterSession.sexualOffence === 'yes' && !isA3Complete(afterSession)) {
    return getFirstIncompleteA3Page(afterSession) || 'a3.html'
  }

  if (currentPage === 'a3' && afterSession.sexualOffence === 'yes') {
    return getFirstIncompletePredictorsPage(afterSession)
  }

  if (currentPage === 'a5') {
    return getFirstIncompletePredictorsPage(afterSession)
  }

  return null
}

export const getA1FieldsFromForm = (form, session = getPredictorsAssessmentSession()) => {
  const offenceId = form.querySelector('[data-offence-selected-id]')?.value
  const offenceLabel =
    form.querySelector('[data-offence-selected-label]')?.textContent?.trim() ||
    form.querySelector('[data-offence-summary-card-title]')?.textContent?.trim() ||
    ''
  const offenceCode = form.querySelector('[data-offence-selected-code]')?.value?.trim() || ''
  const offenceSubcode = form.querySelector('[data-offence-selected-subcode]')?.value?.trim() || ''

  const fromForm = enrichOffenceFromLookup(
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
    currentOffence: fromForm?.id ? fromForm : enrichOffenceFromLookup(session.currentOffence),
    convictionDate: resolveConvictionDateForSave(form, session)
  }
}

export const getA2FieldsFromForm = (form, session = getPredictorsAssessmentSession()) => {
  const firstSanctionDate = resolveFirstSanctionDateForSave(form, session)

  return {
    firstSanctionDate,
    firstSanctionAge: resolveFirstSanctionAgeForSave(form, session),
    totalSanctions: normaliseString(form.querySelector('#total-sanctions')?.value),
    violentSanctions: normaliseString(form.querySelector('#violent-sanctions-other')?.value),
    sexualOffence: form.querySelector('input[name="sexual_offence"]:checked')?.value || ''
  }
}

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
  supervisedInCommunity: 'yes',
  communityDate: normaliseDateParts({
    day: form.querySelector('#supervised-community-date-day')?.value,
    month: form.querySelector('#supervised-community-date-month')?.value,
    year: form.querySelector('#supervised-community-date-year')?.value
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
