//
// Personal relationships and community section of the Strengths and needs prototype
//

import { getSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const CHILD_LABELS = {
  yes: 'Yes',
  no: 'No'
}

const CHILD_RELATIONSHIP_LABELS = {
  parent: 'Parent',
  'step-parent': 'Step-parent',
  sibling: 'Sibling',
  grandparent: 'Grandparent',
  'aunt-uncle': 'Aunt or uncle',
  'family-friend': 'Family friend'
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

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
  happy: 'Positive and supportive',
  concerns: 'Has some difficulties but remains supportive',
  unhappy: 'Difficult or unhealthy'
}

const HISTORY_LABELS = {
  stable: 'Stable, supportive, positive and rewarding relationships',
  mixed: 'Both healthy and unhealthy relationships',
  unstable: 'Unstable, unsupportive and destructive relationships',
  capable: 'No history of relationships, but they appear capable of starting and maintaining a healthy one',
  concerns: 'No history of relationships and there are concerns about their ability to start or maintain healthy relationships'
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
  stable: 'Generally stable and supportive',
  'some-challenges': 'Some challenges or instability',
  significant: 'Significant challenges or instability',
  unknown: 'Unknown'
}

const BEHAVIOUR_LABELS = { yes: 'Yes', no: 'No' }

const ABUSE_WHO_IDS = ['family', 'partner']

const ABUSE_WHO_LABELS = {
  family: 'Family member',
  partner: 'Intimate partner'
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
  if (!(field instanceof HTMLTextAreaElement) && !(field instanceof HTMLInputElement)) return ''
  if (isInHiddenConditional(field)) return ''
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
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) field.value = value || ''
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
  sectionLink('offence', !!session.offenceComplete, !!session.offenceDescription, 'offence-analysis-summary.html')
}

const hasChildren = (children) => (children || []).includes('yes')

const hasAnswers = (values) => Array.isArray(values) && values.length > 0

const childrenList = (session) => Array.isArray(session.relationshipsChildrenList) ? session.relationshipsChildrenList : []

const childrenDetailsComplete = (session) => !hasChildren(session.relationshipsChildren) || childrenList(session).length > 0

const childrenFlowComplete = (session) => hasAnswers(session.relationshipsChildren) && childrenDetailsComplete(session)

const formatChildDob = (child) => {
  const day = Number(child.dobDay)
  const monthIndex = Number(child.dobMonth) - 1
  const month = MONTH_NAMES[monthIndex]
  if (!day || !month || !child.dobYear) return [child.dobDay, child.dobMonth, child.dobYear].filter(Boolean).join(' ')
  return `${day} ${month} ${child.dobYear}`
}

const childPageParams = () => {
  const fromSearch = new URLSearchParams(window.location.search)
  if ([...fromSearch.keys()].length) return fromSearch
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  return new URLSearchParams(hash)
}

const childIndexFromQuery = () => {
  const raw = childPageParams().get('child')
  if (raw === null || raw === '') return -1
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 ? value : -1
}

const focusChildField = (id) => {
  const target = document.getElementById(id)
  if (!(target instanceof HTMLElement)) return
  const field = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    ? target
    : target.querySelector('input:checked, input, textarea')
  const focusTarget = field instanceof HTMLElement ? field : target
  focusTarget.scrollIntoView({ block: 'center' })
  if (typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true })
}

const questionsFormAnswered = (session) => {
  if (!childrenFlowComplete(session)) return false
  if (!session.relationshipsStatus || !session.relationshipsHistory) return false
  if (hasChildren(session.relationshipsChildren) && !session.relationshipsParenting) return false
  if (!session.relationshipsFamily || !session.relationshipsChildhood || !session.relationshipsBehaviour || !session.relationshipsBelonging) return false
  return true
}

const needsAbuseWho = (session) => session.relationshipsBehaviour === 'yes'

const abuseWhoComplete = (session) => (
  !needsAbuseWho(session) || (Array.isArray(session.relationshipsAbuseWho) && session.relationshipsAbuseWho.length > 0)
)

const victimAnswered = (session) => !!session.relationshipsVictim

