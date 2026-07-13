//
// Path-aware Tiering APIs for shared scripts used by /01/, /02/, and /dev/
//

import * as session01 from './tiering-assessment-session.js'
import * as session02 from './02/predictors-assessment-session.js'
import * as sessionDev from './dev/predictors-assessment-session.js'
import * as journey01 from './tiering-journey.js'
import * as journey02 from './02/predictors-journey.js'
import * as journeyDev from './dev/predictors-journey.js'
import * as scroll01 from './tiering-change-scroll.js'
import * as scroll02 from './02/predictors-change-scroll.js'
import * as scrollDev from './dev/predictors-change-scroll.js'
import * as telemetry01 from './tiering-session-telemetry.js'

export const isProto2Page = () => window.location.pathname.includes('/02/')
export const isProtoDevPage = () => window.location.pathname.includes('/dev/')
export const isVersionedTieringPage = () => isProto2Page() || isProtoDevPage()

const pick = (proto1, proto2, protoDev) => {
  if (isProtoDevPage()) return protoDev
  if (isProto2Page()) return proto2
  return proto1
}

export const getA1FormElement = () =>
  document.getElementById(isVersionedTieringPage() ? 'predictors-a1-form' : 'tiering-a1-form')

export const getConvictionDateHeadingElement = () =>
  document.getElementById(
    isVersionedTieringPage() ? 'predictors-conviction-date' : 'tiering-conviction-date'
  )

export const getTieringChangeAnchors = () => pick(scroll01, scroll02, scrollDev).TIERING_CHANGE_ANCHORS

export const getTieringAssessmentSession = () =>
  pick(session01, session02, sessionDev).getTieringAssessmentSession()

export const setTieringAssessmentSession = (updates) =>
  pick(session01, session02, sessionDev).setTieringAssessmentSession(updates)

export const getDefaultConvictionDateParts = () =>
  pick(session01, session02, sessionDev).getDefaultConvictionDateParts()

export const formatDateFromParts = (parts) =>
  pick(session01, session02, sessionDev).formatDateFromParts(parts)

export const isDateComplete = (date) => pick(journey01, journey02, journeyDev).isDateComplete(date)

export const normaliseDateParts = (date) => pick(journey01, journey02, journeyDev).normaliseDateParts(date)

export const getA1FieldsFromForm = (form) => pick(journey01, journey02, journeyDev).getA1FieldsFromForm(form)

export const getPrototypeDefaultCurrentOffence = () =>
  pick(journey01, journey02, journeyDev).PROTOTYPE_DEFAULT_CURRENT_OFFENCE

export const captureCheckAnswersEditSnapshot = (fields) =>
  pick(scroll01, scroll02, scrollDev).captureCheckAnswersEditSnapshot(fields)

export const isTieringCheckAnswersEdit = () =>
  pick(scroll01, scroll02, scrollDev).isTieringCheckAnswersEdit()

export const TIERING_CHANGE_ANCHORS = scroll01.TIERING_CHANGE_ANCHORS

export const trackTelemetryOffenceSearch = (data) => {
  if (isProtoDevPage() || isProto2Page()) return
  return telemetry01.trackTelemetryOffenceSearch(data)
}
