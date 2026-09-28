//
// Thinking, behaviours and attitudes section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const YES_NO = { yes: 'Yes', no: 'No' }

const QUESTIONS = [
  ['thinkingConsequences', 'consequences', 'thinking_consequences', 'Is Alex aware of the consequences of their actions?', 'Select if they are aware of the consequences of their actions', {
    yes: 'Yes, is aware of the consequences of their actions',
    sometimes: 'Sometimes is aware of the consequences of their actions',
    no: 'No, is not aware of the consequences of their actions'
  }],
  ['thinkingStable', 'stable', 'thinking_stable', 'Does Alex show stable behaviour?', 'Select if they show stable behaviour', {
    yes: 'Yes, shows stable behaviour',
    sometimes: 'Sometimes shows stable behaviour but can show reckless or risk taking behaviours',
    no: 'No, shows reckless or risk taking behaviours'
  }],
  ['thinkingActivities', 'activities', 'thinking_activities', 'Does Alex engage in activities that could link to offending?', 'Select if they engage in activities that could link to offending', {
    prosocial: 'Engages in pro-social activities and understands the link to offending',
    sometimes: 'Sometimes engages in activities linked to offending but recognises the link',
    regularly: 'Regularly engages in activities which encourage offending and is not aware or does not care about the link to offending'
  }],
  ['thinkingPeers', 'peers', 'thinking_peers', 'Is Alex resilient towards peer pressure or influence by criminal associates?', 'Select if they are resilient towards peer pressure or influence by criminal associates', {
    yes: 'Yes, resilient towards peer pressure or influence by criminal associates',
    past: 'Has been peer pressured or influenced by criminal associates in the past but recognises the link to their offending',
    no: 'No, constantly peer pressured or influenced by criminal associates which is linked to their offending'
  }],
  ['thinkingProblems', 'problems', 'thinking_problems', 'Is Alex able to solve problems in a positive way?', 'Select if they are able to solve problems in a positive way', {
    yes: 'Yes, is able to solve problems and identify appropriate solutions',
    limited: 'Has limited problem solving skills',
    no: 'No, has poor problem solving skills and is unable to identify what steps to take to solve a problem'
  }],
  ['thinkingViews', 'views', 'thinking_views', "Does Alex understand other people's views?", "Select if they understand other people's views", {
    yes: "Yes, understands other people's views and is able to distinguish between their own feelings and those of others",
    assumes: "Assumes all views are the same as theirs at first but does consider other people's views to an extent",
    no: "No, unable to understand other people's views and distinguish between their own feelings and those of others"
  }],
  ['thinkingManipulative', 'manipulative', 'thinking_manipulative', 'Does Alex show manipulative behaviour or a predatory lifestyle?', 'Select if they show manipulative behaviour or a predatory lifestyle', {
    honest: 'Generally gives an honest account of their lives and has no history of showing manipulative behaviour or a predatory lifestyle',
    some: 'Some evidence that they show manipulative behaviour or act in a predatory way towards certain individuals',
    pattern: 'Shows a pattern of manipulative behaviour or a predatory lifestyle'
  }],
  ['thinkingTemper', 'temper', 'thinking_temper', 'Is Alex able to manage their temper?', 'Select if they are able to manage their temper', {
    yes: 'Yes, is able to manage their temper well',
    sometimes: 'Sometimes has outbreaks of uncontrolled anger',
    no: 'No, easily loses their temper'
  }],
  ['thinkingViolence', 'violence', 'thinking_violence', 'Does Alex use violence, aggressive or controlling behaviour to get their own way?', 'Select if they use violence, aggressive or controlling behaviour to get their own way', {
    no: 'Does not use violence, aggressive or controlling behaviour to get their own way',
    some: 'Some evidence of using violence, aggressive or controlling behaviour to get their own way',
    patterns: 'Patterns of using violence, aggressive or controlling behaviour to get their own way'
  }],
  ['thinkingImpulse', 'impulse', 'thinking_impulse', 'Does Alex act on impulse?', 'Select if they act on impulse', {
    considers: 'Considers all aspects of a situation before acting on or making a decision',
    sometimes: 'Sometimes acts on impulse which causes problems',
    significant: 'Acts on impulse which causes significant problems'
  }],
  ['thinkingAttitude', 'attitude', 'thinking_attitude', 'Does Alex have a positive attitude towards any criminal justice staff they have come into contact with?', 'Select if they have a positive attitude towards criminal justice staff', {
    yes: 'Yes, has a positive attitude',
    negative: 'Has a negative attitude or does not fully engage but there are no safety concerns',
    no: 'No, has a negative attitude and there are safety concerns'
  }],
  ['thinkingHostile', 'hostile', 'thinking_hostile', 'Does Alex have hostile orientation to others or to general rules?', 'Select if they have hostile orientation to others or to general rules', {
    constructive: "They're able to have constructive conversations when they disagree with others and can forgive past wrongs",
    some: 'Some evidence of suspicious, angry or vengeful thinking and behaviour',
    evidence: 'There is evidence of suspicious, angry and vengeful thinking and behaviour'
  }],
  ['thinkingSupervision', 'supervision', 'thinking_supervision', 'Does Alex accept supervision and their licence conditions?', 'Select if they accept supervision and their licence conditions', {
    accepts: 'Accepts supervision and has responded well to supervision in the past',
    unsure: 'Unsure about supervision and has put minimum effort into supervision in the past',
    not: 'Not prepared to accept supervision and has failed to follow supervision in the past'
  }],
  ['thinkingExcuse', 'excuse', 'thinking_excuse', 'Does Alex support or excuse criminal behaviour?', 'Select if they support or excuse criminal behaviour', {
    no: 'Does not support or excuse criminal behaviour',
    sometimes: 'Sometimes supports or excuses criminal behaviour',
    supports: 'Supports or excuses criminal behaviour or their pattern of behaviour and other evidence indicates this is an issue'
  }]
]

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

