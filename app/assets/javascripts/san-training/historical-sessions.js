import { EXAMPLE_COMPLETE as communityAccommodation } from './community/accommodation.js'
import { EXAMPLE_COMPLETE as communityEmployment } from './community/employment.js'
import { EXAMPLE_COMPLETE as communityFinances } from './community/finances.js'
import { EXAMPLE_COMPLETE as communityDrugs } from './community/drugs.js'
import { EXAMPLE_COMPLETE as communityAlcohol } from './community/alcohol.js'
import { EXAMPLE_COMPLETE as communityThinking } from './community/thinking.js'
import { EXAMPLE_COMPLETE as prisonAccommodation } from './prison/accommodation.js'
import { EXAMPLE_COMPLETE as prisonEmployment } from './prison/employment.js'
import { EXAMPLE_COMPLETE as prisonFinances } from './prison/finances.js'
import { EXAMPLE_COMPLETE as prisonDrugs } from './prison/drugs.js'
import { EXAMPLE_COMPLETE as prisonAlcohol } from './prison/alcohol.js'
import { EXAMPLE_COMPLETE as prisonThinking } from './prison/thinking.js'

const commonCompletedAnswers = {
  healthPhysical: 'no',
  healthMental: 'no',
  healthLearning: 'no',
  healthCope: 'well',
  healthAttitude: 'positive',
  healthGambling: ['no'],
  healthSelfHarm: 'no',
  healthSuicide: 'no',
  healthChanges: 'maintain',
  healthAnalysisStrengths: 'no',
  healthAnalysisHarm: 'no',
  healthAnalysisReoffending: 'no',
  healthComplete: true,
  relationshipsChildren: ['no'],
  relationshipsHistory: 'stable',
  relationshipsPartner: 'none',
  relationshipsFamily: 'stable',
  relationshipsChildhood: 'stable',
  relationshipsChildhoodBehaviour: 'no',
  relationshipsBelonging: 'yes',
  relationshipsStatus: 'happy',
  relationshipsBehaviour: 'no',
  relationshipsVictim: 'no',
  relationshipsChanges: 'maintain',
  relationshipsAnalysisStrengths: 'no',
  relationshipsAnalysisHarm: 'no',
  relationshipsAnalysisReoffending: 'no',
  relationshipsComplete: true,
  offenceDescription: 'Alex was involved in a minor public order incident.',
  offenceElements: ['none'],
  offenceWhy: 'The offence followed an argument in the town centre.',
  offenceMotivations: ['none'],
  offenceCommittedAgainst: ['other'],
  offenceInvolved: 'one',
  offenceLeader: 'no',
  offenceRecognise: 'yes',
  offenceRecogniseDetails: 'Alex recognised the impact on local residents.',
  offenceResponsibility: 'yes',
  offenceResponsibilityDetails: 'Alex accepted responsibility for their actions.',
  offenceEscalation: 'no',
  offencePatterns: 'There is no clear pattern of escalation.',
  offenceLinked: 'no',
  offenceComplete: true
}

const community = {
  ...communityAccommodation,
  ...communityEmployment,
  ...communityFinances,
  ...communityDrugs,
  ...communityAlcohol,
  ...communityThinking,
  ...commonCompletedAnswers,
  drugFrequency: { heroin: 'occasionally', cannabis: 'occasionally', hallucinogens: 'occasionally' }
}

const prison = {
  ...prisonAccommodation,
  ...prisonEmployment,
  ...prisonFinances,
  ...prisonDrugs,
  ...prisonAlcohol,
  ...prisonThinking,
  ...commonCompletedAnswers,
  drugFrequency: { heroin: 'occasionally', cannabis: 'occasionally', hallucinogens: 'occasionally' }
}

const versionChanges = {
  '2026-11-18': {},
  '2026-11-17': {
    changes: 'thinking',
    employmentAnalysisStrengthsDetails: 'Alex had begun attending regular employability appointments.'
  },
  '2026-11-16': {
    financeChanges: 'active',
    healthChanges: 'active'
  },
  '2026-11-13': {
    accommodationSuitable: 'yes',
    analysisStrengthsDetails: 'Alex had support from family and was keeping regular appointments.',
    healthChanges: 'active'
  },
  '2026-11-10': {
    changes: 'need-help',
    drugUse: 'no',
    alcoholChanges: 'thinking',
    offencePatterns: 'Earlier incidents were less serious and involved fewer people.'
  }
}

export const historicalSession = (variant, version) => ({
  ...(variant === 'prison' ? prison : community),
  ...(versionChanges[version] || {})
})
