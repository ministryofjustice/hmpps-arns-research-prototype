//
// Offence analysis section of the Strengths and needs prototype
//

import { getSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const ELEMENT_LABELS = {
  arson: 'Arson',
  'domestic-abuse': 'Domestic abuse',
  'excessive-violence': 'Excessive violence or sadistic violence',
  hatred: 'Hatred of identifiable groups',
  property: 'Physical damage to property',
  sexual: 'Sexual element',
  'victim-targeted': 'Victim targeted',
  violence: 'Violence, or threat of violence or coercion',
  weapon: 'Weapon',
  none: 'None'
}

const MOTIVATION_LABELS = {
  addictions: 'Addictions or perceived needs',
  pressurised: 'Being pressurised or led into offending by others',
  emotional: 'Emotional state of Alex',
  financial: 'Financial motivation',
  hatred: 'Hatred of identifiable groups',
  power: 'Seeking or exerting power',
  sexual: 'Sexual motivation',
  thrill: 'Thrill seeking',
  other: 'Other'
}

const COMMITTED_LABELS = {
  people: 'One or more people',
  other: 'Other'
}

const RELATIONSHIP_LABELS = {
  stranger: 'A stranger',
  staff: 'Criminal justice staff',
  parent: "Alex's parent or step-parent",
  partner: "Alex's partner",
  'ex-partner': "Alex's ex-partner",
  child: "Alex's child or step-child",
  family: 'Other family member',
  other: 'Other'
}

const AGE_LABELS = {
  '0-4': '0 to 4 years',
  '5-11': '5 to 11 years',
  '12-15': '12 to 15 years',
  '16-17': '16 to 17 years',
  '18-20': '18 to 20 years',
  '21-25': '21 to 25 years',
  '26-49': '26 to 49 years',
  '50-64': '50 to 64 years',
  '65-over': '65 years and over',
  unknown: 'Unknown'
}

const SEX_LABELS = {
  male: 'Male',
  female: 'Female',
  intersex: 'Intersex',
  unknown: 'Unknown'
}

const ETHNICITY_LABELS = {
  'white-british': 'White – English, Welsh, Scottish, Northern Irish or British',
  'white-irish': 'White – Irish',
  'white-gypsy': 'White – Gypsy or Irish Traveller',
  'white-roma': 'White – Roma',
  'white-other': 'White – Any other White background',
  'mixed-caribbean': 'Mixed – White and Black Caribbean',
  'mixed-african': 'Mixed – White and Black African',
  'mixed-asian': 'Mixed – White and Asian',
  'mixed-other': 'Mixed – Any other mixed or multiple ethnic background',
  'asian-indian': 'Asian or Asian British – Indian',
  'asian-pakistani': 'Asian or Asian British – Pakistani',
  'asian-bangladeshi': 'Asian or Asian British – Bangladeshi',
  'asian-chinese': 'Asian or Asian British – Chinese',
  'asian-other': 'Asian or Asian British – Any other Asian background',
  'black-caribbean': 'Black or Black British – Caribbean',
  'black-african': 'Black or Black British – African',
  'black-other': 'Black or Black British – Any other Black background',
  arab: 'Arab',
  other: 'Any other ethnic group',
  unknown: 'Unknown'
}

const INVOLVED_LABELS = {
  none: 'None',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  '6-10': '6 to 10',
  '11-15': '11 to 15',
  'more-than-15': 'More than 15'
}

const YES_NO = { yes: 'Yes', no: 'No' }

const ESCALATION_LABELS = {
  yes: 'Yes',
  no: 'No',
  'not-applicable': 'Not applicable'
}

const LINKED_LABELS = {
  yes: 'Yes',
  no: 'No'
}

const AGAINST_LABELS = {
  family: 'Family member',
  partner: 'Intimate partner',
  both: 'Family member and intimate partner'
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']

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
  if (!(field instanceof HTMLTextAreaElement) && !(field instanceof HTMLInputElement) && !(field instanceof HTMLSelectElement)) return ''
  if (isInHiddenConditional(field)) return ''
  return field.value.trim()
}

const selectRadio = (name, value) => {
  if (!value) return
  const input = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`)
  if (input instanceof HTMLInputElement) input.checked = true
}

const selectChecks = (name, values) => {
  document.querySelectorAll(`input[type="checkbox"][name="${name}"]`).forEach((input) => {
    if (input instanceof HTMLInputElement) input.checked = (values || []).includes(input.value)
  })
}

const setField = (id, value) => {
  const field = document.getElementById(id)
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
    field.value = value || ''
  }
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
    const controls = fieldset ? fieldset.querySelector('.govuk-radios, .govuk-checkboxes, .govuk-hint, .govuk-select, .govuk-textarea') : null
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

const params = () => new URLSearchParams(window.location.search)
const fromSummary = () => params().get('from') === 'summary'
const victimIndex = () => {
  const value = params().get('victim')
  if (value == null || value === '') return -1
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : -1
}

const victims = (session) => (Array.isArray(session.offenceVictims) ? session.offenceVictims : [])

const includesPeople = (session) => Array.isArray(session.offenceCommittedAgainst) && session.offenceCommittedAgainst.includes('people')

const summaryChangeHref = (page, hash = '') => `${page}?from=summary${hash ? `#${hash}` : ''}`

const sectionLink = (key, complete, started, href) => {
  document.querySelectorAll(`[data-section-complete="${key}"]`).forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })
  const link = document.querySelector(`[data-san-section-link="${key}"]`)
  const next = sectionLinkHref(key, started ? href : '')
  if (link && next) link.setAttribute('href', next)
}

const applyProgress = (session) => {
  const complete = !!session.offenceComplete
  const label = complete ? 'Complete' : 'Incomplete'
  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    if (!document.querySelector('[data-oa-page], [data-oa-summary], [data-oa-victim-details]')) return
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })
  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  sectionLink('offence', complete, !!session.offenceDescription, 'offence-analysis-summary.html')
  sectionLink('accommodation', !!session.accommodationComplete, !!session.accommodationType, 'accommodation-summary.html')
  sectionLink('employment', !!session.employmentComplete, !!session.employmentStatus, 'employment-summary.html')
  sectionLink('finances', !!session.financeComplete, Array.isArray(session.financeIncome) && session.financeIncome.length, 'finances-summary.html')
  sectionLink('drugs', !!session.drugComplete, !!session.drugUse, 'drugs-summary.html')
  sectionLink('alcohol', !!session.alcoholComplete, !!session.alcoholUse, 'alcohol-summary.html')
  sectionLink('health', !!session.healthComplete, !!session.healthPhysical, 'health-summary.html')
  sectionLink('relationships', !!session.relationshipsComplete, !!Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0, 'personal-relationships-summary.html')
  sectionLink('thinking', !!session.thinkingComplete, !!session.thinkingConsequences, 'thinking-behaviours-summary.html')
}

const summaryRow = (question, lines, href) => {
  const value = lines.filter(Boolean).map((line) => escapeHtml(line)).join('<br>')
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${href}">Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const summaryRowPlain = (question, lines) => {
  const value = lines.filter(Boolean).map((line) => escapeHtml(line)).join('<br>')
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
  </div>`
}

const yesNoLines = (value, details) => [labelled(YES_NO, value), details].filter(Boolean)

const victimRows = (victim, withActions, index, from) => {
  const relationship = [labelled(RELATIONSHIP_LABELS, victim.relationship)]
  if (victim.relationship === 'other' && victim.relationshipDetails) relationship.push(victim.relationshipDetails)
  const change = `offence-analysis-victim?victim=${index}&amp;from=${from}`
  const action = withActions
    ? `<dd class="govuk-summary-list__actions"><a class="govuk-link" href="${change}">Change</a><br><a class="govuk-link" href="#" data-oa-delete-victim="${index}">Delete</a></dd>`
    : ''
  const row = (question, lines, actions = '') => `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${lines.filter(Boolean).map((line) => escapeHtml(line)).join('<br>')}</dd>
    ${actions}
  </div>`
  return [
    row("What is Alex's relationship to the victim?", relationship, action),
    row("What is the victim's approximate age?", [labelled(AGE_LABELS, victim.age)]),
    row("What is the victim's sex?", [labelled(SEX_LABELS, victim.sex)]),
    row("What is the victim's race or ethnicity?", [labelled(ETHNICITY_LABELS, victim.ethnicity)])
  ].join('')
}

const renderSummary = (session) => {
  const mount = document.querySelector('[data-oa-summary]')
  if (!mount) return
  const rows = []
  if (session.offenceDescription) {
    rows.push(summaryRow('Enter a brief description of the offence(s)', [session.offenceDescription], summaryChangeHref('offence-analysis', 'description')))
  }
  if (Array.isArray(session.offenceElements) && session.offenceElements.length) {
    const lines = session.offenceElements.map((value) => labelled(ELEMENT_LABELS, value))
    if (session.offenceElements.includes('victim-targeted') && session.offenceElementTargetedDetails) {
      lines.push(session.offenceElementTargetedDetails)
    }
    rows.push(summaryRow('Did the offence(s) have any of the following elements?', lines, summaryChangeHref('offence-analysis', 'offence-elements')))
  }
  if (session.offenceWhy) {
    rows.push(summaryRow('Why did the offence happen?', [session.offenceWhy], summaryChangeHref('offence-analysis', 'why')))
  }
  if (Array.isArray(session.offenceMotivations) && session.offenceMotivations.length) {
    const lines = session.offenceMotivations.map((value) => labelled(MOTIVATION_LABELS, value))
    if (session.offenceMotivations.includes('other') && session.offenceMotivationOtherDetails) lines.push(session.offenceMotivationOtherDetails)
    rows.push(summaryRow('What was Alex trying to gain from the offence?', lines, summaryChangeHref('offence-analysis', 'offence-motivations')))
  }
  if (Array.isArray(session.offenceCommittedAgainst) && session.offenceCommittedAgainst.length) {
    const lines = session.offenceCommittedAgainst.map((value) => labelled(COMMITTED_LABELS, value))
    if (session.offenceCommittedAgainst.includes('other') && session.offenceCommittedOtherDetails) lines.push(session.offenceCommittedOtherDetails)
    rows.push(summaryRow('Enter all victim details', lines, summaryChangeHref('offence-analysis', 'offence-committed-against')))
  }
  if (session.offenceInvolved) {
    rows.push(summaryRow(
      'How many other people were involved with the offence?',
      [labelled(INVOLVED_LABELS, session.offenceInvolved)],
      summaryChangeHref('offence-analysis-involved-parties')
    ))
  }
  if (session.offenceLeader) {
    rows.push(summaryRow(
      'Was Alex the leader of the current index offence(s)?',
      yesNoLines(session.offenceLeader, session.offenceLeaderDetails),
      summaryChangeHref('offence-analysis-impact', 'leader')
    ))
  }
  if (session.offenceRecognise) {
    rows.push(summaryRow(
      'Does Alex recognise the impact on the victims or wider community?',
      yesNoLines(session.offenceRecognise, session.offenceRecogniseDetails),
      summaryChangeHref('offence-analysis-impact', 'recognise')
    ))
  }
  if (session.offenceResponsibility) {
    rows.push(summaryRow(
      'Does Alex accept responsibility for the current index offence(s)?',
      yesNoLines(session.offenceResponsibility, session.offenceResponsibilityDetails),
      summaryChangeHref('offence-analysis-impact', 'responsibility')
    ))
  }
  if (session.offenceEscalation) {
    rows.push(summaryRow(
      'Is there an escalation in seriousness from previous offending?',
      [labelled(ESCALATION_LABELS, session.offenceEscalation), session.offenceEscalationDetails].filter(Boolean),
      summaryChangeHref('offence-analysis-impact', 'escalation')
    ))
  }
  if (session.offencePerpetrator) {
    const lines = [labelled(YES_NO, session.offencePerpetrator)]
    if (session.offencePerpetrator === 'yes') {
      lines.push(labelled(AGAINST_LABELS, session.offencePerpetratorWho))
      if (session.offencePerpetratorDetails) lines.push(session.offencePerpetratorDetails)
    }
    rows.push(summaryRow(
      'Is there evidence that Alex has ever been a perpetrator of domestic abuse?',
      lines,
      summaryChangeHref('offence-analysis-impact', 'perpetrator')
    ))
  }
  if (session.offenceVictimDa) {
    const lines = [labelled(YES_NO, session.offenceVictimDa)]
    if (session.offenceVictimDa === 'yes') {
      lines.push(labelled(AGAINST_LABELS, session.offenceVictimDaWho))
      if (session.offenceVictimDaDetails) lines.push(session.offenceVictimDaDetails)
    }
    rows.push(summaryRow(
      'Is there evidence that Alex has ever been a victim of domestic abuse?',
      lines,
      summaryChangeHref('offence-analysis-impact', 'victim-da')
    ))
  }
  if (session.offencePatterns) {
    rows.push(summaryRow('What are the patterns of offending?', [session.offencePatterns], summaryChangeHref('offence-analysis-impact', 'patterns')))
  }
  if (session.offenceLinked) {
    rows.push(summaryRow(
      'Are the current or previous offences linked to risk of serious harm, risks to the individual or other risks?',
      [labelled(LINKED_LABELS, session.offenceLinked), session.offenceLinkedDetails].filter(Boolean),
      summaryChangeHref('offence-analysis-impact', 'linked')
    ))
  }

  const people = victims(session).map((victim, index) => {
    const title = `${ORDINALS[index] || `Victim ${index + 1}`} victim`
    return `<h2 class="govuk-heading-m govuk-!-margin-top-6">${escapeHtml(title)}</h2>
      <dl class="govuk-summary-list san-summary-list">${victimRows(victim, true, index, 'summary')}</dl>`
  }).join('')

  mount.innerHTML = `<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>${people}`

  const markComplete = document.querySelector('[data-oa-mark-complete]')
  if (markComplete) {
    const show = !session.offenceComplete && rows.length > 0
    markComplete.hidden = !show
    markComplete.classList.toggle('san-is-hidden', !show)
  }
}

const renderVictimDetails = (session) => {
  const mount = document.querySelector('[data-oa-victim-details]')
  if (!mount) return
  const list = victims(session)
  if (!list.length) {
    window.location.assign('offence-analysis-victim.html')
    return
  }

  const cards = list.length === 1
    ? `<div class="san-content-header__row">
        <h2 class="govuk-heading-m govuk-!-margin-bottom-0">First victim</h2>
        <p class="govuk-body govuk-!-margin-bottom-0 govuk-!-text-align-right">
          <a class="govuk-link" href="offence-analysis-victim?victim=0&amp;from=details">Change</a><br>
          <a class="govuk-link" href="#" data-oa-delete-victim="0">Delete</a>
        </p>
      </div>
      <dl class="govuk-summary-list san-summary-list">${victimRows(list[0], false, 0, 'details')}</dl>`
    : list.map((victim, index) => {
      const title = `${ORDINALS[index] || `Victim ${index + 1}`} victim`
      return `<div class="govuk-summary-card">
        <div class="govuk-summary-card__title-wrapper">
          <h2 class="govuk-summary-card__title">${escapeHtml(title)}</h2>
          <ul class="govuk-summary-card__actions">
            <li class="govuk-summary-card__action"><a class="govuk-link" href="offence-analysis-victim?victim=${index}&amp;from=details">Change<span class="govuk-visually-hidden"> ${escapeHtml(title)}</span></a></li>
            <li class="govuk-summary-card__action"><a class="govuk-link" href="#" data-oa-delete-victim="${index}">Delete<span class="govuk-visually-hidden"> ${escapeHtml(title)}</span></a></li>
          </ul>
        </div>
        <div class="govuk-summary-card__content">
          <dl class="govuk-summary-list san-summary-list">${victimRows(victim, false, index, 'details')}</dl>
        </div>
      </div>`
    }).join('')

  mount.innerHTML = `${cards}
    <div class="govuk-button-group">
      <a class="govuk-button" href="offence-analysis-involved-parties.html" data-module="govuk-button">Save and continue</a>
      <a class="govuk-button govuk-button--secondary" href="offence-analysis-victim.html?from=details" data-module="govuk-button">Add another victim</a>
    </div>`
}

const requireText = (errors, group, href, value, text) => {
  if (!value) errors.push({ group, href, text })
}

const requireChoice = (errors, group, href, value, text) => {
  if (!value) errors.push({ group, href, text })
}

const readQuestions = () => ({
  offenceDescription: fieldValue('offence-description'),
  offenceElements: checkedValues('offence_elements'),
  offenceElementTargetedDetails: fieldValue('element-victim-targeted-details'),
  offenceWhy: fieldValue('offence-why'),
  offenceMotivations: checkedValues('offence_motivations'),
  offenceMotivationOtherDetails: fieldValue('motivation-other-details'),
  offenceCommittedAgainst: checkedValues('offence_committed_against'),
  offenceCommittedOtherDetails: fieldValue('committed-other-details')
})

const validateQuestions = (answers) => {
  const errors = []
  requireText(errors, 'description', '#offence-description', answers.offenceDescription, 'Enter a description of the current index offence(s)')
  if (!answers.offenceElements.length) {
    errors.push({ group: 'elements', href: '#offence-elements', text: 'Select if the current index offence(s) had any of these elements' })
  }
  if (answers.offenceElements.includes('victim-targeted')) {
    requireText(errors, 'elements', '#element-victim-targeted-details', answers.offenceElementTargetedDetails, 'Enter details about how the victim was targeted')
  }
  requireText(errors, 'why', '#offence-why', answers.offenceWhy, 'Enter why the current index offence(s) happened')
  if (!answers.offenceMotivations.length) {
    errors.push({ group: 'motivations', href: '#offence-motivations', text: 'Select the motivations for the current index offence(s)' })
  }
  if (answers.offenceMotivations.includes('other')) {
    requireText(errors, 'motivations', '#motivation-other-details', answers.offenceMotivationOtherDetails, 'Enter details of the other motivation')
  }
  if (!answers.offenceCommittedAgainst.length) {
    errors.push({ group: 'committed-against', href: '#offence-committed-against', text: 'Select who the offence was committed against' })
  }
  if (answers.offenceCommittedAgainst.includes('other')) {
    requireText(errors, 'committed-against', '#committed-other-details', answers.offenceCommittedOtherDetails, 'Enter details of who else the offence was committed against')
  }
  return errors
}

const readVictim = () => ({
  relationship: checkedValue('victim_relationship'),
  relationshipDetails: fieldValue('relationship-other-details'),
  age: checkedValue('victim_age'),
  sex: checkedValue('victim_sex'),
  ethnicity: fieldValue('victim-ethnicity')
})

const validateVictim = (answers) => {
  const errors = []
  requireChoice(errors, 'relationship', '#victim-relationship', answers.relationship, 'Select who the victim is')
  requireChoice(errors, 'age', '#victim-age', answers.age, "Select the victim's approximate age")
  requireChoice(errors, 'sex', '#victim-sex', answers.sex, "Select the victim's sex")
  requireChoice(errors, 'ethnicity', '#victim-ethnicity', answers.ethnicity, "Select the victim's ethnicity")
  return errors
}

const readImpact = () => {
  const leader = checkedValue('leader')
  const recognise = checkedValue('recognise')
  const responsibility = checkedValue('responsibility')
  const linked = checkedValue('linked')
  const perpetrator = checkedValue('perpetrator')
  const perpetratorWho = checkedValue('perpetrator_who')
  const victimDa = checkedValue('victim_da')
  const victimDaWho = checkedValue('victim-da_who')
  return {
    offenceLeader: leader,
    offenceLeaderDetails: fieldValue(leader === 'yes' ? 'leader-yes-details' : 'leader-no-details'),
    offenceRecognise: recognise,
    offenceRecogniseDetails: fieldValue(recognise === 'yes' ? 'recognise-yes-details' : 'recognise-no-details'),
    offenceResponsibility: responsibility,
    offenceResponsibilityDetails: fieldValue(responsibility === 'yes' ? 'responsibility-yes-details' : 'responsibility-no-details'),
    offencePatterns: fieldValue('patterns'),
    offenceEscalation: checkedValue('escalation'),
    offenceEscalationDetails: fieldValue('escalation-yes-details'),
    offenceLinked: linked,
    offenceLinkedDetails: fieldValue('linked-yes-details'),
    offencePerpetrator: perpetrator,
    offencePerpetratorWho: perpetratorWho,
    offencePerpetratorDetails: fieldValue(`perpetrator-${perpetratorWho}-details`),
    offenceVictimDa: victimDa,
    offenceVictimDaWho: victimDaWho,
    offenceVictimDaDetails: fieldValue(`victim-da-${victimDaWho}-details`)
  }
}

const validateImpact = (answers) => {
  const errors = []
  requireChoice(errors, 'leader', '#leader', answers.offenceLeader, 'Select if Alex was the leader of the current index offence(s)')
  if (answers.offenceLeader === 'yes') {
    requireText(errors, 'leader', '#leader-yes-details', answers.offenceLeaderDetails, 'Enter details')
  }
  requireChoice(errors, 'recognise', '#recognise', answers.offenceRecognise, 'Select if Alex recognises the impact on the victims or wider community')
  requireChoice(errors, 'responsibility', '#responsibility', answers.offenceResponsibility, 'Select if Alex accepts responsibility for the current index offence(s)')
  requireText(errors, 'patterns', '#patterns', answers.offencePatterns, 'Enter the patterns of offending')
  requireChoice(errors, 'escalation', '#escalation', answers.offenceEscalation, 'Select if there is an escalation in seriousness from previous offending')
  requireChoice(errors, 'linked', '#linked', answers.offenceLinked, 'Select if the offences are linked to risk of serious harm, risks to the individual or other risks')
  if (answers.offenceLinked === 'yes') {
    requireText(errors, 'linked', '#linked-yes-details', answers.offenceLinkedDetails, 'Enter details')
  }
  requireChoice(errors, 'perpetrator', '#perpetrator', answers.offencePerpetrator, 'Select if there is evidence Alex has ever been a perpetrator of domestic abuse')
  if (answers.offencePerpetrator === 'yes') {
    requireChoice(errors, 'perpetrator-who', '#perpetrator-who', answers.offencePerpetratorWho, 'Select who this was committed against')
    if (answers.offencePerpetratorWho) {
      requireText(errors, 'perpetrator-who', `#perpetrator-${answers.offencePerpetratorWho}-details`, answers.offencePerpetratorDetails, 'Enter details')
    }
  }
  requireChoice(errors, 'victim-da', '#victim-da', answers.offenceVictimDa, 'Select if there is evidence Alex has ever been a victim of domestic abuse')
  if (answers.offenceVictimDa === 'yes') {
    requireChoice(errors, 'victim-da-who', '#victim-da-who', answers.offenceVictimDaWho, 'Select who this was committed by')
    if (answers.offenceVictimDaWho) {
      requireText(errors, 'victim-da-who', `#victim-da-${answers.offenceVictimDaWho}-details`, answers.offenceVictimDaDetails, 'Enter details')
    }
  }
  return errors
}

const restoreQuestions = (session) => {
  setField('offence-description', session.offenceDescription)
  selectChecks('offence_elements', session.offenceElements)
  setField('element-victim-targeted-details', session.offenceElementTargetedDetails)
  setField('offence-why', session.offenceWhy)
  selectChecks('offence_motivations', session.offenceMotivations)
  setField('motivation-other-details', session.offenceMotivationOtherDetails)
  selectChecks('offence_committed_against', session.offenceCommittedAgainst)
  setField('committed-other-details', session.offenceCommittedOtherDetails)
}

const restoreVictim = (session) => {
  const index = victimIndex()
  const victim = victims(session)[index]
  if (!victim) return
  selectRadio('victim_relationship', victim.relationship)
  setField('relationship-other-details', victim.relationshipDetails)
  selectRadio('victim_age', victim.age)
  selectRadio('victim_sex', victim.sex)
  setField('victim-ethnicity', victim.ethnicity)
}

const restoreInvolved = (session) => {
  selectRadio('offence_involved', session.offenceInvolved)
}

const restoreImpact = (session) => {
  selectRadio('leader', session.offenceLeader)
  if (session.offenceLeader) setField(`leader-${session.offenceLeader}-details`, session.offenceLeaderDetails)
  selectRadio('recognise', session.offenceRecognise)
  if (session.offenceRecognise) setField(`recognise-${session.offenceRecognise}-details`, session.offenceRecogniseDetails)
  selectRadio('responsibility', session.offenceResponsibility)
  if (session.offenceResponsibility) setField(`responsibility-${session.offenceResponsibility}-details`, session.offenceResponsibilityDetails)
  setField('patterns', session.offencePatterns)
  selectRadio('escalation', session.offenceEscalation)
  if (session.offenceEscalation === 'yes') setField('escalation-yes-details', session.offenceEscalationDetails)
  selectRadio('linked', session.offenceLinked)
  if (session.offenceLinked === 'yes') setField('linked-yes-details', session.offenceLinkedDetails)
  selectRadio('perpetrator', session.offencePerpetrator)
  selectRadio('perpetrator_who', session.offencePerpetratorWho)
  if (session.offencePerpetratorWho) setField(`perpetrator-${session.offencePerpetratorWho}-details`, session.offencePerpetratorDetails)
  selectRadio('victim_da', session.offenceVictimDa)
  selectRadio('victim-da_who', session.offenceVictimDaWho)
  if (session.offenceVictimDaWho) setField(`victim-da-${session.offenceVictimDaWho}-details`, session.offenceVictimDaDetails)
}

const ensureBackLink = (href) => {
  const back = document.querySelector('.assessment-layout__back-link')
  if (back) back.setAttribute('href', href)
}

const deleteVictim = (index) => {
  const session = getSanSession()
  const next = victims(session).filter((_, itemIndex) => itemIndex !== index)
  setSanSession({ offenceVictims: next, offenceComplete: false })
  if (!next.length) {
    window.location.assign('offence-analysis-victim.html')
    return
  }
  if (document.querySelector('[data-oa-victim-details]')) renderVictimDetails(getSanSession())
  if (document.querySelector('[data-oa-summary]')) renderSummary(getSanSession())
  applyProgress(getSanSession())
}

const onClick = (event) => {
  const link = event.target.closest('[data-oa-delete-victim]')
  if (!link) return
  event.preventDefault()
  deleteVictim(Number(link.getAttribute('data-oa-delete-victim')))
}

const questionsContinue = (answers) => {
  if (fromSummary() && !(answers.offenceCommittedAgainst.includes('people') && !victims(getSanSession()).length)) {
    return 'offence-analysis-summary.html'
  }
  if (answers.offenceCommittedAgainst.includes('people')) {
    return victims(getSanSession()).length ? 'offence-analysis-victim-details.html' : 'offence-analysis-victim.html'
  }
  return 'offence-analysis-involved-parties.html'
}

const initOffence = () => {
  applyProgress(getSanSession())
  const page = document.querySelector('[data-oa-page]')
  const details = document.querySelector('[data-oa-victim-details]')
  const summary = document.querySelector('[data-oa-summary]')
  if (!page && !details && !summary) return

  const session = getSanSession()
  if (details) renderVictimDetails(session)
  if (summary) {
    renderSummary(session)
    document.querySelector('[data-oa-mark-complete]')?.addEventListener('click', () => {
      setSanSession({ offenceComplete: true })
      applyProgress(getSanSession())
      renderSummary(getSanSession())
    })
  }

  const pageName = page ? page.getAttribute('data-oa-page') : ''
  if (pageName === 'questions') restoreQuestions(session)
  if (pageName === 'victim') {
    if (!includesPeople(session)) {
      window.location.assign('offence-analysis.html')
      return
    }
    restoreVictim(session)
    if (fromSummary()) ensureBackLink('offence-analysis-summary.html')
    else if (params().get('from') === 'details' || victims(session).length) ensureBackLink('offence-analysis-victim-details.html')
  }
  if (pageName === 'involved') {
    restoreInvolved(session)
    if (fromSummary()) ensureBackLink('offence-analysis-summary.html')
    else if (!includesPeople(session)) ensureBackLink('offence-analysis.html')
  }
  if (pageName === 'impact') {
    restoreImpact(session)
    if (fromSummary()) ensureBackLink('offence-analysis-summary.html')
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)
  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })
  document.addEventListener('change', revealCheckedConditionals)
  document.addEventListener('click', onClick)

  document.getElementById('san-offence-questions-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readQuestions()
    const errors = validateQuestions(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const keepVictims = answers.offenceCommittedAgainst.includes('people')
    setSanSession({
      ...answers,
      offenceVictims: keepVictims ? victims(getSanSession()) : [],
      offenceComplete: false
    })
    window.location.assign(questionsContinue(answers))
  })

  document.getElementById('san-offence-victim-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readVictim()
    const errors = validateVictim(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const next = victims(getSanSession()).slice()
    const index = victimIndex()
    if (index >= 0 && index < next.length) next[index] = answers
    else next.push(answers)
    setSanSession({ offenceVictims: next, offenceComplete: false })
    window.location.assign(fromSummary() ? 'offence-analysis-summary.html' : 'offence-analysis-victim-details.html')
  })

  document.getElementById('san-offence-involved-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const offenceInvolved = checkedValue('offence_involved')
    if (!offenceInvolved) {
      showErrors([{ group: 'involved', href: '#offence-involved', text: 'Select how many other people were involved with committing the current index offence(s)' }])
      return
    }
    clearErrors()
    setSanSession({ offenceInvolved, offenceComplete: false })
    window.location.assign(fromSummary() ? 'offence-analysis-summary.html' : 'offence-analysis-impact.html')
  })

  document.getElementById('san-offence-impact-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readImpact()
    const errors = validateImpact(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, offenceComplete: true })
    window.location.assign('offence-analysis-summary.html')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initOffence()
})
