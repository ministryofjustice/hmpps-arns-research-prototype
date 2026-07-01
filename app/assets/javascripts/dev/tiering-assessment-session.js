//
// Prototype session storage for Tiering assessment journey
//

const TIERING_SESSION_KEY = 'tieringAssessmentDev'
const LEGACY_TIERING_SESSION_KEY = 'csrpAssessment'

export const getTieringAssessmentSession = () => {
  try {
    let stored = sessionStorage.getItem(TIERING_SESSION_KEY)

    if (!stored) {
      const legacy = sessionStorage.getItem(LEGACY_TIERING_SESSION_KEY)
      if (legacy) {
        sessionStorage.setItem(TIERING_SESSION_KEY, legacy)
        sessionStorage.removeItem(LEGACY_TIERING_SESSION_KEY)
        stored = legacy
      }
    }

    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    return {}
  }
}

export const setTieringAssessmentSession = (updates) => {
  const current = getTieringAssessmentSession()
  sessionStorage.setItem(TIERING_SESSION_KEY, JSON.stringify({ ...current, ...updates }))
}

export const clearTieringAssessmentSession = () => {
  sessionStorage.removeItem(TIERING_SESSION_KEY)
  sessionStorage.removeItem(LEGACY_TIERING_SESSION_KEY)
}

/** Clear Tiering session and other prototype kit data stored in the browser for a blank start */
export const clearPrototypeDataForTiering = async () => {
  clearTieringAssessmentSession()

  const keysToRemove = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (key && (key.includes('/dev/') || key === TIERING_SESSION_KEY)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => sessionStorage.removeItem(key))

  try {
    await fetch('/manage-prototype/clear-data', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: ''
    })
  } catch (error) {
    // Prototype still works if manage-prototype route is unavailable
  }
}

/** Reset prototype 2 session for a fresh static assessment start from the index */
export const resetTieringSessionForFreshStart = async () => {
  await clearPrototypeDataForTiering()

  const { PROTOTYPE_DEFAULT_CURRENT_OFFENCE } = await import('./tiering-journey.js')

  setTieringAssessmentSession({
    currentOffence: { ...PROTOTYPE_DEFAULT_CURRENT_OFFENCE },
    convictionDate: getDefaultConvictionDateParts(),
    convictionDateEditMode: false,
    returnToCheckAnswers: false,
    staticAssessmentCompleteSeen: false,
    scoreCalculated: false,
    section1Complete: false
  })
}

export const getTieringCurrentOffence = () => getTieringAssessmentSession().currentOffence || null

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export const formatDateFromParts = ({ day, month, year }) => {
  if (!day || !month || !year) return null

  const monthNumber = parseInt(month, 10)
  const monthName = MONTH_NAMES[monthNumber - 1] || month

  return `${day} ${monthName} ${year}`
}

export const formatToday = () => {
  const date = new Date()

  return formatDateFromParts({
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear())
  })
}

/** Alex's current conviction date for a1 */
export const getDefaultConvictionDateParts = () => ({
  day: '18',
  month: '3',
  year: '2026'
})

/** Alex's date of birth from the offender header */
export const OFFENDER_DATE_OF_BIRTH_PARTS = { day: '2', month: '10', year: '1969' }

/** Alex's age at first sanction for a2 – prototype default (age on 15/5/2012) */
export const getDefaultFirstSanctionAge = () => '42'

/** Date of first sanction for Alex – prototype default */
export const getDefaultFirstSanctionDateParts = () => ({
  day: '15',
  month: '5',
  year: '2012'
})

export const getOffenderDateOfBirthParts = () => {
  const identifiers = document.querySelector('.assessment-offender-header__identifiers')
  if (identifiers?.dataset.offenderDobYear) {
    return {
      day: identifiers.dataset.offenderDobDay || OFFENDER_DATE_OF_BIRTH_PARTS.day,
      month: identifiers.dataset.offenderDobMonth || OFFENDER_DATE_OF_BIRTH_PARTS.month,
      year: identifiers.dataset.offenderDobYear || OFFENDER_DATE_OF_BIRTH_PARTS.year
    }
  }

  return { ...OFFENDER_DATE_OF_BIRTH_PARTS }
}
