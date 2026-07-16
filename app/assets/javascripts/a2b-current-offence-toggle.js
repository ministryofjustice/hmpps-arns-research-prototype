//
// a2b – toggle current offence section between default and highlighted inset
//

const STORAGE_KEY = 'predictors-a2b-current-offence-variant'
const VARIANTS = ['default', 'highlighted']

const isInteractiveTarget = (target) =>
  Boolean(
    target.closest(
      'a, button, input, label, select, textarea, summary, [data-offence-search-input], [data-offence-search-submit]'
    )
  )

const getStoredVariant = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return VARIANTS.includes(stored) ? stored : 'default'
}

const setStoredVariant = (variant) => {
  sessionStorage.setItem(STORAGE_KEY, variant)
}

const applyVariant = (root, variant) => {
  const panel = root.querySelector('[data-a2b-current-offence-panel]')
  const notice = root.querySelector('[data-a2b-current-offence-notice]')
  if (!panel || !notice) return

  root.dataset.a2bCurrentOffenceVariant = variant
  root.setAttribute('aria-pressed', String(variant === 'highlighted'))

  panel.classList.toggle('govuk-inset-text', variant === 'highlighted')
  panel.classList.toggle('guidance-panel', variant === 'highlighted')
  panel.classList.toggle('govuk-!-margin-0', variant === 'highlighted')

  notice.classList.toggle('govuk-inset-text', variant === 'default')
  notice.classList.toggle('a2b-current-offence__notice--plain', variant === 'highlighted')
}

const cycleVariant = (root) => {
  const next = getStoredVariant() === 'highlighted' ? 'default' : 'highlighted'
  setStoredVariant(next)
  applyVariant(root, next)
}

export const initA2bCurrentOffenceToggle = () => {
  const root = document.querySelector('[data-a2b-current-offence]')
  if (!root) return

  root.setAttribute('role', 'button')
  root.setAttribute('tabindex', '0')
  root.setAttribute('aria-label', 'Toggle current offence layout')

  applyVariant(root, getStoredVariant())

  root.addEventListener('click', (event) => {
    if (isInteractiveTarget(event.target)) return
    cycleVariant(root)
  })

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (isInteractiveTarget(event.target)) return
    event.preventDefault()
    cycleVariant(root)
  })
}
