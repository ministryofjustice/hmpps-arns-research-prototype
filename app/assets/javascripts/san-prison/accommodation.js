//
// Accommodation — SAN Prison research journey.
//
// Pages: accommodation.html → accommodation-settled.html → one question per screen on accommodation-details.html?step=…
// Location / suitability answers that raise concerns open accommodation-concerns.html.
// Release plans determine whether suitability questions are relevant.
//

import { getSanSession, isSanPrisonJourney, replaceSanSession, setSanSession } from './session.js'
import { escapeHtml, revealCheckedConditionals, updateCharacterCount, updateAllCharacterCounts, clearErrors, showErrors, focusTargetField, labelled, scrollToHash, CHANGES_LABELS, YES_NO_UNKNOWN as YES_NO, revealSoon, checkedValue, checkedValues, fieldValue, selectRadio, selectChecks, setField, setHidden, fromSummary } from './form.js'
import { applySanProgress } from './progress.js'

// Pre-filled session for ?example=complete.
const EXAMPLE_COMPLETE = {
  hasSomewhereToLive: 'yes',
  accommodationSettled: 'yes',
  releasePlans: 'yes',
  releasePlansDetails: 'Plans to live with friends after release.',
  livingWith: ['friends'],
  livingPartnerDetails: '',
  livingOtherDetails: '',
  locationSuitable: 'no',
  locationReasons: ['victimised'],
  locationOtherDetails: '',
  accommodationSuitable: 'yes-concerns',
  suitabilityReasons: ['exploited'],
  suitabilityOtherDetails: '',
  locationConcernsSeen: true,
  suitabilityConcernsSeen: true,
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

// Display labels for saved answers.
const LIVING_LABELS = {
  family: 'Family',
  friends: 'Friend',
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
  issues: 'Issues with the property',
  overcrowding: 'Overcrowding',
  exploited: 'Risk of their accommodation being exploited by others',
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

// Each question is its own screen. Build the route from the current release plans.
const accommodationRoute = (session) => {
  if (!['yes', 'no'].includes(session.hasSomewhereToLive)) return null
  if (session.hasSomewhereToLive === 'no') {
    const steps = ['no-accommodation', 'release-plans']
    if (session.releasePlans === 'no') return [...steps, 'changes']
    return [...steps, 'living-with', 'location', 'suitable', 'changes']
  }
  if (!['yes', 'no'].includes(session.accommodationSettled)) return null
  const steps = ['release-plans']
  if (session.releasePlans === 'no') return [...steps, 'changes']
  steps.push('living-with')
  return [...steps, 'location', 'suitable', 'changes']
}

const routeShows = (route, question) => detailSteps(route).includes(question)

const detailSteps = (route) => route || []

const firstDetailStep = (route) => detailSteps(route)[0] || ''

const CONCERN_BLOCK = {
  location: 'location-concerns',
  suitable: 'suitability-concerns'
}

const needsLocationConcerns = (session, route) => routeShows(route, 'location') && session.locationSuitable === 'no'

const needsSuitabilityConcerns = (session, route) => {
  return routeShows(route, 'suitable') && ['yes', 'yes-concerns', 'no'].includes(session.accommodationSuitable)
}

const followOnConcern = (session, route, step) => {
  if (step === 'location' && needsLocationConcerns(session, route)) return 'location'
  if (step === 'suitable' && needsSuitabilityConcerns(session, route)) return 'suitable'
  return ''
}

const concernSeen = (session, step) => {
  if (step === 'location') return !!session.locationConcernsSeen
  if (step === 'suitable') return !!session.suitabilityConcernsSeen
  return true
}

const concernTriggerChanged = (previous, next, step) => {
  if (step === 'location') return (previous.locationSuitable === 'no') !== (next.locationSuitable === 'no')
  if (step === 'suitable') {
    const needs = (value) => ['yes', 'yes-concerns', 'no'].includes(value)
    return needs(previous.accommodationSuitable) !== needs(next.accommodationSuitable)
  }
  return false
}

const stepParam = () => new URLSearchParams(window.location.search).get('step') || ''

const stepHref = (page, step, options = {}) => {
  const params = new URLSearchParams()
  if (step) params.set('step', step)
  if (options.fromSummary) params.set('from', 'summary')
  const query = params.toString()
  return query ? `${page}?${query}` : page
}

const pageFile = (page) => (page === 'concerns' ? 'accommodation-concerns' : 'accommodation-details')

const stepAnswered = (session, step) => {
  if (step === 'release-plans') return !!session.releasePlans && (session.releasePlans !== 'yes' || !!session.releasePlansDetails)
  if (step === 'location') return !!session.locationSuitable
  if (step === 'suitable') return !!session.accommodationSuitable
  if (step === 'changes') return !!session.changes
  if (step === 'no-accommodation') {
    return Array.isArray(session.noAccommodationReasons) && session.noAccommodationReasons.length > 0
  }
  if (step === 'living-with') return Array.isArray(session.livingWith) && session.livingWith.length > 0
  if (step === 'future') {
    if (!session.futurePlanned) return false
    if (session.futurePlanned === 'yes' && !session.futureType) return false
    return true
  }
  if (step === 'past-help') return true
  return false
}

const nextDetailStep = (route, step) => {
  const steps = detailSteps(route)
  const index = steps.indexOf(step)
  if (index < 0 || index >= steps.length - 1) return ''
  return steps[index + 1]
}

const resumeTarget = (session, route) => {
  for (const step of detailSteps(route)) {
    if (!stepAnswered(session, step)) return { page: 'details', step }
    const concern = followOnConcern(session, route, step)
    if (concern && !concernSeen(session, step)) return { page: 'concerns', step: concern }
  }
  return null
}

const resumeHref = (session) => {
  if (session.hasSomewhereToLive !== 'yes' && session.hasSomewhereToLive !== 'no') return 'accommodation.html'
  if (session.hasSomewhereToLive === 'yes' && !session.accommodationSettled) return 'accommodation-settled.html'
  const route = accommodationRoute(session)
  if (!route) return 'accommodation.html'
  const resume = resumeTarget(session, route)
  if (!resume) return stepHref('accommodation-details', firstDetailStep(route))
  return stepHref(pageFile(resume.page), resume.step)
}

const backHrefForDetail = (session, route, step) => {
  const steps = detailSteps(route)
  const index = steps.indexOf(step)
  if (index <= 0) {
    return session.hasSomewhereToLive === 'yes' ? 'accommodation-settled.html' : 'accommodation.html'
  }
  const previous = steps[index - 1]
  const concern = followOnConcern(session, route, previous)
  if (concern) return stepHref('accommodation-concerns', concern)
  return stepHref('accommodation-details', previous)
}

const continueAfterDetail = (previous, next, route, step) => {
  const concern = followOnConcern(next, route, step)
  if (concern && (!fromSummary() || concernTriggerChanged(previous, next, step) || !concernSeen(next, step))) {
    window.location.assign(stepHref('accommodation-concerns', concern, { fromSummary: fromSummary() }))
    return
  }
  if (fromSummary() && detailsAnswered(next)) {
    window.location.assign('accommodation-summary.html')
    return
  }
  const following = nextDetailStep(route, step)
  if (following) {
    window.location.assign(stepHref('accommodation-details', following, { fromSummary: fromSummary() }))
    return
  }
  window.location.assign('accommodation-summary.html')
}

const continueAfterConcern = (session, route, step) => {
  if (fromSummary()) {
    const resume = resumeTarget(session, route)
    if (resume) {
      window.location.assign(stepHref(pageFile(resume.page), resume.step, { fromSummary: true }))
      return
    }
    window.location.assign('accommodation-summary.html')
    return
  }
  const following = nextDetailStep(route, step)
  window.location.assign(following ? stepHref('accommodation-details', following) : 'accommodation-summary.html')
}

const flowOrder = (route) => {
  const order = []
  detailSteps(route).forEach((step) => {
    order.push(`details:${step}`)
    if (step === 'location' || step === 'suitable') order.push(`concerns:${step}`)
  })
  return order
}

const comesBefore = (route, target, current) => {
  const order = flowOrder(route)
  const targetIndex = order.indexOf(`${target.page}:${target.step}`)
  const currentIndex = order.indexOf(`${current.page}:${current.step}`)
  return targetIndex !== -1 && currentIndex !== -1 && targetIndex < currentIndex
}

const showQuestion = (name) => {
  document.querySelectorAll('[data-san-question]').forEach((block) => {
    const question = block.getAttribute('data-san-question')
    const show = question === name
    setHidden(block, !show)
    block.classList.remove('san-question')
  })
}

const setSuitabilityConcernHeading = (session) => {
  const heading = document.querySelector('#suitability-concerns h1')
  if (!heading) return
  heading.textContent = session.accommodationSuitable === 'no'
    ? "Why is Alex's accommodation not suitable? (optional)"
    : "What are your concerns about the suitability of Alex's proposed accommodation? (optional)"
}

// Side nav ticks and resume links for every SAN section.
const applyProgress = (session) => applySanProgress(session, { current: 'accommodation' })

// Whether the questions tab can show the analysis CTA.
const detailsAnswered = (session) => {
  const route = accommodationRoute(session)
  return !!route && route.every((step) => stepAnswered(session, step))
}

// Extensionless paths keep query strings. The kit redirects *.html and drops the query.
// Change links. Accommodation uses ?step= rather than a hash only.
const summaryChangeHref = (page, step = '') => {
  const href = stepHref(page, step, { fromSummary: true })
  let target = step
  if (page === 'accommodation') target = 'somewhere-to-live'
  if (page === 'accommodation-concerns' && step) {
    target = step === 'suitable' ? 'suitability-concerns' : `${step}-concerns`
  }
  return target ? `${href}#${target}` : href
}

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
  if (session.hasSomewhereToLive) {
    rows.push(summaryRow(
      'Did Alex have somewhere to live before custody?',
      [labelled(YES_NO, session.hasSomewhereToLive)],
      summaryChangeHref('accommodation')
    ))
  }

  if (session.hasSomewhereToLive === 'yes' && session.accommodationSettled) {
    rows.push(summaryRow(
      "Was Alex's accommodation settled?",
      [labelled(YES_NO, session.accommodationSettled)],
      summaryChangeHref('accommodation-settled')
    ))
  }
  if (routeShows(route, 'release-plans') && session.releasePlans) {
    rows.push(summaryRow(
      'Does Alex have any current plans for accommodation when they are released?',
      [labelled(YES_NO, session.releasePlans), session.releasePlans === 'yes' ? session.releasePlansDetails : ''],
      summaryChangeHref('accommodation-details', 'release-plans'),
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
      'Why did Alex have no accommodation?',
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
      'Who is Alex planning on living with?',
      [...labels, ...details],
      summaryChangeHref('accommodation-details', 'living-with'),
      { secondaryFrom: labels.length }
    ))
  }

  if (routeShows(route, 'location') && session.locationSuitable) {
    rows.push(summaryRow(
      "Is the location of Alex's proposed accommodation suitable?",
      [labelled(YES_NO, session.locationSuitable)],
      summaryChangeHref('accommodation-details', 'location')
    ))
    if (session.locationSuitable === 'no') {
      const reasons = Array.isArray(session.locationReasons) ? session.locationReasons : []
      const lines = reasonLines(LOCATION_REASON_LABELS, reasons, session.locationOtherDetails)
      rows.push(summaryRow(
        "Why is the location of Alex's accommodation not suitable? (optional)",
        lines.length ? lines : ['Not provided'],
        summaryChangeHref('accommodation-concerns', 'location'),
        lines.length ? { secondaryFrom: reasons.length } : {}
      ))
    }
  }

  if (routeShows(route, 'suitable') && session.accommodationSuitable) {
    rows.push(summaryRow(
      "Is Alex's proposed accommodation suitable?",
      [labelled(SUITABLE_LABELS, session.accommodationSuitable)],
      summaryChangeHref('accommodation-details', 'suitable')
    ))
    if (['yes', 'yes-concerns', 'no'].includes(session.accommodationSuitable)) {
      const reasons = Array.isArray(session.suitabilityReasons) ? session.suitabilityReasons : []
      const lines = reasonLines(SUITABILITY_REASON_LABELS, reasons, session.suitabilityOtherDetails)
      rows.push(summaryRow(
        session.accommodationSuitable === 'no'
          ? "Why is Alex's accommodation not suitable? (optional)"
          : "What are your concerns about the suitability of Alex's proposed accommodation? (optional)",
        lines.length ? lines : ['Not provided'],
        summaryChangeHref('accommodation-concerns', 'suitable'),
        lines.length ? { secondaryFrom: reasons.length } : {}
      ))
    }
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

// Check-your-answers for the questions tab and analysis tab.
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
      followOn = `<p class="govuk-body"><a class="govuk-link" href="${escapeHtml(resumeHref(session))}">Continue</a></p>`
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
  if (target instanceof HTMLElement) {
    target.scrollIntoView()
    focusTargetField(target, { preventScroll: true })
  }
}

const openAnalysisTab = () => {
  const tab = document.querySelector('.govuk-tabs__tab[href="#practitioner-analysis"]')
  if (tab instanceof HTMLElement) tab.click()
}

const emptyDetailAnswers = () => ({
  releasePlans: '',
  releasePlansDetails: '',
  livingWith: [],
  livingPartnerDetails: '',
  livingOtherDetails: '',
  locationSuitable: '',
  locationReasons: [],
  locationOtherDetails: '',
  accommodationSuitable: '',
  suitabilityReasons: [],
  suitabilityOtherDetails: '',
  locationConcernsSeen: false,
  suitabilityConcernsSeen: false,
  noAccommodationReasons: [],
  noAccommodationOtherDetails: '',
  pastAccommodationHelp: '',
  futurePlanned: '',
  futureType: '',
  futureDetails: '',
  changes: '',
  changesDetails: ''
})

// Read and validate the current details or concerns step.
const readChangesAnswers = () => {
  const changes = checkedValue('changes')
  return { changes, changesDetails: changes ? fieldValue(`changes-${changes}-details`) : '' }
}

const readStepAnswers = (step) => {
  if (step === 'release-plans') {
    const releasePlans = checkedValue('release_plans')
    return { releasePlans, releasePlansDetails: releasePlans === 'yes' ? fieldValue('release-plans-details') : '' }
  }
  if (step === 'living-with') {
    const livingWith = checkedValues('living_with')
    return {
      livingWith,
      livingPartnerDetails: livingWith.includes('partner') ? fieldValue('living-partner-details') : '',
      livingOtherDetails: livingWith.includes('other') ? fieldValue('living-other-details') : ''
    }
  }
  if (step === 'location') return { locationSuitable: checkedValue('location_suitable') }
  if (step === 'suitable') return { accommodationSuitable: checkedValue('accommodation_suitable') }
  if (step === 'no-accommodation') {
    return {
      noAccommodationReasons: checkedValues('no_accommodation_reasons'),
      noAccommodationOtherDetails: fieldValue('no-accommodation-other-details')
    }
  }
  if (step === 'past-help') return { pastAccommodationHelp: fieldValue('past-accommodation-help') }
  if (step === 'future') {
    const futurePlanned = checkedValue('future_planned')
    const futureType = futurePlanned === 'yes' ? checkedValue('future_type') : ''
    const detailsId = FUTURE_DETAILS_IDS[futureType]
    return { futurePlanned, futureType, futureDetails: detailsId ? fieldValue(detailsId) : '' }
  }
  if (step === 'changes') return readChangesAnswers()
  return {}
}

const patchForStep = (step, answers, previous) => {
  const patch = { ...answers, accommodationComplete: false }
  const branchField = { 'release-plans': 'releasePlans' }[step]
  if (branchField && previous[branchField] !== answers[branchField]) {
    const cleared = emptyDetailAnswers()
    if (step === 'release-plans') {
      delete cleared.releasePlans
      delete cleared.releasePlansDetails
      if (previous.hasSomewhereToLive === 'no' || previous.accommodationSettled === 'no') {
        delete cleared.noAccommodationReasons
        delete cleared.noAccommodationOtherDetails
      }
    }
    Object.assign(patch, cleared, answers)
  }
  if (step === 'location' && answers.locationSuitable !== 'no') {
    patch.locationReasons = []
    patch.locationOtherDetails = ''
    patch.locationConcernsSeen = false
  }
  if (step === 'suitable' && !['yes', 'yes-concerns', 'no'].includes(answers.accommodationSuitable)) {
    patch.suitabilityReasons = []
    patch.suitabilityOtherDetails = ''
    patch.suitabilityConcernsSeen = false
  }
  return patch
}

const readConcernStep = (step) => {
  if (step === 'location') {
    return {
      locationReasons: checkedValues('location_reasons'),
      locationOtherDetails: fieldValue('location-other-details')
    }
  }
  if (step === 'suitable') {
    return {
      suitabilityReasons: checkedValues('suitability_reasons'),
      suitabilityOtherDetails: fieldValue('suitability-other-details')
    }
  }
  return {}
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

const validateStep = (answers, step) => {
  const errors = []
  if (step === 'release-plans' && !answers.releasePlans) {
    errors.push({ group: step, href: '#release-plans', text: 'Select if Alex has any current plans for accommodation when they are released' })
  } else if (step === 'release-plans' && answers.releasePlans === 'yes' && !answers.releasePlansDetails) {
    errors.push({ group: step, href: '#release-plans-details', text: "Enter details about Alex's plans for accommodation when they are released" })
  }
  if (step === 'living-with' && !(answers.livingWith || []).length) {
    errors.push({ group: 'living-with', href: '#living-with', text: 'Select who Alex is planning on living with' })
  }
  if (step === 'location' && !answers.locationSuitable) {
    errors.push({
      group: 'location',
      href: '#location',
      text: "Select if the location of Alex's accommodation is suitable"
    })
  }
  if (step === 'suitable' && !answers.accommodationSuitable) {
    errors.push({
      group: 'suitable',
      href: '#suitable',
      text: "Select if Alex's accommodation is suitable"
    })
  }
  if (step === 'no-accommodation' && !(answers.noAccommodationReasons || []).length) {
    errors.push({
      group: 'no-accommodation',
      href: '#no-accommodation',
      text: 'Select why Alex has no accommodation'
    })
  }
  if (step === 'future' && !answers.futurePlanned) {
    errors.push({
      group: 'future',
      href: '#future',
      text: 'Select if Alex has future accommodation planned'
    })
  } else if (step === 'future' && answers.futurePlanned === 'yes' && !answers.futureType) {
    errors.push({
      group: 'future',
      href: '#future-type',
      text: 'Select the future accommodation Alex has planned'
    })
  }
  if (step === 'changes' && !answers.changes) {
    errors.push({
      group: 'changes',
      href: '#changes',
      text: 'Select if Alex wants to make changes to their accommodation'
    })
  } else if (step === 'changes' && answers.changes === 'not-present' && !answers.changesDetails) {
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

const restoreConcerns = (session) => {
  selectChecks('location_reasons', session.locationReasons)
  setField('location-other-details', session.locationOtherDetails)
  selectChecks('suitability_reasons', session.suitabilityReasons)
  setField('suitability-other-details', session.suitabilityOtherDetails)
}

const restoreDetails = (session) => {
  selectRadio('release_plans', session.releasePlans)
  setField('release-plans-details', session.releasePlansDetails)
  selectChecks('living_with', session.livingWith)
  setField('living-partner-details', session.livingPartnerDetails)
  setField('living-other-details', session.livingOtherDetails)
  selectRadio('location_suitable', session.locationSuitable)
  selectRadio('accommodation_suitable', session.accommodationSuitable)
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

// Wire up whichever accommodation page is currently loaded.
const initSanAccommodation = () => {
  const page = document.querySelector('[data-san-page]')
  if (!page) return

  seedExample()
  const session = getSanSession()
  applyProgress(session)

  if (fromSummary()) ensureBackLink('accommodation-summary.html')

  const pageName = page.getAttribute('data-san-page')
  if (pageName === 'somewhere') {
    selectRadio('somewhere_to_live', session.hasSomewhereToLive)
  }
  if (pageName === 'settled') {
    if (session.hasSomewhereToLive !== 'yes') {
      window.location.replace('accommodation')
      return
    }
    selectRadio('accommodation_settled', session.accommodationSettled)
    if (!fromSummary()) ensureBackLink('accommodation')
  }
  if (pageName === 'details') {
    const route = accommodationRoute(session)
    if (!route) {
      window.location.replace('accommodation')
      return
    }
    const steps = detailSteps(route)
    const step = stepParam()
    const resume = resumeTarget(session, route)
    if (!steps.includes(step)) {
      if (resume && resume.page === 'concerns' && !fromSummary()) {
        window.location.replace(stepHref('accommodation-concerns', resume.step))
        return
      }
      const fallback = resume && resume.page === 'details' ? resume.step : steps[0]
      window.location.replace(stepHref('accommodation-details', fallback, { fromSummary: fromSummary() }))
      return
    }
    if (!fromSummary() && resume && comesBefore(route, resume, { page: 'details', step })) {
      window.location.replace(stepHref(pageFile(resume.page), resume.step))
      return
    }
    const form = document.getElementById('san-accommodation-details-form')
    if (form) form.setAttribute('data-san-route', route.join(' '))
    if (!fromSummary()) ensureBackLink(backHrefForDetail(session, route, step))
    showQuestion(step)
    restoreDetails(session)
  }
  if (pageName === 'concerns') {
    const route = accommodationRoute(session)
    if (!route) {
      window.location.replace('accommodation')
      return
    }
    const step = stepParam()
    const allowed = (step === 'location' && needsLocationConcerns(session, route))
      || (step === 'suitable' && needsSuitabilityConcerns(session, route))
    const resume = resumeTarget(session, route)
    if (!allowed) {
      if (resume) {
        window.location.replace(stepHref(pageFile(resume.page), resume.step, { fromSummary: fromSummary() }))
      } else {
        window.location.replace(fromSummary() ? 'accommodation-summary' : stepHref('accommodation-details', firstDetailStep(route)))
      }
      return
    }
    if (!fromSummary() && resume && comesBefore(route, resume, { page: 'concerns', step })) {
      window.location.replace(stepHref(pageFile(resume.page), resume.step))
      return
    }
    if (!fromSummary()) ensureBackLink(stepHref('accommodation-details', step))
    showQuestion(CONCERN_BLOCK[step])
    if (step === 'suitable') setSuitabilityConcernHeading(session)
    restoreConcerns(session)
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

  const somewhereForm = document.getElementById('san-accommodation-somewhere-form')
  somewhereForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const hasSomewhereToLive = checkedValue('somewhere_to_live')
    if (!hasSomewhereToLive) {
      showErrors([{
        group: 'somewhere-to-live',
        href: '#somewhere-to-live',
        text: 'Select if Alex had somewhere to live before custody'
      }])
      return
    }
    clearErrors()
    const previous = getSanSession()
    const changed = previous.hasSomewhereToLive !== hasSomewhereToLive
    const updates = { hasSomewhereToLive, accommodationComplete: false }
    if (changed) {
      updates.accommodationSettled = ''
      Object.assign(updates, emptyDetailAnswers())
    }
    const next = { ...previous, ...updates }
    const nextRoute = accommodationRoute(next)
    setSanSession(updates)
    if (fromSummary() && !changed && detailsAnswered(next)) {
      window.location.assign('accommodation-summary')
    } else if (hasSomewhereToLive === 'yes') {
      window.location.assign('accommodation-settled')
    } else {
      window.location.assign(stepHref('accommodation-details', firstDetailStep(nextRoute)))
    }
  })

  const settledForm = document.getElementById('san-accommodation-settled-form')
  settledForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const accommodationSettled = checkedValue('accommodation_settled')
    if (!accommodationSettled) {
      showErrors([{
        group: 'accommodation-settled',
        href: '#accommodation-settled',
        text: "Select if Alex's accommodation is settled"
      }])
      return
    }
    clearErrors()
    const previous = getSanSession()
    const changed = previous.accommodationSettled !== accommodationSettled
    const updates = { accommodationSettled, accommodationComplete: false }
    if (changed) Object.assign(updates, emptyDetailAnswers())
    const next = { ...previous, ...updates }
    const nextRoute = accommodationRoute(next)
    setSanSession(updates)
    window.location.assign(fromSummary() && !changed && detailsAnswered(next)
      ? 'accommodation-summary'
      : stepHref('accommodation-details', firstDetailStep(nextRoute)))
  })

  const detailsForm = document.getElementById('san-accommodation-details-form')
  detailsForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const previous = getSanSession()
    const step = stepParam()
    const answers = readStepAnswers(step)
    const errors = validateStep(answers, step)
    if (errors.length) {
      showErrors(errors)
      return
    }
    clearErrors()
    const patch = patchForStep(step, answers, previous)
    setSanSession(patch)
    const next = { ...previous, ...patch }
    continueAfterDetail(previous, next, accommodationRoute(next), step)
  })

  const concernsForm = document.getElementById('san-accommodation-concerns-form')
  concernsForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    revealCheckedConditionals()
    const previous = getSanSession()
    const route = accommodationRoute(previous)
    const step = stepParam()
    const patch = { ...readConcernStep(step), accommodationComplete: false }
    if (step === 'location') patch.locationConcernsSeen = true
    if (step === 'suitable') patch.suitabilityConcernsSeen = true
    clearErrors()
    setSanSession(patch)
    continueAfterConcern({ ...previous, ...patch }, route, step)
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
  if (!isSanPrisonJourney()) return
  initSanAccommodation()
})
