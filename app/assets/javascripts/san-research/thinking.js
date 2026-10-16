//
// Thinking, behaviours and attitudes — Prototype 1 (Community) Strengths and needs.
//
// Pages: thinking-behaviours.html (one question per screen) → thinking-behaviours-sexual.html
// → thinking-behaviours-sexual-harm.html if there are sexual concerns
// → thinking-behaviours-changes.html → summary.
// Hidden in this prototype: attitude towards criminal justice staff.
//

import { getSanSession, isSanResearchJourney, replaceSanSession, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, showErrors, focusTargetField, labelled, scrollToHash, CHANGES_LABELS, YES_NO, revealSoon, checkedValue, fieldValue, selectRadio, setField, setHidden, fromSummary, summaryChangeHref } from './form.js'
import { applySanProgress } from './progress.js'

// Each row: [sessionKey, stepId, inputName, question, missingError, labels].
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
  ['thinkingActivities', 'activities', 'thinking_activities', "How much do Alex's activities, relationships and lifestyle increase their likelihood of re-offending?", 'Select how much their activities, relationships and lifestyle increase their likelihood of re-offending', {
    none: 'No significant increase',
    sometimes: 'Some increase',
    significant: 'Significant increase'
  }],
  ['thinkingPeers', 'peers', 'thinking_peers', 'How much is Alex influenced by others in relation to their offending?', 'Select how much they are influenced by others in relation to their offending', {
    none: 'No significant influence',
    sometimes: 'Some influence',
    significant: 'Significant influence'
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
  ['thinkingManipulative', 'manipulative', 'thinking_manipulative', 'How much evidence is there that Alex manipulates or exploits other people for personal gain?', 'Select how much evidence there is that they manipulate or exploit other people for personal gain', {
    none: 'No evidence',
    some: 'Some evidence',
    significant: 'Significant evidence'
  }],
  ['thinkingTemper', 'temper', 'thinking_temper', 'How well does Alex manage anger, frustration and conflict?', 'Select how well they manage anger, frustration and conflict', {
    well: 'Manages these well',
    sometimes: 'Sometimes has difficulty',
    often: 'Often has difficulty'
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
  ['thinkingHostile', 'hostile', 'thinking_hostile', 'How much evidence is there that Alex shows hostility towards other people, rules or authority?', 'Select how much evidence there is that they show hostility towards other people, rules or authority', {
    none: 'No evidence',
    some: 'Some evidence',
    significant: 'Significant evidence'
  }],
  ['thinkingSupervision', 'supervision', 'thinking_supervision', 'How much evidence is there that Alex is willing to engage positively with supervision and their licence conditions?', 'Select how much evidence there is that they are willing to engage positively with supervision and their licence conditions', {
    significant: 'Significant evidence',
    some: 'Some evidence',
    none: 'Little or no evidence'
  }],
  ['thinkingExcuse', 'excuse', 'thinking_excuse', 'Does Alex support or excuse criminal behaviour?', 'Select if they support or excuse criminal behaviour', {
    no: 'Does not support or excuse criminal behaviour',
    sometimes: 'Sometimes supports or excuses criminal behaviour',
    supports: 'Supports or excuses criminal behaviour or their pattern of behaviour and other evidence indicates this is an issue'
  }]
]

// Attitude towards criminal justice staff is hidden in this prototype.
const HIDDEN_QUESTIONS = new Set(['thinkingAttitude'])
const visibleQuestions = () => QUESTIONS.filter(([key]) => !HIDDEN_QUESTIONS.has(key))

const HARM_QUESTIONS = [
  ['thinkingPreoccupation', 'preoccupation', 'thinking_preoccupation', 'Is there evidence Alex shows sexual preoccupation?', 'Select if there is evidence they show sexual preoccupation', {
    none: 'No evidence',
    some: 'Some evidence',
    significant: 'Significant evidence',
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
    none: 'Sexual thoughts or behaviours do not appear to affect their daily functioning.',
    some: 'Sexual thoughts or behaviours take up a significant amount of time, but there is evidence of other interests or attempts to reduce the behaviour.',
    significant: 'Sexual thoughts or behaviours take up a significant amount of time and have a substantial impact on their daily functioning.'
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
  thinkingPeers: 'sometimes',
  thinkingPeersDetails: 'A Martini. Shaken, Not Stirred',
  thinkingProblems: 'limited',
  thinkingViews: 'assumes',
  thinkingManipulative: 'none',
  thinkingSexualConcerns: 'yes',
  thinkingPreoccupation: 'some',
  thinkingInterests: 'no',
  thinkingIntimacy: 'no',
  thinkingTemper: 'sometimes',
  thinkingViolence: 'some',
  thinkingImpulse: 'sometimes',
  thinkingAttitude: 'negative',
  thinkingHostile: 'some',
  thinkingSupervision: 'some',
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

// Side nav ticks and resume links for every SAN section.
const applyProgress = (session) => applySanProgress(session, { current: 'thinking' })

// Journey completeness and next-page hrefs.
const questionsFormAnswered = (session) => visibleQuestions().every(([key]) => session[key])

const questionsAnswered = (session) => questionsFormAnswered(session) && !!session.thinkingChanges

const continueThinkingHref = (session) => {
  if (!questionsAnswered(session)) return 'thinking-behaviours.html'
  if (!session.thinkingSexualConcerns) return 'thinking-behaviours-sexual.html'
  if (session.thinkingSexualConcerns === 'yes' && !sexualHarmAnswered(session)) return 'thinking-behaviours-sexual-harm.html'
  return 'thinking-behaviours-summary.html'
}

const sexualHarmAnswered = (session) => {
  if (session.thinkingSexualConcerns === 'no') return true
  if (session.thinkingSexualConcerns !== 'yes') return false
  return HARM_QUESTIONS.every(([key]) => session[key])
}


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

  const parts = [`<dl class="govuk-summary-list san-summary-list">${questionRows(session, visibleQuestions(), 'thinking-behaviours')}</dl>`]

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

  if (session.thinkingChanges) {
    const lines = [labelled(CHANGES_LABELS, session.thinkingChanges)]
    if (session.thinkingChangesDetails) lines.push(session.thinkingChangesDetails)
    const changes = summaryRow(
      'Does Alex want to make changes to their thinking, behaviours and attitudes?',
      lines,
      summaryChangeHref('thinking-behaviours', 'changes'),
      { secondaryFrom: 1 }
    )
    parts.push(`<dl class="govuk-summary-list san-summary-list">${changes}</dl>`)
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

// Check-your-answers for the questions tab and analysis tab.
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
    if (!session.thinkingComplete && (!questionsAnswered(session) || !sexualHarmAnswered(session))) {
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${continueThinkingHref(session)}">Continue</a></p>`
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
  if (target instanceof HTMLElement) {
    target.scrollIntoView()
    focusTargetField(target, { preventScroll: true })
  }
}

// Read and validate the current page.
const readQuestionAnswers = () => {
  const answers = {}
  visibleQuestions().forEach(([key, id, name]) => {
    answers[key] = checkedValue(name)
    if (id === 'peers') answers.thinkingPeersDetails = fieldValue(`peers-${answers[key]}-details`)
  })
  answers.thinkingAttitude = ''
  return answers
}

const readChangesAnswers = () => {
  const thinkingChanges = checkedValue('thinking_changes')
  return {
    thinkingChanges,
    thinkingChangesDetails: ['not-present', 'not-applicable', ''].includes(thinkingChanges)
      ? ''
      : fieldValue(`changes-${thinkingChanges}-details`)
  }
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

const validateQuestions = (answers) => validateDefined(answers, visibleQuestions())

const validateChanges = (answers) => {
  if (answers.thinkingChanges) return []
  return [{
    group: 'changes',
    href: '#changes',
    text: 'Select if they want to make changes to their thinking, behaviours and attitudes'
  }]
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
  restoreChanges(session)
}

const restoreChanges = (session) => {
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

// Wire up whichever thinking page is currently loaded.
const initThinking = () => {
  const page = document.querySelector('[data-tb-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('thinking-behaviours-summary.html')

  const pageName = page.getAttribute('data-tb-page')
  if (pageName === 'questions') restoreQuestions(session)
  if (pageName === 'changes') {
    const query = fromSummary() ? '?from=summary' : ''
    window.location.assign(`thinking-behaviours.html${query}#changes`)
    return
  }
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
    const answers = { ...readQuestionAnswers(), ...readChangesAnswers() }
    const errors = [...validateQuestions(answers), ...validateChanges(answers)]
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, thinkingComplete: false })
    const next = getSanSession()
    if (fromSummary() && sexualHarmAnswered(next)) {
      window.location.assign('thinking-behaviours-summary.html')
      return
    }
    window.location.assign('thinking-behaviours-sexual.html')
  })

  document.getElementById('san-thinking-changes-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readChangesAnswers()
    const errors = validateChanges(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, thinkingComplete: false })
    window.location.assign('thinking-behaviours-summary.html')
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
  if (!isSanResearchJourney()) return
  initThinking()
})
