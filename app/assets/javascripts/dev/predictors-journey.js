//
// Predictors journey routing and field helpers (branching, completeness)
//
// Dev static journey: a2b → a3 (if sexual) → a4 → a5 (if needed) → a7 → a8
// Dev dynamic journey: a6 → b1–b11 → a8 (static a2b–a5 seeded when starting from index)
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
import {
  drugRequiresPeriod,
  getMisusedDrugConditionalId,
  MISUSED_DRUG_TYPES
} from './predictors-b4-drugs.js'

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

/** After a5 (static) or a6 (dynamic no): check answers / scores */
export const hasSeenStaticAssessmentComplete = (session = getPredictorsAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true

/** a6 answered, or static path marked complete without visiting a6 */
export const hasCompletedA6Gate = (session = getPredictorsAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true || Boolean(session.interviewDone)

export const markStaticAssessmentCompleteSeen = () => {
  setPredictorsAssessmentSession({ staticAssessmentCompleteSeen: true })
}

export const getPredictorsResultsAnswersHref = () => 'a7.html'

export const getDynamicPredictorsCheckAnswersHref = () => 'b11.html'

export const getPredictorsResultsScoresHref = () => 'a8.html'

export const SCORES_CHECK_ANSWERS_ORIGIN_A7 = 'a7'
export const SCORES_CHECK_ANSWERS_ORIGIN_B11 = 'b11'

export const hasDynamicScoresOrigin = (session = getPredictorsAssessmentSession()) => {
  if (session.scoresCheckAnswersOrigin === SCORES_CHECK_ANSWERS_ORIGIN_B11) return true
  if (session.scoresCheckAnswersOrigin === SCORES_CHECK_ANSWERS_ORIGIN_A7) return false

  return Boolean(session.b10Complete || session.seriousHarmConvictions?.length)
}

/** Predictors that fall back to static when relationship status is Unknown */
export const RELATIONSHIP_STATUS_STATIC_PREDICTOR_IDS = ['arp', 'vrp']

export const getRiskPredictorScoreType = (session, predictorId) => {
  if (
    session.relationshipStatus === 'unknown' &&
    RELATIONSHIP_STATUS_STATIC_PREDICTOR_IDS.includes(predictorId)
  ) {
    return 'static'
  }

  return hasDynamicScoresOrigin(session) ? 'dynamic' : 'static'
}

/** Static journey skips a6 and continues to check answers */
export const getPostA5ContinueHref = () => getPredictorsResultsAnswersHref()

/** Where repeat visitors to a6 should land */
export const getPredictorsReviewHref = () => getPredictorsResultsAnswersHref()

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

export const clearA5SessionFields = () => ({
  offencesSinceCommunity: '',
  recentOffenceDate: { day: '', month: '', year: '' }
})

export const isA5Required = (session) => isDateComplete(session.communityDate)

/** Static journey: a5 when needed, otherwise check answers (not a6) */
export const getPostA4ContinueHref = (session = getPredictorsAssessmentSession()) =>
  isA5Required(session) ? 'a5.html' : getPredictorsResultsAnswersHref()

/** Dynamic assessment starts at a6 from the index (static journey never visits a6) */
export const getA6BackHref = () => '/'

/** Back from a7: a6 when the interview gate was used, otherwise static a4/a5 */
export const getA7BackHref = (session = getPredictorsAssessmentSession()) => {
  if (session.interviewDone) {
    return 'a6?from=a7-back'
  }

  return isA5Required(session) ? 'a5.html' : 'a4.html'
}

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

  const fields = {
    strangerContact: session.strangerContact,
    contactAdultSanctions: session.contactAdultSanctions,
    contactChildSanctions: session.contactChildSanctions
  }

  return (
    normaliseString(session.contactAdultSanctions) !== '' &&
    normaliseString(session.contactChildSanctions) !== '' &&
    isStrangerContactSanctionsValid(fields)
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
  if (!hasCompletedA6Gate(session)) return 'a6.html'
  return null
}

/** Redirect to the first incomplete page; returns true if a redirect was started */
export const redirectIfPredictorsJourneyIncomplete = () => {
  if (!window.location.pathname.includes('/dev/')) return false

  // a7 (check your answers) validates the journey is complete first
  if (!/\/a7(?:\.html)?$/.test(window.location.pathname)) {
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
    return { ...merged, ...clearA6SessionFields() }
  }

  if (currentPage === 'a6' && merged.interviewDone === 'no') {
    return {
      ...merged,
      ...pauseDynamicSectionSessionFields(merged),
      staticAssessmentCompleteSeen: true,
      scoreCalculated: false
    }
  }

  if (currentPage === 'a6' && merged.interviewDone === 'yes') {
    return {
      ...merged,
      ...restoreDynamicSectionSessionFields(merged),
      staticAssessmentCompleteSeen: false,
      scoreCalculated: false
    }
  }

  if (currentPage === 'b3' && merged.drugsMisused !== 'yes') {
    return { ...merged, ...clearB4SessionFields() }
  }

  if (currentPage === 'b5' && (merged.alcoholUse === 'no' || merged.alcoholUse === 'unknown')) {
    return { ...merged, ...clearB6SessionFields() }
  }

  if (currentPage === 'b5' && merged.alcoholUse === 'yes-not-in-last-3-months') {
    return {
      ...merged,
      alcoholFrequencyLast3Months: '',
      alcoholUnitsTypicalDay: ''
    }
  }

  if (currentPage === 'b9') {
    const cleaned = { ...merged }

    if (cleaned.domesticAbusePerpetrator !== 'yes') {
      cleaned.domesticAbusePerpetratorAgainst = ''
    }

    cleaned.domesticAbuseVictim = ''
    cleaned.domesticAbuseVictimBy = ''

    return cleaned
  }

  return merged
}

export const getPostCheckAnswersEditHref = (session) =>
  getFirstIncompletePredictorsPage(session) || getPredictorsResultsAnswersHref()

/** When an a6 interview edit excludes or opens the dynamic section, return the right summary page */
export const getCheckAnswersReturnHrefAfterEdit = (
  currentPage,
  beforeSession,
  afterSession,
  defaultHref
) => {
  if (
    currentPage === 'a6' &&
    beforeSession.interviewDone === 'yes' &&
    afterSession.interviewDone === 'no' &&
    beforeSession.checkAnswersReturnTarget === 'b11'
  ) {
    return getPredictorsResultsAnswersHref()
  }

  return defaultHref
}

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

  if (
    currentPage === 'a6' &&
    beforeSession.interviewDone !== 'yes' &&
    afterSession.interviewDone === 'yes'
  ) {
    return getPostInterviewYesContinueHref(afterSession)
  }

  if (currentPage === 'b3') {
    const beforeYes = beforeSession.drugsMisused === 'yes'
    const afterYes = afterSession.drugsMisused === 'yes'

    if (beforeYes !== afterYes) {
      return getPostB3ContinueHref(afterSession)
    }
  }

  if (currentPage === 'b5' && beforeSession.alcoholUse !== afterSession.alcoholUse) {
    return getPostB5ContinueHref(afterSession)
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

export const getStrangerContactSanctionsError = (name = 'Alex') =>
  `Direct contact against a victim who was a stranger can only be 'yes' if ${name} has at least 1 sanction for contact adult, or direct contact child, sexual or sexually motivated offences`

export const parseSanctionCount = (value) => {
  const normalised = normaliseString(value)
  if (normalised === '') return 0

  const count = Number(normalised)
  if (!Number.isFinite(count) || count < 0) return 0

  return count
}

export const isStrangerContactSanctionsValid = (fields) => {
  if (fields.strangerContact !== 'yes') return true

  return (
    parseSanctionCount(fields.contactAdultSanctions) +
      parseSanctionCount(fields.contactChildSanctions) >
    0
  )
}

export const getA3ValidationError = (form, offenderFirstName = 'Alex') => {
  const fields = getA3FieldsFromForm(form)

  if (!isStrangerContactSanctionsValid(fields)) {
    return {
      scrollId: 'predictors-stranger-contact',
      focusSelector: '#predictors-stranger-contact',
      message: getStrangerContactSanctionsError(offenderFirstName)
    }
  }

  return null
}

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

export const getA6FieldsFromForm = (form) => ({
  interviewDone: form.querySelector('input[name="interview_done"]:checked')?.value || ''
})

export const getB1FieldsFromForm = (form) => {
  const livingWith = [...form.querySelectorAll('input[name="living_with"]:checked')].map(
    (input) => input.value
  )

  return {
    livingWith,
    livingWithOther: '',
    accommodationSuitable:
      form.querySelector('input[name="accommodation_suitable"]:checked')?.value || ''
  }
}

export const getLivingWithError = (name = 'Alex') =>
  `Select who ${name} is living with, or select 'Alone' or 'Unknown'`

export const getB1ValidationError = (form, offenderFirstName = 'Alex') => {
  const fields = getB1FieldsFromForm(form)

  if (!fields.livingWith.length) {
    return {
      scrollId: 'predictors-living-with',
      focusSelector: '#predictors-living-with',
      message: getLivingWithError(offenderFirstName)
    }
  }

  if (!fields.accommodationSuitable) {
    return {
      scrollId: 'predictors-accommodation-suitable',
      focusSelector: 'input[name="accommodation_suitable"]'
    }
  }

  return null
}

export const isB1Complete = (session = getPredictorsAssessmentSession()) => {
  if (!Array.isArray(session.livingWith) || !session.livingWith.length) return false
  return Boolean(session.accommodationSuitable)
}

export const getB2FieldsFromForm = (form) => ({
  employmentHistory: form.querySelector('input[name="employment_history"]:checked')?.value || ''
})

export const getB3FieldsFromForm = (form) => ({
  drugsMisused: form.querySelector('input[name="drugs_misused"]:checked')?.value || ''
})

export const getPostB3ContinueHref = (session = getPredictorsAssessmentSession()) =>
  session.drugsMisused === 'yes' ? 'b4.html' : 'b5.html'

export const getB4FieldsFromForm = (form) => {
  const misusedDrugs = {}

  MISUSED_DRUG_TYPES.forEach((drug) => {
    const checkbox = form.querySelector(`#drugs-${drug.id}`)
    if (!checkbox?.checked) return

    const entry = {
      period: form.querySelector(`input[name="${drug.id}_period"]:checked`)?.value || ''
    }

    if (drug.hasNameField) {
      entry.name = form.querySelector('#other-drug-name')?.value?.trim() || ''
    }

    misusedDrugs[drug.id] = entry
  })

  return {
    misusedDrugs,
    drugsMotivation: form.querySelector('input[name="drugs_motivation"]:checked')?.value || ''
  }
}

export const getB4ValidationError = (form) => {
  const { misusedDrugs, drugsMotivation } = getB4FieldsFromForm(form)
  const selectedIds = Object.keys(misusedDrugs)

  if (!selectedIds.length) {
    return { focusSelector: `#drugs-${MISUSED_DRUG_TYPES[0].id}` }
  }

  for (const drug of MISUSED_DRUG_TYPES) {
    const entry = misusedDrugs[drug.id]
    if (!entry) continue

    if (drug.hasNameField && !entry.name) {
      return {
        conditionalId: getMisusedDrugConditionalId(drug.id),
        focusSelector: '#other-drug-name'
      }
    }

    if (drugRequiresPeriod(drug) && !entry.period) {
      return {
        conditionalId: getMisusedDrugConditionalId(drug.id),
        focusSelector: `input[name="${drug.id}_period"]`
      }
    }
  }

  if (!drugsMotivation) {
    return { focusSelector: 'input[name="drugs_motivation"]' }
  }

  return null
}

export const clearB4SessionFields = () => ({
  misusedDrugs: {},
  drugsMotivation: ''
})

export const isB4Complete = (session = getPredictorsAssessmentSession()) => {
  if (session.drugsMisused !== 'yes') return true

  const misusedDrugs = session.misusedDrugs || {}
  const selectedIds = Object.keys(misusedDrugs)
  if (!selectedIds.length) return false
  if (!session.drugsMotivation) return false

  return selectedIds.every((id) => {
    const entry = misusedDrugs[id]
    const drug = MISUSED_DRUG_TYPES.find((item) => item.id === id)
    if (drug?.hasNameField && !entry.name) return false
    if (drugRequiresPeriod(drug || { id }) && !entry.period) return false
    return true
  })
}

export const getFirstIncompleteDynamicPage = (session = getPredictorsAssessmentSession()) => {
  if (session.interviewDone !== 'yes') return null

  if (!isB1Complete(session)) return 'b1.html'
  if (!session.employmentHistory) return 'b2.html'
  if (!session.drugsMisused) return 'b3.html'
  if (session.drugsMisused === 'yes' && !isB4Complete(session)) return 'b4.html'
  if (!session.alcoholUse) return 'b5.html'

  const alcoholPage = getFirstIncompleteAlcoholPage(session)
  if (alcoholPage) return alcoholPage

  if (!isB7Complete(session)) return 'b7.html'
  if (!isB8Complete(session)) return 'b8.html'
  if (!isDynamicSectionReadyForB10(session)) return 'b9.html'
  if (!isB10Complete(session)) return 'b10.html'

  return null
}

export const getB5FieldsFromForm = (form) => ({
  alcoholUse: form.querySelector('input[name="alcohol_use"]:checked')?.value || ''
})

export const hasAlcoholUseYesAnswer = (session = getPredictorsAssessmentSession()) =>
  session.alcoholUse === 'yes-in-last-3-months' || session.alcoholUse === 'yes-not-in-last-3-months'

export const hasAlcoholUseInLast3Months = (session = getPredictorsAssessmentSession()) =>
  session.alcoholUse === 'yes-in-last-3-months'

export const getPostB5ContinueHref = (session = getPredictorsAssessmentSession()) => {
  if (session.alcoholUse === 'yes-in-last-3-months') return 'b6.html'
  if (session.alcoholUse === 'yes-not-in-last-3-months') return 'b6c.html'
  return 'b7.html'
}

export const getFirstIncompleteAlcoholPage = (session = getPredictorsAssessmentSession()) => {
  if (!session.alcoholUse) return 'b5.html'
  if (session.alcoholUse === 'no' || session.alcoholUse === 'unknown') return null

  if (session.alcoholUse === 'yes-in-last-3-months') {
    if (!session.alcoholFrequencyLast3Months || !session.alcoholBingeEvidence) {
      return 'b6.html'
    }
    return null
  }

  if (session.alcoholUse === 'yes-not-in-last-3-months') {
    if (!session.alcoholBingeEvidence) return 'b6c.html'
    return null
  }

  return null
}

export const getPostB6bContinueHref = () => 'b7.html'

export const getPostB6cContinueHref = () => 'b7.html'

export const getPostB7ContinueHref = () => 'b8.html'

export const getPostB8ContinueHref = () => 'b9.html'

export const getPostB9ContinueHref = () => 'b10.html'

export const getPostB10ContinueHref = () => 'b11.html'

export const isAlcoholSectionComplete = (session = getPredictorsAssessmentSession()) => {
  if (session.alcoholUse === 'no' || session.alcoholUse === 'unknown') return true

  if (session.alcoholUse === 'yes-not-in-last-3-months') {
    return Boolean(session.alcoholBingeEvidence)
  }

  if (session.alcoholUse === 'yes-in-last-3-months') {
    return Boolean(
      session.alcoholFrequencyLast3Months &&
        session.alcoholBingeEvidence
    )
  }

  return false
}

export const isDynamicSectionReadyForB7 = (session = getPredictorsAssessmentSession()) =>
  Boolean(
    session.interviewDone === 'yes' &&
      isB1Complete(session) &&
      session.employmentHistory &&
      session.drugsMisused &&
      session.alcoholUse
  )

export const getB7BackHref = (session = getPredictorsAssessmentSession()) => {
  if (!hasAlcoholUseYesAnswer(session)) return 'b5.html'
  if (session.alcoholUse === 'yes-not-in-last-3-months') return 'b6c.html'
  return 'b6.html'
}

export const getB6BackHref = () => 'b5.html'

export const getB6cBackHref = (session = getPredictorsAssessmentSession()) =>
  session.alcoholUse === 'yes-in-last-3-months' ? 'b6.html' : 'b5.html'

export const getB6FieldsFromForm = (form) => ({
  alcoholFrequencyLast3Months:
    form.querySelector('input[name="alcohol_frequency_last_3_months"]:checked')?.value || '',
  alcoholUnitsTypicalDay:
    form.querySelector('input[name="alcohol_units_typical_day"]:checked')?.value || '',
  alcoholBingeEvidence:
    form.querySelector('input[name="alcohol_binge_evidence"]:checked')?.value || ''
})

export const getB6cFieldsFromForm = (form) => ({
  alcoholBingeEvidence:
    form.querySelector('input[name="alcohol_binge_evidence"]:checked')?.value || ''
})

export const isB6Complete = (session = getPredictorsAssessmentSession()) =>
  Boolean(
    session.alcoholFrequencyLast3Months &&
      session.alcoholBingeEvidence
  )

export const clearB6SessionFields = () => ({
  alcoholFrequencyLast3Months: '',
  alcoholUnitsTypicalDay: '',
  alcoholBingeEvidence: ''
})

export const clearDynamicSectionSessionFields = () => ({
  livingWith: [],
  livingWithOther: '',
  accommodationSuitable: '',
  employmentHistory: '',
  drugsMisused: '',
  ...clearB4SessionFields(),
  alcoholUse: '',
  ...clearB6SessionFields(),
  importantPeople: [],
  relationshipStatus: '',
  activitiesLinkedToOffending: '',
  manageTemper: '',
  actOnImpulse: '',
  supportCriminalBehaviour: '',
  offenceElements: [],
  domesticAbusePerpetrator: '',
  domesticAbusePerpetratorAgainst: '',
  domesticAbuseVictim: '',
  domesticAbuseVictimBy: '',
  b9Complete: false,
  seriousHarmConvictions: [],
  b10Complete: false
})

const dynamicSectionFieldHasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0

  if (value && typeof value === 'object') {
    return Object.values(value).some((entry) => {
      if (entry && typeof entry === 'object') {
        return Object.values(entry).some(Boolean)
      }

      return Boolean(entry)
    })
  }

  return Boolean(value)
}

export const extractDynamicSectionSessionFields = (session) => {
  const fields = {}

  Object.keys(clearDynamicSectionSessionFields()).forEach((key) => {
    if (key in session) fields[key] = session[key]
  })

  return fields
}

export const hasDynamicSectionSessionData = (fields) =>
  Object.values(fields).some(dynamicSectionFieldHasValue)

/** Hide dynamic answers while static-only, but keep them to restore if interview resumes */
export const pauseDynamicSectionSessionFields = (session) => {
  const current = extractDynamicSectionSessionFields(session)
  const updates = clearDynamicSectionSessionFields()

  if (hasDynamicSectionSessionData(current)) {
    updates.pausedDynamicSection = current
  } else if (session.pausedDynamicSection) {
    updates.pausedDynamicSection = session.pausedDynamicSection
  }

  return updates
}

export const restoreDynamicSectionSessionFields = (session) => {
  if (!session.pausedDynamicSection) return {}

  return {
    ...session.pausedDynamicSection,
    pausedDynamicSection: undefined
  }
}

export const getPostInterviewYesContinueHref = (session = getPredictorsAssessmentSession()) =>
  getFirstIncompleteDynamicPage(session) || getDynamicPredictorsCheckAnswersHref()

export const getB7FieldsFromForm = (form) => ({
  importantPeople: [...form.querySelectorAll('input[name="important_people"]:checked')].map(
    (input) => input.value
  ),
  relationshipStatus: form.querySelector('input[name="relationship_status"]:checked')?.value || ''
})

export const isB7Complete = (session = getPredictorsAssessmentSession()) =>
  Boolean(
    Array.isArray(session.importantPeople) &&
      session.importantPeople.length &&
      session.relationshipStatus
  )

export const getB8BackHref = () => 'b7.html'

export const getB8FieldsFromForm = (form) => ({
  activitiesLinkedToOffending:
    form.querySelector('input[name="activities_linked_to_offending"]:checked')?.value || '',
  manageTemper: form.querySelector('input[name="manage_temper"]:checked')?.value || '',
  actOnImpulse: form.querySelector('input[name="act_on_impulse"]:checked')?.value || '',
  supportCriminalBehaviour:
    form.querySelector('input[name="support_criminal_behaviour"]:checked')?.value || ''
})

export const isB8Complete = (session = getPredictorsAssessmentSession()) =>
  Boolean(
    session.activitiesLinkedToOffending &&
      session.manageTemper &&
      session.actOnImpulse &&
      session.supportCriminalBehaviour
  )

export const getB9BackHref = () => 'b8.html'

export const getB9FieldsFromForm = (form) => ({
  offenceElements: [...form.querySelectorAll('input[name="offence_elements"]:checked')].map(
    (input) => input.value
  ),
  domesticAbusePerpetrator:
    form.querySelector('input[name="domestic_abuse_perpetrator"]:checked')?.value || '',
  domesticAbusePerpetratorAgainst:
    form.querySelector('input[name="domestic_abuse_perpetrator_against"]:checked')?.value || ''
})

export const getB9ValidationError = (form) => {
  const fields = getB9FieldsFromForm(form)

  if (!fields.offenceElements.length) {
    return {
      anchor: '#predictors-offence-elements',
      focusSelector: 'input[name="offence_elements"]'
    }
  }

  if (!fields.domesticAbusePerpetrator) {
    return {
      anchor: '#predictors-domestic-abuse-perpetrator',
      focusSelector: 'input[name="domestic_abuse_perpetrator"]'
    }
  }

  if (fields.domesticAbusePerpetrator === 'yes' && !fields.domesticAbusePerpetratorAgainst) {
    return {
      anchor: '#predictors-domestic-abuse-perpetrator',
      conditionalId: 'conditional-domestic-abuse-perpetrator-yes',
      focusSelector: 'input[name="domestic_abuse_perpetrator_against"]'
    }
  }

  return null
}

export const isB9Complete = (session = getPredictorsAssessmentSession()) => {
  if (!Array.isArray(session.offenceElements) || !session.offenceElements.length) return false
  if (!session.domesticAbusePerpetrator) return false
  if (session.domesticAbusePerpetrator === 'yes' && !session.domesticAbusePerpetratorAgainst) {
    return false
  }

  return true
}

export const isDynamicSectionReadyForB10 = (session = getPredictorsAssessmentSession()) =>
  session.b9Complete === true || isB9Complete(session)

export const getB10BackHref = () => 'b9.html'

export const getB10FieldsFromForm = (form) => ({
  seriousHarmConvictions: [...form.querySelectorAll('input[name="serious_harm_convictions"]:checked')].map(
    (input) => input.value
  )
})

export const isB10Complete = (session = getPredictorsAssessmentSession()) =>
  Boolean(session.seriousHarmConvictions?.length)

export const isDynamicSectionReadyForB11 = (session = getPredictorsAssessmentSession()) =>
  session.b10Complete === true || isB10Complete(session)

export const getB11BackHref = () => 'b10.html'

export const redirectIfDynamicCheckAnswersIncomplete = () => {
  if (!window.location.pathname.includes('/dev/')) return false

  if (!/\/b11(?:\.html)?$/.test(window.location.pathname)) return false

  const session = syncPredictorsSessionBeforeCheckAnswers()
  const staticPage = getFirstIncompletePredictorsPage(session)

  if (staticPage) {
    window.location.href = predictorsJourneyHref(staticPage)
    return true
  }

  const dynamicPage = getFirstIncompleteDynamicPage(session)

  if (dynamicPage) {
    window.location.href = predictorsJourneyHref(dynamicPage)
    return true
  }

  return false
}

/** Questions required for the journey that are missing from session storage */
export const getUnansweredPredictorsQuestions = (session, offenderFirstName = 'Alex') => {
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

  if (!isDateComplete(session.firstSanctionDate) && !normaliseString(session.firstSanctionAge)) {
    add('a2', 'Offending history', `What was the date of ${name}'s first sanction?`)
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
    if (
      session.strangerContact === 'yes' &&
      !isStrangerContactSanctionsValid({
        strangerContact: session.strangerContact,
        contactAdultSanctions: session.contactAdultSanctions,
        contactChildSanctions: session.contactChildSanctions
      })
    ) {
      add('a3', 'Sexual offending', getStrangerContactSanctionsError(name))
    }
    if (normaliseString(session.indirectChildSanctions) === '') {
      add(
        'a3',
        'Sexual offending',
        `How many sanctions does ${name} have for indecent child image, or indirect contact child, sexual or sexually motivated offences?`
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

  if (!isA4Complete(session)) {
    add(
      'a4',
      'Community supervision',
      `What date did ${name}'s current supervision in the community begin?`
    )
  }

  if (isA5Required(session) && !session.offencesSinceCommunity) {
    const communityDateLabel = formatDateFromParts(session.communityDate || {}) || 'that date'
    add(
      'a5',
      'Offences since community date',
      `Has ${name} committed any offences since ${communityDateLabel}?`
    )
  }

  if (
    isA5Required(session) &&
    session.offencesSinceCommunity === 'yes' &&
    !isDateComplete(session.recentOffenceDate)
  ) {
    add('a5', 'Offences since community date', `What is the date of ${name}'s most recent offence?`)
  }

  return unanswered
}
