export const markPrototypeOnlyLink = (link) => {
  if (link.dataset.predictorsPrototypeOnlyMarked === 'true') return

  link.setAttribute('aria-disabled', 'true')
  link.setAttribute('tabindex', '-1')
  link.dataset.predictorsPrototypeOnlyMarked = 'true'

  if (!link.querySelector('[data-predictors-prototype-only-hint]')) {
    const hint = document.createElement('span')
    hint.className = 'govuk-visually-hidden'
    hint.dataset.predictorsPrototypeOnlyHint = 'true'
    hint.textContent = ' (not available in this prototype)'
    link.appendChild(hint)
  }
}

export const initTieringInactiveLinks = (root = document) => {
  root.querySelectorAll('[data-predictors-inactive-link]').forEach((link) => {
    markPrototypeOnlyLink(link)
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })
  })

  root.querySelectorAll('.assessment-section-navigation a[href="#"]:not([data-primary-navigation-service-name])').forEach((link) => {
    markPrototypeOnlyLink(link)
  })

  root.querySelectorAll('[data-primary-navigation-service-name]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })
  })
}
