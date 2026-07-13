//
// Summary list sections for dynamic assessment pages (b1–b10)
//

import { MISUSED_DRUG_TYPES } from './predictors-b4-drugs.js'
import { hasAlcoholUseInLast3Months, hasAlcoholUseYesAnswer } from './predictors-journey.js'

const formatYesNo = (value) => {
  if (!value) return null
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return value
}

const formatLabelledChoice = (value, labels) => {
  if (!value) return null
  return labels[value] || formatYesNo(value)
}

const formatCheckboxLabels = (values, labelMap) => {
  if (!Array.isArray(values) || !values.length) return null

  if (values.includes('none')) {
    return labelMap.none || 'None'
  }

  return values.map((value) => labelMap[value] || value).join('<br>')
}

const ACCOMMODATION_LABELS = {
  yes: 'Yes',
  'yes-with-concerns': 'Yes, with concerns',
  no: 'No'
}

const EMPLOYMENT_LABELS = {
  continuous: 'Continuous employment history',
  'changes-jobs-often': 'Generally in employment but changes jobs often',
  unstable: 'Unstable employment history with regular periods of unemployment',
  unknown: 'Unknown'
}

const ALCOHOL_USE_LABELS = {
  'yes-in-last-3-months': 'Yes, including in the last 3 months',
  'yes-not-in-last-3-months': 'Yes, but not in the last 3 months',
  no: 'No'
}

const ALCOHOL_FREQUENCY_LABELS = {
  'once-month-or-less': 'Once a month or less',
  '2-4-times-month': '2 to 4 times a month',
  '2-3-times-week': '2 to 3 times a week',
  'more-than-4-times-week': 'More than 4 times a week'
}

const ALCOHOL_UNITS_LABELS = {
  '1-2': '1 to 2 units',
  '3-4': '3 to 4 units',
  '5-6': '5 to 6 units',
  '7-9': '7 to 9 units',
  '10-or-more': '10 or more units'
}

const ALCOHOL_BINGE_LABELS = {
  none: 'No evidence of binge drinking or excessive alcohol use',
  some: 'Some evidence of binge drinking or excessive alcohol use',
  evidence: 'Evidence of binge drinking or excessive alcohol use'
}

const RELATIONSHIP_STATUS_LABELS = {
  'happy-protective':
    'Happy and positive about their relationship status, or their relationship is likely to act as a protective factor',
  'some-concerns': 'Has some concerns about their relationship status but is overall happy',
  'unhappy-unhealthy':
    'Unhappy about their relationship status, or their relationship is unhealthy and directly linked to offending'
}

const ACTIVITIES_LINKED_LABELS = {
  'pro-social-understands-link':
    'Engages in pro-social activities and understands the link to offending',
  'sometimes-linked-recognises':
    'Sometimes engages in activities linked to offending but recognises the link',
  'regularly-encourages-unaware':
    'Regularly engages in activities which encourage offending and is not aware or does not care about the link to offending'
}

const MANAGE_TEMPER_LABELS = {
  'manages-well': 'Yes, is able to manage their temper well',
  'sometimes-uncontrolled-anger': 'Sometimes has outbreaks of uncontrolled anger',
  'easily-loses-temper': 'No, easily loses their temper'
}

const ACT_ON_IMPULSE_LABELS = {
  'considers-before-acting':
    'Considers all aspects of a situation before acting on or making a decision',
  'sometimes-causes-problems': 'Sometimes acts on impulse which causes problems',
  'significant-problems': 'Acts on impulse which causes significant problems'
}

const SUPPORT_CRIMINAL_BEHAVIOUR_LABELS = {
  'does-not-support': 'Does not support or excuse criminal behaviour',
  'sometimes-supports': 'Sometimes supports or excuses criminal behaviour',
  'supports-or-excuses-issue':
    'Supports or excuses criminal behaviour or their pattern of behaviour and other evidence indicates this is an issue'
}

const DOMESTIC_ABUSE_RELATION_LABELS = {
  'family-member': 'Family member',
  'intimate-partner': 'Intimate partner',
  'family-and-intimate-partner': 'Family member and intimate partner'
}

const OFFENCE_ELEMENT_LABELS = {
  arson: 'Arson',
  'domestic-abuse': 'Domestic abuse',
  'excessive-violence-sadistic': 'Excessive violence or sadistic violence',
  'hatred-identifiable-groups': 'Hatred of identifiable groups',
  'physical-violence-child': 'Physical violence against a child',
  'sexual-element': 'Sexual element',
  'stalking-element': 'Stalking element',
  'violence-threat-weapon': 'Violence or threat of violence with a weapon',
  weapon: 'Weapon',
  none: 'None'
}

