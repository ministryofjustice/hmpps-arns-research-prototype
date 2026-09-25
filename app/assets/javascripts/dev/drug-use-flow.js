const DRUG_USE_KEY = 'drug-use-selected-drugs'
const DRUG_USE_TIMING_KEY = 'drug-use-timing'
const INJECTED_DRUGS_KEY = 'drug-use-injected-drugs'

function getSelectedDrugs() {
  return Array.from(document.querySelectorAll('input[name="drugs-used"]:checked'))
    .map((input) => input.dataset.label)
    .filter(Boolean)
}

function saveSelectedDrugs() {
  sessionStorage.setItem(DRUG_USE_KEY, JSON.stringify(getSelectedDrugs()))
}

function saveDrugUseTiming() {
  const timing = Array.from(document.querySelectorAll('input[name^="when-used-"]:checked'))
    .map((input) => ({
      drugName: input.closest('fieldset').querySelector('legend').textContent.trim(),
      timeframe: input.value
    }))

  sessionStorage.setItem(DRUG_USE_TIMING_KEY, JSON.stringify(timing))
}

function readSelectedDrugs(fallbackDrugs) {
  try {
    const selectedDrugs = JSON.parse(sessionStorage.getItem(DRUG_USE_KEY))
    return Array.isArray(selectedDrugs) && selectedDrugs.length > 0 ? selectedDrugs : fallbackDrugs
  } catch {
    return fallbackDrugs
  }
}

function readDrugUseTiming() {
  try {
    const timing = JSON.parse(sessionStorage.getItem(DRUG_USE_TIMING_KEY))
    return Array.isArray(timing) ? timing : []
  } catch {
    return []
  }
}

function saveInjectedDrugs() {
  const injectedDrugs = Array.from(document.querySelectorAll('input[name="injected-drugs"]:checked'))
    .filter((input) => input.value !== 'none')
    .map((input) => input.nextElementSibling.textContent.trim())

  sessionStorage.setItem(INJECTED_DRUGS_KEY, JSON.stringify(injectedDrugs))
}

function readInjectedDrugs() {
  try {
    const injectedDrugs = JSON.parse(sessionStorage.getItem(INJECTED_DRUGS_KEY))
    return Array.isArray(injectedDrugs) ? injectedDrugs : []
  } catch {
    return []
  }
}

function createRadioGroup(drugName, index) {
  const group = document.createElement('div')
  group.className = 'govuk-form-group govuk-!-margin-bottom-5'

  const fieldset = document.createElement('fieldset')
  fieldset.className = 'govuk-fieldset'

  const legend = document.createElement('legend')
  legend.className = 'govuk-fieldset__legend govuk-fieldset__legend--s'
  legend.textContent = drugName
  fieldset.appendChild(legend)

  const radios = document.createElement('div')
  radios.className = 'govuk-radios'
  radios.dataset.module = 'govuk-radios'

  const options = [
    ['Used in the last 6 months', 'last-6-months'],
    ['Used more than 6 months ago', 'more-than-6-months-ago']
  ]

  options.forEach(([labelText, value], optionIndex) => {
    const item = document.createElement('div')
    item.className = 'govuk-radios__item'

    const input = document.createElement('input')
    input.className = 'govuk-radios__input'
    input.id = `when-used-${index}-${optionIndex}`
    input.name = `when-used-${index}`
    input.type = 'radio'
    input.value = value

    const label = document.createElement('label')
    label.className = 'govuk-label govuk-radios__label'
    label.htmlFor = input.id
    label.textContent = labelText

    item.append(input, label)
    radios.appendChild(item)
  })

  fieldset.appendChild(radios)
  group.appendChild(fieldset)
  return group
}

function initDrugUseWhichDrugs() {
  const continueLink = document.querySelector('a[href="/experiments/drug-use-when-used"]')
  if (!continueLink || !document.querySelector('input[name="drugs-used"]')) return

  document.querySelectorAll('input[name="drugs-used"]').forEach((input) => {
    const label = document.querySelector(`label[for="${input.id}"]`)
    if (label) input.dataset.label = label.textContent.trim()
  })

  continueLink.addEventListener('click', saveSelectedDrugs)
}

function initDrugUseWhenUsed() {
  const container = document.querySelector('[data-drug-use-radios]')
  if (!container) return

  container.replaceChildren(...readSelectedDrugs(['Cannabis']).map(createRadioGroup))

  const continueLink = document.querySelector('a[href="/experiments/drug-use-background"]')
  if (continueLink) continueLink.addEventListener('click', saveDrugUseTiming)
}

function createInjectedDrugCheckbox(drugName, index) {
  const item = document.createElement('div')
  item.className = 'govuk-checkboxes__item'

  const input = document.createElement('input')
  input.className = 'govuk-checkboxes__input'
  input.id = `injected-drug-${index}`
  input.name = 'injected-drugs'
  input.type = 'checkbox'
  input.value = drugName.toLowerCase().replaceAll(' ', '-')
  input.checked = true

  const label = document.createElement('label')
  label.className = 'govuk-label govuk-checkboxes__label'
  label.htmlFor = input.id
  label.textContent = drugName

  item.append(input, label)
  return item
}

function initDrugUseInjected() {
  const container = document.querySelector('[data-drug-use-injected]')
  if (!container) return

  container.replaceChildren(...readSelectedDrugs(['Cocaine', 'Heroin']).map(createInjectedDrugCheckbox))
}

