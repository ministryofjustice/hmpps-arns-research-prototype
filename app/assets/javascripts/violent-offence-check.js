//
// Violent offence checker (details panel on a2)
//

import { applyOffenceViolentTag, getOffenceCodeBracket, lookupOffenceIsViolent } from './tiering-offence-browse.js'
import {
  getTieringAssessmentSession,
  setTieringAssessmentSession
} from './tiering-page-apis.js'

const getViolentTypeLabel = (isViolentOffence) => (isViolentOffence ? 'Violent' : 'Not violent')

const getSelectionIsViolent = (selection) =>
  selection.isViolentOffence === true || lookupOffenceIsViolent(selection.id)

const formatSelectedOffenceSummary = (selection) => {
  const offenceName = selection.label || selection.description || ''
  const code = getOffenceCodeBracket(selection)
  const type = getViolentTypeLabel(getSelectionIsViolent(selection))
  const parts = [`Offence: ${offenceName}`]

  if (code) parts.push(`code: ${code}`)
  parts.push(`type: ${type}`)

  return parts.join(', ')
}

const buildSelectedItem = (template, selection) => {
  const fragment = template.content.cloneNode(true)
  const item = fragment.querySelector('[data-violent-check-item]')
  const summaryEl = fragment.querySelector('[data-violent-check-sr-summary]')
  const nameEl = fragment.querySelector('[data-violent-check-item-name]')
  const codeEl = fragment.querySelector('[data-violent-check-item-code]')
  const violentTagEl = fragment.querySelector('[data-offence-violent-tag]')
  const codeBracket = getOffenceCodeBracket(selection)
  const offenceName = selection.label || selection.description || ''

  if (summaryEl) summaryEl.textContent = formatSelectedOffenceSummary(selection)
  if (nameEl) nameEl.textContent = offenceName
  if (codeEl) {
    codeEl.textContent = codeBracket || ''
    codeEl.hidden = !codeBracket
  }
  applyOffenceViolentTag(violentTagEl, getSelectionIsViolent(selection))
  if (item) item.dataset.violentCheckOffenceId = selection.id || ''

  return item
}

const syncSelectedRowLayout = (item) => {
  const row = item?.querySelector('.violent-offence-check__selected-row')
  const nameEl = item?.querySelector('[data-violent-check-item-name]')
  if (!row || !nameEl) return

  const lineHeight = parseFloat(getComputedStyle(nameEl).lineHeight) || 0
  const isSingleLine = !lineHeight || nameEl.scrollHeight <= lineHeight + 2

  row.classList.toggle('violent-offence-check__selected-row--single-line', isSingleLine)
}

const persistViolentOffenceChecks = (selections) => {
  setTieringAssessmentSession({ violentOffenceChecks: selections })
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-module="violent-offence-check"]').forEach(async (container) => {
    const searchRoot = container.querySelector('[data-module="offence-search"][data-offence-search-check]')
    const checkButton = container.querySelector('[data-violent-check-submit]')
    const noCheckButton = container.dataset.violentOffenceCheckNoButton === 'true'
    const selectedSection = container.querySelector('[data-violent-check-selected-section]')
    const selectedList = container.querySelector('[data-violent-check-selected-list]')
    const itemTemplate = container.querySelector('[data-violent-check-item-template]')
    const detailsPanel = container.closest('.violent-offence-check-details')

    if (!searchRoot || !selectedSection || !selectedList || !itemTemplate) return
    if (!noCheckButton && !checkButton) return

    const checkedOffences = []
    let pendingSelection = null
    const liveRegion = container.querySelector('[data-violent-check-live-region]')

    const announceSelection = (selection) => {
      if (!liveRegion) return

      const summary = formatSelectedOffenceSummary(selection)
      liveRegion.textContent = ''
      requestAnimationFrame(() => {
        liveRegion.textContent = summary
      })
    }

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

    const setSelectedOffence = (selection, { announce = false } = {}) => {
      if (!selection?.label && !selection?.description) return

      checkedOffences.length = 0
      selectedList.innerHTML = ''

      const item = buildSelectedItem(itemTemplate, selection)
      if (!item) return

      checkedOffences.push(selection)
      selectedList.appendChild(item)
      updateSelectedSectionVisibility()
      syncSession()

      requestAnimationFrame(() => syncSelectedRowLayout(item))

      if (announce) announceSelection(selection)
    }

    const refreshSelectedRowLayout = () => {
      const item = selectedList.querySelector('[data-violent-check-item]')
      if (item) syncSelectedRowLayout(item)
    }

    window.addEventListener('resize', refreshSelectedRowLayout)
    detailsPanel?.addEventListener('toggle', refreshSelectedRowLayout)

    const searchHandle = await window.initOffenceSearchV2(searchRoot)
    const input = searchRoot.querySelector('[data-offence-search-input]')
    const listbox = searchRoot.querySelector('[data-offence-search-listbox]')

    searchRoot.addEventListener('offence-search:selected', (event) => {
      if (noCheckButton) {
        setSelectedOffence(event.detail, { announce: true })
        resetSearchInput()
        return
      }

      pendingSelection = event.detail
      searchHandle?.resizeSearchInput?.()
    })

    const resetSearchInput = () => {
      pendingSelection = null
      if (input) {
        input.value = ''
        const hintId = searchRoot.dataset.offenceSearchDescribedby
        if (hintId) input.setAttribute('aria-describedby', hintId)
        else input.removeAttribute('aria-describedby')
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

      if (selection?.label || selection?.description) {
        setSelectedOffence(selection, { announce: true })
        resetSearchInput()
        input?.focus()
        return
      }

      // No suggestion picked – run a free-text search to the results page.
      const query = input?.value.trim()
      const resultsUrl = searchRoot.dataset.offenceSearchResultsUrl
      if (query && resultsUrl) {
        const params = new URLSearchParams()
        params.set('q', query)
        const context = searchRoot.dataset.offenceSearchResultsContext
        if (context) params.set('context', context)
        window.location.href = `${resultsUrl}?${params.toString()}`
        return
      }

      if (input) input.focus()
    }

    if (!noCheckButton) {
      checkButton.addEventListener('click', runCheck)

      if (input) {
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return
          if (listbox && !listbox.hidden) return
          event.preventDefault()
          runCheck()
        })
      }
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
      setSelectedOffence(session.violentOffenceCheckPending, { announce: true })
      setTieringAssessmentSession({ violentOffenceCheckPending: null })
      resetSearchInput()
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
