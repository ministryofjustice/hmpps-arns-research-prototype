//
// Prototype 3 – Risk of serious harm (screening) journey
// Screen copy and branching follow the ROSH Screening designs and BA flow.
//

import {
  getPredictorsAssessmentSession,
  setPredictorsAssessmentSession
} from './predictors-assessment-session.js'

const ROSH_PATH = '/03/'
const FROM_ANSWERS = 'answers'

export const ROSH_CONVICTIONS = [
  { id: 'murder-manslaughter', label: 'Murder, attempted murder, threat or conspiracy to murder or manslaughter' },
  { id: 'wounding-gbh', label: 'Wounding or GBH' },
  { id: 'rape-serious-sexual-adult', label: 'Rape or serious sexual offence against an adult' },
  { id: 'sexual-offence-child', label: 'Any sexual offence against a child' },
  { id: 'other-offence-child', label: 'Any other offence against a child' },
  { id: 'criminal-damage-endanger-life', label: 'Criminal damage with intent to endanger life' },
  { id: 'weapons', label: 'Any offence involving possession or use of weapons' },
  { id: 'kidnapping', label: 'Kidnapping or false imprisonment' },
  { id: 'arson', label: 'Arson' },
  { id: 'racially-motivated', label: 'Racially motivated or racially aggravated offence' },
  { id: 'aggravated-burglary', label: 'Aggravated burglary' },
  { id: 'robbery', label: 'Robbery' },
  { id: 'other-serious', label: 'Any other serious offence (for example, blackmail, harassment, stalking, indecent images of children, child neglect or abduction)' },
  { id: 'offence-in-custody', label: 'Any offence committed in custody' }
]

export const ROSH_BEHAVIOURS = [
  { id: 'assaulted-staff', label: 'Assaulted or threatened staff' },
  { id: 'assaulted-others', label: 'Assaulted or threatened others' },
  { id: 'domestic-abuse', label: 'Domestic abuse towards a partner or other member of their family' },
  { id: 'offence-not-complying-medication', label: 'Committed a serious offence while not complying with medication' },
  { id: 'hate-based', label: 'Hate-based behaviour' },
  { id: 'high-risk-previous', label: 'Assessed as high risk of serious harm on previous occasion' },
  { id: 'section-41', label: 'Been a conditionally-charged patient subject to a restriction order under Section 41 MHA 1983' },
  { id: 'stalking', label: 'Stalking' },
  { id: 'obsessive-behaviour', label: 'Obsessive behaviour linked to offending' },
  { id: 'offence-related-custody', label: 'Displayed offence-related behaviour in custody' },
  { id: 'inappropriate-custody', label: 'Displayed inappropriate behaviour towards custodial staff, visitors or prisoners' },
  { id: 'custody-associations', label: 'Established links or associations while in custody that increase risk of serious harm' },
  { id: 'group-cse', label: 'Perpetrated any behaviours relating to group-based child sexual exploitation' }
]

export const ROSH_CIVIL_ORDERS = [
  { id: 'banning-order', label: 'Banning order' },
  { id: 'child-arrangement-order', label: 'Child arrangement order' },
  { id: 'civil-injunction', label: 'Civil injunction' },
  { id: 'community-protection-notice', label: 'Community protection notice' },
  { id: 'criminal-behaviour-order', label: 'Criminal behaviour order' },
  { id: 'fgm-order', label: 'Female genital mutilation order' },
  { id: 'forced-marriage-order', label: 'Forced marriage order' },
  { id: 'knife-crime-prevention-order', label: 'Knife crime prevention order' },
  { id: 'non-molestation-order', label: 'Non-molestation order' },
  { id: 'occupation-order', label: 'Occupation order' },
  { id: 'prohibited-steps-order', label: 'Prohibited steps order' },
  { id: 'public-spaces-protection-order', label: 'Public spaces protection order' },
  { id: 'restraining-orders', label: 'Restraining orders' },
  { id: 'serious-crime-prevention-order', label: 'Serious crime prevention order' },
  { id: 'serious-violence-reduction-order', label: 'Serious violence reduction order' },
  { id: 'sexual-harm-prevention-orders', label: 'Sexual harm prevention orders' },
  { id: 'sexual-risk-order', label: 'Sexual risk order' },
  { id: 'slavery-trafficking-orders', label: 'Slavery and trafficking prevention and risk orders' },
  { id: 'stalking-protection-order', label: 'Stalking protection order' },
  { id: 'violent-offender-order', label: 'Violent offender order' }
]

export const ROSH_RELATIONSHIPS = [
  { id: 'parent', label: 'Parent or step-parent' },
  { id: 'carer', label: 'Carer' },
  { id: 'grandparent', label: 'Grandparent' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'other-family', label: 'Other family member' },
  { id: 'friend', label: 'Friend' },
  { id: 'other', label: 'Other' }
]

const labelFor = (items, id) => items.find((item) => item.id === id)?.label || id

const isRoshFullPage = () => window.location.pathname.includes('rosh-full')

const isRoshPage = () =>
  window.location.pathname.includes('/03/') &&
  window.location.pathname.includes('rosh-') &&
  !isRoshFullPage()

export const roshHref = (page) => {
  if (!page) return ROSH_PATH
  if (page.startsWith('/')) return page
  return `${ROSH_PATH}${page}`
}

const ANSWERS_PAGE = 'rosh-answers.html'

const getSearchParams = () => new URLSearchParams(window.location.search)

