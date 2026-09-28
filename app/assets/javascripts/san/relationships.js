//
// Personal relationships and community section of the Strengths and needs prototype
//

import { getSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const CHILD_YES = ['live', 'away', 'visit']

const CHILD_LABELS = {
  live: 'Yes, children that live with Alex',
  away: 'Yes, children that do not live with Alex',
  visit: 'Yes, children that visit Alex regularly',
  none: "No, there are no children in Alex's life"
}

const PEOPLE_IDS = ['partner', 'children', 'other-children', 'family', 'friends', 'other']

const PEOPLE_LABELS = {
  partner: "Partner or someone they're in an intimate relationship with",
  children: 'Their children or anyone they have parenting responsibilities for',
  'other-children': 'Other children',
  family: 'Family members',
  friends: 'Friends',
  other: 'Other'
}

const STATUS_LABELS = {
  happy: 'Happy and positive about their relationship status, or their relationship is likely to act as a protective factor',
  concerns: 'Has some concerns about their relationship status but is overall happy',
  unhappy: 'Unhappy about their relationship status, or their relationship is unhealthy and directly linked to offending'
}

const HISTORY_LABELS = {
  stable: 'History of stable, supportive, positive and rewarding relationships',
  mixed: 'History of both positive and negative relationships',
  unstable: 'History of unstable, unsupportive and destructive relationships'
}

const PARENTING_LABELS = {
  yes: 'Yes, manages parenting responsibilities well',
  sometimes: 'Sometimes manages parenting responsibilities well',
  no: 'No, is not able to manage parenting responsibilities',
  unknown: 'Unknown'
}

const FAMILY_LABELS = {
  stable: 'Stable, supportive, positive and rewarding relationship',
  mixed: 'Both positive and negative relationship',
  unstable: 'Unstable and unsupportive relationship',
  unknown: 'Unknown'
}

const CHILDHOOD_LABELS = {
  positive: 'Positive experience',
  mixed: 'Both positive and negative experience',
  negative: 'Negative experience'
}

const BEHAVIOUR_LABELS = { yes: 'Yes', no: 'No' }

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

const YES_NO = { yes: 'Yes', no: 'No' }

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
    const fieldset = group.querySelector('fieldset')
    const controls = fieldset ? fieldset.querySelector('.govuk-radios, .govuk-checkboxes, .govuk-hint') : null
    if (fieldset && controls) fieldset.insertBefore(message, controls)
    else if (fieldset) fieldset.prepend(message)
    else {
      const field = group.querySelector('textarea, input')
      if (field) group.insertBefore(message, field)
      else group.prepend(message)
    }
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

const sectionLink = (key, complete, started, href) => {
  document.querySelectorAll(`[data-section-complete="${key}"]`).forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })
  const link = document.querySelector(`[data-san-section-link="${key}"]`)
  const next = sectionLinkHref(key, started ? href : '')
  if (link && next) link.setAttribute('href', next)
}

const applyProgress = (session) => {
  const complete = !!session.relationshipsComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  sectionLink('relationships', complete, Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0, 'personal-relationships-summary.html')
  sectionLink('accommodation', !!session.accommodationComplete, !!session.accommodationType, 'accommodation-summary.html')
  sectionLink('employment', !!session.employmentComplete, !!session.employmentStatus, 'employment-summary.html')
  sectionLink('finances', !!session.financeComplete, Array.isArray(session.financeIncome) && session.financeIncome.length, 'finances-summary.html')
  sectionLink('drugs', !!session.drugComplete, !!session.drugUse, 'drugs-summary.html')
  sectionLink('alcohol', !!session.alcoholComplete, !!session.alcoholUse, 'alcohol-summary.html')
  sectionLink('health', !!session.healthComplete, !!session.healthPhysical, 'health-summary.html')
  sectionLink('thinking', !!session.thinkingComplete, !!session.thinkingConsequences, 'thinking-behaviours-summary.html')
}

