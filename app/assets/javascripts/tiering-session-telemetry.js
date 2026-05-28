//
// Anonymous session telemetry for Tiering prototype research
//

import { getTieringAssessmentSession } from './tiering-assessment-session.js'
import { getUnansweredTieringQuestions } from './tiering-journey.js'

const TELEMETRY_KEY = 'tieringSessionTelemetry'

const makeSessionId = () => {
  try {
    return `S${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`.toUpperCase()
  } catch (e) {
    return `S${Date.now()}`
  }
}

const emptyTelemetry = () => ({
  sessionId: null,
  consent: null,
  sessionStartedAt: null,
  sessionEndedAt: null,
  milestones: {},
  pages: [],
  errors: [],
  fieldChanges: [],
  offenceSearch: {
    usedSearchBar: false,
    usedBrowseAll: false,
    searches: [],
    selections: []
  },
  sideNavClicks: []
})

export const getSessionTelemetry = () => {
  try {
    const stored = sessionStorage.getItem(TELEMETRY_KEY)
    return stored ? { ...emptyTelemetry(), ...JSON.parse(stored) } : emptyTelemetry()
  } catch (error) {
    return emptyTelemetry()
  }
}

const saveSessionTelemetry = (data) => {
  sessionStorage.setItem(TELEMETRY_KEY, JSON.stringify(data))
}

export const clearSessionTelemetry = () => {
  sessionStorage.removeItem(TELEMETRY_KEY)
}

export const isTelemetryRecordingEnabled = () => getSessionTelemetry().consent === 'agreed'

export const setTelemetryConsent = (agreed) => {
  clearSessionTelemetry()
  const data = emptyTelemetry()
  data.sessionId = makeSessionId()
  data.consent = agreed ? 'agreed' : 'declined'
  data.sessionStartedAt = Date.now()
  saveSessionTelemetry(data)
}

export const getTelemetrySessionId = () => getSessionTelemetry().sessionId || null

export const initTelemetrySession = () => {
  const data = getSessionTelemetry()
  if (!data.sessionStartedAt) {
    data.sessionStartedAt = Date.now()
    saveSessionTelemetry(data)
  }
}

const updateTelemetry = (mutator) => {
  const data = getSessionTelemetry()
  mutator(data)
  saveSessionTelemetry(data)
}

export const trackTelemetryMilestone = (name) => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    data.milestones[name] = Date.now()
  })
}

export const trackTelemetryPageEnter = (pageId, pageLabel) => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    const open = data.pages.find((p) => p.pageId === pageId && !p.leftAt)
    if (open) return
    data.pages.push({
      pageId,
      pageLabel: pageLabel || pageId,
      enteredAt: Date.now(),
      leftAt: null,
      durationMs: null
    })
  })
}

export const trackTelemetryPageLeave = (pageId) => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    const page = [...data.pages].reverse().find((p) => p.pageId === pageId && !p.leftAt)
    if (!page) return
    page.leftAt = Date.now()
    page.durationMs = page.leftAt - page.enteredAt
  })
}

export const trackTelemetryError = (pageId, fieldId, message) => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    const existing = data.errors.find((e) => e.pageId === pageId && e.fieldId === fieldId)
    if (existing) {
      existing.count += 1
      existing.lastAt = Date.now()
      return
    }
    data.errors.push({
      pageId,
      fieldId,
      message: message || 'Validation error',
      count: 1,
      firstAt: Date.now(),
      lastAt: Date.now()
    })
  })
}

export const trackTelemetryFieldChange = (pageId, fieldId, fieldLabel, value) => {
  if (!isTelemetryRecordingEnabled()) return
  const normalised = String(value ?? '').trim()
  updateTelemetry((data) => {
    let field = data.fieldChanges.find((f) => f.pageId === pageId && f.fieldId === fieldId)
    if (!field) {
      field = {
        pageId,
        fieldId,
        fieldLabel: fieldLabel || fieldId,
        values: [],
        timestamps: []
      }
      data.fieldChanges.push(field)
    }
    const last = field.values[field.values.length - 1]
    if (last === normalised) return
    field.values.push(normalised)
    field.timestamps.push(Date.now())
  })
}

