//
// Alcohol units help (details panel on b6)
//

const EMPTY_MESSAGE = 'Please add the number of drinks to calculate'

const parseDrinkCount = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const count = Number(trimmed)
  if (!Number.isFinite(count) || count < 0) return null

  return count
}

const formatUnitsTotal = (total) => {
  const rounded = Math.round(total * 10) / 10
  const label = rounded === 1 ? 'unit' : 'units'
  return `${rounded} ${label}`
}

const formatDrinksTotal = (total) => {
  const rounded = Math.round(total * 10) / 10
  const label = rounded === 1 ? 'drink' : 'drinks'
  return `${rounded} ${label}`
}

const applyAlcoholUnitsView = (container, view) => {
  container.querySelector('[data-alcohol-units-variant="table"]')?.toggleAttribute('hidden', view !== 'table')
  container.querySelector('[data-alcohol-units-variant="calculator"]')?.toggleAttribute('hidden', view !== 'calculator')
}

const clearAlcoholUnitsResult = (resultEl, clearAllLink) => {
  if (!resultEl) return

  resultEl.textContent = ''
  resultEl.classList.remove(
    'alcohol-units-help__result--empty',
    'alcohol-units-help__result--total'
  )
  clearAllLink?.setAttribute('hidden', '')
}

const showEmptyAlcoholUnitsResult = (resultEl, clearAllLink) => {
  if (!resultEl) return

  resultEl.textContent = EMPTY_MESSAGE
  resultEl.classList.remove('alcohol-units-help__result--total')
  resultEl.classList.add('alcohol-units-help__result--empty')
  clearAllLink?.setAttribute('hidden', '')
}

const showTotalAlcoholUnitsResult = (resultEl, clearAllLink, message) => {
  if (!resultEl) return

  resultEl.textContent = message
  resultEl.classList.remove('alcohol-units-help__result--empty')
  resultEl.classList.add('alcohol-units-help__result--total')
  clearAllLink?.removeAttribute('hidden')
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-module="alcohol-units-help"]').forEach((container) => {
    const calculatorVariant = container.querySelector('[data-alcohol-units-variant="calculator"]')
    const viewInputs = container.querySelectorAll('[data-alcohol-units-view-input]')
    const drinkInputs = calculatorVariant?.querySelectorAll('[data-alcohol-units-drinks-input]') || []
    const calculateButton = container.querySelector('[data-alcohol-units-calculate]')
    const clearAllLink = container.querySelector('[data-alcohol-units-clear-all]')
    const resultEl = container.querySelector('[data-alcohol-units-result]')

    const getSelectedView = () =>
      container.querySelector('[data-alcohol-units-view-input]:checked')?.value || 'table'

    const calculateUnits = () => {
      const scrollX = window.scrollX
      const scrollY = window.scrollY

      let hasDrinkCount = false
      let totalUnits = 0
      let totalDrinks = 0

      drinkInputs.forEach((input) => {
        const count = parseDrinkCount(input.value)
        if (count == null) return

        hasDrinkCount = true
        totalDrinks += count
        const unitsPerDrink = Number(input.dataset.alcoholUnitsPerDrink)
        if (!Number.isFinite(unitsPerDrink)) return

        totalUnits += count * unitsPerDrink
      })

      if (!hasDrinkCount) {
        showEmptyAlcoholUnitsResult(resultEl, clearAllLink)
      } else {
        showTotalAlcoholUnitsResult(
          resultEl,
          clearAllLink,
          `Total: ${formatUnitsTotal(totalUnits)} (${formatDrinksTotal(totalDrinks)})`
        )
      }

      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY)
      })
    }

    const clearAllDrinks = () => {
      drinkInputs.forEach((input) => {
        input.value = ''
      })
      clearAlcoholUnitsResult(resultEl, clearAllLink)
    }

    viewInputs.forEach((input) => {
      input.addEventListener('change', () => {
        applyAlcoholUnitsView(container, getSelectedView())
      })
    })

    calculateButton?.addEventListener('click', (event) => {
      event.preventDefault()
      calculateUnits()
    })

    clearAllLink?.addEventListener('click', (event) => {
      event.preventDefault()
      clearAllDrinks()
    })

    applyAlcoholUnitsView(container, getSelectedView())
  })
})
