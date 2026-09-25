//
// Alcohol use section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const YES_NO = { yes: 'Yes', no: 'No' }

const ALCOHOL_USE_LABELS = {
  'yes-in-last-3-months': 'Yes, including the last 3 months',
  'yes-not-in-last-3-months': 'Yes, but not in the last 3 months',
  no: 'No'
}

const hasDrunkAlcohol = (session) => session.alcoholUse === 'yes-in-last-3-months' || session.alcoholUse === 'yes-not-in-last-3-months'

const recentDrinking = (session) => session.alcoholUse === 'yes-in-last-3-months'

const FREQUENCY_LABELS = {
  monthly: 'Once a month or less',
  '2to4monthly': '2 to 4 times a month',
  '2to3weekly': '2 to 3 times a week',
  more4weekly: 'More than 4 times a week'
}

const UNITS_LABELS = {
  '1to2': '1 to 2 units',
  '3to4': '3 to 4 units',
  '5to6': '5 to 6 units',
  '7to9': '7 to 9 units',
  '10plus': '10 or more units'
}

const BINGE_FREQUENCY_LABELS = {
  'less-month': 'Less than once a month',
  monthly: 'Monthly',
  weekly: 'Weekly',
  daily: 'Daily or almost daily'
}

const EVIDENCE_LABELS = {
  none: 'No evidence of binge drinking or excessive alcohol use',
  some: 'Some evidence of binge drinking or excessive alcohol use',
  detrimental: 'Evidence of binge drinking or excessive alcohol use'
}

const EVIDENCE_HINTS = {
  some: 'There is a pattern of alcohol use but has not caused any serious problems.',
  detrimental: 'There is a detrimental effect on other areas of their life and is often directly related to offending.'
}

const REASON_LABELS = {
  cultural: 'Cultural or religious practice',
  curiosity: 'Curiosity or experimentation',
  enjoyment: 'Enjoyment',
  stress: 'Manage stress or emotional issues',
  occasions: 'On special occasions',
  'peer-pressure': 'Peer pressure or social influence',
  'self-medication': 'Self-medication or mood altering',
  socially: 'Socially',
  other: 'Other'
}

const IMPACT_LABELS = {
  behavioural: 'Behavioural',
  community: 'Community',
  finances: 'Finances',
  offending: 'Links to offending',
  health: 'Physical or mental health',
  relationships: 'Relationships',
  other: 'Other',
  none: 'No impact'
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

const EXAMPLE_COMPLETE = {
  alcoholUse: 'yes-in-last-3-months',
  alcoholFrequency: '2to3weekly',
  alcoholUnits: '5to6',
  alcoholBinge: 'yes',
  alcoholBingeFrequency: 'weekly',
  alcoholEvidence: 'some',
  alcoholCustody: 'yes',
  alcoholCustodyDetails: 'There are multiple reports from prison staff that Alex was drinking in their cell.',
  alcoholPastIssues: 'yes',
  alcoholPastIssuesDetails: "Alex's past alcohol consumption has led them to behave erratically.",
  alcoholReasons: ['stress'],
  alcoholReasonsDetails: '',
  alcoholImpact: ['behavioural'],
  alcoholImpactDetails: '',
  alcoholHelp: 'no',
  alcoholHelpDetails: '',
  alcoholChanges: 'thinking',
  alcoholChangesDetails: '',
  alcoholAnalysisStrengths: 'no',
  alcoholAnalysisStrengthsDetails: '',
  alcoholAnalysisHarm: 'no',
  alcoholAnalysisHarmDetails: '',
  alcoholAnalysisReoffending: 'no',
  alcoholAnalysisReoffendingDetails: '',
  alcoholComplete: true
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
    const legend = fieldset ? fieldset.querySelector(':scope > legend') : null
    if (legend) legend.after(message)
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

const applySectionProgress = (key, complete, started, href) => {
  document.querySelectorAll(`[data-section-complete="${key}"]`).forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })
  const link = document.querySelector(`[data-san-section-link="${key}"]`)
  const next = sectionLinkHref(key, started ? href : '')
  if (link && next) link.setAttribute('href', next)
}

