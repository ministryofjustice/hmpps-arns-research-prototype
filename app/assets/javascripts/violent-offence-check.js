//
// Violent offence checker (details panel on a2)
//

import { applyOffenceViolentTag, getOffenceCodeBracket, lookupOffenceIsViolent } from './tiering-offence-browse.js'
import {
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'

const buildSelectedItem = (template, selection) => {
  const fragment = template.content.cloneNode(true)
  const item = fragment.querySelector('[data-violent-check-item]')
  const nameEl = fragment.querySelector('[data-violent-check-item-name]')
  const codeEl = fragment.querySelector('[data-violent-check-item-code]')
  const violentTagEl = fragment.querySelector('[data-offence-violent-tag]')
  const codeBracket = getOffenceCodeBracket(selection)

  if (nameEl) nameEl.textContent = selection.label
  if (codeEl) codeEl.textContent = codeBracket || ''
  applyOffenceViolentTag(
    violentTagEl,
    selection.isViolentOffence === true || lookupOffenceIsViolent(selection.id)
  )
  if (item) item.dataset.violentCheckOffenceId = selection.id || ''

  return item
}

const persistViolentOffenceChecks = (selections) => {
  setTieringAssessmentSession({ violentOffenceChecks: selections })
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-module="violent-offence-check"]').forEach(async (container) => {
    const searchRoot = container.querySelector('[data-module="offence-search"][data-offence-search-check]')
    const checkButton = container.querySelector('[data-violent-check-submit]')
    const selectedSection = container.querySelector('[data-violent-check-selected-section]')
    const selectedList = container.querySelector('[data-violent-check-selected-list]')
    const itemTemplate = container.querySelector('[data-violent-check-item-template]')
    const detailsPanel = container.closest('.violent-offence-check-details')

    if (!searchRoot || !checkButton || !selectedSection || !selectedList || !itemTemplate) return

    const checkedOffences = []
    let pendingSelection = null

    const syncSession = () => {
      persistViolentOffenceChecks(
        checkedOffences.map((item) => ({
          id: item.id,
          label: item.label,
          code: item.code,
          subcode: item.subcode,
          fullCode: item.fullCode,
          isViolentOffence:
            item.isViolentOffence === true || lookupOffenceIsViolent(item.id)
        }))
      )
    }

    const updateSelectedSectionVisibility = () => {
      selectedSection.hidden = checkedOffences.length === 0
    }

    const setSelectedOffence = (selection) => {
      if (!selection?.label) return

      checkedOffences.length = 0
      selectedList.innerHTML = ''

      const item = buildSelectedItem(itemTemplate, selection)
      if (!item) return

      checkedOffences.push(selection)
      selectedList.appendChild(item)
      updateSelectedSectionVisibility()
      syncSession()
    }

    const searchHandle = await window.initOffenceSearchV2(searchRoot)
    const input = searchRoot.querySelector('[data-offence-search-input]')
    const listbox = searchRoot.querySelector('[data-offence-search-listbox]')

    searchRoot.addEventListener('offence-search:selected', (event) => {
      pendingSelection = event.detail
      searchHandle?.resizeSearchInput?.()
    })

    const resetSearchInput = () => {
      pendingSelection = null
      if (input) {
        input.value = ''
        input.removeAttribute('aria-describedby')
        searchHandle?.resizeSearchInput?.()
      }
      if (listbox) {
        listbox.innerHTML = ''
        listbox.hidden = true
        input?.setAttribute('aria-expanded', 'false')
      }
    }

    const runCheck = () => {
      const selection = pendingSelection || searchHandle?.getPendingSelection?.()

      if (!selection?.label) {
        if (input) input.focus()
        return
      }

      setSelectedOffence(selection)
      resetSearchInput()
      input?.focus()
    }

    checkButton.addEventListener('click', runCheck)

    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return
        if (listbox && !listbox.hidden) return
        event.preventDefault()
        runCheck()
      })
    }

    container.querySelectorAll('[data-violent-offence-browse-link]').forEach((link) => {
      link.addEventListener('click', () => {
        setTieringAssessmentSession({ violentOffenceCheckBrowse: true })
      })
    })

    const session = getTieringAssessmentSession()

    const storedChecks = session.violentOffenceChecks || []
    const latestCheck = storedChecks[storedChecks.length - 1]
    if (latestCheck) {
      setSelectedOffence(latestCheck)
    }

    if (session.violentOffenceCheckPending) {
      setSelectedOffence(session.violentOffenceCheckPending)
      setTieringAssessmentSession({ violentOffenceCheckPending: null })
      if (detailsPanel) detailsPanel.open = true
    }

    if (window.location.hash === '#violent-offence-check' && detailsPanel) {
      detailsPanel.open = true
    }

    if (new URLSearchParams(window.location.search).get('focus') === 'offence-search') {
      if (detailsPanel) detailsPanel.open = true
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      requestAnimationFrame(() => input?.focus())
    }
  })
})