const SERIOUS_HARM_CONVICTION_LABELS = {
  'murder-attempted-murder-threat-conspiracy-manslaughter':
    'Murder, attempted murder, threat or conspiracy to murder or manslaughter',
  'wounding-gbh': 'Wounding or GBH',
  'rape-serious-sexual-adult': 'Rape or serious sexual offence against an adult',
  'sexual-offence-child': 'Any sexual offence against a child',
  'other-offence-child': 'Any other offence against a child',
  'criminal-damage-endanger-life': 'Criminal damage with intent to endanger life',
  'possession-use-weapons': 'Any offence involving possession or use of weapons',
  'kidnapping-false-imprisonment': 'Kidnapping or false imprisonment',
  arson: 'Arson',
  'racially-motivated': 'Racially motivated or racially aggravated offence',
  'aggravated-burglary': 'Aggravated burglary',
  robbery: 'Robbery',
  'other-serious-offence':
    'Any other serious offence (for example, blackmail, harassment, stalking, indecent images of children, child neglect or abduction)',
  'offence-in-custody': 'Any offence committed in custody',
  'firearm-intent-endanger-life':
    'Possession of a firearm with intent to endanger life or resist arrest',
  none: 'None of these offences'
}

const DRUG_PERIOD_LABELS = {
  'last-6-months': 'Used in the last 6 months',
  'more-than-6-months': 'Used more than 6 months ago'
}

const formatMisusedDrugs = (misusedDrugs = {}) => {
  const entries = Object.entries(misusedDrugs)
  if (!entries.length) return null

  return entries
    .map(([id, entry]) => {
      const drug = MISUSED_DRUG_TYPES.find((item) => item.id === id)
      const label = id === 'other' && entry.name ? entry.name : drug?.label || id
      const period = DRUG_PERIOD_LABELS[entry.period] || entry.period
      return `${label} – ${period}`
    })
    .join('<br>')
}

