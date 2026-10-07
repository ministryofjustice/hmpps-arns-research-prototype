//
// Employment and education section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const EXAMPLE_COMPLETE = {
  employmentStatus: 'employed-or-self-employed',
  employmentSubtype: '',
  employedBefore: '',
  jobSector: 'Construction',
  employmentHistory: 'continuous',
  employmentHistoryDetails: 'Site labouring for a local firm.',
  commitments: ['caring'],
  commitmentDetails: { caring: 'Supports an elderly parent.' },
  qualifications: 'yes',
  qualificationsDetails: 'GCSEs including English and maths, CSCS card.',
  skills: 'strong',
  skillsDetails: 'Experienced in groundworks.',
  difficulties: ['none'],
  difficultyLevels: {},
  employmentExperience: 'mostly-positive',
  employmentExperienceDetails: 'Steady work until the current sentence.',
  educationExperience: 'mixed',
  educationExperienceDetails: 'Left school at 16.',
  employmentChanges: 'active',
  employmentChangesDetails: 'Looking for site work on release.',
  eeAnalysisStrengths: 'yes',
  eeAnalysisStrengthsDetails: 'Has a trade and a previous employer who would consider them.',
  eeAnalysisHarm: 'no',
  eeAnalysisHarmDetails: '',
  eeAnalysisReoffending: 'yes',
  eeAnalysisReoffendingDetails: 'Unstable work has previously coincided with offending.',
  employmentComplete: true
}

const BEFORE_STATUSES = ['unavailable', 'unemployed']

const STATUS_LABELS = {
  'employed-or-self-employed': 'Employed or self-employed',
  retired: 'Retired',
  unavailable: 'Currently unavailable for work',
  unemployed: 'Unemployed'
}

const BEFORE_LABELS = {
  yes: 'Yes',
  no: 'No'
}

const HISTORY_LABELS = {
  continuous: 'Continuous employment history',
  'changes-often': 'Generally in employment but changes jobs often',
  unstable: 'Unstable employment history with regular periods of unemployment',
  unknown: 'Unknown'
}

const COMMITMENT_LABELS = {
  caring: 'Caring responsibilities',
  child: 'Child responsibilities',
  studying: 'Studying',
  volunteering: 'Volunteering',
  other: 'Other',
  unknown: 'Unknown',
  none: 'None'
}

const YES_NO_UNKNOWN = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

const SKILLS_LABELS = {
  strong: 'Strong work-related skills',
  some: 'Some work-related skills',
  no: 'No work-related skills'
}

const DIFFICULTY_LABELS = {
  reading: 'Yes, with reading',
  writing: 'Yes, with writing',
  numeracy: 'Yes, with numeracy',
  none: 'No difficulties'
}

const LEVEL_LABELS = {
  significant: 'Significant difficulties',
  some: 'Some difficulties'
}

const DIFFICULTY_AREAS = ['reading', 'writing', 'numeracy']

const DIFFICULTY_AREA_LABELS = {
  reading: 'reading',
  writing: 'writing',
  numeracy: 'numeracy'
}

const EXPERIENCE_LABELS = {
  positive: 'Positive',
  'mostly-positive': 'Mostly positive',
  mixed: 'Positive and negative',
  'mostly-negative': 'Mostly negative',
  negative: 'Negative',
  unknown: 'Unknown'
}

const CHANGES_LABELS = {
  maintain: 'I have already made positive changes and want to maintain them',
  active: 'I am actively making changes',
  'know-how': 'I want to make changes and know how to',
  'need-help': 'I want to make changes but need help',
  thinking: 'I am thinking about making changes',
  no: 'I do not want to make changes',
  'no-answer': 'I do not want to answer',
  'not-present': 'Alex is not present',
  'not-applicable': 'Not applicable'
}

// EF2 (job sector), overall experience of employment and overall experience of education are hidden in this prototype.
// EF4 and EF5 are replaced by EF6 (qualifications), which is followed by EF7 (skills).
const ROUTE_QUESTIONS = {
  employed: ['history', 'commitments', 'qualifications', 'skills', 'difficulties', 'changes'],
  retired: ['history', 'commitments', 'qualifications', 'skills', 'difficulties', 'changes'],
  'has-been-employed': ['history', 'commitments', 'qualifications', 'skills', 'difficulties', 'changes'],
  'never-employed': ['commitments', 'qualifications', 'skills', 'difficulties', 'changes']
}

