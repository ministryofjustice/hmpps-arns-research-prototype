//
// Preserve values in GOV.UK radio conditionals when toggling show/hide
//

export const setConditionalVisible = (id, show) => {
  const conditional = document.getElementById(id)
  if (!conditional) return

  conditional.classList.toggle('govuk-radios__conditional--hidden', !show)
}

export const restoreDateInputs = (form, prefix, date = {}) => {
  const dayInput = form.querySelector(`#${prefix}-day`)
  const monthInput = form.querySelector(`#${prefix}-month`)
  const yearInput = form.querySelector(`#${prefix}-year`)

  if (dayInput) dayInput.value = date.day || ''
  if (monthInput) monthInput.value = date.month || ''
  if (yearInput) yearInput.value = date.year || ''
}

const snapshotConditionalFields = (conditional, cache) => {
  const data = {}

  conditional.querySelectorAll('input, select, textarea').forEach((field) => {
    const key = field.name || field.id
    if (!key) return

    if (field.type === 'radio') {
      if (field.checked) {
        data[key] = field.value
      }
      return
    }

    if (field.type === 'checkbox') {
      data[key] = field.checked
    } else {
      data[key] = field.value
    }
  })

  cache.set(conditional.id, data)
}

const restoreConditionalFields = (conditional, cache) => {
  const data = cache.get(conditional.id)
  if (!data) return

  conditional.querySelectorAll('input, select, textarea').forEach((field) => {
    const key = field.name || field.id
    if (!key) return

    if (field.type === 'radio') {
      field.checked = data[key] === field.value
      return
    }

    if (!(key in data)) return

    if (field.type === 'checkbox') {
      field.checked = data[key]
    } else {
      field.value = data[key]
    }
  })
}

const initPreserveConditionalFieldsInGroup = (radiosRoot) => {
  const conditionals = [...radiosRoot.querySelectorAll('.govuk-radios__conditional[id]')]
  if (!conditionals.length) return

  const cache = new Map()

  const syncConditionals = (changeTarget) => {
    conditionals.forEach((conditional) => {
      if (conditional.classList.contains('govuk-radios__conditional--hidden')) {
        snapshotConditionalFields(conditional, cache)
        return
      }

      if (changeTarget && conditional.contains(changeTarget)) {
        snapshotConditionalFields(conditional, cache)
        return
      }

      restoreConditionalFields(conditional, cache)
    })
  }

  conditionals.forEach((conditional) => {
    conditional.addEventListener('input', () => {
      if (!conditional.classList.contains('govuk-radios__conditional--hidden')) {
        snapshotConditionalFields(conditional, cache)
      }
    })
  })

  radiosRoot.addEventListener('change', (event) => {
    requestAnimationFrame(() => syncConditionals(event.target))
  })

  syncConditionals()
}

export const initPreserveConditionalFieldValues = (root = document) => {
  root.querySelectorAll('[data-module="govuk-radios"]').forEach(initPreserveConditionalFieldsInGroup)
}
