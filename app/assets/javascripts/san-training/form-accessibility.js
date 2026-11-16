const characterCounts = new WeakMap()

export const updateCharacterCount = (textarea) => {
  let component = characterCounts.get(textarea)
  if (component) {
    component.updateCount()
    component.updateVisibleCountMessage()
    return
  }

  const hint = document.querySelector(`[data-san-character-count="${CSS.escape(textarea.id)}"]`)
  if (!hint) return

  const maxLength = Number(textarea.getAttribute('maxlength'))
  if (!Number.isInteger(maxLength) || maxLength <= 0) {
    throw new Error(`Invalid character limit for ${textarea.id}`)
  }

  const root = document.createElement('div')
  root.className = 'govuk-character-count'
  root.setAttribute('data-module', 'govuk-character-count')
  root.setAttribute('data-maxlength', String(maxLength))
  root.setAttribute('data-san-error-group', `character-count-${textarea.id}`)
  textarea.before(root)
  root.append(textarea, hint)
  textarea.classList.add('govuk-js-character-count')
  hint.id = `${textarea.id}-info`
  hint.classList.add('govuk-character-count__message')
  hint.textContent = `You can enter up to ${maxLength.toLocaleString('en-GB')} characters`
  const descriptions = new Set((textarea.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean))
  descriptions.add(hint.id)
  textarea.setAttribute('aria-describedby', [...descriptions].join(' '))

  component = new window.GOVUKFrontend.CharacterCount(root)
  characterCounts.set(textarea, component)
}

export const updateAllCharacterCounts = () => {
  document.querySelectorAll('textarea[maxlength], textarea.govuk-js-character-count').forEach(updateCharacterCount)
}

export const characterCountErrors = (form) => {
  const errors = []
  form.querySelectorAll('textarea.govuk-js-character-count').forEach((textarea) => {
    if (textarea.disabled || !textarea.getClientRects().length) return
    const component = characterCounts.get(textarea)
    component.updateCount()
    if (component.count <= component.maxLength) return
    const label = [...textarea.labels].map(node => node.textContent.trim()).join(' ')
    errors.push({
      group: `character-count-${textarea.id}`,
      href: `#${textarea.id}`,
      text: `${label} must be ${component.maxLength.toLocaleString('en-GB')} characters or fewer`
    })
  })
  return errors
}

export const focusCompletedSection = () => {
  const heading = document.querySelector('.san-content-header h1')
  heading.setAttribute('tabindex', '-1')
  heading.focus()
}
