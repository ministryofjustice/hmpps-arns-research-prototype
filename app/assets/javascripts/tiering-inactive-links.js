export const initTieringInactiveLinks = (root = document) => {
  root.querySelectorAll('[data-tiering-inactive-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })
  })
}
