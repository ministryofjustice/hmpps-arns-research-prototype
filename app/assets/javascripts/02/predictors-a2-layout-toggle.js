//
// a2 / a2b – activate Return to OASys as a layout toggle
//

const activateLayoutToggleButton = (href) => {
  const button = document.querySelector('.assessment-service-header .assessment-layout__return-to-oasys')
  if (!button) return

  button.setAttribute('href', href)
  button.removeAttribute('aria-disabled')
  button.removeAttribute('tabindex')
  button.removeAttribute('data-predictors-inactive-link')
  button.querySelector('[data-predictors-prototype-only-hint]')?.remove()
}

export const initA2LayoutToggleButtons = () => {
  const path = window.location.pathname

  if (path.includes('/a2b')) {
    activateLayoutToggleButton('a2.html')
    return
  }

  if (path.endsWith('/a2') || path.includes('/a2.html')) {
    activateLayoutToggleButton('a2b.html')
  }
}
