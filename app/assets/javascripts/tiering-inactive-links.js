export const markPrototypeOnlyLink = (link) => {
  if (link.dataset.tieringPrototypeOnlyMarked === 'true') return

  link.setAttribute('aria-disabled', 'true')
  link.setAttribute('tabindex', '-1')
  link.dataset.tieringPrototypeOnlyMarked = 'true'

  if (!link.querySelector('[data-tiering-prototype-only-hint]')) {
    const hint = document.createElement('span')
    hint.className = 'govuk-visually-hidden'
    hint.dataset.tieringPrototypeOnlyHint = 'true'
    hint.textContent = ' (not available in this prototype)'
    link.appendChild(hint)
  }
}

export const initTieringInactiveLinks = (root = document) => {
  root.querySelectorAll('[data-tiering-inactive-link]').forEach((link) => {
    markPrototypeOnlyLink(link)
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })
  })

  root.querySelectorAll('.assessment-section-navigation a[href="#"]').forEach((link) => {
    markPrototypeOnlyLink(link)
  })
}