const hasChildren = (children) => (children || []).some((value) => CHILD_YES.includes(value))

const hasAnswers = (values) => Array.isArray(values) && values.length > 0

const nextIncompleteHref = (session) => {
  if (!hasAnswers(session.relationshipsChildren)) return 'personal-relationships-children.html'
  if (!hasAnswers(session.relationshipsPeople)) return 'personal-relationships-people.html'
  return 'personal-relationships-questions.html'
}

const questionsAnswered = (session) => {
  if (!hasAnswers(session.relationshipsChildren) || !hasAnswers(session.relationshipsPeople)) return false
  if (!session.relationshipsStatus || !session.relationshipsHistory || !session.relationshipsResolve) return false
  if (hasChildren(session.relationshipsChildren) && !session.relationshipsParenting) return false
  if (!session.relationshipsFamily || !session.relationshipsChildhood || !session.relationshipsBehaviour) return false
  if (!session.relationshipsChanges) return false
  return true
}

const summaryChangeHref = (page, hash = '') => `${page}?from=summary${hash ? `#${hash}` : ''}`

const summaryRow = (question, lines, href) => {
  const value = lines.filter((line) => line && line.text).map((line) => {
    const text = escapeHtml(line.text)
    return line.secondary ? `<span class="san-summary-list__secondary">${text}</span>` : text
  }).join('<br>')
  const editTarget = href.startsWith('#analysis-') ? href.slice(1) : ''
  const linkHref = editTarget ? '#practitioner-analysis' : href
  const editAttribute = editTarget ? ` data-pc-edit-analysis="${escapeHtml(editTarget)}"` : ''
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value || 'Not provided'}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const answerLines = (label, details) => {
  const lines = []
  if (label) lines.push({ text: label })
  if (details) lines.push({ text: details, secondary: true })
  return lines
}