const needsVictimWho = (session) => session.relationshipsVictim === 'yes'

const needsCoercive = () => true

const coerciveComplete = (session) => !!session.relationshipsCoercive

const needsStrangulation = () => true

const strangulationComplete = (session) => !!session.relationshipsStrangulation

const victimWhoComplete = (session) => (
  !needsVictimWho(session) || (Array.isArray(session.relationshipsVictimWho) && session.relationshipsVictimWho.length > 0)
)

const perpetratorFollowUpComplete = (session) => (
  abuseWhoComplete(session) && coerciveComplete(session) && strangulationComplete(session)
)

const victimFlowComplete = (session) => victimAnswered(session) && victimWhoComplete(session)

const questionsAnswered = (session) => (
  questionsFormAnswered(session) && perpetratorFollowUpComplete(session) && victimFlowComplete(session) && !!session.relationshipsChanges
)

const coerciveBackHref = (session) => (
  needsAbuseWho(session) ? 'personal-relationships-abuse.html' : 'personal-relationships-questions.html'
)

const victimBackHref = () => 'personal-relationships-strangulation.html'

const changesBackHref = (session) => {
  if (needsVictimWho(session)) return 'personal-relationships-victim-who.html'
  if (victimAnswered(session)) return 'personal-relationships-victim.html'
  if (needsStrangulation()) return 'personal-relationships-strangulation.html'
  if (needsCoercive()) return 'personal-relationships-coercive.html'
  if (needsAbuseWho(session)) return 'personal-relationships-abuse.html'
  return 'personal-relationships-questions.html'
}

const questionsBackHref = (session) => (
  hasChildren(session.relationshipsChildren) && childrenList(session).length
    ? 'personal-relationships-children-list.html'
    : 'personal-relationships-children.html'
)

