//
// a1 / a1b – activate Return to OASys as a layout toggle
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

export const initA1LayoutToggleButtons = () => {
  const path = window.location.pathname

  // Layout experiments live on prototype 02 only
  if (!path.includes('/02/')) return

  if (path.includes('/a1b')) {
    activateLayoutToggleButton('a1.html')
    return
  }

  if (path.endsWith('/a1') || path.includes('/a1.html')) {
    activateLayoutToggleButton('a1b.html')
  }
}