const getFromParamFromHref = (href = '') => {
  const match = String(href).match(/[?&]from=([^&#]+)/)
  return match?.[1] || null
}

const isUsableChildId = (childId) => Boolean(childId) && childId !== 'undefined'

const persistEditingChildId = (childId) => {
  if (isUsableChildId(childId)) setRoshScreening({ roshEditingChildId: childId })
}

const getChildIdFromLink = (link) => {
  if (!link) return ''
  const fromData = link.getAttribute('data-rosh-child-id')
  if (isUsableChildId(fromData)) return fromData

  try {
    const url = new URL(link.href, window.location.origin)
    const fromQuery = url.searchParams.get('child')
    if (isUsableChildId(fromQuery)) return fromQuery
    if (url.pathname.includes('rosh-child')) {
      const fromHash = decodeURIComponent(url.hash.replace(/^#/, ''))
      if (isUsableChildId(fromHash)) return fromHash
    }
  } catch (error) {
    // Ignore invalid hrefs
  }

  return ''
}

export const startRoshCheckAnswersEdit = (childId) => {
  const updates = { roshReturnToAnswers: true }
  if (isUsableChildId(childId)) updates.roshEditingChildId = childId
  setRoshScreening(updates)
}

export const isFromAnswers = () =>
  getSearchParams().get('from') === FROM_ANSWERS || getRoshScreening().roshReturnToAnswers === true

export const withFromAnswers = (href) => {
  if (!href || !isFromAnswers()) return href
  const resolved = href.startsWith('/') ? href : roshHref(href.replace(/^\.\//, ''))
  const url = new URL(resolved, window.location.origin)
  url.searchParams.set('from', FROM_ANSWERS)
  return `${url.pathname}${url.search}${url.hash}`
}

const persistRoshEditModeFromUrl = () => {
  const params = getSearchParams()
  const updates = {}

  if (params.get('from') === FROM_ANSWERS) updates.roshReturnToAnswers = true

  const childId = params.get('child') || params.get('id')
  if (isUsableChildId(childId)) updates.roshEditingChildId = childId

  if (Object.keys(updates).length) setRoshScreening(updates)
}

const ensureChildrenHaveIds = () => {
  const children = getRoshScreening().children || []
  let changed = false
  const next = children.map((child, index) => {
    if (child?.id && String(child.id) !== 'undefined') return child
    changed = true
    return { ...child, id: `child-${index}-${Date.now()}` }
  })

  if (changed) setRoshScreening({ children: next })
  return getRoshScreening().children || []
}

const getChildIdFromHash = () => {
  const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  if (!isUsableChildId(hashId)) return ''
  const children = getRoshScreening().children || []
  return children.some((child) => String(child.id) === hashId) ? hashId : ''
}

const getEditingChildId = () => {
  const params = getSearchParams()
  const fromUrl = params.get('child') || params.get('id')
  if (isUsableChildId(fromUrl)) return fromUrl

  const fromHash = getChildIdFromHash()
  if (fromHash) return fromHash

  const fromSession = getRoshScreening().roshEditingChildId || ''
  return isUsableChildId(fromSession) ? fromSession : ''
}

const childPageHref = (page, childId, { fromAnswers } = {}) => {
  const url = new URL(roshHref(page), window.location.origin)
  url.pathname = url.pathname.replace(/\.html$/, '')
  if (childId) {
    url.searchParams.set('child', childId)
    url.hash = encodeURIComponent(childId)
  }
  if (fromAnswers || isFromAnswers()) url.searchParams.set('from', FROM_ANSWERS)
  return `${url.pathname}${url.search}${url.hash}`
}

const revealCheckedConditionals = (form) => {
  form.querySelectorAll('input[data-aria-controls]:checked').forEach((input) => {
    const target = document.getElementById(input.getAttribute('data-aria-controls'))
    if (!target) return
    target.classList.remove('govuk-radios__conditional--hidden')
    target.classList.remove('govuk-checkboxes__conditional--hidden')
  })
}

export const getRoshScreening = () => getPredictorsAssessmentSession().roshScreening || {}

export const setRoshScreening = (updates) => {
  const current = getRoshScreening()
  setPredictorsAssessmentSession({
    roshScreening: { ...current, ...updates }
  })
}

// Set edit mode as soon as the module loads, matching proto 2 check-answers navigation.
if (typeof window !== 'undefined' && isRoshPage()) {
  persistRoshEditModeFromUrl()
}

const saveRoshProgress = (updates) => {
  setRoshScreening(isFromAnswers() ? updates : { ...updates, complete: false })
}

const selectedValues = (form, name) =>
  [...form.querySelectorAll(`input[name="${name}"]:checked:not(:disabled)`)].map((input) => input.value)

const checkedValue = (form, name) =>
  form.querySelector(`input[name="${name}"]:checked:not(:disabled)`)?.value || ''

const textValue = (form, name) =>
  (form.querySelector(`[name="${name}"]:not(:disabled)`)?.value || '').trim()

const restoreCheckboxes = (form, name, values = []) => {
  values.forEach((value) => {
    const input = form.querySelector(`input[name="${name}"][value="${value}"]:not(:disabled)`)
    if (input) input.checked = true
  })
}

const restoreRadio = (form, name, value) => {
  if (!value) return
  const input = form.querySelector(`input[name="${name}"][value="${value}"]:not(:disabled)`)
  if (input) input.checked = true
}

const restoreText = (form, name, value) => {
  const field = form.querySelector(`[name="${name}"]:not(:disabled)`)
  if (field && value != null) field.value = value
}

const showErrors = (errors) => {
  const summary = document.getElementById('rosh-error-summary')
  const list = summary?.querySelector('[data-rosh-error-list]')
  document.querySelectorAll('[data-rosh-error-group]').forEach((group) => {
    group.classList.remove('govuk-form-group--error')
  })
  document.querySelectorAll('[data-rosh-error-message]').forEach((el) => el.remove())

  if (!summary || !list) return

  if (!errors.length) {
    summary.hidden = true
    list.innerHTML = ''
    return
  }

  list.innerHTML = errors
    .map((error) => `<li><a href="#${error.id}">${error.text}</a></li>`)
    .join('')
  summary.hidden = false
  summary.focus()

  errors.forEach((error) => {
    const group = [...document.querySelectorAll(`[data-rosh-error-group="${error.id}"]`)].find(
      (el) => !el.closest('[hidden]')
    )
    const target = document.getElementById(error.id) || group
    if (group) group.classList.add('govuk-form-group--error')
    if (target && group && !group.querySelector('[data-rosh-error-message]')) {
      const message = document.createElement('p')
      message.className = 'govuk-error-message'
      message.dataset.roshErrorMessage = 'true'
      message.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${error.text}`
      const insertBefore = group.querySelector('.govuk-fieldset, .govuk-character-count, .govuk-input, .govuk-textarea') || target
      insertBefore.insertAdjacentElement('beforebegin', message)
    }
  })
}

const hasSelection = (values) => Array.isArray(values) && values.length > 0
const hasNone = (values) => values.includes('none')
const realSelections = (values) => (values || []).filter((value) => value !== 'none')

const CONFIRMATION_VARIANT_LINKS = [
  { id: 'must-screening', label: 'Full ROSH needed' },
  { id: 'must-children', label: 'Children indicate full ROSH' },
  { id: 'not-needed', label: 'ROSH not needed' },
  { id: 'should-individual', label: 'Risk to individual' },
  { id: 'should-others', label: 'Risk to others' },
  { id: 'should-both', label: 'Risk to individual AND Other' }
]

const CONFIRMATION_VARIANT_IDS = new Set(CONFIRMATION_VARIANT_LINKS.map((item) => item.id))

const IGNORED_CIVIL_ORDER_IDS = new Set([
  'banning-order',
  'civil-injunction',
  'criminal-behaviour-order',
  'community-protection-notice',
  'public-spaces-protection-order'
])

const INDIVIDUAL_RISK_KEYS = ['suicide', 'selfHarm', 'copingCustody', 'vulnerability']
const OTHER_RISK_KEYS = ['escape', 'controlIssues', 'riskToPrisoners']

const isYes = (value) => value === 'yes'
const isNoOrNull = (value) => !value || value === 'no'
const isNoNullOrUnknown = (value) => isNoOrNull(value) || value === 'unknown'

const hasRelevantCivilOrder = (rosh = {}) =>
  rosh.civilOrders === 'yes' &&
  (rosh.civilOrderTypes || []).some((id) => !IGNORED_CIVIL_ORDER_IDS.has(id))

const hasChildRisk = (rosh = {}) => {
  if (rosh.childImpact !== 'yes') return false
  const groups = rosh.childGroups || []
  return groups.includes('identifiable') || groups.includes('general')
}

const hasConvictionRisk = (rosh = {}) => realSelections(rosh.convictions).length > 0
const hasBehaviourRisk = (rosh = {}) => realSelections(rosh.behaviours).length > 0
const hasIndividualRiskYes = (rosh = {}) => INDIVIDUAL_RISK_KEYS.some((key) => isYes(rosh[key]))
const hasOtherRiskYes = (rosh = {}) => OTHER_RISK_KEYS.some((key) => isYes(rosh[key]))
const allIndividualAndOtherRisksNo = (rosh = {}) =>
  [...INDIVIDUAL_RISK_KEYS, ...OTHER_RISK_KEYS].every((key) => rosh[key] === 'no')

const isChildrenIndicateFullRosh = (rosh = {}) =>
  hasChildRisk(rosh) &&
  !hasConvictionRisk(rosh) &&
  !hasBehaviourRisk(rosh) &&
  !hasRelevantCivilOrder(rosh) &&
  allIndividualAndOtherRisksNo(rosh)

const isFullRoshNeeded = (rosh = {}) =>
  hasConvictionRisk(rosh) ||
  hasBehaviourRisk(rosh) ||
  hasRelevantCivilOrder(rosh) ||
  hasChildRisk(rosh) ||
  hasIndividualRiskYes(rosh) ||
  hasOtherRiskYes(rosh)

export const getConfirmationVariant = (rosh = getRoshScreening()) => {
  if (isChildrenIndicateFullRosh(rosh)) return 'must-children'
  if (isFullRoshNeeded(rosh)) return 'must-screening'
  return 'not-needed'
}

const getPreviewConfirmationVariant = () => {
  const preview = getSearchParams().get('variant')
  return CONFIRMATION_VARIANT_IDS.has(preview) ? preview : null
}

const shouldAdditionalLegend = (variant, firstName) => {
  if (variant === 'should-individual') {
    return `Your ‘Risk to individual’ answers indicate that a ROSH full analysis should be completed for ${firstName}. Do you have any additional information?`
  }
  if (variant === 'should-others') {
    return `Your ‘Risk to others’ answers indicate that a ROSH full analysis should be completed for ${firstName}. Do you have any additional information?`
  }
  if (variant === 'should-both') {
    return `Your ‘Risk to individual’ and ‘Risk to others’ answers indicate that a ROSH full analysis should be completed for ${firstName}. Do you have any additional information?`
  }
  return ''
}

const initConfirmationVariantLinks = (currentVariant) => {
  const footer = document.querySelector('.probation-common-footer')
  const supportLinks = footer?.querySelector('.probation-common-footer__support-links')
  if (!supportLinks || supportLinks.querySelector('[data-rosh-confirm-variant-links]')) return

  const nav = document.createElement('nav')
  nav.className = 'rosh-confirmation-variant-links'
  nav.dataset.roshConfirmVariantLinks = 'true'
  nav.setAttribute('aria-label', 'ROSH confirmation variants')

  const heading = document.createElement('h2')
  heading.className = 'rosh-confirmation-variant-links__heading'
  heading.textContent = 'ROSH confirmation variants'
  nav.appendChild(heading)

  const list = document.createElement('ul')
  list.className = 'govuk-list rosh-confirmation-variant-links__list'

  CONFIRMATION_VARIANT_LINKS.forEach((item) => {
    const li = document.createElement('li')

    if (item.id === currentVariant) {
      const current = document.createElement('span')
      current.textContent = item.label
      current.setAttribute('aria-current', 'page')
      li.appendChild(current)
    } else {
      const link = document.createElement('a')
      link.className = 'probation-common-footer__link'
      link.href = `?variant=${encodeURIComponent(item.id)}`
      link.textContent = item.label
      li.appendChild(link)
    }

    list.appendChild(li)
  })

  nav.appendChild(list)
  supportLinks.appendChild(nav)
}

export const getRoshOutcome = (rosh = getRoshScreening()) => {
  const variant = getConfirmationVariant(rosh)

  if (variant === 'must-children') return 'full-analysis'
  if (variant === 'must-screening') {
    return rosh.confirmExempt === 'yes' ? 'no-full-analysis' : 'full-analysis'
  }
  if (variant === 'not-needed') {
    return rosh.confirmAdditionalInfo === 'yes' ? 'full-analysis' : 'no-full-analysis'
  }
  return rosh.confirmShouldExempt === 'yes' ? 'no-full-analysis' : 'full-analysis'
}

const isConfirmationComplete = (rosh = getRoshScreening()) => {
  const variant = getConfirmationVariant(rosh)

  if (variant === 'must-children') return true

  if (variant === 'must-screening') {
    if (!rosh.confirmExempt) return false
    return rosh.confirmExempt !== 'yes' || Boolean(rosh.confirmExemptDetails)
  }

  if (variant === 'not-needed') {
    if (!rosh.confirmAdditionalInfo) return false
    return rosh.confirmAdditionalInfo !== 'yes' || Boolean(rosh.confirmAdditionalDetails)
  }

  if (!rosh.confirmAdditionalInfo) return false
  if (rosh.confirmAdditionalInfo === 'yes' && !rosh.confirmAdditionalDetails) return false
  if (!rosh.confirmShouldExempt) return false
  return rosh.confirmShouldExempt !== 'yes' || Boolean(rosh.confirmShouldExemptDetails)
}

const getContinueHrefAfterRoshAnswersEdit = (before, after) => {
  const nowIdentifiable =
    after.childImpact === 'yes' && (after.childGroups || []).includes('identifiable')
  const wasIdentifiable =
    before.childImpact === 'yes' && (before.childGroups || []).includes('identifiable')

  if (nowIdentifiable && !wasIdentifiable) return 'rosh-children.html'

  if (getConfirmationVariant(before) !== getConfirmationVariant(after) && !isConfirmationComplete(after)) {
    return 'rosh-confirmation.html'
  }

  return null
}

const continueAfterPage = (defaultHref, { followJourney } = {}) => {
  if (isFromAnswers() && !followJourney) return roshHref(ANSWERS_PAGE)
  return withFromAnswers(roshHref(defaultHref))
}

const continueAfterRoshSave = (before, after, defaultHref) => {
  const moreQuestions = isFromAnswers() ? getContinueHrefAfterRoshAnswersEdit(before, after) : null
  return continueAfterPage(moreQuestions || defaultHref, {
    followJourney: Boolean(moreQuestions)
  })
}

const getOthersFields = (form) => ({
  convictions: selectedValues(form, 'rosh_convictions'),
  weaponsFirearm: checkedValue(form, 'rosh_weapons_firearm'),
  otherSeriousDetails: textValue(form, 'rosh_other_serious_details'),
  behaviours: selectedValues(form, 'rosh_behaviours'),
  civilOrders: checkedValue(form, 'rosh_civil_orders'),
  civilOrderTypes: selectedValues(form, 'rosh_civil_order_types')
})

const initRiskToOthers = () => {
  const form = document.getElementById('rosh-risk-to-others-form')
  if (!form) return

  const rosh = getRoshScreening()
  restoreCheckboxes(form, 'rosh_convictions', rosh.convictions)
  restoreRadio(form, 'rosh_weapons_firearm', rosh.weaponsFirearm)
  restoreText(form, 'rosh_other_serious_details', rosh.otherSeriousDetails)
  restoreCheckboxes(form, 'rosh_behaviours', rosh.behaviours)
  restoreRadio(form, 'rosh_civil_orders', rosh.civilOrders)
  restoreCheckboxes(form, 'rosh_civil_order_types', rosh.civilOrderTypes)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const fields = getOthersFields(form)
    const errors = []

    if (!hasSelection(fields.convictions)) {
      errors.push({ id: 'rosh-convictions', text: 'Select the offences, or select ‘None of these offences’' })
    }
    if (fields.convictions.includes('weapons') && !fields.weaponsFirearm) {
      errors.push({ id: 'rosh-weapons-firearm', text: 'Select yes if this involved possession of a firearm with intent to endanger life or resist arrest' })
    }
    if (fields.convictions.includes('other-serious') && !fields.otherSeriousDetails) {
      errors.push({ id: 'rosh-other-serious-details', text: 'Give details of the other serious offence' })
    }
    if (!hasSelection(fields.behaviours)) {
      errors.push({ id: 'rosh-behaviours', text: 'Select the significant behaviours or events, or select ‘None of these significant behaviours or events’' })
    }
    if (!fields.civilOrders) {
      errors.push({ id: 'rosh-civil-orders', text: `Select yes if ${offenderFirstName()} is currently subject to any civil or ancillary orders` })
    }
    if (fields.civilOrders === 'yes' && !hasSelection(fields.civilOrderTypes)) {
      errors.push({ id: 'rosh-civil-order-types', text: 'Select the civil or ancillary orders' })
    }

    showErrors(errors)
    if (errors.length) return

    if (!fields.convictions.includes('weapons')) fields.weaponsFirearm = ''
    if (!fields.convictions.includes('other-serious')) fields.otherSeriousDetails = ''
    if (fields.civilOrders !== 'yes') fields.civilOrderTypes = []

    const previous = getRoshScreening()
    saveRoshProgress(fields)
    window.location.href = continueAfterRoshSave(previous, { ...previous, ...fields }, 'rosh-risk-to-children.html')
  })
}

const getChildrenQuestionFields = (form) => ({
  childImpact: checkedValue(form, 'rosh_child_impact'),
  childGroups: selectedValues(form, 'rosh_child_groups'),
  childImpactNoneDetails: textValue(form, 'rosh_child_impact_none_details')
})

const getPostChildrenHref = (fields, children = []) => {
  if (fields.childImpact === 'yes' && fields.childGroups.includes('identifiable')) {
    return 'rosh-children.html'
  }
  return 'rosh-risk-to-individual.html'
}

const initRiskToChildren = () => {
  const form = document.getElementById('rosh-risk-to-children-form')
  if (!form) return

  const rosh = getRoshScreening()
  restoreRadio(form, 'rosh_child_impact', rosh.childImpact)
  restoreCheckboxes(form, 'rosh_child_groups', rosh.childGroups)
  restoreText(form, 'rosh_child_impact_none_details', rosh.childImpactNoneDetails)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const fields = getChildrenQuestionFields(form)
    const errors = []

    if (!fields.childImpact) {
      errors.push({ id: 'rosh-child-impact', text: `Select yes if ${offenderFirstName()}’s behaviour and circumstances could negatively impact the wellbeing of any children` })
    }
    if (fields.childImpact === 'yes' && !hasSelection(fields.childGroups)) {
      errors.push({ id: 'rosh-child-groups', text: 'Select which children this could negatively impact' })
    }
    if (fields.childImpact === 'no' && !fields.childImpactNoneDetails) {
      errors.push({ id: 'rosh-child-impact-none-details', text: 'Explain why you think there will be no negative impact' })
    }

    showErrors(errors)
    if (errors.length) return

    if (fields.childImpact !== 'yes') fields.childGroups = []
    if (fields.childImpact !== 'no') fields.childImpactNoneDetails = ''
    if (!fields.childGroups.includes('identifiable')) {
      fields.children = []
    }

    const previous = getRoshScreening()
    saveRoshProgress(fields)
    window.location.href = continueAfterRoshSave(
      previous,
      { ...previous, ...fields },
      getPostChildrenHref(fields, previous.children || [])
    )
  })
}

const formatChildDobOrAge = (child, emptyLabel = 'Not answered') => {
  if (child.dobDay && child.dobMonth && child.dobYear) {
    const date = new Date(Number(child.dobYear), Number(child.dobMonth) - 1, Number(child.dobDay))
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
  if (child.age) return child.age
  return emptyLabel
}

const formatAddress = (child, emptyLabel = 'Not answered') => {
  const parts = [child.address1, child.address2, child.town, child.county, child.postcode].filter(Boolean)
  return parts.length ? parts.join(', ') : emptyLabel
}

const sexLabel = (value, emptyLabel = 'Not answered') =>
  ({ male: 'Male', female: 'Female', intersex: 'Intersex', unknown: 'Unknown' }[value] || emptyLabel)

const childRelationshipText = (child) => {
  const relationship = labelFor(ROSH_RELATIONSHIPS, child.relationship)
  if (child.relationship === 'other' && child.relationshipDetails) {
    return `${relationship}: ${child.relationshipDetails}`
  }
  return relationship || 'Not answered'
}

const childContactText = (child) =>
  child.contact === 'yes' ? 'Yes' : child.contact === 'no' ? 'No' : 'Not answered'

const childSummaryRowsHtml = (child) => {
  const firstName = offenderFirstName()
  return `
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">Date of birth or age (optional)</dt>
      <dd class="govuk-summary-list__value">${formatChildDobOrAge(child)}</dd>
    </div>
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">Sex (optional)</dt>
      <dd class="govuk-summary-list__value">${sexLabel(child.sex)}</dd>
    </div>
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">Address (optional)</dt>
      <dd class="govuk-summary-list__value">${formatAddress(child)}</dd>
    </div>
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">What is ${firstName}’s relationship or connection to this child?</dt>
      <dd class="govuk-summary-list__value">${childRelationshipText(child)}</dd>
    </div>
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">Does ${firstName} have contact or is seeking contact with this child?</dt>
      <dd class="govuk-summary-list__value">${childContactText(child)}</dd>
    </div>
  `
}

const renderChildrenList = () => {
  const list = document.querySelector('[data-rosh-children-list]')
  const empty = document.querySelector('[data-rosh-children-empty]')
  const actions = document.querySelector('[data-rosh-children-actions]')
  if (!list) return

  const children = getRoshScreening().children || []
  if (!children.length) {
    list.innerHTML = ''
    if (empty) empty.hidden = false
    if (actions) actions.hidden = true
    return
  }

  if (empty) empty.hidden = true
  if (actions) actions.hidden = false

  const firstName = offenderFirstName()
  list.innerHTML = children
    .map((child) => {
      const name = child.name || 'Non-disclosable'
      const relationship = labelFor(ROSH_RELATIONSHIPS, child.relationship)
      const relationshipText =
        child.relationship === 'other' && child.relationshipDetails
          ? `${relationship}: ${child.relationshipDetails}`
          : relationship
      const contact = child.contact === 'yes' ? 'Yes' : child.contact === 'no' ? 'No' : 'Not provided'
      return `
        <section class="govuk-summary-card govuk-!-margin-bottom-6">
          <div class="govuk-summary-card__title-wrapper">
            <h2 class="govuk-summary-card__title">${name}</h2>
            <ul class="govuk-summary-card__actions">
              <li class="govuk-summary-card__action"><a class="govuk-link" href="${childPageHref('rosh-child.html', child.id)}" data-rosh-child-id="${child.id}">Change<span class="govuk-visually-hidden"> ${name}</span></a></li>
              <li class="govuk-summary-card__action"><a class="govuk-link" href="${childPageHref('rosh-child-delete.html', child.id)}" data-rosh-child-id="${child.id}">Delete<span class="govuk-visually-hidden"> ${name}</span></a></li>
            </ul>
          </div>
          <div class="govuk-summary-card__content">
            <dl class="govuk-summary-list">
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Date of birth or age (optional)</dt>
                <dd class="govuk-summary-list__value">${formatChildDobOrAge(child, 'Not provided')}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Sex (optional)</dt>
                <dd class="govuk-summary-list__value">${sexLabel(child.sex, 'Not provided')}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Address (optional)</dt>
                <dd class="govuk-summary-list__value">${formatAddress(child, 'Not provided')}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">What is ${firstName}’s relationship or connection to this child?</dt>
                <dd class="govuk-summary-list__value">${relationshipText || 'Not provided'}</dd>
              </div>
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">Does ${firstName} have contact or is seeking contact with this child?</dt>
                <dd class="govuk-summary-list__value">${contact}</dd>
              </div>
            </dl>
          </div>
        </section>
      `
    })
    .join('')
}

const initChildrenList = () => {
  const page = document.getElementById('rosh-children-page')
  if (!page) return

  const rosh = getRoshScreening()
  if (rosh.childImpact !== 'yes' || !(rosh.childGroups || []).includes('identifiable')) {
    window.location.replace(continueAfterPage('rosh-risk-to-children.html'))
    return
  }

  ensureChildrenHaveIds()
  renderChildrenList()

  document.querySelectorAll('a[href]').forEach((link) => {
    let url
    try {
      url = new URL(link.href, window.location.origin)
    } catch (error) {
      return
    }
    if (!url.pathname.endsWith('/rosh-child.html') && !url.pathname.endsWith('/rosh-child')) return
    if (url.pathname.includes('rosh-child-delete')) return
    if (url.searchParams.get('child') || link.getAttribute('data-rosh-child-id')) return

    link.href = withFromAnswers(roshHref('rosh-child.html'))
    link.addEventListener('click', () => {
      setRoshScreening({ roshEditingChildId: undefined })
    })
  })

  document.getElementById('rosh-children-continue')?.addEventListener('click', () => {
    window.location.href = continueAfterPage('rosh-risk-to-individual.html')
  })
}

const getChildFields = (form) => ({
  id: textValue(form, 'rosh_child_id'),
  name: textValue(form, 'rosh_child_name'),
  dobDay: textValue(form, 'rosh_child_dob_day'),
  dobMonth: textValue(form, 'rosh_child_dob_month'),
  dobYear: textValue(form, 'rosh_child_dob_year'),
  age: textValue(form, 'rosh_child_age'),
  sex: checkedValue(form, 'rosh_child_sex'),
  address1: textValue(form, 'rosh_child_address1'),
  address2: textValue(form, 'rosh_child_address2'),
  town: textValue(form, 'rosh_child_town'),
  county: textValue(form, 'rosh_child_county'),
  postcode: textValue(form, 'rosh_child_postcode'),
  relationship: checkedValue(form, 'rosh_child_relationship'),
  relationshipDetails: textValue(form, 'rosh_child_relationship_details'),
  contact: checkedValue(form, 'rosh_child_contact')
})

const initChildForm = () => {
  const form = document.getElementById('rosh-child-form')
  if (!form) return

  const children = ensureChildrenHaveIds()
  const childId = getEditingChildId()
  const existing = children.find((child) => String(child.id) === String(childId))

  if (existing) {
    setRoshScreening({ roshEditingChildId: existing.id })
    const heading = document.getElementById('rosh-child-page-heading')
    if (heading) heading.textContent = 'Update identifiable child’s details'
    restoreText(form, 'rosh_child_id', existing.id)
    restoreText(form, 'rosh_child_name', existing.name)
    restoreText(form, 'rosh_child_dob_day', existing.dobDay)
    restoreText(form, 'rosh_child_dob_month', existing.dobMonth)
    restoreText(form, 'rosh_child_dob_year', existing.dobYear)
    restoreText(form, 'rosh_child_age', existing.age)
    restoreRadio(form, 'rosh_child_sex', existing.sex)
    restoreText(form, 'rosh_child_address1', existing.address1)
    restoreText(form, 'rosh_child_address2', existing.address2)
    restoreText(form, 'rosh_child_town', existing.town)
    restoreText(form, 'rosh_child_county', existing.county)
    restoreText(form, 'rosh_child_postcode', existing.postcode)
    restoreRadio(form, 'rosh_child_relationship', existing.relationship)
    restoreText(form, 'rosh_child_relationship_details', existing.relationshipDetails)
    restoreRadio(form, 'rosh_child_contact', existing.contact)
    revealCheckedConditionals(form)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const fields = getChildFields(form)
    const errors = []

    if (!fields.name) errors.push({ id: 'rosh-child-name', text: 'Enter the child’s name, or enter ‘Non-disclosable’' })
    if (!fields.relationship) errors.push({ id: 'rosh-child-relationship', text: `Select ${offenderFirstName()}’s relationship or connection to this child` })
    if (fields.relationship === 'other' && !fields.relationshipDetails) {
      errors.push({ id: 'rosh-child-relationship-details', text: 'Give details of the relationship or connection' })
    }
    if (!fields.contact) errors.push({ id: 'rosh-child-contact', text: 'Select yes if they have contact or are seeking contact with this child' })

    showErrors(errors)
    if (errors.length) return

    const nextChild = {
      ...existing,
      ...fields,
      id: existing?.id || fields.id || `child-${Date.now()}`
    }
    const nextChildren = existing
      ? children.map((child) => (String(child.id) === String(existing.id) ? nextChild : child))
      : [...children, nextChild]

    saveRoshProgress({ children: nextChildren, roshEditingChildId: undefined })
    window.location.href = continueAfterPage('rosh-children.html', {
      followJourney: isFromAnswers() && !existing
    })
  })
}

const initChildDelete = () => {
  const page = document.getElementById('rosh-child-delete-page')
  if (!page) return

  const children = ensureChildrenHaveIds()
  const childId = getEditingChildId()
  const child = children.find((item) => String(item.id) === String(childId))
  if (!child) {
    window.location.replace(continueAfterPage('rosh-children.html'))
    return
  }

  setRoshScreening({ roshEditingChildId: child.id })

  const details = document.querySelector('[data-rosh-delete-child-details]')
  if (details) {
    const name = child.name || 'Non-disclosable'
    details.innerHTML = `
      <section class="govuk-summary-card govuk-!-margin-bottom-6">
        <div class="govuk-summary-card__title-wrapper">
          <h2 class="govuk-summary-card__title">${name}</h2>
        </div>
        <div class="govuk-summary-card__content">
          <dl class="govuk-summary-list">
            ${childSummaryRowsHtml(child)}
          </dl>
        </div>
      </section>
    `
  }

  document.getElementById('rosh-child-delete-confirm')?.addEventListener('click', () => {
    saveRoshProgress({
      children: children.filter((item) => String(item.id) !== String(child.id)),
      childRemoved: true,
      roshEditingChildId: undefined
    })
    window.location.href = continueAfterPage('rosh-children.html')
  })

  const cancel = document.getElementById('rosh-child-delete-cancel')
  if (cancel) cancel.href = continueAfterPage('rosh-children.html')
}

const initYesNoUnknownPage = ({ formId, fields, nextHref }) => {
  const form = document.getElementById(formId)
  if (!form) return

  const rosh = getRoshScreening()
  fields.forEach((field) => restoreRadio(form, field.name, rosh[field.key]))

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const updates = {}
    const errors = []

    fields.forEach((field) => {
      updates[field.key] = checkedValue(form, field.name)
      if (!updates[field.key]) errors.push({ id: field.id, text: field.error })
    })

    showErrors(errors)
    if (errors.length) return

    saveRoshProgress(updates)
    window.location.href = continueAfterRoshSave(rosh, { ...rosh, ...updates }, nextHref)
  })
}

const offenderFirstName = () =>
  document.querySelector('[data-offender-first-name]')?.dataset.offenderFirstName || 'this person'

const initConfirmation = () => {
  const form = document.getElementById('rosh-confirmation-form')
  if (!form) return

  const rosh = getRoshScreening()
  const variant = getPreviewConfirmationVariant() || getConfirmationVariant(rosh)
  const sectionVariant = variant.startsWith('should-') ? 'should' : variant
  form.dataset.roshConfirmVariant = variant

  const shouldIntro = form.querySelector('[data-rosh-should-intro]')
  if (shouldIntro) {
    shouldIntro.textContent = shouldAdditionalLegend(variant, offenderFirstName())
  }

  form.querySelectorAll('[data-rosh-confirm-variant]').forEach((section) => {
    const show = section.dataset.roshConfirmVariant === sectionVariant
    section.hidden = !show
    section.querySelectorAll('input, textarea, select').forEach((field) => {
      field.disabled = !show
    })
  })

  restoreRadio(form, 'rosh_confirm_exempt', rosh.confirmExempt)
  restoreText(form, 'rosh_confirm_exempt_details', rosh.confirmExemptDetails)
  restoreRadio(form, 'rosh_confirm_additional', rosh.confirmAdditionalInfo)
  restoreText(form, 'rosh_confirm_additional_details', rosh.confirmAdditionalDetails)
  restoreRadio(form, 'rosh_confirm_should_exempt', rosh.confirmShouldExempt)
  restoreText(form, 'rosh_confirm_should_exempt_details', rosh.confirmShouldExemptDetails)
  revealCheckedConditionals(form)
  initConfirmationVariantLinks(variant)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const fields = {
      confirmExempt: checkedValue(form, 'rosh_confirm_exempt'),
      confirmExemptDetails: textValue(form, 'rosh_confirm_exempt_details'),
      confirmAdditionalInfo: checkedValue(form, 'rosh_confirm_additional'),
      confirmAdditionalDetails: textValue(form, 'rosh_confirm_additional_details'),
      confirmShouldExempt: checkedValue(form, 'rosh_confirm_should_exempt'),
      confirmShouldExemptDetails: textValue(form, 'rosh_confirm_should_exempt_details')
    }
    const errors = []
    const firstName = offenderFirstName()

    if (variant === 'must-screening') {
      if (!fields.confirmExempt) {
        errors.push({ id: 'rosh-confirm-exempt', text: `Select yes if you want to exempt ${firstName} from a full analysis` })
      }
      if (fields.confirmExempt === 'yes' && !fields.confirmExemptDetails) {
        errors.push({ id: 'rosh-confirm-exempt-details', text: 'Give details of why you are exempting them from a full analysis' })
      }
    } else if (variant === 'not-needed') {
      if (!fields.confirmAdditionalInfo) {
        errors.push({ id: 'rosh-confirm-additional', text: 'Select yes if you have additional information that makes you think a ROSH full analysis should be done' })
      }
      if (fields.confirmAdditionalInfo === 'yes' && !fields.confirmAdditionalDetails) {
        errors.push({ id: 'rosh-confirm-additional-details', text: 'Provide any additional information' })
      }
    } else if (variant !== 'must-children') {
      if (!fields.confirmAdditionalInfo) {
        errors.push({ id: 'rosh-confirm-additional', text: 'Select yes if you have any additional information' })
      }
      if (fields.confirmAdditionalInfo === 'yes' && !fields.confirmAdditionalDetails) {
        errors.push({ id: 'rosh-confirm-additional-details', text: 'Provide any additional information' })
      }
      if (!fields.confirmShouldExempt) {
        errors.push({ id: 'rosh-confirm-should-exempt', text: `Select yes if you want to exempt ${firstName} from a ROSH full analysis` })
      }
      if (fields.confirmShouldExempt === 'yes' && !fields.confirmShouldExemptDetails) {
        errors.push({ id: 'rosh-confirm-should-exempt-details', text: 'Give details of why you are exempting them from a full analysis' })
      }
    }

    showErrors(errors)
    if (errors.length) return

    const next = { ...fields, complete: true }
    setRoshScreening(next)
    window.location.href = roshHref('rosh-answers.html')
  })
}

const listHtml = (items) => {
  if (!items.length) return 'None'
  if (items.length === 1) return items[0]
  return items
    .map((item, index) => {
      const isLast = index === items.length - 1
      return `<p class="govuk-body${isLast ? ' govuk-!-margin-bottom-0' : ''}">${item}</p>`
    })
    .join('')
}

const yesNoUnknown = (value) => {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  if (value === 'unknown') return 'Unknown'
  return 'Not answered'
}

const changeLink = (href, label) =>
  `<a class="govuk-link" href="${roshHref(href)}?from=${FROM_ANSWERS}">Change<span class="govuk-visually-hidden"> ${label}</span></a>`

const summaryRow = (key, value, href, label) => `
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${key}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
    ${href ? `<dd class="govuk-summary-list__actions">${changeLink(href, label || key)}</dd>` : '<dd class="govuk-summary-list__actions"></dd>'}
  </div>
`

const answersSection = (heading, body) => `
  <section class="govuk-!-margin-bottom-9">
    <h2 class="govuk-heading-m">${heading}</h2>
    ${body}
  </section>
`

const answersSummaryList = (rows, extraClass = 'govuk-!-margin-bottom-0') =>
  `<dl class="govuk-summary-list ${extraClass}">${rows}</dl>`

const initAnswers = () => {
  const page = document.getElementById('rosh-answers-page')
  if (!page) return

  ensureChildrenHaveIds()
  setRoshScreening({ roshEditingChildId: undefined, roshReturnToAnswers: false })

  const rosh = getRoshScreening()
  const firstName = offenderFirstName()
  const outcome = getRoshOutcome(rosh)
  const variant = getConfirmationVariant(rosh)

  const completeAlert = document.querySelector('[data-rosh-complete-alert]')
  const completeHeading = completeAlert?.querySelector('.moj-alert__heading')
  const completeBody = completeAlert?.querySelector('[data-rosh-complete-body]')
  if (rosh.complete && completeAlert && completeHeading && completeBody) {
    completeAlert.hidden = false
    if (outcome === 'full-analysis') {
      completeHeading.textContent = 'You can now start the ROSH full analysis'
      completeBody.textContent = `You have confirmed that you will be completing a ROSH full analysis for ${firstName}.`
      const backLink = document.getElementById('rosh-answers-back')
      if (backLink) {
        backLink.hidden = true
        backLink.classList.add('assessment-layout__back-link--hidden')
      }
    } else {
      completeHeading.textContent = 'ROSH screening is complete'
      completeBody.textContent = `You have confirmed that you will not be completing a ROSH full analysis for ${firstName}.`
    }
    completeAlert.setAttribute('aria-label', `information: ${completeHeading.textContent}`)
  }

  const statusTag = document.querySelector('.assessment-layout__status-tag')
  if (statusTag && rosh.complete) {
    statusTag.textContent = 'Complete'
    statusTag.classList.remove('govuk-tag--grey', 'govuk-tag--light-grey')
    statusTag.classList.add('govuk-tag--light-blue')
  }

  const convictions = realSelections(rosh.convictions).map((id) => {
    const label = labelFor(ROSH_CONVICTIONS, id)
    if (id === 'other-serious' && rosh.otherSeriousDetails) return `${label}: ${rosh.otherSeriousDetails}`
    return label
  })
  const behaviours = realSelections(rosh.behaviours).map((id) => labelFor(ROSH_BEHAVIOURS, id))
  const orders =
    rosh.civilOrders === 'yes'
      ? (rosh.civilOrderTypes || []).map((id) => labelFor(ROSH_CIVIL_ORDERS, id))
      : []

  const others = document.querySelector('[data-rosh-answers-others]')
  if (others) {
    others.innerHTML = answersSection(
      'Risk to others',
      answersSummaryList(`
        ${summaryRow(`${firstName} has been previously convicted of the following offences`, hasNone(rosh.convictions || []) ? 'None of these offences' : listHtml(convictions), 'rosh-risk-to-others.html', 'convictions')}
        ${rosh.convictions?.includes('weapons') ? summaryRow(`Did ${firstName} possess a firearm with intent to endanger life or resist arrest?`, yesNoUnknown(rosh.weaponsFirearm), 'rosh-risk-to-others.html', 'firearm') : ''}
        ${summaryRow(`${firstName} has been involved in the following significant events`, hasNone(rosh.behaviours || []) ? 'None of these significant behaviours or events' : listHtml(behaviours), 'rosh-risk-to-others.html', 'significant events')}
        ${summaryRow(`${firstName} is currently subject to the following civil or ancillary orders`, rosh.civilOrders === 'no' ? 'No' : listHtml(orders), 'rosh-risk-to-others.html', 'civil or ancillary orders')}
      `)
    )
  }

  const children = document.querySelector('[data-rosh-answers-children]')
  if (children) {
    const showChildCards =
      rosh.childImpact === 'yes' && (rosh.childGroups || []).includes('identifiable')
    const childCards = (rosh.children || [])
      .map((child, index, list) => {
        const name = child.name || 'Non-disclosable'
        const isLast = index === list.length - 1
        return `
          <section class="govuk-summary-card${isLast ? '' : ' govuk-!-margin-bottom-6'}">
            <div class="govuk-summary-card__title-wrapper">
              <h3 class="govuk-summary-card__title">${name}</h3>
              <ul class="govuk-summary-card__actions">
                <li class="govuk-summary-card__action"><a class="govuk-link" href="${childPageHref('rosh-child.html', child.id, { fromAnswers: true })}" data-rosh-child-id="${child.id}">Change<span class="govuk-visually-hidden"> ${name}</span></a></li>
                <li class="govuk-summary-card__action"><a class="govuk-link" href="${childPageHref('rosh-child-delete.html', child.id, { fromAnswers: true })}" data-rosh-child-id="${child.id}">Delete<span class="govuk-visually-hidden"> ${name}</span></a></li>
              </ul>
            </div>
            <div class="govuk-summary-card__content">
              <dl class="govuk-summary-list">
                <div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">Date of birth or age (optional)</dt><dd class="govuk-summary-list__value">${formatChildDobOrAge(child)}</dd></div>
                <div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">Sex (optional)</dt><dd class="govuk-summary-list__value">${sexLabel(child.sex)}</dd></div>
                <div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">Address (optional)</dt><dd class="govuk-summary-list__value">${formatAddress(child)}</dd></div>
                <div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">What is ${firstName}’s relationship or connection to this child?</dt><dd class="govuk-summary-list__value">${labelFor(ROSH_RELATIONSHIPS, child.relationship) || 'Not answered'}</dd></div>
                <div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">Does ${firstName} have contact or is seeking contact with this child?</dt><dd class="govuk-summary-list__value">${yesNoUnknown(child.contact)}</dd></div>
              </dl>
            </div>
          </section>
        `
      })
      .join('')

    children.innerHTML = answersSection(
      'Risk to children',
      `${answersSummaryList(
        `
        ${summaryRow(`Could ${firstName}’s behaviour and circumstances negatively impact the wellbeing of any children?`, yesNoUnknown(rosh.childImpact), 'rosh-risk-to-children.html', 'impact on children')}
        ${rosh.childImpact === 'yes' ? summaryRow('Could the impact relate to identifiable children?', (rosh.childGroups || []).includes('identifiable') ? 'Yes' : 'No', 'rosh-risk-to-children.html', 'identifiable children') : ''}
        ${rosh.childImpact === 'yes' ? summaryRow('Could the impact relate to children in general?', (rosh.childGroups || []).includes('general') ? 'Yes' : 'No', 'rosh-risk-to-children.html', 'children in general') : ''}
        ${rosh.childImpact === 'no' && rosh.childImpactNoneDetails ? summaryRow('Explain why you think there will be no negative impact', rosh.childImpactNoneDetails, 'rosh-risk-to-children.html', 'no negative impact') : ''}
      `,
        showChildCards ? 'govuk-!-margin-bottom-6' : ''
      )}${
        showChildCards
          ? `<h3 class="govuk-heading-s">Identifiable children at risk</h3>${childCards}`
          : ''
      }`
    )
  }

  const individual = document.querySelector('[data-rosh-answers-individual]')
  if (individual) {
    individual.innerHTML = answersSection(
      'Risk to individual',
      answersSummaryList(`
        ${summaryRow(`Are there any concerns about ${firstName}’s risk of suicide?`, yesNoUnknown(rosh.suicide), 'rosh-risk-to-individual.html', 'suicide')}
        ${summaryRow(`Are there any concerns about ${firstName}’s risk of self-harm?`, yesNoUnknown(rosh.selfHarm), 'rosh-risk-to-individual.html', 'self-harm')}
        ${summaryRow(`Are there any concerns about ${firstName} coping in custody, approved premises or a hostel?`, yesNoUnknown(rosh.copingCustody), 'rosh-risk-to-individual.html', 'coping in custody')}
        ${summaryRow(`Are there any concerns about ${firstName}’s vulnerability?`, yesNoUnknown(rosh.vulnerability), 'rosh-risk-to-individual.html', 'vulnerability')}
      `)
    )
  }

  const otherRisks = document.querySelector('[data-rosh-answers-other]')
  if (otherRisks) {
    otherRisks.innerHTML = answersSection(
      'Other risks',
      answersSummaryList(`
        ${summaryRow(`Are there any concerns about ${firstName}’s risk of escape or absconding?`, yesNoUnknown(rosh.escape), 'rosh-other-risks.html', 'escape or absconding')}
        ${summaryRow(`Are there any concerns about ${firstName}’s risk of control issues, disruptive behaviour or breach of trust?`, yesNoUnknown(rosh.controlIssues), 'rosh-other-risks.html', 'control issues')}
        ${summaryRow(`Are there any concerns about ${firstName}’s risk to other prisoners?`, yesNoUnknown(rosh.riskToPrisoners), 'rosh-other-risks.html', 'risk to other prisoners')}
      `)
    )
  }

  const confirmation = document.querySelector('[data-rosh-answers-confirmation]')
  if (confirmation) {
    let rows = ''
    if (variant === 'must-screening') {
      rows += summaryRow(`Your screening answers indicate that a ROSH full analysis must be completed for ${firstName}. Do you want to exempt ${firstName} from a full analysis?`, yesNoUnknown(rosh.confirmExempt), 'rosh-confirmation.html', 'exemption')
      if (rosh.confirmExempt === 'yes') {
        rows += summaryRow('Reason for exemption', rosh.confirmExemptDetails || '', 'rosh-confirmation.html', 'exemption details')
      }
    } else if (variant === 'must-children') {
      rows += summaryRow(`Your ‘Risk to children’ answers indicate that a ROSH full analysis must be completed for ${firstName}.`, '', 'rosh-confirmation.html', 'risk to children confirmation')
    } else if (variant === 'not-needed') {
      rows += summaryRow(`Your screening answers indicate that a ROSH full analysis is not needed for ${firstName}. Do you have any additional information that makes you think that a ROSH full analysis should be done?`, yesNoUnknown(rosh.confirmAdditionalInfo), 'rosh-confirmation.html', 'additional information')
      if (rosh.confirmAdditionalInfo === 'yes') {
        rows += summaryRow('Additional information', rosh.confirmAdditionalDetails || '', 'rosh-confirmation.html', 'additional information details')
      }
    } else {
      const source =
        variant === 'should-both'
          ? '‘Risk to individual’ and ‘Risk to others’'
          : variant === 'should-individual'
            ? '‘Risk to individual’'
            : '‘Risk to others’'
      rows += summaryRow(`Your ${source} answers indicate that a ROSH full analysis should be completed for ${firstName}. Do you have any additional information?`, yesNoUnknown(rosh.confirmAdditionalInfo), 'rosh-confirmation.html', 'additional information')
      if (rosh.confirmAdditionalInfo === 'yes') {
        rows += summaryRow('Additional information', rosh.confirmAdditionalDetails || '', 'rosh-confirmation.html', 'additional information details')
      }
      rows += summaryRow(`Do you want to exempt ${firstName} from a ROSH full analysis?`, yesNoUnknown(rosh.confirmShouldExempt), 'rosh-confirmation.html', 'exemption')
      if (rosh.confirmShouldExempt === 'yes') {
        rows += summaryRow('Reason for exemption', rosh.confirmShouldExemptDetails || '', 'rosh-confirmation.html', 'exemption details')
      }
    }

    confirmation.innerHTML = answersSection('ROSH confirmation', answersSummaryList(rows))
  }

  page.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="rosh-child"]')
    if (!link) return

    const childId = getChildIdFromLink(link)
    if (!childId) return
    startRoshCheckAnswersEdit(childId)
  })
}

const showRemovedChildAlert = () => {
  const alert = document.querySelector('[data-rosh-removed-child-alert]')
  if (!alert) return
  if (!getRoshScreening().childRemoved) return
  alert.hidden = false
  setRoshScreening({ childRemoved: false })
}

const applyRoshScreeningCompleteNav = () => {
  const complete = getRoshScreening().complete === true

  document.querySelectorAll('[data-section-complete="rosh-screening"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  document.querySelectorAll('[data-section="rosh-screening"]').forEach((link) => {
    const item = link.closest('.moj-side-navigation__item')
    if (item) item.classList.toggle('assessment-section-navigation__item--complete', complete)

    const existingHint = link.querySelector('[data-section-complete-hint]')
    if (!complete) {
      existingHint?.remove()
      return
    }

    if (existingHint) return

    const completeHint = document.createElement('span')
    completeHint.className = 'govuk-visually-hidden'
    completeHint.dataset.sectionCompleteHint = 'true'
    completeHint.textContent = ', complete'
    link.appendChild(completeHint)
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!isRoshPage()) return

  applyRoshScreeningCompleteNav()

  persistRoshEditModeFromUrl()

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]')
    if (!link) return

    const href = link.getAttribute('href') || ''
    const childId = getChildIdFromLink(link)

    if (getFromParamFromHref(href) === FROM_ANSWERS || getFromParamFromHref(link.href) === FROM_ANSWERS) {
      startRoshCheckAnswersEdit(childId)
      return
    }

    persistEditingChildId(childId)
  })

  if (isFromAnswers()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      link.href = roshHref(ANSWERS_PAGE)
    })
  }

  const individualBack = document.getElementById('rosh-individual-back')
  if (individualBack && !isFromAnswers()) {
    const rosh = getRoshScreening()
    individualBack.href =
      rosh.childImpact === 'yes' && (rosh.childGroups || []).includes('identifiable')
        ? roshHref('rosh-children.html')
        : roshHref('rosh-risk-to-children.html')
  }

  showRemovedChildAlert()
  initRiskToOthers()
  initRiskToChildren()
  initChildrenList()
  initChildForm()
  initChildDelete()
  initYesNoUnknownPage({
    formId: 'rosh-risk-to-individual-form',
    nextHref: 'rosh-other-risks.html',
    fields: [
      { key: 'suicide', name: 'rosh_suicide', id: 'rosh-suicide', error: 'Select if there are any concerns about risk of suicide' },
      { key: 'selfHarm', name: 'rosh_self_harm', id: 'rosh-self-harm', error: 'Select if there are any concerns about risk of self-harm' },
      { key: 'copingCustody', name: 'rosh_coping_custody', id: 'rosh-coping-custody', error: 'Select if there are any concerns about coping in custody, approved premises or a hostel' },
      { key: 'vulnerability', name: 'rosh_vulnerability', id: 'rosh-vulnerability', error: 'Select if there are any concerns about vulnerability' }
    ]
  })
  initYesNoUnknownPage({
    formId: 'rosh-other-risks-form',
    nextHref: 'rosh-confirmation.html',
    fields: [
      { key: 'escape', name: 'rosh_escape', id: 'rosh-escape', error: 'Select if there are any concerns about risk of escape or absconding' },
      { key: 'controlIssues', name: 'rosh_control_issues', id: 'rosh-control-issues', error: 'Select if there are any concerns about control issues, disruptive behaviour or breach of trust' },
      { key: 'riskToPrisoners', name: 'rosh_risk_to_prisoners', id: 'rosh-risk-to-prisoners', error: 'Select if there are any concerns about risk to other prisoners' }
    ]
  })
  initConfirmation()
  initAnswers()
})
