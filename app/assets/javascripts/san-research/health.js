//
// Health and wellbeing section of the Strengths and needs prototype
//

import { getSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const MENTAL_DESCRIBE = ['ongoing', 'past', 'undiagnosed']
const CHANGE_DETAILS = ['maintain', 'active', 'know-how', 'need-help', 'thinking', 'no']

const YES_NO = { yes: 'Yes', no: 'No' }
const YES_NO_UNKNOWN = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

const PHYSICAL_LABELS = YES_NO_UNKNOWN

const MENTAL_LABELS = YES_NO_UNKNOWN

const MENTAL_DESCRIBE_LABELS = {
  ongoing: 'Ongoing, and diagnosed or documented',
  past: 'In the past, and diagnosed or documented',
  undiagnosed: 'Undiagnosed, self reported or waiting for a consultation'
}

const PSYCHIATRIC_LABELS = {
  yes: 'Yes',
  pending: 'Pending treatment',
  no: 'No',
  unknown: 'Unknown'
}

const LEARNING_YES = ['significant', 'somewhat']

const LEARNING_LABELS = {
  significant: 'Yes, significantly impacted',
  somewhat: 'Yes, somewhat impacted',
  no: 'No',
  unknown: 'Unknown'
}

const COPE_DETAILS = ['some', 'not']

const COPE_LABELS = {
  well: 'Yes, able to cope well',
  some: 'Has some difficulties coping',
  not: 'Not able to cope'
}

const GAMBLING_DETAILS = ['own', 'someone']

const GAMBLING_LABELS = {
  own: 'Yes, their own gambling',
  someone: "Yes, someone else's gambling",
  no: 'No',
  unknown: 'Unknown'
}

const ATTITUDE_LABELS = {
  positive: 'Generally positive and realistic',
  some: 'Some negative or unhealthy views of themselves',
  negative: 'Negative or unrealistic'
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
const mentalYes = (session) => session.healthMental === 'yes'
const routeKey = (session) => {
  if (!session.healthPhysical || !session.healthMental) return ''
  return `${physicalYes(session) ? 'physical' : 'no-physical'}-${mentalYes(session) ? 'mental' : 'no-mental'}`
}

const HIDDEN_QUESTIONS = ['physical-medication', 'mental-medication', 'head-injury', 'neurodiverse', 'future', 'helped']

const routeShows = (session, question) => {
  if (!routeKey(session)) return false
  if (HIDDEN_QUESTIONS.includes(question)) return false
  if (question === 'mental-describe' || question === 'psychiatric') return mentalYes(session)
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
  applySectionProgress('offence', !!session.offenceComplete, !!session.offenceDescription, 'offence-analysis-summary.html')
}

const questionsFormAnswered = (session) => {
  if (!routeKey(session)) return false
  if (mentalYes(session) && (!session.healthMentalDescribe || !session.healthPsychiatric)) return false
  if (!session.healthLearning || !session.healthCope || !session.healthAttitude) return false
  if (!Array.isArray(session.healthGambling) || !session.healthGambling.length) return false
  if (!session.healthSelfHarm || !session.healthSuicide) return false
  if (session.healthSelfHarm === 'yes' && !session.healthSelfHarmDetails) return false
  if (session.healthSuicide === 'yes' && !session.healthSuicideDetails) return false
  return true
}

const questionsAnswered = (session) => questionsFormAnswered(session) && !!session.healthChanges

const continueQuestionsHref = (session) => {
  if (!questionsFormAnswered(session)) return 'health-questions.html'
  if (!session.healthChanges) return 'health-changes.html'
  return 'health-questions.html'
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

  rows.push(summaryRow(
    'Does Alex have any mental health conditions?',
    [labelled(MENTAL_LABELS, session.healthMental)],
    summaryChangeHref('health')
  ))

  if (mentalYes(session)) {
    const describeLines = [labelled(MENTAL_DESCRIBE_LABELS, session.healthMentalDescribe)]
    if (session.healthMentalDetails) describeLines.push(session.healthMentalDetails)
    rows.push(summaryRow(
      "How would you describe Alex's mental health conditions?",
      describeLines,
      summaryChangeHref('health-questions', 'mental-describe'),
      { secondaryFrom: 1 }
    ))
  }

  if (mentalYes(session) && session.healthPsychiatric) {
    rows.push(summaryRow(
      'Is Alex currently having psychiatric treatment?',
      [labelled(PSYCHIATRIC_LABELS, session.healthPsychiatric)],
      summaryChangeHref('health-questions', 'psychiatric')
    ))
  }

  if (session.healthLearning) {
    const lines = [labelled(LEARNING_LABELS, session.healthLearning)]
    if (session.healthLearningDetails) lines.push(session.healthLearningDetails)
    rows.push(summaryRow(
      'Does Alex have any conditions that affect how they learn, understand or process information?',
      lines,
      summaryChangeHref('health-questions', 'learning'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.healthCope) {
    const lines = [labelled(COPE_LABELS, session.healthCope)]
    if (session.healthCopeDetails) lines.push(session.healthCopeDetails)
    rows.push(summaryRow(
      'Is Alex able to cope with day-to-day life?',
      lines,
      summaryChangeHref('health-questions', 'cope'),
      { secondaryFrom: 1 }
    ))
  }

  if (Array.isArray(session.healthGambling) && session.healthGambling.length) {
    const lines = []
    session.healthGambling.forEach((value) => {
      lines.push(labelled(GAMBLING_LABELS, value))
      const detail = session.healthGamblingDetails && session.healthGamblingDetails[value]
      if (detail) lines.push(detail)
    })
    rows.push(summaryRow(
      'Is Alex affected by gambling?',
      lines,
      summaryChangeHref('health-questions', 'gambling')
    ))
  }

  if (session.healthAttitude) {
    rows.push(summaryRow(
      'How would you describe how Alex sees themselves?',
      [labelled(ATTITUDE_LABELS, session.healthAttitude)],
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

  if (session.healthChanges) {
    const lines = [labelled(CHANGES_LABELS, session.healthChanges)]
    if (session.healthChangesDetails) lines.push(session.healthChangesDetails)
    rows.push(summaryRow(
      'Does Alex want to make changes to their health and wellbeing?',
      lines,
      summaryChangeHref('health-changes'),
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
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${continueQuestionsHref(session)}">Continue</a></p>`
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
    healthMental
  }
}

const readQuestionAnswers = (session) => {
  const answers = {
    healthMentalDescribe: '',
    healthMentalDetails: '',
    healthPsychiatric: '',
    healthLearning: checkedValue('learning'),
    healthLearningDetails: '',
    healthCope: checkedValue('cope'),
    healthCopeDetails: '',
    healthGambling: checkedValues('gambling'),
    healthGamblingDetails: {},
    healthAttitude: checkedValue('attitude'),
    healthSelfHarm: checkedValue('self_harm'),
    healthSelfHarmDetails: '',
    healthSuicide: checkedValue('suicide'),
    healthSuicideDetails: '',
    healthFuture: checkedValue('future'),
    healthHelped: checkedValues('helped'),
    healthHelpedDetails: ''
  }

  if (mentalYes(session)) {
    answers.healthMentalDescribe = checkedValue('health_mental_describe')
    answers.healthMentalDetails = MENTAL_DESCRIBE.includes(answers.healthMentalDescribe)
      ? fieldValue(`mental-describe-${answers.healthMentalDescribe}-details`)
      : ''
    answers.healthPsychiatric = checkedValue('psychiatric')
  }
  if (LEARNING_YES.includes(answers.healthLearning)) {
    answers.healthLearningDetails = fieldValue(`learning-${answers.healthLearning}-details`)
  }
  if (COPE_DETAILS.includes(answers.healthCope)) {
    answers.healthCopeDetails = fieldValue(`cope-${answers.healthCope}-details`)
  }
  answers.healthGambling.forEach((value) => {
    if (!GAMBLING_DETAILS.includes(value)) return
    const text = fieldValue(`gambling-${value}-details`)
    if (text) answers.healthGamblingDetails[value] = text
  })
  if (answers.healthSelfHarm === 'yes') answers.healthSelfHarmDetails = fieldValue('self-harm-yes-details')
  if (answers.healthSuicide === 'yes') answers.healthSuicideDetails = fieldValue('suicide-yes-details')
  if (answers.healthHelped.includes('other')) answers.healthHelpedDetails = fieldValue('helped-other-details')
  return answers
}

const readChangesAnswers = () => {
  const healthChanges = checkedValue('health_changes')
  return {
    healthChanges,
    healthChangesDetails: CHANGE_DETAILS.includes(healthChanges) ? fieldValue(`changes-${healthChanges}-details`) : ''
  }
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
      text: 'Select if Alex has any mental health conditions'
    })
  }
  return errors
}

const validateQuestions = (answers, session) => {
  const errors = []
  if (mentalYes(session) && !answers.healthMentalDescribe) {
    errors.push({
      group: 'mental-describe',
      href: '#mental-describe',
      text: "Select how you would describe Alex's mental health conditions"
    })
  }
  if (mentalYes(session) && !answers.healthPsychiatric) {
    errors.push({
      group: 'psychiatric',
      href: '#psychiatric',
      text: 'Select if Alex is currently having psychiatric treatment'
    })
  }
  if (!answers.healthLearning) {
    errors.push({
      group: 'learning',
      href: '#learning',
      text: 'Select if Alex has any conditions that affect how they learn, understand or process information'
    })
  }
  if (!answers.healthCope) {
    errors.push({
      group: 'cope',
      href: '#cope',
      text: 'Select if Alex is able to cope with day-to-day life'
    })
  }
  if (!answers.healthGambling.length) {
    errors.push({
      group: 'gambling',
      href: '#gambling',
      text: 'Select if Alex is affected by gambling'
    })
  }
  if (!answers.healthAttitude) {
    errors.push({
      group: 'attitude',
      href: '#attitude',
      text: 'Select how you would describe how Alex sees themselves'
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
  return errors
}

const validateChanges = (answers) => {
  if (answers.healthChanges) return []
  return [{
    group: 'changes',
    href: '#changes',
    text: 'Select if Alex wants to make changes to their health and wellbeing'
  }]
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
}

const restoreQuestions = (session) => {
  if (MENTAL_DESCRIBE.includes(session.healthMentalDescribe)) {
    selectRadio('health_mental_describe', session.healthMentalDescribe)
    setField(`mental-describe-${session.healthMentalDescribe}-details`, session.healthMentalDetails)
  }
  setField('physical-medication', session.healthPhysicalMedication)
  setField('mental-medication', session.healthMentalMedication)
  selectRadio('psychiatric', session.healthPsychiatric)
  selectRadio('head_injury', session.healthHeadInjury)
  selectRadio('neurodiverse', session.healthNeurodiverse)
  if (session.healthNeurodiverse === 'yes') setField('neurodiverse-yes-details', session.healthNeurodiverseDetails)
  selectRadio('learning', session.healthLearning)
  if (LEARNING_YES.includes(session.healthLearning)) {
    setField(`learning-${session.healthLearning}-details`, session.healthLearningDetails)
  }
  selectRadio('cope', session.healthCope)
  if (COPE_DETAILS.includes(session.healthCope)) {
    setField(`cope-${session.healthCope}-details`, session.healthCopeDetails)
  }
  selectChecks('gambling', session.healthGambling)
  if (session.healthGamblingDetails) {
    Object.entries(session.healthGamblingDetails).forEach(([key, value]) => {
      setField(`gambling-${key}-details`, value)
    })
  }
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
}

const restoreChanges = (session) => {
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
  if (pageName === 'changes') {
    if (!routeKey(session)) {
      window.location.assign('health')
      return
    }
    if (!questionsFormAnswered(session)) {
      window.location.assign('health-questions')
      return
    }
    restoreChanges(session)
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
      updates.healthMentalDescribe = ''
      updates.healthMentalDetails = ''
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
    window.location.assign(fromSummary() && getSanSession().healthChanges ? 'health-summary.html' : 'health-changes.html')
  })

  document.getElementById('san-health-changes-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readChangesAnswers()
    const errors = validateChanges(answers)
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
  if (!window.location.pathname.startsWith("/san-research/")) return
  initHealth()
})
