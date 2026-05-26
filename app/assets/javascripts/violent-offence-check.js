//
// Violent offence checker (details panel on a2)
//

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-module="violent-offence-check"]').forEach(async (container) => {
    const searchRoot = container.querySelector('[data-offence-search-check]')
    const checkButton = container.querySelector('[data-violent-check-submit]')
    const resultPanel = container.querySelector('[data-violent-check-result]')
    const resultName = container.querySelector('[data-violent-check-offence-name]')

    if (!searchRoot || !checkButton) return

    let pendingSelection = null

    searchRoot.addEventListener('offence-search:selected', (event) => {
      pendingSelection = event.detail
    })

    await window.initOffenceSearch(searchRoot)

    const input = searchRoot.querySelector('[data-offence-search-input]')
    const listbox = searchRoot.querySelector('[data-offence-search-listbox]')

    const runCheck = () => {
      const label = pendingSelection?.label || input?.value.trim()

      if (!label) {
        if (input) input.focus()
        return
      }

      if (resultName) resultName.textContent = label
      if (resultPanel) resultPanel.hidden = false
    }

    checkButton.addEventListener('click', runCheck)

    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return

        const hasHighlightedOption =
          listbox &&
          !listbox.hidden &&
          listbox.querySelector('.offence-autocomplete__option--focused')

        if (hasHighlightedOption) return

        event.preventDefault()
        runCheck()
      })
    }
  })
})
