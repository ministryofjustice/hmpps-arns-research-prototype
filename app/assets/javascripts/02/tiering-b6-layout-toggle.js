//
// b6 / b6b – activate Return to OASys as a layout toggle
//

const activateLayoutToggleButton = (href) => {
  const button = document.querySelector('.assessment-service-header .assessment-layout__return-to-oasys')
  if (!button) return

  button.setAttribute('href', href)
  button.removeAttribute('aria-disabled')
  button.removeAttribute('tabindex')
  button.removeAttribute('data-tiering-inactive-link')
  button.querySelector('[data-tiering-prototype-only-hint]')?.remove()
}

export const initB6LayoutToggleButtons = () => {
  const path = window.location.pathname

  if (path.includes('/02/b6b')) {
    activateLayoutToggleButton('b6.html')
    return
  }

  if (path.endsWith('/02/b6') || path.includes('/02/b6.html')) {
    activateLayoutToggleButton('b6b.html')
  }
}
