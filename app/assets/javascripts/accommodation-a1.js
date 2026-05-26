//
// Branching for accommodation question 1 (a1)
//

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('accommodation-a1-form')
  if (!form) return

  const errorSummary = document.getElementById('accommodation-a1-error-summary')

  const casPaths = [
    'Approved premises',
    'Community Accommodation Service Tier 2 (CAS2)',
    'Community Accommodation Service Tier 3 (CAS3)'
  ]

  const showError = (message) => {
    if (!errorSummary) return
    errorSummary.hidden = false
    errorSummary.querySelector('.govuk-error-summary__body').innerHTML =
      `<p class="govuk-body"><a class="govuk-link" href="#accommodation_settled">${message}</a></p>`
    errorSummary.focus()
  }

  const hideError = () => {
    if (errorSummary) errorSummary.hidden = true
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    hideError()

    const selected = form.querySelector('input[name="accommodation"]:checked')

    if (!selected) {
      showError('Select a type of accommodation')
      return
    }

    if (selected.value === 'Settled') {
      window.location.href = 'a2.html'
      return
    }

    if (selected.value === 'Temporary') {
      const tempType = form.querySelector('input[name="temporary_type"]:checked')
      if (!tempType) {
        showError('Select a type of temporary accommodation')
        return
      }
      window.location.href = casPaths.includes(tempType.value) ? 'a4.html' : 'a2.html'
      return
    }

    if (selected.value === 'No accommodation') {
      window.location.href = 'a2-noacco.html'
    }
  })
})