const HARM_QUESTIONS = [
  ['thinkingPreoccupation', 'preoccupation', 'thinking_preoccupation', 'Is there evidence Alex shows sexual preoccupation?', 'Select if there is evidence they show sexual preoccupation', {
    yes: 'Yes, the amount of time they spend engaging in sexual activity or thinking about sex is unhealthy and is impacting their day-to-day life',
    some: 'Shows some evidence of improving their day-to-day life but still spends a significant amount of time preoccupied with sex',
    no: 'No, the amount of time they spend engaging in sexual activity or thinking about sex is healthy and is balanced alongside all other important areas of their life',
    unknown: 'Unknown'
  }],
  ['thinkingInterests', 'interests', 'thinking_interests', 'Is there evidence Alex has offence-related sexual interests?', 'Select if there is evidence they have offence-related sexual interests', {
    yes: 'Yes, there are recurrent and persistent patterns of a preference for sexual activity that is illegal or harmful and no evidence of healthy sexual interests',
    some: 'Shows some evidence of healthy sexual activity including consensual sex but shows behaviour that is recurrent and persistent or an interest in sexual activity that is illegal or harmful',
    no: 'No, they have healthy sexual interests rather than a preference for sexual activity that is illegal or harmful',
    unknown: 'Unknown'
  }],
  ['thinkingIntimacy', 'intimacy', 'thinking_intimacy', 'Is there evidence Alex finds it easier to seek emotional intimacy with children over adults?', 'Select if there is evidence they find it easier to seek emotional intimacy with children over adults', {
    yes: 'Yes, they find it easier to seek emotional intimacy with children and have significant difficulty forming intimate relationships with adults',
    some: 'Shows some evidence of having or wanting stable adult relationships but finds it easier to seek emotional intimacy with children over adults',
    no: 'No, they have or have had an intimate relationship with an adult that they value or have the skills, ability and desire to form stable relationships',
    unknown: 'Unknown'
  }]
]

const HARM_HINTS = {
  thinkingPreoccupation: {
    no: 'This includes behaviours like masturbating regularly, having casual sex or using pornography to meet their needs in a healthy way.'
  },
  thinkingInterests: {
    yes: 'They are strongly aroused by illegal harmful sexual acts with little or no interest in consensual sex.',
    no: 'While offending, they may have engaged in sexual activity that is illegal but their preferred route to meeting their sexual needs is both legal and consensual.'
  }
}

