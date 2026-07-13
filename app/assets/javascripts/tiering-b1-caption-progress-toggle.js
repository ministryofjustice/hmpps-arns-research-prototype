//
// b1 – cycle page layouts via Return to OASys
// default: question as fieldset legend (H1-as-legend) with caption
// section: caption Reoffending predictors + topic H1 + question in content
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
  const showLegendHeading = !isSection

  document.querySelectorAll('[data-b1-heading-variant]').forEach((el) => {
    const headingVariant = el.dataset.b1HeadingVariant
    el.toggleAttribute('hidden', isSection ? headingVariant !== 'section' : headingVariant !== 'default')
  })

  document.querySelectorAll('[data-b1-layout-heading]').forEach((el) => {
    el.classList.toggle('assessment-service-header__question-row--legend-heading', showLegendHeading)
  })

  document.querySelectorAll('[data-b1-layout-header]').forEach((el) => {
    el.classList.toggle('assessment-service-header--legend-heading', showLegendHeading)
  })

  document.querySelectorAll('[data-b1-header-hint]').forEach((el) => {
    el.toggleAttribute('hidden', isSection)
  })

  document.querySelectorAll('[data-b1-legend-hint]').forEach((el) => {
    el.toggleAttribute('hidden', isSection)
  })

  document.querySelectorAll('[data-b1-content-question]').forEach((el) => {
    el.toggleAttribute('hidden', !isSection)
  })

  const legend = document.querySelector('[data-b1-fieldset-legend]')
  if (legend) {
    legend.classList.toggle('govuk-visually-hidden', !showLegendHeading)
    legend.classList.toggle('govuk-fieldset__legend--l', showLegendHeading)
    legend.classList.toggle('govuk-fieldset__legend--m', !showLegendHeading)
    legend.classList.toggle('govuk-!-margin-bottom-2', showLegendHeading && Boolean(document.querySelector('[data-b1-legend-hint]')))
    legend.classList.toggle('govuk-!-margin-bottom-4', showLegendHeading && !document.querySelector('[data-b1-legend-hint]'))
    if (showLegendHeading && !legend.id) {
      legend.id = 'predictors-accommodation-suitable'
    } else if (!showLegendHeading) {
      legend.removeAttribute('id')
    }

    legend.querySelectorAll('.govuk-caption-l, .govuk-visually-hidden').forEach((el) => {
      el.toggleAttribute('hidden', !showLegendHeading)
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
