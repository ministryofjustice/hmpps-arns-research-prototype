//
// Drug types for b4 – which drugs has Alex misused?
//
// Period reveals are disabled for all drugs (Other still reveals the name field).
// Set true and restore the conditionals in
// includes/dev/drugs-misused-types-questions.html to re-enable.
//

export const MISUSED_DRUG_PERIOD_REVEALS_ENABLED = false

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

export const drugRequiresPeriod = () => MISUSED_DRUG_PERIOD_REVEALS_ENABLED

export const getMisusedDrugConditionalId = (id) => `conditional-drugs-${id}`
