//
// Offence analysis — Prototype 1 (Community) Strengths and needs.
//
// Pages: offence-analysis.html → victim card / details / delete if committed against people
// → offence-analysis-impact.html → offence-analysis-involved-parties.html → summary.
// Victim index is passed in the query string or hash (`victim=0`). The kit drops
// query strings on *.html redirects, so hash params are a fallback.
//

import { getSanSession, isSanResearchJourney, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, showErrors, labelled, scrollToHash, YES_NO, revealSoon, checkedValue, checkedValues, fieldValue, selectRadio, selectChecks, setField, summaryChangeHref } from './form.js'
import { applySanProgress } from './progress.js'

// Display labels for offence elements, motivations and victim details.
const ELEMENT_LABELS = {
  arson: 'Arson',
  'domestic-abuse': 'Domestic abuse',
  'excessive-violence': 'Excessive violence or sadistic violence',
  sexual: 'Sexual element',
  stalking: 'Stalking',
  'victim-targeted': 'Victim targeted',
  violence: 'Violence, or threat of violence or coercion',
  weapon: 'Weapon',
  none: 'No, none of these elements'
}

const MOTIVATION_LABELS = {
  addictions: 'Addictions or perceived needs',
  pressurised: 'Being pressurised or led into offending by others',
  emotional: 'Emotional state of Alex',
  financial: 'Financial motivation',
  prejudice: 'Prejudice or discrimination',
  power: 'Seeking or exerting power',
  sexual: 'Sexual motivation',
  thrill: 'Thrill seeking',
  other: 'Other'
}

