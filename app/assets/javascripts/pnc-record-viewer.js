//
// PNC record image viewer – discourage casual copy/select on prototype pages
//

window.GOVUKPrototypeKit.documentReady(() => {
  const viewer = document.querySelector('[data-pnc-record-viewer]')
  if (!viewer) return

  viewer.addEventListener('contextmenu', (event) => {
    event.preventDefault()
  })

  viewer.querySelectorAll('.pnc-record-viewer__image').forEach((image) => {
    image.addEventListener('dragstart', (event) => {
      event.preventDefault()
    })
  })
})
