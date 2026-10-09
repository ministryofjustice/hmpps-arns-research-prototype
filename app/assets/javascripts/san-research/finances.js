//
// Finances section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const EXAMPLE_COMPLETE = {
  financeIncome: ['employment', 'family'],
  financeIncomeOther: '',
  financeOverreliant: 'no',
  financeOverreliantDetails: '',
  financeFurtherAssessment: 'yes',
  financeFurtherAssessmentDetails: '',
  financeMoneyManagement: 'necessities',
  financeMoneyManagementDetails: 'Pays rent and bills first.',
  financeDebt: ['own'],
  financeDebtTypes: { own: ['formal'] },
  financeDebtDetails: { own: { formal: 'Phone bill arrears.' } },
  financeChanges: 'need-help',
  financeChangesDetails: 'Wants help budgeting.',
  financeAnalysisStrengths: 'yes',
  financeAnalysisStrengthsDetails: 'Receives regular wages and family support.',
  financeAnalysisHarm: 'no',
  financeAnalysisHarmDetails: '',
  financeAnalysisReoffending: 'yes',
  financeAnalysisReoffendingDetails: 'Debt has previously coincided with offending.',
  financeComplete: true
}

const INCOME_LABELS = {
  carers: "Carer's Allowance",
  disability: 'Disability benefits',
  employment: 'Employment',
  family: 'Family or friends',
  offending: 'Offending',
  pension: 'Pension',
  'student-loan': 'Student loan',
  undeclared: 'Undeclared (includes cash in hand)',
  'work-benefits': 'Work related benefits',
  other: 'Other',
  none: 'No current source of money'
}

const needsOverreliant = (session) => Array.isArray(session.financeIncome) && session.financeIncome.includes('family')

const overreliantTriggerChanged = (next, previous) => needsOverreliant(next) !== needsOverreliant(previous)

const keepOverreliantAnswers = (answers, previous) => {
  if (needsOverreliant(answers)) {
    answers.financeOverreliant = previous.financeOverreliant || ''
    answers.financeOverreliantDetails = previous.financeOverreliantDetails || ''
  } else {
    answers.financeOverreliant = ''
    answers.financeOverreliantDetails = ''
  }
  return answers
}

const YES_NO_UNKNOWN = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

const MONEY_LABELS = {
  well: 'Able to manage their money well and is a strength',
  necessities: 'Able to manage their money for everyday necessities',
  unable: 'Unable to manage their money well',
  problems: 'Unable to manage their money which is creating other problems'
}

const DEBT_LABELS = {
  own: 'Yes, their own debt',
  someone: "Yes, someone else's debt",
  no: 'No',
  unknown: 'Unknown'
}

