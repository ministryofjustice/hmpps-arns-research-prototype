//
// Prototype session storage for Tiering assessment journey
//

import { clearSessionTelemetry } from './tiering-session-telemetry.js'

const TIERING_SESSION_KEY = 'tieringAssessment'
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
  clearSessionTelemetry()

  const keysToRemove = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (
      key &&
      (key.includes('/01/') ||
        key.toLowerCase().includes('tiering') ||
        key.toLowerCase().includes('csrp'))
    ) {
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
