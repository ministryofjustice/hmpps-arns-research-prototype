//
// Alcohol use section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const YES_NO = { yes: 'Yes', no: 'No' }

const ALCOHOL_USE_LABELS = {
  significant: 'Yes, significant issues',
  some: 'Yes, some issues',
  none: 'No current issues',
  never: 'They have never drunk alcohol'
}

const currentIssues = (session) => session.alcoholUse === 'significant' || session.alcoholUse === 'some'

const noCurrentIssues = (session) => session.alcoholUse === 'none'

const neverDrunk = (session) => session.alcoholUse === 'never'

const sameIssuePath = (left, right) => currentIssues({ alcoholUse: left }) && currentIssues({ alcoholUse: right })

const EVIDENCE_LABELS = {
  none: 'No evidence of binge drinking or excessive alcohol use',
  some: 'Some evidence of binge drinking or excessive alcohol use',
  detrimental: 'Evidence of binge drinking or excessive alcohol use'
}

const EVIDENCE_HINTS = {
  some: 'There is a pattern of alcohol use but has not caused any serious problems.',
  detrimental: 'There is a detrimental effect on other areas of their life and is often directly related to offending.'
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
  alcoholUse: 'significant',
  alcoholEvidence: 'some',
  alcoholPastIssues: 'yes',
  alcoholPastIssuesDetails: "Alex's past alcohol consumption has led them to behave erratically.",
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
  applySectionProgress('offence', !!session.offenceComplete, !!session.offenceDescription, 'offence-analysis-summary.html')
}

const beforeFieldsAnswered = (session) => {
  if (!currentIssues(session)) return false
  return !!session.alcoholEvidence
}

const helpAnswered = (session) => {
  if (!session.alcoholHelp) return false
  if (session.alcoholHelp === 'yes' && !session.alcoholHelpDetails) return false
  return true
}

const needsHelp = (session) => currentIssues(session) || session.alcoholPastIssues === 'yes'

const needsChanges = (session) => needsHelp(session)

const helpQuestion = (session) => currentIssues(session)
  ? 'Does anything help Alex to stop or reduce drinking alcohol?'
  : 'Has anything helped Alex to stop or reduce drinking alcohol in the past?'

const helpPage = (session) => currentIssues(session) ? 'alcohol-help.html' : 'alcohol-help-past.html'

const pastIssuesAnswered = (session) => {
  if (!session.alcoholPastIssues) return false
  if (session.alcoholPastIssues === 'yes' && !session.alcoholPastIssuesDetails) return false
  return true
}

const backgroundFormAnswered = (session) => pastIssuesAnswered(session)

const beforeAnswered = (session) => beforeFieldsAnswered(session) && pastIssuesAnswered(session)

const backgroundAnswered = (session) => {
  if (!pastIssuesAnswered(session)) return false
  if (!needsHelp(session)) return true
  if (!helpAnswered(session)) return false
  return !!session.alcoholChanges
}

const questionsAnswered = (session) => {
  if (neverDrunk(session)) return true
  if (currentIssues(session)) return beforeAnswered(session) && helpAnswered(session) && !!session.alcoholChanges
  if (noCurrentIssues(session)) return backgroundAnswered(session)
  return false
}

const continueAlcoholHref = (session) => {
  if (currentIssues(session) && !beforeAnswered(session)) return 'alcohol-before.html'
  if (noCurrentIssues(session) && !pastIssuesAnswered(session)) return 'alcohol-background.html'
  if (needsHelp(session) && !helpAnswered(session)) return helpPage(session)
  if (needsChanges(session) && !session.alcoholChanges) return 'alcohol-changes.html'
  if (currentIssues(session)) return 'alcohol-before.html'
  if (noCurrentIssues(session)) return 'alcohol-background.html'
  return 'alcohol.html'
}