export const trackTelemetryOffenceSearch = ({ query, resultCount, action }) => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    if (action === 'browse-open') {
      data.offenceSearch.usedBrowseAll = true
      return
    }
    if (action === 'search') {
      data.offenceSearch.usedSearchBar = true
      data.offenceSearch.searches.push({
        query: String(query || '').trim(),
        resultCount: resultCount ?? null,
        at: Date.now()
      })
      return
    }
    if (action === 'select') {
      data.offenceSearch.selections.push({
        offenceId: query?.id || '',
        label: query?.label || '',
        code: query?.code || '',
        source: query?.source || 'search',
        at: Date.now()
      })
    }
  })
}

export const trackTelemetrySideNavClick = (sectionLabel, isDisabled) => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    data.sideNavClicks.push({
      sectionLabel,
      isDisabled: Boolean(isDisabled),
      at: Date.now()
    })
  })
}

export const finaliseTelemetrySession = () => {
  if (!isTelemetryRecordingEnabled()) return
  updateTelemetry((data) => {
    data.sessionEndedAt = Date.now()
    data.pages.forEach((page) => {
      if (!page.leftAt) {
        page.leftAt = data.sessionEndedAt
        page.durationMs = page.leftAt - page.enteredAt
      }
    })
  })
}

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const detectSearchRefinements = (searches) => {
  const refinements = []
  for (let i = 1; i < searches.length; i += 1) {
    const prev = searches[i - 1]
    const curr = searches[i]
    if (!prev.query || !curr.query) continue
    if (prev.query === curr.query) continue
    const gap = curr.at - prev.at
    if (gap < 45000) {
      refinements.push({ from: prev.query, to: curr.query, gapMs: gap })
    }
  }
  return refinements
}

const detectHesitationFields = (fieldChanges) =>
  fieldChanges.filter((field) => {
    const unique = [...new Set(field.values.filter(Boolean))]
    return unique.length > 1
  })

const calculateUsabilityScore = (data, metrics) => {
  let score = 10

  score -= Math.min(metrics.totalErrors * 0.4, 2)
  score -= Math.min(metrics.hesitationCount * 0.35, 2.5)
  score -= Math.min(metrics.searchRefinements * 0.5, 1.5)
  score -= Math.min(metrics.disabledNavClicks * 0.25, 1)
  if (metrics.longestPageMs > 120000) score -= 1
  if (metrics.avgPageMs > 90000) score -= 0.75

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10))
}

const getRatingBand = (score) => {
  if (score >= 8.5) {
    return {
      title: 'Smooth session',
      range: '8.5–10',
      message: 'This user was confident and understood how to use the tool.',
      className: 'tiering-session-results__summary--smooth'
    }
  }
  if (score >= 6.5) {
    return {
      title: 'Some friction to investigate',
      range: '6.5–8.4',
      message: 'This user showed some hesitation or had to revisit a few answers.',
      className: 'tiering-session-results__summary--friction'
    }
  }
  return {
    title: 'High-friction session',
    range: '0–6.4',
    message: 'This user struggled to answer some questions or navigate the journey.',
    className: 'tiering-session-results__summary--high-friction'
  }
}