const COMMITTED_LABELS = {
  people: 'Direct victim',
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
  friend: "Alex's friend",
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

// The kit redirects *.html addresses and drops the query string. Hash params survive that redirect.
// Query string first; hash is a fallback because the kit drops ? on *.html redirects.
const params = () => {
  const fromSearch = new URLSearchParams(window.location.search)
  if ([...fromSearch.keys()].length) return fromSearch
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  return new URLSearchParams(hash)
}
const fromSummary = () => params().get('from') === 'summary'
const victimIndex = () => {
  const value = params().get('victim')
  if (value == null || value === '') return -1
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : -1
}

const victims = (session) => (Array.isArray(session.offenceVictims) ? session.offenceVictims : [])

const includesPeople = (session) => Array.isArray(session.offenceCommittedAgainst) && session.offenceCommittedAgainst.includes('people')

// Side nav ticks. Status tags only update on offence pages.
const applyProgress = (session) => {
  const onOffencePage = document.querySelector('[data-oa-page], [data-oa-summary], [data-oa-victim-details]')
  applySanProgress(session, { current: 'offence', updateStatus: !!onOffencePage })
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

const victimTitle = (index) => `${ORDINALS[index] || `Victim ${index + 1}`} victim`

const victimChangeHref = (index, from, hash = '') => {
  const href = `offence-analysis-victim?victim=${index}&amp;from=${from}`
  return hash ? `${href}#${hash}` : href
}

const victimFormHref = (index, from) => {
  const search = new URLSearchParams()
  if (Number.isInteger(index) && index >= 0) search.set('victim', String(index))
  if (from) search.set('from', from)
  const query = search.toString()
  return query ? `offence-analysis-victim.html?${query}` : 'offence-analysis-victim.html'
}

const victimDeleteHref = (index, from) => {
  const search = new URLSearchParams()
  search.set('victim', String(index))
  if (from) search.set('from', from)
  return `offence-analysis-victim-delete.html#${search.toString()}`
}

const cancelVictimDeleteHref = () => (
  fromSummary() ? 'offence-analysis-summary.html' : 'offence-analysis-victim-details.html'
)

const victimRows = (victim, index, from, withActions = true) => {
  const relationship = [labelled(RELATIONSHIP_LABELS, victim.relationship)]
  if (victim.relationship === 'other' && victim.relationshipDetails) relationship.push(victim.relationshipDetails)
  const title = victimTitle(index)
  const row = (question, lines, hash) => {
    const actions = withActions ? `<dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${victimChangeHref(index, from, hash)}">Change<span class="govuk-visually-hidden"> ${escapeHtml(question)} for ${escapeHtml(title)}</span></a>
    </dd>` : ''
    return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${lines.filter(Boolean).map((line) => escapeHtml(line)).join('<br>')}</dd>
    ${actions}
  </div>`
  }
  return [
    row("What is Alex's relationship to the victim?", relationship, 'victim-relationship'),
    row("What is the victim's approximate age?", [labelled(AGE_LABELS, victim.age)], 'victim-age'),
    row("What is the victim's sex?", [labelled(SEX_LABELS, victim.sex)], 'victim-sex'),
    row("What is the victim's race or ethnicity?", [labelled(ETHNICITY_LABELS, victim.ethnicity)], 'victim-ethnicity')
  ].join('')
}

const victimCardHtml = (victim, index, from, withActions = true) => {
  const title = victimTitle(index)
  const actions = withActions ? `<ul class="govuk-summary-card__actions">
        <li class="govuk-summary-card__action"><a class="govuk-link" href="${victimDeleteHref(index, from)}">Remove victim details<span class="govuk-visually-hidden"> for ${escapeHtml(title)}</span></a></li>
      </ul>` : ''
  return `<div class="govuk-summary-card">
    <div class="govuk-summary-card__title-wrapper">
      <h2 class="govuk-summary-card__title">${escapeHtml(title)}</h2>
      ${actions}
    </div>
    <div class="govuk-summary-card__content">
      <dl class="govuk-summary-list">${victimRows(victim, index, from, withActions)}</dl>
    </div>
  </div>`
}

// Check-your-answers for the questions tab.
const renderSummary = (session) => {
  const mount = document.querySelector('[data-oa-summary]')
  if (!mount) return
  const rows = []
  if (session.offenceDescription) {
    rows.push(summaryRow('Enter a brief description of the offence(s)', [session.offenceDescription], summaryChangeHref('offence-analysis', 'offence-description')))
  }
  if (Array.isArray(session.offenceElements) && session.offenceElements.length) {
    const lines = session.offenceElements.map((value) => labelled(ELEMENT_LABELS, value))
    if (session.offenceElements.includes('victim-targeted') && session.offenceElementTargetedDetails) {
      lines.push(session.offenceElementTargetedDetails)
    }
    if (session.offenceElements.includes('weapon') && session.offenceElementWeaponDetails) {
      lines.push(session.offenceElementWeaponDetails)
    }
    rows.push(summaryRow('Did the offence(s) have any of the following elements?', lines, summaryChangeHref('offence-analysis', 'offence-elements')))
  }
  if (Array.isArray(session.offenceMotivations) && session.offenceMotivations.length) {
    const lines = session.offenceMotivations.map((value) => labelled(MOTIVATION_LABELS, value))
    if (session.offenceMotivations.includes('other') && session.offenceMotivationOtherDetails) lines.push(session.offenceMotivationOtherDetails)
    rows.push(summaryRow('What was Alex trying to gain from the offence?', lines, summaryChangeHref('offence-analysis', 'offence-motivations')))
  }
  if (session.offenceWhy) {
    rows.push(summaryRow('Why did the offence happen?', [session.offenceWhy], summaryChangeHref('offence-analysis', 'offence-why')))
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
      summaryChangeHref('offence-analysis-involved-parties', 'offence-involved')
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
      "Are Alex's current offence(s) more serious than their previous offending?",
      [labelled(ESCALATION_LABELS, session.offenceEscalation), session.offenceEscalationDetails].filter(Boolean),
      summaryChangeHref('offence-analysis-impact', 'escalation')
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

  const people = victims(session).map((victim, index) => victimCardHtml(victim, index, 'summary')).join('')

  mount.innerHTML = `<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>${people}`

  const markComplete = document.querySelector('[data-oa-mark-complete]')
  if (markComplete) {
    const show = !session.offenceComplete && rows.length > 0
    markComplete.hidden = !show
    markComplete.classList.toggle('san-is-hidden', !show)
  }
}

const victimsAddedHeading = (count) => (
  count === 1 ? 'You have added 1 victim' : `You have added ${count} victims`
)

const victimListLabel = (victim, index) => {
  const relationship = labelled(RELATIONSHIP_LABELS, victim.relationship)
  if (victim.relationship === 'other' && victim.relationshipDetails) return `${relationship}: ${victim.relationshipDetails}`
  return relationship || victimTitle(index)
}

const victimNameListHtml = (session, from) => victims(session).map((victim, index) => {
  const label = victimListLabel(victim, index)
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(label)}</dt>
    <dd class="govuk-summary-list__actions">
      <ul class="govuk-summary-list__actions-list">
        <li class="govuk-summary-list__actions-list-item">
          <a class="govuk-link" href="${victimFormHref(index, from)}">Change<span class="govuk-visually-hidden"> ${escapeHtml(label)}</span></a>
        </li>
        <li class="govuk-summary-list__actions-list-item">
          <a class="govuk-link" href="${victimDeleteHref(index, from)}">Remove<span class="govuk-visually-hidden"> ${escapeHtml(label)}</span></a>
        </li>
      </ul>
    </dd>
  </div>`
}).join('')

const renderVictimDetails = (session) => {
  const mount = document.querySelector('[data-oa-victim-details]')
  if (!mount) return
  if (!includesPeople(session)) {
    window.location.assign('offence-analysis.html')
    return
  }

  const list = victims(session)
  const heading = document.querySelector('[data-oa-victims-heading]')
  const hint = document.querySelector('[data-oa-victims-hint]')
  const from = fromSummary() ? 'summary' : 'details'
  if (!list.length) {
    if (heading) heading.textContent = "What are the victim's details?"
    if (hint) hint.hidden = false
    mount.innerHTML = `<p class="govuk-body">Add victim's details to continue.</p>
      <a class="govuk-button govuk-button--secondary" href="${victimFormHref(-1, from)}" data-module="govuk-button">Add a victim</a>`
    return
  }

  if (heading) heading.textContent = victimsAddedHeading(list.length)
  if (hint) hint.hidden = true
  mount.innerHTML = `<dl class="govuk-summary-list san-add-to-list">${victimNameListHtml(session, from)}</dl>
    <div class="govuk-form-group govuk-!-margin-top-8" data-san-error-group="add-another-victim">
      <fieldset class="govuk-fieldset" id="add-another-victim">
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
          <h2 class="govuk-fieldset__heading">Do you need to add another victim?</h2>
        </legend>
        <div class="govuk-radios govuk-radios--inline" data-module="govuk-radios">
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="add-another-victim-yes" name="add_another_victim" type="radio" value="yes">
            <label class="govuk-label govuk-radios__label" for="add-another-victim-yes">Yes</label>
          </div>
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="add-another-victim-no" name="add_another_victim" type="radio" value="no">
            <label class="govuk-label govuk-radios__label" for="add-another-victim-no">No</label>
          </div>
        </div>
      </fieldset>
    </div>
    <button type="button" class="govuk-button" data-module="govuk-button" data-oa-victims-continue>Save and continue</button>`
}

const requireText = (errors, group, href, value, text) => {
  if (!value) errors.push({ group, href, text })
}

const requireChoice = (errors, group, href, value, text) => {
  if (!value) errors.push({ group, href, text })
}

// Read and validate the current page.
const readQuestions = () => ({
  offenceDescription: fieldValue('offence-description'),
  offenceElements: checkedValues('offence_elements'),
  offenceElementTargetedDetails: fieldValue('element-victim-targeted-details'),
  offenceElementWeaponDetails: fieldValue('element-weapon-details'),
  offenceMotivations: checkedValues('offence_motivations'),
  offenceMotivationOtherDetails: fieldValue('motivation-other-details'),
  offenceWhy: fieldValue('offence-why'),
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
  if (!answers.offenceMotivations.length) {
    errors.push({ group: 'motivations', href: '#offence-motivations', text: 'Select the motivations for the current index offence(s)' })
  }
  if (answers.offenceMotivations.includes('other')) {
    requireText(errors, 'motivations', '#motivation-other-details', answers.offenceMotivationOtherDetails, 'Enter details of the other motivation')
  }
  requireText(errors, 'why', '#offence-why', answers.offenceWhy, 'Enter why the current index offence(s) happened')
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
  const escalation = checkedValue('escalation')
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
    offenceEscalation: escalation,
    offenceEscalationDetails: fieldValue(escalation === 'no' ? 'escalation-no-details' : 'escalation-yes-details'),
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
  requireChoice(errors, 'escalation', '#escalation', answers.offenceEscalation, "Select if Alex's current offence(s) are more serious than their previous offending")
  requireChoice(errors, 'linked', '#linked', answers.offenceLinked, 'Select if the offences are linked to risk of serious harm, risks to the individual or other risks')
  if (answers.offenceLinked === 'yes') {
    requireText(errors, 'linked', '#linked-yes-details', answers.offenceLinkedDetails, 'Enter details')
  }
  return errors
}

const restoreQuestions = (session) => {
  setField('offence-description', session.offenceDescription)
  selectChecks('offence_elements', session.offenceElements)
  setField('element-victim-targeted-details', session.offenceElementTargetedDetails)
  setField('element-weapon-details', session.offenceElementWeaponDetails)
  selectChecks('offence_motivations', session.offenceMotivations)
  setField('motivation-other-details', session.offenceMotivationOtherDetails)
  setField('offence-why', session.offenceWhy)
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
  if (session.offenceEscalation === 'yes' || session.offenceEscalation === 'no') {
    setField(`escalation-${session.offenceEscalation}-details`, session.offenceEscalationDetails)
  }
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

const questionsContinue = (answers) => {
  if (fromSummary() && !(answers.offenceCommittedAgainst.includes('people') && !victims(getSanSession()).length)) {
    return 'offence-analysis-summary.html'
  }
  if (answers.offenceCommittedAgainst.includes('people')) {
    return victims(getSanSession()).length ? 'offence-analysis-victim-details.html' : 'offence-analysis-victim.html'
  }
  return 'offence-analysis-involved-parties.html'
}

// Wire up whichever offence analysis page is currently loaded.
const initOffence = () => {
  applyProgress(getSanSession())
  const page = document.querySelector('[data-oa-page]')
  const details = document.querySelector('[data-oa-victim-details]')
  const summary = document.querySelector('[data-oa-summary]')
  if (!page && !details && !summary) return

  const session = getSanSession()
  if (details) {
    renderVictimDetails(session)
    details.addEventListener('click', (event) => {
      const continueButton = event.target.closest('[data-oa-victims-continue]')
      if (!continueButton) return
      event.preventDefault()
      const addAnother = checkedValue('add_another_victim')
      if (!addAnother) {
        showErrors([{
          group: 'add-another-victim',
          href: '#add-another-victim',
          text: 'Select yes if you need to add another victim'
        }])
        return
      }
      clearErrors()
      if (addAnother === 'yes') {
        window.location.assign(victimFormHref(-1, fromSummary() ? 'summary' : 'details'))
        return
      }
      window.location.assign(fromSummary() ? 'offence-analysis-summary.html' : 'offence-analysis-involved-parties.html')
    })
  }
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
  if (pageName === 'victim-delete') {
    if (!includesPeople(session)) {
      window.location.assign('offence-analysis.html')
      return
    }
    const index = victimIndex()
    const victim = victims(session)[index]
    if (!victim) {
      window.location.assign(cancelVictimDeleteHref())
      return
    }
    const cancelHref = cancelVictimDeleteHref()
    ensureBackLink(cancelHref)
    const victimName = victimListLabel(victim, index)
    const deleteHeading = document.querySelector('[data-oa-page="victim-delete"] h1')
    if (deleteHeading) deleteHeading.textContent = `Confirm you want to delete ${victimName}'s details`
    const confirmDelete = document.querySelector('[data-oa-victim-delete-confirm]')
    if (confirmDelete) {
      confirmDelete.innerHTML = `Confirm<span class="govuk-visually-hidden"> you want to delete ${escapeHtml(victimName)}'s details</span>`
    }
    document.querySelector('[data-oa-victim-delete-update]')?.setAttribute('href', victimFormHref(index, fromSummary() ? 'summary' : 'details'))
    document.querySelector('[data-oa-victim-delete-cancel]')?.setAttribute('href', cancelHref)
    const card = document.querySelector('[data-oa-victim-delete-card]')
    if (card) card.innerHTML = victimCardHtml(victim, index, fromSummary() ? 'summary' : 'details', false)
    document.querySelector('[data-oa-victim-delete-confirm]')?.addEventListener('click', () => {
      const latest = victims(getSanSession()).filter((_, itemIndex) => itemIndex !== index)
      setSanSession({ offenceVictims: latest, offenceComplete: false })
      window.location.assign(latest.length ? cancelHref : 'offence-analysis-victim-details.html')
    })
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
  if (!isSanResearchJourney()) return
  initOffence()
})
