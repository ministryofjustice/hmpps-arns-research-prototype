//
// Page-level telemetry: timing, field changes, validation errors
//

import {
  isTelemetryRecordingEnabled,
  trackTelemetryError,
  trackTelemetryFieldChange,
  trackTelemetryPageEnter,
  trackTelemetryPageLeave
} from './tiering-session-telemetry.js'

const getPageMeta = () => {
  const root = document.querySelector('[data-tiering-telemetry-page]')
  if (!root) return null
  return {
    pageId: root.dataset.tieringTelemetryPage,
    pageLabel: root.dataset.tieringTelemetryPageLabel || root.dataset.tieringTelemetryPage
  }
}

const getFieldMeta = (element) => {
  const fieldset = element.closest('fieldset')
  const legend = fieldset?.querySelector('legend.govuk-fieldset__legend')
  const label = document.querySelector(`label[for="${element.id}"]`)
  const fieldId =
    element.name ||
    element.id ||
    fieldset?.id ||
    legend?.textContent?.trim().slice(0, 40) ||
    'unknown-field'
  const fieldLabel =
    legend?.textContent?.trim() ||
    label?.textContent?.trim() ||
    fieldId

  return { fieldId, fieldLabel }
}

const bindFieldTracking = (pageId) => {
  const root = document.querySelector('[data-tiering-telemetry-page]') || document
  const fields = root.querySelectorAll('input, select, textarea')

  fields.forEach((field) => {
    if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') return

    const reportChange = () => {
      const { fieldId, fieldLabel } = getFieldMeta(field)
      let value = field.value
      if (field.type === 'radio' || field.type === 'checkbox') {
        if (!field.checked) return
        value = field.value
      }
      trackTelemetryFieldChange(pageId, fieldId, fieldLabel, value)
    }

    field.addEventListener('change', reportChange)
    if (field.type === 'text' || field.type === 'search' || field.tagName === 'TEXTAREA') {
      field.addEventListener('blur', reportChange)
    }
  })
}

const bindErrorTracking = (pageId) => {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.govuk-error-message').forEach((errorEl) => {
      const fieldId =
        errorEl.id?.replace('-error', '') ||
        errorEl.closest('.govuk-form-group')?.querySelector('[name]')?.name ||
        'unknown'
      if (errorEl.textContent?.trim()) {
        trackTelemetryError(pageId, fieldId, errorEl.textContent.trim())
      }
    })
  })

  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}

window.GOVUKPrototypeKit.documentReady(() => {
  const meta = getPageMeta()
  if (!meta?.pageId) return

  if (isTelemetryRecordingEnabled()) {
    trackTelemetryPageEnter(meta.pageId, meta.pageLabel)
    bindFieldTracking(meta.pageId)
    bindErrorTracking(meta.pageId)
  }

  window.addEventListener('pagehide', () => {
    if (isTelemetryRecordingEnabled()) {
      trackTelemetryPageLeave(meta.pageId)
    }
  })
})
