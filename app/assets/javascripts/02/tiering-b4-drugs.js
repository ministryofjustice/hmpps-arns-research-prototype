//
// Drug types for b4 – which drugs has Alex misused?
//

export const MISUSED_DRUG_TYPES = [
  { id: 'amphetamines', label: 'Amphetamines (including speed, methamphetamine)' },
  { id: 'benzodiazepines', label: 'Benzodiazepines (including diazepam, temazepam)' },
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'cocaine', label: 'Cocaine' },
  { id: 'crack-cocaine', label: 'Crack cocaine' },
  { id: 'ecstasy', label: 'Ecstasy (MDMA)' },
  { id: 'hallucinogens', label: 'Hallucinogens' },
  { id: 'heroin', label: 'Heroin' },
  { id: 'methadone', label: 'Methadone (not prescribed)' },
  { id: 'prescribed-drugs', label: 'Prescribed drugs' },
  { id: 'other-opiates', label: 'Other opiates' },
  { id: 'solvents', label: 'Solvents (including gases and glues)' },
  { id: 'steroids', label: 'Steroids' },
  { id: 'synthetic-cannabinoids', label: 'Synthetic cannabinoids (spice)' },
  { id: 'other', label: 'Other', hasNameField: true }
]

export const getMisusedDrugConditionalId = (id) => `conditional-drugs-${id}`