function createUsedDrugSection(drugName, index) {
  const section = document.createElement('div')
  section.className = 'govuk-form-group govuk-!-margin-top-5 govuk-!-margin-bottom-0'

  const heading = document.createElement('h2')
  heading.className = 'govuk-heading-m govuk-!-margin-bottom-2'
  heading.textContent = drugName

  const question = document.createElement('p')
  question.className = 'govuk-body govuk-!-margin-bottom-3'
  question.textContent = 'How often is Tito using this drug?'

  const radios = document.createElement('div')
  radios.className = 'govuk-radios govuk-radios--inline'
  radios.dataset.module = 'govuk-radios'

  ;['Daily', 'Weekly', 'Monthly', 'Occasionally'].forEach((labelText, optionIndex) => {
    const item = document.createElement('div')
    item.className = 'govuk-radios__item'

    const input = document.createElement('input')
    input.className = 'govuk-radios__input'
    input.id = `frequency-${index}-${optionIndex}`
    input.name = `frequency-${index}`
    input.type = 'radio'
    input.value = labelText.toLowerCase()

    const label = document.createElement('label')
    label.className = 'govuk-label govuk-radios__label'
    label.htmlFor = input.id
    label.textContent = labelText

    item.append(input, label)
    radios.appendChild(item)
  })

  const detailsGroup = document.createElement('div')
  detailsGroup.className = 'govuk-form-group govuk-!-margin-top-6 govuk-!-margin-bottom-0'

  const detailsLabel = document.createElement('label')
  detailsLabel.className = 'govuk-label'
  detailsLabel.htmlFor = `frequency-details-${index}`
  detailsLabel.textContent = 'Give details (optional)'

  const detailsTextarea = document.createElement('textarea')
  detailsTextarea.className = 'govuk-textarea'
  detailsTextarea.id = `frequency-details-${index}`
  detailsTextarea.name = `frequency-details-${index}`
  detailsTextarea.rows = 6

  const detailsHint = document.createElement('span')
  detailsHint.className = 'govuk-hint'
  detailsHint.textContent = 'You have 2,000 characters remaining'

  detailsGroup.append(detailsLabel, detailsTextarea, detailsHint)
  section.append(heading, question, radios, detailsGroup)
  return section
}

function initDrugUseBackground() {
  const usedContainer = document.querySelector('[data-drug-use-used]')
  const notUsedContainer = document.querySelector('[data-drug-use-not-used]')
  if (!usedContainer || !notUsedContainer) return

  const timing = readDrugUseTiming()
  const usedDrugs = timing.filter((drug) => drug.timeframe === 'last-6-months')
  const notUsedDrugs = timing.filter((drug) => drug.timeframe === 'more-than-6-months-ago')

  usedContainer.replaceChildren(...usedDrugs.map((drug, index) => createUsedDrugSection(drug.drugName, index)))
  notUsedContainer.textContent = notUsedDrugs.length > 0
    ? `Tito used ${notUsedDrugs.map((drug) => drug.drugName).join(', ')} more than 6 months ago.`
    : 'No drugs were recorded as used more than 6 months ago.'

  const continueLink = document.querySelector('a[href="/experiments/drug-use-injected-frequency"]')
  if (continueLink) continueLink.addEventListener('click', saveInjectedDrugs)
}

function createInjectedFrequencySection(drugName, index) {
  const section = document.createElement('div')
  section.className = 'govuk-form-group govuk-!-margin-bottom-6'

  const fieldset = document.createElement('fieldset')
  fieldset.className = 'govuk-fieldset'

  const legend = document.createElement('legend')
  legend.className = 'govuk-fieldset__legend govuk-fieldset__legend--m'
  legend.textContent = drugName
  fieldset.appendChild(legend)

  const checkboxes = document.createElement('div')
  checkboxes.className = 'govuk-checkboxes'
  checkboxes.dataset.module = 'govuk-checkboxes'

  ;[
    ['In last 6 months', 'last-6-months'],
    ['More than 6 months ago', 'more-than-6-months-ago']
  ].forEach(([labelText, value], optionIndex) => {
    const item = document.createElement('div')
    item.className = 'govuk-checkboxes__item'

    const input = document.createElement('input')
    input.className = 'govuk-checkboxes__input'
    input.id = `injected-frequency-${index}-${optionIndex}`
    input.name = `injected-frequency-${index}`
    input.type = 'checkbox'
    input.value = value

    const label = document.createElement('label')
    label.className = 'govuk-label govuk-checkboxes__label'
    label.htmlFor = input.id
    label.textContent = labelText

    item.append(input, label)
    checkboxes.appendChild(item)
  })

  fieldset.appendChild(checkboxes)
  section.appendChild(fieldset)
  return section
}

function initDrugUseInjectedFrequency() {
  const container = document.querySelector('[data-drug-use-injected-frequency]')
  if (!container) return

  const injectedDrugs = readInjectedDrugs()
  if (injectedDrugs.length === 0) {
    const message = document.createElement('p')
    message.className = 'govuk-body'
    message.textContent = 'No injected drugs were selected.'
    container.appendChild(message)
    return
  }

  container.replaceChildren(...injectedDrugs.map(createInjectedFrequencySection))
}

window.GOVUKPrototypeKit.documentReady(() => {
  initDrugUseWhichDrugs()
  initDrugUseWhenUsed()
  initDrugUseInjected()
  initDrugUseBackground()
  initDrugUseInjectedFrequency()
})
