//
// Offence lookup helpers for the dev predictors journey
//

const padDigits = (value, width) => {
  const s = String(value ?? '').trim()
  if (!s) return ''
  if (!/^\d+$/.test(s)) return s
  return s.padStart(width, '0')
}

export const formatOffenceCode = (offence) => {
  if (!offence) return ''

  const code = String(offence.code ?? '').trim()
  const subcode = String(offence.subcode ?? '').trim()
  const fullCode = String(offence.fullCode ?? '').trim()

  if (code && subcode) return `${padDigits(code, 3)} ${padDigits(subcode, 2)}`

  if (fullCode && /^\d{5,}$/.test(fullCode)) {
    const c = fullCode.slice(0, -2)
    const s = fullCode.slice(-2)
    return `${padDigits(c, 3)} ${padDigits(s, 2)}`
  }

  if (code) return `${padDigits(code, 3)} 00`
  if (fullCode) return fullCode

  return ''
}

export const formatOffenceCodeLabel = (offence) => formatOffenceCode(offence)

const normaliseOffenceId = (offenceId) => String(offenceId ?? '').trim().toLowerCase()

export const ensureOffenceSearchData = async () => {
  if (window.OFFENCE_SEARCH_DATA?.length) return window.OFFENCE_SEARCH_DATA

  try {
    const response = await fetch('/api/offences')
    if (!response.ok) return []
    window.OFFENCE_SEARCH_DATA = await response.json()
    return window.OFFENCE_SEARCH_DATA
  } catch {
    return []
  }
}

export const lookupOffenceDetails = (offenceId) => {
  const offences = window.OFFENCE_SEARCH_DATA
  if (!offences?.length || !offenceId) return null

  const targetId = normaliseOffenceId(offenceId)

  for (const group of offences) {
    const match = (group.subOffences || []).find((sub) => normaliseOffenceId(sub.id) === targetId)
    if (match) {
      return {
        id: match.id,
        label: match.label || '',
        code: match.code || '',
        subcode: match.subcode || '',
        fullCode: match.fullCode || '',
        parentGroupDescription: group.category || '',
        categoryDescription: group.label || '',
        subCategoryDescription: match.description || match.label || '',
        isViolentOffence: Boolean(match.isViolentOffence)
      }
    }
  }

  return null
}
