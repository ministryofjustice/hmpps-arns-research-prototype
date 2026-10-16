//
// Session storage for SAN research journeys (Community and Prison).
// Community uses `sanResearchAssessment`; Prison uses `sanPrisonAssessment`.
// Neither collides with the `/san` private beta reference (`sanAssessment`).
//
// Typical fields: answers for the current section, `*Complete` flags, and
// `sectionScreens` (last page in each section for the side nav).
//

export const SAN_SESSION_KEYS = {
  community: 'sanResearchAssessment',
  prison: 'sanPrisonAssessment'
}

export const SAN_VARIANT_PATHS = {
  community: '/san-research/',
  prison: '/san-prison/'
}

export const getSanVariant = (pathname = window.location.pathname) => (
  pathname.startsWith(SAN_VARIANT_PATHS.prison) ? 'prison' : 'community'
)

export const isSanResearchJourney = (pathname = window.location.pathname) => (
  pathname.startsWith(SAN_VARIANT_PATHS.community)
)

const sessionKeyFor = (variant = getSanVariant()) => (
  SAN_SESSION_KEYS[variant] || SAN_SESSION_KEYS.community
)

export const getSanSession = () => {
  try {
    const stored = sessionStorage.getItem(sessionKeyFor())
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    return {}
  }
}

export const setSanSession = (updates) => {
  const current = getSanSession()
  sessionStorage.setItem(sessionKeyFor(), JSON.stringify({ ...current, ...updates }))
}

export const replaceSanSession = (session) => {
  sessionStorage.setItem(sessionKeyFor(), JSON.stringify(session))
}

export const clearSanSession = (variant = getSanVariant()) => {
  sessionStorage.removeItem(sessionKeyFor(variant))
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

export const resetSanSessionForFreshStart = async (variant = 'community') => {
  const resolved = variant === 'prison' ? 'prison' : 'community'
  const key = sessionKeyFor(resolved)
  const pathPrefix = SAN_VARIANT_PATHS[resolved]

  clearSanSession(resolved)

  const keysToRemove = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const storageKey = sessionStorage.key(i)
    if (storageKey && (storageKey.includes(pathPrefix) || storageKey === key)) {
      keysToRemove.push(storageKey)
    }
  }
  keysToRemove.forEach((storageKey) => sessionStorage.removeItem(storageKey))

  if (resolved !== 'community') return

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
