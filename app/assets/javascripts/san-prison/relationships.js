//
// Personal relationships and community — Prototype 1 (Community) Strengths and needs.
//
// Pages: personal-relationships-children.html → child details / list
// → personal-relationships-people.html → questions / current relationship
// → domestic abuse branch (perpetrator / victim / who / strangulation)
// → personal-relationships-changes.html → summary.
//

import { getSanSession, isSanPrisonJourney, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, showErrors, focusTargetField, labelled, scrollToHash, CHANGES_LABELS, YES_NO, YES_NO_UNKNOWN, revealSoon, checkedValue, checkedValues, fieldValue, selectRadio, selectChecks, setField, setHidden, summaryChangeHref } from './form.js'
import { applySanProgress } from './progress.js'

// Display labels for children, people and domestic abuse answers.
const CHILD_LABELS = {
  yes: 'Yes',
  no: 'No'
}

const CHILD_RELATIONSHIP_LABELS = {
  parent: 'Parent or step-parent',
  carer: 'Carer',
  grandparent: 'Grandparent',
  sibling: 'Sibling',
  'other-family': 'Other family member',
  friend: 'Friend',
  other: 'Other'
}

const CHILD_SEX_LABELS = {
  male: 'Male',
  female: 'Female',
  intersex: 'Intersex',
  unknown: 'Unknown'
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

const PARTNER_LABELS = {
  together: 'Yes, living together',
  apart: 'Yes, not living together',
  none: 'No'
}

const inRelationship = (partner) => partner === 'together' || partner === 'apart'

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

// Side nav ticks and resume links for every SAN section.
const applyProgress = (session) => applySanProgress(session, { current: 'relationships' })

// Completeness for children cards, people, questions and the abuse branch.
const hasChildren = (children) => (children || []).includes('yes')

const hasAnswers = (values) => Array.isArray(values) && values.length > 0

const childrenList = (session) => Array.isArray(session.relationshipsChildrenList) ? session.relationshipsChildrenList : []

const childrenDetailsComplete = (session) => !hasChildren(session.relationshipsChildren) || childrenList(session).length > 0

const childrenFlowComplete = (session) => hasAnswers(session.relationshipsChildren) && childrenDetailsComplete(session)

const formatChildDob = (child) => {
  const day = Number(child.dobDay)
  const monthIndex = Number(child.dobMonth) - 1
  const month = MONTH_NAMES[monthIndex]
  if (day && month && child.dobYear) return `${day} ${month} ${child.dobYear}`
  if (child.age) return child.age
  return [child.dobDay, child.dobMonth, child.dobYear].filter(Boolean).join(' ')
}

const formatChildAddress = (child) => {
  return [child.address1, child.address2, child.town, child.county, child.postcode].filter(Boolean).join(', ')
}

const childRelationshipText = (child) => {
  const relationship = labelled(CHILD_RELATIONSHIP_LABELS, child.relationship)
  if (child.relationship === 'other' && child.relationshipDetails) {
    return `${relationship}: ${child.relationshipDetails}`
  }
  return relationship
}

const parentalResponsibilityText = (child) => {
  const answer = labelled(YES_NO_UNKNOWN, child.parentalResponsibility)
  if (child.parentalResponsibility === 'yes' && child.parentalResponsibilityDetails) {
    return `${answer}: ${child.parentalResponsibilityDetails}`
  }
  return answer
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

const fromSummary = () => childPageParams().get('from') === 'summary'

const focusChildField = (id) => {
  const target = document.getElementById(id)
  if (!(target instanceof HTMLElement)) return
  target.scrollIntoView({ block: 'center' })
  focusTargetField(target, { preventScroll: true })
}

const questionsCoreAnswered = (session) => {
  if (!childrenFlowComplete(session)) return false
  if (!session.relationshipsHistory || !session.relationshipsPartner) return false
  if (hasChildren(session.relationshipsChildren) && !session.relationshipsParenting) return false
  if (!session.relationshipsFamily || !session.relationshipsChildhood || !session.relationshipsChildhoodBehaviour || !session.relationshipsBelonging) return false
  return true
}

const relationshipDescriptionComplete = (session) => !!session.relationshipsStatus

const questionsFormAnswered = (session) => questionsCoreAnswered(session) && relationshipDescriptionComplete(session)

const needsAbuseWho = (session) => session.relationshipsBehaviour === 'yes'

const abuseWhoComplete = (session) => (
  !needsAbuseWho(session) || (Array.isArray(session.relationshipsAbuseWho) && session.relationshipsAbuseWho.length > 0)
)

const victimAnswered = (session) => !!session.relationshipsVictim

const needsVictimWho = (session) => session.relationshipsVictim === 'yes'

const needsCoercive = (session) => session.relationshipsBehaviour === 'yes'

const coerciveComplete = (session) => !needsCoercive(session) || !!session.relationshipsCoercive

const needsStrangulation = (session) => (
  Array.isArray(session.relationshipsAbuseWho) && session.relationshipsAbuseWho.includes('partner')
)

const strangulationComplete = (session) => !needsStrangulation(session) || !!session.relationshipsStrangulation

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

const perpetratorHref = 'personal-relationships-perpetrator.html'
const domesticAbuseHref = 'personal-relationships-domestic-abuse.html'
const strangulationHref = 'personal-relationships-strangulation.html'
const victimHref = 'personal-relationships-victim.html'
const victimWhoHref = 'personal-relationships-victim-who.html'
const currentRelationshipHref = 'personal-relationships-current.html'

const withFromSummary = (href) => (fromSummary() ? `${href.split('?')[0]}?from=summary` : href)

const clearedStrangulation = () => ({
  relationshipsStrangulation: '',
  relationshipsStrangulationDetails: ''
})

const changesBackHref = (session) => (needsVictimWho(session) ? victimWhoHref : victimHref)

const victimBackHref = (session) => {
  if (session.relationshipsBehaviour !== 'yes') return perpetratorHref
  return needsStrangulation(session) ? strangulationHref : domesticAbuseHref
}

const nextAfterDomesticAbuse = (session) => {
  if (needsStrangulation(session) && !strangulationComplete(session)) return withFromSummary(strangulationHref)
  if (fromSummary() && strangulationComplete(session) && victimFlowComplete(session) && session.relationshipsChanges) {
    return 'personal-relationships-summary.html'
  }
  if (needsStrangulation(session)) return withFromSummary(strangulationHref)
  return withFromSummary(victimHref)
}

const questionsBackHref = (session) => (
  hasChildren(session.relationshipsChildren) && childrenList(session).length
    ? 'personal-relationships-children-list.html'
    : 'personal-relationships-children.html'
)

const nextIncompleteHref = (session) => {
  if (!hasAnswers(session.relationshipsChildren)) return 'personal-relationships-children.html'
  if (hasChildren(session.relationshipsChildren) && !childrenList(session).length) return 'personal-relationships-child-details.html'
  if (!questionsCoreAnswered(session)) return 'personal-relationships-questions.html'
  if (!relationshipDescriptionComplete(session)) return 'personal-relationships-questions.html'
  if (!session.relationshipsBehaviour) return perpetratorHref
  if (!abuseWhoComplete(session) || !coerciveComplete(session)) return domesticAbuseHref
  if (!strangulationComplete(session)) return strangulationHref
  if (!victimAnswered(session)) return victimHref
  if (!victimWhoComplete(session)) return victimWhoHref
  if (!session.relationshipsChanges) return 'personal-relationships-changes.html'
  return 'personal-relationships-questions.html'
}


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
    summaryChangeHref('personal-relationships-children', 'relationships-children')
  )
}

