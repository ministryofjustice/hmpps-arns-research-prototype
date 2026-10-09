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
  mephedrone: 'Mephedrone (M, M-CAT, meow-meow)',
  methadone: 'Methadone (not prescribed)',
  'other-opiates': 'Other opiates',
  'prescribed-drugs': 'Prescribed or over the counter drugs, such as paracetamol',
  solvents: 'Solvents (including gases and glues)',
  steroids: 'Steroids',
  'synthetic-cannabinoids': 'Synthetic cannabinoids (spice)',
  other: 'Other'
}

const DRUG_IDS = Object.keys(DRUG_LABELS)

const NON_INJECTABLE_DRUG_IDS = new Set([
  'cannabis',
  'ecstasy',
  'hallucinogens',
  'solvents',
  'synthetic-cannabinoids'
])

const isInjectableDrug = (id) => !NON_INJECTABLE_DRUG_IDS.has(id)

let extraDrugSeq = 1

const extraDrugs = (session) => (Array.isArray(session.extraDrugs) ? session.extraDrugs : [])

const listedDrugs = (session) => selectedDrugs(session).filter((id) => id !== 'other')

const extraDrugIds = (session) => extraDrugs(session).map((drug) => drug.id)

const assessedDrugs = (session) => [...listedDrugs(session), ...extraDrugIds(session)]

const injectableAssessedDrugs = (session) => assessedDrugs(session).filter(isInjectableDrug)

const otherSelected = (session) => selectedDrugs(session).includes('other')

const onlyOtherSelected = (session) => {
  const selected = selectedDrugs(session)
  return selected.length === 1 && selected[0] === 'other'
}

const nextExtraDrugId = () => `extra-${extraDrugSeq++}`

const emptyExtraDrug = () => ({ id: nextExtraDrugId(), name: '', lastUsed: '' })

const syncExtraDrugSeq = (extras) => {
  extras.forEach((drug) => {
    const match = /^extra-(\d+)$/.exec(drug.id || '')
    if (match) extraDrugSeq = Math.max(extraDrugSeq, Number(match[1]) + 1)
  })
}

const LAST_USED_LABELS = {
  'last-six': 'In the last 6 months',
  'more-than-six': 'More than 6 months ago'
}

const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  occasionally: 'Occasionally'
}

const INJECTED_WHEN_LABELS = {
  'last-six': 'In the last 6 months',
  'more-than-six': 'More than 6 months ago'
}

const YES_NO = { yes: 'Yes', no: 'No' }

const MOTIVATION_LABELS = {
  'does-not-show': 'Does not show motivation to stop or reduce',
  some: 'Shows some motivation to stop or reduce',
  motivated: 'Motivated to stop or reduce',
  unknown: 'Unknown'
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
  extraDrugs: [],
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
  helpedReduce: 'no',
  helpedReduceDetails: '',
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
    else {
      const control = group.querySelector('input, textarea, select')
      if (control) group.insertBefore(message, control)
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

  document.querySelectorAll('[data-section-complete="offence"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.offenceComplete)
  })
  const offenceLink = document.querySelector('[data-san-section-link="offence"]')
  if (offenceLink && session.offenceDescription) {
    offenceLink.setAttribute('href', sectionLinkHref('offence', 'offence-analysis-summary.html'))
  }
}

const selectedDrugs = (session) => (Array.isArray(session.drugTypes) ? session.drugTypes : [])

const lastUsedFor = (session, id) => {
  const extra = extraDrugs(session).find((drug) => drug.id === id)
  if (extra) return extra.lastUsed || ''
  return (session.drugLastUsed && session.drugLastUsed[id]) || ''
}

const drugLabel = (session, id) => {
  if (id !== 'other' && DRUG_LABELS[id]) return DRUG_LABELS[id]
  const extra = extraDrugs(session).find((drug) => drug.id === id)
  if (extra && extra.name) return extra.name
  return DRUG_LABELS[id] || id
}

const sentenceDrugLabel = (label) => (label ? label.charAt(0).toLowerCase() + label.slice(1) : label)

const recentDrugs = (session) => assessedDrugs(session).filter((id) => lastUsedFor(session, id) === 'last-six')

const olderDrugs = (session) => assessedDrugs(session).filter((id) => lastUsedFor(session, id) === 'more-than-six')

const typesChosen = (session) => selectedDrugs(session).length > 0

const typesAnswered = (session) => {
  if (!typesChosen(session)) return false
  if (!listedDrugs(session).every((id) => lastUsedFor(session, id))) return false
  const extras = extraDrugs(session)
  if (otherSelected(session) && extras.length === 0) return false
  return extras.every((drug) => drug.name && drug.lastUsed)
}

const injectedDrugIds = (session) => (
  Array.isArray(session.injectedDrugs)
    ? session.injectedDrugs.filter((id) => id !== 'none' && isInjectableDrug(id))
    : []
)

