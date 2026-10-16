//
// Research prototypes home – clear session when starting Tiering assessment
//

import { clearPrototypeDataForTiering } from './tiering-assessment-session.js'
import { resetPredictorsSessionForFreshStart as resetProto2Session } from './02/predictors-assessment-session.js'
import { resetPredictorsSessionForFreshStart as resetRoshSession } from './03/predictors-assessment-session.js'
import { resetPredictorsSessionForFreshStart as resetDevSession } from './dev/predictors-assessment-session.js'
import { resetSanSessionForFreshStart } from './san/session.js'
import { resetSanSessionForFreshStart as resetSanResearchSession } from './san-research/session.js'
import { resetSanSessionForFreshStart as resetSanPrisonSession } from './san-prison/session.js'

const PROTOTYPE_BASE_PATHS = {
  '01': '/01',
  '02': '/02',
  '03': '/03',
  dev: '/dev',
  san: '/san',
  'san-research': '/san-research',
  'san-prison': '/san-prison'
}

const clearSessionForPrototypeVersion = (version) => {
  if (version === '02') return resetProto2Session()
  if (version === '03') return resetRoshSession()
  if (version === 'dev') return resetDevSession()
  if (version === 'san') return resetSanSessionForFreshStart()
  if (version === 'san-research') return resetSanResearchSession('community')
  if (version === 'san-prison') return resetSanPrisonSession('prison')
  return clearPrototypeDataForTiering()
}

const resolvePrototypeHref = (version, href) => {
  const basePath = PROTOTYPE_BASE_PATHS[version]
  if (!basePath || !href) return href

  const pagePath = href.replace(/^\/(01|02|03|dev|san-prison|san-research|san)\//, '')
  return `${basePath}/${pagePath}`
}

const countWord = (count) => (count === 1 ? "change" : "changes")

const visibleChanges = (container) => [...container.querySelectorAll("[data-change]")].filter((change) => !change.hidden)

const matchesChangelogFilter = (change, filter) => {
  if (filter === "all") return true
  if (filter === "A11y") return change.getAttribute("data-a11y") === "true"
  return change.getAttribute("data-change-type") === filter
}

const setupChangelog = (root) => {
  const filterButtons = [...root.querySelectorAll("[data-changelog-filter]")]
  const details = root.querySelector("[data-changelog-details]")
  const detailsToggle = root.querySelector("[data-changelog-details-toggle]")
  const iterationTabs = [...root.querySelectorAll("[data-iteration-tab]")]
  const changes = [...root.querySelectorAll("[data-change]")]
  const emptyMessage = root.querySelector("[data-changelog-empty]")
  let filter = "all"

  const isSummaryTab = (tab) => tab && tab.hasAttribute("data-summary-tab")
  const detailsOpen = () => !details || !details.hidden

  const selectedIteration = () => iterationTabs.find((tab) => tab.getAttribute("aria-selected") === "true")

  const selectIteration = (id) => {
    iterationTabs.forEach((tab) => {
      const selected = tab.getAttribute("data-iteration-tab") === id
      tab.setAttribute("aria-selected", selected ? "true" : "false")
      tab.tabIndex = selected ? 0 : -1
    })
    root.querySelectorAll("[data-changelog-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-changelog-panel") !== id
    })
  }

  const setDetailsOpen = (open) => {
    if (details) details.hidden = !open
    if (detailsToggle) {
      detailsToggle.setAttribute("aria-expanded", open ? "true" : "false")
      const label = detailsToggle.querySelector("[data-changelog-details-label]")
      if (label) label.textContent = open ? "Hide details" : "Show details"
    }
    const currentTab = selectedIteration()
    selectIteration(currentTab ? currentTab.getAttribute("data-iteration-tab") : "summary")
  }

  const syncSectionLabels = (table) => {
    let previousSection = null
    table.querySelectorAll("tr[data-change]").forEach((row) => {
      const label = row.querySelector("[data-section-label]")
      if (!label || row.hidden) return
      const section = row.getAttribute("data-section")
      label.classList.toggle("is-continued", section === previousSection)
      previousSection = section
    })
  }

  const setCount = (id, count) => {
    root.querySelectorAll(`[data-count-for="${id}"]`).forEach((element) => {
      element.textContent = String(count)
    })
    root.querySelectorAll(`[data-count-word-for="${id}"]`).forEach((element) => {
      element.textContent = countWord(count)
    })
  }

  const apply = () => {
    changes.forEach((change) => {
      change.hidden = !matchesChangelogFilter(change, filter)
    })

    root.querySelectorAll("[data-changelog-panel]").forEach((panel) => {
      const count = visibleChanges(panel).length
      setCount(panel.getAttribute("data-changelog-panel"), count)
    })

    const currentTab = selectedIteration()
    selectIteration(currentTab ? currentTab.getAttribute("data-iteration-tab") : "summary")

    root.querySelectorAll(".assessment-research-changelog__table").forEach(syncSectionLabels)

    const showingSummary = isSummaryTab(selectedIteration())
    const anyVisible = showingSummary || changes.some((change) => !change.hidden)
    if (emptyMessage) emptyMessage.hidden = anyVisible
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filter = button.getAttribute("data-changelog-filter")
      filterButtons.forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false")
      })
      apply()
    })
  })

  iterationTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      selectIteration(tab.getAttribute("data-iteration-tab"))
    })
  })

  if (detailsToggle) {
    detailsToggle.addEventListener("click", () => {
      setDetailsOpen(!detailsOpen())
    })
  }

  apply()
}

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll("[data-changelog]").forEach(setupChangelog)
})

window.GOVUKPrototypeKit.documentReady(() => {
  document.querySelectorAll('[data-clear-session-on-start]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      if (link.getAttribute('aria-disabled') === 'true') {
        event.preventDefault()
        return
      }

      event.preventDefault()
      const version = link.getAttribute('data-prototype-version') || '01'
      const href = resolvePrototypeHref(version, link.getAttribute('href'))
      if (!href) return

      await clearSessionForPrototypeVersion(version)

      if (link.getAttribute('target') === '_blank') {
        window.open(href, '_blank', 'noopener,noreferrer')
        return
      }

      window.location.assign(href)
    })
  })
})
