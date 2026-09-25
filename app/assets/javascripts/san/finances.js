//
// Finances section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const EXAMPLE_COMPLETE = {
  financeIncome: ['employment', 'family'],
  financeIncomeOther: '',
  financeOverreliant: 'no',
  financeBankAccount: 'yes',
  financeMoneyManagement: 'necessities',
  financeMoneyManagementDetails: 'Pays rent and bills first.',
  financeGambling: ['no'],
  financeGamblingDetails: {},
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
  none: 'No money'
}

const OVERRELIANT_LABELS = {
  yes: 'Yes, over reliant on family or friends for money',
  no: 'No, not over reliant on family or friends for money'
}

const YES_NO_UNKNOWN = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

const MONEY_LABELS = {
  well: 'Able to manage their money well and is a strength',
  necessities: 'Able to manage their money for everyday necessities',
  unable: 'Unable to manage their money well',
  problems: 'Unable to manage their money which is creating other problems'
}

const GAMBLING_LABELS = {
  own: 'Yes, their own gambling',
  someone: "Yes, someone else's gambling",
  no: 'No',
  unknown: 'Unknown'
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
}

const questionsAnswered = (session) => {
  if (!(Array.isArray(session.financeIncome) && session.financeIncome.length)) return false
  if (session.financeIncome.includes('family') && !session.financeOverreliant) return false
  if (!session.financeBankAccount) return false
  if (!session.financeMoneyManagement) return false
  if (!(Array.isArray(session.financeGambling) && session.financeGambling.length)) return false
  if (!(Array.isArray(session.financeDebt) && session.financeDebt.length)) return false
  const debtPeople = session.financeDebt.filter((value) => value === 'own' || value === 'someone')
  if (debtPeople.some((who) => !(Array.isArray(session.financeDebtTypes && session.financeDebtTypes[who]) && session.financeDebtTypes[who].length))) return false
  if (!session.financeChanges) return false
  return true
}

