//
// Shared offence list data for search and browse-all table
//

/** OASys offence categories for browse filters (keep in sync with app/data/offence-browse-categories.json) */
export const OFFENCE_BROWSE_SORT_CATEGORIES = [
  'Burglary',
  'Criminal damage',
  'Drug offences',
  'Fraud and forgery',
  'Indictable motoring offences',
  'Other indictable',
  'Other summary offences',
  'Robbery',
  'Sexual offences',
  'Summary motoring offences',
  'Theft and handling',
  'Violence against the person'
]

export const filterOffenceBrowseGroupsByCategory = (groups, category) => {
  if (!category) return groups
  return groups.filter((group) => group.category === category)
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isFraudCategory = (category = '') => category.toLowerCase().includes('fraud and forgery')

const isFraudRelatedQuery = (query = '') => /\bfraud/.test(query.trim().toLowerCase())

const hasFraudRelatedLabel = (text = '') =>
  /\bfraud(?:s|ulent|ul)?\b|\bdefraud\b/i.test(text || '')

const getGroupLabelForSearch = (item) => item.parentLabel || item.label || ''

/** Parent group title has no fraud link – only a sub-offence label matched. */
const isIncidentalFraudMatch = (item, query) => {
  if (!isFraudRelatedQuery(query)) return false
  if (isFraudCategory(item.category)) return false
  return !hasFraudRelatedLabel(getGroupLabelForSearch(item))
}

const getFraudSearchSortTier = (item, query) => {
  if (!isFraudRelatedQuery(query)) return 0
  if (isFraudCategory(item.category)) return 0
  if (hasFraudRelatedLabel(getGroupLabelForSearch(item))) return 1
  return 2
}

const getGroupFraudSearchSortTier = (group, query) => {
  if (!isFraudRelatedQuery(query)) return 0
  if (isFraudCategory(group.category)) return 0
  if (hasFraudRelatedLabel(group.label)) return 1
  return 2
}

export const scoreOffenceSearchMatch = (item, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return 0

  const label = (item.label || '').toLowerCase()
  const category = (item.category || '').toLowerCase()
  const codeHaystack = [
    item.code,
    item.subcode,
    item.fullCode,
    item.code && item.subcode ? `${item.code} ${item.subcode}` : '',
    item.code && item.subcode ? `${item.code}${item.subcode}` : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (codeHaystack.includes(q)) return 1000

  let score = 0

  if (label.includes(q)) score += 100
  if (new RegExp(`\\b${escapeRegExp(q)}`, 'i').test(label)) score += 50

  if (category.includes(q)) score += 80

  if (isFraudRelatedQuery(q)) {
    if (isFraudCategory(item.category)) score += 200
    if (hasFraudRelatedLabel(item.label)) score += 250
  }

  const termsHaystack = (item.searchTerms || []).join(' ').toLowerCase()
  if (termsHaystack.includes(q) && !label.includes(q) && !category.includes(q)) {
    score += 10
  }

  if (isIncidentalFraudMatch(item, query)) {
    score = Math.min(score, 40)
  }

  return score
}

export const offenceMatchesSearchQuery = (item, query) =>
  scoreOffenceSearchMatch(item, query) > 0

const preferFraudParentGroup = (item, query) => {
  if (item.type !== 'parent') return 0
  if (!isFraudRelatedQuery(query)) return 0
  if (!hasFraudRelatedLabel(item.label)) return 0
  if ((item.subOffenceCount || 0) <= 1) return 0
  return 100
}

const compareOffenceSearchMatches = (a, b, query) => {
  const tierA = getFraudSearchSortTier(a, query)
  const tierB = getFraudSearchSortTier(b, query)
  if (tierA !== tierB) return tierA - tierB

  if (tierA === 2) {
    const codeDiff = (b.code || '').localeCompare(a.code || '', undefined, { numeric: true })
    if (codeDiff !== 0) return codeDiff
  }

  const scoreA = scoreOffenceSearchMatch(a, query) + preferFraudParentGroup(a, query)
  const scoreB = scoreOffenceSearchMatch(b, query) + preferFraudParentGroup(b, query)
  const scoreDiff = scoreB - scoreA
  if (scoreDiff !== 0) return scoreDiff

  const labelDiff = (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' })
  if (labelDiff !== 0) return labelDiff

  return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
}

const sortOffenceSearchMatches = (items, query) =>
  [...items].sort((a, b) => compareOffenceSearchMatches(a, b, query))

const buildGroupSearchItem = (group, sub = null) => {
  if (sub) {
    return {
      label: sub.label,
      code: sub.code,
      subcode: sub.subcode,
      fullCode: sub.fullCode,
      category: group.category,
      parentLabel: group.label,
      searchTerms: [
        sub.label,
        sub.code,
        sub.subcode,
        sub.fullCode,
        group.label,
        group.code,
        ...(sub.searchTerms || []),
        ...(group.searchTerms || [])
      ]
    }
  }

  return {
    label: group.label,
    code: group.code,
    subcode: '00',
    fullCode: `${group.code}00`,
    category: group.category,
    searchTerms: group.searchTerms || []
  }
}

const scoreOffenceGroupSearchMatch = (group, query) => {
  let score = scoreOffenceSearchMatch(buildGroupSearchItem(group), query)

  for (const sub of group.subOffences || []) {
    score = Math.max(score, scoreOffenceSearchMatch(buildGroupSearchItem(group, sub), query))
  }

  if (isFraudRelatedQuery(query) && hasFraudRelatedLabel(group.label)) {
    score += 150
  }

  return score
}

const sortOffenceSearchGroups = (groups, query) =>
  [...groups].sort((a, b) => {
    const tierA = getGroupFraudSearchSortTier(a, query)
    const tierB = getGroupFraudSearchSortTier(b, query)
    if (tierA !== tierB) return tierA - tierB

    if (tierA === 2) {
      const codeDiff = b.code.localeCompare(a.code, undefined, { numeric: true })
      if (codeDiff !== 0) return codeDiff
    }

    const scoreDiff = scoreOffenceGroupSearchMatch(b, query) - scoreOffenceGroupSearchMatch(a, query)
    if (scoreDiff !== 0) return scoreDiff

    return a.code.localeCompare(b.code, undefined, { numeric: true })
  })

export const buildOffenceSearchIndex = (offences) => {
  const parents = offences.map((offence) => {
    const subOffences = offence.subOffences || []
    const parentEntry = subOffences.find((sub) => sub.subcode === '00')
    return {
      type: 'parent',
      id: offence.id,
      label: offence.label,
      code: offence.code,
      subcode: '00',
      fullCode: `${offence.code}00`,
      category: offence.category,
      subOffenceCount: offence.subOffenceCount || 0,
      subOffences,
      isViolentOffence: Boolean(parentEntry?.isViolentOffence),
      searchTerms: offence.searchTerms || []
    }
  })

  const subs = offences.flatMap((offence) =>
    (offence.subOffences || []).map((sub) => ({
      type: 'sub',
      id: sub.id,
      label: sub.label,
      code: sub.code,
      subcode: sub.subcode,
      fullCode: sub.fullCode,
      category: offence.category,
      parentId: offence.id,
      parentLabel: offence.label,
      isViolentOffence: Boolean(sub.isViolentOffence),
      searchTerms: [
        sub.label,
        sub.code,
        sub.subcode,
        sub.fullCode,
        offence.label,
        offence.code,
        ...(sub.searchTerms || []),
        ...(offence.searchTerms || [])
      ]
    }))
  )

  return { parents, subs, all: [...parents, ...subs] }
}

export const getOffenceSearchMatches = (groups, query) => {
  const q = query.trim()
  if (!q) return { items: [], totalCount: 0, groups: [] }

  const { parents, subs } = buildOffenceSearchIndex(groups)
  const parentMatches = sortOffenceSearchMatches(
    parents.filter((item) => offenceMatchesSearchQuery(item, q)),
    q
  )
  const subMatches = sortOffenceSearchMatches(
    subs.filter((item) => offenceMatchesSearchQuery(item, q)),
    q
  )

  const filteredGroups = sortOffenceSearchGroups(
    groups
      .map((group) => {
        const parentItem = buildGroupSearchItem(group)
        const parentMatchesGroup = offenceMatchesSearchQuery(parentItem, q)
        const matchingSubs = (group.subOffences || []).filter((sub) =>
          offenceMatchesSearchQuery(buildGroupSearchItem(group, sub), q)
        )

        if (parentMatchesGroup) return group

        if (matchingSubs.length) {
          return {
            ...group,
            subOffences: matchingSubs,
            subOffenceCount: matchingSubs.length
          }
        }

        return null
      })
      .filter(Boolean),
    q
  )

  const items = sortOffenceSearchMatches([...parentMatches, ...subMatches], q)

  return {
    items,
    totalCount: items.length,
    groups: filteredGroups
  }
}

export const filterOffenceBrowseGroupsBySearch = (groups, query) =>
  getOffenceSearchMatches(groups, query).groups

const sortGroups = (list) =>
  [...list].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))

export const flattenOffenceSubOffences = (offences) =>
  offences
    .flatMap((offence) =>
      (offence.subOffences || []).map((sub) => ({
        id: sub.id,
        label: sub.label,
        code: sub.code,
        subcode: sub.subcode,
        fullCode: sub.fullCode,
        category: offence.category,
        parentLabel: offence.label,
        tabId: offence.tabId,
        isViolentOffence: Boolean(sub.isViolentOffence)
      }))
    )
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

export const fetchOffenceBrowseGroups = async () => {
  const response = await fetch('/api/offences')
  if (!response.ok) throw new Error('Failed to load offences')
  const offences = await response.json()
  return sortGroups(offences)
}

export const fetchOffenceSubOffences = async () => {
  const groups = await fetchOffenceBrowseGroups()
  return flattenOffenceSubOffences(groups)
}