const employmentRoute = (session) => {
  if (session.employmentStatus === 'employed-or-self-employed' || session.employmentStatus === 'employed' || session.employmentStatus === 'self-employed') return 'employed'
  if (session.employmentStatus === 'retired') return 'retired'
  if (BEFORE_STATUSES.includes(session.employmentStatus)) {
    if (session.employedBefore === 'yes') return 'has-been-employed'
    if (session.employedBefore === 'no') return 'never-employed'
  }
  return ''
}

const needsJobPage = (session) => BEFORE_STATUSES.includes(session.employmentStatus)

const routeShows = (route, question) => (ROUTE_QUESTIONS[route] || []).includes(question)

const selectedDifficultyAreas = (difficulties) => {
  return DIFFICULTY_AREAS.filter((area) => Array.isArray(difficulties) && difficulties.includes(area))
}

const difficultyLevelsAnswered = (session) => {
  const areas = selectedDifficultyAreas(session.difficulties)
  if (!areas.length) return true
  const levels = session.difficultyLevels || {}
  return areas.every((area) => levels[area])
}

const difficultyHref = (options = {}) => {
  const params = new URLSearchParams()
  if (options.fromSummary) params.set('from', 'summary')
  const query = params.toString()
  const hash = options.hash ? `#${options.hash}` : ''
  return `employment-difficulty${query ? `?${query}` : ''}${hash}`
}

const difficultyQuestion = (area) => {
  return `How much difficulty does Alex have with ${DIFFICULTY_AREA_LABELS[area] || area}?`
}

const isInHiddenConditional = (element) => {
  return !!element.closest('.govuk-radios__conditional--hidden, .govuk-checkboxes__conditional--hidden, .san-is-hidden, [hidden]')
}

const revealSoon = () => {
  revealCheckedConditionals()
  window.setTimeout(revealCheckedConditionals, 50)
  window.setTimeout(revealCheckedConditionals, 300)
}

const checkedValue = (name) => {
  const selected = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`))
    .find((input) => input.checked && !isInHiddenConditional(input))
  return selected ? selected.value : ''
}

const checkedValues = (name) => {
  return Array.from(document.querySelectorAll(`input[type="checkbox"][name="${name}"]`))
    .filter((input) => input.checked && !isInHiddenConditional(input))
    .map((input) => input.value)
}

const fieldValue = (id) => {
  const field = document.getElementById(id)
  if (!(field instanceof HTMLTextAreaElement) || isInHiddenConditional(field)) return ''
  return field.value.trim()
}

const selectRadio = (name, value) => {
  if (!value) return
  const input = document.querySelector(`input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`)
  if (input instanceof HTMLInputElement) input.checked = true
}

const selectChecks = (name, values) => {
  if (!Array.isArray(values)) return
  document.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`).forEach((input) => {
    if (input instanceof HTMLInputElement) input.checked = values.includes(input.value)
  })
}

const setField = (id, value) => {
  const field = document.getElementById(id)
  if (field instanceof HTMLTextAreaElement) field.value = value || ''
}

