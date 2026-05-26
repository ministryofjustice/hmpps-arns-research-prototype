//
// Side navigation – clickable in the prototype, navigation disabled until pages exist
//

window.GOVUKPrototypeKit.documentReady(() => {
  const nav = document.querySelector('.assessment-side-navigation')
  if (!nav) return

  nav.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })
  })
})
