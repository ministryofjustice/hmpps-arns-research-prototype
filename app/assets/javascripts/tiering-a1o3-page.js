//
// a1o3 – Sub-offence listing grid loader
//

import { fetchOffenceBrowseGroups } from './offences-data.js'
import { getTieringAssessmentSession } from './tiering-assessment-session.js'

window.GOVUKPrototypeKit.documentReady(() => {
  const form = document.getElementById('tiering-a1o3-form')
  const heading = document.querySelector('[data-active-category-heading]')
  const tableRoot = document.querySelector('[data-sub-offences-root]')
  const statusMessage = document.querySelector('[data-table-status-message]')

  // NEW DOM References for the Selected Summary Display Box
  const previewContainer = document.querySelector('[data-offence-preview-container]')
  const previewLabel = document.querySelector('[data-offence-preview-label]')
  const previewCode = document.querySelector('[data-offence-preview-code]')

  // Extract targeted string straight out of the window URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const categoryName = urlParams.get('category')

  if (!form || !tableRoot) return

  if (!categoryName) {
    if (heading) heading.textContent = 'No Category Selected'
    if (statusMessage) statusMessage.innerHTML = '<p class="govuk-body">Error: Missing category query parameter.</p>'
    return
  }

  // Display clean target description text
  if (heading) heading.textContent = categoryName

  let selectedOffenceObj = null

  const renderSubOffencesTable = (categoryGroup) => {
    const subOffences = categoryGroup.subOffences || []

    if (subOffences.length === 0) {
      if (statusMessage) {
        statusMessage.hidden = false
        statusMessage.innerHTML = '<p class="govuk-body">No granular sub-offences found inside this category block.</p>'
      }
      return
    }

    if (statusMessage) statusMessage.hidden = true

    // Inject matching semantic single rows with custom micro-wrapped radio tokens
    tableRoot.innerHTML = subOffences.map((sub, index) => {
      const displayCode = (sub.code && sub.subcode) ? `${sub.code}${sub.subcode}` : (sub.fullCode || sub.code || '')
      const radioId = `offence-choice-${index}`
      const display = heading.textContent === sub.label ? sub.description : sub.label;

      return `
        <tr class="govuk-table__row" data-clickable-table-row>
          <td class="govuk-table__cell">
            <div class="govuk-radios govuk-radios--small">
              <div class="govuk-radios__item">
                <input class="govuk-radios__input" 
                       id="${radioId}" 
                       name="selected_sub_offence" 
                       type="radio" 
                       value="${sub.id}"
                       data-offence-raw-string="${encodeURIComponent(JSON.stringify(sub))}">
                
                <label class="govuk-label govuk-radios__label" for="${radioId}">
                  <b>${display}</b> ${displayCode}
                </label>
              </div>
            </div>
          </td>
        </tr>
      `
    }).join('')

    // Accessibility feature: Make the entire physical table row clickable to pick the radio target
    tableRoot.querySelectorAll('[data-clickable-table-row]').forEach((row) => {
      row.addEventListener('click', (e) => {
        const targetRadio = row.querySelector('input[type="radio"]')
        if (targetRadio && e.target !== targetRadio && !e.target.closest('label')) {
          targetRadio.checked = true
          extractSelectedPayload(targetRadio)
        }
      })

      row.querySelector('input[type="radio"]')?.addEventListener('change', (e) => {
        extractSelectedPayload(e.target)
      })
    })
  }

  // Parses payload data and mirrors selection configuration to visual preview block
  const extractSelectedPayload = (radioInputElement) => {
    try {
      selectedOffenceObj = JSON.parse(decodeURIComponent(radioInputElement.dataset.offenceRawString))

      // Update our explicit preview targets immediately
      if (previewContainer && previewLabel && previewCode) {
        const codeDisplay = (selectedOffenceObj.code && selectedOffenceObj.subcode)
            ? `${selectedOffenceObj.code}${selectedOffenceObj.subcode}`
            : (selectedOffenceObj.fullCode || selectedOffenceObj.code || '')

        previewLabel.textContent = selectedOffenceObj.label
        previewCode.textContent = `(${codeDisplay})`

        // Remove 'hidden' attribute to slide summary block into layout visibility
        previewContainer.hidden = false
      }
    } catch (err) {
      console.error('Failed to parse active option state token string', err)
    }
  }

  // Handle final choice submission inside your sub-offence script
  form.addEventListener('submit', (event) => {
    event.preventDefault()

    if (!selectedOffenceObj) {
      alert('Please select an offence from the list to continue.')
      return
    }

    // 1. Save to your local assessment session cache object
    const session = getTieringAssessmentSession()
    const offencePayload = {
      id: selectedOffenceObj.id,
      label: selectedOffenceObj.label,
      code: selectedOffenceObj.code || '',
      subcode: selectedOffenceObj.subcode || '',
      fullCode: selectedOffenceObj.fullCode || '',
      isViolentOffence: Boolean(selectedOffenceObj.isViolentOffence)
    }
    session.currentOffence = offencePayload

    // 2. Build explicit URL parameters to pass the choice back
    const urlParams = new URLSearchParams()
    urlParams.set('returned_offence_id', offencePayload.id)
    urlParams.set('returned_offence_label', offencePayload.label)
    urlParams.set('returned_offence_code', offencePayload.code)
    urlParams.set('returned_offence_subcode', offencePayload.subcode)

    // Redirect with data cleanly appended to the path string
    window.location.href = `a1?${urlParams.toString()}`
  })

  // Bootstrapping
  fetchOffenceBrowseGroups()
      .then((groups) => {
        const matchedGroup = groups.find(g => g.label === categoryName)
        if (matchedGroup) {
          renderSubOffencesTable(matchedGroup)
        } else {
          if (statusMessage) {
            statusMessage.hidden = false
            statusMessage.innerHTML = '<p class="govuk-body">Specified offence category context details not found.</p>'
          }
        }
      })
      .catch((error) => {
        console.error('Failed processing category layout sequence data view:', error)
        if (statusMessage) {
          statusMessage.hidden = false
          statusMessage.innerHTML = '<p class="govuk-body">Error loading records database payload.</p>'
        }
      })
})