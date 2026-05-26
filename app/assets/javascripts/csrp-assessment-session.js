//
// Prototype session storage for CSRP assessment journey
//

const CSRP_SESSION_KEY = 'csrpAssessment'

export const getCsrpAssessmentSession = () => {
  try {
    const stored = sessionStorage.getItem(CSRP_SESSION_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    return {}
  }
}

export const setCsrpAssessmentSession = (updates) => {
  const current = getCsrpAssessmentSession()
  sessionStorage.setItem(CSRP_SESSION_KEY, JSON.stringify({ ...current, ...updates }))
}

export const clearCsrpAssessmentSession = () => {
  sessionStorage.removeItem(CSRP_SESSION_KEY)
}

/** Clear CSRP session and other prototype kit data stored in the browser for a blank start */
export const clearPrototypeDataForCsrp = async () => {
  clearCsrpAssessmentSession()

  const keysToRemove = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (key && (key.includes('/01/') || key.toLowerCase().includes('csrp'))) {
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

export const getCsrpCurrentOffence = () => getCsrpAssessmentSession().currentOffence || null

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
