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

const isDevProtoPage = () => window.location.pathname.includes('/dev/')

export const initTieringInactiveLinks = (root = document) => {
  root.querySelectorAll('[data-tiering-inactive-link], [data-predictors-inactive-link]').forEach((link) => {
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

  if (isDevProtoPage()) {
    const disablePrototypeHeaderLink = (link) => {
      markPrototypeOnlyLink(link)
      link.addEventListener('click', (event) => {
        event.preventDefault()
      })
    }

    root.querySelectorAll('a.probation-common-header__submenu-link[href="/sign-out"]').forEach(disablePrototypeHeaderLink)

    root
      .querySelectorAll('.probation-common-header__services-menu a.probation-common-header__submenu-link[href="/dev/a1"]')
      .forEach(disablePrototypeHeaderLink)
  }
}
