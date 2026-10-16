//
// Shared form helpers for Prototype 1 (Community) Strengths and needs.
// Section scripts import from here instead of copying DOM / validation UI.
//

import { isSanPrisonJourney } from './session.js'

export const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

export const revealCheckedConditionals = () => {
  document.querySelectorAll('[data-aria-controls]').forEach((input) => {
    const controls = input.getAttribute('data-aria-controls')
    if (!controls) return
    controls.split(' ').forEach((id) => {
      const panel = document.getElementById(id)
      if (!panel) return
      const hidden = !(input instanceof HTMLInputElement && input.checked)
      panel.classList.toggle('govuk-radios__conditional--hidden', hidden)
      panel.classList.toggle('govuk-checkboxes__conditional--hidden', hidden)
    })
  })
}

const linkCharacterCount = (textarea, hint) => {
  if (!hint.id) hint.id = `${textarea.id}-info`
  const tokens = (textarea.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
  if (!tokens.includes(hint.id)) {
    tokens.push(hint.id)
    textarea.setAttribute('aria-describedby', tokens.join(' '))
  }
}

export const updateCharacterCount = (textarea) => {
  const hint = document.querySelector(`[data-san-character-count="${CSS.escape(textarea.id)}"]`)
  if (!hint) return
  const max = Number(textarea.getAttribute('maxlength'))
  if (!max) return
  const remaining = Math.max(0, max - textarea.value.length)
  const noun = remaining === 1 ? 'character' : 'characters'
  hint.textContent = `You have ${remaining.toLocaleString('en-GB')} ${noun} remaining`
  linkCharacterCount(textarea, hint)
}

export const updateAllCharacterCounts = () => {
  document.querySelectorAll('textarea[maxlength]').forEach((textarea) => {
    if (textarea instanceof HTMLTextAreaElement) updateCharacterCount(textarea)
  })
}

const describedByTokens = (element) => (
  (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
)

const appendDescribedBy = (element, id) => {
  const tokens = describedByTokens(element)
  if (!tokens.includes(id)) tokens.push(id)
  element.setAttribute('aria-describedby', tokens.join(' '))
}

const removeDescribedBy = (element, id) => {
  const tokens = describedByTokens(element).filter((token) => token !== id)
  if (tokens.length) element.setAttribute('aria-describedby', tokens.join(' '))
  else element.removeAttribute('aria-describedby')
}

const errorMessageId = (group, index) => (
  `san-error-${String(group).replace(/[^a-zA-Z0-9_-]/g, '-')}-${index}`
)

const describeTarget = (group) => {
  const fieldset = group.querySelector(':scope > fieldset, :scope > .govuk-fieldset')
  if (fieldset) return fieldset
  return group.querySelector('textarea, select, input:not([type="hidden"])')
}

const insertErrorMessage = (group, message) => {
  const fieldset = group.querySelector(':scope > fieldset, :scope > .govuk-fieldset')
  const container = fieldset || group
  const controls = container.querySelector(':scope > .govuk-radios, :scope > .govuk-checkboxes, :scope > .govuk-date-input, :scope > .govuk-select, :scope > select, :scope > textarea, :scope > input:not([type="hidden"]), :scope > .govuk-textarea')
  if (controls) {
    container.insertBefore(message, controls)
    return
  }
  const label = container.querySelector(':scope > label, :scope > .govuk-label, :scope > legend')
  if (label) {
    label.after(message)
    return
  }
  container.prepend(message)
}

const focusErrorField = (target) => {
  if (!(target instanceof HTMLElement)) return
  const group = target.closest('[data-san-error-group]') || target
  const field = Array.from(group.querySelectorAll('input, textarea, select')).find((element) => {
    if (!(element instanceof HTMLElement)) return false
    if (element instanceof HTMLInputElement && element.type === 'hidden') return false
    if (element.closest('.govuk-radios__conditional--hidden, .govuk-checkboxes__conditional--hidden, [hidden], .san-is-hidden')) return false
    return true
  })
  const focusable = field instanceof HTMLElement ? field : target
  focusable.scrollIntoView({ block: 'center' })
  if (focusable instanceof HTMLElement) focusable.focus()
}

// Inline and summary errors. Groups are marked with data-san-error-group.
export const clearErrors = () => {
  document.querySelectorAll('[data-san-error-message]').forEach((node) => {
    const targetId = node.getAttribute('data-describedby-target')
    const target = targetId ? document.getElementById(targetId) : null
    if (target && node.id) removeDescribedBy(target, node.id)
    node.remove()
  })
  const mount = document.querySelector('[data-san-error-summary]')
  if (mount) {
    mount.hidden = true
    mount.innerHTML = ''
  }
  document.querySelectorAll('[data-san-error-group]').forEach((group) => {
    group.classList.remove('govuk-form-group--error')
    group.querySelectorAll('.govuk-error-message').forEach((node) => node.remove())
  })
}

export const showErrors = (errors) => {
  clearErrors()
  if (!errors.length) return

  errors.forEach((error, index) => {
    const group = document.querySelector(`[data-san-error-group="${CSS.escape(error.group)}"]`)
    if (!group) return
    group.classList.add('govuk-form-group--error')
    const message = document.createElement('p')
    message.id = errorMessageId(error.group, index)
    message.className = 'govuk-error-message'
    message.setAttribute('data-san-error-message', '')
    message.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${escapeHtml(error.text)}`
    const described = describeTarget(group)
    if (described instanceof HTMLElement) {
      if (!described.id) described.id = `${message.id}-target`
      message.setAttribute('data-describedby-target', described.id)
      appendDescribedBy(described, message.id)
    }
    insertErrorMessage(group, message)
  })

  const mount = document.querySelector('[data-san-error-summary]')
  if (!mount) return
  const items = errors.map((error) => `<li><a href="${escapeHtml(error.href)}">${escapeHtml(error.text)}</a></li>`).join('')
  mount.hidden = false
  mount.innerHTML = `<div class="govuk-error-summary" role="alert" tabindex="-1">
    <h2 class="govuk-error-summary__title">There is a problem</h2>
    <div class="govuk-error-summary__body">
      <ul class="govuk-list govuk-error-summary__list">${items}</ul>
    </div>
  </div>`
  mount.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || ''
      let id = href.slice(1)
      try { id = decodeURIComponent(id) } catch (decodeError) { /* keep the raw id */ }
      const target = document.getElementById(id)
      if (!target) return
      event.preventDefault()
      focusErrorField(target)
    })
  })
  const summary = mount.querySelector('.govuk-error-summary')
  if (summary instanceof HTMLElement) summary.focus()
}

// Shared answer labels used on summaries.
export const labelled = (labels, value) => labels[value] || ''

export const YES_NO = { yes: 'Yes', no: 'No' }

export const YES_NO_UNKNOWN = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

export const CHANGES_LABELS = {
  maintain: 'I have already made positive changes and want to maintain them',
  active: 'I am actively making changes',
  'know-how': 'I want to make changes and know how to',
  'need-help': 'I want to make changes but need help',
  thinking: 'I am thinking about making changes',
  no: 'I do not want to make changes',
  'no-answer': 'I do not want to answer',
  'not-present': 'Alex is not present',
  'not-applicable': 'Not applicable'
}

// Read and restore fields. Ignore values inside collapsed GOV.UK conditionals.
export const isInHiddenConditional = (element) => {
  if (!(element instanceof Element)) return true
  if (element.closest('.govuk-radios__conditional--hidden, .govuk-checkboxes__conditional--hidden, .san-is-hidden, [hidden]')) {
    return true
  }
  const conditional = element.closest('.govuk-radios__conditional, .govuk-checkboxes__conditional')
  return Boolean(conditional && conditional.hidden)
}

export const revealSoon = () => {
  revealCheckedConditionals()
  window.setTimeout(revealCheckedConditionals, 50)
  window.setTimeout(revealCheckedConditionals, 300)
}

export const checkedValue = (name) => {
  const selected = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`))
    .find((input) => input instanceof HTMLInputElement && input.checked && !isInHiddenConditional(input))
  return selected instanceof HTMLInputElement ? selected.value : ''
}

export const checkedValues = (name) => Array.from(document.querySelectorAll(`input[type="checkbox"][name="${name}"]`))
  .filter((input) => input instanceof HTMLInputElement && input.checked && !isInHiddenConditional(input))
  .map((input) => input.value)

export const fieldValue = (id) => {
  const field = document.getElementById(id)
  if (
    !(field instanceof HTMLTextAreaElement) &&
    !(field instanceof HTMLInputElement) &&
    !(field instanceof HTMLSelectElement)
  ) return ''
  if (isInHiddenConditional(field)) return ''
  return field.value.trim()
}

export const selectRadio = (name, value) => {
  if (!value) return
  const input = document.querySelector(`input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`)
  if (input instanceof HTMLInputElement) input.checked = true
}

export const selectChecks = (name, values) => {
  const selected = Array.isArray(values) ? values : []
  document.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`).forEach((input) => {
    if (input instanceof HTMLInputElement) input.checked = selected.includes(input.value)
  })
}

export const setField = (id, value) => {
  const field = document.getElementById(id)
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
    field.value = value || ''
  }
}

export const setHidden = (element, hidden) => {
  if (!element) return
  element.hidden = hidden
  element.classList.toggle('san-is-hidden', hidden)
}

export const fromSummary = () => new URLSearchParams(window.location.search).get('from') === 'summary'

export const summaryChangeHref = (page, hash = '') => `${page}?from=summary${hash ? `#${hash}` : ''}`

export const focusTargetField = (target, options = {}) => {
  if (!(target instanceof HTMLElement) || target.closest('[hidden], .san-is-hidden')) return

  let field = target
  if (target instanceof HTMLInputElement && ['radio', 'checkbox'].includes(target.type) && target.name && target.form) {
    field = Array.from(target.form.elements).find((element) => (
      element instanceof HTMLInputElement &&
      element.name === target.name &&
      element.checked
    )) || target
  } else if (!target.matches('input, select, textarea')) {
    field = target.querySelector('input:checked') || target.querySelector('select, textarea, input')
  }
  if (field instanceof HTMLElement) field.focus(options)
}

export const scrollToHash = () => {
  if (!window.location.hash) return
  let id = window.location.hash.slice(1)
  try { id = decodeURIComponent(id) } catch (error) { /* keep the raw hash */ }
  const target = document.getElementById(id)
  if (!(target instanceof HTMLElement) || target.closest('[hidden], .san-is-hidden')) return

  const form = target.closest('form')
  const pageHeading = form?.querySelector(':scope > h1')
  let scrollTarget = target
  if (pageHeading) {
    const headingTop = pageHeading.getBoundingClientRect().top + window.scrollY
    const targetTop = target.getBoundingClientRect().top + window.scrollY
    if (targetTop - headingTop < 240) scrollTarget = pageHeading
  }

  const top = scrollTarget.getBoundingClientRect().top + window.scrollY - 16
  window.scrollTo({ top: Math.max(0, top) })
  focusTargetField(target, { preventScroll: true })
}

export const setDocumentTitle = () => {
  const heading = [...document.querySelectorAll('#main-content h1')].find((candidate) => (
    !candidate.closest('[hidden], .san-is-hidden, .govuk-radios__conditional--hidden, .govuk-checkboxes__conditional--hidden')
  ))
  if (!(heading instanceof HTMLElement)) return
  const clone = heading.cloneNode(true)
  clone.querySelectorAll('.govuk-visually-hidden').forEach((node) => node.remove())
  const text = (clone.textContent || '').replace(/\s+/g, ' ').trim()
  if (text) document.title = `${text} - Strengths and needs`
}

const syncSectionStatus = () => {
  document.querySelectorAll('[data-san-section-status]').forEach((node) => {
    const key = node.getAttribute('data-san-section-status')
    const icon = key ? document.querySelector(`[data-section-complete="${CSS.escape(key)}"]`) : null
    const complete = icon?.classList.contains('assessment-section-navigation__complete-icon--visible')
    node.textContent = complete ? ', Complete' : ', Incomplete'
  })
}

// Character counts, section complete text, and the document title for SAN research pages.
window.GOVUKPrototypeKit.documentReady(() => {
  if (!isSanPrisonJourney()) return
  updateAllCharacterCounts()
  const nav = document.querySelector('.san-side-navigation')
  if (nav) {
    new MutationObserver(syncSectionStatus).observe(nav, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    })
  }
  window.setTimeout(() => {
    syncSectionStatus()
    setDocumentTitle()
  }, 0)
})
