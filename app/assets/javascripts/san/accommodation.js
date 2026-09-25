//
// Accommodation section of the Strengths and needs prototype
//

import { getSanSession, replaceSanSession, sectionLinkHref, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, labelled, scrollToHash } from './form.js'

const EXAMPLE_COMPLETE = {
  accommodationType: 'settled',
  accommodationSubtype: 'renting-privately',
  accommodationSubtypeDetails: '',
  livingWith: ['friends'],
  livingPartnerDetails: '',
  livingOtherDetails: '',
  locationSuitable: 'no',
  locationReasons: ['victimised'],
  locationOtherDetails: '',
  accommodationSuitable: 'yes-concerns',
  suitabilityReasons: ['exploited'],
  suitabilityOtherDetails: '',
  changes: 'active',
  changesDetails: '',
  analysisStrengths: 'yes',
  analysisStrengthsDetails: 'a',
  analysisHarm: 'yes',
  analysisHarmDetails: 'a',
  analysisReoffending: 'no',
  analysisReoffendingDetails: 's',
  accommodationComplete: true
}

const TYPE_LABELS = {
  settled: 'Settled',
  temporary: 'Temporary',
  none: 'No accommodation'
}

const SUBTYPE_LABELS = {
  homeowner: 'Homeowner',
  'friends-family': 'Living with friends or family',
  'renting-privately': 'Renting privately',
  'renting-social': 'Renting from social, local authority or other',
  healthcare: 'Residential healthcare',
  supported: 'Supported accommodation',
  'approved-premises': 'Approved premises',
  cas2: 'Community Accommodation Service Tier 2 (CAS2)',
  cas3: 'Community Accommodation Service Tier 3 (CAS3)',
  immigration: 'Immigration accommodation',
  'short-term': 'Short term accommodation',
  campsite: 'Campsite',
  'emergency-hostel': 'Emergency hostel',
  homeless: 'Homeless - includes squatting',
  'rough-sleeping': 'Rough sleeping',
  shelter: 'Shelter',
  unknown: 'Unknown'
}

const LIVING_LABELS = {
  family: 'Family',
  friends: 'Friends',
  partner: 'Partner',
  'under-18': 'Person under 18 years old',
  other: 'Other',
  unknown: 'Unknown',
  alone: 'Alone'
}

const LOCATION_REASON_LABELS = {
  associates: 'Close to criminal associates',
  victimised: 'Close to someone who has victimised them',
  victim: 'Close to victim or possible victims',
  neighbours: 'Difficulty with neighbours',
  safety: 'Safety of the area',
  other: 'Other'
}

const SUITABILITY_REASON_LABELS = {
  issues: 'Issues with the property - for example, poor kitchen or bathroom facilities',
  overcrowding: 'Overcrowding',
  exploited: 'Risk of their accommodation being exploited by others - for example, cuckooing',
  safety: 'Safety of accommodation',
  'victim-lives': 'Victim lives with them',
  victimised: 'Victimised by someone living with them',
  other: 'Other'
}