const analysisNotRequired = (session) => neverDrunk(session)

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
  if (!session.alcoholUse || !ALCOHOL_USE_LABELS[session.alcoholUse]) return ''

  const parts = [`<dl class="govuk-summary-list san-summary-list">${summaryRow(
    'Is there evidence that Alex has any current issues with alcohol?',
    [labelled(ALCOHOL_USE_LABELS, session.alcoholUse)],
    summaryChangeHref('alcohol')
  )}</dl>`]

  if (neverDrunk(session)) return parts.join('')

  if (currentIssues(session)) {
    const beforeRows = []
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

  if (currentIssues(session) && session.alcoholCustody) {
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

  const followOnPage = currentIssues(session) ? 'alcohol-before' : 'alcohol-background'
  if ((currentIssues(session) || noCurrentIssues(session)) && (backgroundAnswered(session) || session.alcoholPastIssues || session.alcoholChanges)) {
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
    if (session.alcoholHelp) {
      const lines = [labelled(YES_NO, session.alcoholHelp)]
      if (session.alcoholHelpDetails) lines.push(session.alcoholHelpDetails)
      rows.push(summaryRow(
        helpQuestion(session),
        lines,
        summaryChangeHref(helpPage(session).replace('.html', ''), 'alcohol-help'),
        { secondaryFrom: 1 }
      ))
    }
    if (session.alcoholChanges) {
      const lines = [labelled(CHANGES_LABELS, session.alcoholChanges)]
      if (session.alcoholChangesDetails) lines.push(session.alcoholChangesDetails)
      rows.push(summaryRow(
        'Does Alex want to make changes to their alcohol use?',
        lines,
        summaryChangeHref('alcohol-changes'),
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
  const notice = document.querySelector('[data-al-analysis-not-required]')
  const questions = document.querySelector('[data-al-analysis-questions]')
  if (!mount || !form) return

  if (analysisNotRequired(session)) {
    setHidden(mount, true)
    setHidden(notice, false)
    setHidden(questions, true)
    setHidden(form, !!session.alcoholComplete)
    return
  }

  setHidden(notice, true)
  setHidden(questions, false)

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
    if (!complete && !neverDrunk(session) && session.alcoholUse && !questionsAnswered(session)) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${continueAlcoholHref(session)}">Continue</a></p>`
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

const showCompletedAnalysis = () => {
  const hash = '#practitioner-analysis'
  if (window.location.hash === hash) {
    window.location.reload()
    return
  }
  window.location.assign(`alcohol-summary.html${hash}`)
}

const showAnalysisForm = (focusId) => {
  if (analysisNotRequired(getSanSession())) {
    openAnalysisTab()
    return
  }
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

const readUseAnswers = () => ({
  alcoholUse: checkedValue('alcohol_use')
})

const readBeforeAnswers = () => {
  const alcoholCustody = checkedValue('alcohol_custody')
  return {
    alcoholEvidence: checkedValue('alcohol_evidence'),
    alcoholCustody,
    alcoholCustodyDetails: alcoholCustody ? fieldValue(`alcohol-custody-${alcoholCustody}-details`) : ''
  }
}

const readBackgroundAnswers = () => {
  const alcoholPastIssues = checkedValue('alcohol_past_issues')
  return {
    alcoholPastIssues,
    alcoholPastIssuesDetails: alcoholPastIssues === 'yes' ? fieldValue('alcohol-past-issues-yes-details') : ''
  }
}

const readHelpAnswers = () => {
  const alcoholHelp = checkedValue('alcohol_help')
  return {
    alcoholHelp,
    alcoholHelpDetails: alcoholHelp === 'yes' ? fieldValue('alcohol-help-yes-details') : ''
  }
}

const readChangesAnswers = () => {
  const alcoholChanges = checkedValue('alcohol_changes')
  return {
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
    text: 'Select if there is evidence that Alex has any current issues with alcohol'
  }]
}

const validateBefore = (answers) => {
  const errors = []
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
  return errors
}

const validateHelp = (answers, presentTense) => {
  if (!answers.alcoholHelp) {
    return [{
      group: 'alcohol-help',
      href: '#alcohol-help',
      text: presentTense
        ? 'Select if anything helps Alex to stop or reduce drinking alcohol'
        : 'Select if anything has helped them to stop or reduce drinking alcohol in the past'
    }]
  }
  if (answers.alcoholHelp === 'yes' && !answers.alcoholHelpDetails) {
    return [{
      group: 'alcohol-help-yes-details',
      href: '#alcohol-help-yes-details',
      text: presentTense ? 'Enter details about what helps' : 'Enter details about what helped'
    }]
  }
  return []
}

const validateChanges = (answers) => {
  if (answers.alcoholChanges) return []
  return [{
    group: 'alcohol-changes',
    href: '#alcohol-changes',
    text: 'Select if they want to make changes to their alcohol use'
  }]
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

const applyBeforePage = () => {
  setHidden(document.querySelector('[data-al-recent-follow-on]'), false)
  setHidden(document.querySelector('[data-al-custody-section]'), true)
}

const restoreUse = (session) => {
  selectRadio('alcohol_use', session.alcoholUse)
}

const restoreBefore = (session) => {
  selectRadio('alcohol_evidence', session.alcoholEvidence)
  selectRadio('alcohol_custody', session.alcoholCustody)
  if (session.alcoholCustody) setField(`alcohol-custody-${session.alcoholCustody}-details`, session.alcoholCustodyDetails)
  restoreBackground(session)
}

const restoreBackground = (session) => {
  selectRadio('alcohol_past_issues', session.alcoholPastIssues)
  if (session.alcoholPastIssues === 'yes') setField('alcohol-past-issues-yes-details', session.alcoholPastIssuesDetails)
}

const restoreHelp = (session) => {
  selectRadio('alcohol_help', session.alcoholHelp)
  if (session.alcoholHelp === 'yes') setField('alcohol-help-yes-details', session.alcoholHelpDetails)
}

const restoreChanges = (session) => {
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

const initAlcohol = () => {
  const page = document.querySelector('[data-al-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  const pageName = page.getAttribute('data-al-page')
  if (fromSummary()) ensureBackLink('alcohol-summary.html')
  else if (pageName === 'background') ensureBackLink('alcohol.html')
  else if (pageName === 'help' && noCurrentIssues(session)) ensureBackLink('alcohol-background.html')
  else if (pageName === 'changes' && needsHelp(session)) ensureBackLink(helpPage(session))

  if (pageName === 'use') restoreUse(session)
  if (pageName === 'before') {
    if (!currentIssues(session)) {
      if (noCurrentIssues(session)) window.location.assign('alcohol-background.html')
      else if (neverDrunk(session)) window.location.assign('alcohol-summary.html')
      else window.location.assign('alcohol.html')
      return
    }
    applyBeforePage()
    restoreBefore(session)
  }
  if (pageName === 'background') {
    if (!noCurrentIssues(session) && !currentIssues(session)) {
      window.location.assign(neverDrunk(session) ? 'alcohol-summary.html' : 'alcohol.html')
      return
    }
    if (currentIssues(session)) {
      window.location.assign(beforeAnswered(session) ? helpPage(session) : 'alcohol-before.html')
      return
    }
    restoreBackground(session)
  }
  if (pageName === 'help') {
    if (!currentIssues(session) && !noCurrentIssues(session)) {
      window.location.assign(neverDrunk(session) ? 'alcohol-summary.html' : 'alcohol.html')
      return
    }
    if (currentIssues(session) && !beforeAnswered(session)) {
      window.location.assign('alcohol-before.html')
      return
    }
    if (noCurrentIssues(session) && !needsHelp(session)) {
      window.location.assign(session.alcoholPastIssues === 'no' ? 'alcohol-summary.html' : 'alcohol-background.html')
      return
    }
    const expectedHelp = helpPage(session)
    const currentHelp = page.getAttribute('data-al-help-version') === 'present' ? 'alcohol-help.html' : 'alcohol-help-past.html'
    if (currentHelp !== expectedHelp) {
      window.location.assign(fromSummary() ? `${expectedHelp}?from=summary` : expectedHelp)
      return
    }
    restoreHelp(session)
  }
  if (pageName === 'changes') {
    if (!currentIssues(session) && !noCurrentIssues(session)) {
      window.location.assign(neverDrunk(session) ? 'alcohol-summary.html' : 'alcohol.html')
      return
    }
    if (currentIssues(session) && !beforeAnswered(session)) {
      window.location.assign('alcohol-before.html')
      return
    }
    if (noCurrentIssues(session) && !needsChanges(session)) {
      window.location.assign(session.alcoholPastIssues === 'no' ? 'alcohol-summary.html' : 'alcohol-background.html')
      return
    }
    if (noCurrentIssues(session) && !pastIssuesAnswered(session)) {
      window.location.assign('alcohol-background.html')
      return
    }
    if (needsHelp(session) && !helpAnswered(session)) {
      window.location.assign(helpPage(session))
      return
    }
    restoreChanges(session)
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
    if (answers.alcoholUse !== previous.alcoholUse && !sameIssuePath(answers.alcoholUse, previous.alcoholUse)) {
      Object.assign(updates, emptyFollowOnAnswers())
    }
    setSanSession(updates)
    if (neverDrunk(answers)) {
      window.location.assign('alcohol-summary.html')
      return
    }
    const next = getSanSession()
    if (fromSummary() && questionsAnswered(next)) {
      window.location.assign('alcohol-summary.html')
      return
    }
    window.location.assign(continueAlcoholHref(next))
  })

  const beforeForm = document.getElementById('san-alcohol-before-form')
  beforeForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = {
      ...readBeforeAnswers(),
      ...readBackgroundAnswers()
    }
    const errors = validateBefore(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, alcoholComplete: false })
    const next = getSanSession()
    if (fromSummary() && questionsAnswered(next)) {
      window.location.assign('alcohol-summary.html')
      return
    }
    window.location.assign(helpPage(next))
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
    if (answers.alcoholPastIssues === 'no') {
      Object.assign(answers, {
        alcoholHelp: '',
        alcoholHelpDetails: '',
        alcoholChanges: '',
        alcoholChangesDetails: ''
      })
    }
    setSanSession({ ...answers, alcoholComplete: false })
    const next = getSanSession()
    if (fromSummary() && questionsAnswered(next)) {
      window.location.assign('alcohol-summary.html')
      return
    }
    window.location.assign(needsHelp(next) ? helpPage(next) : 'alcohol-summary.html')
  })

  const helpForm = document.getElementById('san-alcohol-help-form')
  helpForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readHelpAnswers()
    const errors = validateHelp(answers, currentIssues(getSanSession()))
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, alcoholComplete: false })
    window.location.assign(fromSummary() && getSanSession().alcoholChanges ? 'alcohol-summary.html' : 'alcohol-changes.html')
  })

  const changesForm = document.getElementById('san-alcohol-changes-form')
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
    setSanSession({ ...answers, alcoholComplete: false })
    window.location.assign('alcohol-summary.html')
  })

  const analysisForm = document.getElementById('san-alcohol-analysis-form')
  analysisForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (analysisNotRequired(getSanSession())) {
      clearErrors()
      setSanSession({ alcoholComplete: true })
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
    setSanSession({ ...answers, alcoholComplete: true })
    showCompletedAnalysis()
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.startsWith("/san-research/")) return
  initAlcohol()
})
