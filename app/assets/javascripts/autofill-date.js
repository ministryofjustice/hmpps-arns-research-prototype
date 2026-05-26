//
// Prototype: auto-fill date fields when any part is focused
//

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-autofill-date]').forEach((dateGroup) => {
    const day = dateGroup.querySelector('[data-date-part="day"]')
    const month = dateGroup.querySelector('[data-date-part="month"]')
    const year = dateGroup.querySelector('[data-date-part="year"]')

    if (!day || !month || !year) return

    const fillDate = () => {
      if (dateGroup.getAttribute('data-autofill-date') === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        day.value = String(yesterday.getDate())
        month.value = String(yesterday.getMonth() + 1)
        year.value = String(yesterday.getFullYear())
        return
      }

      day.value = dateGroup.dataset.autofillDay || '24'
      month.value = dateGroup.dataset.autofillMonth || '7'
      year.value = dateGroup.dataset.autofillYear || '2026'
    }

    ;[day, month, year].forEach((input) => {
      input.addEventListener('focus', fillDate)
    })
  })

  // a1 conviction date (legacy ids without data-autofill-date wrapper on inputs)
  const convictionDay = document.getElementById('current-conviction-date-day')
  const convictionMonth = document.getElementById('current-conviction-date-month')
  const convictionYear = document.getElementById('current-conviction-date-year')

  if (convictionDay && convictionMonth && convictionYear) {
    const fillConvictionDate = () => {
      convictionDay.value = '24'
      convictionMonth.value = '7'
      convictionYear.value = '2026'
    }

    ;[convictionDay, convictionMonth, convictionYear].forEach((input) => {
      input.addEventListener('focus', fillConvictionDate)
    })
  }
})
