//
// Shared offence list data for search and browse-all table
//

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
        tabId: offence.tabId
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
