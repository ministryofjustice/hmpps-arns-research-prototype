//
// Seed a complete Predictors session and jump to a7 check your answers
//

import { getPredictorsResultsAnswersHref } from './predictors-journey.js'
import { clearPrototypeDataForPredictors, setPredictorsAssessmentSession } from './predictors-assessment-session.js'

const isOnSkipPage = () => window.location.pathname.endsWith('/02/skip-to-end') || window.location.pathname.endsWith('/02/skip-to-end.html')

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!isOnSkipPage()) return

  await clearPrototypeDataForPredictors()

  setPredictorsAssessmentSession({
    // a1
    currentOffence: {
      id: '04600',
      label: 'Stealing from shops and stalls (shoplifting)',
      code: '046',
      subcode: '00',
      fullCode: '04600'
    },
    convictionDate: { day: '27', month: '3', year: '2024' },

    // a2
    firstSanctionDate: { day: '15', month: '6', year: '1986' },
    firstSanctionAge: '16',
    totalSanctions: '5',
    violentSanctions: '1',
    sexualOffence: 'yes',

    // a3 (only required if sexualOffence === 'yes')
    sexualMotivation: 'no',
    strangerContact: 'no',
    sexualSanctionDate: { day: '12', month: '8', year: '2021' },
    contactAdultSanctions: '1',
    contactChildSanctions: '1',
    indirectChildSanctions: '1',
    nonContactSanctions: '1',

    // a4 + a5
    supervisedInCommunity: 'yes',
    communityDate: { day: '2', month: '5', year: '2015' },
    offencesSinceCommunity: 'no',

    // state
    scoreCalculated: true,
    section1Complete: false,
    staticAssessmentCompleteSeen: true
  })

  window.location.href = getPredictorsResultsAnswersHref()
})