const DEBT_TYPE_LABELS = {
  others: 'Debt to others',
  formal: 'Formal debt'
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
  const complete = !!session.financeComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  document.querySelectorAll('[data-section-complete="finances"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  const link = document.querySelector('[data-san-section-link="finances"]')
  if (link && Array.isArray(session.financeIncome) && session.financeIncome.length) {
    link.setAttribute('href', sectionLinkHref('finances', 'finances-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="accommodation"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.accommodationComplete)
  })
  const accommodationLink = document.querySelector('[data-san-section-link="accommodation"]')
  if (accommodationLink && session.accommodationType) {
    accommodationLink.setAttribute('href', sectionLinkHref('accommodation', 'accommodation-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="employment"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.employmentComplete)
  })
  const employmentLink = document.querySelector('[data-san-section-link="employment"]')
  if (employmentLink && session.employmentStatus) {
    employmentLink.setAttribute('href', sectionLinkHref('employment', 'employment-summary.html'))
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

  document.querySelectorAll('[data-section-complete="offence"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.offenceComplete)
  })
  const offenceLink = document.querySelector('[data-san-section-link="offence"]')
  if (offenceLink && session.offenceDescription) {
    offenceLink.setAttribute('href', sectionLinkHref('offence', 'offence-analysis-summary.html'))
  }
}

const skipsFurtherAssessmentQuestion = (session) =>
  needsOverreliant(session) && session.financeOverreliant === 'yes'

const entersFollowOn = (session) =>
  skipsFurtherAssessmentQuestion(session) || session.financeFurtherAssessment === 'yes'

const skipsFurtherFinance = (session) =>
  !skipsFurtherAssessmentQuestion(session) && session.financeFurtherAssessment === 'no'

const debtAnswered = (session) => Array.isArray(session.financeDebt) && session.financeDebt.length

const needsOwnDebtTypes = (session) => debtAnswered(session) && session.financeDebt.includes('own')

const ownDebtTypesAnswered = (session) => {
  const types = session.financeDebtTypes && session.financeDebtTypes.own
  return Array.isArray(types) && types.length > 0
}

const followOnAnswered = (session) => {
  if (!session.financeMoneyManagement) return false
  if (!debtAnswered(session)) return false
  if (needsOwnDebtTypes(session) && !ownDebtTypesAnswered(session)) return false
  if (!session.financeChanges) return false
  return true
}

const questionsAnswered = (session) => {
  if (!(Array.isArray(session.financeIncome) && session.financeIncome.length)) return false
  if (needsOverreliant(session) && !session.financeOverreliant) return false
  if (skipsFurtherAssessmentQuestion(session)) return followOnAnswered(session)
  if (!session.financeFurtherAssessment) return false
  if (skipsFurtherFinance(session)) return true
  if (!followOnAnswered(session)) return false
  return true
}

const analysisNotRequired = (session) => skipsFurtherFinance(session)

const nextFollowOnPage = (session, fromSummaryFlow = false) => {
  const query = fromSummaryFlow ? '?from=summary' : ''
  if (!session.financeMoneyManagement || !debtAnswered(session)) return `finances-further${query}`
  if (needsOwnDebtTypes(session) && !ownDebtTypesAnswered(session)) return `finances-debt-types${query}`
  if (!session.financeChanges) return `finances-changes${query}`
  return 'finances-summary.html'
}

const continueHref = (session) => {
  if (!(Array.isArray(session.financeIncome) && session.financeIncome.length)) return 'finances.html'
  if (needsOverreliant(session) && !session.financeOverreliant) return 'finances-overreliant.html'
  if (skipsFurtherAssessmentQuestion(session)) {
    return followOnAnswered(session) ? 'finances.html' : nextFollowOnPage(session)
  }
  if (!session.financeFurtherAssessment) return 'finances-assessment.html'
  if (session.financeFurtherAssessment === 'yes' && !followOnAnswered(session)) return nextFollowOnPage(session)
  return 'finances.html'
}

// Extensionless paths keep ?from=summary. The kit redirects *.html and drops the query.
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
  const editAttribute = editTarget ? ` data-fi-edit-analysis="${escapeHtml(editTarget)}"` : ''
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const financeRows = (session) => {
  const rows = []

  if (Array.isArray(session.financeIncome) && session.financeIncome.length) {
    const lines = []
    session.financeIncome.forEach((value) => {
      lines.push(labelled(INCOME_LABELS, value))
      if (value === 'other' && session.financeIncomeOther) lines.push(session.financeIncomeOther)
    })
    rows.push(summaryRow(
      'Where does Alex currently get their money from?',
      lines,
      summaryChangeHref('finances', 'income')
    ))
  }

  if (needsOverreliant(session) && session.financeOverreliant) {
    const overreliantLines = [labelled(YES_NO_UNKNOWN, session.financeOverreliant)]
    if (session.financeOverreliant === 'yes' && session.financeOverreliantDetails) {
      overreliantLines.push(session.financeOverreliantDetails)
    }
    rows.push(summaryRow(
      'Is Alex over-reliant on family or friends for money?',
      overreliantLines,
      summaryChangeHref('finances-overreliant'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.financeFurtherAssessment && !skipsFurtherAssessmentQuestion(session)) {
    const lines = [labelled(YES_NO_UNKNOWN, session.financeFurtherAssessment)]
    if (session.financeFurtherAssessment === 'no' && session.financeFurtherAssessmentDetails) {
      lines.push(session.financeFurtherAssessmentDetails)
    }
    rows.push(summaryRow(
      "Is there anything about Alex's financial situation that may need further assessment?",
      lines,
      summaryChangeHref('finances-assessment'),
      { secondaryFrom: 1 }
    ))
  }

  if (skipsFurtherFinance(session)) return rows

  if (session.financeMoneyManagement) {
    const lines = [labelled(MONEY_LABELS, session.financeMoneyManagement)]
    if (session.financeMoneyManagementDetails) lines.push(session.financeMoneyManagementDetails)
    rows.push(summaryRow(
      'How good is Alex at managing their money?',
      lines,
      summaryChangeHref('finances-further', 'money-management'),
      { secondaryFrom: 1 }
    ))
  }

  if (Array.isArray(session.financeDebt) && session.financeDebt.length) {
    const lines = []
    session.financeDebt.forEach((value) => {
      lines.push(labelled(DEBT_LABELS, value))
      if (value === 'unknown' && session.financeDebtDetails && session.financeDebtDetails.unknown) {
        lines.push(session.financeDebtDetails.unknown)
      }
    })
    rows.push(summaryRow(
      'Is Alex affected by debt?',
      lines,
      summaryChangeHref('finances-further', 'debt'),
      session.financeDebt.includes('unknown') ? { secondaryFrom: 1 } : {}
    ))
  }

  if (needsOwnDebtTypes(session) && ownDebtTypesAnswered(session)) {
    const lines = []
    session.financeDebtTypes.own.forEach((type) => {
      lines.push(labelled(DEBT_TYPE_LABELS, type))
      const detail = session.financeDebtDetails && session.financeDebtDetails.own && session.financeDebtDetails.own[type]
      if (detail) lines.push(detail)
    })
    rows.push(summaryRow(
      'What type of debt does Alex have?',
      lines,
      summaryChangeHref('finances-debt-types')
    ))
  }

  if (session.financeChanges) {
    const lines = [labelled(CHANGES_LABELS, session.financeChanges)]
    if (session.financeChangesDetails) lines.push(session.financeChangesDetails)
    rows.push(summaryRow(
      'Does Alex want to make changes to their finances?',
      lines,
      summaryChangeHref('finances-changes'),
      { secondaryFrom: 1 }
    ))
  }

  return rows
}

const analysisRows = (session) => {
  const rows = []
  if (session.financeAnalysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's finances?",
      [labelled(YES_NO_UNKNOWN, session.financeAnalysisStrengths), session.financeAnalysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.financeAnalysisHarm) {
    rows.push(summaryRow(
      "Are Alex's finances linked to risk of serious harm?",
      [labelled(YES_NO_UNKNOWN, session.financeAnalysisHarm), session.financeAnalysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.financeAnalysisReoffending) {
    rows.push(summaryRow(
      "Are Alex's finances linked to risk of reoffending?",
      [labelled(YES_NO_UNKNOWN, session.financeAnalysisReoffending), session.financeAnalysisReoffendingDetails],
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
  const mount = document.querySelector('[data-fi-summary]')
  if (!mount) return

  const complete = !!session.financeComplete
  const rows = financeRows(session)
  const goButton = document.querySelector('[data-fi-go-analysis]')

  if (!rows.length) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="finances.html">Answer finances questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && !questionsAnswered(session)) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${continueHref(session)}">Continue</a></p>`
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
  const mount = document.querySelector('[data-fi-analysis-summary]')
  const form = document.getElementById('san-finances-analysis-form')
  const notice = document.querySelector('[data-fi-analysis-not-required]')
  const questions = document.querySelector('[data-fi-analysis-questions]')
  if (!mount || !form) return

  if (analysisNotRequired(session)) {
    setHidden(mount, true)
    setHidden(notice, false)
    setHidden(questions, true)
    setHidden(form, !!session.financeComplete)
    return
  }

  setHidden(notice, true)
  setHidden(questions, false)

  if (!session.financeComplete) {
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
  if (analysisNotRequired(getSanSession())) {
    openAnalysisTab()
    return
  }
  const mount = document.querySelector('[data-fi-analysis-summary]')
  const form = document.getElementById('san-finances-analysis-form')
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

const showCompletedAnalysis = () => {
  const hash = '#practitioner-analysis'
  if (window.location.hash === hash) {
    window.location.reload()
    return
  }
  window.location.assign(`finances-summary.html${hash}`)
}

const emptyFollowOnAnswers = () => ({
  financeMoneyManagement: '',
  financeMoneyManagementDetails: '',
  financeGambling: [],
  financeGamblingDetails: {},
  financeDebt: [],
  financeDebtTypes: {},
  financeDebtDetails: {},
  financeChanges: '',
  financeChangesDetails: ''
})

const readQuestionAnswers = () => {
  const financeIncome = checkedValues('income')
  return {
    financeIncome,
    financeIncomeOther: financeIncome.includes('other') ? fieldValue('income-other-details') : '',
    financeBankAccount: ''
  }
}

const readAssessmentAnswers = () => {
  const financeFurtherAssessment = checkedValue('further_assessment')
  const answers = {
    financeFurtherAssessment,
    financeFurtherAssessmentDetails: financeFurtherAssessment === 'no' ? fieldValue('further-assessment-no-details') : ''
  }
  if (financeFurtherAssessment === 'no') return { ...answers, ...emptyFollowOnAnswers() }
  return answers
}

const readMoneyAnswers = () => {
  const financeMoneyManagement = checkedValue('money_management')
  return {
    financeMoneyManagement,
    financeMoneyManagementDetails: financeMoneyManagement ? fieldValue(`money-${financeMoneyManagement}-details`) : ''
  }
}

const applyDebtSelection = (financeDebt, unknownDetails, previous) => {
  const financeDebtTypes = { ...(previous.financeDebtTypes || {}) }
  const financeDebtDetails = { ...(previous.financeDebtDetails || {}) }
  delete financeDebtTypes.someone
  delete financeDebtDetails.someone

  if (financeDebt.includes('unknown') && unknownDetails) {
    financeDebtDetails.unknown = unknownDetails
  } else {
    delete financeDebtDetails.unknown
  }

  if (!financeDebt.includes('own')) {
    delete financeDebtTypes.own
    delete financeDebtDetails.own
  }

  return { financeDebt, financeDebtTypes, financeDebtDetails }
}

const readDebtAnswers = (previous) => {
  const financeDebt = checkedValues('debt')
  const unknownDetails = financeDebt.includes('unknown') ? fieldValue('debt-unknown-details') : ''
  return applyDebtSelection(financeDebt, unknownDetails, previous)
}

const readDebtTypesAnswers = (previous) => {
  const types = checkedValues('own_debt_types')
  const details = {}
  types.forEach((type) => {
    const text = fieldValue(`debt-own-${type}-details`)
    if (text) details[type] = text
  })
  const financeDebtTypes = { ...(previous.financeDebtTypes || {}), own: types }
  delete financeDebtTypes.someone
  const financeDebtDetails = { ...(previous.financeDebtDetails || {}) }
  delete financeDebtDetails.someone
  if (Object.keys(details).length) financeDebtDetails.own = details
  else delete financeDebtDetails.own
  return { financeDebtTypes, financeDebtDetails }
}

const readChangesAnswers = () => {
  const financeChanges = checkedValue('finance_changes')
  const changesWithDetails = ['maintain', 'active', 'know-how', 'need-help', 'thinking', 'no']
  return {
    financeChanges,
    financeChangesDetails: changesWithDetails.includes(financeChanges) ? fieldValue(`changes-${financeChanges}-details`) : ''
  }
}

const readAnalysisAnswers = () => {
  const financeAnalysisStrengths = checkedValue('analysis_strengths')
  const financeAnalysisHarm = checkedValue('analysis_harm')
  const financeAnalysisReoffending = checkedValue('analysis_reoffending')
  return {
    financeAnalysisStrengths,
    financeAnalysisStrengthsDetails: financeAnalysisStrengths ? fieldValue(`analysis-strengths-${financeAnalysisStrengths}-details`) : '',
    financeAnalysisHarm,
    financeAnalysisHarmDetails: financeAnalysisHarm ? fieldValue(`analysis-harm-${financeAnalysisHarm}-details`) : '',
    financeAnalysisReoffending,
    financeAnalysisReoffendingDetails: financeAnalysisReoffending ? fieldValue(`analysis-reoffending-${financeAnalysisReoffending}-details`) : ''
  }
}

const validateQuestions = (answers) => {
  const errors = []
  if (!answers.financeIncome.length) {
    errors.push({
      group: 'income',
      href: '#income',
      text: 'Select where Alex currently gets their money from'
    })
  }
  return errors
}

const validateAssessment = (answers) => {
  const errors = []
  if (!answers.financeFurtherAssessment) {
    errors.push({
      group: 'further-assessment',
      href: '#further-assessment',
      text: "Select if anything about Alex's financial situation may need further assessment"
    })
  }
  return errors
}

const validateMoney = (answers) => {
  const errors = []
  if (!answers.financeMoneyManagement) {
    errors.push({
      group: 'money-management',
      href: '#money-management',
      text: 'Select how good Alex is at managing their money'
    })
  }
  return errors
}

const validateDebt = (answers) => {
  const errors = []
  if (!answers.financeDebt.length) {
    errors.push({
      group: 'debt',
      href: '#debt',
      text: 'Select if Alex is affected by debt'
    })
  }
  return errors
}

const validateDebtTypes = (answers) => {
  const errors = []
  const types = (answers.financeDebtTypes && answers.financeDebtTypes.own) || []
  if (!types.length) {
    errors.push({
      group: 'debt-types',
      href: '#debt-types',
      text: 'Select the type of debt'
    })
  }
  return errors
}

const validateChanges = (answers) => {
  const errors = []
  if (!answers.financeChanges) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their finances'
    })
  }
  return errors
}

const readOverreliantAnswers = () => {
  const financeOverreliant = checkedValue('overreliant')
  return {
    financeOverreliant,
    financeOverreliantDetails: financeOverreliant === 'yes' ? fieldValue('overreliant-yes-details') : ''
  }
}

const validateOverreliant = (answers) => {
  const errors = []
  if (!answers.financeOverreliant) {
    errors.push({
      group: 'overreliant',
      href: '#overreliant',
      text: 'Select if Alex is over-reliant on family or friends for money'
    })
  } else if (answers.financeOverreliant === 'yes' && !answers.financeOverreliantDetails) {
    errors.push({
      group: 'overreliant-details',
      href: '#overreliant-yes-details',
      text: 'Enter details about Alex being over-reliant on family or friends for money'
    })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['financeAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to finances', 'Enter details about the strengths or protective factors'],
    ['financeAnalysisHarm', 'analysis-harm', "Select if Alex's finances are linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['financeAnalysisReoffending', 'analysis-reoffending', "Select if Alex's finances are linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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

const restoreQuestions = (session) => {
  selectChecks('income', session.financeIncome)
  setField('income-other-details', session.financeIncomeOther)
}

const restoreAssessment = (session) => {
  selectRadio('further_assessment', session.financeFurtherAssessment)
  if (session.financeFurtherAssessment === 'no') {
    setField('further-assessment-no-details', session.financeFurtherAssessmentDetails)
  }
}

const restoreMoney = (session) => {
  selectRadio('money_management', session.financeMoneyManagement)
  if (session.financeMoneyManagement) {
    setField(`money-${session.financeMoneyManagement}-details`, session.financeMoneyManagementDetails)
  }
}

const restoreDebt = (session) => {
  selectChecks('debt', session.financeDebt)
  if (Array.isArray(session.financeDebt) && session.financeDebt.includes('unknown') && session.financeDebtDetails) {
    setField('debt-unknown-details', session.financeDebtDetails.unknown)
  }
}

const restoreDebtTypes = (session) => {
  selectChecks('own_debt_types', session.financeDebtTypes && session.financeDebtTypes.own)
  const details = session.financeDebtDetails && session.financeDebtDetails.own
  if (details && typeof details === 'object') {
    Object.entries(details).forEach(([key, value]) => {
      setField(`debt-own-${key}-details`, value)
    })
  }
}

const restoreChanges = (session) => {
  selectRadio('finance_changes', session.financeChanges)
  if (session.financeChanges) setField(`changes-${session.financeChanges}-details`, session.financeChangesDetails)
}

const restoreOverreliant = (session) => {
  selectRadio('overreliant', session.financeOverreliant)
  if (session.financeOverreliant === 'yes') setField('overreliant-yes-details', session.financeOverreliantDetails)
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.financeAnalysisStrengths)
  if (session.financeAnalysisStrengths) setField(`analysis-strengths-${session.financeAnalysisStrengths}-details`, session.financeAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.financeAnalysisHarm)
  if (session.financeAnalysisHarm) setField(`analysis-harm-${session.financeAnalysisHarm}-details`, session.financeAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.financeAnalysisReoffending)
  if (session.financeAnalysisReoffending) setField(`analysis-reoffending-${session.financeAnalysisReoffending}-details`, session.financeAnalysisReoffendingDetails)
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

const initFinances = () => {
  const page = document.querySelector('[data-fi-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('finances-summary.html')

  const pageName = page.getAttribute('data-fi-page')
  if (pageName === 'questions') restoreQuestions(session)
  if (pageName === 'overreliant') {
    if (!needsOverreliant(session)) {
      window.location.assign(fromSummary() ? 'finances-summary.html' : 'finances.html')
      return
    }
    restoreOverreliant(session)
  }
  if (pageName === 'assessment') {
    if (!(Array.isArray(session.financeIncome) && session.financeIncome.length)) {
      window.location.assign('finances.html')
      return
    }
    if (skipsFurtherAssessmentQuestion(session)) {
      window.location.assign(followOnAnswered(session)
        ? 'finances-summary.html'
        : (fromSummary() ? nextFollowOnPage(session, true) : 'finances-further'))
      return
    }
    if (!fromSummary() && needsOverreliant(session) && !session.financeOverreliant) {
      window.location.assign('finances-overreliant')
      return
    }
    restoreAssessment(session)
    if (!fromSummary() && needsOverreliant(session)) ensureBackLink('finances-overreliant.html')
  }
  if (pageName === 'further') {
    if (!entersFollowOn(session)) {
      window.location.assign(fromSummary() ? 'finances-summary.html' : 'finances-assessment')
      return
    }
    restoreMoney(session)
    restoreDebt(session)
    if (!fromSummary() && skipsFurtherAssessmentQuestion(session)) {
      ensureBackLink('finances-overreliant.html')
    }
  }
  if (pageName === 'debt') {
    if (!entersFollowOn(session)) {
      window.location.assign(fromSummary() ? 'finances-summary.html' : 'finances-assessment')
      return
    }
    const query = fromSummary() ? '?from=summary' : ''
    window.location.replace(`finances-further${query}#debt`)
    return
  }
  if (pageName === 'debt-types') {
    if (!entersFollowOn(session)) {
      window.location.assign(fromSummary() ? 'finances-summary.html' : 'finances-assessment')
      return
    }
    if (!needsOwnDebtTypes(session)) {
      window.location.assign(fromSummary() ? 'finances-summary.html' : 'finances-further')
      return
    }
    restoreDebtTypes(session)
  }
  if (pageName === 'changes') {
    if (!entersFollowOn(session)) {
      window.location.assign(fromSummary() ? 'finances-summary.html' : 'finances-assessment')
      return
    }
    if (!fromSummary() && !debtAnswered(session)) {
      window.location.assign('finances-further')
      return
    }
    if (!fromSummary() && needsOwnDebtTypes(session) && !ownDebtTypesAnswered(session)) {
      window.location.assign('finances-debt-types')
      return
    }
    if (!fromSummary()) {
      ensureBackLink(needsOwnDebtTypes(session) ? 'finances-debt-types.html' : 'finances-further.html')
    }
    restoreChanges(session)
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-fi-go-analysis]')?.addEventListener('click', () => {
      openAnalysisTab()
    })
    document.querySelector('[data-fi-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-fi-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-fi-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  const questionsForm = document.getElementById('san-finances-form')
  questionsForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readQuestionAnswers()
    const errors = validateQuestions(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    const nextAnswers = keepOverreliantAnswers(answers, previous)
    setSanSession({ ...nextAnswers, financeComplete: false })
    const next = { ...previous, ...nextAnswers }
    if (needsOverreliant(next) && (!fromSummary() || overreliantTriggerChanged(next, previous) || !next.financeOverreliant)) {
      window.location.assign(fromSummary() ? 'finances-overreliant?from=summary' : 'finances-overreliant')
      return
    }
    if (skipsFurtherAssessmentQuestion(next)) {
      if (!fromSummary() || !followOnAnswered(next)) {
        window.location.assign(fromSummary() ? nextFollowOnPage(next, true) : 'finances-further')
        return
      }
      window.location.assign('finances-summary.html')
      return
    }
    if (!fromSummary() || !next.financeFurtherAssessment) {
      window.location.assign(fromSummary() ? 'finances-assessment?from=summary' : 'finances-assessment')
      return
    }
    window.location.assign('finances-summary.html')
  })

  const assessmentForm = document.getElementById('san-finances-assessment-form')
  assessmentForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readAssessmentAnswers()
    const errors = validateAssessment(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    setSanSession({ ...answers, financeComplete: false })
    const next = { ...previous, ...answers }
    if (next.financeFurtherAssessment === 'yes' && (!fromSummary() || !followOnAnswered(next))) {
      window.location.assign(fromSummary() ? nextFollowOnPage(next, true) : 'finances-further')
      return
    }
    window.location.assign('finances-summary.html')
  })

  const furtherForm = document.getElementById('san-finances-further-form')
  furtherForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const previous = getSanSession()
    const answers = { ...readMoneyAnswers(), ...readDebtAnswers(previous) }
    const errors = [...validateMoney(answers), ...validateDebt(answers)]
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, financeComplete: false })
    const next = getSanSession()
    if (fromSummary() && followOnAnswered(next)) {
      window.location.assign('finances-summary.html')
      return
    }
    if (fromSummary()) {
      window.location.assign(nextFollowOnPage(next, true))
      return
    }
    window.location.assign(needsOwnDebtTypes(next) ? 'finances-debt-types' : 'finances-changes')
  })

  const debtForm = document.getElementById('san-finances-debt-form')
  debtForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const previous = getSanSession()
    const answers = readDebtAnswers(previous)
    const errors = validateDebt(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, financeComplete: false })
    const next = getSanSession()
    if (fromSummary() && followOnAnswered(next)) {
      window.location.assign('finances-summary.html')
      return
    }
    if (fromSummary()) {
      window.location.assign(nextFollowOnPage(next, true))
      return
    }
    window.location.assign(needsOwnDebtTypes(next) ? 'finances-debt-types' : 'finances-changes')
  })

  const debtTypesForm = document.getElementById('san-finances-debt-types-form')
  debtTypesForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const previous = getSanSession()
    const answers = readDebtTypesAnswers(previous)
    const errors = validateDebtTypes(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, financeComplete: false })
    const next = getSanSession()
    if (fromSummary() && followOnAnswered(next)) {
      window.location.assign('finances-summary.html')
      return
    }
    window.location.assign(fromSummary() ? nextFollowOnPage(next, true) : 'finances-changes')
  })

  const changesForm = document.getElementById('san-finances-changes-form')
  changesForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readChangesAnswers()
    const errors = validateChanges(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, financeComplete: false })
    window.location.assign('finances-summary.html')
  })

  const overreliantForm = document.getElementById('san-finances-overreliant-form')
  overreliantForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readOverreliantAnswers()
    const errors = validateOverreliant(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    if (answers.financeOverreliant === 'yes') {
      setSanSession({
        ...answers,
        financeFurtherAssessment: '',
        financeFurtherAssessmentDetails: '',
        financeComplete: false
      })
      const next = getSanSession()
      if (fromSummary() && followOnAnswered(next)) {
        window.location.assign('finances-summary.html')
        return
      }
      window.location.assign(fromSummary() ? nextFollowOnPage(next, true) : 'finances-further')
      return
    }
    setSanSession({ ...answers, financeComplete: false })
    if (!fromSummary() || !previous.financeFurtherAssessment) {
      window.location.assign(fromSummary() ? 'finances-assessment?from=summary' : 'finances-assessment')
      return
    }
    window.location.assign('finances-summary.html')
  })

  const analysisForm = document.getElementById('san-finances-analysis-form')
  analysisForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (analysisNotRequired(getSanSession())) {
      clearErrors()
      setSanSession({ financeComplete: true })
      showCompletedAnalysis()
      return
    }
    revealCheckedConditionals()
    const answers = readAnalysisAnswers()
    const errors = validateAnalysis(answers)
    if (errors.length) {
      showErrors(errors)
      openAnalysisTab()
      return
    }
    clearErrors()
    setSanSession({ ...answers, financeComplete: true })
    showCompletedAnalysis()
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.startsWith("/san-research/")) return
  initFinances()
})
