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