const showErrors = (errors) => {
  clearErrors()
  if (!errors.length) return

  errors.forEach((error) => {
    const group = document.querySelector(`[data-san-error-group="${error.group}"]`)
    if (!group) return
    group.classList.add('govuk-form-group--error')
    const message = document.createElement('p')
    message.className = 'govuk-error-message'
    message.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${escapeHtml(error.text)}`
    const fieldset = group.querySelector(':scope > fieldset, :scope > .govuk-fieldset')
    const controls = fieldset ? fieldset.querySelector('.govuk-radios, .govuk-checkboxes, .govuk-hint') : null
    if (fieldset && controls) fieldset.insertBefore(message, controls)
    else if (fieldset) fieldset.prepend(message)
    else group.prepend(message)
  })

  const mount = document.querySelector('[data-san-error-summary]')
  if (!mount) return
  const items = errors.map((error) => `<li><a href="${escapeHtml(error.href)}">${escapeHtml(error.text)}</a></li>`).join('')
  mount.hidden = false
  mount.innerHTML = `<div class="govuk-error-summary" data-module="govuk-error-summary" tabindex="-1">
    <div role="alert">
      <h2 class="govuk-error-summary__title">There is a problem</h2>
      <div class="govuk-error-summary__body">
        <ul class="govuk-list govuk-error-summary__list">${items}</ul>
      </div>
    </div>
  </div>`
  const summary = mount.querySelector('.govuk-error-summary')
  if (summary instanceof HTMLElement) summary.focus()
}

const applyProgress = (session) => {
  const complete = !!session.employmentComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  document.querySelectorAll('[data-section-complete="employment"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  const link = document.querySelector('[data-san-section-link="employment"]')
  if (link && session.employmentStatus) {
    link.setAttribute('href', sectionLinkHref('employment', 'employment-summary.html'))
  }

  const accommodationComplete = !!session.accommodationComplete
  document.querySelectorAll('[data-section-complete="accommodation"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', accommodationComplete)
  })
  const accommodationLink = document.querySelector('[data-san-section-link="accommodation"]')
  if (accommodationLink && session.accommodationType) {
    accommodationLink.setAttribute('href', sectionLinkHref('accommodation', 'accommodation-summary.html'))
  }

  const financesComplete = !!session.financeComplete
  document.querySelectorAll('[data-section-complete="finances"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', financesComplete)
  })
  const financesLink = document.querySelector('[data-san-section-link="finances"]')
  if (financesLink && Array.isArray(session.financeIncome) && session.financeIncome.length) {
    financesLink.setAttribute('href', sectionLinkHref('finances', 'finances-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="drugs"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.drugComplete)
  })
  const drugsLink = document.querySelector('[data-san-section-link="drugs"]')
  if (drugsLink && session.drugUse) {
    drugsLink.setAttribute('href', sectionLinkHref('drugs', 'drugs-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="alcohol"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.alcoholComplete)
  })
  const alcoholLink = document.querySelector('[data-san-section-link="alcohol"]')
  if (alcoholLink && session.alcoholUse) {
    alcoholLink.setAttribute('href', sectionLinkHref('alcohol', 'alcohol-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="health"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.healthComplete)
  })
  const healthLink = document.querySelector('[data-san-section-link="health"]')
  if (healthLink && session.healthPhysical) {
    healthLink.setAttribute('href', sectionLinkHref('health', 'health-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="relationships"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.relationshipsComplete)
  })
  const relationshipsLink = document.querySelector('[data-san-section-link="relationships"]')
  if (relationshipsLink && Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0) {
    relationshipsLink.setAttribute('href', sectionLinkHref('relationships', 'personal-relationships-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="thinking"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.thinkingComplete)
  })
  const thinkingLink = document.querySelector('[data-san-section-link="thinking"]')
  if (thinkingLink && session.thinkingConsequences) {
    thinkingLink.setAttribute('href', sectionLinkHref('thinking', 'thinking-behaviours-summary.html'))
  }
}

const detailsFormAnswered = (session) => {
  const route = employmentRoute(session)
  if (!route || !session.employmentChanges) return false
  if (routeShows(route, 'history') && !session.employmentHistory) return false
  if (routeShows(route, 'commitments') && !(Array.isArray(session.commitments) && session.commitments.length)) return false
  if (routeShows(route, 'qualifications') && !session.qualifications) return false
  if (routeShows(route, 'qualifications') && session.qualifications === 'yes' && !session.qualificationsDetails) return false
  if (routeShows(route, 'skills') && !session.skills) return false
  if (routeShows(route, 'difficulties') && !(Array.isArray(session.difficulties) && session.difficulties.length)) return false
  if (routeShows(route, 'employment-experience') && !session.employmentExperience) return false
  if (routeShows(route, 'education-experience') && !session.educationExperience) return false
  return true
}

const detailsAnswered = (session) => detailsFormAnswered(session) && difficultyLevelsAnswered(session)

const continueDetailsHref = (session) => {
  if (needsJobPage(session) && !session.employedBefore) return 'employment-job'
  if (detailsFormAnswered(session) && !difficultyLevelsAnswered(session)) return difficultyHref()
  return 'employment-details'
}

const summaryChangeHref = (page, hash = '') => `${page}?from=summary${hash ? `#${hash}` : ''}`

const summaryRow = (question, lines, href, options = {}) => {
  const value = lines.filter(Boolean).map((line, index) => {
    const text = escapeHtml(line)
    if (options.secondaryFrom != null && index >= options.secondaryFrom) {
      return `<span class="san-summary-list__secondary">${text}</span>`
    }
    return text
  }).join('<br>')
  const editTarget = href.startsWith('#analysis-') ? href.slice(1) : ''
  const linkHref = editTarget ? '#practitioner-analysis' : href
  const editAttribute = editTarget ? ` data-ee-edit-analysis="${escapeHtml(editTarget)}"` : ''
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const employmentRows = (session) => {
  const route = employmentRoute(session)
  const rows = []

  if (session.employmentStatus) {
    rows.push(summaryRow(
      "What is Alex's current employment status?",
      [labelled(STATUS_LABELS, session.employmentStatus)],
      summaryChangeHref('employment')
    ))
  }

  if (needsJobPage(session) && session.employedBefore) {
    rows.push(summaryRow(
      'Has Alex ever had a job?',
      [labelled(BEFORE_LABELS, session.employedBefore)],
      summaryChangeHref('employment-job')
    ))
  }

  if (routeShows(route, 'job-sector') && session.jobSector) {
    rows.push(summaryRow(
      'What job sector does Alex work in? (optional)',
      [session.jobSector],
      summaryChangeHref('employment-details', 'job-sector')
    ))
  }

  if (routeShows(route, 'history') && session.employmentHistory) {
    const lines = [labelled(HISTORY_LABELS, session.employmentHistory)]
    if (session.employmentHistoryDetails) lines.push(session.employmentHistoryDetails)
    rows.push(summaryRow(
      "What is Alex's employment history?",
      lines,
      summaryChangeHref('employment-details', 'history'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'commitments') && Array.isArray(session.commitments) && session.commitments.length) {
    const lines = []
    session.commitments.forEach((value) => {
      lines.push(labelled(COMMITMENT_LABELS, value))
      const detail = session.commitmentDetails && session.commitmentDetails[value]
      if (detail) lines.push(detail)
    })
    rows.push(summaryRow(
      'Does Alex have any additional day-to-day commitments?',
      lines,
      summaryChangeHref('employment-details', 'commitments')
    ))
  }

  if (routeShows(route, 'qualifications') && session.qualifications) {
    const lines = [labelled(YES_NO_UNKNOWN, session.qualifications)]
    if (session.qualifications === 'yes' && session.qualificationsDetails) lines.push(session.qualificationsDetails)
    rows.push(summaryRow(
      'Does Alex have any completed academic, professional or vocational qualifications?',
      lines,
      summaryChangeHref('employment-details', 'qualifications'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'skills') && session.skills) {
    const lines = [labelled(SKILLS_LABELS, session.skills)]
    if (session.skillsDetails) lines.push(session.skillsDetails)
    rows.push(summaryRow(
      "How would you describe Alex's skills for work?",
      lines,
      summaryChangeHref('employment-details', 'skills'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'difficulties') && Array.isArray(session.difficulties) && session.difficulties.length) {
    rows.push(summaryRow(
      'Does Alex have difficulties with reading, writing or numeracy?',
      session.difficulties.map((value) => labelled(DIFFICULTY_LABELS, value)),
      summaryChangeHref('employment-details', 'difficulties')
    ))
    selectedDifficultyAreas(session.difficulties).forEach((area) => {
      const level = session.difficultyLevels && session.difficultyLevels[area]
      if (!level) return
      rows.push(summaryRow(
        difficultyQuestion(area),
        [labelled(LEVEL_LABELS, level)],
        difficultyHref({ fromSummary: true, hash: `difficulty-${area}-level` })
      ))
    })
  }

  if (routeShows(route, 'employment-experience') && session.employmentExperience) {
    const lines = [labelled(EXPERIENCE_LABELS, session.employmentExperience)]
    if (session.employmentExperienceDetails) lines.push(session.employmentExperienceDetails)
    rows.push(summaryRow(
      "What is Alex's overall experience of employment?",
      lines,
      summaryChangeHref('employment-details', 'employment-experience'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'education-experience') && session.educationExperience) {
    const lines = [labelled(EXPERIENCE_LABELS, session.educationExperience)]
    if (session.educationExperienceDetails) lines.push(session.educationExperienceDetails)
    rows.push(summaryRow(
      "What is Alex's experience of education?",
      lines,
      summaryChangeHref('employment-details', 'education-experience'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.employmentChanges) {
    const lines = [labelled(CHANGES_LABELS, session.employmentChanges)]
    if (session.employmentChangesDetails) lines.push(session.employmentChangesDetails)
    rows.push(summaryRow(
      'Does Alex want to make changes to their employment and education?',
      lines,
      summaryChangeHref('employment-details', 'changes'),
      { secondaryFrom: 1 }
    ))
  }

  return rows
}

const analysisRows = (session) => {
  const rows = []
  if (session.eeAnalysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's employment and education?",
      [labelled(YES_NO_UNKNOWN, session.eeAnalysisStrengths), session.eeAnalysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.eeAnalysisHarm) {
    rows.push(summaryRow(
      "Is Alex's employment and education linked to risk of serious harm?",
      [labelled(YES_NO_UNKNOWN, session.eeAnalysisHarm), session.eeAnalysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.eeAnalysisReoffending) {
    rows.push(summaryRow(
      "Is Alex's employment and education linked to risk of reoffending?",
      [labelled(YES_NO_UNKNOWN, session.eeAnalysisReoffending), session.eeAnalysisReoffendingDetails],
      '#analysis-reoffending',
      { secondaryFrom: 1 }
    ))
  }
  return rows
}

const setHeadingLevel = (heading, level) => {
  if (!(heading instanceof HTMLElement) || heading.tagName === level) return heading
  const next = document.createElement(level)
  next.className = heading.className
  next.innerHTML = heading.innerHTML
  heading.replaceWith(next)
  return next
}

const showSelectedDifficulties = (areas) => {
  let shown = 0
  document.querySelectorAll('[data-ee-difficulty]').forEach((block) => {
    const show = areas.includes(block.getAttribute('data-ee-difficulty'))
    block.hidden = !show
    block.classList.toggle('san-is-hidden', !show)
    if (!show) return
    const first = shown === 0
    shown += 1
    const only = areas.length === 1
    block.classList.toggle('san-question', !first)
    const legend = block.querySelector('.govuk-fieldset__legend')
    if (legend) {
      legend.classList.toggle('govuk-fieldset__legend--l', only)
      legend.classList.toggle('govuk-fieldset__legend--m', !only)
    }
    const heading = block.querySelector('.govuk-fieldset__heading')
    setHeadingLevel(heading, first ? 'h1' : 'h2')
  })
}

const setHidden = (element, hidden) => {
  if (!element) return
  element.hidden = hidden
  element.classList.toggle('san-is-hidden', hidden)
}

const renderSummary = (session) => {
  const mount = document.querySelector('[data-ee-summary]')
  if (!mount) return

  const complete = !!session.employmentComplete
  const rows = employmentRows(session)
  const goButton = document.querySelector('[data-ee-go-analysis]')

  if (!rows.length) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="employment.html">Answer employment and education questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && !detailsAnswered(session)) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${continueDetailsHref(session)}">Continue</a></p>`
    }
    mount.innerHTML = `<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>${followOn}`
  }

  if (goButton) {
    const showButton = !complete && detailsAnswered(session)
    goButton.hidden = !showButton
    goButton.classList.toggle('san-go-analysis--hidden', !showButton)
  }

  renderAnalysisSummary(session)
}

