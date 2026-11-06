export const SAN_SESSION_KEYS = {
  community: 'sanTrainingCommunityAssessment',
  prison: 'sanTrainingPrisonAssessment'
}

export const SAN_VARIANT_PATHS = {
  community: '/san-training/community/',
  prison: '/san-training/prison/'
}

export const getSanVariant = (pathname = window.location.pathname) => (
  pathname.startsWith(SAN_VARIANT_PATHS.prison) ? 'prison' : 'community'
)

export const isSanResearchJourney = (pathname = window.location.pathname) => (
  pathname.startsWith(SAN_VARIANT_PATHS.community)
)

export const isSanPrisonJourney = (pathname = window.location.pathname) => (
  pathname.startsWith(SAN_VARIANT_PATHS.prison)
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
  sessionStorage.setItem(sessionKeyFor(), JSON.stringify({ ...getSanSession(), ...updates }))
}

export const replaceSanSession = (session) => {
  sessionStorage.setItem(sessionKeyFor(), JSON.stringify(session))
}

export const clearSanSession = (variant = getSanVariant()) => {
  sessionStorage.removeItem(sessionKeyFor(variant))
}

export const sectionLinkHref = (section, fallback) => {
  const saved = getSanSession().sectionScreens?.[section]
  return typeof saved === 'string' && saved ? saved : fallback || ''
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
  const keysToRemove = []
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const storageKey = sessionStorage.key(index)
    if (storageKey && (storageKey === key || storageKey.includes(pathPrefix))) keysToRemove.push(storageKey)
  }
  keysToRemove.forEach(storageKey => sessionStorage.removeItem(storageKey))
}