//
// a1 – toggle NDelius source notice between inset and hint via Return to OASys
//

const STORAGE_KEY = 'tiering-a1-source-notice'
const VARIANTS = ['inset', 'hint']

const isA1Page = () => {
  const path = window.location.pathname
  return (
    (path.includes('/02/') || path.includes('/03/') || path.includes('/dev/')) &&
    (path.endsWith('/a1') || path.includes('/a1.html'))
  )
}

const getStoredVariant = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return VARIANTS.includes(stored) ? stored : 'inset'
}

const setStoredVariant = (variant) => {
  sessionStorage.setItem(STORAGE_KEY, variant)
}

const applyVariant = (variant) => {
  const root = document.querySelector('[data-a1-source-notice]')
  if (!root) return

  root.querySelectorAll('[data-a1-source-notice-variant]').forEach((el) => {
    el.toggleAttribute('hidden', el.dataset.a1SourceNoticeVariant !== variant)
  })

  document.querySelectorAll('[data-a1-incorrect-info-details]').forEach((el) => {
    el.toggleAttribute('hidden', variant === 'inset')
  })
}

const activateToggleButton = (button) => {
  button.removeAttribute('aria-disabled')
  button.removeAttribute('tabindex')
  button.removeAttribute('data-tiering-inactive-link')
  button.removeAttribute('data-predictors-inactive-link')
  button.querySelector('[data-tiering-prototype-only-hint], [data-predictors-prototype-only-hint]')?.remove()
  button.setAttribute('href', '#')
  button.dataset.a1SourceNoticeToggle = 'true'
}

export const initA1SourceNoticeToggle = () => {
  if (!isA1Page()) return

  const button = document.querySelector(
    '.assessment-service-header .assessment-layout__return-to-oasys'
  )
  const notice = document.querySelector('[data-a1-source-notice]')
  if (!button || !notice) return

  // Return to OASys navigates a1 ↔ a1b when wired as a layout toggle
  const href = button.getAttribute('href') || ''
  if (href.includes('a1b')) return

  activateToggleButton(button)
  applyVariant(getStoredVariant())

  button.addEventListener('click', (event) => {
    event.preventDefault()
    const nextVariant = getStoredVariant() === 'inset' ? 'hint' : 'inset'
    setStoredVariant(nextVariant)
    applyVariant(nextVariant)
  })
}