export const analyseSessionTelemetry = () => {
  const data = getSessionTelemetry()
  finaliseTelemetrySession()

  if (data.consent === 'declined') {
    return {
      consent: 'declined',
      recordingEnabled: false,
      rating: null,
      insights: ['Recording was not enabled for this session.']
    }
  }

  if (data.consent !== 'agreed') {
    return {
      consent: null,
      recordingEnabled: false,
      rating: null,
      insights: ['No consent recorded for this session.']
    }
  }

  const completedPages = data.pages.filter((p) => p.durationMs != null)
  const pageDurations = completedPages.map((p) => p.durationMs)
  const totalDurationMs =
    data.sessionEndedAt && data.sessionStartedAt
      ? data.sessionEndedAt - data.sessionStartedAt
      : pageDurations.reduce((a, b) => a + b, 0)

  const longestPage = completedPages.reduce(
    (best, page) => (page.durationMs > (best?.durationMs || 0) ? page : best),
    null
  )

  const avgPageMs = pageDurations.length
    ? pageDurations.reduce((a, b) => a + b, 0) / pageDurations.length
    : 0

  const hesitationFields = detectHesitationFields(data.fieldChanges)
  const searchRefinements = detectSearchRefinements(data.offenceSearch.searches)
  const disabledNavClicks = data.sideNavClicks.filter((c) => c.isDisabled)
  const totalErrors = data.errors.reduce((sum, e) => sum + e.count, 0)

  const metrics = {
    totalDurationMs,
    avgPageMs,
    longestPage,
    longestPageMs: longestPage?.durationMs || 0,
    hesitationCount: hesitationFields.length,
    searchRefinements: searchRefinements.length,
    disabledNavClicks: disabledNavClicks.length,
    totalErrors
  }

  const usabilityScore = calculateUsabilityScore(data, metrics)
  const band = getRatingBand(usabilityScore)

  const insights = [
    `Overall usability score: ${usabilityScore} out of 10 (${band.range}).`,
    `Total session time: ${formatDuration(totalDurationMs)}.`,
    `Average time per page: ${formatDuration(avgPageMs)}.`
  ]

  if (longestPage) {
    insights.push(`Longest page: ${longestPage.pageLabel} (${formatDuration(longestPage.durationMs)}).`)
  }

  if (data.offenceSearch.usedSearchBar && data.offenceSearch.usedBrowseAll) {
    insights.push('User selected an offence using both search and the full offences list.')
  } else if (data.offenceSearch.usedBrowseAll) {
    insights.push('User selected an offence from the full offences list only.')
  } else if (data.offenceSearch.usedSearchBar) {
    insights.push('User selected an offence using the search bar only.')
  }

  if (searchRefinements.length) {
    insights.push(`${searchRefinements.length} back-to-back search refinement(s) — user may have struggled with terminology.`)
  }

  if (hesitationFields.length) {
    insights.push(`${hesitationFields.length} question(s) where the user changed their answer more than once.`)
  }

  if (disabledNavClicks.length) {
    insights.push(`User clicked ${disabledNavClicks.length} inactive side navigation item(s).`)
  }

  const assessmentSession = getTieringAssessmentSession()
  const unansweredQuestions = getUnansweredTieringQuestions(assessmentSession)

  if (unansweredQuestions.length) {
    insights.push(
      `${unansweredQuestions.length} required question(s) were not answered before viewing results.`
    )
  }

  const categories = buildResultsCategories(data, metrics, {
    hesitationFields,
    searchRefinements,
    disabledNavClicks,
    longestPage,
    unansweredQuestions
  })

  return {
    consent: 'agreed',
    recordingEnabled: true,
    data,
    metrics,
    usabilityScore,
    band,
    insights,
    categories,
    formatDuration
  }
}

