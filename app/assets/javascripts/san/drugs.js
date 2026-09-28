//
// Drug use section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const DRUG_LABELS = {
  amphetamines: 'Amphetamines (including speed, methamphetamine)',
  benzodiazepines: 'Benzodiazepines (including diazepam, temazepam)',
  cannabis: 'Cannabis',
  cocaine: 'Cocaine',
  'crack-cocaine': 'Crack cocaine',
  ecstasy: 'Ecstasy (MDMA)',
  hallucinogens: 'Hallucinogens',
  heroin: 'Heroin',
  ketamine: 'Ketamine',
  methadone: 'Methadone (not prescribed)',
  'prescribed-drugs': 'Prescribed drugs',
  'other-opiates': 'Other opiates',
  solvents: 'Solvents (including gases and glues)',
  steroids: 'Steroids',
  'synthetic-cannabinoids': 'Synthetic cannabinoids (spice)',
  other: 'Other'
}

const DRUG_IDS = Object.keys(DRUG_LABELS)

const LAST_USED_LABELS = {
  'last-six': 'In the last 6 months',
  'more-than-six': 'Used more than 6 months ago'
}

const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  occasionally: 'Occasionally',
  unknown: 'Unknown'
}

const INJECTED_WHEN_LABELS = {
  'last-six': 'In the 6 months before custody',
  'more-than-six': 'More than 6 months before custody'
}

const YES_NO = { yes: 'Yes', no: 'No' }

const MOTIVATION_LABELS = {
  'does-not-show': 'Does not show motivation to stop or reduce',
  some: 'Shows some motivation to stop or reduce',
  motivated: 'Motivated to stop or reduce',
  unknown: 'Unknown'
}

const WHY_LABELS = {
  cultural: 'Cultural or religious practice',
  curiosity: 'Curiosity or experimentation',
  performance: 'Enhance performance',
  escapism: 'Escapism or avoidance',
  stress: 'Manage stress or emotional issues',
  'peer-pressure': 'Peer pressure or social influence',
  recreation: 'Recreation or pleasure',
  'self-medication': 'Self-medication',
  other: 'Other'
}

