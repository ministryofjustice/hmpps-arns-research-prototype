//
// Violent offence checker (details panel on a2)
//

import { applyOffenceViolentTag, formatOffenceCodeLabel } from './tiering-offence-browse.js'
import {
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-assessment-session.js'

const buildSelectedItem = (template, selection) => {
  const fragment = template.content.cloneNode(true)
  const item = fragment.querySelector('[data-violent-check-item]')
  const labelEl = fragment.querySelector('[data-violent-check-item-label]')
  const codeEl = fragment.querySelector('[data-violent-check-item-code]')
  const violentTagEl = fragment.querySelector('[data-offence-violent-tag]')
  const codeLabel = formatOffenceCodeLabel(selection)

  if (labelEl) labelEl.textContent = selection.label
  if (codeEl) {
    codeEl.textContent = codeLabel
    codeEl.hidden = !codeLabel
  }
  applyOffenceViolentTag(violentTagEl, selection.isViolentOffence)
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
          isViolentOffence: Boolean(item.isViolentOffence)
        }))
      )
    }

    const updateSelectedSectionVisibility = () => {
      const hasItems = selectedList.children.length > 0
      selectedSection.hidden = !hasItems
    }

    const addSelectedOffence = (selection, { insertAtTop = true } = {}) => {
      const offenceId = selection.id || `${selection.code}-${selection.subcode}`
      if (offenceId && checkedOffences.some((item) => item.id === offenceId)) return

      const item = buildSelectedItem(itemTemplate, selection)
      if (!item) return

      if (insertAtTop) {
        checkedOffences.unshift(selection)
        selectedList.prepend(item)
      } else {
        checkedOffences.push(selection)
        selectedList.appendChild(item)
      }

      updateSelectedSectionVisibility()
      syncSession()
    }

    searchRoot.addEventListener('offence-search:selected', (event) => {
      pendingSelection = event.detail
    })

    const searchHandle = await window.initOffenceSearch(searchRoot)
    const input = searchRoot.querySelector('[data-offence-search-input]')
    const listbox = searchRoot.querySelector('[data-offence-search-listbox]')

    const resetSearchInput = () => {
      pendingSelection = null
      if (input) {
        input.value = ''
        input.setAttribute('aria-describedby', 'violent-offence-check-search-hint')
        searchHandle?.resizeSearchInput?.()
      }
      if (listbox) {
        listbox.innerHTML = ''
        listbox.hidden = true
        input?.setAttribute('aria-expanded', 'false')
      }
    }

    selectedList.addEventListener('click', (event) => {
      const clearLink = event.target.closest('[data-violent-check-clear]')
      if (!clearLink) return

      event.preventDefault()
      const item = clearLink.closest('[data-violent-check-item]')
      const offenceId = item?.dataset.violentCheckOffenceId
      if (offenceId) {
        const index = checkedOffences.findIndex((entry) => entry.id === offenceId)
        if (index >= 0) checkedOffences.splice(index, 1)
      }
      item?.remove()
      updateSelectedSectionVisibility()
      syncSession()
    })

    const runCheck = () => {
      const selection = pendingSelection || searchHandle?.getPendingSelection?.()

      if (!selection?.label) {
        if (input) input.focus()
        return
      }

      addSelectedOffence(selection)
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

    ;(session.violentOffenceChecks || []).forEach((offence) => {
      addSelectedOffence(offence, { insertAtTop: false })
    })

    if (session.violentOffenceCheckPending) {
      addSelectedOffence(session.violentOffenceCheckPending)
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