const renderAnalysisSummary = (session) => {
  const mount = document.querySelector('[data-ee-analysis-summary]')
  const form = document.getElementById('san-employment-analysis-form')
  if (!mount || !form) return

  if (!session.employmentComplete) {
    setHidden(mount, true)
    setHidden(form, false)
    return
  }

  const rows = analysisRows(session)
  mount.innerHTML = rows.length
    ? `<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>`
    : ''
  setHidden(mount, !rows.length)
  setHidden(form, true)
}

const showAnalysisForm = (focusId) => {
  const mount = document.querySelector('[data-ee-analysis-summary]')
  const form = document.getElementById('san-employment-analysis-form')
  setHidden(mount, true)
  setHidden(form, false)
  openAnalysisTab()
  if (!focusId) return
  const target = document.getElementById(focusId)
  if (target instanceof HTMLElement) target.scrollIntoView()
}

const openAnalysisTab = () => {
  const tab = document.querySelector('.govuk-tabs__tab[href="#practitioner-analysis"]')
  if (tab instanceof HTMLElement) tab.click()
}

const readStatusAnswers = () => {
  const employmentStatus = checkedValue('employment_status')
  return {
    employmentStatus,
    employmentSubtype: '',
    employedBefore: needsJobPage({ employmentStatus })
      ? getSanSession().employedBefore || ''
      : ''
  }
}

