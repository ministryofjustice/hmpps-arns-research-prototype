//
// Shared form helpers for the Strengths and needs prototype
//

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

export const updateCharacterCount = (textarea) => {
  const hint = document.querySelector(`[data-san-character-count="${textarea.id}"]`)
  if (!hint) return
  const max = Number(textarea.getAttribute('maxlength'))
  if (!max) return
  const remaining = Math.max(0, max - textarea.value.length)
  const noun = remaining === 1 ? 'character' : 'characters'
  hint.textContent = `You have ${remaining.toLocaleString('en-GB')} ${noun} remaining`
}

export const updateAllCharacterCounts = () => {
  document.querySelectorAll('textarea[maxlength]').forEach((textarea) => {
    if (textarea instanceof HTMLTextAreaElement) updateCharacterCount(textarea)
  })
}

export const clearErrors = () => {
  const mount = document.querySelector('[data-san-error-summary]')
  if (mount) {
    mount.hidden = true
    mount.innerHTML = ''
  }
  document.querySelectorAll('[data-san-error-group]').forEach((group) => {
    group.classList.remove('govuk-form-group--error')
    group.querySelectorAll(':scope > .govuk-error-message, .govuk-fieldset > .govuk-error-message').forEach((node) => node.remove())
  })
}

export const labelled = (labels, value) => labels[value] || ''

export const scrollToHash = () => {
  if (!window.location.hash) return
  let id = window.location.hash.slice(1)
  try { id = decodeURIComponent(id) } catch (error) { /* keep the raw hash */ }
  const target = document.getElementById(id)
  if (!(target instanceof HTMLElement) || target.closest('[hidden], .san-is-hidden')) return

  const form = target.closest('form')
  const pageHeading = form?.querySelector('h1')
  let scrollTarget = target
  if (pageHeading) {
    const headingTop = pageHeading.getBoundingClientRect().top + window.scrollY
    const targetTop = target.getBoundingClientRect().top + window.scrollY
    if (targetTop - headingTop < 240) scrollTarget = pageHeading
  }

  const top = scrollTarget.getBoundingClientRect().top + window.scrollY - 16
  window.scrollTo({ top: Math.max(0, top) })
}
