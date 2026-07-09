//
// b1 – cycle page layouts via Return to OASys
// default: caption topic + question H1
// section: caption Predictors + topic H1 + question in content
//

const STORAGE_KEY = 'tiering-b1-caption-progress'
const VARIANTS = ['default', 'section']

const isB1Page = () => {
  const path = window.location.pathname
  return path.includes('/02/') && (path.endsWith('/b1') || path.includes('/b1.html'))
}

const getStoredVariant = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return VARIANTS.includes(stored) ? stored : 'default'
}

const setStoredVariant = (variant) => {
  sessionStorage.setItem(STORAGE_KEY, variant)
}

const getNextVariant = (current) => {
  const index = VARIANTS.indexOf(current)
  return VARIANTS[(index + 1) % VARIANTS.length]
}

const applyVariant = (variant) => {
  const isSection = variant === 'section'

  document.querySelectorAll('[data-b1-caption-variant]').forEach((el) => {
    const captionVariant = el.dataset.b1CaptionVariant
    if (captionVariant === 'default') {
      el.toggleAttribute('hidden', isSection)
    } else if (captionVariant === 'section') {
      el.toggleAttribute('hidden', !isSection)
    }
  })

  document.querySelectorAll('[data-b1-heading-variant]').forEach((el) => {
    const headingVariant = el.dataset.b1HeadingVariant
    el.toggleAttribute('hidden', headingVariant === 'section' ? !isSection : isSection)
  })

  document.querySelectorAll('[data-b1-header-hint]').forEach((el) => {
    el.toggleAttribute('hidden', isSection)
  })

  document.querySelectorAll('[data-b1-content-question]').forEach((el) => {
    el.toggleAttribute('hidden', !isSection)
  })

  const fieldset = document.querySelector('[data-b1-fieldset]')
  if (fieldset) {
    fieldset.setAttribute(
      'aria-describedby',
      isSection ? 'accommodation-suitable-content-hint' : 'accommodation-suitable-hint'
    )
  }
}

const activateToggleButton = (button) => {
  button.removeAttribute('aria-disabled')
  button.removeAttribute('tabindex')
  button.removeAttribute('data-tiering-inactive-link')
  button.querySelector('[data-tiering-prototype-only-hint]')?.remove()
  button.setAttribute('href', '#')
  button.dataset.b1CaptionProgressToggle = 'true'
}

export const initB1CaptionProgressToggle = () => {
  if (!isB1Page()) return

  const button = document.querySelector(
    '.assessment-service-header .assessment-layout__return-to-oasys'
  )
  const caption = document.querySelector('[data-b1-layout-caption]')
  if (!button || !caption) return

  activateToggleButton(button)
  applyVariant(getStoredVariant())

  button.addEventListener('click', (event) => {
    event.preventDefault()
    const nextVariant = getNextVariant(getStoredVariant())
    setStoredVariant(nextVariant)
    applyVariant(nextVariant)
  })
}
