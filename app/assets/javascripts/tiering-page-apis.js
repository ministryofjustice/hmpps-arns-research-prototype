//
// Path-aware APIs for shared scripts used by /01/, /02/, /03/, and /dev/
//

import * as session01 from './tiering-assessment-session.js'
import * as session02 from './02/predictors-assessment-session.js'
import * as session03 from './03/predictors-assessment-session.js'
import * as sessionDev from './dev/predictors-assessment-session.js'
import * as journey01 from './tiering-journey.js'
import * as journey02 from './02/predictors-journey.js'
import * as journey03 from './03/predictors-journey.js'
import * as journeyDev from './dev/predictors-journey.js'
import * as scroll01 from './tiering-change-scroll.js'
import * as scroll02 from './02/predictors-change-scroll.js'
import * as scroll03 from './03/predictors-change-scroll.js'
import * as scrollDev from './dev/predictors-change-scroll.js'
import * as telemetry01 from './tiering-session-telemetry.js'

export const isProto2Page = () => window.location.pathname.includes('/02/')
export const isProto3Page = () => window.location.pathname.includes('/03/')
export const isProtoDevPage = () => window.location.pathname.includes('/dev/')
export const isVersionedTieringPage = () => isProto2Page() || isProto3Page() || isProtoDevPage()

const pick = (proto1, proto2, protoDev, proto3) => {
  if (isProtoDevPage()) return protoDev
  if (isProto3Page()) return proto3
  if (isProto2Page()) return proto2
  return proto1
}

export const getA1FormElement = () => {
  if (!isVersionedTieringPage()) {
    return document.getElementById('tiering-a1-form')
  }

  return (
    document.getElementById('predictors-a1-form') ||
    document.getElementById('predictors-a2b-form')
  )
}

export const getConvictionDateHeadingElement = () =>
  document.getElementById(
    isVersionedTieringPage() ? 'predictors-conviction-date' : 'tiering-conviction-date'
  )

export const getTieringChangeAnchors = () => {
  const api = pick(scroll01, scroll02, scrollDev, scroll03)
  return api.PREDICTORS_CHANGE_ANCHORS || api.TIERING_CHANGE_ANCHORS
}
export const getTieringAssessmentSession = () => {
  const api = pick(session01, session02, sessionDev, session03)
  return (api.getPredictorsAssessmentSession || api.getTieringAssessmentSession)()
}

export const setTieringAssessmentSession = (updates) => {
  const api = pick(session01, session02, sessionDev, session03)
  return (api.setPredictorsAssessmentSession || api.setTieringAssessmentSession)(updates)
}

export const getDefaultConvictionDateParts = () =>
  pick(session01, session02, sessionDev, session03).getDefaultConvictionDateParts()

export const formatDateFromParts = (parts) =>
  pick(session01, session02, sessionDev, session03).formatDateFromParts(parts)

export const isDateComplete = (date) => pick(journey01, journey02, journeyDev, journey03).isDateComplete(date)

export const normaliseDateParts = (date) => pick(journey01, journey02, journeyDev, journey03).normaliseDateParts(date)

export const getA1FieldsFromForm = (form) => pick(journey01, journey02, journeyDev, journey03).getA1FieldsFromForm(form)

export const getPrototypeDefaultCurrentOffence = () =>
  pick(journey01, journey02, journeyDev, journey03).PROTOTYPE_DEFAULT_CURRENT_OFFENCE

export const captureCheckAnswersEditSnapshot = (fields) =>
  pick(scroll01, scroll02, scrollDev, scroll03).captureCheckAnswersEditSnapshot(fields)

export const isTieringCheckAnswersEdit = () => {
  const api = pick(scroll01, scroll02, scrollDev, scroll03)
  return (api.isPredictorsCheckAnswersEdit || api.isTieringCheckAnswersEdit)()
}

export const TIERING_CHANGE_ANCHORS = scroll01.TIERING_CHANGE_ANCHORS

export const trackTelemetryOffenceSearch = (data) => {
  if (isVersionedTieringPage()) return
  return telemetry01.trackTelemetryOffenceSearch(data)
}
