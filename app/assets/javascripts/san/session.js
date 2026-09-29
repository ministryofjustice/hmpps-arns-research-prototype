//
// Session storage for the Strengths and needs prototype
//

const SAN_SESSION_KEY = 'sanAssessment'

export const getSanSession = () => {
  try {
    const stored = sessionStorage.getItem(SAN_SESSION_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    return {}
  }
}

export const setSanSession = (updates) => {
  const current = getSanSession()
  sessionStorage.setItem(SAN_SESSION_KEY, JSON.stringify({ ...current, ...updates }))
}

export const replaceSanSession = (session) => {
  sessionStorage.setItem(SAN_SESSION_KEY, JSON.stringify(session))
}

export const clearSanSession = () => {
  sessionStorage.removeItem(SAN_SESSION_KEY)
}

export const sectionLinkHref = (section, fallback) => {
  const saved = getSanSession().sectionScreens?.[section]
  if (typeof saved === 'string' && saved) return saved
  return fallback || ''
}

export const rememberSectionScreen = (section, screen) => {
  if (!section || !screen) return
  const current = getSanSession().sectionScreens || {}
  if (current[section] === screen) return
  setSanSession({ sectionScreens: { ...current, [section]: screen } })
}

export const resetSanSessionForFreshStart = async () => {
  clearSanSession()

  const keysToRemove = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (key && (key.includes('/san/') || key === SAN_SESSION_KEY)) {
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