const EXAMPLE_COMPLETE = {
  thinkingConsequences: 'yes',
  thinkingStable: 'sometimes',
  thinkingActivities: 'sometimes',
  thinkingPeers: 'past',
  thinkingPeersDetails: 'A Martini. Shaken, Not Stirred',
  thinkingProblems: 'limited',
  thinkingViews: 'assumes',
  thinkingManipulative: 'honest',
  thinkingSexualConcerns: 'yes',
  thinkingPreoccupation: 'some',
  thinkingInterests: 'no',
  thinkingIntimacy: 'no',
  thinkingTemper: 'sometimes',
  thinkingViolence: 'some',
  thinkingImpulse: 'sometimes',
  thinkingAttitude: 'negative',
  thinkingHostile: 'some',
  thinkingSupervision: 'unsure',
  thinkingExcuse: 'sometimes',
  thinkingChanges: 'thinking',
  thinkingChangesDetails: 'A Martini. Shaken, Not Stirred',
  thinkingAnalysisStrengths: 'yes',
  thinkingAnalysisStrengthsDetails: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  thinkingAnalysisHarm: 'yes',
  thinkingAnalysisHarmDetails: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  thinkingAnalysisReoffending: 'yes',
  thinkingAnalysisReoffendingDetails: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  thinkingComplete: true
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
  const complete = !!session.thinkingComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  applySectionProgress('thinking', complete, !!session.thinkingConsequences, 'thinking-behaviours-summary.html')
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
  applySectionProgress('health', !!session.healthComplete, !!session.healthPhysical, 'health-summary.html')
  applySectionProgress('relationships', !!session.relationshipsComplete, !!Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0, 'personal-relationships-summary.html')
}

const questionsAnswered = (session) => QUESTIONS.every(([key]) => session[key]) && !!session.thinkingChanges

const sexualHarmAnswered = (session) => {
  if (session.thinkingSexualConcerns === 'no') return true
  if (session.thinkingSexualConcerns !== 'yes') return false
  return HARM_QUESTIONS.every(([key]) => session[key])
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
  const editAttribute = editTarget ? ` data-tb-edit-analysis="${escapeHtml(editTarget)}"` : ''
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value || 'Not provided'}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const questionRows = (session, definitions, page) => definitions.map(([key, id, , question, , labels]) => {
  if (!session[key]) return ''
  const lines = [labelled(labels, session[key])]
  if (key === 'thinkingPeers' && session.thinkingPeersDetails) lines.push(session.thinkingPeersDetails)
  const hint = (HARM_HINTS[key] || {})[session[key]]
  if (hint) lines.push(hint)
  return summaryRow(question, lines, summaryChangeHref(page, id), lines.length > 1 ? { secondaryFrom: 1 } : {})
}).join('')

const thinkingRows = (session) => {
  if (!session.thinkingConsequences) return ''

  const beforeSexual = QUESTIONS.filter((item) => ['thinkingTemper', 'thinkingViolence', 'thinkingImpulse', 'thinkingAttitude', 'thinkingHostile', 'thinkingSupervision', 'thinkingExcuse'].indexOf(item[0]) === -1)
  const afterSexual = QUESTIONS.filter((item) => ['thinkingTemper', 'thinkingViolence', 'thinkingImpulse', 'thinkingAttitude', 'thinkingHostile', 'thinkingSupervision', 'thinkingExcuse'].indexOf(item[0]) !== -1)

  const parts = [`<dl class="govuk-summary-list san-summary-list">${questionRows(session, beforeSexual, 'thinking-behaviours')}</dl>`]

  if (session.thinkingSexualConcerns) {
    const sexualRows = [
      summaryRow(
        'Are there any concerns that Alex poses a risk of sexual harm to others?',
        [labelled(YES_NO, session.thinkingSexualConcerns)],
        summaryChangeHref('thinking-behaviours-sexual', 'sexual-concerns')
      )
    ]
    if (session.thinkingSexualConcerns === 'yes') {
      sexualRows.push(questionRows(session, HARM_QUESTIONS, 'thinking-behaviours-sexual-harm'))
    }
    parts.push(`<dl class="govuk-summary-list san-summary-list">${sexualRows.join('')}</dl>`)
  }

  const later = questionRows(session, afterSexual, 'thinking-behaviours')
  if (session.thinkingChanges) {
    const lines = [labelled(CHANGES_LABELS, session.thinkingChanges)]
    if (session.thinkingChangesDetails) lines.push(session.thinkingChangesDetails)
    const changes = summaryRow(
      'Does Alex want to make changes to their thinking, behaviours and attitudes?',
      lines,
      summaryChangeHref('thinking-behaviours', 'changes'),
      { secondaryFrom: 1 }
    )
    parts.push(`<dl class="govuk-summary-list san-summary-list">${later}${changes}</dl>`)
  } else if (later) {
    parts.push(`<dl class="govuk-summary-list san-summary-list">${later}</dl>`)
  }

  return parts.join('')
}