const AFFECT_LABELS = {
  behaviour: 'Behaviour',
  community: 'Community',
  finances: 'Finances',
  offending: 'Links to offending',
  health: 'Physical or mental health',
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

const EXAMPLE_COMPLETE = {
  drugUse: 'yes',
  drugTypes: ['heroin', 'cannabis', 'hallucinogens'],
  drugLastUsed: {
    heroin: 'last-six',
    cannabis: 'more-than-six',
    hallucinogens: 'more-than-six'
  },
  otherDrugDetails: '',
  drugFrequency: { heroin: 'occasionally' },
  drugFrequencyDetails: {},
  olderDrugDetails: '',
  injectedDrugs: ['heroin'],
  injectedWhen: { heroin: ['last-six'] },
  drugsInCustody: 'yes',
  drugsInCustodyDetails: 'There are reports from prison staff that Alex has been using drugs in custody.',
  treatment: 'no',
  treatmentDetails: '',
  whyDrugUse: ['curiosity'],
  whyDetails: '',
  drugAffect: ['behaviour'],
  affectDetails: '',
  helpedReduce: '',
  drugChanges: 'active',
  drugChangesDetails: '',
  drugAnalysisMotivation: 'unknown',
  drugAnalysisStrengths: 'no',
  drugAnalysisStrengthsDetails: '',
  drugAnalysisHarm: 'no',
  drugAnalysisHarmDetails: '',
  drugAnalysisReoffending: 'no',
  drugAnalysisReoffendingDetails: '',
  drugComplete: true
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
    const controls = fieldset ? fieldset.querySelector('.govuk-radios, .govuk-checkboxes, .govuk-hint, p') : null
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
  const complete = !!session.drugComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  document.querySelectorAll('[data-section-complete="drugs"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  const link = document.querySelector('[data-san-section-link="drugs"]')
  if (link && session.drugUse) {
    link.setAttribute('href', sectionLinkHref('drugs', 'drugs-summary.html'))
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

  document.querySelectorAll('[data-section-complete="finances"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.financeComplete)
  })
  const financesLink = document.querySelector('[data-san-section-link="finances"]')
  if (financesLink && Array.isArray(session.financeIncome) && session.financeIncome.length) {
    financesLink.setAttribute('href', sectionLinkHref('finances', 'finances-summary.html'))
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

const selectedDrugs = (session) => (Array.isArray(session.drugTypes) ? session.drugTypes : [])

const lastUsedFor = (session, id) => (session.drugLastUsed && session.drugLastUsed[id]) || ''

const recentDrugs = (session) => selectedDrugs(session).filter((id) => lastUsedFor(session, id) === 'last-six')

const olderDrugs = (session) => selectedDrugs(session).filter((id) => lastUsedFor(session, id) === 'more-than-six')

const typesAnswered = (session) => {
  const types = selectedDrugs(session)
  if (!types.length) return false
  if (types.includes('other') && !session.otherDrugDetails) return false
  return types.every((id) => lastUsedFor(session, id))
}

const beforeAnswered = (session) => {
  if (!typesAnswered(session)) return false
  if (recentDrugs(session).some((id) => !(session.drugFrequency && session.drugFrequency[id]))) return false
  if (!(Array.isArray(session.injectedDrugs) && session.injectedDrugs.length)) return false
  if (session.injectedDrugs.some((id) => {
    if (id === 'none') return false
    return !(Array.isArray(session.injectedWhen && session.injectedWhen[id]) && session.injectedWhen[id].length)
  })) return false
  return true
}

const backgroundAnswered = (session) => {
  if (!session.treatment) return false
  if (session.treatment === 'yes' && !session.treatmentDetails) return false
  if (!(Array.isArray(session.whyDrugUse) && session.whyDrugUse.length)) return false
  if (!(Array.isArray(session.drugAffect) && session.drugAffect.length)) return false
  if (!session.drugChanges) return false
  if (session.drugChanges === 'not-present' && !session.drugChangesDetails) return false
  return true
}

const questionsAnswered = (session) => {
  if (session.drugUse === 'no') return true
  if (session.drugUse !== 'yes') return false
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
  }).join('<br>')
  const editTarget = href.startsWith('#analysis-') ? href.slice(1) : ''
  const linkHref = editTarget ? '#practitioner-analysis' : href
  const editAttribute = editTarget ? ` data-du-edit-analysis="${escapeHtml(editTarget)}"` : ''
  const display = value || (options.blankIfEmpty ? '' : 'Not provided')
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${display}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const drugCard = (session, id) => {
  const lastUsed = lastUsedFor(session, id)
  const rows = [summaryRow(
    'Last used',
    [labelled(LAST_USED_LABELS, lastUsed)],
      summaryChangeHref('drugs-types')
  )]

  if (lastUsed === 'last-six') {
    const frequency = session.drugFrequency && session.drugFrequency[id]
    const details = session.drugFrequencyDetails && session.drugFrequencyDetails[id]
    rows.push(summaryRow(
      'How often',
      [labelled(FREQUENCY_LABELS, frequency)],
      summaryChangeHref('drugs-before', `frequency-${id}`)
    ))
    rows.push(summaryRow(
      'Give details (optional)',
      [details],
      summaryChangeHref('drugs-before', `frequency-${id}`),
      { blankIfEmpty: true }
    ))

    const injected = Array.isArray(session.injectedDrugs) && session.injectedDrugs.includes(id)
    const when = injected && session.injectedWhen && session.injectedWhen[id]
    const injectLines = injected
      ? ['Yes', ...(Array.isArray(when) ? when.map((value) => labelled(INJECTED_WHEN_LABELS, value)) : [])]
      : ['No']
    rows.push(summaryRow(
      'Injected',
      injectLines,
      summaryChangeHref('drugs-before', 'injected')
    ))
  }

  return `<div class="govuk-summary-card">
    <div class="govuk-summary-card__title-wrapper">
      <h3 class="govuk-summary-card__title">${escapeHtml(DRUG_LABELS[id] || id)}</h3>
      <ul class="govuk-summary-card__actions">
        <li class="govuk-summary-card__action">
          <a class="govuk-link" href="${summaryChangeHref('drugs-types')}">Change<span class="govuk-visually-hidden"> (${escapeHtml(DRUG_LABELS[id] || id)})</span></a>
        </li>
      </ul>
    </div>
    <div class="govuk-summary-card__content">
      <dl class="govuk-summary-list">${rows.join('')}</dl>
    </div>
  </div>`
}

const drugRows = (session) => {
  if (session.drugUse === 'no') {
    return `<dl class="govuk-summary-list san-summary-list">${summaryRow(
      'Has Alex ever misused drugs?',
      ['No'],
      summaryChangeHref('drugs')
    )}</dl>`
  }

  if (session.drugUse !== 'yes') return ''

  const parts = [`<dl class="govuk-summary-list san-summary-list">${summaryRow(
    'Has Alex ever misused drugs?',
    ['Yes'],
    summaryChangeHref('drugs')
  )}</dl>`]

  const recent = recentDrugs(session)
  const older = olderDrugs(session)

  if (recent.length) {
    parts.push('<h3 class="govuk-heading-m">Used in the last 6 months</h3>')
    parts.push(recent.map((id) => drugCard(session, id)).join(''))
  }

  if (older.length) {
    parts.push('<h3 class="govuk-heading-m">Not used in the 6 months</h3>')
    parts.push(older.map((id) => drugCard(session, id)).join(''))
    parts.push(`<dl class="govuk-summary-list san-summary-list">${summaryRow(
      "Give details about Alex's use of these drugs",
      [session.olderDrugDetails],
      summaryChangeHref('drugs-before', 'older-drug-details'),
      { blankIfEmpty: true }
    )}</dl>`)
  }

  if (session.treatment || (Array.isArray(session.whyDrugUse) && session.whyDrugUse.length) || session.drugChanges) {
    parts.push('<h3 class="govuk-heading-m">More information</h3>')
    const rows = []
    if (session.treatment) {
      const lines = [labelled(YES_NO, session.treatment)]
      if (session.treatmentDetails) lines.push(session.treatmentDetails)
      rows.push(summaryRow(
        'Is Alex receiving treatment for their drug use?',
        lines,
        summaryChangeHref('drugs-background', 'treatment'),
        { secondaryFrom: 1 }
      ))
    }
    if (Array.isArray(session.whyDrugUse) && session.whyDrugUse.length) {
      const lines = session.whyDrugUse.map((value) => labelled(WHY_LABELS, value))
      if (session.whyDetails) lines.push(session.whyDetails)
      rows.push(summaryRow(
        'Why does Alex use drugs?',
        lines,
        summaryChangeHref('drugs-background', 'why')
      ))
    }
    if (Array.isArray(session.drugAffect) && session.drugAffect.length) {
      const lines = session.drugAffect.map((value) => labelled(AFFECT_LABELS, value))
      if (session.affectDetails) lines.push(session.affectDetails)
      rows.push(summaryRow(
        "How has Alex's drug use affected their life?",
        lines,
        summaryChangeHref('drugs-background', 'affect')
      ))
    }
    rows.push(summaryRow(
      'Has anything helped Alex stop or reduce their drug use? (optional)',
      [session.helpedReduce],
      summaryChangeHref('drugs-background', 'helped-reduce'),
      { blankIfEmpty: true }
    ))
    if (session.drugChanges) {
      const lines = [labelled(CHANGES_LABELS, session.drugChanges)]
      if (session.drugChangesDetails) lines.push(session.drugChangesDetails)
      rows.push(summaryRow(
        'Does Alex want to make changes to their drug use?',
        lines,
        summaryChangeHref('drugs-background', 'changes'),
        { secondaryFrom: 1 }
      ))
    }
    parts.push(`<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>`)
  }

  return parts.join('')
}

const analysisRows = (session) => {
  const rows = []
  if (session.drugAnalysisMotivation) {
    rows.push(summaryRow(
      "Does Alex seem motivated to stop or reduce their drug use?",
      [labelled(MOTIVATION_LABELS, session.drugAnalysisMotivation)],
      '#analysis-motivation'
    ))
  }
  if (session.drugAnalysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's drug use?",
      [labelled(YES_NO, session.drugAnalysisStrengths), session.drugAnalysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.drugAnalysisHarm) {
    rows.push(summaryRow(
      "Is Alex's drug use linked to risk of serious harm?",
      [labelled(YES_NO, session.drugAnalysisHarm), session.drugAnalysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.drugAnalysisReoffending) {
    rows.push(summaryRow(
      "Is Alex's drug use linked to risk of reoffending?",
      [labelled(YES_NO, session.drugAnalysisReoffending), session.drugAnalysisReoffendingDetails],
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
  const mount = document.querySelector('[data-du-summary]')
  if (!mount) return

  const complete = !!session.drugComplete
  const html = drugRows(session)
  const goButton = document.querySelector('[data-du-go-analysis]')

  if (!html) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="drugs.html">Answer drug use questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && session.drugUse === 'yes' && !questionsAnswered(session)) {
      const next = !typesAnswered(session)
        ? 'drugs-types.html'
        : !beforeAnswered(session)
          ? 'drugs-before.html'
          : 'drugs-background.html'
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${next}">Continue</a></p>`
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

const renderAnalysisSummary = (session) => {
  const mount = document.querySelector('[data-du-analysis-summary]')
  const form = document.getElementById('san-drugs-analysis-form')
  if (!mount || !form) return

  if (!session.drugComplete) {
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
  const mount = document.querySelector('[data-du-analysis-summary]')
  const form = document.getElementById('san-drugs-analysis-form')
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

const emptyFollowOnAnswers = () => ({
  drugTypes: [],
  drugLastUsed: {},
  otherDrugDetails: '',
  drugFrequency: {},
  drugFrequencyDetails: {},
  olderDrugDetails: '',
  injectedDrugs: [],
  injectedWhen: {},
  drugsInCustody: '',
  drugsInCustodyDetails: '',
  treatment: '',
  treatmentDetails: '',
  whyDrugUse: [],
  whyDetails: '',
  drugAffect: [],
  affectDetails: '',
  helpedReduce: '',
  drugChanges: '',
  drugChangesDetails: '',
  drugAnalysisMotivation: '',
  drugAnalysisStrengths: '',
  drugAnalysisStrengthsDetails: '',
  drugAnalysisHarm: '',
  drugAnalysisHarmDetails: '',
  drugAnalysisReoffending: '',
  drugAnalysisReoffendingDetails: ''
})

const readUseAnswers = () => ({
  drugUse: checkedValue('drug_use')
})

const readTypesAnswers = () => {
  const drugTypes = checkedValues('drug_types')
  const drugLastUsed = {}
  drugTypes.forEach((id) => {
    const value = checkedValue(`last_used_${id}`)
    if (value) drugLastUsed[id] = value
  })
  return {
    drugTypes,
    drugLastUsed,
    otherDrugDetails: drugTypes.includes('other') ? fieldValue('other-drug-details') : ''
  }
}

const readBeforeAnswers = (session) => {
  const drugFrequency = {}
  const drugFrequencyDetails = {}
  recentDrugs(session).forEach((id) => {
    const frequency = checkedValue(`frequency_${id}`)
    if (frequency) drugFrequency[id] = frequency
    const details = fieldValue(`frequency-${id}-details`)
    if (details) drugFrequencyDetails[id] = details
  })

  const injectedDrugs = checkedValues('injected_drugs')
  const injectedWhen = {}
  injectedDrugs.forEach((id) => {
    if (id === 'none') return
    const when = checkedValues(`injected_when_${id}`)
    if (when.length) injectedWhen[id] = when
  })

  return {
    drugFrequency,
    drugFrequencyDetails,
    olderDrugDetails: fieldValue('older-drug-details'),
    injectedDrugs,
    injectedWhen
  }
}

const readBackgroundAnswers = () => {
  const treatment = checkedValue('receiving_treatment')
  const drugChanges = checkedValue('drug_changes')
  return {
    treatment,
    treatmentDetails: treatment ? fieldValue(`treatment-${treatment}-details`) : '',
    whyDrugUse: checkedValues('why_drug_use'),
    whyDetails: fieldValue('why-details'),
    drugAffect: checkedValues('drug_affect'),
    affectDetails: fieldValue('affect-details'),
    helpedReduce: fieldValue('helped-reduce'),
    drugChanges,
    drugChangesDetails: drugChanges ? fieldValue(`changes-${drugChanges}-details`) : ''
  }
}

const readAnalysisAnswers = () => {
  const drugAnalysisMotivation = checkedValue('analysis_motivation')
  const drugAnalysisStrengths = checkedValue('analysis_strengths')
  const drugAnalysisHarm = checkedValue('analysis_harm')
  const drugAnalysisReoffending = checkedValue('analysis_reoffending')
  return {
    drugAnalysisMotivation,
    drugAnalysisStrengths,
    drugAnalysisStrengthsDetails: drugAnalysisStrengths ? fieldValue(`analysis-strengths-${drugAnalysisStrengths}-details`) : '',
    drugAnalysisHarm,
    drugAnalysisHarmDetails: drugAnalysisHarm ? fieldValue(`analysis-harm-${drugAnalysisHarm}-details`) : '',
    drugAnalysisReoffending,
    drugAnalysisReoffendingDetails: drugAnalysisReoffending ? fieldValue(`analysis-reoffending-${drugAnalysisReoffending}-details`) : ''
  }
}

const validateUse = (answers) => {
  if (answers.drugUse) return []
  return [{
    group: 'drug-use',
    href: '#drug-use',
    text: 'Select if Alex has ever misused drugs'
  }]
}

const validateTypes = (answers) => {
  const errors = []
  if (!answers.drugTypes.length) {
    errors.push({
      group: 'drug-types',
      href: '#drug-types',
      text: 'Select which drugs Alex has misused'
    })
    return errors
  }
  if (answers.drugTypes.includes('other') && !answers.otherDrugDetails) {
    errors.push({
      group: 'other-drug-details',
      href: '#other-drug-details',
      text: 'Enter details about the other drug'
    })
  }
  answers.drugTypes.forEach((id) => {
    if (!answers.drugLastUsed[id]) {
      errors.push({
        group: `last-used-${id}`,
        href: `#last-used-${id}`,
        text: `Select when they last used ${DRUG_LABELS[id] || id}`
      })
    }
  })
  return errors
}

const validateBefore = (answers, session) => {
  const errors = []
  recentDrugs(session).forEach((id) => {
    if (!answers.drugFrequency[id]) {
      errors.push({
        group: `frequency-${id}`,
        href: `#frequency-${id}`,
        text: `Select how often Alex was using ${DRUG_LABELS[id] || id}`
      })
    }
  })
  if (!answers.injectedDrugs.length) {
    errors.push({
      group: 'injected',
      href: '#injected',
      text: 'Select which drugs Alex injected before custody'
    })
  } else {
    answers.injectedDrugs.forEach((id) => {
      if (id === 'none') return
      if (!(answers.injectedWhen[id] && answers.injectedWhen[id].length)) {
        errors.push({
          group: `injected-when-${id}`,
          href: `#injected-when-${id}`,
          text: `Select when Alex injected ${DRUG_LABELS[id] || id}`
        })
      }
    })
  }
  return errors
}

const validateBackground = (answers) => {
  const errors = []
  if (!answers.treatment) {
    errors.push({
      group: 'treatment',
      href: '#treatment',
      text: 'Select if Alex is receiving treatment for their drug use'
    })
  } else if (answers.treatment === 'yes' && !answers.treatmentDetails) {
    errors.push({
      group: 'treatment-yes-details',
      href: '#treatment-yes-details',
      text: 'Enter details about treatment or support'
    })
  }
  if (!answers.whyDrugUse.length) {
    errors.push({
      group: 'why',
      href: '#why',
      text: 'Select why Alex uses drugs'
    })
  }
  if (!answers.drugAffect.length) {
    errors.push({
      group: 'affect',
      href: '#affect',
      text: "Select how Alex's drug use has affected their life"
    })
  }
  if (!answers.drugChanges) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their drug use'
    })
  } else if (answers.drugChanges === 'not-present' && !answers.drugChangesDetails) {
    errors.push({
      group: 'changes-not-present-details',
      href: '#changes-not-present-details',
      text: 'Enter details'
    })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  if (!answers.drugAnalysisMotivation) {
    errors.push({
      group: 'analysis-motivation',
      href: '#analysis-motivation',
      text: 'Select if Alex seems motivated to stop or reduce their drug use'
    })
  }
  const questions = [
    ['drugAnalysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to drug use', 'Enter details about the strengths or protective factors'],
    ['drugAnalysisHarm', 'analysis-harm', "Select if Alex's drug use is linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['drugAnalysisReoffending', 'analysis-reoffending', "Select if Alex's drug use is linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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
  const recent = recentDrugs(session)
  const older = olderDrugs(session)

  const recentSection = document.querySelector('[data-du-recent-section]')
  setHidden(recentSection, !recent.length)
  DRUG_IDS.forEach((id) => {
    document.querySelectorAll(`[data-du-recent="${id}"]`).forEach((block) => {
      setHidden(block, !recent.includes(id))
    })
  })

  const olderSection = document.querySelector('[data-du-older-section]')
  setHidden(olderSection, !older.length)
  const olderList = document.querySelector('[data-du-older-list]')
  if (olderList) {
    const labels = older.map((id) => DRUG_LABELS[id] || id)
    olderList.innerHTML = `<p class="govuk-body">Alex used ${escapeHtml(labels.join(', '))} more than 6 months before custody.</p>`
  }

  const types = selectedDrugs(session)
  DRUG_IDS.forEach((id) => {
    document.querySelectorAll(`[data-du-inject="${id}"]`).forEach((block) => {
      setHidden(block, !types.includes(id))
    })
  })
}

const restoreUse = (session) => {
  selectRadio('drug_use', session.drugUse)
}

const restoreTypes = (session) => {
  selectChecks('drug_types', session.drugTypes)
  if (session.drugLastUsed) {
    Object.entries(session.drugLastUsed).forEach(([id, value]) => {
      selectRadio(`last_used_${id}`, value)
    })
  }
  setField('other-drug-details', session.otherDrugDetails)
}

const restoreBefore = (session) => {
  if (session.drugFrequency) {
    Object.entries(session.drugFrequency).forEach(([id, value]) => {
      selectRadio(`frequency_${id}`, value)
    })
  }
  if (session.drugFrequencyDetails) {
    Object.entries(session.drugFrequencyDetails).forEach(([id, value]) => {
      setField(`frequency-${id}-details`, value)
    })
  }
  setField('older-drug-details', session.olderDrugDetails)
  selectChecks('injected_drugs', session.injectedDrugs)
  if (session.injectedWhen) {
    Object.entries(session.injectedWhen).forEach(([id, values]) => {
      selectChecks(`injected_when_${id}`, values)
    })
  }
}

const restoreBackground = (session) => {
  selectRadio('receiving_treatment', session.treatment)
  if (session.treatment) setField(`treatment-${session.treatment}-details`, session.treatmentDetails)
  selectChecks('why_drug_use', session.whyDrugUse)
  setField('why-details', session.whyDetails)
  selectChecks('drug_affect', session.drugAffect)
  setField('affect-details', session.affectDetails)
  setField('helped-reduce', session.helpedReduce)
  selectRadio('drug_changes', session.drugChanges)
  if (session.drugChanges) setField(`changes-${session.drugChanges}-details`, session.drugChangesDetails)
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_motivation', session.drugAnalysisMotivation)
  selectRadio('analysis_strengths', session.drugAnalysisStrengths)
  if (session.drugAnalysisStrengths) setField(`analysis-strengths-${session.drugAnalysisStrengths}-details`, session.drugAnalysisStrengthsDetails)
  selectRadio('analysis_harm', session.drugAnalysisHarm)
  if (session.drugAnalysisHarm) setField(`analysis-harm-${session.drugAnalysisHarm}-details`, session.drugAnalysisHarmDetails)
  selectRadio('analysis_reoffending', session.drugAnalysisReoffending)
  if (session.drugAnalysisReoffending) setField(`analysis-reoffending-${session.drugAnalysisReoffending}-details`, session.drugAnalysisReoffendingDetails)
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

const initDrugs = () => {
  const page = document.querySelector('[data-du-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('drugs-summary.html')

  const pageName = page.getAttribute('data-du-page')
  if (pageName === 'use') restoreUse(session)
  if (pageName === 'types') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    restoreTypes(session)
  }
  if (pageName === 'before') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!typesAnswered(session)) {
      window.location.assign('drugs-types.html')
      return
    }
    applyBeforePage(session)
    restoreBefore(session)
  }
  if (pageName === 'background') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!beforeAnswered(session)) {
      window.location.assign(typesAnswered(session) ? 'drugs-before.html' : 'drugs-types.html')
      return
    }
    restoreBackground(session)
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-du-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-du-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-du-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-du-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  const useForm = document.getElementById('san-drugs-use-form')
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
    const updates = { ...answers, drugComplete: false }
    if (answers.drugUse !== previous.drugUse) Object.assign(updates, emptyFollowOnAnswers())
    setSanSession(updates)
    if (answers.drugUse === 'no') {
      window.location.assign('drugs-summary.html')
      return
    }
    window.location.assign(fromSummary() && previous.drugUse === 'yes' ? 'drugs-summary.html' : 'drugs-types.html')
  })

  const typesForm = document.getElementById('san-drugs-types-form')
  typesForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readTypesAnswers()
    const errors = validateTypes(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, drugComplete: false })
    const next = getSanSession()
    window.location.assign(fromSummary() && beforeAnswered(next) ? 'drugs-summary.html' : 'drugs-before.html')
  })

  const beforeForm = document.getElementById('san-drugs-before-form')
  beforeForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const current = getSanSession()
    const answers = readBeforeAnswers(current)
    const errors = validateBefore(answers, current)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, drugComplete: false })
    window.location.assign(fromSummary() ? 'drugs-summary.html' : 'drugs-background.html')
  })

  const backgroundForm = document.getElementById('san-drugs-background-form')
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
    setSanSession({ ...answers, drugComplete: false })
    window.location.assign('drugs-summary.html')
  })

  const analysisForm = document.getElementById('san-drugs-analysis-form')
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
    setSanSession({ ...answers, drugComplete: true })
    window.location.assign('drugs-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initDrugs()
})
