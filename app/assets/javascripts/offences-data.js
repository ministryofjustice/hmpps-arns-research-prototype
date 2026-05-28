//
// Shared offence list data for search and browse-all table
//

export const flattenOffenceSubOffences = (offences) =>
  offences
    .flatMap((offence) =>
      (offence.subOffences || []).map((sub) => ({
        id: sub.id,
        label: sub.label,
        code: sub.code,
        category: offence.category,
        parentLabel: offence.label
      }))
    )
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

export const fetchOffenceSubOffences = async () => {
  const response = await fetch('/api/offences')
  if (!response.ok) throw new Error('Failed to load offences')
  const offences = await response.json()
  return flattenOffenceSubOffences(offences)
}

const PRIMARY_OFFENCE_TABS = [
  { category: 'Theft and handling stolen goods', label: 'Theft' },
  { category: 'Burglary', label: 'Burglary' },
  { category: 'Robbery', label: 'Robbery' },
  { category: 'Violence against the person', label: 'Violence' },
  { category: 'Drugs', label: 'Drugs' },
  { category: 'Public order', label: 'Public order' },
  { category: 'Motoring', label: 'Motoring' }
]

const PRIMARY_OFFENCE_TAB_CATEGORIES = PRIMARY_OFFENCE_TABS.map((tab) => tab.category)

const sortOffences = (list) =>
  [...list].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

const slugifyCategory = (category) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Eight category tabs for offence browse variant B (a1o2) */
export const fetchOffenceCategoryTabs = async () => {
  const response = await fetch('/api/offences')
  if (!response.ok) throw new Error('Failed to load offences')
  const offences = await response.json()

  const byCategory = new Map()

  const addOffence = (offence, category) => {
    const categoryName = category || 'Miscellaneous'
    if (!byCategory.has(categoryName)) {
      byCategory.set(categoryName, [])
    }

    byCategory.get(categoryName).push({
      id: offence.id,
      label: offence.label,
      code: offence.code || ''
    })
  }

  offences.forEach((item) => {
    if (item.subOffences?.length) {
      item.subOffences.forEach((sub) => addOffence(sub, item.category))
      return
    }

    addOffence(item, item.category)
  })

  const tabs = PRIMARY_OFFENCE_TABS.filter((tab) => byCategory.has(tab.category)).map(
    (tab) => ({
      id: slugifyCategory(tab.label),
      label: tab.label,
      offences: sortOffences(byCategory.get(tab.category) || [])
    })
  )

  const otherOffences = []

  byCategory.forEach((categoryOffences, category) => {
    if (!PRIMARY_OFFENCE_TAB_CATEGORIES.includes(category)) {
      otherOffences.push(...categoryOffences)
    }
  })

  if (otherOffences.length) {
    tabs.push({
      id: 'other-offences',
      label: 'Other offences',
      offences: sortOffences(otherOffences)
    })
  }

  return tabs
}