const sameIds = (left, right) => {
  if (left.length !== right.length) return false
  const values = new Set(right)
  return left.every((id) => values.has(id))
}

const keptInjectedWhen = (ids, previous) => {
  const injectedWhen = {}
  ids.forEach((id) => {
    const when = previous.injectedWhen && previous.injectedWhen[id]
    if (Array.isArray(when) && when.length) injectedWhen[id] = when
  })
  return injectedWhen
}

// When answers are a group of inputs, so they follow the parent question on the next page.
const injectedWhenNeeded = (session) => injectedDrugIds(session).length > 0

const injectedWhenComplete = (session) => injectedDrugIds(session).every((id) => (
  Array.isArray(session.injectedWhen && session.injectedWhen[id]) && session.injectedWhen[id].length
))

const beforeFieldsAnswered = (session) => {
  if (!typesAnswered(session)) return false
  if (assessedDrugs(session).some((id) => !(session.drugFrequency && session.drugFrequency[id]))) return false
  return Array.isArray(session.injectedDrugs) && session.injectedDrugs.length > 0
}

const nextDrugQuestion = (session) => {
  if (!typesChosen(session)) return 'drugs-types.html'
  if (!typesAnswered(session)) return 'drugs-when.html'
  if (!beforeFieldsAnswered(session)) return 'drugs-before.html'
  if (injectedWhenNeeded(session) && !injectedWhenComplete(session)) return 'drugs-injected.html'
  if (!helpAnswered(session)) return helpPage(session)
  if (!session.drugChanges) return 'drugs-changes.html'
  return helpPage(session)
}

const beforeAnswered = (session) => {
  if (!beforeFieldsAnswered(session)) return false
  if (injectedWhenNeeded(session) && !injectedWhenComplete(session)) return false
  return true
}

const hasRecentDrugUse = (session) => recentDrugs(session).length > 0

const helpPage = (session) => hasRecentDrugUse(session) ? 'drugs-help.html' : 'drugs-help-past.html'

const helpQuestion = (session) => hasRecentDrugUse(session)
  ? 'Does anything help Alex to stop or reduce their drug use?'
  : 'Has anything helped Alex to stop or reduce their drug use in the past?'

const helpAnswered = (session) => {
  if (!session.helpedReduce) return false
  if (session.helpedReduce === 'yes' && !session.helpedReduceDetails) return false
  return true
}

const backgroundAnswered = (session) => {
  if (!helpAnswered(session)) return false
  if (!session.drugChanges) return false
  if (session.drugChanges === 'not-present' && !session.drugChangesDetails) return false
  return true
}

const questionsAnswered = (session) => {
  if (session.drugUse === 'no') return true
  if (session.drugUse !== 'yes') return false
  return beforeAnswered(session) && backgroundAnswered(session)
}