const summaryChangeHref = (hash = '') => `finances?from=summary${hash ? `#${hash}` : ''}`

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
      if (value === 'family' && session.financeOverreliant) {
        lines.push(labelled(OVERRELIANT_LABELS, session.financeOverreliant))
      }
      if (value === 'other' && session.financeIncomeOther) lines.push(session.financeIncomeOther)
    })
    rows.push(summaryRow(
      'Where does Alex currently get their money from?',
      lines,
      summaryChangeHref('income')
    ))
  }

  if (session.financeBankAccount) {
    rows.push(summaryRow(
      'Does Alex have their own bank account?',
      [labelled(YES_NO_UNKNOWN, session.financeBankAccount)],
      summaryChangeHref('bank-account')
    ))
  }

  if (session.financeMoneyManagement) {
    const lines = [labelled(MONEY_LABELS, session.financeMoneyManagement)]
    if (session.financeMoneyManagementDetails) lines.push(session.financeMoneyManagementDetails)
    rows.push(summaryRow(
      'How good is Alex at managing their money?',
      lines,
      summaryChangeHref('money-management'),
      { secondaryFrom: 1 }
    ))
  }

  if (Array.isArray(session.financeGambling) && session.financeGambling.length) {
    const lines = []
    session.financeGambling.forEach((value) => {
      lines.push(labelled(GAMBLING_LABELS, value))
      const detail = session.financeGamblingDetails && session.financeGamblingDetails[value]
      if (detail) lines.push(detail)
    })
    rows.push(summaryRow(
      'Is Alex affected by gambling?',
      lines,
      summaryChangeHref('gambling')
    ))
  }

  if (Array.isArray(session.financeDebt) && session.financeDebt.length) {
    const lines = []
    session.financeDebt.forEach((value) => {
      lines.push(labelled(DEBT_LABELS, value))
      if (value === 'own' || value === 'someone') {
        const types = (session.financeDebtTypes && session.financeDebtTypes[value]) || []
        types.forEach((type) => {
          lines.push(labelled(DEBT_TYPE_LABELS, type))
          const detail = session.financeDebtDetails && session.financeDebtDetails[value] && session.financeDebtDetails[value][type]
          if (detail) lines.push(detail)
        })
      }
      if (value === 'unknown' && session.financeDebtDetails && session.financeDebtDetails.unknown) {
        lines.push(session.financeDebtDetails.unknown)
      }
    })
    rows.push(summaryRow(
      'Is Alex affected by debt?',
      lines,
      summaryChangeHref('debt')
    ))
  }

  if (session.financeChanges) {
    const lines = [labelled(CHANGES_LABELS, session.financeChanges)]
    if (session.financeChangesDetails) lines.push(session.financeChangesDetails)
    rows.push(summaryRow(
      'Does Alex want to make changes to their finances?',
      lines,
      summaryChangeHref('changes'),
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
      followOn = '<p class="govuk-body"><a class="govuk-link" href="finances.html">Continue</a></p>'
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
  if (!mount || !form) return

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

const readQuestionAnswers = () => {
  const financeIncome = checkedValues('income')
  const financeGambling = checkedValues('gambling')
  const financeDebt = checkedValues('debt')
  const financeDebtTypes = {}
  const financeDebtDetails = {}
  ;['own', 'someone'].forEach((who) => {
    if (!financeDebt.includes(who)) return
    const types = checkedValues(`${who}_debt_types`)
    financeDebtTypes[who] = types
    const details = {}
    types.forEach((type) => {
      const text = fieldValue(`debt-${who}-${type}-details`)
      if (text) details[type] = text
    })
    if (Object.keys(details).length) financeDebtDetails[who] = details
  })
  if (financeDebt.includes('unknown')) {
    const text = fieldValue('debt-unknown-details')
    if (text) financeDebtDetails.unknown = text
  }

  const gamblingDetails = {}
  financeGambling.forEach((value) => {
    const text = fieldValue(`gambling-${value}-details`)
    if (text) gamblingDetails[value] = text
  })

  const financeMoneyManagement = checkedValue('money_management')
  const financeChanges = checkedValue('finance_changes')
  const changesWithDetails = ['maintain', 'active', 'know-how', 'need-help', 'thinking', 'no']

  return {
    financeIncome,
    financeIncomeOther: financeIncome.includes('other') ? fieldValue('income-other-details') : '',
    financeOverreliant: financeIncome.includes('family') ? checkedValue('overreliant') : '',
    financeBankAccount: checkedValue('bank_account'),
    financeMoneyManagement,
    financeMoneyManagementDetails: financeMoneyManagement ? fieldValue(`money-${financeMoneyManagement}-details`) : '',
    financeGambling,
    financeGamblingDetails: gamblingDetails,
    financeDebt,
    financeDebtTypes,
    financeDebtDetails,
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
  } else if (answers.financeIncome.includes('family') && !answers.financeOverreliant) {
    errors.push({
      group: 'overreliant',
      href: '#overreliant',
      text: 'Select if Alex is overreliant on family or friends for money'
    })
  }
  if (!answers.financeBankAccount) {
    errors.push({
      group: 'bank-account',
      href: '#bank-account',
      text: 'Select if Alex has their own bank account'
    })
  }
  if (!answers.financeMoneyManagement) {
    errors.push({
      group: 'money-management',
      href: '#money-management',
      text: 'Select how good Alex is at managing their money'
    })
  }
  if (!answers.financeGambling.length) {
    errors.push({
      group: 'gambling',
      href: '#gambling',
      text: 'Select if Alex is affected by gambling'
    })
  }
  if (!answers.financeDebt.length) {
    errors.push({
      group: 'debt',
      href: '#debt',
      text: 'Select if Alex is affected by debt'
    })
  } else {
    ;['own', 'someone'].forEach((who) => {
      if (!answers.financeDebt.includes(who)) return
      const types = answers.financeDebtTypes[who] || []
      if (!types.length) {
        errors.push({
          group: `debt-${who}-types`,
          href: `#debt-${who}-types`,
          text: 'Select the type of debt'
        })
      }
    })
  }
  if (!answers.financeChanges) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their finances'
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
  selectRadio('overreliant', session.financeOverreliant)
  selectRadio('bank_account', session.financeBankAccount)
  selectRadio('money_management', session.financeMoneyManagement)
  if (session.financeMoneyManagement) {
    setField(`money-${session.financeMoneyManagement}-details`, session.financeMoneyManagementDetails)
  }
  selectChecks('gambling', session.financeGambling)
  if (session.financeGamblingDetails) {
    Object.entries(session.financeGamblingDetails).forEach(([key, value]) => {
      setField(`gambling-${key}-details`, value)
    })
  }
  selectChecks('debt', session.financeDebt)
  ;['own', 'someone'].forEach((who) => {
    if (!(Array.isArray(session.financeDebt) && session.financeDebt.includes(who))) return
    selectChecks(`${who}_debt_types`, session.financeDebtTypes && session.financeDebtTypes[who])
    const details = session.financeDebtDetails && session.financeDebtDetails[who]
    if (details && typeof details === 'object') {
      Object.entries(details).forEach(([key, value]) => {
        setField(`debt-${who}-${key}-details`, value)
      })
    }
  })
  if (Array.isArray(session.financeDebt) && session.financeDebt.includes('unknown') && session.financeDebtDetails) {
    setField('debt-unknown-details', session.financeDebtDetails.unknown)
  }
  selectRadio('finance_changes', session.financeChanges)
  if (session.financeChanges) setField(`changes-${session.financeChanges}-details`, session.financeChangesDetails)
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
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-fi-go-analysis]')?.addEventListener('click', openAnalysisTab)
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
    setSanSession({ ...answers, financeComplete: false })
    window.location.assign('finances-summary.html')
  })

  const analysisForm = document.getElementById('san-finances-analysis-form')
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
    setSanSession({ ...answers, financeComplete: true })
    window.location.assign('finances-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initFinances()
})
