//
// Health and wellbeing section of the Strengths and needs prototype
//

import { getSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const MENTAL_YES = ['severe', 'ongoing', 'past']
const CHANGE_DETAILS = ['maintain', 'active', 'know-how', 'need-help', 'thinking', 'no']

const YES_NO = { yes: 'Yes', no: 'No' }
const YES_NO_UNKNOWN = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

const PHYSICAL_LABELS = YES_NO_UNKNOWN

const MENTAL_LABELS = {
  severe: 'Yes, ongoing - severe and documented over a prolonged period of time',
  ongoing: 'Yes, ongoing - duration is not known or there is no link to offending',
  past: 'Yes, in the past',
  no: 'No',
  unknown: 'Unknown'
}

const PSYCHIATRIC_LABELS = {
  yes: 'Yes',
  pending: 'Pending treatment',
  no: 'No',
  unknown: 'Unknown'
}

const LEARNING_LABELS = {
  significant: 'Yes, their ability to learn is significantly impacted',
  slight: 'Yes, their ability to learn is slightly impacted',
  no: 'No, they do not have any conditions or disabilities that impact their ability to learn'
}

const LEARNING_SUMMARY_LABELS = {
  significant: 'Yes, significant learning difficulties',
  slight: 'Yes, some learning difficulties',
  no: 'No difficulties'
}

const COPE_LABELS = {
  well: 'Yes, able to cope well',
  some: 'Has some difficulties coping',
  not: 'Not able to cope'
}

const ATTITUDE_LABELS = {
  positive: 'Positive and reasonably happy',
  some: 'There are some aspects they would like to change or do not like',
  negative: 'Negative self-image and unhappy'
}

const ATTITUDE_SUMMARY_LABELS = {
  positive: 'Positive and reasonably happy with themselves',
  some: 'There are some aspects of themselves that they do not like or would like to change',
  negative: 'Negative self-image and unhappy with themselves'
}

const FUTURE_LABELS = {
  optimistic: 'Optimistic and has a positive outlook about their future',
  'not-sure': 'Not sure and thinks their future could get better or worse',
  'not-optimistic': 'Not optimistic and thinks their future will not get better or may get worse',
  'no-answer': 'Alex does not want to answer',
  'not-present': 'Alex is not present'
}

const HELPED_LABELS = {
  accommodation: 'Accommodation',
  employment: 'Employment',
  faith: 'Faith or religion',
  community: 'Feeling part of a community or giving back',
  medication: 'Medication and treatment',
  money: 'Money',
  relationships: 'Relationships',
  other: 'Other'
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

const physicalYes = (session) => session.healthPhysical === 'yes'
const mentalYes = (session) => MENTAL_YES.includes(session.healthMental)
const routeKey = (session) => {
  if (!session.healthPhysical || !session.healthMental) return ''
  return `${physicalYes(session) ? 'physical' : 'no-physical'}-${mentalYes(session) ? 'mental' : 'no-mental'}`
}

const routeShows = (session, question) => {
  if (!routeKey(session)) return false
  if (question === 'physical-medication') return physicalYes(session)
  if (question === 'mental-medication' || question === 'psychiatric') return mentalYes(session)
  return true
}

const revealSoon = () => {
  revealCheckedConditionals()
  window.setTimeout(revealCheckedConditionals, 0)
}

const checkedValue = (name) => {
  const selected = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`))
    .find((input) => input instanceof HTMLInputElement && input.checked && !isInHiddenConditional(input))
  return selected instanceof HTMLInputElement ? selected.value : ''
}

const checkedValues = (name) => Array.from(document.querySelectorAll(`input[type="checkbox"][name="${name}"]`))
  .filter((input) => input instanceof HTMLInputElement && input.checked && !isInHiddenConditional(input))
  .map((input) => input.value)

const isInHiddenConditional = (element) => {
  const conditional = element.closest('.govuk-radios__conditional, .govuk-checkboxes__conditional')
  return Boolean(conditional && (conditional.hidden || conditional.classList.contains('govuk-radios__conditional--hidden') || conditional.classList.contains('govuk-checkboxes__conditional--hidden')))
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
  const selected = new Set(Array.isArray(values) ? values : [])
  document.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`).forEach((input) => {
    if (input instanceof HTMLInputElement) input.checked = selected.has(input.value)
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
    const fieldset = group.querySelector(':scope > fieldset, :scope > .govuk-fieldset')
    const controls = fieldset ? fieldset.querySelector('.govuk-radios, .govuk-checkboxes, .govuk-hint') : null
    if (fieldset && controls) fieldset.insertBefore(message, controls)
    else if (fieldset) fieldset.prepend(message)
    else {
      const label = group.querySelector(':scope > label, :scope > .govuk-label')
      if (label) label.after(message)
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

const applySectionProgress = (key, complete, started, href) => {
  document.querySelectorAll(`[data-section-complete="${key}"]`).forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })
  const link = document.querySelector(`[data-san-section-link="${key}"]`)
  const next = sectionLinkHref(key, started ? href : '')
  if (link && next) link.setAttribute('href', next)
}

const applyProgress = (session) => {
  const complete = !!session.healthComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })
  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  applySectionProgress('health', complete, !!session.healthPhysical, 'health-summary.html')
  applySectionProgress('accommodation', !!session.accommodationComplete, !!session.accommodationType, 'accommodation-summary.html')
  applySectionProgress('employment', !!session.employmentComplete, !!session.employmentStatus, 'employment-summary.html')
  applySectionProgress(
    'finances',
    !!session.financeComplete,
    Array.isArray(session.financeIncome) && session.financeIncome.length,
    'finances-summary.html'
  )
  applySectionProgress('drugs', !!session.drugComplete, !!session.drugUse, 'drugs-summary.html')
  applySectionProgress('alcohol', !!session.alcoholComplete, !!session.alcoholUse, 'alcohol-summary.html')
  applySectionProgress('relationships', !!session.relationshipsComplete, !!Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0, 'personal-relationships-summary.html')
  applySectionProgress('thinking', !!session.thinkingComplete, !!session.thinkingConsequences, 'thinking-behaviours-summary.html')
}

const questionsAnswered = (session) => {
  if (!routeKey(session)) return false
  if (mentalYes(session) && !session.healthPsychiatric) return false
  if (!session.healthHeadInjury || !session.healthNeurodiverse || !session.healthCope || !session.healthAttitude) return false
  if (!session.healthSelfHarm || !session.healthSuicide || !session.healthFuture || !session.healthChanges) return false
  if (session.healthSelfHarm === 'yes' && !session.healthSelfHarmDetails) return false
  if (session.healthSuicide === 'yes' && !session.healthSuicideDetails) return false
  if (Array.isArray(session.healthHelped) && session.healthHelped.includes('other') && !session.healthHelpedDetails) return false
  return true
}

const summaryChangeHref = (page, hash = '') => `${page}?from=summary${hash ? `#${hash}` : ''}`

const summaryRow = (question, lines, href, options = {}) => {
  const value = lines.filter((line) => line != null && line !== '').map((line, index) => {
    const text = escapeHtml(line)
    if (options.secondaryFrom != null && index >= options.secondaryFrom) {
      return `<span class="san-summary-list__secondary">${text}</span>`
    }
    return text
  }).join('<br>')
  const editTarget = href.startsWith('#analysis-') ? href.slice(1) : ''
  const linkHref = editTarget ? '#practitioner-analysis' : href
  const editAttribute = editTarget ? ` data-hw-edit-analysis="${escapeHtml(editTarget)}"` : ''
  const display = value || 'Not entered'
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${display}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const healthRows = (session) => {
  if (!session.healthPhysical) return []
  const rows = []

  const physicalLines = [labelled(PHYSICAL_LABELS, session.healthPhysical)]
  if (session.healthPhysical === 'yes' && session.healthPhysicalDetails) physicalLines.push(session.healthPhysicalDetails)
  rows.push(summaryRow(
    'Does Alex have any physical health conditions?',
    physicalLines,
    summaryChangeHref('health'),
    { secondaryFrom: 1 }
  ))

  const mentalLines = [labelled(MENTAL_LABELS, session.healthMental)]
  if (MENTAL_YES.includes(session.healthMental) && session.healthMentalDetails) mentalLines.push(session.healthMentalDetails)
  rows.push(summaryRow(
    'Does Alex have any diagnosed or documented mental health problems?',
    mentalLines,
    summaryChangeHref('health'),
    { secondaryFrom: 1 }
  ))

  if (physicalYes(session)) {
    rows.push(summaryRow(
      'Give details if Alex is on prescribed medication or treatment for physical health conditions (optional)',
      [session.healthPhysicalMedication || 'Not entered'],
      summaryChangeHref('health-questions', 'physical-medication')
    ))
  }

  if (mentalYes(session)) {
    rows.push(summaryRow(
      'Give details if Alex is on prescribed medication or treatment for mental health problems (optional)',
      [session.healthMentalMedication || 'Not entered'],
      summaryChangeHref('health-questions', 'mental-medication')
    ))
    if (session.healthPsychiatric) {
      rows.push(summaryRow(
        'Is Alex currently having psychiatric treatment?',
        [labelled(PSYCHIATRIC_LABELS, session.healthPsychiatric)],
        summaryChangeHref('health-questions', 'psychiatric')
      ))
    }
  }

  if (session.healthHeadInjury) {
    rows.push(summaryRow(
      'Has Alex had a head injury or any illness affecting the brain?',
      [labelled(YES_NO_UNKNOWN, session.healthHeadInjury)],
      summaryChangeHref('health-questions', 'head-injury')
    ))
  }

  if (session.healthNeurodiverse) {
    const lines = [labelled(YES_NO_UNKNOWN, session.healthNeurodiverse)]
    if (session.healthNeurodiverse === 'yes' && session.healthNeurodiverseDetails) lines.push(session.healthNeurodiverseDetails)
    rows.push(summaryRow(
      'Does Alex have any neurodiverse conditions?',
      lines,
      summaryChangeHref('health-questions', 'neurodiverse'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.healthLearning) {
    const lines = [labelled(LEARNING_SUMMARY_LABELS, session.healthLearning)]
    if (session.healthLearningDetails) lines.push(session.healthLearningDetails)
    rows.push(summaryRow(
      'Does Alex have any learning difficulties? (optional)',
      lines,
      summaryChangeHref('health-questions', 'learning'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.healthCope) {
    rows.push(summaryRow(
      'Is Alex able to cope with day-to-day life?',
      [labelled(COPE_LABELS, session.healthCope)],
      summaryChangeHref('health-questions', 'cope')
    ))
  }

  if (session.healthAttitude) {
    rows.push(summaryRow(
      "What is Alex's attitude towards themselves?",
      [labelled(ATTITUDE_SUMMARY_LABELS, session.healthAttitude)],
      summaryChangeHref('health-questions', 'attitude')
    ))
  }

  if (session.healthSelfHarm) {
    const lines = [labelled(YES_NO, session.healthSelfHarm)]
    if (session.healthSelfHarmDetails) lines.push(session.healthSelfHarmDetails)
    rows.push(summaryRow(
      'Has Alex ever self-harmed?',
      lines,
      summaryChangeHref('health-questions', 'self-harm'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.healthSuicide) {
    const lines = [labelled(YES_NO, session.healthSuicide)]
    if (session.healthSuicideDetails) lines.push(session.healthSuicideDetails)
    rows.push(summaryRow(
      'Has Alex ever attempted suicide or had suicidal thoughts?',
      lines,
      summaryChangeHref('health-questions', 'suicide'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.healthFuture) {
    rows.push(summaryRow(
      'How optimistic is Alex about their future?',
      [labelled(FUTURE_LABELS, session.healthFuture)],
      summaryChangeHref('health-questions', 'future')
    ))
  }

  if (Array.isArray(session.healthHelped) && session.healthHelped.length) {
    const labels = session.healthHelped.map((value) => labelled(HELPED_LABELS, value)).filter(Boolean)
    const lines = [...labels]
    if (session.healthHelped.includes('other') && session.healthHelpedDetails) lines.push(session.healthHelpedDetails)
    rows.push(summaryRow(
      "What's helped Alex during periods of good health and wellbeing? (optional)",
      lines,
      summaryChangeHref('health-questions', 'helped'),
      { secondaryFrom: labels.length }
    ))
  }

  if (session.healthChanges) {
    const lines = [labelled(CHANGES_LABELS, session.healthChanges)]
    if (session.healthChangesDetails) lines.push(session.healthChangesDetails)
    rows.push(summaryRow(
      'Does Alex want to make changes to their health and wellbeing?',
      lines,
      summaryChangeHref('health-questions', 'changes'),
      { secondaryFrom: 1 }
    ))
  }

  return rows
}

const analysisRows = (session) => {
  const rows = []
  if (session.hwAnalysisStrengths) {
    rows.push(summaryRow(
      'Strengths or protective factors',
      [labelled(YES_NO, session.hwAnalysisStrengths), session.hwAnalysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.hwAnalysisHarm) {
    rows.push(summaryRow(
      'Linked to risk of serious harm',
      [labelled(YES_NO, session.hwAnalysisHarm), session.hwAnalysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.hwAnalysisReoffending) {
    rows.push(summaryRow(
      'Linked to risk of reoffending',
      [labelled(YES_NO, session.hwAnalysisReoffending), session.hwAnalysisReoffendingDetails],
      '#analysis-reoffending',
      { secondaryFrom: 1 }
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
  const mount = document.querySelector('[data-hw-summary]')
  if (!mount) return

  const complete = !!session.healthComplete
  const rows = healthRows(session)
  const goButton = document.querySelector('[data-hw-go-analysis]')

  if (!rows.length) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="health.html">Answer health and wellbeing questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && !questionsAnswered(session)) {
      followOn = '<p class="govuk-body"><a class="govuk-link" href="health-questions.html">Continue</a></p>'
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
  const mount = document.querySelector('[data-hw-analysis-summary]')
  const form = document.getElementById('san-health-analysis-form')
  if (!mount || !form) return

  if (!session.healthComplete) {
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
  const mount = document.querySelector('[data-hw-analysis-summary]')
  const form = document.getElementById('san-health-analysis-form')
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

const readStartAnswers = () => {
  const healthPhysical = checkedValue('health_physical')
  const healthMental = checkedValue('health_mental')
  return {
    healthPhysical,
    healthPhysicalDetails: healthPhysical === 'yes' ? fieldValue('physical-yes-details') : '',
    healthMental,
    healthMentalDetails: MENTAL_YES.includes(healthMental) ? fieldValue(`mental-${healthMental}-details`) : ''
  }
}

const readQuestionAnswers = (session) => {
  const answers = {
    healthPhysicalMedication: '',
    healthMentalMedication: '',
    healthPsychiatric: '',
    healthHeadInjury: checkedValue('head_injury'),
    healthNeurodiverse: checkedValue('neurodiverse'),
    healthNeurodiverseDetails: '',
    healthLearning: checkedValue('learning'),
    healthLearningDetails: '',
    healthCope: checkedValue('cope'),
    healthAttitude: checkedValue('attitude'),
    healthSelfHarm: checkedValue('self_harm'),
    healthSelfHarmDetails: '',
    healthSuicide: checkedValue('suicide'),
    healthSuicideDetails: '',
    healthFuture: checkedValue('future'),
    healthHelped: checkedValues('helped'),
    healthHelpedDetails: '',
    healthChanges: checkedValue('health_changes'),
    healthChangesDetails: ''
  }

  if (physicalYes(session)) answers.healthPhysicalMedication = fieldValue('physical-medication')
  if (mentalYes(session)) {
    answers.healthMentalMedication = fieldValue('mental-medication')
    answers.healthPsychiatric = checkedValue('psychiatric')
  }
  if (answers.healthNeurodiverse === 'yes') answers.healthNeurodiverseDetails = fieldValue('neurodiverse-yes-details')
  if (answers.healthLearning === 'significant' || answers.healthLearning === 'slight') {
    answers.healthLearningDetails = fieldValue(`learning-${answers.healthLearning}-details`)
  }
  if (answers.healthSelfHarm === 'yes') answers.healthSelfHarmDetails = fieldValue('self-harm-yes-details')
  if (answers.healthSuicide === 'yes') answers.healthSuicideDetails = fieldValue('suicide-yes-details')
  if (answers.healthHelped.includes('other')) answers.healthHelpedDetails = fieldValue('helped-other-details')
  if (CHANGE_DETAILS.includes(answers.healthChanges)) {
    answers.healthChangesDetails = fieldValue(`changes-${answers.healthChanges}-details`)
  }
  return answers
}

const readAnalysisAnswers = () => {
  const hwAnalysisStrengths = checkedValue('analysis_strengths')
  const hwAnalysisHarm = checkedValue('analysis_harm')
  const hwAnalysisReoffending = checkedValue('analysis_reoffending')
  return {
    hwAnalysisStrengths,
    hwAnalysisStrengthsDetails: hwAnalysisStrengths ? fieldValue(`analysis-strengths-${hwAnalysisStrengths}-details`) : '',
    hwAnalysisHarm,
    hwAnalysisHarmDetails: hwAnalysisHarm ? fieldValue(`analysis-harm-${hwAnalysisHarm}-details`) : '',
    hwAnalysisReoffending,
    hwAnalysisReoffendingDetails: hwAnalysisReoffending ? fieldValue(`analysis-reoffending-${hwAnalysisReoffending}-details`) : ''
  }
}

const validateStart = (answers) => {
  const errors = []
  if (!answers.healthPhysical) {
    errors.push({
      group: 'physical',
      href: '#physical',
      text: 'Select if Alex has any physical health conditions'
    })
  }
  if (!answers.healthMental) {
    errors.push({
      group: 'mental',
      href: '#mental',
      text: 'Select if Alex has any diagnosed or documented mental health problems'
    })
  }
  return errors
}

const validateQuestions = (answers, session) => {
  const errors = []
  if (mentalYes(session) && !answers.healthPsychiatric) {
    errors.push({
      group: 'psychiatric',
      href: '#psychiatric',
      text: 'Select if Alex is currently having psychiatric treatment'
    })
  }
  if (!answers.healthHeadInjury) {
    errors.push({
      group: 'head-injury',
      href: '#head-injury',
      text: 'Select if Alex has had a head injury or any illness affecting the brain'
    })
  }
  if (!answers.healthNeurodiverse) {
    errors.push({
      group: 'neurodiverse',
      href: '#neurodiverse',
      text: 'Select if Alex has any neurodiverse conditions'
    })
  }
  if (!answers.healthCope) {
    errors.push({
      group: 'cope',
      href: '#cope',
      text: 'Select if Alex is able to cope with day-to-day life'
    })
  }
  if (!answers.healthAttitude) {
    errors.push({
      group: 'attitude',
      href: '#attitude',
      text: "Select Alex's attitude towards themselves"
    })
  }
  if (!answers.healthSelfHarm) {
    errors.push({
      group: 'self-harm',
      href: '#self-harm',
      text: 'Select if Alex has ever self-harmed'
    })
  } else if (answers.healthSelfHarm === 'yes' && !answers.healthSelfHarmDetails) {
    errors.push({
      group: 'self-harm',
      href: '#self-harm-yes-details',
      text: 'Enter details about Alex self-harming'
    })
  }
  if (!answers.healthSuicide) {
    errors.push({
      group: 'suicide',
      href: '#suicide',
      text: 'Select if Alex has ever attempted suicide or had suicidal thoughts'
    })
  } else if (answers.healthSuicide === 'yes' && !answers.healthSuicideDetails) {
    errors.push({
      group: 'suicide',
      href: '#suicide-yes-details',
      text: 'Enter details about Alex attempting suicide or having suicidal thoughts'
    })
  }
  if (!answers.healthFuture) {
    errors.push({
      group: 'future',
      href: '#future',
      text: 'Select how Alex feels about their future'
    })
  }
  if (answers.healthHelped.includes('other') && !answers.healthHelpedDetails) {
    errors.push({
      group: 'helped',
      href: '#helped-other-details',
      text: 'Enter details about what else has helped Alex'
    })
  }
  if (!answers.healthChanges) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their health and wellbeing'
    })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['hwAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to health and wellbeing', 'Enter details about the strengths or protective factors'],
    ['hwAnalysisHarm', 'analysis-harm', "Select if Alex's health and wellbeing is linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['hwAnalysisReoffending', 'analysis-reoffending', "Select if Alex's health and wellbeing is linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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

const applyQuestionRoute = (session) => {
  const visible = []
  document.querySelectorAll('[data-hw-question]').forEach((block) => {
    const show = routeShows(session, block.getAttribute('data-hw-question'))
    block.hidden = !show
    block.classList.toggle('san-is-hidden', !show)
    block.classList.remove('san-question')
    if (show) visible.push(block)
  })
  visible.slice(1).forEach((block) => block.classList.add('san-question'))
}

const restoreStart = (session) => {
  selectRadio('health_physical', session.healthPhysical)
  if (session.healthPhysical === 'yes') setField('physical-yes-details', session.healthPhysicalDetails)
  selectRadio('health_mental', session.healthMental)
  if (MENTAL_YES.includes(session.healthMental)) setField(`mental-${session.healthMental}-details`, session.healthMentalDetails)
}

const restoreQuestions = (session) => {
  setField('physical-medication', session.healthPhysicalMedication)
  setField('mental-medication', session.healthMentalMedication)
  selectRadio('psychiatric', session.healthPsychiatric)
  selectRadio('head_injury', session.healthHeadInjury)
  selectRadio('neurodiverse', session.healthNeurodiverse)
  if (session.healthNeurodiverse === 'yes') setField('neurodiverse-yes-details', session.healthNeurodiverseDetails)
  selectRadio('learning', session.healthLearning)
  if (session.healthLearning === 'significant' || session.healthLearning === 'slight') {
    setField(`learning-${session.healthLearning}-details`, session.healthLearningDetails)
  }
  selectRadio('cope', session.healthCope)
  selectRadio('attitude', session.healthAttitude)
  selectRadio('self_harm', session.healthSelfHarm)
  if (session.healthSelfHarm === 'yes') setField('self-harm-yes-details', session.healthSelfHarmDetails)
  selectRadio('suicide', session.healthSuicide)
  if (session.healthSuicide === 'yes') setField('suicide-yes-details', session.healthSuicideDetails)
  selectRadio('future', session.healthFuture)
  selectChecks('helped', session.healthHelped)
  if (Array.isArray(session.healthHelped) && session.healthHelped.includes('other')) {
    setField('helped-other-details', session.healthHelpedDetails)
  }
  selectRadio('health_changes', session.healthChanges)
  if (CHANGE_DETAILS.includes(session.healthChanges)) {
    setField(`changes-${session.healthChanges}-details`, session.healthChangesDetails)
  }
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.hwAnalysisStrengths)
  if (session.hwAnalysisStrengths) setField(`analysis-strengths-${session.hwAnalysisStrengths}-details`, session.hwAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.hwAnalysisHarm)
  if (session.hwAnalysisHarm) setField(`analysis-harm-${session.hwAnalysisHarm}-details`, session.hwAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.hwAnalysisReoffending)
  if (session.hwAnalysisReoffending) setField(`analysis-reoffending-${session.hwAnalysisReoffending}-details`, session.hwAnalysisReoffendingDetails)
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

const initHealth = () => {
  const page = document.querySelector('[data-hw-page]')
  if (!page) return

  const session = getSanSession()
  applyProgress(session)
  if (fromSummary()) ensureBackLink('health-summary.html')

  const pageName = page.getAttribute('data-hw-page')
  if (pageName === 'start') restoreStart(session)
  if (pageName === 'questions') {
    if (!routeKey(session)) {
      window.location.assign('health')
      return
    }
    applyQuestionRoute(session)
    restoreQuestions(session)
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-hw-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-hw-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-hw-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-hw-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  document.getElementById('san-health-start-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readStartAnswers()
    const errors = validateStart(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = routeKey(getSanSession())
    const next = routeKey(answers)
    const updates = { ...answers, healthComplete: false }
    if (!physicalYes(answers)) updates.healthPhysicalMedication = ''
    if (!mentalYes(answers)) {
      updates.healthMentalMedication = ''
      updates.healthPsychiatric = ''
    }
    setSanSession(updates)
    const returnToSummary = fromSummary() && next === previous
    window.location.assign(returnToSummary ? 'health-summary' : 'health-questions')
  })

  document.getElementById('san-health-questions-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const current = getSanSession()
    const answers = readQuestionAnswers(current)
    const errors = validateQuestions(answers, current)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, healthComplete: false })
    window.location.assign('health-summary.html')
  })

  document.getElementById('san-health-analysis-form')?.addEventListener('submit', (event) => {
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
    setSanSession({ ...answers, healthComplete: true })
    window.location.assign('health-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initHealth()
})
