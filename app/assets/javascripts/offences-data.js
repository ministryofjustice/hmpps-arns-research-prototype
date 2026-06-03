//
// Shared offence list data for search and browse-all table
//

/** OASys offence categories for a1o “Sort by” filter (keep in sync with app/data/offence-browse-categories.json) */
export const OFFENCE_BROWSE_SORT_CATEGORIES = [
  'Violence against the person',
  'Acquisitive violence',
  'Public order and harassment',
  'Sexual (not against child)',
  'Sexual (against child)',
  'Drunkenness',
  'Burglary (domestic)',
  'Burglary (other)',
  'Theft (non-motor)',
  'Handling stolen goods',
  'Fraud and forgery',
  'Absconding/bail',
  'Vehicle-related theft',
  'Welfare fraud',
  'Motoring offences',
  'Drink driving',
  'Criminal damage',
  'Drug import/export/production',
  'Drug possession/supply',
  'Other offences'
]

export const filterOffenceBrowseGroupsByCategory = (groups, category) => {
  if (!category) return groups
  return groups.filter((group) => group.category === category)
}

export const offenceMatchesSearchQuery = (item, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return false

  const haystack = [
    item.label,
    item.code,
    item.subcode,
    item.fullCode,
    item.category,
    item.code && item.subcode ? `${item.code} ${item.subcode}` : '',
    item.code && item.subcode ? `${item.code}${item.subcode}` : '',
    ...(item.searchTerms || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

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
  const parentMatches = parents.filter((item) => offenceMatchesSearchQuery(item, q))
  const subMatches = subs.filter((item) => offenceMatchesSearchQuery(item, q))

  const filteredGroups = groups
    .map((group) => {
      const parentItem = {
        label: group.label,
        code: group.code,
        subcode: '00',
        fullCode: `${group.code}00`,
        category: group.category,
        searchTerms: group.searchTerms || []
      }
      const parentMatchesGroup = offenceMatchesSearchQuery(parentItem, q)
      const matchingSubs = (group.subOffences || []).filter((sub) =>
        offenceMatchesSearchQuery(
          {
            label: sub.label,
            code: sub.code,
            subcode: sub.subcode,
            fullCode: sub.fullCode,
            category: group.category,
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
          },
          q
        )
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
    .filter(Boolean)

  return {
    items: [...parentMatches, ...subMatches],
    totalCount: parentMatches.length + subMatches.length,
    groups: filteredGroups
  }
}

export const filterOffenceBrowseGroupsBySearch = (groups, query) =>
  getOffenceSearchMatches(groups, query).groups

export const PRIMARY_OFFENCE_TABS = [
  { id: 'theft', label: 'Theft' },
  { id: 'burglary', label: 'Burglary' },
  { id: 'robbery', label: 'Robbery' },
  { id: 'violence', label: 'Violence' },
  { id: 'drugs', label: 'Drugs' },
  { id: 'public-order', label: 'Public order' },
  { id: 'motoring', label: 'Motoring' },
  { id: 'other-offences', label: 'Other offences' }
]

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

/** Eight category tabs for offence browse variant B (a1o2) */
export const fetchOffenceCategoryTabs = async () => {
  const groups = await fetchOffenceBrowseGroups()

  return PRIMARY_OFFENCE_TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    groups: sortGroups(groups.filter((group) => group.tabId === tab.id))
  }))
}
