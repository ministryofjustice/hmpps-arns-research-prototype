//
// Seed a complete Tiering session and jump to a7
//

import { clearPrototypeDataForTiering, setTieringAssessmentSession } from './tiering-assessment-session.js'
import { setTelemetryConsent } from './tiering-session-telemetry.js'

const isOnSkipPage = () => window.location.pathname.endsWith('/01/skip-to-end') || window.location.pathname.endsWith('/01/skip-to-end.html')

window.GOVUKPrototypeKit.documentReady(async () => {
  if (!isOnSkipPage()) return

  await clearPrototypeDataForTiering()

  // Keep consent declined by default so we don’t record unexpectedly.
  setTelemetryConsent(false)

  setTieringAssessmentSession({
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
    firstSanctionAge: '17',
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

    // a4
    communityDate: { day: '5', month: '6', year: '2027' },

    // a5
    offencesSinceCommunity: 'yes',

    // a6 (only required if offencesSinceCommunity === 'yes')
    recentOffenceDate: { day: '3', month: '2', year: '2026' },

    // state
    scoreCalculated: false,
    section1Complete: false
  })

  window.location.href = 'a7.html'
})

