//
// Populate the read-only current offence table on a1 / a2b (no search module)
//

import { initA1OffenceDisplayToggle, refreshA1OffenceDisplay } from '../tiering-a1-display-toggle.js'
import {
  getPredictorsAssessmentSession,
  setPredictorsAssessmentSession
} from './predictors-assessment-session.js'
import { PROTOTYPE_DEFAULT_CURRENT_OFFENCE } from './predictors-journey.js'

export const hydrateCurrentOffenceDisplay = () => {
  const container = document.getElementById('current-offence-search')
  if (!container) return

  initA1OffenceDisplayToggle()

  const session = getPredictorsAssessmentSession()
  const offence = session.currentOffence?.id
    ? session.currentOffence
    : { ...PROTOTYPE_DEFAULT_CURRENT_OFFENCE }

  if (!session.currentOffence?.id) {
    setPredictorsAssessmentSession({ currentOffence: offence })
  }

  const labelEl = container.querySelector('[data-offence-selected-label]')
  const hiddenId = container.querySelector('[data-offence-selected-id]')
  const hiddenCode = container.querySelector('[data-offence-selected-code]')
  const hiddenSubcode = container.querySelector('[data-offence-selected-subcode]')

  if (labelEl) labelEl.textContent = offence.label || ''
  if (hiddenId) hiddenId.value = offence.id || ''
  if (hiddenCode) hiddenCode.value = offence.code || ''
  if (hiddenSubcode) hiddenSubcode.value = offence.subcode || ''

  refreshA1OffenceDisplay(container, offence)
}
