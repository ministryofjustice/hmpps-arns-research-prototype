window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-san-back]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !document.referrer || window.history.length < 2) return
      event.preventDefault()
      window.history.back()
    })
  })
})