const emptyDetailAnswers = () => ({
  jobSector: '',
  employmentHistory: '',
  employmentHistoryDetails: '',
  commitments: [],
  commitmentDetails: {},
  academicQualification: '',
  vocational: '',
  vocationalDetails: '',
  qualifications: '',
  qualificationsDetails: '',
  skills: '',
  skillsDetails: '',
  difficulties: [],
  difficultyLevels: {},
  employmentExperience: '',
  employmentExperienceDetails: '',
  educationExperience: '',
  educationExperienceDetails: '',
  employmentChanges: '',
  employmentChangesDetails: ''
})

const readDetailsAnswers = (route) => {
  const answers = emptyDetailAnswers()

  if (routeShows(route, 'job-sector')) {
    answers.jobSector = fieldValue('job-sector')
  }

  if (routeShows(route, 'history')) {
    answers.employmentHistory = checkedValue('employment_history')
    answers.employmentHistoryDetails = answers.employmentHistory
      ? fieldValue(`history-${answers.employmentHistory}-details`)
      : ''
  }

  if (routeShows(route, 'commitments')) {
    answers.commitments = checkedValues('commitments')
    const details = {}
    answers.commitments.forEach((value) => {
      const text = fieldValue(`commitment-${value}-details`)
      if (text) details[value] = text
    })
    answers.commitmentDetails = details
  }

  if (routeShows(route, 'qualifications')) {
    answers.qualifications = checkedValue('qualifications')
    answers.qualificationsDetails = answers.qualifications === 'yes' ? fieldValue('qualifications-yes-details') : ''
  }

  if (routeShows(route, 'skills')) {
    answers.skills = checkedValue('skills')
    answers.skillsDetails = answers.skills
      ? fieldValue(`skills-${answers.skills}-details`)
      : ''
  }

  if (routeShows(route, 'difficulties')) {
    answers.difficulties = checkedValues('difficulties')
    const previous = getSanSession().difficultyLevels || {}
    const levels = {}
    selectedDifficultyAreas(answers.difficulties).forEach((value) => {
      if (previous[value]) levels[value] = previous[value]
    })
    answers.difficultyLevels = levels
  }

  if (routeShows(route, 'employment-experience')) {
    answers.employmentExperience = checkedValue('employment_experience')
    answers.employmentExperienceDetails = answers.employmentExperience && answers.employmentExperience !== 'unknown'
      ? fieldValue(`employment-experience-${answers.employmentExperience}-details`)
      : ''
  }

  if (routeShows(route, 'education-experience')) {
    answers.educationExperience = checkedValue('education_experience')
    answers.educationExperienceDetails = answers.educationExperience && answers.educationExperience !== 'unknown'
      ? fieldValue(`education-experience-${answers.educationExperience}-details`)
      : ''
  }

  if (routeShows(route, 'changes')) {
    answers.employmentChanges = checkedValue('employment_changes')
    const withDetails = ['maintain', 'active', 'know-how', 'need-help', 'thinking', 'no']
    answers.employmentChangesDetails = withDetails.includes(answers.employmentChanges)
      ? fieldValue(`changes-${answers.employmentChanges}-details`)
      : ''
  }

  return answers
}