const applyProgress = (session) => {
  const complete = !!session.alcoholComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  applySectionProgress('alcohol', complete, !!session.alcoholUse, 'alcohol-summary.html')
  applySectionProgress('accommodation', !!session.accommodationComplete, !!session.accommodationType, 'accommodation-summary.html')
  applySectionProgress('employment', !!session.employmentComplete, !!session.employmentStatus, 'employment-summary.html')
  applySectionProgress(
    'finances',
    !!session.financeComplete,
    Array.isArray(session.financeIncome) && session.financeIncome.length,
    'finances-summary.html'
  )
  applySectionProgress('drugs', !!session.drugComplete, !!session.drugUse, 'drugs-summary.html')
  applySectionProgress('relationships', !!session.relationshipsComplete, !!Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0, 'personal-relationships-summary.html')
  applySectionProgress('health', !!session.healthComplete, !!session.healthPhysical, 'health-summary.html')
  applySectionProgress('thinking', !!session.thinkingComplete, !!session.thinkingConsequences, 'thinking-behaviours-summary.html')
}

const beforeAnswered = (session) => {
  if (!hasDrunkAlcohol(session)) return false
  if (recentDrinking(session)) {
    if (!session.alcoholFrequency || !session.alcoholUnits || !session.alcoholBinge) return false
    if (session.alcoholBinge === 'yes' && !session.alcoholBingeFrequency) return false
  }
  if (!session.alcoholEvidence) return false
  return backgroundAnswered(session)
}

const backgroundAnswered = (session) => {
  if (!session.alcoholPastIssues) return false
  if (session.alcoholPastIssues === 'yes' && !session.alcoholPastIssuesDetails) return false
  if (!(Array.isArray(session.alcoholReasons) && session.alcoholReasons.length)) return false
  if (!(Array.isArray(session.alcoholImpact) && session.alcoholImpact.length)) return false
  if (!session.alcoholHelp) return false
  if (session.alcoholHelp === 'yes' && !session.alcoholHelpDetails) return false
  return !!session.alcoholChanges
}

const questionsAnswered = (session) => {
  if (session.alcoholUse === 'no') return true
  if (!hasDrunkAlcohol(session)) return false
  return beforeAnswered(session) && backgroundAnswered(session)
}

const summaryChangeHref = (page, hash = '') => `${page}?from=summary${hash ? `#${hash}` : ''}`

