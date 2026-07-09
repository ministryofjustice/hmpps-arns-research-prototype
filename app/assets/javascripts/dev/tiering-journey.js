//
// Tiering journey routing and field helpers (branching, completeness)
//

import {
  formatDateFromParts,
  getDefaultConvictionDateParts,
  getDefaultFirstSanctionAge,
  getDefaultFirstSanctionDateParts,
  getOffenderDateOfBirthParts,
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'
import { lookupOffenceDetails } from '../tiering-offence-browse.js'

const TIERING_JOURNEY_PATH = '/dev/'

/** Absolute href for tiering pages (safe from index and /dev/* routes) */
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

export const resolveFirstSanctionDateForSave = (form, session = getTieringAssessmentSession()) => {
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

export const resolveFirstSanctionAgeForSave = (form, session = getTieringAssessmentSession()) => {
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
    updates.supervisedInCommunity = 'no'
  }

  const supervisedInCommunity = updates.supervisedInCommunity || session.supervisedInCommunity
  if (supervisedInCommunity === 'yes' && !isDateComplete(session.communityDate)) {
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
    setTieringAssessmentSession(updates)
  }

  return { ...session, ...updates }
}

/** After a5: first journey shows a6; return visits go to check answers or scores */
export const hasSeenStaticAssessmentComplete = (session = getTieringAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true

/** User chose "No – view static scores" on a6 and may proceed to check answers / scores */
export const hasCompletedA6Gate = (session = getTieringAssessmentSession()) =>
  session.staticAssessmentCompleteSeen === true

export const markStaticAssessmentCompleteSeen = () => {
  setTieringAssessmentSession({ staticAssessmentCompleteSeen: true })
}

export const getTieringResultsAnswersHref = () => 'a7.html'

export const getTieringResultsScoresHref = () => 'a8.html'

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

export const clearA5SessionFields = () => ({
  offencesSinceCommunity: '',
  recentOffenceDate: { day: '', month: '', year: '' }
})

export const isA5Required = (session) => session.supervisedInCommunity === 'yes'

export const getPostA4ContinueHref = (session = getTieringAssessmentSession()) =>
  isA5Required(session) ? 'a5.html' : 'a6.html'

export const getA6BackHref = (session = getTieringAssessmentSession()) =>
  isA5Required(session) ? 'a5.html' : 'a4.html'

export const getA7BackHref = () => 'a6?from=a7-back'

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

export const isA4Complete = (session) =>
  Boolean(
    session.supervisedInCommunity &&
      (session.supervisedInCommunity !== 'yes' || isDateComplete(session.communityDate))
  )

export const getFirstIncompleteTieringPage = (session) => {
  if (!session.currentOffence?.id) return 'a1.html'
  if (!isA2Complete(session)) return 'a2.html'
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
export const redirectIfTieringJourneyIncomplete = () => {
  if (!window.location.pathname.includes('/dev/')) return false

  const currentPageId = window.location.pathname.match(/\/([^/]+)\.html?$/)?.[1]

  // a7 (check your answers) validates the journey is complete first
  if (currentPageId !== 'a7') {
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

  if (currentPage === 'a4' && merged.supervisedInCommunity !== 'yes') {
    return {
      ...merged,
      communityDate: { day: '', month: '', year: '' },
      ...clearA5SessionFields()
    }
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
  if (currentPage === 'a4') {
    const beforeRequiredA5 = beforeSession.supervisedInCommunity === 'yes'
    const afterRequiredA5 = afterSession.supervisedInCommunity === 'yes'

    if (beforeRequiredA5 !== afterRequiredA5) {
      return getFirstIncompleteTieringPage(afterSession)
    }
  }

  if (currentPage === 'a2' && afterSession.sexualOffence === 'yes' && !isA3Complete(afterSession)) {
    return getFirstIncompleteA3Page(afterSession) || 'a3.html'
  }

  if (currentPage === 'a3' && afterSession.sexualOffence === 'yes') {
    return getFirstIncompleteTieringPage(afterSession)
  }

  if (currentPage === 'a5') {
    return getFirstIncompleteTieringPage(afterSession)
  }

  return null
}

export const getA1FieldsFromForm = (form, session = getTieringAssessmentSession()) => {
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

export const getA2FieldsFromForm = (form, session = getTieringAssessmentSession()) => {
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

export const getA4FieldsFromForm = (form) => {
  const supervisedInCommunity =
    form.querySelector('input[name="supervised_in_community"]:checked')?.value || ''

  if (supervisedInCommunity === 'no') {
    return {
      supervisedInCommunity,
      communityDate: { day: '', month: '', year: '' }
    }
  }

  return {
    supervisedInCommunity,
    communityDate: normaliseDateParts({
      day: form.querySelector('#supervised-community-date-day')?.value,
      month: form.querySelector('#supervised-community-date-month')?.value,
      year: form.querySelector('#supervised-community-date-year')?.value
    })
  }
}

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
      `Is ${name} currently being supervised in the community?`
    )
    if (session.supervisedInCommunity === 'yes' && !isDateComplete(session.communityDate)) {
      add('a4', 'Community supervision', `What date did ${name}'s supervision begin?`)
    }
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