const readAnalysisAnswers = () => {
  const eeAnalysisStrengths = checkedValue('analysis_strengths')
  const eeAnalysisHarm = checkedValue('analysis_harm')
  const eeAnalysisReoffending = checkedValue('analysis_reoffending')
  return {
    eeAnalysisStrengths,
    eeAnalysisStrengthsDetails: eeAnalysisStrengths ? fieldValue(`analysis-strengths-${eeAnalysisStrengths}-details`) : '',
    eeAnalysisHarm,
    eeAnalysisHarmDetails: eeAnalysisHarm ? fieldValue(`analysis-harm-${eeAnalysisHarm}-details`) : '',
    eeAnalysisReoffending,
    eeAnalysisReoffendingDetails: eeAnalysisReoffending ? fieldValue(`analysis-reoffending-${eeAnalysisReoffending}-details`) : ''
  }
}

const validateStatus = (answers) => {
  if (answers.employmentStatus) return []
  return [{
    group: 'employment-status',
    href: '#employment-status',
    text: "Select Alex's current employment status"
  }]
}

const validateJob = (employedBefore) => {
  if (employedBefore) return []
  return [{
    group: 'employed-before',
    href: '#employed-before',
    text: 'Select if Alex has ever had a job'
  }]
}

const validateDetails = (answers, route) => {
  const errors = []
  if (routeShows(route, 'history') && !answers.employmentHistory) {
    errors.push({
      group: 'history',
      href: '#history',
      text: "Select Alex's employment history"
    })
  }
  if (routeShows(route, 'commitments') && !answers.commitments.length) {
    errors.push({
      group: 'commitments',
      href: '#commitments',
      text: 'Select if Alex has any additional day-to-day commitments'
    })
  }
  if (routeShows(route, 'qualifications') && !answers.qualifications) {
    errors.push({
      group: 'qualifications',
      href: '#qualifications',
      text: 'Select if Alex has any completed academic, professional or vocational qualifications'
    })
  } else if (routeShows(route, 'qualifications') && answers.qualifications === 'yes' && !answers.qualificationsDetails) {
    errors.push({
      group: 'qualifications-details',
      href: '#qualifications-yes-details',
      text: "Enter details about Alex's qualifications"
    })
  }
  if (routeShows(route, 'skills') && !answers.skills) {
    errors.push({
      group: 'skills',
      href: '#skills',
      text: "Select how you would describe Alex's skills for work"
    })
  }
  if (routeShows(route, 'difficulties') && !answers.difficulties.length) {
    errors.push({
      group: 'difficulties',
      href: '#difficulties',
      text: 'Select if Alex has difficulties with reading, writing or numeracy'
    })
  }
  if (routeShows(route, 'employment-experience') && !answers.employmentExperience) {
    errors.push({
      group: 'employment-experience',
      href: '#employment-experience',
      text: "Select Alex's overall experience of employment"
    })
  }
  if (routeShows(route, 'education-experience') && !answers.educationExperience) {
    errors.push({
      group: 'education-experience',
      href: '#education-experience',
      text: "Select Alex's experience of education"
    })
  }
  if (routeShows(route, 'changes') && !answers.employmentChanges) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their employment and education'
    })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['eeAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to employment and education', 'Enter details about the strengths or protective factors'],
    ['eeAnalysisHarm', 'analysis-harm', "Select if Alex's employment and education is linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['eeAnalysisReoffending', 'analysis-reoffending', "Select if Alex's employment and education is linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
  ]

  questions.forEach(([key, id, missingAnswer, missingDetails]) => {
    if (!answers[key]) {
      errors.push({ group: id, href: `#${id}`, text: missingAnswer })
    } else if (answers[key] === 'yes' && !answers[`${key}Details`]) {
      errors.push({ group: id, href: `#${id}-yes-details`, text: missingDetails })
    }
  })

  return errors
}

