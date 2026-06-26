//
// Path-aware Tiering APIs for shared scripts used by both /01/ and /02/
//

import * as session01 from './tiering-assessment-session.js'
import * as session02 from './02/tiering-assessment-session.js'
import * as journey01 from './tiering-journey.js'
import * as journey02 from './02/tiering-journey.js'
import * as scroll01 from './tiering-change-scroll.js'
import * as scroll02 from './02/tiering-change-scroll.js'
import * as telemetry01 from './tiering-session-telemetry.js'
import * as telemetry02 from './02/tiering-session-telemetry.js'

export const isProto2Page = () => window.location.pathname.includes('/02/')

const pick = (proto1, proto2) => (isProto2Page() ? proto2 : proto1)

export const getTieringAssessmentSession = () =>
  pick(session01, session02).getTieringAssessmentSession()

export const setTieringAssessmentSession = (updates) =>
  pick(session01, session02).setTieringAssessmentSession(updates)

export const getDefaultConvictionDateParts = () =>
  pick(session01, session02).getDefaultConvictionDateParts()

export const formatDateFromParts = (parts) =>
  pick(session01, session02).formatDateFromParts(parts)

export const isDateComplete = (date) => pick(journey01, journey02).isDateComplete(date)

export const normaliseDateParts = (date) => pick(journey01, journey02).normaliseDateParts(date)

export const getA1FieldsFromForm = (form) => pick(journey01, journey02).getA1FieldsFromForm(form)

export const getPrototypeDefaultCurrentOffence = () =>
  pick(journey01, journey02).PROTOTYPE_DEFAULT_CURRENT_OFFENCE

export const captureCheckAnswersEditSnapshot = (fields) =>
  pick(scroll01, scroll02).captureCheckAnswersEditSnapshot(fields)

export const isTieringCheckAnswersEdit = () => pick(scroll01, scroll02).isTieringCheckAnswersEdit()

export const TIERING_CHANGE_ANCHORS = scroll01.TIERING_CHANGE_ANCHORS

export const trackTelemetryOffenceSearch = (data) =>
  pick(telemetry01, telemetry02).trackTelemetryOffenceSearch(data)