const buildResultsCategories = (data, metrics, flags) => {
  const offenceMethod = [
    data.offenceSearch.usedSearchBar ? 'Search bar' : null,
    data.offenceSearch.usedBrowseAll ? 'Full offences list' : null
  ]
    .filter(Boolean)
    .join(' and ') || 'Not recorded'

  const milestoneRows = []
  if (data.milestones.calculatedScore) {
    milestoneRows.push({
      metric: 'Risk score calculated',
      value: 'Yes (check your answers submitted)',
      highlight: false
    })
  }
  if (data.milestones.markSectionComplete) {
    milestoneRows.push({
      metric: 'Section marked complete',
      value: 'Yes',
      highlight: false
    })
  }

  const sessionOverviewRows = [
    {
      metric: 'Total session time',
      value: formatDuration(metrics.totalDurationMs),
      highlight: metrics.totalDurationMs > 600000
    },
    {
      metric: 'Pages visited',
      value: String(data.pages.length),
      highlight: false
    },
    ...milestoneRows
  ]

  const timeOnPagesRows = [
    {
      metric: 'Average time per page',
      value: formatDuration(metrics.avgPageMs),
      highlight: metrics.avgPageMs > 120000
    },
    {
      metric: 'Longest page to complete',
      value: flags.longestPage
        ? `${flags.longestPage.pageLabel} (${formatDuration(flags.longestPage.durationMs)})`
        : '—',
      highlight: Boolean(flags.longestPage && flags.longestPage.durationMs > metrics.avgPageMs * 2)
    },
    ...data.pages.map((page) => ({
      metric: page.pageLabel,
      value: formatDuration(page.durationMs),
      highlight: page.durationMs > metrics.avgPageMs * 2
    }))
  ]

  const unansweredRows =
    flags.unansweredQuestions.length > 0
      ? flags.unansweredQuestions.map((item) => ({
          metric: item.question,
          value: item.pageLabel,
          highlight: true
        }))
      : [
          {
            metric: 'All required questions were answered',
            value: 'None missing',
            highlight: false
          }
        ]

  const unansweredCategoryRows = [
    {
      metric: 'Total unanswered',
      value: String(flags.unansweredQuestions.length),
      highlight: flags.unansweredQuestions.length > 0
    },
    ...unansweredRows
  ]

  const answersRows = [
    {
      metric: 'Questions with changed answers',
      value: String(flags.hesitationFields.length),
      highlight: flags.hesitationFields.length > 0
    },
    ...flags.hesitationFields.map((field) => ({
      metric: field.fieldLabel,
      value: field.values.join(' → '),
      highlight: true
    }))
  ]

  const validationRows = [
    {
      metric: 'Total validation errors',
      value: String(metrics.totalErrors),
      highlight: metrics.totalErrors > 0
    },
    ...data.errors.map((error) => ({
      metric: `${error.pageId} — ${error.fieldId}`,
      value: `${error.count}× — ${error.message}`,
      highlight: error.count > 1
    }))
  ]

  const offenceSearchRows = [
    {
      metric: 'How offence was selected',
      value: offenceMethod,
      highlight: false
    },
    {
      metric: 'Search terms used',
      value:
        data.offenceSearch.searches.length > 0
          ? data.offenceSearch.searches.map((s) => `"${s.query}"`).join(', ')
          : 'No searches recorded',
      highlight: false
    },
    {
      metric: 'Back-to-back search refinements',
      value: String(flags.searchRefinements.length),
      highlight: flags.searchRefinements.length > 0
    },
    ...flags.searchRefinements.map((refinement, index) => ({
      metric: `Refinement ${index + 1}`,
      value: `"${refinement.from}" → "${refinement.to}"`,
      highlight: true
    })),
    ...data.offenceSearch.selections.map((selection, index) => ({
      metric: selection.source === 'browse' ? 'Offence selected (browse)' : 'Offence selected (search)',
      value: [selection.label, selection.code].filter(Boolean).join(' — '),
      highlight: false
    }))
  ]

  const navigationRows = [
    {
      metric: 'Inactive side navigation clicks',
      value: String(flags.disabledNavClicks.length),
      highlight: flags.disabledNavClicks.length > 0
    },
    ...flags.disabledNavClicks.map((click) => ({
      metric: click.sectionLabel,
      value: 'Inactive link clicked',
      highlight: true
    }))
  ]

  return [
    { title: 'Session overview', rows: sessionOverviewRows },
    { title: 'Time on pages', rows: timeOnPagesRows },
    { title: 'Unanswered questions', rows: unansweredCategoryRows },
    { title: 'Answers and hesitation', rows: answersRows },
    { title: 'Validation and errors', rows: validationRows },
    { title: 'Offence search', rows: offenceSearchRows },
    { title: 'Navigation', rows: navigationRows }
  ]
}