const summaryRow = (question, lines, href, options = {}) => {
  const value = lines.filter((line) => line != null && line !== '').map((line, index) => {
    const text = escapeHtml(line)
    if (options.secondaryFrom != null && index >= options.secondaryFrom) {
      return `<span class="san-summary-list__secondary">${text}</span>`
    }
    return text
  }).join(options.spaced ? '<br><br>' : '<br>')
  const editTarget = href.startsWith('#analysis-') ? href.slice(1) : ''
  const linkHref = editTarget ? '#practitioner-analysis' : href
  const editAttribute = editTarget ? ` data-al-edit-analysis="${escapeHtml(editTarget)}"` : ''
  const display = value || (options.blankIfEmpty ? '' : 'Not provided')
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${display}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const alcoholRows = (session) => {
  if (!session.alcoholUse) return ''

  const parts = [`<dl class="govuk-summary-list san-summary-list">${summaryRow(
    'Has Alex ever drunk alcohol?',
    [labelled(ALCOHOL_USE_LABELS, session.alcoholUse)],
    summaryChangeHref('alcohol')
  )}</dl>`]

  if (hasDrunkAlcohol(session)) {
    const beforeRows = []
    if (recentDrinking(session)) {
      if (session.alcoholFrequency) {
        beforeRows.push(summaryRow(
          'How often has Alex drunk alcohol in the last 3 months?',
          [labelled(FREQUENCY_LABELS, session.alcoholFrequency)],
          summaryChangeHref('alcohol-before', 'alcohol-frequency')
        ))
      }
      if (session.alcoholUnits) {
        beforeRows.push(summaryRow(
          'How many units of alcohol does Alex have on a typical day of drinking?',
          [labelled(UNITS_LABELS, session.alcoholUnits)],
          summaryChangeHref('alcohol-before', 'alcohol-units')
        ))
      }
      if (session.alcoholBinge) {
        const bingeLines = [labelled(YES_NO, session.alcoholBinge)]
        if (session.alcoholBinge === 'yes' && session.alcoholBingeFrequency) {
          bingeLines.push(labelled(BINGE_FREQUENCY_LABELS, session.alcoholBingeFrequency))
        }
        beforeRows.push(summaryRow(
          'Has Alex had 6 or more units within a single day of drinking in the last 3 months?',
          bingeLines,
          summaryChangeHref('alcohol-before', 'alcohol-binge')
        ))
      }
    }
    if (session.alcoholEvidence) {
      const evidenceLines = [labelled(EVIDENCE_LABELS, session.alcoholEvidence)]
      if (EVIDENCE_HINTS[session.alcoholEvidence]) evidenceLines.push(EVIDENCE_HINTS[session.alcoholEvidence])
      beforeRows.push(summaryRow(
        'Has Alex shown evidence of binge drinking or excessive alcohol use in the last 6 months?',
        evidenceLines,
        summaryChangeHref('alcohol-before', 'alcohol-evidence'),
        { secondaryFrom: 1 }
      ))
    }
    if (beforeRows.length) {
      parts.push(`<dl class="govuk-summary-list san-summary-list">${beforeRows.join('')}</dl>`)
    }
  }

  if (hasDrunkAlcohol(session) && session.alcoholCustody) {
    const custodyLines = [labelled(YES_NO, session.alcoholCustody)]
    if (session.alcoholCustodyDetails) custodyLines.push(session.alcoholCustodyDetails)
    parts.push('<h3 class="govuk-heading-m">Alcohol use in custody</h3>')
    parts.push(`<dl class="govuk-summary-list san-summary-list">${summaryRow(
      'Is there any evidence that Alex has drunk alcohol in custody?',
      custodyLines,
      summaryChangeHref('alcohol-before', 'alcohol-custody'),
      { secondaryFrom: 1 }
    )}</dl>`)
  }

  const followOnPage = 'alcohol-before'
  if (hasDrunkAlcohol(session) && (backgroundAnswered(session) || session.alcoholPastIssues || session.alcoholChanges)) {
    const rows = []
    if (session.alcoholPastIssues) {
      const lines = [labelled(YES_NO, session.alcoholPastIssues)]
      if (session.alcoholPastIssuesDetails) lines.push(session.alcoholPastIssuesDetails)
      rows.push(summaryRow(
        'Does Alex have any past issues with alcohol?',
        lines,
        summaryChangeHref(followOnPage, 'alcohol-past-issues'),
        { secondaryFrom: 1 }
      ))
    }
    if (Array.isArray(session.alcoholReasons) && session.alcoholReasons.length) {
      const lines = session.alcoholReasons.map((value) => labelled(REASON_LABELS, value))
      if (session.alcoholReasonsDetails) lines.push(session.alcoholReasonsDetails)
      rows.push(summaryRow(
        'Why does Alex drink alcohol?',
        lines,
        summaryChangeHref(followOnPage, 'alcohol-reasons'),
        { spaced: true }
      ))
    }
    if (Array.isArray(session.alcoholImpact) && session.alcoholImpact.length) {
      const lines = session.alcoholImpact.map((value) => labelled(IMPACT_LABELS, value))
      if (session.alcoholImpactDetails) lines.push(session.alcoholImpactDetails)
      rows.push(summaryRow(
        "What's the impact of Alex drinking alcohol?",
        lines,
        summaryChangeHref(followOnPage, 'alcohol-impact'),
        { spaced: true }
      ))
    }
    if (session.alcoholHelp) {
      const lines = [labelled(YES_NO, session.alcoholHelp)]
      if (session.alcoholHelpDetails) lines.push(session.alcoholHelpDetails)
      rows.push(summaryRow(
        'Has anything helped Alex to stop or reduce drinking alcohol in the past?',
        lines,
        summaryChangeHref(followOnPage, 'alcohol-help'),
        { secondaryFrom: 1 }
      ))
    }
    if (session.alcoholChanges) {
      const lines = [labelled(CHANGES_LABELS, session.alcoholChanges)]
      if (session.alcoholChangesDetails) lines.push(session.alcoholChangesDetails)
      rows.push(summaryRow(
        'Does Alex want to make changes to their alcohol use?',
        lines,
        summaryChangeHref(followOnPage, 'alcohol-changes'),
        { secondaryFrom: 1 }
      ))
    }
    if (rows.length) {
      parts.push(`<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>`)
    }
  }

  return parts.join('')
}

const analysisRows = (session) => {
  const rows = []
  if (session.alcoholAnalysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's alcohol use?",
      [labelled(YES_NO, session.alcoholAnalysisStrengths), session.alcoholAnalysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.alcoholAnalysisHarm) {
    rows.push(summaryRow(
      "Is Alex's alcohol use linked to risk of serious harm?",
      [labelled(YES_NO, session.alcoholAnalysisHarm), session.alcoholAnalysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.alcoholAnalysisReoffending) {
    rows.push(summaryRow(
      "Is Alex's alcohol use linked to risk of reoffending?",
      [labelled(YES_NO, session.alcoholAnalysisReoffending), session.alcoholAnalysisReoffendingDetails],
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

const renderAnalysisSummary = (session) => {
  const mount = document.querySelector('[data-al-analysis-summary]')
  const form = document.getElementById('san-alcohol-analysis-form')
  if (!mount || !form) return

  if (!session.alcoholComplete) {
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

const renderSummary = (session) => {
  const mount = document.querySelector('[data-al-summary]')
  if (!mount) return

  const complete = !!session.alcoholComplete
  const html = alcoholRows(session)
  const goButton = document.querySelector('[data-al-go-analysis]')

  if (!html) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="alcohol.html">Answer alcohol use questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && hasDrunkAlcohol(session) && !questionsAnswered(session)) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="alcohol-before.html">Continue</a></p>`
    }
    mount.innerHTML = `${html}${followOn}`
  }

  if (goButton) {
    const showButton = !complete && questionsAnswered(session)
    goButton.hidden = !showButton
    goButton.classList.toggle('san-go-analysis--hidden', !showButton)
  }

  renderAnalysisSummary(session)
}

const openAnalysisTab = () => {
  const tab = document.querySelector('.govuk-tabs__tab[href="#practitioner-analysis"]')
  if (tab instanceof HTMLElement) tab.click()
}

const showAnalysisForm = (focusId) => {
  const mount = document.querySelector('[data-al-analysis-summary]')
  const form = document.getElementById('san-alcohol-analysis-form')
  setHidden(mount, true)
  setHidden(form, false)
  openAnalysisTab()
  if (!focusId) return
  const target = document.getElementById(focusId)
  if (target instanceof HTMLElement) target.scrollIntoView()
}

const emptyFollowOnAnswers = () => ({
  alcoholFrequency: '',
  alcoholUnits: '',
  alcoholBinge: '',
  alcoholBingeFrequency: '',
  alcoholEvidence: '',
  alcoholCustody: '',
  alcoholCustodyDetails: '',
  alcoholPastIssues: '',
  alcoholPastIssuesDetails: '',
  alcoholReasons: [],
  alcoholReasonsDetails: '',
  alcoholImpact: [],
  alcoholImpactDetails: '',
  alcoholHelp: '',
  alcoholHelpDetails: '',
  alcoholChanges: '',
  alcoholChangesDetails: '',
  alcoholAnalysisStrengths: '',
  alcoholAnalysisStrengthsDetails: '',
  alcoholAnalysisHarm: '',
  alcoholAnalysisHarmDetails: '',
  alcoholAnalysisReoffending: '',
  alcoholAnalysisReoffendingDetails: ''
})

const emptyRecentOnlyAnswers = () => ({
  alcoholFrequency: '',
  alcoholUnits: '',
  alcoholBinge: '',
  alcoholBingeFrequency: ''
})

const readUseAnswers = () => ({
  alcoholUse: checkedValue('alcohol_use')
})

const readBeforeAnswers = (session) => {
  const recent = recentDrinking(session)
  const alcoholBinge = recent ? checkedValue('alcohol_binge') : ''
  const alcoholCustody = checkedValue('alcohol_custody')
  return {
    alcoholFrequency: recent ? checkedValue('alcohol_frequency') : '',
    alcoholUnits: recent ? checkedValue('alcohol_units') : '',
    alcoholBinge,
    alcoholBingeFrequency: alcoholBinge === 'yes' ? checkedValue('alcohol_binge_frequency') : '',
    alcoholEvidence: checkedValue('alcohol_evidence'),
    alcoholCustody,
    alcoholCustodyDetails: alcoholCustody ? fieldValue(`alcohol-custody-${alcoholCustody}-details`) : ''
  }
}

const readBackgroundAnswers = () => {
  const alcoholPastIssues = checkedValue('alcohol_past_issues')
  const alcoholHelp = checkedValue('alcohol_help')
  const alcoholChanges = checkedValue('alcohol_changes')
  const alcoholImpact = checkedValues('alcohol_impact')
  return {
    alcoholPastIssues,
    alcoholPastIssuesDetails: alcoholPastIssues === 'yes' ? fieldValue('alcohol-past-issues-yes-details') : '',
    alcoholReasons: checkedValues('alcohol_reasons'),
    alcoholReasonsDetails: fieldValue('alcohol-reasons-details'),
    alcoholImpact,
    alcoholImpactDetails: alcoholImpact.includes('other') ? fieldValue('alcohol-impact-other-details') : '',
    alcoholHelp,
    alcoholHelpDetails: alcoholHelp === 'yes' ? fieldValue('alcohol-help-yes-details') : '',
    alcoholChanges,
    alcoholChangesDetails: alcoholChanges ? fieldValue(`alcohol-changes-${alcoholChanges}-details`) : ''
  }
}

const readAnalysisAnswers = () => {
  const alcoholAnalysisStrengths = checkedValue('analysis_strengths')
  const alcoholAnalysisHarm = checkedValue('analysis_harm')
  const alcoholAnalysisReoffending = checkedValue('analysis_reoffending')
  return {
    alcoholAnalysisStrengths,
    alcoholAnalysisStrengthsDetails: alcoholAnalysisStrengths ? fieldValue(`analysis-strengths-${alcoholAnalysisStrengths}-details`) : '',
    alcoholAnalysisHarm,
    alcoholAnalysisHarmDetails: alcoholAnalysisHarm ? fieldValue(`analysis-harm-${alcoholAnalysisHarm}-details`) : '',
    alcoholAnalysisReoffending,
    alcoholAnalysisReoffendingDetails: alcoholAnalysisReoffending ? fieldValue(`analysis-reoffending-${alcoholAnalysisReoffending}-details`) : ''
  }
}

const validateUse = (answers) => {
  if (answers.alcoholUse) return []
  return [{
    group: 'alcohol-use',
    href: '#alcohol-use',
    text: 'Select if Alex has ever drunk alcohol'
  }]
}

const validateBefore = (answers, session) => {
  const errors = []
  if (recentDrinking(session)) {
    if (!answers.alcoholFrequency) {
      errors.push({
        group: 'alcohol-frequency',
        href: '#alcohol-frequency',
        text: 'Select how often Alex has drunk alcohol in the last 3 months'
      })
    }
    if (!answers.alcoholUnits) {
      errors.push({
        group: 'alcohol-units',
        href: '#alcohol-units',
        text: 'Select how many units of alcohol Alex has on a typical day of drinking'
      })
    }
    if (!answers.alcoholBinge) {
      errors.push({
        group: 'alcohol-binge',
        href: '#alcohol-binge',
        text: 'Select if Alex had 6 or more units within a single day of drinking'
      })
    } else if (answers.alcoholBinge === 'yes' && !answers.alcoholBingeFrequency) {
      errors.push({
        group: 'alcohol-binge-frequency',
        href: '#alcohol-binge-frequency',
        text: 'Select how often Alex had 6 or more units within a single day'
      })
    }
  }
  if (!answers.alcoholEvidence) {
    errors.push({
      group: 'alcohol-evidence',
      href: '#alcohol-evidence',
      text: "Select if there's evidence of binge drinking or excessive alcohol use in the last 6 months"
    })
  }
  return errors.concat(validateBackground(answers))
}

const validateBackground = (answers) => {
  const errors = []
  if (!answers.alcoholPastIssues) {
    errors.push({
      group: 'alcohol-past-issues',
      href: '#alcohol-past-issues',
      text: 'Select if Alex has any past issues with alcohol'
    })
  } else if (answers.alcoholPastIssues === 'yes' && !answers.alcoholPastIssuesDetails) {
    errors.push({
      group: 'alcohol-past-issues-yes-details',
      href: '#alcohol-past-issues-yes-details',
      text: 'Enter details about past issues with alcohol'
    })
  }
  if (!answers.alcoholReasons.length) {
    errors.push({
      group: 'alcohol-reasons',
      href: '#alcohol-reasons',
      text: 'Select why they drink alcohol'
    })
  }
  if (!answers.alcoholImpact.length) {
    errors.push({
      group: 'alcohol-impact',
      href: '#alcohol-impact',
      text: "Select the impact of them drinking alcohol, or select 'No impact'"
    })
  }
  if (!answers.alcoholHelp) {
    errors.push({
      group: 'alcohol-help',
      href: '#alcohol-help',
      text: 'Select if anything has helped them to stop or reduce drinking alcohol in the past'
    })
  } else if (answers.alcoholHelp === 'yes' && !answers.alcoholHelpDetails) {
    errors.push({
      group: 'alcohol-help-yes-details',
      href: '#alcohol-help-yes-details',
      text: 'Enter details about what helped'
    })
  }
  if (!answers.alcoholChanges) {
    errors.push({
      group: 'alcohol-changes',
      href: '#alcohol-changes',
      text: 'Select if they want to make changes to their alcohol use'
    })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['alcoholAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to alcohol use', 'Enter details about the strengths or protective factors'],
    ['alcoholAnalysisHarm', 'analysis-harm', "Select if Alex's alcohol use is linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['alcoholAnalysisReoffending', 'analysis-reoffending', "Select if Alex's alcohol use is linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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

const applyBeforePage = (session) => {
  const recentSection = document.querySelector('[data-al-recent-section]')
  const showRecent = recentDrinking(session)
  setHidden(recentSection, !showRecent)
  setHidden(document.querySelector('[data-al-recent-follow-on]'), false)
  setHidden(document.querySelector('[data-al-custody-section]'), true)
  const evidenceGroup = document.querySelector('[data-al-evidence-group]')
  if (evidenceGroup) evidenceGroup.classList.toggle('san-question', showRecent)
}

const restoreUse = (session) => {
  selectRadio('alcohol_use', session.alcoholUse)
}

const restoreBefore = (session) => {
  selectRadio('alcohol_frequency', session.alcoholFrequency)
  selectRadio('alcohol_units', session.alcoholUnits)
  selectRadio('alcohol_binge', session.alcoholBinge)
  selectRadio('alcohol_binge_frequency', session.alcoholBingeFrequency)
  selectRadio('alcohol_evidence', session.alcoholEvidence)
  selectRadio('alcohol_custody', session.alcoholCustody)
  if (session.alcoholCustody) setField(`alcohol-custody-${session.alcoholCustody}-details`, session.alcoholCustodyDetails)
  restoreBackground(session)
}

const restoreBackground = (session) => {
  selectRadio('alcohol_past_issues', session.alcoholPastIssues)
  if (session.alcoholPastIssues === 'yes') setField('alcohol-past-issues-yes-details', session.alcoholPastIssuesDetails)
  selectChecks('alcohol_reasons', session.alcoholReasons)
  setField('alcohol-reasons-details', session.alcoholReasonsDetails)
  selectChecks('alcohol_impact', session.alcoholImpact)
  setField('alcohol-impact-other-details', session.alcoholImpactDetails)
  selectRadio('alcohol_help', session.alcoholHelp)
  if (session.alcoholHelp === 'yes') setField('alcohol-help-yes-details', session.alcoholHelpDetails)
  selectRadio('alcohol_changes', session.alcoholChanges)
  if (session.alcoholChanges) setField(`alcohol-changes-${session.alcoholChanges}-details`, session.alcoholChangesDetails)
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.alcoholAnalysisStrengths)
  if (session.alcoholAnalysisStrengths) setField(`analysis-strengths-${session.alcoholAnalysisStrengths}-details`, session.alcoholAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.alcoholAnalysisHarm)
  if (session.alcoholAnalysisHarm) setField(`analysis-harm-${session.alcoholAnalysisHarm}-details`, session.alcoholAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.alcoholAnalysisReoffending)
  if (session.alcoholAnalysisReoffending) setField(`analysis-reoffending-${session.alcoholAnalysisReoffending}-details`, session.alcoholAnalysisReoffendingDetails)
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

const bindExclusiveImpact = () => {
  const none = document.getElementById('alcohol-impact-none')
  const others = document.querySelectorAll('input[name="alcohol_impact"]:not(#alcohol-impact-none)')
  if (!none) return

  none.addEventListener('change', () => {
    if (!none.checked) return
    others.forEach((input) => {
      if (input instanceof HTMLInputElement) input.checked = false
    })
    revealCheckedConditionals()
  })

  others.forEach((input) => {
    input.addEventListener('change', () => {
      if (input instanceof HTMLInputElement && input.checked) none.checked = false
    })
  })
}

const initAlcohol = () => {
  const page = document.querySelector('[data-al-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('alcohol-summary.html')

  const pageName = page.getAttribute('data-al-page')
  if (pageName === 'use') restoreUse(session)
  if (pageName === 'before') {
    if (!hasDrunkAlcohol(session)) {
      window.location.assign('alcohol.html')
      return
    }
    applyBeforePage(session)
    restoreBefore(session)
    bindExclusiveImpact()
  }
  if (pageName === 'background') {
    if (!hasDrunkAlcohol(session)) {
      window.location.assign('alcohol.html')
      return
    }
    if (!beforeAnswered(session)) {
      window.location.assign('alcohol-before.html')
      return
    }
    restoreBackground(session)
    bindExclusiveImpact()
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-al-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-al-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-al-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-al-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  const useForm = document.getElementById('san-alcohol-use-form')
  useForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readUseAnswers()
    const errors = validateUse(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previous = getSanSession()
    const updates = { ...answers, alcoholComplete: false }
    if (answers.alcoholUse !== previous.alcoholUse) {
      if (answers.alcoholUse === 'no' || !hasDrunkAlcohol({ alcoholUse: previous.alcoholUse })) {
        Object.assign(updates, emptyFollowOnAnswers())
      } else if (answers.alcoholUse === 'yes-not-in-last-3-months') {
        Object.assign(updates, emptyRecentOnlyAnswers())
      }
    }
    setSanSession(updates)
    if (answers.alcoholUse === 'no') {
      window.location.assign('alcohol-summary.html')
      return
    }
    const next = getSanSession()
    window.location.assign(fromSummary() && beforeAnswered(next) ? 'alcohol-summary.html' : 'alcohol-before.html')
  })

  const beforeForm = document.getElementById('san-alcohol-before-form')
  beforeForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const current = getSanSession()
    const answers = {
      ...readBeforeAnswers(current),
      ...readBackgroundAnswers()
    }
    const errors = validateBefore(answers, current)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, alcoholComplete: false })
    window.location.assign('alcohol-summary.html')
  })

  const backgroundForm = document.getElementById('san-alcohol-background-form')
  backgroundForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readBackgroundAnswers()
    const errors = validateBackground(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, alcoholComplete: false })
    window.location.assign('alcohol-summary.html')
  })

  const analysisForm = document.getElementById('san-alcohol-analysis-form')
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
    setSanSession({ ...answers, alcoholComplete: true })
    window.location.assign('alcohol-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initAlcohol()
})