const SUITABLE_LABELS = {
  yes: 'Yes',
  'yes-concerns': 'Yes, with concerns',
  no: 'No'
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

const YES_NO = { yes: 'Yes', no: 'No', unknown: 'Unknown' }

const NO_ACCOMMODATION_REASON_LABELS = {
  alcohol: 'Alcohol related problems',
  drugs: 'Drug related problems',
  financial: 'Financial difficulties',
  'risk-to-others': 'Left previous accommodation due to risk to others',
  'own-safety': 'Left previous accommodation for their own safety',
  released: 'No accommodation when released from prison',
  other: 'Other'
}

const FUTURE_TYPE_LABELS = {
  'awaiting-assessment': 'Awaiting assessment',
  'awaiting-placement': 'Awaiting placement',
  buy: 'Buy a house',
  'friends-family': 'Living with friends or family',
  'rent-privately': 'Rent privately',
  'rent-social': 'Rent from social, local authority or other',
  healthcare: 'Residential healthcare',
  supported: 'Supported accommodation',
  other: 'Other'
}

const FUTURE_DETAILS_IDS = {
  'awaiting-assessment': 'future-awaiting-assessment-details',
  'awaiting-placement': 'future-awaiting-placement-details',
  other: 'future-other-details'
}

const AP_CAS_SUBTYPES = ['approved-premises', 'cas2', 'cas3']

const ROUTE_QUESTIONS = {
  settled: ['living-with', 'location', 'suitable', 'changes'],
  'temporary-short-term': ['living-with', 'location', 'suitable', 'future', 'changes'],
  'temporary-ap-cas': ['location', 'suitable', 'future', 'changes'],
  none: ['no-accommodation', 'past-help', 'future', 'changes']
}

const accommodationRoute = (session) => {
  if (session.accommodationType === 'settled') return 'settled'
  if (session.accommodationType === 'none') return 'none'
  if (session.accommodationType === 'temporary') {
    // Unknown temporary accommodation follows short-term and immigration.
    return AP_CAS_SUBTYPES.includes(session.accommodationSubtype)
      ? 'temporary-ap-cas'
      : 'temporary-short-term'
  }
  return ''
}

const routeShows = (route, question) => (ROUTE_QUESTIONS[route] || []).includes(question)

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

const inputValue = (id) => {
  const field = document.getElementById(id)
  if (!(field instanceof HTMLInputElement) || isInHiddenConditional(field)) return ''
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

const setInput = (id, value) => {
  const field = document.getElementById(id)
  if (field instanceof HTMLInputElement) field.value = value || ''
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
    const fieldset = group.querySelector('fieldset')
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
  const complete = !!session.accommodationComplete
  const label = complete ? 'Complete' : 'Incomplete'

  document.querySelectorAll('[data-san-status]').forEach((tag) => {
    tag.textContent = label
    tag.classList.toggle('govuk-tag--light-blue', complete)
    tag.classList.toggle('govuk-tag--light-grey', !complete)
  })

  document.querySelectorAll('[data-san-status-text]').forEach((node) => {
    node.textContent = label
  })

  document.querySelectorAll('[data-section-complete="accommodation"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  const link = document.querySelector('[data-san-section-link="accommodation"]')
  if (link && session.accommodationType) {
    link.setAttribute('href', sectionLinkHref('accommodation', 'accommodation-summary.html'))
  }

  const employmentComplete = !!session.employmentComplete
  document.querySelectorAll('[data-section-complete="employment"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', employmentComplete)
  })
  const employmentLink = document.querySelector('[data-san-section-link="employment"]')
  if (employmentLink && session.employmentStatus) {
    employmentLink.setAttribute('href', sectionLinkHref('employment', 'employment-summary.html'))
  }

  const financesComplete = !!session.financeComplete
  document.querySelectorAll('[data-section-complete="finances"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', financesComplete)
  })
  const financesLink = document.querySelector('[data-san-section-link="finances"]')
  if (financesLink && Array.isArray(session.financeIncome) && session.financeIncome.length) {
    financesLink.setAttribute('href', sectionLinkHref('finances', 'finances-summary.html'))
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

  document.querySelectorAll('[data-section-complete="relationships"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.relationshipsComplete)
  })
  const relationshipsLink = document.querySelector('[data-san-section-link="relationships"]')
  if (relationshipsLink && Array.isArray(session.relationshipsChildren) && session.relationshipsChildren.length > 0) {
    relationshipsLink.setAttribute('href', sectionLinkHref('relationships', 'personal-relationships-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="health"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.healthComplete)
  })
  const healthLink = document.querySelector('[data-san-section-link="health"]')
  if (healthLink && session.healthPhysical) {
    healthLink.setAttribute('href', sectionLinkHref('health', 'health-summary.html'))
  }

  document.querySelectorAll('[data-section-complete="thinking"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', !!session.thinkingComplete)
  })
  const thinkingLink = document.querySelector('[data-san-section-link="thinking"]')
  if (thinkingLink && session.thinkingConsequences) {
    thinkingLink.setAttribute('href', sectionLinkHref('thinking', 'thinking-behaviours-summary.html'))
  }
}