const applyDetailsRoute = (route) => {
  const form = document.getElementById('san-employment-details-form')
  if (form) form.setAttribute('data-ee-route', route)

  const visible = []
  document.querySelectorAll('[data-ee-question]').forEach((block) => {
    const show = routeShows(route, block.getAttribute('data-ee-question'))
    block.hidden = !show
    block.classList.toggle('san-is-hidden', !show)
    block.classList.remove('san-question')
    if (show) visible.push(block)
  })
  visible.slice(1).forEach((block) => block.classList.add('san-question'))
}

const restoreStatus = (session) => {
  selectRadio('employment_status', session.employmentStatus)
}

const restoreJob = (session) => {
  selectRadio('employed_before', session.employedBefore)
}

const restoreDetails = (session) => {
  setField('job-sector', session.jobSector)
  selectRadio('employment_history', session.employmentHistory)
  if (session.employmentHistory) setField(`history-${session.employmentHistory}-details`, session.employmentHistoryDetails)
  selectChecks('commitments', session.commitments)
  if (session.commitmentDetails) {
    Object.entries(session.commitmentDetails).forEach(([key, value]) => {
      setField(`commitment-${key}-details`, value)
    })
  }
  selectRadio('qualifications', session.qualifications)
  if (session.qualifications === 'yes') setField('qualifications-yes-details', session.qualificationsDetails)
  selectRadio('skills', session.skills)
  if (session.skills) setField(`skills-${session.skills}-details`, session.skillsDetails)
  selectChecks('difficulties', session.difficulties)
  selectRadio('employment_experience', session.employmentExperience)
  if (session.employmentExperience && session.employmentExperience !== 'unknown') {
    setField(`employment-experience-${session.employmentExperience}-details`, session.employmentExperienceDetails)
  }
  selectRadio('education_experience', session.educationExperience)
  if (session.educationExperience && session.educationExperience !== 'unknown') {
    setField(`education-experience-${session.educationExperience}-details`, session.educationExperienceDetails)
  }
  selectRadio('employment_changes', session.employmentChanges)
  if (session.employmentChanges) setField(`changes-${session.employmentChanges}-details`, session.employmentChangesDetails)
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.eeAnalysisStrengths)
  if (session.eeAnalysisStrengths) setField(`analysis-strengths-${session.eeAnalysisStrengths}-details`, session.eeAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.eeAnalysisHarm)
  if (session.eeAnalysisHarm) setField(`analysis-harm-${session.eeAnalysisHarm}-details`, session.eeAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.eeAnalysisReoffending)
  if (session.eeAnalysisReoffending) setField(`analysis-reoffending-${session.eeAnalysisReoffending}-details`, session.eeAnalysisReoffendingDetails)
}

const fromSummary = () => new URLSearchParams(window.location.search).get('from') === 'summary'

const ensureBackLink = (href) => {
  let back = document.querySelector('.assessment-layout__back-link')
  const column = document.querySelector('.govuk-grid-column-two-thirds-from-desktop')
  if (!column) return
  if (!back) {
    back = document.createElement('a')
    back.className = 'govuk-back-link assessment-layout__back-link assessment-layout__back-link--in-content'
    back.textContent = 'Back'
    column.insertBefore(back, column.firstChild)
  }
  back.setAttribute('href', href)
}

const seedExample = () => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('example') !== 'complete') return
  const current = getSanSession()
  replaceSanSession({ ...current, ...EXAMPLE_COMPLETE })
  params.delete('example')
  const query = params.toString()
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', next)
}

