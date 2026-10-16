//
// Side navigation state for Prototype 1 (Community) Strengths and needs.
// Each section script calls applySanProgress so ticks and resume links stay
// in sync on every SAN research page.
//

import { sectionLinkHref } from './session.js'

const SECTIONS = [
  {
    key: 'accommodation',
    completeKey: 'accommodationComplete',
    started: (session) => !!session.accommodationType,
    href: 'accommodation-summary.html'
  },
  {
    key: 'employment',
    completeKey: 'employmentComplete',
    started: (session) => !!session.employmentStatus,
    href: 'employment-summary.html'
  },
  {
    key: 'finances',
    completeKey: 'financeComplete',
    started: (session) => Array.isArray(session.financeIncome) && session.financeIncome.length > 0,
    href: 'finances-summary.html'
  },
  {
    key: 'drugs',
    completeKey: 'drugComplete',
    started: (session) => !!session.drugUse,
    href: 'drugs-summary.html'
  },
  {
    key: 'alcohol',
    completeKey: 'alcoholComplete',
    started: (session) => !!session.alcoholUse,
    href: 'alcohol-summary.html'
  },
  {
    key: 'health',
    completeKey: 'healthComplete',
    started: (session) => !!session.healthPhysical,
    href: 'health-summary.html'
  },
  {
    key: 'relationships',
    completeKey: 'relationshipsComplete',
    started: (session) => Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0,
    href: 'personal-relationships-summary.html'
  },
  {
    key: 'thinking',
    completeKey: 'thinkingComplete',
    started: (session) => !!session.thinkingConsequences,
    href: 'thinking-behaviours-summary.html'
  },
  {
    key: 'offence',
    completeKey: 'offenceComplete',
    started: (session) => !!session.offenceDescription,
    href: 'offence-analysis-summary.html'
  }
]

const applySectionLink = (session, section) => {
  document.querySelectorAll(`[data-section-complete="${section.key}"]`).forEach((icon) => {
    icon.classList.toggle(
      'assessment-section-navigation__complete-icon--visible',
      !!session[section.completeKey]
    )
  })

  const link = document.querySelector(`[data-san-section-link="${section.key}"]`)
  const href = sectionLinkHref(section.key, section.started(session) ? section.href : '')
  if (link && href) link.setAttribute('href', href)
}

const applyCurrentStatus = (session, current) => {
  const section = SECTIONS.find((item) => item.key === current)
  const complete = section ? !!session[section.completeKey] : false
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })
}

export const applySanProgress = (session, { current, updateStatus = true } = {}) => {
  if (updateStatus && current) applyCurrentStatus(session, current)
  SECTIONS.forEach((section) => applySectionLink(session, section))
}