const detailsAnswered = (session) => {
  const route = accommodationRoute(session)
  if (!route || !session.changes) return false
  if (routeShows(route, 'living-with') && !(Array.isArray(session.livingWith) && session.livingWith.length)) return false
  if (routeShows(route, 'location') && !session.locationSuitable) return false
  if (routeShows(route, 'suitable') && !session.accommodationSuitable) return false
  if (routeShows(route, 'no-accommodation') && !(Array.isArray(session.noAccommodationReasons) && session.noAccommodationReasons.length)) return false
  if (routeShows(route, 'future') && !session.futurePlanned) return false
  if (routeShows(route, 'future') && session.futurePlanned === 'yes' && !session.futureType) return false
  return true
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
  const editAttribute = editTarget ? ` data-san-edit-analysis="${escapeHtml(editTarget)}"` : ''
  return `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(question)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${linkHref}"${editAttribute}>Change<span class="govuk-visually-hidden"> ${escapeHtml(question)}</span></a>
    </dd>
  </div>`
}

const reasonLines = (labels, values, otherDetails) => {
  const lines = (values || []).map((value) => labelled(labels, value)).filter(Boolean)
  if ((values || []).includes('other') && otherDetails) lines.push(otherDetails)
  return lines
}

const accommodationRows = (session) => {
  const route = accommodationRoute(session)
  const rows = []
  if (session.accommodationType) {
    const lines = [labelled(TYPE_LABELS, session.accommodationType)]
    if (session.accommodationSubtype) lines.push(labelled(SUBTYPE_LABELS, session.accommodationSubtype))
    if (session.accommodationSubtypeDetails) lines.push(session.accommodationSubtypeDetails)
    if (session.accommodationType === 'temporary') {
      const endDate = ['Day', 'Month', 'Year'].map((part) => String(endDatePart(session, part) || '').trim()).filter(Boolean).join(' ')
      if (endDate) lines.push(`Expected end date: ${endDate}`)
    }
    rows.push(summaryRow(
      "What type of accommodation does Alex currently have?",
      lines,
      summaryChangeHref('accommodation'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'no-accommodation') && Array.isArray(session.noAccommodationReasons) && session.noAccommodationReasons.length) {
    const labels = session.noAccommodationReasons.map((value) => labelled(NO_ACCOMMODATION_REASON_LABELS, value)).filter(Boolean)
    const lines = [...labels]
    if (session.noAccommodationReasons.includes('other') && session.noAccommodationOtherDetails) {
      lines.push(session.noAccommodationOtherDetails)
    }
    rows.push(summaryRow(
      'Why does Alex have no accommodation?',
      lines,
      summaryChangeHref('accommodation-details', 'no-accommodation'),
      { secondaryFrom: labels.length }
    ))
  }

  if (routeShows(route, 'past-help') && session.pastAccommodationHelp) {
    rows.push(summaryRow(
      "What's helped Alex stay in accommodation in the past? (optional)",
      [session.pastAccommodationHelp],
      summaryChangeHref('accommodation-details', 'past-help')
    ))
  }

  if (routeShows(route, 'living-with') && Array.isArray(session.livingWith) && session.livingWith.length) {
    const labels = session.livingWith.map((value) => labelled(LIVING_LABELS, value)).filter(Boolean)
    const details = []
    if (session.livingWith.includes('partner') && session.livingPartnerDetails) details.push(session.livingPartnerDetails)
    if (session.livingWith.includes('other') && session.livingOtherDetails) details.push(session.livingOtherDetails)
    rows.push(summaryRow(
      'Who is Alex living with?',
      [...labels, ...details],
      summaryChangeHref('accommodation-details', 'living-with'),
      { secondaryFrom: labels.length }
    ))
  }

  if (routeShows(route, 'location') && session.locationSuitable) {
    const lines = [labelled(YES_NO, session.locationSuitable)]
    if (session.locationSuitable === 'no') {
      lines.push(...reasonLines(LOCATION_REASON_LABELS, session.locationReasons, session.locationOtherDetails))
    }
    rows.push(summaryRow(
      "Is the location of Alex's accommodation suitable?",
      lines,
      summaryChangeHref('accommodation-details', 'location'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'suitable') && session.accommodationSuitable) {
    const lines = [labelled(SUITABLE_LABELS, session.accommodationSuitable)]
    if (session.accommodationSuitable !== 'yes') {
      lines.push(...reasonLines(SUITABILITY_REASON_LABELS, session.suitabilityReasons, session.suitabilityOtherDetails))
    }
    rows.push(summaryRow(
      "Is Alex's accommodation suitable?",
      lines,
      summaryChangeHref('accommodation-details', 'suitable'),
      { secondaryFrom: 1 }
    ))
  }

  if (routeShows(route, 'future') && session.futurePlanned) {
    const lines = [labelled(YES_NO, session.futurePlanned)]
    if (session.futurePlanned === 'yes' && session.futureType) {
      lines.push(labelled(FUTURE_TYPE_LABELS, session.futureType))
      if (session.futureDetails) lines.push(session.futureDetails)
    }
    rows.push(summaryRow(
      'Does Alex have future accommodation planned?',
      lines,
      summaryChangeHref('accommodation-details', 'future'),
      { secondaryFrom: 1 }
    ))
  }

  if (session.changes) {
    const lines = [labelled(CHANGES_LABELS, session.changes)]
    if (session.changesDetails) lines.push(session.changesDetails)
    rows.push(summaryRow(
      'Does Alex want to make changes to their accommodation?',
      lines,
      summaryChangeHref('accommodation-details', 'changes'),
      { secondaryFrom: 1 }
    ))
  }

  return rows
}

const analysisRows = (session) => {
  const rows = []
  if (session.analysisStrengths) {
    rows.push(summaryRow(
      "Are there any strengths or protective factors related to Alex's accommodation?",
      [labelled(YES_NO, session.analysisStrengths), session.analysisStrengthsDetails],
      '#analysis-strengths',
      { secondaryFrom: 1 }
    ))
  }
  if (session.analysisHarm) {
    rows.push(summaryRow(
      "Is Alex's accommodation linked to risk of serious harm?",
      [labelled(YES_NO, session.analysisHarm), session.analysisHarmDetails],
      '#analysis-harm',
      { secondaryFrom: 1 }
    ))
  }
  if (session.analysisReoffending) {
    rows.push(summaryRow(
      "Is Alex's accommodation linked to risk of reoffending?",
      [labelled(YES_NO, session.analysisReoffending), session.analysisReoffendingDetails],
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
  const mount = document.querySelector('[data-san-summary]')
  if (!mount) return

  const complete = !!session.accommodationComplete
  const rows = accommodationRows(session)
  const goButton = document.querySelector('[data-san-go-analysis]')

  if (!rows.length) {
    mount.innerHTML = `<p class="govuk-body">You have not answered these questions yet.</p>
      <p class="govuk-body"><a class="govuk-link" href="accommodation.html">Answer accommodation questions</a></p>`
  } else {
    let followOn = ''
    if (!complete && !detailsAnswered(session)) {
      followOn = '<p class="govuk-body"><a class="govuk-link" href="accommodation-details.html">Continue</a></p>'
    }
    mount.innerHTML = `<dl class="govuk-summary-list san-summary-list">${rows.join('')}</dl>${followOn}`
  }

  if (goButton) {
    const showButton = !complete && detailsAnswered(session)
    goButton.hidden = !showButton
    goButton.classList.toggle('san-go-analysis--hidden', !showButton)
  }

  renderAnalysisSummary(session)
}

const renderAnalysisSummary = (session) => {
  const mount = document.querySelector('[data-san-analysis-summary]')
  const form = document.getElementById('san-accommodation-analysis-form')
  if (!mount || !form) return

  if (!session.accommodationComplete) {
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
  const mount = document.querySelector('[data-san-analysis-summary]')
  const form = document.getElementById('san-accommodation-analysis-form')
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

const subtypeField = (type) => {
  if (type === 'settled') return { name: 'settled_type', detailsId: 'settled-unknown-details' }
  if (type === 'temporary') return { name: 'temporary_type', detailsId: 'temporary-unknown-details' }
  if (type === 'none') return { name: 'none_type', detailsId: 'none-unknown-details' }
  return null
}

const endDateId = (subtype, part) => `temporary-${subtype}-end-date-${part}`

const endDatePart = (session, part) => {
  const key = `temporaryEnd${part}`
  if (Object.prototype.hasOwnProperty.call(session, key)) return session[key]
  return session[`immigrationEnd${part}`]
}

const readTypeAnswers = () => {
  const accommodationType = checkedValue('accommodation_type')
  const subtype = subtypeField(accommodationType)
  const accommodationSubtype = subtype ? checkedValue(subtype.name) : ''
  const temporary = accommodationType === 'temporary' && accommodationSubtype
  return {
    accommodationType,
    accommodationSubtype,
    accommodationSubtypeDetails: subtype ? fieldValue(subtype.detailsId) : '',
    temporaryEndDay: temporary ? inputValue(endDateId(accommodationSubtype, 'day')) : '',
    temporaryEndMonth: temporary ? inputValue(endDateId(accommodationSubtype, 'month')) : '',
    temporaryEndYear: temporary ? inputValue(endDateId(accommodationSubtype, 'year')) : '',
    immigrationEndDay: '',
    immigrationEndMonth: '',
    immigrationEndYear: ''
  }
}

const emptyDetailAnswers = () => ({
  livingWith: [],
  livingPartnerDetails: '',
  livingOtherDetails: '',
  locationSuitable: '',
  locationReasons: [],
  locationOtherDetails: '',
  accommodationSuitable: '',
  suitabilityReasons: [],
  suitabilityOtherDetails: '',
  noAccommodationReasons: [],
  noAccommodationOtherDetails: '',
  pastAccommodationHelp: '',
  futurePlanned: '',
  futureType: '',
  futureDetails: '',
  changes: '',
  changesDetails: ''
})

const readDetailsAnswers = (route) => {
  const answers = emptyDetailAnswers()

  if (routeShows(route, 'living-with')) {
    answers.livingWith = checkedValues('living_with')
    answers.livingPartnerDetails = fieldValue('living-partner-details')
    answers.livingOtherDetails = fieldValue('living-other-details')
  }

  if (routeShows(route, 'location')) {
    answers.locationSuitable = checkedValue('location_suitable')
    answers.locationReasons = answers.locationSuitable === 'no' ? checkedValues('location_reasons') : []
    answers.locationOtherDetails = answers.locationSuitable === 'no' ? fieldValue('location-other-details') : ''
  }

  if (routeShows(route, 'suitable')) {
    answers.accommodationSuitable = checkedValue('accommodation_suitable')
    const reasonName = answers.accommodationSuitable === 'yes-concerns'
      ? 'suitability_reasons_concerns'
      : answers.accommodationSuitable === 'no'
        ? 'suitability_reasons_no'
        : ''
    answers.suitabilityReasons = reasonName ? checkedValues(reasonName) : []
    answers.suitabilityOtherDetails = answers.accommodationSuitable === 'yes-concerns'
      ? fieldValue('concerns-other-details')
      : answers.accommodationSuitable === 'no'
        ? fieldValue('unsuitable-other-details')
        : ''
  }

  if (routeShows(route, 'no-accommodation')) {
    answers.noAccommodationReasons = checkedValues('no_accommodation_reasons')
    answers.noAccommodationOtherDetails = fieldValue('no-accommodation-other-details')
  }

  if (routeShows(route, 'past-help')) {
    answers.pastAccommodationHelp = fieldValue('past-accommodation-help')
  }

  if (routeShows(route, 'future')) {
    answers.futurePlanned = checkedValue('future_planned')
    answers.futureType = answers.futurePlanned === 'yes' ? checkedValue('future_type') : ''
    const detailsId = FUTURE_DETAILS_IDS[answers.futureType]
    answers.futureDetails = detailsId ? fieldValue(detailsId) : ''
  }

  if (routeShows(route, 'changes')) {
    answers.changes = checkedValue('changes')
    answers.changesDetails = answers.changes ? fieldValue(`changes-${answers.changes}-details`) : ''
  }

  return answers
}

const readAnalysisAnswers = () => {
  const analysisStrengths = checkedValue('analysis_strengths')
  const analysisHarm = checkedValue('analysis_harm')
  const analysisReoffending = checkedValue('analysis_reoffending')
  return {
    analysisStrengths,
    analysisStrengthsDetails: analysisStrengths ? fieldValue(`analysis-strengths-${analysisStrengths}-details`) : '',
    analysisHarm,
    analysisHarmDetails: analysisHarm ? fieldValue(`analysis-harm-${analysisHarm}-details`) : '',
    analysisReoffending,
    analysisReoffendingDetails: analysisReoffending ? fieldValue(`analysis-reoffending-${analysisReoffending}-details`) : ''
  }
}

const validateType = (answers) => {
  const errors = []
  if (!answers.accommodationType) {
    errors.push({
      group: 'accommodation-type',
      href: '#accommodation-type',
      text: 'Select the type of accommodation Alex currently has'
    })
  } else if (!answers.accommodationSubtype) {
    errors.push({
      group: 'accommodation-type',
      href: `#${answers.accommodationType}-type`,
      text: 'Select the type of accommodation'
    })
  }
  return errors
}

const validateDetails = (answers, route) => {
  const errors = []
  if (routeShows(route, 'living-with') && !answers.livingWith.length) {
    errors.push({ group: 'living-with', href: '#living-with', text: 'Select who Alex is living with' })
  }
  if (routeShows(route, 'location') && !answers.locationSuitable) {
    errors.push({
      group: 'location',
      href: '#location',
      text: "Select if the location of Alex's accommodation is suitable"
    })
  }
  if (routeShows(route, 'suitable') && !answers.accommodationSuitable) {
    errors.push({
      group: 'suitable',
      href: '#suitable',
      text: "Select if Alex's accommodation is suitable"
    })
  }
  if (routeShows(route, 'no-accommodation') && !answers.noAccommodationReasons.length) {
    errors.push({
      group: 'no-accommodation',
      href: '#no-accommodation',
      text: 'Select why Alex has no accommodation'
    })
  }
  if (routeShows(route, 'future') && !answers.futurePlanned) {
    errors.push({
      group: 'future',
      href: '#future',
      text: 'Select if Alex has future accommodation planned'
    })
  } else if (routeShows(route, 'future') && answers.futurePlanned === 'yes' && !answers.futureType) {
    errors.push({
      group: 'future',
      href: '#future-type',
      text: 'Select the future accommodation Alex has planned'
    })
  }
  if (!answers.changes) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their accommodation'
    })
  } else if (answers.changes === 'not-present' && !answers.changesDetails) {
    errors.push({
      group: 'changes',
      href: '#changes-not-present-details',
      text: 'Enter details about why Alex is not present'
    })
  }
  return errors
}

const validateAnalysis = (answers) => {
  const errors = []
  const questions = [
    ['analysisStrengths', 'analysis-strengths', 'Select if there are strengths or protective factors related to accommodation', 'Enter details about the strengths or protective factors'],
    ['analysisHarm', 'analysis-harm', "Select if Alex's accommodation is linked to risk of serious harm", 'Enter details about the link to risk of serious harm'],
    ['analysisReoffending', 'analysis-reoffending', "Select if Alex's accommodation is linked to risk of reoffending", 'Enter details about the link to risk of reoffending']
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

const restoreType = (session) => {
  selectRadio('accommodation_type', session.accommodationType)
  const subtype = subtypeField(session.accommodationType)
  if (subtype) {
    selectRadio(subtype.name, session.accommodationSubtype)
    if (session.accommodationSubtype === 'unknown') setField(subtype.detailsId, session.accommodationSubtypeDetails)
    if (session.accommodationType === 'temporary' && session.accommodationSubtype) {
      setInput(endDateId(session.accommodationSubtype, 'day'), endDatePart(session, 'Day'))
      setInput(endDateId(session.accommodationSubtype, 'month'), endDatePart(session, 'Month'))
      setInput(endDateId(session.accommodationSubtype, 'year'), endDatePart(session, 'Year'))
    }
  }
}

const applyDetailsRoute = (route) => {
  const form = document.getElementById('san-accommodation-details-form')
  if (form) form.setAttribute('data-san-route', route)

  const visible = []
  document.querySelectorAll('[data-san-question]').forEach((block) => {
    const show = routeShows(route, block.getAttribute('data-san-question'))
    block.hidden = !show
    block.classList.toggle('san-is-hidden', !show)
    block.classList.remove('san-question')
    if (show) visible.push(block)
  })
  visible.slice(1).forEach((block) => block.classList.add('san-question'))
}

const restoreDetails = (session) => {
  selectChecks('living_with', session.livingWith)
  setField('living-partner-details', session.livingPartnerDetails)
  setField('living-other-details', session.livingOtherDetails)
  selectRadio('location_suitable', session.locationSuitable)
  selectChecks('location_reasons', session.locationReasons)
  setField('location-other-details', session.locationOtherDetails)
  selectRadio('accommodation_suitable', session.accommodationSuitable)
  if (session.accommodationSuitable === 'yes-concerns') {
    selectChecks('suitability_reasons_concerns', session.suitabilityReasons)
    setField('concerns-other-details', session.suitabilityOtherDetails)
  }
  if (session.accommodationSuitable === 'no') {
    selectChecks('suitability_reasons_no', session.suitabilityReasons)
    setField('unsuitable-other-details', session.suitabilityOtherDetails)
  }
  selectChecks('no_accommodation_reasons', session.noAccommodationReasons)
  setField('no-accommodation-other-details', session.noAccommodationOtherDetails)
  setField('past-accommodation-help', session.pastAccommodationHelp)
  selectRadio('future_planned', session.futurePlanned)
  selectRadio('future_type', session.futureType)
  const futureDetailsId = FUTURE_DETAILS_IDS[session.futureType]
  if (futureDetailsId) setField(futureDetailsId, session.futureDetails)
  selectRadio('changes', session.changes)
  if (session.changes) setField(`changes-${session.changes}-details`, session.changesDetails)
}

const restoreAnalysis = (session) => {
  selectRadio('analysis_strengths', session.analysisStrengths)
  if (session.analysisStrengths) setField(`analysis-strengths-${session.analysisStrengths}-details`, session.analysisStrengthsDetails)
  selectRadio('analysis_harm', session.analysisHarm)
  if (session.analysisHarm) setField(`analysis-harm-${session.analysisHarm}-details`, session.analysisHarmDetails)
  selectRadio('analysis_reoffending', session.analysisReoffending)
  if (session.analysisReoffending) setField(`analysis-reoffending-${session.analysisReoffending}-details`, session.analysisReoffendingDetails)
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
  replaceSanSession(EXAMPLE_COMPLETE)
  params.delete('example')
  const query = params.toString()
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', next)
}

const initSanAccommodation = () => {
  const page = document.querySelector('[data-san-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('accommodation-summary.html')

  const pageName = page.getAttribute('data-san-page')
  if (pageName === 'type') restoreType(session)
  if (pageName === 'details') {
    const route = accommodationRoute(session)
    if (!route) {
      window.location.assign('accommodation')
      return
    }
    applyDetailsRoute(route)
    restoreDetails(session)
  }
  if (pageName === 'summary') {
    restoreAnalysis(session)
    renderSummary(session)
    document.querySelector('[data-san-go-analysis]')?.addEventListener('click', openAnalysisTab)
    document.querySelector('[data-san-analysis-summary]')?.addEventListener('click', (event) => {
      const link = event.target.closest('[data-san-edit-analysis]')
      if (!link) return
      event.preventDefault()
      showAnalysisForm(link.getAttribute('data-san-edit-analysis'))
    })
    if (window.location.hash === '#practitioner-analysis') openAnalysisTab()
  }

  revealSoon()
  updateAllCharacterCounts()
  window.setTimeout(scrollToHash, 50)

  document.addEventListener('input', (event) => {
    if (event.target instanceof HTMLTextAreaElement) updateCharacterCount(event.target)
  })

  const typeForm = document.getElementById('san-accommodation-type-form')
  typeForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const answers = readTypeAnswers()
    const errors = validateType(answers)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const previousRoute = accommodationRoute(getSanSession())
    const nextRoute = accommodationRoute(answers)
    const updates = { ...answers, accommodationComplete: false }
    if (nextRoute !== previousRoute) Object.assign(updates, emptyDetailAnswers())
    setSanSession(updates)
    // A change inside the same route, such as homeowner to renting privately, returns to the summary.
    // A change of route continues so the questions for that route can be answered.
    const returnToSummary = fromSummary() && nextRoute === previousRoute
    window.location.assign(returnToSummary ? 'accommodation-summary' : 'accommodation-details')
  })

  const detailsForm = document.getElementById('san-accommodation-details-form')
  detailsForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const route = accommodationRoute(getSanSession())
    const answers = readDetailsAnswers(route)
    const errors = validateDetails(answers, route)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    setSanSession({ ...answers, accommodationComplete: false })
    window.location.assign('accommodation-summary.html')
  })

  const analysisForm = document.getElementById('san-accommodation-analysis-form')
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
    setSanSession({ ...answers, accommodationComplete: true })
    window.location.assign('accommodation-summary.html#practitioner-analysis')
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initSanAccommodation()
})