const initEmployment = () => {
  const page = document.querySelector('[data-ee-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('employment-summary.html')

  const pageName = page.getAttribute('data-ee-page')
  if (pageName === 'status') restoreStatus(session)
  if (pageName === 'job') {
    if (!needsJobPage(session)) {
      window.location.assign(session.employmentStatus ? 'employment-details' : 'employment')
      return
    }
    restoreJob(session)
  }
  if (pageName === 'details') {
    if (needsJobPage(session) && !session.employedBefore) {
      window.location.assign('employment-job')
      return
    }
    const route = employmentRoute(session)
    if (!route) {
      window.location.assign('employment')
      return
    }
    if (!fromSummary()) {
      ensureBackLink(needsJobPage(session) ? 'employment-job.html' : 'employment.html')
    }
    applyDetailsRoute(route)
    restoreDetails(session)
  }
  if (pageName === 'difficulty') {
    const route = employmentRoute(session)
    if (!route) {
      window.location.replace('employment')
      return
    }
    const areas = selectedDifficultyAreas(session.difficulties)
    if (!areas.length) {
      window.location.replace(fromSummary() ? 'employment-summary' : 'employment-details')
      return
    }
    showSelectedDifficulties(areas)
    areas.forEach((area) => {
      const level = session.difficultyLevels && session.difficultyLevels[area]
      if (level) selectRadio(`difficulty_${area}`, level)
    })
    if (!fromSummary()) ensureBackLink('employment-details#difficulties')
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-ee-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-ee-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-ee-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-ee-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  const statusForm = document.getElementById('san-employment-status-form')
  statusForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const answers = readStatusAnswers()
    const errors = validateStatus(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    const previousRoute = employmentRoute(previous)
    const nextRoute = employmentRoute(answers)
    const updates = { ...answers, employmentComplete: false }
    if (nextRoute !== previousRoute) Object.assign(updates, emptyDetailAnswers())
    setSanSession(updates)

    if (needsJobPage(answers)) {
      window.location.assign(fromSummary() && needsJobPage(previous) && previous.employedBefore
        ? 'employment-summary'
        : 'employment-job')
      return
    }

    window.location.assign(fromSummary() && nextRoute === previousRoute
      ? 'employment-summary'
      : 'employment-details')
  })

  const jobForm = document.getElementById('san-employment-job-form')
  jobForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const employedBefore = checkedValue('employed_before')
    const errors = validateJob(employedBefore)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    const updates = { employedBefore, employmentComplete: false }
    const nextRoute = employmentRoute({ ...previous, ...updates })
    if (nextRoute !== employmentRoute(previous)) Object.assign(updates, emptyDetailAnswers())
    setSanSession(updates)
    window.location.assign(fromSummary() && nextRoute === employmentRoute(previous)
      ? 'employment-summary'
      : 'employment-details')
  })

  const detailsForm = document.getElementById('san-employment-details-form')
  detailsForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const route = employmentRoute(getSanSession())
    const answers = readDetailsAnswers(route)
    const errors = validateDetails(answers, route)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, employmentComplete: false })
    const areas = selectedDifficultyAreas(answers.difficulties)
    if (!areas.length || (fromSummary() && areas.every((value) => answers.difficultyLevels[value]))) {
      window.location.assign('employment-summary')
      return
    }
    window.location.assign(difficultyHref({ fromSummary: fromSummary() }))
  })

  const difficultyForm = document.getElementById('san-employment-difficulty-form')
  difficultyForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const current = getSanSession()
    const areas = selectedDifficultyAreas(current.difficulties)
    if (!areas.length) {
      window.location.assign(fromSummary() ? 'employment-summary' : 'employment-details')
      return
    }
    const errors = []
    const levels = {}
    areas.forEach((area) => {
      const level = checkedValue(`difficulty_${area}`)
      if (!level) {
        errors.push({
          group: `difficulty-${area}`,
          href: `#difficulty-${area}-level`,
          text: `Select how much difficulty Alex has with ${DIFFICULTY_AREA_LABELS[area] || area}`
        })
      } else {
        levels[area] = level
      }
    })
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ difficultyLevels: levels, employmentComplete: false })
    window.location.assign('employment-summary')
  })

  const analysisForm = document.getElementById('san-employment-analysis-form')
  analysisForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readAnalysisAnswers()
    const errors = validateAnalysis(answers)
    if (errors.length) {
      showErrors(errors)
      openAnalysisTab()
      return
    }
    clearErrors()
    setSanSession({ ...answers, employmentComplete: true })
    window.location.assign('employment-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.startsWith("/san-research/")) return
  initEmployment()
})
