//
// Drug types for b4 – which drugs has Alex misused?
//

export const MISUSED_DRUG_TYPES = [
  { id: 'amphetamines', label: 'Amphetamines' },
  { id: 'benzodiazepines', label: 'Benzodiazepines' },
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'cocaine', label: 'Cocaine hydrochloride' },
  { id: 'crack-cocaine', label: 'Crack or cocaine' },
  { id: 'ecstasy', label: 'Ecstasy (also known as MDMA)' },
  { id: 'hallucinogens', label: 'Hallucinogens' },
  { id: 'heroin', label: 'Heroin' },
  { id: 'methadone', label: 'Methadone (not prescribed)' },
  { id: 'prescribed-drugs', label: 'Misused prescribed drugs' },
  { id: 'other-opiates', label: 'Other opiates' },
  { id: 'solvents', label: 'Solvents (including gases and glues)' },
  { id: 'spice', label: 'Spice' },
  { id: 'steroids', label: 'Steroids' },
  { id: 'other', label: 'Other', hasNameField: true }
]

export const getMisusedDrugConditionalId = (id) => `conditional-drugs-${id}`