const relationshipRows = (session) => {
  const rows = []

  if (Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length) {
    const details = session.relationshipsChildrenDetails || {}
    const lines = []
    session.relationshipsChildren.forEach((value) => {
      lines.push({ text: labelled(CHILD_LABELS, value) })
      if (details[value]) lines.push({ text: details[value], secondary: true })
    })
    rows.push(summaryRow(
      "Are there any children in Alex's life?",
      lines,
      summaryChangeHref('personal-relationships-children')
    ))
  }

  if (hasAnswers(session.relationshipsPeople)) {
    const details = session.relationshipsPeopleDetails || {}
    const lines = []
    session.relationshipsPeople.forEach((value) => {
      lines.push({ text: labelled(PEOPLE_LABELS, value) })
      if (details[value]) lines.push({ text: details[value], secondary: true })
    })
    rows.push(summaryRow(
      "Who are the important people in Alex's life?",
      lines,
      summaryChangeHref('personal-relationships-people')
    ))
  }

  if (session.relationshipsStatus) {
    rows.push(summaryRow(
      'Is Alex happy with their current relationship status?',
      answerLines(labelled(STATUS_LABELS, session.relationshipsStatus), session.relationshipsStatusDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-status')
    ))
  }

  if (session.relationshipsHistory) {
    rows.push(summaryRow(
      "What is Alex's history of intimate relationships?",
      answerLines(labelled(HISTORY_LABELS, session.relationshipsHistory), session.relationshipsHistoryDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-history')
    ))
  }

  if (session.relationshipsResolve) {
    rows.push(summaryRow(
      'Is Alex able to resolve any challenges in their intimate relationships?',
      [{ text: session.relationshipsResolve }],
      summaryChangeHref('personal-relationships-questions', 'relationships-resolve')
    ))
  }

  if (hasChildren(session.relationshipsChildren) && session.relationshipsParenting) {
    rows.push(summaryRow(
      'Is Alex able to manage their parenting responsibilities?',
      answerLines(labelled(PARENTING_LABELS, session.relationshipsParenting), session.relationshipsParentingDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-parenting')
    ))
  }

  if (session.relationshipsFamily) {
    rows.push(summaryRow(
      "What is Alex's current relationship like with their family?",
      answerLines(labelled(FAMILY_LABELS, session.relationshipsFamily), session.relationshipsFamilyDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-family')
    ))
  }

  if (session.relationshipsChildhood) {
    rows.push(summaryRow(
      "What was Alex's experience of their childhood?",
      answerLines(labelled(CHILDHOOD_LABELS, session.relationshipsChildhood), session.relationshipsChildhoodDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-childhood')
    ))
  }

  if (session.relationshipsBehaviour) {
    rows.push(summaryRow(
      'Did Alex have any childhood behavioural problems?',
      answerLines(labelled(BEHAVIOUR_LABELS, session.relationshipsBehaviour), session.relationshipsBehaviourDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-behaviour')
    ))
  }

  if (questionsAnswered(session)) {
    rows.push(summaryRow(
      'Is Alex part of any groups or communities that gives them a sense of belonging? (optional)',
      [{ text: session.relationshipsBelonging || 'Not provided' }],
      summaryChangeHref('personal-relationships-questions', 'relationships-belonging')
    ))
  }

  if (session.relationshipsChanges) {
    rows.push(summaryRow(
      'Does Alex want to make changes to their personal relationships and community?',
      answerLines(labelled(CHANGES_LABELS, session.relationshipsChanges), session.relationshipsChangesDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-changes')
    ))
  }

  return rows
}

const analysisRows = (session) => {
  const rows = []
  if (session.relationshipsAnalysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's personal relationships and community?",
      answerLines(labelled(YES_NO, session.relationshipsAnalysisStrengths), session.relationshipsAnalysisStrengthsDetails),
      '#analysis-strengths'
    ))
  }
  if (session.relationshipsAnalysisHarm) {
    rows.push(summaryRow(
      "Is Alex's personal relationships and community linked to risk of serious harm?",
      answerLines(labelled(YES_NO, session.relationshipsAnalysisHarm), session.relationshipsAnalysisHarmDetails),
      '#analysis-harm'
    ))
  }
  if (session.relationshipsAnalysisReoffending) {
    rows.push(summaryRow(
      "Is Alex's personal relationships and community linked to risk of reoffending?",
      answerLines(labelled(YES_NO, session.relationshipsAnalysisReoffending), session.relationshipsAnalysisReoffendingDetails),
      '#analysis-reoffending'
    ))
  }
  return rows
}

const setHidden = (element, hidden) => {
  if (!element) return
  element.hidden = hidden
  element.classList.toggle('san-is-hidden', hidden)
}

const renderSummary = (session) => {
  const mount = document.querySelector('[data-san-summary]')
  if (!mount) return

  const complete = !!session.relationshipsComplete
  const rows = relationshipRows(session)
  const goButton = document.querySelector('[data-san-go-analysis]')

  if (!rows.length) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="personal-relationships-children.html">Answer personal relationships and community questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && !questionsAnswered(session)) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${nextIncompleteHref(session)}">Continue</a></p>`
    }
    mount.innerHTML = `<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>${followOn}`
  }

  if (goButton) {
    const showButton = !complete && questionsAnswered(session)
    goButton.hidden = !showButton
    goButton.classList.toggle('san-go-analysis--hidden', !showButton)
  }

  renderAnalysisSummary(session)
}

const renderAnalysisSummary = (session) => {
  const mount = document.querySelector('[data-san-analysis-summary]')
  const form = document.getElementById('san-relationships-analysis-form')
  if (!mount || !form) return

  if (!session.relationshipsComplete) {
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
  const mount = document.querySelector('[data-san-analysis-summary]')
  const form = document.getElementById('san-relationships-analysis-form')
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

const emptyAnswers = () => ({
  relationshipsChildren: [],
  relationshipsChildrenDetails: {},
  relationshipsPeople: [],
  relationshipsPeopleDetails: {},
  relationshipsStatus: '',
  relationshipsStatusDetails: '',
  relationshipsHistory: '',
  relationshipsHistoryDetails: '',
  relationshipsResolve: '',
  relationshipsParenting: '',
  relationshipsParentingDetails: '',
  relationshipsFamily: '',
  relationshipsFamilyDetails: '',
  relationshipsChildhood: '',
  relationshipsChildhoodDetails: '',
  relationshipsBehaviour: '',
  relationshipsBehaviourDetails: '',
  relationshipsBelonging: '',
  relationshipsChanges: '',
  relationshipsChangesDetails: ''
})

const readPeople = () => {
  const relationshipsPeople = checkedValues('relationships_people')
  const relationshipsPeopleDetails = {}
  PEOPLE_IDS.forEach((id) => {
    if (relationshipsPeople.includes(id)) relationshipsPeopleDetails[id] = fieldValue(`people-${id}-details`)
  })
  return { relationshipsPeople, relationshipsPeopleDetails }
}

const readChildren = () => {
  const relationshipsChildren = checkedValues('relationships_children')
  const relationshipsChildrenDetails = {}
  CHILD_YES.forEach((id) => {
    if (relationshipsChildren.includes(id)) relationshipsChildrenDetails[id] = fieldValue(`children-${id}-details`)
  })
  return { relationshipsChildren, relationshipsChildrenDetails }
}

const detailsFor = (prefix, value) => (value ? fieldValue(`${prefix}-${value}-details`) : '')

const readQuestions = (showParenting) => {
  const relationshipsStatus = checkedValue('relationships_status')
  const relationshipsHistory = checkedValue('relationships_history')
  const relationshipsParenting = showParenting ? checkedValue('relationships_parenting') : ''
  const relationshipsFamily = checkedValue('relationships_family')
  const relationshipsChildhood = checkedValue('relationships_childhood')
  const relationshipsBehaviour = checkedValue('relationships_behaviour')
  const relationshipsChanges = checkedValue('relationships_changes')
  return {
    relationshipsStatus,
    relationshipsStatusDetails: detailsFor('status', relationshipsStatus),
    relationshipsHistory,
    relationshipsHistoryDetails: detailsFor('history', relationshipsHistory),
    relationshipsResolve: fieldValue('relationships-resolve'),
    relationshipsParenting,
    relationshipsParentingDetails: detailsFor('parenting', relationshipsParenting),
    relationshipsFamily,
    relationshipsFamilyDetails: detailsFor('family', relationshipsFamily),
    relationshipsChildhood,
    relationshipsChildhoodDetails: detailsFor('childhood', relationshipsChildhood),
    relationshipsBehaviour,
    relationshipsBehaviourDetails: detailsFor('behaviour', relationshipsBehaviour),
    relationshipsBelonging: fieldValue('relationships-belonging'),
    relationshipsChanges,
    relationshipsChangesDetails: detailsFor('changes', relationshipsChanges)
  }
}

const readAnalysis = () => {
  const relationshipsAnalysisStrengths = checkedValue('analysis_strengths')
  const relationshipsAnalysisHarm = checkedValue('analysis_harm')
  const relationshipsAnalysisReoffending = checkedValue('analysis_reoffending')
  return {
    relationshipsAnalysisStrengths,
    relationshipsAnalysisStrengthsDetails: relationshipsAnalysisStrengths ? fieldValue(`analysis-strengths-${relationshipsAnalysisStrengths}-details`) : '',
    relationshipsAnalysisHarm,
    relationshipsAnalysisHarmDetails: relationshipsAnalysisHarm ? fieldValue(`analysis-harm-${relationshipsAnalysisHarm}-details`) : '',
    relationshipsAnalysisReoffending,
    relationshipsAnalysisReoffendingDetails: relationshipsAnalysisReoffending ? fieldValue(`analysis-reoffending-${relationshipsAnalysisReoffending}-details`) : ''
  }
}

const validateQuestions = (answers, showParenting) => {
  const errors = []
  if (!answers.relationshipsStatus) {
    errors.push({ group: 'relationships-status', href: '#relationships-status', text: 'Select if Alex is happy with their current relationship status' })
  }
  if (!answers.relationshipsHistory) {
    errors.push({ group: 'relationships-history', href: '#relationships-history', text: "Select Alex's history of intimate relationships" })
  }
  if (!answers.relationshipsResolve) {
    errors.push({ group: 'relationships-resolve', href: '#relationships-resolve', text: 'Enter how Alex resolves challenges in their intimate relationships' })
  }
  if (showParenting && !answers.relationshipsParenting) {
    errors.push({ group: 'relationships-parenting', href: '#relationships-parenting', text: 'Select if Alex is able to manage their parenting responsibilities' })
  }
  if (!answers.relationshipsFamily) {
    errors.push({ group: 'relationships-family', href: '#relationships-family', text: "Select what Alex's current relationship with their family is like" })
  }
  if (!answers.relationshipsChildhood) {
    errors.push({ group: 'relationships-childhood', href: '#relationships-childhood', text: "Select Alex's experience of their childhood" })
  }
  if (!answers.relationshipsBehaviour) {
    errors.push({ group: 'relationships-behaviour', href: '#relationships-behaviour', text: 'Select if Alex had any childhood behavioural problems' })
  }
  if (!answers.relationshipsChanges) {
    errors.push({ group: 'relationships-changes', href: '#relationships-changes', text: 'Select if Alex wants to make changes to their personal relationships and community' })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['relationshipsAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to personal relationships and community', 'Enter details about the strengths or protective factors'],
    ['relationshipsAnalysisHarm', 'analysis-harm', "Select if Alex's personal relationships and community are linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['relationshipsAnalysisReoffending', 'analysis-reoffending', "Select if Alex's personal relationships and community are linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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

const applyParenting = (show) => {
  const block = document.querySelector('[data-pc-question="parenting"]')
  if (block) {
    block.hidden = !show
    block.classList.toggle('san-is-hidden', !show)
  }
  const visible = []
  document.querySelectorAll('[data-pc-question]').forEach((question) => {
    question.classList.remove('san-question')
    const hidden = question.hidden || question.classList.contains('san-is-hidden')
    if (!hidden) visible.push(question)
  })
  visible.slice(1).forEach((question) => question.classList.add('san-question'))
}

const restoreQuestions = (session) => {
  selectRadio('relationships_status', session.relationshipsStatus)
  if (session.relationshipsStatus) setField(`status-${session.relationshipsStatus}-details`, session.relationshipsStatusDetails)
  selectRadio('relationships_history', session.relationshipsHistory)
  if (session.relationshipsHistory) setField(`history-${session.relationshipsHistory}-details`, session.relationshipsHistoryDetails)
  setField('relationships-resolve', session.relationshipsResolve)
  selectRadio('relationships_parenting', session.relationshipsParenting)
  if (session.relationshipsParenting) setField(`parenting-${session.relationshipsParenting}-details`, session.relationshipsParentingDetails)
  selectRadio('relationships_family', session.relationshipsFamily)
  if (session.relationshipsFamily) setField(`family-${session.relationshipsFamily}-details`, session.relationshipsFamilyDetails)
  selectRadio('relationships_childhood', session.relationshipsChildhood)
  if (session.relationshipsChildhood) setField(`childhood-${session.relationshipsChildhood}-details`, session.relationshipsChildhoodDetails)
  selectRadio('relationships_behaviour', session.relationshipsBehaviour)
  if (session.relationshipsBehaviour) setField(`behaviour-${session.relationshipsBehaviour}-details`, session.relationshipsBehaviourDetails)
  setField('relationships-belonging', session.relationshipsBelonging)
  selectRadio('relationships_changes', session.relationshipsChanges)
  if (session.relationshipsChanges) setField(`changes-${session.relationshipsChanges}-details`, session.relationshipsChangesDetails)
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.relationshipsAnalysisStrengths)
  if (session.relationshipsAnalysisStrengths) setField(`analysis-strengths-${session.relationshipsAnalysisStrengths}-details`, session.relationshipsAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.relationshipsAnalysisHarm)
  if (session.relationshipsAnalysisHarm) setField(`analysis-harm-${session.relationshipsAnalysisHarm}-details`, session.relationshipsAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.relationshipsAnalysisReoffending)
  if (session.relationshipsAnalysisReoffending) setField(`analysis-reoffending-${session.relationshipsAnalysisReoffending}-details`, session.relationshipsAnalysisReoffendingDetails)
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

const initSanRelationships = () => {
  const page = document.querySelector('[data-pc-page]')
  if (!page) return

  const session = getSanSession()
  applyProgress(session)
  if (fromSummary()) ensureBackLink('personal-relationships-summary.html')

  const pageName = page.getAttribute('data-pc-page')

  if (pageName === 'children') {
    selectChecks('relationships_children', session.relationshipsChildren)
    const details = session.relationshipsChildrenDetails || {}
    CHILD_YES.forEach((id) => setField(`children-${id}-details`, details[id]))
  }

  if (pageName === 'people') {
    if (!hasAnswers(session.relationshipsChildren)) {
      window.location.assign('personal-relationships-children.html')
      return
    }
    selectChecks('relationships_people', session.relationshipsPeople)
    const details = session.relationshipsPeopleDetails || {}
    PEOPLE_IDS.forEach((id) => setField(`people-${id}-details`, details[id]))
  }

  if (pageName === 'questions') {
    if (!hasAnswers(session.relationshipsChildren) || !hasAnswers(session.relationshipsPeople)) {
      window.location.assign(nextIncompleteHref(session))
      return
    }
    applyParenting(hasChildren(session.relationshipsChildren))
    restoreQuestions(session)
  }

  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-san-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-san-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-pc-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-pc-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  document.getElementById('san-relationships-children-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readChildren()
    if (!answers.relationshipsChildren.length) {
      showErrors([{
        group: 'relationships-children',
        href: '#relationships-children',
        text: "Select if there are any children in Alex's life"
      }])
      return
    }
    clearErrors()
    const previous = getSanSession()
    const updates = { ...answers, relationshipsComplete: false }
    if (hasChildren(previous.relationshipsChildren) !== hasChildren(answers.relationshipsChildren)) {
      updates.relationshipsParenting = ''
      updates.relationshipsParentingDetails = ''
    }
    setSanSession(updates)
    const sameRoute = hasChildren(previous.relationshipsChildren) === hasChildren(answers.relationshipsChildren)
    const peopleAnswered = hasAnswers(previous.relationshipsPeople)
    let next = 'personal-relationships-people.html'
    if (fromSummary() && sameRoute) next = 'personal-relationships-summary.html'
    else if (fromSummary() && peopleAnswered) next = 'personal-relationships-questions.html'
    window.location.assign(next)
  })

  document.getElementById('san-relationships-people-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readPeople()
    const errors = []
    if (!answers.relationshipsPeople.length) {
      errors.push({
        group: 'relationships-people',
        href: '#relationships-people',
        text: "Select who the important people in Alex's life are"
      })
    } else if (answers.relationshipsPeople.includes('other') && !answers.relationshipsPeopleDetails.other) {
      errors.push({
        group: 'relationships-people',
        href: '#people-other-details',
        text: 'Enter details'
      })
    }
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : 'personal-relationships-questions.html')
  })

  document.getElementById('san-relationships-questions-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const showParenting = hasChildren(getSanSession().relationshipsChildren)
    const answers = readQuestions(showParenting)
    const errors = validateQuestions(answers, showParenting)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    window.location.assign('personal-relationships-summary.html')
  })

  document.getElementById('san-relationships-analysis-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readAnalysis()
    const errors = validateAnalysis(answers)
    if (errors.length) {
      showErrors(errors)
      openAnalysisTab()
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: true })
    window.location.assign('personal-relationships-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initSanRelationships()
})
