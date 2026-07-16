//
// b1 – cycle page layouts via Return to OASys
// default: caption + question as H1 in the service header (a1 layout)
// section: caption + topic H1 in header, question as H2 in content
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

  document.querySelectorAll('[data-b1-heading-variant]').forEach((el) => {
    const headingVariant = el.dataset.b1HeadingVariant
    el.toggleAttribute('hidden', isSection ? headingVariant !== 'section' : headingVariant !== 'default')
  })

  // Always keep a1-style header spacing (never actions-only / legend-heading row)
  document.querySelectorAll('[data-b1-layout-heading]').forEach((el) => {
    el.classList.remove('assessment-service-header__question-row--legend-heading')
  })

  document.querySelectorAll('[data-b1-layout-header]').forEach((el) => {
    el.classList.remove('assessment-service-header--legend-heading')
  })

  document.querySelectorAll('[data-b1-header-hint]').forEach((el) => {
    el.toggleAttribute('hidden', isSection)
  })

  document.querySelectorAll('[data-b1-legend-hint]').forEach((el) => {
    el.toggleAttribute('hidden', true)
  })

  document.querySelectorAll('[data-b1-content-question]').forEach((el) => {
    el.toggleAttribute('hidden', !isSection)
  })

  const legend = document.querySelector('[data-b1-fieldset-legend]')
  if (legend) {
    legend.classList.add('govuk-visually-hidden')
    legend.classList.remove('govuk-fieldset__legend--l', 'govuk-!-margin-bottom-2', 'govuk-!-margin-bottom-4')
    legend.classList.add('govuk-fieldset__legend--m')
    legend.removeAttribute('id')

    legend.querySelectorAll('.govuk-caption-l').forEach((el) => {
      el.setAttribute('hidden', '')
    })
  }

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
  button.removeAttribute('data-predictors-inactive-link')
  button.querySelector('[data-tiering-prototype-only-hint], [data-predictors-prototype-only-hint]')?.remove()
  button.setAttribute('href', '#')
  button.dataset.b1CaptionProgressToggle = 'true'
}

export const initB1CaptionProgressToggle = () => {
  if (!isB1Page()) return

  const button = document.querySelector(
    '.assessment-service-header .assessment-layout__return-to-oasys'
  )
  const heading = document.querySelector('[data-b1-layout-heading]')
  if (!button || !heading) return

  activateToggleButton(button)
  applyVariant(getStoredVariant())

  button.addEventListener('click', (event) => {
    event.preventDefault()
    const nextVariant = getNextVariant(getStoredVariant())
    setStoredVariant(nextVariant)
    applyVariant(nextVariant)
  })
}