const analysisRows = (session) => {
  const rows = []
  if (session.thinkingAnalysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's thinking, behaviours and attitudes?",
      [labelled(YES_NO, session.thinkingAnalysisStrengths), session.thinkingAnalysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.thinkingAnalysisHarm) {
    rows.push(summaryRow(
      "Is Alex's thinking, behaviours and attitudes linked to risk of serious harm?",
      [labelled(YES_NO, session.thinkingAnalysisHarm), session.thinkingAnalysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.thinkingAnalysisReoffending) {
    rows.push(summaryRow(
      "Is Alex's thinking, behaviours and attitudes linked to risk of reoffending?",
      [labelled(YES_NO, session.thinkingAnalysisReoffending), session.thinkingAnalysisReoffendingDetails],
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
  const mount = document.querySelector('[data-tb-analysis-summary]')
  const form = document.getElementById('san-thinking-analysis-form')
  if (!mount || !form) return

  if (!session.thinkingComplete) {
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
  const mount = document.querySelector('[data-tb-summary]')
  if (!mount) return

  const html = thinkingRows(session)
  const goButton = document.querySelector('[data-tb-go-analysis]')

  if (!html) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="thinking-behaviours.html">Answer thinking, behaviours and attitudes questions</a></p>`
  } else {
    let followOn = ''
    if (!session.thinkingComplete && questionsAnswered(session) && !sexualHarmAnswered(session)) {
      const href = session.thinkingSexualConcerns === 'yes' ? 'thinking-behaviours-sexual-harm.html' : 'thinking-behaviours-sexual.html'
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${href}">Continue</a></p>`
    }
    mount.innerHTML = `${html}${followOn}`
  }

  if (goButton) {
    const showButton = !session.thinkingComplete && questionsAnswered(session) && sexualHarmAnswered(session)
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
  const mount = document.querySelector('[data-tb-analysis-summary]')
  const form = document.getElementById('san-thinking-analysis-form')
  setHidden(mount, true)
  setHidden(form, false)
  openAnalysisTab()
  if (!focusId) return
  const target = document.getElementById(focusId)
  if (target instanceof HTMLElement) target.scrollIntoView()
}

const readQuestionAnswers = () => {
  const answers = {}
  QUESTIONS.forEach(([key, id, name]) => {
    answers[key] = checkedValue(name)
    if (id === 'peers') answers.thinkingPeersDetails = fieldValue(`peers-${answers[key]}-details`)
  })
  answers.thinkingChanges = checkedValue('thinking_changes')
  answers.thinkingChangesDetails = ['not-present', 'not-applicable', ''].includes(answers.thinkingChanges)
    ? ''
    : fieldValue(`changes-${answers.thinkingChanges}-details`)
  return answers
}

const readHarmAnswers = () => {
  const answers = {}
  HARM_QUESTIONS.forEach(([key, , name]) => {
    answers[key] = checkedValue(name)
  })
  return answers
}

const emptyHarmAnswers = () => ({
  thinkingPreoccupation: '',
  thinkingInterests: '',
  thinkingIntimacy: ''
})

const validateDefined = (answers, definitions) => definitions.reduce((errors, [key, id, , , missing]) => {
  if (!answers[key]) errors.push({ group: id, href: `#${id}`, text: missing })
  return errors
}, [])

const validateQuestions = (answers) => {
  const errors = validateDefined(answers, QUESTIONS)
  if (!answers.thinkingChanges) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if they want to make changes to their thinking, behaviours and attitudes'
    })
  }
  return errors
}

const validateSexual = (answers) => {
  if (answers.thinkingSexualConcerns) return []
  return [{
    group: 'sexual-concerns',
    href: '#sexual-concerns',
    text: 'Select if there are any concerns that they pose a risk of sexual harm to others'
  }]
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['thinkingAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to thinking, behaviours and attitudes', 'Enter details about the strengths or protective factors'],
    ['thinkingAnalysisHarm', 'analysis-harm', "Select if Alex's thinking, behaviours and attitudes are linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['thinkingAnalysisReoffending', 'analysis-reoffending', "Select if Alex's thinking, behaviours and attitudes are linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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
  QUESTIONS.forEach(([key, id, name]) => {
    selectRadio(name, session[key])
    if (id === 'peers' && session.thinkingPeers) setField(`peers-${session.thinkingPeers}-details`, session.thinkingPeersDetails)
  })
  selectRadio('thinking_changes', session.thinkingChanges)
  if (session.thinkingChanges) setField(`changes-${session.thinkingChanges}-details`, session.thinkingChangesDetails)
}

const restoreHarm = (session) => {
  HARM_QUESTIONS.forEach(([key, , name]) => selectRadio(name, session[key]))
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.thinkingAnalysisStrengths)
  if (session.thinkingAnalysisStrengths) setField(`analysis-strengths-${session.thinkingAnalysisStrengths}-details`, session.thinkingAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.thinkingAnalysisHarm)
  if (session.thinkingAnalysisHarm) setField(`analysis-harm-${session.thinkingAnalysisHarm}-details`, session.thinkingAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.thinkingAnalysisReoffending)
  if (session.thinkingAnalysisReoffending) setField(`analysis-reoffending-${session.thinkingAnalysisReoffending}-details`, session.thinkingAnalysisReoffendingDetails)
}

const readAnalysisAnswers = () => {
  const strengths = checkedValue('analysis_strengths')
  const harm = checkedValue('analysis_harm')
  const reoffending = checkedValue('analysis_reoffending')
  return {
    thinkingAnalysisStrengths: strengths,
    thinkingAnalysisStrengthsDetails: fieldValue(`analysis-strengths-${strengths}-details`),
    thinkingAnalysisHarm: harm,
    thinkingAnalysisHarmDetails: fieldValue(`analysis-harm-${harm}-details`),
    thinkingAnalysisReoffending: reoffending,
    thinkingAnalysisReoffendingDetails: fieldValue(`analysis-reoffending-${reoffending}-details`)
  }
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

const initThinking = () => {
  const page = document.querySelector('[data-tb-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('thinking-behaviours-summary.html')

  const pageName = page.getAttribute('data-tb-page')
  if (pageName === 'questions') restoreQuestions(session)
  if (pageName === 'sexual') {
    if (!questionsAnswered(session)) {
      window.location.assign('thinking-behaviours.html')
      return
    }
    selectRadio('thinking_sexual_concerns', session.thinkingSexualConcerns)
  }
  if (pageName === 'sexual-harm') {
    if (!questionsAnswered(session)) {
      window.location.assign('thinking-behaviours.html')
      return
    }
    if (session.thinkingSexualConcerns !== 'yes') {
      window.location.assign('thinking-behaviours-sexual.html')
      return
    }
    restoreHarm(session)
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-tb-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-tb-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-tb-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-tb-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  document.getElementById('san-thinking-questions-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readQuestionAnswers()
    const errors = validateQuestions(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, thinkingComplete: false })
    const next = getSanSession()
    window.location.assign(fromSummary() && sexualHarmAnswered(next) ? 'thinking-behaviours-summary.html' : 'thinking-behaviours-sexual.html')
  })

  document.getElementById('san-thinking-sexual-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const answers = { thinkingSexualConcerns: checkedValue('thinking_sexual_concerns') }
    const errors = validateSexual(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const updates = { ...answers, thinkingComplete: false }
    if (answers.thinkingSexualConcerns !== 'yes') Object.assign(updates, emptyHarmAnswers())
    setSanSession(updates)
    if (answers.thinkingSexualConcerns === 'yes') {
      const next = getSanSession()
      window.location.assign(fromSummary() && sexualHarmAnswered(next) ? 'thinking-behaviours-summary.html' : 'thinking-behaviours-sexual-harm.html')
      return
    }
    window.location.assign('thinking-behaviours-summary.html')
  })

  document.getElementById('san-thinking-sexual-harm-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const answers = readHarmAnswers()
    const errors = validateDefined(answers, HARM_QUESTIONS)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, thinkingComplete: false })
    window.location.assign('thinking-behaviours-summary.html')
  })

  document.getElementById('san-thinking-analysis-form')?.addEventListener('submit', (event) => {
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
    setSanSession({ ...answers, thinkingComplete: true })
    window.location.assign('thinking-behaviours-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initThinking()
})