const relationshipRows = (session) => {
  const rows = []

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

  if (session.relationshipsChildhoodBehaviour) {
    rows.push(summaryRow(
      'Is there evidence Alex had any childhood behavioural issues or challenges?',
      answerLines(labelled(YES_NO, session.relationshipsChildhoodBehaviour), session.relationshipsChildhoodBehaviourDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-childhood-behaviour')
    ))
  }

  if (session.relationshipsBelonging) {
    rows.push(summaryRow(
      'Are there any people, groups or communities that give Alex a sense of belonging?',
      answerLines(labelled(YES_NO, session.relationshipsBelonging), session.relationshipsBelongingDetails),
      summaryChangeHref('personal-relationships-questions', 'relationships-belonging')
    ))
  }

  if (session.relationshipsPartner) {
    rows.push(summaryRow(
      'Does Alex currently have a partner?',
      answerLines(labelled(PARTNER_LABELS, session.relationshipsPartner)),
      summaryChangeHref('personal-relationships-questions', 'relationships-partner')
    ))
  }

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

  if (session.relationshipsBehaviour) {
    rows.push(summaryRow(
      'Is there evidence that Alex has ever been a perpetrator of domestic abuse?',
      answerLines(labelled(BEHAVIOUR_LABELS, session.relationshipsBehaviour)),
      summaryChangeHref('personal-relationships-perpetrator', 'relationships-behaviour')
    ))
  }

  if (needsAbuseWho(session) && Array.isArray(session.relationshipsAbuseWho) && session.relationshipsAbuseWho.length) {
    const details = session.relationshipsAbuseWhoDetails || {}
    const lines = session.relationshipsAbuseWho.flatMap((id) => answerLines(labelled(ABUSE_WHO_LABELS, id), details[id]))
    rows.push(summaryRow(
      'Who did Alex commit domestic abuse against?',
      lines,
      summaryChangeHref('personal-relationships-domestic-abuse', 'relationships-abuse')
    ))
  }

  if (needsCoercive(session) && session.relationshipsCoercive) {
    rows.push(summaryRow(
      'Is there evidence that Alex has used controlling or coercive behaviour?',
      answerLines(labelled(YES_NO, session.relationshipsCoercive), session.relationshipsCoerciveDetails),
      summaryChangeHref('personal-relationships-domestic-abuse', 'relationships-coercive')
    ))
  }

  if (needsStrangulation(session) && session.relationshipsStrangulation) {
    rows.push(summaryRow(
      'Is there evidence that Alex has used strangulation or suffocation?',
      answerLines(labelled(YES_NO, session.relationshipsStrangulation), session.relationshipsStrangulationDetails),
      summaryChangeHref('personal-relationships-strangulation', 'relationships-strangulation')
    ))
  }

  if (session.relationshipsVictim) {
    rows.push(summaryRow(
      'Is there evidence that Alex has ever been a victim of domestic abuse?',
      answerLines(labelled(YES_NO, session.relationshipsVictim)),
      summaryChangeHref('personal-relationships-victim', 'relationships-victim')
    ))
  }

  if (needsVictimWho(session) && Array.isArray(session.relationshipsVictimWho) && session.relationshipsVictimWho.length) {
    const details = session.relationshipsVictimWhoDetails || {}
    const lines = session.relationshipsVictimWho.flatMap((id) => answerLines(labelled(ABUSE_WHO_LABELS, id), details[id]))
    rows.push(summaryRow(
      'Who committed the abuse against Alex?',
      lines,
      summaryChangeHref('personal-relationships-victim-who', 'relationships-victim-who')
    ))
  }

  if (session.relationshipsChanges) {
    rows.push(summaryRow(
      'Does Alex want to make changes to their personal relationships?',
      answerLines(labelled(CHANGES_LABELS, session.relationshipsChanges), session.relationshipsChangesDetails),
      summaryChangeHref('personal-relationships-changes', 'relationships-changes')
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

// Check-your-answers for the questions tab and analysis tab.
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
  if (target instanceof HTMLElement) {
    target.scrollIntoView()
    focusTargetField(target, { preventScroll: true })
  }
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
  relationshipsChildhoodBehaviour: '',
  relationshipsChildhoodBehaviourDetails: '',
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
  relationshipsPartner: '',
  relationshipsChanges: '',
  relationshipsChangesDetails: ''
})

// Read and validate the current page.
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
  age: fieldValue('child-age'),
  sex: checkedValue('child_sex'),
  address1: fieldValue('child-address1'),
  address2: fieldValue('child-address2'),
  town: fieldValue('child-town'),
  county: fieldValue('child-county'),
  postcode: fieldValue('child-postcode'),
  livesWith: checkedValue('child_lives_with'),
  parentalResponsibility: checkedValue('child_parental_responsibility'),
  parentalResponsibilityDetails: checkedValue('child_parental_responsibility') === 'yes' ? fieldValue('child-parental-responsibility-details') : '',
  relationship: checkedValue('child_relationship'),
  relationshipDetails: checkedValue('child_relationship') === 'other' ? fieldValue('child-relationship-details') : '',
  contact: checkedValue('child_contact')
})

const validateChildDetails = (child) => {
  const errors = []
  if (!child.name) {
    errors.push({ group: 'child-name', href: '#child-name', text: "Enter the child's name, or enter 'Non-disclosable'" })
  }
  if (!child.relationship) {
    errors.push({
      group: 'child-relationship',
      href: '#child-relationship',
      text: "Select Alex's relationship or connection to this child"
    })
  }
  if (!child.livesWith) {
    errors.push({ group: 'child-lives-with', href: '#child-lives-with', text: 'Select yes if Alex lives with this child' })
  }
  if (!child.parentalResponsibility) {
    errors.push({ group: 'child-parental-responsibility', href: '#child-parental-responsibility', text: 'Select yes if Alex has any parental responsibility for this child' })
  } else if (child.parentalResponsibility === 'yes' && !child.parentalResponsibilityDetails) {
    errors.push({
      group: 'child-parental-responsibility-details',
      href: '#child-parental-responsibility-details',
      text: 'Give details of the parental responsibility'
    })
  }
  if (child.relationship === 'other' && !child.relationshipDetails) {
    errors.push({
      group: 'child-relationship-details',
      href: '#child-relationship-details',
      text: 'Give details of the relationship or connection'
    })
  }
  if (!child.contact) {
    errors.push({
      group: 'child-contact',
      href: '#child-contact',
      text: 'Select yes if they have contact or are seeking contact with this child'
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
  setField('child-age', child.age)
  selectRadio('child_sex', child.sex)
  setField('child-address1', child.address1)
  setField('child-address2', child.address2)
  setField('child-town', child.town)
  setField('child-county', child.county)
  setField('child-postcode', child.postcode)
  selectRadio('child_lives_with', child.livesWith)
  selectRadio('child_parental_responsibility', child.parentalResponsibility)
  setField('child-parental-responsibility-details', child.parentalResponsibilityDetails)
  selectRadio('child_relationship', child.relationship)
  setField('child-relationship-details', child.relationshipDetails)
  selectRadio('child_contact', child.contact)
}

const childDetailsHref = (index, focus = '') => {
  const params = new URLSearchParams()
  if (Number.isInteger(index) && index >= 0) params.set('child', String(index))
  if (fromSummary() || document.querySelector('[data-san-summary]')) params.set('from', 'summary')
  if (focus) params.set('focus', focus)
  const query = params.toString()
  return query ? `personal-relationships-child-details.html#${query}` : 'personal-relationships-child-details.html'
}

const childCardRows = (child, index, withActions = true) => {
  const name = child.name || `Child ${index + 1}`
  const rows = [
    ["Child's name", child.name, 'child-name'],
    ['Date of birth or age (optional)', formatChildDob(child), 'child-dob'],
    ['Sex (optional)', labelled(CHILD_SEX_LABELS, child.sex), 'child-sex-male'],
    ['Address if disclosable (optional)', formatChildAddress(child), 'child-address'],
    ["What is Alex's relationship or connection to this child?", childRelationshipText(child), 'child-relationship'],
    ['Does Alex live with this child?', labelled(YES_NO, child.livesWith), 'child-lives-with'],
    ['Does Alex have any parental responsibility for this child?', parentalResponsibilityText(child), 'child-parental-responsibility'],
    ['Does Alex have contact or is seeking contact with this child?', labelled(YES_NO, child.contact), 'child-contact']
  ]
  return rows.map(([key, value, hash]) => {
    const actions = withActions ? `<dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${childDetailsHref(index, hash)}">Change<span class="govuk-visually-hidden"> ${escapeHtml(key.toLowerCase())} for ${escapeHtml(name)}</span></a>
    </dd>` : ''
    return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(key)}</dt>
    <dd class="govuk-summary-list__value">${escapeHtml(value || 'Not provided')}</dd>
    ${actions}
  </div>`
  }).join('')
}

const childrenListHref = () => (
  fromSummary() ? 'personal-relationships-children-list.html?from=summary' : 'personal-relationships-children-list.html'
)

const childDeleteHref = (index) => {
  const params = new URLSearchParams()
  params.set('child', String(index))
  if (fromSummary() || document.querySelector('[data-san-summary]')) params.set('from', 'summary')
  return `personal-relationships-child-delete.html#${params.toString()}`
}

const cancelChildDeleteHref = () => (
  fromSummary() ? 'personal-relationships-summary.html' : 'personal-relationships-children-list.html'
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
          <li class="govuk-summary-card__action"><a class="govuk-link" href="${childDeleteHref(index)}">Remove child details<span class="govuk-visually-hidden"> for ${escapeHtml(name)}</span></a></li>
        </ul>
      </div>
      <div class="govuk-summary-card__content">
        <dl class="govuk-summary-list">${childCardRows(child, index)}</dl>
      </div>
    </div>`
  }).join('')
}

const childrenAddedHeading = (count) => (
  count === 1 ? 'You have added 1 child' : `You have added ${count} children`
)

const childrenNameListHtml = (session) => childrenList(session).map((child, index) => {
  const name = child.name || `Child ${index + 1}`
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(name)}</dt>
    <dd class="govuk-summary-list__actions">
      <ul class="govuk-summary-list__actions-list">
        <li class="govuk-summary-list__actions-list-item">
          <a class="govuk-link" href="${childDetailsHref(index)}">Change<span class="govuk-visually-hidden"> ${escapeHtml(name)}</span></a>
        </li>
        <li class="govuk-summary-list__actions-list-item">
          <a class="govuk-link" href="${childDeleteHref(index)}">Remove<span class="govuk-visually-hidden"> ${escapeHtml(name)}</span></a>
        </li>
      </ul>
    </dd>
  </div>`
}).join('')

const renderChildrenList = (session) => {
  const mount = document.querySelector('[data-pc-children-list]')
  if (!mount) return

  const list = childrenList(session)
  const heading = document.querySelector('[data-pc-children-heading]')
  if (!list.length) {
    if (heading) heading.textContent = "What are the children's details?"
    mount.innerHTML = `<p class="govuk-body">Add children's details to continue.</p>
      <a class="govuk-button govuk-button--secondary" href="${childDetailsHref()}" data-module="govuk-button">Add a child</a>`
    return
  }

  if (heading) heading.textContent = childrenAddedHeading(list.length)
  mount.innerHTML = `<dl class="govuk-summary-list san-add-to-list">${childrenNameListHtml(session)}</dl>
    <div class="govuk-form-group govuk-!-margin-top-8" data-san-error-group="add-another-child">
      <fieldset class="govuk-fieldset" id="add-another-child">
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
          <h2 class="govuk-fieldset__heading">Do you need to add another child?</h2>
        </legend>
        <div class="govuk-radios govuk-radios--inline" data-module="govuk-radios">
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="add-another-child-yes" name="add_another_child" type="radio" value="yes">
            <label class="govuk-label govuk-radios__label" for="add-another-child-yes">Yes</label>
          </div>
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="add-another-child-no" name="add_another_child" type="radio" value="no">
            <label class="govuk-label govuk-radios__label" for="add-another-child-no">No</label>
          </div>
        </div>
      </fieldset>
    </div>
    <button type="button" class="govuk-button" data-module="govuk-button" data-pc-children-continue>Save and continue</button>`
}

const detailsFor = (prefix, value) => (value ? fieldValue(`${prefix}-${value}-details`) : '')

const readQuestions = (showParenting) => {
  const relationshipsHistory = checkedValue('relationships_history')
  const relationshipsParenting = showParenting ? checkedValue('relationships_parenting') : ''
  const relationshipsFamily = checkedValue('relationships_family')
  const relationshipsChildhood = checkedValue('relationships_childhood')
  const relationshipsChildhoodBehaviour = checkedValue('relationships_childhood_behaviour')
  return {
    relationshipsHistory,
    relationshipsHistoryDetails: detailsFor('history', relationshipsHistory),
    relationshipsResolve: fieldValue('relationships-resolve'),
    relationshipsParenting,
    relationshipsParentingDetails: detailsFor('parenting', relationshipsParenting),
    relationshipsFamily,
    relationshipsFamilyDetails: detailsFor('family', relationshipsFamily),
    relationshipsChildhood,
    relationshipsChildhoodDetails: detailsFor('childhood', relationshipsChildhood),
    relationshipsChildhoodBehaviour,
    relationshipsChildhoodBehaviourDetails: detailsFor('childhood-behaviour', relationshipsChildhoodBehaviour),
    relationshipsBelonging: checkedValue('relationships_belonging'),
    relationshipsBelongingDetails: detailsFor('belonging', checkedValue('relationships_belonging')),
    relationshipsPartner: checkedValue('relationships_partner'),
    relationshipsStatus: checkedValue('relationships_status'),
    relationshipsStatusDetails: detailsFor('status', checkedValue('relationships_status'))
  }
}

const readCurrentRelationship = () => {
  const relationshipsStatus = checkedValue('relationships_status')
  return {
    relationshipsStatus,
    relationshipsStatusDetails: detailsFor('status', relationshipsStatus)
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
  if (showParenting && !answers.relationshipsParenting) {
    errors.push({ group: 'relationships-parenting', href: '#relationships-parenting', text: 'Select if Alex is able to manage their parenting responsibilities' })
  }
  if (!answers.relationshipsFamily) {
    errors.push({ group: 'relationships-family', href: '#relationships-family', text: "Select what Alex's current relationship with their family is like" })
  }
  if (!answers.relationshipsChildhood) {
    errors.push({ group: 'relationships-childhood', href: '#relationships-childhood', text: "Select Alex's experience of their childhood" })
  }
  if (!answers.relationshipsChildhoodBehaviour) {
    errors.push({ group: 'relationships-childhood-behaviour', href: '#relationships-childhood-behaviour', text: 'Select if there is evidence Alex had any childhood behavioural issues or challenges' })
  } else if (answers.relationshipsChildhoodBehaviour === 'yes' && !answers.relationshipsChildhoodBehaviourDetails) {
    errors.push({ group: 'relationships-childhood-behaviour', href: '#childhood-behaviour-yes-details', text: 'Enter details about the childhood behavioural issues or challenges' })
  }
  if (!answers.relationshipsBelonging) {
    errors.push({ group: 'relationships-belonging', href: '#relationships-belonging', text: 'Select if there are any people, groups or communities that give Alex a sense of belonging' })
  } else if (answers.relationshipsBelonging === 'yes' && !answers.relationshipsBelongingDetails) {
    errors.push({ group: 'relationships-belonging', href: '#belonging-yes-details', text: 'Enter details about the people, groups or communities that give Alex a sense of belonging' })
  }
  if (!answers.relationshipsPartner) {
    errors.push({ group: 'relationships-partner', href: '#relationships-partner', text: 'Select if Alex currently has a partner' })
  }
  if (!answers.relationshipsStatus) {
    errors.push({ group: 'relationships-status', href: '#relationships-status', text: "Select how you would describe Alex's current relationship situation" })
  }
  if (!answers.relationshipsHistory) {
    errors.push({ group: 'relationships-history', href: '#relationships-history', text: "Select how you would describe Alex's history of intimate relationships" })
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

const setQuestionHidden = (name, hidden) => {
  setHidden(document.querySelector(`[data-pc-question="${name}"]`), hidden)
}

const spaceVisibleQuestions = () => {
  const visible = []
  document.querySelectorAll('[data-pc-question]').forEach((question) => {
    question.classList.remove('san-question')
    const hidden = question.hidden || question.classList.contains('san-is-hidden')
    if (!hidden) visible.push(question)
  })
  visible.slice(1).forEach((question) => question.classList.add('san-question'))
}

const applyParenting = (show) => {
  setQuestionHidden('parenting', !show)
  spaceVisibleQuestions()
}

const applyDomesticAbuseQuestions = (session) => {
  setQuestionHidden('abuse', !needsAbuseWho(session))
  setQuestionHidden('coercive', !needsCoercive(session))
  spaceVisibleQuestions()
}

const restoreCurrentRelationship = (session) => {
  selectRadio('relationships_status', session.relationshipsStatus)
  if (session.relationshipsStatus) setField(`status-${session.relationshipsStatus}-details`, session.relationshipsStatusDetails)
}

const restoreQuestions = (session) => {
  selectRadio('relationships_history', session.relationshipsHistory)
  if (session.relationshipsHistory) setField(`history-${session.relationshipsHistory}-details`, session.relationshipsHistoryDetails)
  setField('relationships-resolve', session.relationshipsResolve)
  selectRadio('relationships_parenting', session.relationshipsParenting)
  if (session.relationshipsParenting) setField(`parenting-${session.relationshipsParenting}-details`, session.relationshipsParentingDetails)
  selectRadio('relationships_family', session.relationshipsFamily)
  if (session.relationshipsFamily) setField(`family-${session.relationshipsFamily}-details`, session.relationshipsFamilyDetails)
  selectRadio('relationships_childhood', session.relationshipsChildhood)
  if (session.relationshipsChildhood) setField(`childhood-${session.relationshipsChildhood}-details`, session.relationshipsChildhoodDetails)
  selectRadio('relationships_childhood_behaviour', session.relationshipsChildhoodBehaviour)
  if (session.relationshipsChildhoodBehaviour) setField(`childhood-behaviour-${session.relationshipsChildhoodBehaviour}-details`, session.relationshipsChildhoodBehaviourDetails)
  selectRadio('relationships_belonging', session.relationshipsBelonging)
  if (session.relationshipsBelonging) setField(`belonging-${session.relationshipsBelonging}-details`, session.relationshipsBelongingDetails)
  selectRadio('relationships_partner', session.relationshipsPartner)
  selectRadio('relationships_status', session.relationshipsStatus)
  if (session.relationshipsStatus) setField(`status-${session.relationshipsStatus}-details`, session.relationshipsStatusDetails)
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

// Wire up whichever relationships page is currently loaded.
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
    renderChildrenList(session)
  }

  if (pageName === 'child-delete') {
    if (!hasChildren(session.relationshipsChildren)) {
      window.location.assign('personal-relationships-children.html')
      return
    }
    const index = childIndexFromQuery()
    const child = childrenList(session)[index]
    if (!child) {
      window.location.assign(cancelChildDeleteHref())
      return
    }
    ensureBackLink(cancelChildDeleteHref())
    const childName = child.name || `Child ${index + 1}`
    const deleteHeading = document.querySelector('[data-pc-page="child-delete"] h1')
    if (deleteHeading) deleteHeading.textContent = `Confirm you want to delete ${childName}'s details`
    const confirmDelete = document.querySelector('[data-pc-child-delete-confirm]')
    if (confirmDelete) {
      confirmDelete.innerHTML = `Confirm<span class="govuk-visually-hidden"> you want to delete ${escapeHtml(childName)}'s details</span>`
    }
    document.querySelector('[data-pc-child-delete-update]')?.setAttribute('href', childDetailsHref(index))
    document.querySelector('[data-pc-child-delete-cancel]')?.setAttribute('href', cancelChildDeleteHref())
    const card = document.querySelector('[data-pc-child-delete-card]')
    if (card) {
      card.innerHTML = `<div class="govuk-summary-card">
        <div class="govuk-summary-card__title-wrapper">
          <h2 class="govuk-summary-card__title">${escapeHtml(`Child ${index + 1}`)}</h2>
        </div>
        <div class="govuk-summary-card__content">
          <dl class="govuk-summary-list">${childCardRows(child, index, false)}</dl>
        </div>
      </div>`
    }
    document.querySelector('[data-pc-child-delete-confirm]')?.addEventListener('click', () => {
      const latest = childrenList(getSanSession()).filter((_, childIndex) => childIndex !== index)
      setSanSession({ relationshipsChildrenList: latest, relationshipsComplete: false })
      window.location.assign(latest.length ? cancelChildDeleteHref() : 'personal-relationships-children-list.html')
    })
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

  if (pageName === 'perpetrator') {
    if (!questionsFormAnswered(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink('personal-relationships-questions.html')
    selectRadio('relationships_behaviour', session.relationshipsBehaviour)
  }

  if (pageName === 'current') {
    if (!questionsCoreAnswered(session) || !inRelationship(session.relationshipsPartner)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink('personal-relationships-questions.html')
    restoreCurrentRelationship(session)
  }

  if (pageName === 'domestic-abuse') {
    if (!questionsFormAnswered(session) || !session.relationshipsBehaviour) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!needsCoercive(session)) {
      window.location.assign(withFromSummary(victimHref))
      return
    }
    if (!fromSummary()) {
      ensureBackLink(perpetratorHref)
    }
    restoreAbuseWho(session)
    restoreCoercive(session)
    applyDomesticAbuseQuestions(session)
  }

  if (pageName === 'strangulation') {
    if (!questionsFormAnswered(session) || !abuseWhoComplete(session) || !coerciveComplete(session) || !needsStrangulation(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(domesticAbuseHref)
    restoreStrangulation(session)
  }

  if (pageName === 'victim') {
    if (!questionsFormAnswered(session) || !perpetratorFollowUpComplete(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(victimBackHref(session))
    restoreVictim(session)
  }

  if (pageName === 'victim-who') {
    if (!questionsFormAnswered(session) || !perpetratorFollowUpComplete(session) || !needsVictimWho(session)) {
      window.location.assign(fromSummary() ? 'personal-relationships-summary.html' : nextIncompleteHref(session))
      return
    }
    if (!fromSummary()) ensureBackLink(victimHref)
    restoreVictimWho(session)
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
    revealCheckedConditionals()
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

  document.querySelector('[data-pc-children-list]')?.addEventListener('click', (event) => {
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
    const addAnother = checkedValue('add_another_child')
    if (!addAnother) {
      showErrors([{
        group: 'add-another-child',
        href: '#add-another-child',
        text: 'Select yes if you need to add another child'
      }])
      return
    }
    clearErrors()
    if (addAnother === 'yes') {
      window.location.assign(childDetailsHref())
      return
    }
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
    setSanSession(updates)
    const saved = getSanSession()
    const followUpComplete = saved.relationshipsBehaviour && perpetratorFollowUpComplete(saved) && victimFlowComplete(saved)
    let next = perpetratorHref
    if (fromSummary() && saved.relationshipsChanges && followUpComplete) {
      next = 'personal-relationships-summary.html'
    } else if (fromSummary()) {
      next = `${perpetratorHref}?from=summary`
    }
    window.location.assign(next)
  })

  document.getElementById('san-relationships-current-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readCurrentRelationship()
    if (!answers.relationshipsStatus) {
      showErrors([{
        group: 'relationships-status',
        href: '#relationships-status',
        text: "Select how you would describe Alex's current relationship situation"
      }])
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    const saved = getSanSession()
    const followUpComplete = saved.relationshipsBehaviour && perpetratorFollowUpComplete(saved) && victimFlowComplete(saved)
    let next = perpetratorHref
    if (fromSummary() && saved.relationshipsChanges && followUpComplete) {
      next = 'personal-relationships-summary.html'
    } else if (fromSummary()) {
      next = `${perpetratorHref}?from=summary`
    }
    window.location.assign(next)
  })

  document.getElementById('san-relationships-perpetrator-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const relationshipsBehaviour = checkedValue('relationships_behaviour')
    if (!relationshipsBehaviour) {
      showErrors([{
        group: 'relationships-behaviour',
        href: '#relationships-behaviour',
        text: 'Select if there is evidence that Alex has ever been a perpetrator of domestic abuse'
      }])
      return
    }
    clearErrors()
    const updates = { relationshipsBehaviour, relationshipsComplete: false }
    if (relationshipsBehaviour !== 'yes') {
      updates.relationshipsAbuseWho = []
      updates.relationshipsAbuseWhoDetails = {}
      updates.relationshipsCoercive = ''
      updates.relationshipsCoerciveDetails = ''
      Object.assign(updates, clearedStrangulation())
    }
    setSanSession(updates)
    const saved = getSanSession()
    const followUpComplete = perpetratorFollowUpComplete(saved) && victimFlowComplete(saved)
    let next = relationshipsBehaviour === 'no' ? withFromSummary(victimHref) : domesticAbuseHref
    if (relationshipsBehaviour === 'yes' && fromSummary() && saved.relationshipsChanges && followUpComplete) {
      next = 'personal-relationships-summary.html'
    } else if (relationshipsBehaviour === 'yes' && fromSummary()) {
      next = `${domesticAbuseHref}?from=summary`
    }
    window.location.assign(next)
  })

  document.getElementById('san-relationships-domestic-abuse-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const session = getSanSession()
    const showAbuse = needsAbuseWho(session)
    const answers = { ...readCoercive() }
    if (showAbuse) Object.assign(answers, readAbuseWho())
    else {
      answers.relationshipsAbuseWho = []
      answers.relationshipsAbuseWhoDetails = {}
    }
    if (!needsStrangulation({ ...session, ...answers })) Object.assign(answers, clearedStrangulation())
    const errors = [
      ...(showAbuse ? validateAbuseWho(answers) : []),
      ...validateCoercive(answers)
    ]
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    window.location.assign(nextAfterDomesticAbuse(getSanSession()))
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
    window.location.assign(fromSummary() && victimFlowComplete(saved) && saved.relationshipsChanges
      ? 'personal-relationships-summary.html'
      : withFromSummary(victimHref))
  })

  document.getElementById('san-relationships-victim-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const answers = readVictim()
    const errors = validateVictim(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    if (answers.relationshipsVictim !== 'yes') {
      answers.relationshipsVictimWho = []
      answers.relationshipsVictimWhoDetails = {}
    }
    clearErrors()
    setSanSession({ ...answers, relationshipsComplete: false })
    const saved = getSanSession()
    let next = 'personal-relationships-changes.html'
    if (needsVictimWho(saved) && !victimWhoComplete(saved)) {
      next = withFromSummary(victimWhoHref)
    } else if (fromSummary() && saved.relationshipsChanges) {
      next = 'personal-relationships-summary.html'
    }
    window.location.assign(next)
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
  if (!isSanPrisonJourney()) return
  initSanRelationships()
})