export const buildDynamicPredictorsSummarySections = (session, offenderFirstName = 'Alex', createRow) => {
  const name = offenderFirstName
  const sections = []

  sections.push({
    title: 'Accommodation',
    rows: [
      createRow(
        `Is ${name}'s accommodation suitable?`,
        formatLabelledChoice(session.accommodationSuitable, ACCOMMODATION_LABELS),
        'b1.html',
        `Is ${name}'s accommodation suitable?`,
        false,
        'predictors-accommodation-suitable'
      )
    ]
  })

  sections.push({
    title: 'Employment and education',
    rows: [
      createRow(
        `What is ${name}'s employment history?`,
        formatLabelledChoice(session.employmentHistory, EMPLOYMENT_LABELS),
        'b2.html',
        `What is ${name}'s employment history?`,
        false,
        'predictors-employment-history'
      )
    ]
  })

  const drugRows = [
    createRow(
      `Has ${name} ever misused drugs?`,
      formatYesNo(session.drugsMisused),
      'b3.html',
      `Has ${name} ever misused drugs?`,
      false,
      'predictors-drugs-misused'
    )
  ]

  if (session.drugsMisused === 'yes') {
    drugRows.push(
      createRow(
        `Which drugs has ${name} misused?`,
        formatMisusedDrugs(session.misusedDrugs),
        'b4.html',
        `Which drugs has ${name} misused?`,
        true,
        'predictors-drugs-misused-types'
      )
    )
  }

  sections.push({ title: 'Drug use', rows: drugRows })

  const alcoholRows = [
    createRow(
      `Has ${name} ever drunk alcohol?`,
      formatLabelledChoice(session.alcoholUse, ALCOHOL_USE_LABELS),
      'b5.html',
      `Has ${name} ever drunk alcohol?`,
      false,
      'predictors-alcohol-use'
    )
  ]

  if (hasAlcoholUseInLast3Months(session)) {
    alcoholRows.push(
      createRow(
        `How often has ${name} drunk alcohol in the last 3 months?`,
        formatLabelledChoice(session.alcoholFrequencyLast3Months, ALCOHOL_FREQUENCY_LABELS),
        'b6.html',
        `How often has ${name} drunk alcohol in the last 3 months?`,
        false,
        'predictors-alcohol-frequency'
      ),
      createRow(
        `How many units of alcohol does ${name} have on a typical day of drinking?`,
        formatLabelledChoice(session.alcoholUnitsTypicalDay, ALCOHOL_UNITS_LABELS),
        'b6.html',
        `How many units of alcohol does ${name} have on a typical day of drinking?`,
        false,
        'predictors-alcohol-units'
      )
    )
  }

  if (hasAlcoholUseYesAnswer(session)) {
    alcoholRows.push(
      createRow(
        `Has ${name} shown evidence of binge drinking or excessive alcohol use in the last 6 months?`,
        formatLabelledChoice(session.alcoholBingeEvidence, ALCOHOL_BINGE_LABELS),
        hasAlcoholUseInLast3Months(session) ? 'b6.html' : 'b6c.html',
        `Has ${name} shown evidence of binge drinking or excessive alcohol use in the last 6 months?`,
        false,
        'predictors-alcohol-binge-evidence'
      )
    )
  }

  sections.push({ title: 'Alcohol use', rows: alcoholRows })

  sections.push({
    title: 'Personal relationships and community',
    rows: [
      createRow(
        `Is ${name} happy with their current relationship status?`,
        formatLabelledChoice(session.relationshipStatus, RELATIONSHIP_STATUS_LABELS),
        'b7.html',
        `Is ${name} happy with their current relationship status?`,
        false,
        'predictors-relationship-status'
      )
    ]
  })

  sections.push({
    title: 'Thinking, attitudes and behaviours',
    rows: [
      createRow(
        `Does ${name} engage in activities that could link to offending?`,
        formatLabelledChoice(session.activitiesLinkedToOffending, ACTIVITIES_LINKED_LABELS),
        'b8.html',
        `Does ${name} engage in activities that could link to offending?`,
        false,
        'predictors-activities-linked-to-offending'
      ),
      createRow(
        `Is ${name} able to manage their temper?`,
        formatLabelledChoice(session.manageTemper, MANAGE_TEMPER_LABELS),
        'b8.html',
        `Is ${name} able to manage their temper?`,
        false,
        'predictors-manage-temper'
      ),
      createRow(
        `Does ${name} act on impulse?`,
        formatLabelledChoice(session.actOnImpulse, ACT_ON_IMPULSE_LABELS),
        'b8.html',
        `Does ${name} act on impulse?`,
        false,
        'predictors-act-on-impulse'
      ),
      createRow(
        `Does ${name} support or excuse criminal behaviour?`,
        formatLabelledChoice(session.supportCriminalBehaviour, SUPPORT_CRIMINAL_BEHAVIOUR_LABELS),
        'b8.html',
        `Does ${name} support or excuse criminal behaviour?`,
        false,
        'predictors-support-criminal-behaviour'
      )
    ]
  })

  const offenceAnalysisRows = [
    createRow(
      `Does ${name}'s current offence have any of the following elements?`,
      formatCheckboxLabels(session.offenceElements, OFFENCE_ELEMENT_LABELS),
      'b9.html',
      `Does ${name}'s current offence have any of the following elements?`,
      true,
      'predictors-offence-elements'
    ),
    createRow(
      `Is there evidence that ${name} has ever been a perpetrator of domestic abuse?`,
      formatYesNo(session.domesticAbusePerpetrator),
      'b9.html',
      `Is there evidence that ${name} has ever been a perpetrator of domestic abuse?`,
      false,
      'predictors-domestic-abuse-perpetrator'
    )
  ]

  if (session.domesticAbusePerpetrator === 'yes') {
    offenceAnalysisRows.push(
      createRow(
        'Who was this committed against?',
        formatLabelledChoice(session.domesticAbusePerpetratorAgainst, DOMESTIC_ABUSE_RELATION_LABELS),
        'b9.html',
        'Who was this committed against?',
        false,
        'predictors-domestic-abuse-perpetrator'
      )
    )
  }

  offenceAnalysisRows.push(
    createRow(
      `Is there evidence that ${name} has ever been a victim of domestic abuse?`,
      formatYesNo(session.domesticAbuseVictim),
      'b9.html',
      `Is there evidence that ${name} has ever been a victim of domestic abuse?`,
      false,
      'predictors-domestic-abuse-victim'
    )
  )

  if (session.domesticAbuseVictim === 'yes') {
    offenceAnalysisRows.push(
      createRow(
        'Who was this committed by?',
        formatLabelledChoice(session.domesticAbuseVictimBy, DOMESTIC_ABUSE_RELATION_LABELS),
        'b9.html',
        'Who was this committed by?',
        false,
        'predictors-domestic-abuse-victim'
      )
    )
  }

  sections.push({ title: 'Offence analysis', rows: offenceAnalysisRows })

  sections.push({
    title: 'Risk of serious harm',
    rows: [
      createRow(
        `Has ${name} previously been convicted of any of these offences?`,
        formatCheckboxLabels(session.seriousHarmConvictions, SERIOUS_HARM_CONVICTION_LABELS),
        'b10.html',
        `Has ${name} previously been convicted of any of these offences?`,
        true,
        'predictors-serious-harm-convictions'
      )
    ]
  })

  return sections
}