const analysisNotRequired = (session) => session.drugUse === 'no'

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
      summaryChangeHref('drugs-when', `last-used-${id}`)
  )]

  if (lastUsed) {
    const frequency = session.drugFrequency && session.drugFrequency[id]
    const details = session.drugFrequencyDetails && session.drugFrequencyDetails[id]
    rows.push(summaryRow(
      'How often',
      [labelled(FREQUENCY_LABELS, frequency)],
      summaryChangeHref('drugs-before', `frequency-${id}`)
    ))
    rows.push(summaryRow(
      `Give details about their use of ${sentenceDrugLabel(drugLabel(session, id))} (optional)`,
      [details],
      summaryChangeHref('drugs-before', `frequency-${id}`),
      { blankIfEmpty: true }
    ))
  }

  if (isInjectableDrug(id)) {
    const injected = injectedDrugIds(session).includes(id)
    rows.push(summaryRow(
      'Injected',
      [injected ? 'Yes' : 'No'],
      summaryChangeHref('drugs-before', 'injected')
    ))
    if (injected) {
      const when = session.injectedWhen && session.injectedWhen[id]
      rows.push(summaryRow(
        'When has Alex injected this drug?',
        Array.isArray(when) ? when.map((value) => labelled(INJECTED_WHEN_LABELS, value)) : [],
        summaryChangeHref('drugs-injected', `injected-when-${id}`)
      ))
    }
  }

  return `<div class="govuk-summary-card">
    <div class="govuk-summary-card__title-wrapper">
      <h3 class="govuk-summary-card__title">${escapeHtml(drugLabel(session, id))}</h3>
      <ul class="govuk-summary-card__actions">
        <li class="govuk-summary-card__action">
          <a class="govuk-link" href="${id.startsWith('extra-') ? summaryChangeHref('drugs-when', `last-used-${id}`) : summaryChangeHref('drugs-types')}">Change<span class="govuk-visually-hidden"> (${escapeHtml(drugLabel(session, id))})</span></a>
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
      'Has Alex ever used illegal drugs or misused medication?',
      ['No'],
      summaryChangeHref('drugs')
    )}</dl>`
  }

  if (session.drugUse !== 'yes') return ''

  const parts = [`<dl class="govuk-summary-list san-summary-list">${summaryRow(
    'Has Alex ever used illegal drugs or misused medication?',
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
    parts.push('<h3 class="govuk-heading-m">Not used in the last 6 months</h3>')
    parts.push(older.map((id) => drugCard(session, id)).join(''))
  }

  if (session.helpedReduce || session.drugChanges) {
    parts.push('<h3 class="govuk-heading-m">More information</h3>')
    const rows = []
    if (session.helpedReduce) {
      const lines = [labelled(YES_NO, session.helpedReduce)]
      if (session.helpedReduceDetails) lines.push(session.helpedReduceDetails)
      rows.push(summaryRow(
        helpQuestion(session),
        lines,
        summaryChangeHref(hasRecentDrugUse(session) ? 'drugs-help' : 'drugs-help-past', 'helped-reduce'),
        { secondaryFrom: 1 }
      ))
    }
    if (session.drugChanges) {
      const lines = [labelled(CHANGES_LABELS, session.drugChanges)]
      if (session.drugChangesDetails) lines.push(session.drugChangesDetails)
      rows.push(summaryRow(
        'Does Alex want to make changes to their drug use?',
        lines,
        summaryChangeHref('drugs-changes'),
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
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${nextDrugQuestion(session)}">Continue</a></p>`
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
  const notice = document.querySelector('[data-du-analysis-not-required]')
  const questions = document.querySelector('[data-du-analysis-questions]')
  if (!mount || !form) return

  if (analysisNotRequired(session)) {
    setHidden(mount, true)
    setHidden(notice, false)
    setHidden(questions, true)
    setHidden(form, !!session.drugComplete)
    return
  }

  setHidden(notice, true)
  setHidden(questions, false)

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
  if (analysisNotRequired(getSanSession())) {
    openAnalysisTab()
    return
  }
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

const showCompletedAnalysis = () => {
  const hash = '#practitioner-analysis'
  if (window.location.hash === hash) {
    window.location.reload()
    return
  }
  window.location.assign(`drugs-summary.html${hash}`)
}

const emptyFollowOnAnswers = () => ({
  drugTypes: [],
  drugLastUsed: {},
  extraDrugs: [],
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
  helpedReduceDetails: '',
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

const readTypesAnswers = () => ({
  drugTypes: checkedValues('drug_types'),
  otherDrugDetails: ''
})

const summaryFocusDrugId = () => {
  if (!fromSummary()) return ''
  const match = /^#last-used-(.+)$/.exec(decodeURIComponent(window.location.hash))
  return match ? match[1] : ''
}

const blockHidden = (element) => !element || element.hidden || element.classList.contains('san-is-hidden')

const readWhenAnswers = (session) => {
  const drugLastUsed = {}
  listedDrugs(session).forEach((id) => {
    const block = document.querySelector(`[data-du-when="${CSS.escape(id)}"]`)
    if (blockHidden(block)) {
      const existing = session.drugLastUsed && session.drugLastUsed[id]
      if (existing) drugLastUsed[id] = existing
      return
    }
    const value = checkedValue(`last_used_${id}`)
    if (value) drugLastUsed[id] = value
  })

  const extraSection = document.querySelector('[data-du-extra-drugs]')
  const focusId = summaryFocusDrugId()
  let extraDrugsOnPage
  if (blockHidden(extraSection)) {
    extraDrugsOnPage = extraDrugs(session)
  } else if (focusId.startsWith('extra-')) {
    const edited = readExtraDrugsFromForm()
    const editedIds = new Set(edited.map((drug) => drug.id))
    extraDrugsOnPage = extraDrugs(session).map((drug) => (
      editedIds.has(drug.id) ? edited.find((item) => item.id === drug.id) : drug
    ))
  } else {
    extraDrugsOnPage = readExtraDrugsFromForm()
  }

  return { drugLastUsed, extraDrugs: extraDrugsOnPage }
}

const readBeforeAnswers = (session) => {
  const drugFrequency = {}
  const drugFrequencyDetails = {}
  assessedDrugs(session).forEach((id) => {
    const frequency = checkedValue(`frequency_${id}`)
    if (frequency) drugFrequency[id] = frequency
    const details = fieldValue(`frequency-${id}-details`)
    if (details) drugFrequencyDetails[id] = details
  })

  return {
    drugFrequency,
    drugFrequencyDetails,
    injectedDrugs: injectableAssessedDrugs(session).length
      ? checkedValues('injected_drugs').filter((id) => id === 'none' || isInjectableDrug(id))
      : ['none']
  }
}

const readInjectedWhenAnswers = (session) => {
  const injectedWhen = {}
  injectedDrugIds(session).forEach((id) => {
    const when = checkedValues(`injected_when_${id}`)
    if (when.length) injectedWhen[id] = when
  })
  return { injectedWhen }
}

const readBackgroundAnswers = () => {
  const treatment = checkedValue('receiving_treatment')
  return {
    treatment,
    treatmentDetails: treatment ? fieldValue(`treatment-${treatment}-details`) : '',
    whyDrugUse: checkedValues('why_drug_use'),
    whyDetails: fieldValue('why-details'),
    drugAffect: checkedValues('drug_affect'),
    affectDetails: fieldValue('affect-details')
  }
}

const readHelpAnswers = () => {
  const helpedReduce = checkedValue('helped_reduce')
  return {
    helpedReduce,
    helpedReduceDetails: helpedReduce === 'yes' ? fieldValue('helped-reduce-yes-details') : ''
  }
}

const readChangesAnswers = () => {
  const drugChanges = checkedValue('drug_changes')
  return {
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
    text: 'Select if Alex has ever used illegal drugs or misused medication'
  }]
}

const validateTypes = (answers) => {
  if (answers.drugTypes.length) return []
  return [{
    group: 'drug-types',
    href: '#drug-types',
    text: 'Select which drugs Alex has used'
  }]
}

const validateWhen = (answers, session) => {
  const errors = []
  listedDrugs(session).forEach((id) => {
    if (!answers.drugLastUsed[id]) {
      errors.push({
        group: `last-used-${id}`,
        href: `#last-used-${id}`,
        text: `Select when Alex used ${DRUG_LABELS[id] || id}`
      })
    }
  })
  const extras = Array.isArray(answers.extraDrugs) ? answers.extraDrugs : []
  extras.forEach((drug) => {
    if (!drug.name) {
      errors.push({
        group: `extra-name-${drug.id}`,
        href: `#extra-name-${drug.id}`,
        text: 'Enter the drug name'
      })
    }
    if (!drug.lastUsed) {
      errors.push({
        group: `last-used-${drug.id}`,
        href: `#last-used-${drug.id}`,
        text: drug.name ? `Select when Alex used ${drug.name}` : 'Select when Alex used this drug'
      })
    }
  })
  if (otherSelected(session) && extras.length === 0) {
    errors.push({
      group: 'extra-drugs',
      href: '#san-drugs-when-form',
      text: 'Add another drug'
    })
  }
  return errors
}

const validateBefore = (answers, session) => {
  const errors = []
  assessedDrugs(session).forEach((id) => {
    if (!answers.drugFrequency[id]) {
      errors.push({
        group: `frequency-${id}`,
        href: `#frequency-${id}`,
        text: `Select how often Alex was using ${drugLabel(session, id)}`
      })
    }
  })
  if (injectableAssessedDrugs(session).length && !answers.injectedDrugs.length) {
    errors.push({
      group: 'injected',
      href: '#injected',
      text: 'Select which drugs Alex injected'
    })
  }
  return errors
}

const validateInjectedWhen = (answers, session) => {
  const errors = []
  injectedDrugIds(session).forEach((id) => {
    if (!(answers.injectedWhen[id] && answers.injectedWhen[id].length)) {
      errors.push({
        group: `injected-when-${id}`,
        href: `#injected-when-${id}`,
        text: `Select when Alex injected ${drugLabel(session, id)}`
      })
    }
  })
  return errors
}

const validateBackground = () => []

const validateHelp = (answers, session) => {
  const errors = []
  if (!answers.helpedReduce) {
    errors.push({
      group: 'helped-reduce',
      href: '#helped-reduce',
      text: hasRecentDrugUse(session)
        ? 'Select if anything helps Alex to stop or reduce their drug use'
        : 'Select if anything has helped Alex to stop or reduce their drug use in the past'
    })
  } else if (answers.helpedReduce === 'yes' && !answers.helpedReduceDetails) {
    errors.push({
      group: 'helped-reduce-yes-details',
      href: '#helped-reduce-yes-details',
      text: 'Enter details'
    })
  }
  return errors
}

const validateChanges = (answers) => {
  const errors = []
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

const extraFrequencyHtml = (session, id, withSpacing) => {
  const label = escapeHtml(drugLabel(session, id))
  const options = Object.entries(FREQUENCY_LABELS).map(([value, text]) => `
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="frequency-${escapeHtml(id)}-${escapeHtml(value)}" name="frequency_${escapeHtml(id)}" type="radio" value="${escapeHtml(value)}">
            <label class="govuk-label govuk-radios__label" for="frequency-${escapeHtml(id)}-${escapeHtml(value)}">${escapeHtml(text)}</label>
          </div>`).join('')
  return `<div class="govuk-form-group${withSpacing ? ' san-question' : ''}" data-du-frequency="${escapeHtml(id)}" data-du-frequency-extra-item data-san-error-group="frequency-${escapeHtml(id)}">
      <fieldset class="govuk-fieldset" id="frequency-${escapeHtml(id)}">
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
          <h3 class="govuk-fieldset__heading">${label}</h3>
        </legend>
        <p class="govuk-body govuk-!-font-weight-bold govuk-!-margin-bottom-2">How often was Alex using this drug?</p>
        <div class="govuk-radios govuk-radios--inline" data-module="govuk-radios">
          ${options}
        </div>
      </fieldset>
      <div class="govuk-form-group govuk-!-margin-top-4">
        <label class="govuk-label" for="frequency-${escapeHtml(id)}-details">Give details about their use of ${sentenceDrugLabel(label)} (optional)</label>
        <div class="govuk-hint">Consider why they started using, their history, and any triggers.</div>
        <textarea class="govuk-textarea" id="frequency-${escapeHtml(id)}-details" name="frequency_${escapeHtml(id)}_details" rows="5" maxlength="2000"></textarea>
        <div class="govuk-hint san-character-count" data-san-character-count="frequency-${escapeHtml(id)}-details">You have 2,000 characters remaining</div>
      </div>
    </div>`
}

const extraInjectHtml = (session, id) => {
  const label = escapeHtml(drugLabel(session, id))
  const safeId = escapeHtml(id)
  return `<div class="govuk-checkboxes__item" data-du-inject="${safeId}" data-du-inject-extra-item>
          <input class="govuk-checkboxes__input" id="injected-${safeId}" name="injected_drugs" type="checkbox" value="${safeId}">
          <label class="govuk-label govuk-checkboxes__label" for="injected-${safeId}">${label}</label>
        </div>`
}

const injectedWhenHtml = (id, label) => {
  const safeId = escapeHtml(id)
  const safeLabel = escapeHtml(label)
  return `<div class="govuk-form-group" data-du-injected-when="${safeId}" data-du-injected-extra-item data-san-error-group="injected-when-${safeId}">
      <fieldset class="govuk-fieldset" id="injected-when-${safeId}" aria-describedby="injected-when-${safeId}-hint">
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
          <h2 class="govuk-fieldset__heading">${safeLabel}</h2>
        </legend>
        <div id="injected-when-${safeId}-hint" class="govuk-hint">Select one or both.</div>
        <div class="govuk-checkboxes">
          <div class="govuk-checkboxes__item">
            <input class="govuk-checkboxes__input" id="injected-when-${safeId}-last-six" name="injected_when_${safeId}" type="checkbox" value="last-six">
            <label class="govuk-label govuk-checkboxes__label" for="injected-when-${safeId}-last-six">In the last 6 months</label>
          </div>
          <div class="govuk-checkboxes__item">
            <input class="govuk-checkboxes__input" id="injected-when-${safeId}-more-than-six" name="injected_when_${safeId}" type="checkbox" value="more-than-six">
            <label class="govuk-label govuk-checkboxes__label" for="injected-when-${safeId}-more-than-six">More than 6 months ago</label>
          </div>
        </div>
      </fieldset>
    </div>`
}

const restyleFrequencyBlocks = (container) => {
  if (!container) return
  Array.from(container.querySelectorAll('[data-du-frequency]')).forEach((block, index) => {
    block.classList.toggle('san-question', index > 0)
  })
}

const applyBeforePage = (session) => {
  const recent = recentDrugs(session)
  const older = olderDrugs(session)
  const extraRecent = recent.filter((id) => id.startsWith('extra-'))
  const extraOlder = older.filter((id) => id.startsWith('extra-'))
  const listedRecent = recent.filter((id) => !id.startsWith('extra-'))
  const listedOlder = older.filter((id) => !id.startsWith('extra-'))

  const recentSection = document.querySelector('[data-du-recent-section]')
  const olderSection = document.querySelector('[data-du-older-section]')
  const recentQuestions = document.querySelector('[data-du-recent-questions]')
  const olderQuestions = document.querySelector('[data-du-older-questions]')
  setHidden(recentSection, !recent.length)
  setHidden(olderSection, !older.length)
  setHidden(document.querySelector('[data-du-frequency-help]'), !recent.length && !older.length)
  setHidden(document.querySelector('[data-du-older-break]'), !recent.length)

  DRUG_IDS.forEach((id) => {
    document.querySelectorAll(`[data-du-frequency="${id}"]`).forEach((block) => {
      const isRecent = recent.includes(id)
      const isOlder = older.includes(id)
      setHidden(block, !isRecent && !isOlder)
      if (isRecent && recentQuestions) recentQuestions.appendChild(block)
      else if (isOlder && olderQuestions) olderQuestions.appendChild(block)
    })
  })

  const recentExtra = document.querySelector('[data-du-recent-extra]')
  if (recentExtra) {
    recentExtra.innerHTML = extraRecent.map((id, index) => extraFrequencyHtml(session, id, listedRecent.length > 0 || index > 0)).join('')
  }
  const olderExtra = document.querySelector('[data-du-older-extra]')
  if (olderExtra) {
    olderExtra.innerHTML = extraOlder.map((id, index) => extraFrequencyHtml(session, id, listedOlder.length > 0 || index > 0)).join('')
  }

  restyleFrequencyBlocks(recentQuestions)
  restyleFrequencyBlocks(olderQuestions)

  const types = assessedDrugs(session)
  DRUG_IDS.forEach((id) => {
    document.querySelectorAll(`[data-du-inject="${id}"]`).forEach((block) => {
      setHidden(block, !isInjectableDrug(id) || id === 'other' || !types.includes(id))
    })
  })

  const injectExtra = document.querySelector('[data-du-inject-extra]')
  if (injectExtra) {
    injectExtra.innerHTML = extraDrugIds(session).map((id) => extraInjectHtml(session, id)).join('')
  }

  const injectSection = document.querySelector('[data-du-inject-section]')
  setHidden(injectSection, injectableAssessedDrugs(session).length === 0)
}

const applyInjectedPage = (session) => {
  const selected = new Set(injectedDrugIds(session))
  DRUG_IDS.forEach((id) => {
    document.querySelectorAll(`[data-du-injected-when="${id}"]`).forEach((block) => {
      setHidden(block, !selected.has(id))
    })
  })
  const extra = document.querySelector('[data-du-injected-extra]')
  if (extra) {
    extra.innerHTML = extraDrugIds(session)
      .filter((id) => selected.has(id))
      .map((id) => injectedWhenHtml(id, drugLabel(session, id)))
      .join('')
  }
}

const restoreUse = (session) => {
  selectRadio('drug_use', session.drugUse)
}

const restoreTypes = (session) => {
  selectChecks('drug_types', session.drugTypes)
}

const readExtraDrugsFromForm = () => {
  return Array.from(document.querySelectorAll('[data-du-extra-item]')).map((item) => {
    const id = item.getAttribute('data-extra-id') || nextExtraDrugId()
    const nameInput = item.querySelector('input[type="text"]')
    const lastUsed = item.querySelector(`input[name="last_used_${CSS.escape(id)}"]:checked`)
    return {
      id,
      name: nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '',
      lastUsed: lastUsed instanceof HTMLInputElement ? lastUsed.value : ''
    }
  })
}

const extraDrugItemHtml = (drug, index, hideRemove = false) => {
  const id = escapeHtml(drug.id)
  const name = escapeHtml(drug.name || '')
  const lastSix = drug.lastUsed === 'last-six' ? ' checked' : ''
  const moreThan = drug.lastUsed === 'more-than-six' ? ' checked' : ''
  const removeButton = hideRemove
    ? ''
    : '<button type="button" class="govuk-button govuk-button--secondary" data-module="govuk-button" data-du-remove-drug>Remove drug</button>'
  return `<div class="san-extra-drugs__item" data-du-extra-item data-extra-id="${id}">
    <h3 class="govuk-heading-m">Drug ${index + 1}</h3>
    <div class="govuk-form-group" data-san-error-group="extra-name-${id}">
      <label class="govuk-label" for="extra-name-${id}">Drug name</label>
      <input class="govuk-input" id="extra-name-${id}" name="extra_name_${id}" type="text" value="${name}" autocomplete="off" spellcheck="false">
    </div>
    <div class="govuk-form-group" data-san-error-group="last-used-${id}">
      <fieldset class="govuk-fieldset" id="last-used-${id}">
        <legend class="govuk-visually-hidden">When did Alex use this drug?</legend>
        <div class="govuk-radios" data-module="govuk-radios">
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="last-used-${id}-last-six" name="last_used_${id}" type="radio" value="last-six"${lastSix}>
            <label class="govuk-label govuk-radios__label" for="last-used-${id}-last-six">In the last 6 months</label>
          </div>
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="last-used-${id}-more-than-six" name="last_used_${id}" type="radio" value="more-than-six"${moreThan}>
            <label class="govuk-label govuk-radios__label" for="last-used-${id}-more-than-six">More than 6 months ago</label>
          </div>
        </div>
      </fieldset>
    </div>
    ${removeButton}
    <hr class="govuk-section-break govuk-section-break--visible govuk-!-margin-bottom-6">
  </div>`
}

const renderExtraDrugList = (extras, { onlyOther = false } = {}) => {
  const heading = document.querySelector('[data-du-extra-heading]')
  const list = document.querySelector('[data-du-extra-list]')
  if (!list) return
  const hideRemove = onlyOther && extras.length < 2
  list.innerHTML = extras.map((drug, index) => extraDrugItemHtml(drug, index, hideRemove)).join('')
  setHidden(heading, onlyOther || extras.length === 0)
}

const extrasForWhenPage = (session) => {
  const extras = extraDrugs(session).map((drug) => ({ ...drug }))
  syncExtraDrugSeq(extras)
  if (otherSelected(session) && extras.length === 0) extras.push(emptyExtraDrug())
  return extras
}

const applyWhenPage = (session) => {
  const onlyOther = onlyOtherSelected(session)
  const pageHeading = document.querySelector('[data-du-when-heading]')
  if (pageHeading) {
    pageHeading.textContent = onlyOther
      ? 'What other drugs did Alex use?'
      : 'When did Alex use these drugs?'
  }

  const selected = selectedDrugs(session)
  const focusId = summaryFocusDrugId()
  const focusOne = Boolean(focusId) && (selected.includes(focusId) || extraDrugIds(session).includes(focusId))
  DRUG_IDS.forEach((id) => {
    document.querySelectorAll(`[data-du-when="${id}"]`).forEach((block) => {
      const show = id !== 'other' && selected.includes(id) && (!focusOne || id === focusId)
      setHidden(block, !show)
    })
  })

  const extraSection = document.querySelector('[data-du-extra-drugs]')
  if (focusOne && !String(focusId).startsWith('extra-')) {
    setHidden(extraSection, true)
    return
  }

  setHidden(extraSection, false)
  const extras = extrasForWhenPage(session)
  renderExtraDrugList(focusOne ? extras.filter((drug) => drug.id === focusId) : extras, { onlyOther })
}

const restoreWhen = (session) => {
  if (!session.drugLastUsed) return
  Object.entries(session.drugLastUsed).forEach(([id, value]) => {
    selectRadio(`last_used_${id}`, value)
  })
}

const bindExtraDrugControls = (form, session) => {
  form.addEventListener('click', (event) => {
    const add = event.target.closest('[data-du-add-drug]')
    if (add) {
      event.preventDefault()
      const extras = readExtraDrugsFromForm()
      extras.push(emptyExtraDrug())
      renderExtraDrugList(extras, { onlyOther: onlyOtherSelected(session) })
      const names = form.querySelectorAll('[data-du-extra-item] input[type="text"]')
      const last = names[names.length - 1]
      if (last instanceof HTMLInputElement) last.focus()
      return
    }
    const remove = event.target.closest('[data-du-remove-drug]')
    if (!remove) return
    event.preventDefault()
    const item = remove.closest('[data-du-extra-item]')
    const removeId = item ? item.getAttribute('data-extra-id') : ''
    const extras = readExtraDrugsFromForm().filter((drug) => drug.id !== removeId)
    renderExtraDrugList(extras, { onlyOther: onlyOtherSelected(session) })
    const addButton = form.querySelector('[data-du-add-drug]')
    if (addButton instanceof HTMLElement) addButton.focus()
  })
}

const pruneExtraKeyed = (map, extraIds) => {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return map || {}
  const next = { ...map }
  Object.keys(next).forEach((id) => {
    if (id.startsWith('extra-') && !extraIds.has(id)) delete next[id]
  })
  return next
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
  selectChecks('injected_drugs', session.injectedDrugs)
}

const restoreInjectedWhen = (session) => {
  if (!session.injectedWhen) return
  Object.entries(session.injectedWhen).forEach(([id, values]) => {
    selectChecks(`injected_when_${id}`, values)
  })
}

const restoreBackground = (session) => {
  selectRadio('receiving_treatment', session.treatment)
  if (session.treatment) setField(`treatment-${session.treatment}-details`, session.treatmentDetails)
  selectChecks('why_drug_use', session.whyDrugUse)
  setField('why-details', session.whyDetails)
  selectChecks('drug_affect', session.drugAffect)
  setField('affect-details', session.affectDetails)
}

const restoreHelp = (session) => {
  selectRadio('helped_reduce', session.helpedReduce)
  if (session.helpedReduce === 'yes') setField('helped-reduce-yes-details', session.helpedReduceDetails)
}

const restoreChanges = (session) => {
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
  if (pageName === 'when') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!typesChosen(session)) {
      window.location.assign('drugs-types.html')
      return
    }
    applyWhenPage(session)
    restoreWhen(session)
  }
  if (pageName === 'before') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!typesAnswered(session)) {
      window.location.assign(nextDrugQuestion(session))
      return
    }
    applyBeforePage(session)
    restoreBefore(session)
  }
  if (pageName === 'injected') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!beforeFieldsAnswered(session)) {
      window.location.assign(nextDrugQuestion(session))
      return
    }
    if (!injectedWhenNeeded(session)) {
      window.location.assign(fromSummary() ? 'drugs-summary.html' : helpPage(session))
      return
    }
    applyInjectedPage(session)
    restoreInjectedWhen(session)
  }
  if (pageName === 'background') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!beforeAnswered(session)) {
      window.location.assign(nextDrugQuestion(session))
      return
    }
    window.location.assign(fromSummary() ? 'drugs-summary.html' : helpPage(session))
    return
  }
  if (pageName === 'help') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!beforeAnswered(session)) {
      window.location.assign(nextDrugQuestion(session))
      return
    }
    const expectedHelp = helpPage(session)
    const currentHelp = page.getAttribute('data-du-help-version') === 'recent' ? 'drugs-help.html' : 'drugs-help-past.html'
    if (currentHelp !== expectedHelp) {
      window.location.assign(fromSummary() ? `${expectedHelp}?from=summary` : expectedHelp)
      return
    }
    if (!fromSummary()) {
      ensureBackLink(injectedWhenNeeded(session) ? 'drugs-injected.html' : 'drugs-before.html')
    }
    restoreHelp(session)
  }
  if (pageName === 'changes') {
    if (session.drugUse !== 'yes') {
      window.location.assign('drugs.html')
      return
    }
    if (!beforeAnswered(session)) {
      window.location.assign(nextDrugQuestion(session))
      return
    }
    if (!helpAnswered(session)) {
      window.location.assign(helpPage(session))
      return
    }
    if (!fromSummary()) ensureBackLink(helpPage(session))
    restoreChanges(session)
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-du-go-analysis]')?.addEventListener('click', () => {
      openAnalysisTab()
    })
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
    const previous = getSanSession()
    const drugLastUsed = {}
    answers.drugTypes.forEach((id) => {
      const value = previous.drugLastUsed && previous.drugLastUsed[id]
      if (value) drugLastUsed[id] = value
    })
    setSanSession({ ...answers, drugLastUsed, drugComplete: false })
    const next = getSanSession()
    window.location.assign(fromSummary() && beforeAnswered(next) ? 'drugs-summary.html' : 'drugs-when.html')
  })

  const whenForm = document.getElementById('san-drugs-when-form')
  if (whenForm) bindExtraDrugControls(whenForm, session)
  whenForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const current = getSanSession()
    const answers = readWhenAnswers(current)
    const errors = validateWhen(answers, current)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const extraIds = new Set(answers.extraDrugs.map((drug) => drug.id))
    const previous = current
    const injectedDrugs = Array.isArray(previous.injectedDrugs)
      ? previous.injectedDrugs.filter((id) => {
        if (id === 'none') return true
        if (!isInjectableDrug(id)) return false
        return !String(id).startsWith('extra-') || extraIds.has(id)
      })
      : []
    setSanSession({
      ...answers,
      drugFrequency: pruneExtraKeyed(previous.drugFrequency, extraIds),
      drugFrequencyDetails: pruneExtraKeyed(previous.drugFrequencyDetails, extraIds),
      injectedWhen: pruneExtraKeyed(previous.injectedWhen, extraIds),
      injectedDrugs,
      drugComplete: false
    })
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
    const selected = answers.injectedDrugs.filter((id) => id !== 'none')
    const previousSelected = injectedDrugIds(current)
    setSanSession({
      ...answers,
      injectedWhen: keptInjectedWhen(selected, current),
      drugComplete: false
    })
    if (selected.length && (!fromSummary() || !sameIds(selected, previousSelected))) {
      window.location.assign('drugs-injected.html')
      return
    }
    window.location.assign(fromSummary() ? 'drugs-summary.html' : helpPage(getSanSession()))
  })

  const injectedForm = document.getElementById('san-drugs-injected-form')
  injectedForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const current = getSanSession()
    const answers = readInjectedWhenAnswers(current)
    const errors = validateInjectedWhen(answers, current)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, drugComplete: false })
    window.location.assign(fromSummary() ? 'drugs-summary.html' : helpPage(getSanSession()))
  })

  const helpForm = document.getElementById('san-drugs-help-form')
  helpForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const current = getSanSession()
    const answers = readHelpAnswers()
    const errors = validateHelp(answers, current)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, drugComplete: false })
    window.location.assign(fromSummary() && getSanSession().drugChanges ? 'drugs-summary.html' : 'drugs-changes.html')
  })

  const changesForm = document.getElementById('san-drugs-changes-form')
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
    setSanSession({ ...answers, drugComplete: false })
    window.location.assign('drugs-summary.html')
  })

  const analysisForm = document.getElementById('san-drugs-analysis-form')
  analysisForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (analysisNotRequired(getSanSession())) {
      clearErrors()
      setSanSession({ drugComplete: true })
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
    setSanSession({ ...answers, drugComplete: true })
    showCompletedAnalysis()
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.startsWith("/san-research/")) return
  initDrugs()
})