const nextIncompleteHref = (session) => {
  if (!hasAnswers(session.relationshipsChildren)) return 'personal-relationships-children.html'
  if (hasChildren(session.relationshipsChildren) && !childrenList(session).length) return 'personal-relationships-child-details.html'
  if (!questionsFormAnswered(session)) return 'personal-relationships-questions.html'
  if (!abuseWhoComplete(session)) return 'personal-relationships-abuse.html'
  if (!coerciveComplete(session)) return 'personal-relationships-coercive.html'
  if (!strangulationComplete(session)) return 'personal-relationships-strangulation.html'
  if (!victimAnswered(session)) return 'personal-relationships-victim.html'
  if (!victimWhoComplete(session)) return 'personal-relationships-victim-who.html'
  if (!session.relationshipsChanges) return 'personal-relationships-changes.html'
  return 'personal-relationships-questions.html'
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

const childrenQuestionRow = (session) => {
  if (!Array.isArray(session.relationshipsChildren) || !session.relationshipsChildren.length) return ''
  return summaryRow(
    "Are there any children in Alex's life?",
    [{ text: labelled(CHILD_LABELS, session.relationshipsChildren[0]) }],
    summaryChangeHref('personal-relationships-children')
  )
}

const relationshipRows = (session) => {
  const rows = []

  if (session.relationshipsStatus) {
    rows.push(summaryRow(
      "How would you describe Alex's current relationship situation?",
      answerLines(labelled(STATUS_LABELS, session.relationshipsStatus), session.relationshipsStatusDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-status')
    ))
  }

  if (session.relationshipsHistory) {
    rows.push(summaryRow(
      "How would you describe Alex's history of intimate relationships?",
      answerLines(labelled(HISTORY_LABELS, session.relationshipsHistory), session.relationshipsHistoryDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-history')
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
      'Is there evidence that Alex has ever been a perpetrator of domestic abuse?',
      answerLines(labelled(BEHAVIOUR_LABELS, session.relationshipsBehaviour)),
      summaryChangeHref('personal-relationships-questions', 'relationships-behaviour')
    ))
  }

  if (needsAbuseWho(session) && Array.isArray(session.relationshipsAbuseWho) && session.relationshipsAbuseWho.length) {
    const details = session.relationshipsAbuseWhoDetails || {}
    const lines = session.relationshipsAbuseWho.flatMap((id) => answerLines(labelled(ABUSE_WHO_LABELS, id), details[id]))
    rows.push(summaryRow(
      'Who did Alex abuse?',
      lines,
      summaryChangeHref('personal-relationships-abuse')
    ))
  }

  if (session.relationshipsCoercive) {
    rows.push(summaryRow(
      'Is there evidence that Alex has used controlling or coercive behaviour?',
      answerLines(labelled(YES_NO, session.relationshipsCoercive), session.relationshipsCoerciveDetails),
      summaryChangeHref('personal-relationships-coercive')
    ))
  }

  if (session.relationshipsStrangulation) {
    rows.push(summaryRow(
      'Is there evidence that Alex has used strangulation or suffocation?',
      answerLines(labelled(YES_NO, session.relationshipsStrangulation), session.relationshipsStrangulationDetails),
      summaryChangeHref('personal-relationships-strangulation')
    ))
  }

  if (session.relationshipsVictim) {
    rows.push(summaryRow(
      'Is there evidence that Alex has ever been a victim of domestic abuse?',
      answerLines(labelled(YES_NO, session.relationshipsVictim)),
      summaryChangeHref('personal-relationships-victim')
    ))
  }

  if (needsVictimWho(session) && Array.isArray(session.relationshipsVictimWho) && session.relationshipsVictimWho.length) {
    const details = session.relationshipsVictimWhoDetails || {}
    const lines = session.relationshipsVictimWho.flatMap((id) => answerLines(labelled(ABUSE_WHO_LABELS, id), details[id]))
    rows.push(summaryRow(
      'Who was Alex abused by?',
      lines,
      summaryChangeHref('personal-relationships-victim-who')
    ))
  }

  if (session.relationshipsBelonging) {
    rows.push(summaryRow(
      'Are there any people, groups or communities that give Alex a sense of belonging?',
      answerLines(labelled(YES_NO, session.relationshipsBelonging), session.relationshipsBelongingDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-belonging')
    ))
  }

  if (session.relationshipsChanges) {
    rows.push(summaryRow(
      'Does Alex want to make changes to their personal relationships?',
      answerLines(labelled(CHANGES_LABELS, session.relationshipsChanges), session.relationshipsChangesDetails),
      summaryChangeHref('personal-relationships-changes')
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
  const childrenRow = childrenQuestionRow(session)
  const rows = relationshipRows(session)
  const cards = childrenCardsHtml(session)
  const goButton = document.querySelector('[data-san-go-analysis]')

  if (!childrenRow && !rows.length && !cards) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="personal-relationships-children.html">Answer personal relationships and community questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && !questionsAnswered(session)) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${nextIncompleteHref(session)}">Continue</a></p>`
    }
    const asList = (items) => items.length ? `<dl class="govuk-summary-list san-summary-list">${items.join('')}</dl>` : ''
    mount.innerHTML = `${asList(childrenRow ? [childrenRow] : [])}${cards}${asList(rows)}${followOn}`
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
  relationshipsChildrenList: [],
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
  relationshipsAbuseWho: [],
  relationshipsAbuseWhoDetails: {},
  relationshipsVictim: '',
  relationshipsCoercive: '',
  relationshipsCoerciveDetails: '',
  relationshipsStrangulation: '',
  relationshipsStrangulationDetails: '',
  relationshipsVictimWho: [],
  relationshipsVictimWhoDetails: {},
  relationshipsBelonging: '',
  relationshipsBelongingDetails: '',
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
  const value = checkedValue('relationships_children')
  return { relationshipsChildren: value ? [value] : [] }
}

const readChildDetails = () => ({
  name: fieldValue('child-name'),
  dobDay: fieldValue('child-dob-day'),
  dobMonth: fieldValue('child-dob-month'),
  dobYear: fieldValue('child-dob-year'),
  relationship: checkedValue('child_relationship'),
  livesWith: checkedValue('child_lives_with'),
  parentalResponsibility: checkedValue('child_parental_responsibility')
})

const validateChildDetails = (child) => {
  const errors = []
  if (!child.name) errors.push({ group: 'child-name', href: '#child-name', text: "Enter the child's name" })
  if (!child.dobDay || !child.dobMonth || !child.dobYear) {
    errors.push({ group: 'child-dob', href: '#child-dob', text: "Enter the child's date of birth" })
  }
  if (!child.relationship) {
    errors.push({ group: 'child-relationship', href: '#child-relationship', text: "Select Alex's relationship to this child" })
  }
  if (!child.livesWith) {
    errors.push({ group: 'child-lives-with', href: '#child-lives-with', text: 'Select if they live with Alex' })
  }
  if (!child.parentalResponsibility) {
    errors.push({
      group: 'child-parental-responsibility',
      href: '#child-parental-responsibility',
      text: 'Select if Alex has parental responsibility'
    })
  }
  return errors
}

const restoreChildDetails = (child) => {
  if (!child) return
  setField('child-name', child.name)
  setField('child-dob-day', child.dobDay)
  setField('child-dob-month', child.dobMonth)
  setField('child-dob-year', child.dobYear)
  selectRadio('child_relationship', child.relationship)
  selectRadio('child_lives_with', child.livesWith)
  selectRadio('child_parental_responsibility', child.parentalResponsibility)
}

const childDetailsHref = (index, focus = '') => {
  const params = new URLSearchParams()
  if (Number.isInteger(index) && index >= 0) params.set('child', String(index))
  if (fromSummary() || document.querySelector('[data-san-summary]')) params.set('from', 'summary')
  if (focus) params.set('focus', focus)
  const query = params.toString()
  return query ? `personal-relationships-child-details.html#${query}` : 'personal-relationships-child-details.html'
}

const childCardRows = (child, index) => {
  const name = child.name || `Child ${index + 1}`
  const rows = [
    ['Name', child.name, 'child-name'],
    ['Date of birth', formatChildDob(child), 'child-dob'],
    ['Relationship', labelled(CHILD_RELATIONSHIP_LABELS, child.relationship), 'child-relationship'],
    ['Do they live with Alex?', labelled(YES_NO, child.livesWith), 'child-lives-with'],
    ['Does Alex have parental responsibility?', labelled(YES_NO, child.parentalResponsibility), 'child-parental-responsibility']
  ]
  return rows.map(([key, value, hash]) => `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(key)}</dt>
    <dd class="govuk-summary-list__value">${escapeHtml(value || 'Not provided')}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${childDetailsHref(index, hash)}">Change<span class="govuk-visually-hidden"> ${escapeHtml(key.toLowerCase())} for ${escapeHtml(name)}</span></a>
    </dd>
  </div>`).join('')
}

const childrenListHref = () => (
  fromSummary() ? 'personal-relationships-children-list.html?from=summary' : 'personal-relationships-children-list.html'
)

const childrenCardsHtml = (session) => {
  if (!hasChildren(session.relationshipsChildren)) return ''
  return childrenList(session).map((child, index) => {
    const title = `Child ${index + 1}`
    const name = child.name || title
    return `<div class="govuk-summary-card">
      <div class="govuk-summary-card__title-wrapper">
        <h2 class="govuk-summary-card__title">${escapeHtml(title)}</h2>
        <ul class="govuk-summary-card__actions">
          <li class="govuk-summary-card__action"><a class="govuk-link" href="#" data-pc-remove-child="${index}">Remove child details<span class="govuk-visually-hidden"> for ${escapeHtml(name)}</span></a></li>
        </ul>
      </div>
      <div class="govuk-summary-card__content">
        <dl class="govuk-summary-list">${childCardRows(child, index)}</dl>
      </div>
    </div>`
  }).join('')
}

const renderChildrenList = (session) => {
  const mount = document.querySelector('[data-pc-children-list]')
  if (!mount) return

  const list = childrenList(session)
  if (!list.length) {
    mount.innerHTML = `<p class="govuk-body">No children have been added yet.</p>
      <a class="govuk-button govuk-button--secondary" href="${childDetailsHref()}" data-module="govuk-button">Add a child</a>`
    return
  }

  mount.innerHTML = `${childrenCardsHtml(session)}
    <p class="govuk-body">
      <a class="govuk-button govuk-button--secondary" href="${childDetailsHref()}" data-module="govuk-button">Add another child</a>
    </p>
    <button type="button" class="govuk-button" data-module="govuk-button" data-pc-children-continue>Save and continue</button>`
}

const detailsFor = (prefix, value) => (value ? fieldValue(`${prefix}-${value}-details`) : '')

const readQuestions = (showParenting) => {
  const relationshipsStatus = checkedValue('relationships_status')
  const relationshipsHistory = checkedValue('relationships_history')
  const relationshipsParenting = showParenting ? checkedValue('relationships_parenting') : ''
  const relationshipsFamily = checkedValue('relationships_family')
  const relationshipsChildhood = checkedValue('relationships_childhood')
  const relationshipsBehaviour = checkedValue('relationships_behaviour')
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
    relationshipsBelonging: checkedValue('relationships_belonging'),
    relationshipsBelongingDetails: detailsFor('belonging', checkedValue('relationships_belonging'))
  }
}

const readAbuseWho = () => {
  const relationshipsAbuseWho = checkedValues('relationships_abuse')
  const relationshipsAbuseWhoDetails = {}
  ABUSE_WHO_IDS.forEach((id) => {
    if (relationshipsAbuseWho.includes(id)) relationshipsAbuseWhoDetails[id] = fieldValue(`abuse-${id}-details`)
  })
  return { relationshipsAbuseWho, relationshipsAbuseWhoDetails }
}

const readVictim = () => ({
  relationshipsVictim: checkedValue('relationships_victim')
})

const readCoercive = () => {
  const relationshipsCoercive = checkedValue('relationships_coercive')
  return {
    relationshipsCoercive,
    relationshipsCoerciveDetails: detailsFor('coercive', relationshipsCoercive)
  }
}

const readStrangulation = () => {
  const relationshipsStrangulation = checkedValue('relationships_strangulation')
  return {
    relationshipsStrangulation,
    relationshipsStrangulationDetails: detailsFor('strangulation', relationshipsStrangulation)
  }
}

const readVictimWho = () => {
  const relationshipsVictimWho = checkedValues('relationships_victim_who')
  const relationshipsVictimWhoDetails = {}
  ABUSE_WHO_IDS.forEach((id) => {
    if (relationshipsVictimWho.includes(id)) relationshipsVictimWhoDetails[id] = fieldValue(`victim-who-${id}-details`)
  })
  return { relationshipsVictimWho, relationshipsVictimWhoDetails }
}

const readChangesAnswers = () => {
  const relationshipsChanges = checkedValue('relationships_changes')
  return {
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
    errors.push({ group: 'relationships-status', href: '#relationships-status', text: "Select how you would describe Alex's current relationship situation" })
  }
  if (!answers.relationshipsHistory) {
    errors.push({ group: 'relationships-history', href: '#relationships-history', text: "Select how you would describe Alex's history of intimate relationships" })
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
    errors.push({ group: 'relationships-behaviour', href: '#relationships-behaviour', text: 'Select if there is evidence that Alex has ever been a perpetrator of domestic abuse' })
  }
  if (!answers.relationshipsBelonging) {
    errors.push({ group: 'relationships-belonging', href: '#relationships-belonging', text: 'Select if there are any people, groups or communities that give Alex a sense of belonging' })
  } else if (answers.relationshipsBelonging === 'yes' && !answers.relationshipsBelongingDetails) {
    errors.push({ group: 'relationships-belonging', href: '#belonging-yes-details', text: 'Enter details about the people, groups or communities that give Alex a sense of belonging' })
  }
  return errors
}

const validateChanges = (answers) => {
  if (answers.relationshipsChanges) return []
  return [{ group: 'relationships-changes', href: '#relationships-changes', text: 'Select if Alex wants to make changes to their personal relationships' }]
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
  selectRadio('relationships_belonging', session.relationshipsBelonging)
  if (session.relationshipsBelonging) setField(`belonging-${session.relationshipsBelonging}-details`, session.relationshipsBelongingDetails)
}

const restoreAbuseWho = (session) => {
  selectChecks('relationships_abuse', session.relationshipsAbuseWho)
  const details = session.relationshipsAbuseWhoDetails || {}
  ABUSE_WHO_IDS.forEach((id) => setField(`abuse-${id}-details`, details[id]))
}

const validateAbuseWho = (answers) => {
  const errors = []
  if (!answers.relationshipsAbuseWho.length) {
    errors.push({
      group: 'relationships-abuse',
      href: '#relationships-abuse',
      text: 'Select who Alex abused'
    })
    return errors
  }
  ABUSE_WHO_IDS.forEach((id) => {
    if (answers.relationshipsAbuseWho.includes(id) && !answers.relationshipsAbuseWhoDetails[id]) {
      errors.push({
        group: 'relationships-abuse',
        href: `#abuse-${id}-details`,
        text: `Enter details about the ${ABUSE_WHO_LABELS[id].toLowerCase()}`
      })
    }
  })
  return errors
}

const restoreVictim = (session) => {
  selectRadio('relationships_victim', session.relationshipsVictim)
}

const restoreCoercive = (session) => {
  selectRadio('relationships_coercive', session.relationshipsCoercive)
  if (session.relationshipsCoercive) setField(`coercive-${session.relationshipsCoercive}-details`, session.relationshipsCoerciveDetails)
}

const restoreStrangulation = (session) => {
  selectRadio('relationships_strangulation', session.relationshipsStrangulation)
  if (session.relationshipsStrangulation) setField(`strangulation-${session.relationshipsStrangulation}-details`, session.relationshipsStrangulationDetails)
}

const restoreVictimWho = (session) => {
  selectChecks('relationships_victim_who', session.relationshipsVictimWho)
  const details = session.relationshipsVictimWhoDetails || {}
  ABUSE_WHO_IDS.forEach((id) => setField(`victim-who-${id}-details`, details[id]))
}

const validateVictim = (answers) => {
  if (answers.relationshipsVictim) return []
  return [{
    group: 'relationships-victim',
    href: '#relationships-victim',
    text: 'Select if there is evidence that Alex has ever been a victim of domestic abuse'
  }]
}

const validateCoercive = (answers) => {
  if (!answers.relationshipsCoercive) {
    return [{
      group: 'relationships-coercive',
      href: '#relationships-coercive',
      text: 'Select if there is evidence that Alex has used controlling or coercive behaviour'
    }]
  }
  if (answers.relationshipsCoercive === 'yes' && !answers.relationshipsCoerciveDetails) {
    return [{
      group: 'relationships-coercive',
      href: '#coercive-yes-details',
      text: 'Enter details about the controlling or coercive behaviour'
    }]
  }
  return []
}

const validateStrangulation = (answers) => {
  if (!answers.relationshipsStrangulation) {
    return [{
      group: 'relationships-strangulation',
      href: '#relationships-strangulation',
      text: 'Select if there is evidence that Alex has used strangulation or suffocation'
    }]
  }
  if (answers.relationshipsStrangulation === 'yes' && !answers.relationshipsStrangulationDetails) {
    return [{
      group: 'relationships-strangulation',
      href: '#strangulation-yes-details',
      text: 'Enter details about the strangulation or suffocation'
    }]
  }
  return []
}

const validateVictimWho = (answers) => {
  const errors = []
  if (!answers.relationshipsVictimWho.length) {
    errors.push({
      group: 'relationships-victim-who',
      href: '#relationships-victim-who',
      text: 'Select who Alex was abused by'
    })
    return errors
  }
  ABUSE_WHO_IDS.forEach((id) => {
    if (answers.relationshipsVictimWho.includes(id) && !answers.relationshipsVictimWhoDetails[id]) {
      errors.push({
        group: 'relationships-victim-who',
        href: `#victim-who-${id}-details`,
        text: `Enter details about the ${ABUSE_WHO_LABELS[id].toLowerCase()}`
      })
    }
  })
  return errors
}

const restoreChanges = (session) => {
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

const fromSummary = () => childPageParams().get('from') === 'summary'

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
    selectRadio('relationships_children', session.relationshipsChildren?.[0])
  }

  if (pageName === 'child-details') {
    if (!hasChildren(session.relationshipsChildren)) {
      window.location.assign('personal-relationships-children.html')
      return
    }
    const index = childIndexFromQuery()
    const list = childrenList(session)
    if (index >= 0) restoreChildDetails(list[index])
    if (!fromSummary()) {
      ensureBackLink(list.length ? 'personal-relationships-children-list.html' : 'personal-relationships-children.html')
    }
    const focusId = childPageParams().get('focus')
    if (focusId) window.setTimeout(() => focusChildField(focusId), 50)
  }

  if (pageName === 'children-list') {
    if (!hasChildren(session.relationshipsChildren)) {
      window.location.assign('personal-relationships-children.html')
      return
    }
    if (!childrenList(session).length) {
      window.location.assign('personal-relationships-child-details.html')
      return
    }
    renderChildrenList(session)
  }

  if (pageName === 'people') {
    window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
    return
  }

  if (pageName === 'questions') {
    if (!childrenFlowComplete(session)) {
      window.location.assign(nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(questionsBackHref(session))
    applyParenting(hasChildren(session.relationshipsChildren))
    restoreQuestions(session)
  }

  if (pageName === 'abuse') {
    if (!questionsFormAnswered(session) || !needsAbuseWho(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink('personal-relationships-questions.html')
    restoreAbuseWho(session)
  }

  if (pageName === 'victim') {
    if (!questionsFormAnswered(session) || !perpetratorFollowUpComplete(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(victimBackHref())
    restoreVictim(session)
  }

  if (pageName === 'victim-who') {
    if (!questionsFormAnswered(session) || !perpetratorFollowUpComplete(session) || !needsVictimWho(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink('personal-relationships-victim.html')
    restoreVictimWho(session)
  }

  if (pageName === 'coercive') {
    if (!questionsFormAnswered(session) || !abuseWhoComplete(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(coerciveBackHref(session))
    restoreCoercive(session)
  }

  if (pageName === 'strangulation') {
    if (!questionsFormAnswered(session) || !abuseWhoComplete(session) || !coerciveComplete(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink('personal-relationships-coercive.html')
    restoreStrangulation(session)
  }

  if (pageName === 'changes') {
    if (!childrenFlowComplete(session)) {
      window.location.assign(nextIncompleteHref(session))
      return
    }
    if (!questionsFormAnswered(session)) {
      window.location.assign('personal-relationships-questions.html')
      return
    }
    if (!perpetratorFollowUpComplete(session) || !victimFlowComplete(session)) {
      window.location.assign(nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(changesBackHref(session))
    restoreChanges(session)
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
    if (!hasChildren(answers.relationshipsChildren)) updates.relationshipsChildrenList = []
    setSanSession(updates)
    const sameRoute = hasChildren(previous.relationshipsChildren) === hasChildren(answers.relationshipsChildren)
    let next = 'personal-relationships-questions.html'
    if (hasChildren(answers.relationshipsChildren)) {
      next = childrenList({ ...previous, ...updates }).length
        ? 'personal-relationships-children-list.html'
        : 'personal-relationships-child-details.html'
      if (fromSummary() && sameRoute && childrenList({ ...previous, ...updates }).length) {
        next = 'personal-relationships-summary.html'
      }
    } else if (fromSummary() && sameRoute) {
      next = 'personal-relationships-summary.html'
    }
    window.location.assign(next)
  })

  document.getElementById('san-relationships-child-details-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const child = readChildDetails()
    const errors = validateChildDetails(child)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    const list = [...childrenList(previous)]
    const index = childIndexFromQuery()
    const saved = {
      id: index >= 0 && list[index]?.id ? list[index].id : String(Date.now()),
      ...child
    }
    if (index >= 0 && list[index]) list[index] = saved
    else list.push(saved)
    setSanSession({ relationshipsChildrenList: list, relationshipsComplete: false })
    window.location.assign(childrenListHref())
  })

  document.querySelector('[data-pc-children-list], [data-san-summary]')?.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-pc-remove-child]')
    if (remove) {
      event.preventDefault()
      const index = Number(remove.getAttribute('data-pc-remove-child'))
      const list = childrenList(getSanSession()).filter((_, childIndex) => childIndex !== index)
      setSanSession({ relationshipsChildrenList: list, relationshipsComplete: false })
      if (!list.length) {
        window.location.assign(document.querySelector('[data-san-summary]')
          ? 'personal-relationships-child-details.html?from=summary'
          : 'personal-relationships-child-details.html')
        return
      }
      if (document.querySelector('[data-pc-children-list]')) renderChildrenList(getSanSession())
      if (document.querySelector('[data-san-summary]')) renderSummary(getSanSession())
      return
    }
    const continueButton = event.target.closest('[data-pc-children-continue]')
    if (!continueButton) return
    event.preventDefault()
    if (!childrenList(getSanSession()).length) {
      showErrors([{
        group: 'relationships-children',
        href: '#main-content',
        text: "Add at least one child, or change your answer to say there are no children in Alex's life"
      }])
      return
    }
    clearErrors()
    window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : 'personal-relationships-questions.html')
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
    const updates = { ...answers, relationshipsComplete: false }
    if (answers.relationshipsBehaviour !== 'yes') {
      updates.relationshipsAbuseWho = []
      updates.relationshipsAbuseWhoDetails = {}
    }
    setSanSession(updates)
    const saved = getSanSession()
    let next = needsAbuseWho(saved) ? 'personal-relationships-abuse.html' : 'personal-relationships-coercive.html'
    if (fromSummary() && saved.relationshipsChanges && perpetratorFollowUpComplete(saved) && victimFlowComplete(saved)) {
      next = 'personal-relationships-summary.html'
    }
    window.location.assign(next)
  })

  document.getElementById('san-relationships-abuse-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readAbuseWho()
    const errors = validateAbuseWho(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    const saved = getSanSession()
    window.location.assign(fromSummary() && saved.relationshipsChanges && perpetratorFollowUpComplete(saved) && victimFlowComplete(saved)
      ? 'personal-relationships-summary.html'
      : 'personal-relationships-coercive.html')
  })

  document.getElementById('san-relationships-victim-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const answers = readVictim()
    const errors = validateVictim(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const updates = { ...answers, relationshipsComplete: false }
    if (answers.relationshipsVictim !== 'yes') {
      updates.relationshipsVictimWho = []
      updates.relationshipsVictimWhoDetails = {}
    }
    setSanSession(updates)
    const saved = getSanSession()
    let next = needsVictimWho(saved) ? 'personal-relationships-victim-who.html' : 'personal-relationships-changes.html'
    if (fromSummary() && saved.relationshipsChanges && victimFlowComplete(saved)) {
      next = 'personal-relationships-summary.html'
    }
    window.location.assign(next)
  })

  document.getElementById('san-relationships-coercive-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readCoercive()
    const errors = validateCoercive(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    const saved = getSanSession()
    window.location.assign(fromSummary() && saved.relationshipsChanges && strangulationComplete(saved) && victimFlowComplete(saved)
      ? 'personal-relationships-summary.html'
      : 'personal-relationships-strangulation.html')
  })

  document.getElementById('san-relationships-strangulation-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readStrangulation()
    const errors = validateStrangulation(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    const saved = getSanSession()
    window.location.assign(fromSummary() && saved.relationshipsChanges && victimFlowComplete(saved)
      ? 'personal-relationships-summary.html'
      : 'personal-relationships-victim.html')
  })

  document.getElementById('san-relationships-victim-who-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readVictimWho()
    const errors = validateVictimWho(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    const saved = getSanSession()
    window.location.assign(fromSummary() && saved.relationshipsChanges
      ? 'personal-relationships-summary.html'
      : 'personal-relationships-changes.html')
  })

  document.getElementById('san-relationships-changes-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readChangesAnswers()
    const errors = validateChanges(answers)
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
  if (!window.location.pathname.startsWith("/san-research/")) return
  initSanRelationships()
})
