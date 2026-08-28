//
// Prototype 3 – Risk of serious harm (full analysis) journey
// Screen sequence and display logic follow the ROSH full analysis designs and BA flow.
//

import {
  getPredictorsAssessmentSession,
  setPredictorsAssessmentSession
} from './predictors-assessment-session.js'

const ROSH_PATH = '/03/'
const FROM_ANSWERS = 'answers'
const ANSWERS_PAGE = 'rosh-full-answers.html'

export const ROSH_FULL_GROUPS = [
  {
    id: 'children',
    label: 'Children',
    shortLabel: 'children',
    hint: 'Identifiable children and children in general',
    community: true,
    custody: true
  },
  {
    id: 'public',
    label: 'The public',
    shortLabel: 'the public',
    hint: 'People who are not known to them',
    community: true,
    custody: true
  },
  {
    id: 'known-adult',
    label: 'A known adult',
    shortLabel: 'a known adult',
    hint: 'A specific adult, such as a partner, ex-partner or other named person',
    community: true,
    custody: true
  },
  {
    id: 'staff',
    label: 'Staff',
    shortLabel: 'staff',
    hint: 'Prison, probation, police or other staff',
    community: true,
    custody: true
  },
  {
    id: 'prisoners',
    label: 'Prisoners',
    shortLabel: 'prisoners',
    hint: 'Other people in custody',
    community: false,
    custody: true
  }
]

const INDIVIDUAL_FIELDS = [
  {
    key: 'suicide',
    name: 'rosh_full_suicide',
    id: 'rosh-full-suicide',
    detailsKey: 'suicideDetails',
    detailsName: 'rosh_full_suicide_details',
    detailsId: 'rosh-full-suicide-details',
    error: 'Select if there are any concerns about risk of suicide',
    detailsError: 'Give details of the concerns about risk of suicide',
    question: (firstName) => `Are there any concerns about ${firstName}’s risk of suicide?`
  },
  {
    key: 'selfHarm',
    name: 'rosh_full_self_harm',
    id: 'rosh-full-self-harm',
    detailsKey: 'selfHarmDetails',
    detailsName: 'rosh_full_self_harm_details',
    detailsId: 'rosh-full-self-harm-details',
    error: 'Select if there are any concerns about risk of self-harm',
    detailsError: 'Give details of the concerns about risk of self-harm',
    question: (firstName) => `Are there any concerns about ${firstName}’s risk of self-harm?`
  },
  {
    key: 'copingCustody',
    name: 'rosh_full_coping_custody',
    id: 'rosh-full-coping-custody',
    detailsKey: 'copingCustodyDetails',
    detailsName: 'rosh_full_coping_custody_details',
    detailsId: 'rosh-full-coping-custody-details',
    error: 'Select if there are any concerns about coping in custody, approved premises or a hostel',
    detailsError: 'Give details of the concerns about coping in custody, approved premises or a hostel',
    question: (firstName) =>
      `Are there any concerns about ${firstName} coping in custody, approved premises or a hostel?`
  },
  {
    key: 'vulnerability',
    name: 'rosh_full_vulnerability',
    id: 'rosh-full-vulnerability',
    detailsKey: 'vulnerabilityDetails',
    detailsName: 'rosh_full_vulnerability_details',
    detailsId: 'rosh-full-vulnerability-details',
    error: 'Select if there are any concerns about vulnerability',
    detailsError: 'Give details of the concerns about vulnerability',
    question: (firstName) => `Are there any concerns about ${firstName}’s vulnerability?`
  }
]

const OTHER_RISK_FIELDS = [
  {
    key: 'escape',
    name: 'rosh_full_escape',
    id: 'rosh-full-escape',
    detailsKey: 'escapeDetails',
    detailsName: 'rosh_full_escape_details',
    detailsId: 'rosh-full-escape-details',
    error: 'Select if there are any concerns about risk of escape or absconding',
    detailsError: 'Give details of the concerns about risk of escape or absconding',
    question: (firstName) => `Are there any concerns about ${firstName}’s risk of escape or absconding?`
  },
  {
    key: 'controlIssues',
    name: 'rosh_full_control_issues',
    id: 'rosh-full-control-issues',
    detailsKey: 'controlIssuesDetails',
    detailsName: 'rosh_full_control_issues_details',
    detailsId: 'rosh-full-control-issues-details',
    error: 'Select if there are any concerns about control issues, disruptive behaviour or breach of trust',
    detailsError: 'Give details of the concerns about control issues, disruptive behaviour or breach of trust',
    question: (firstName) =>
      `Are there any concerns about ${firstName}’s risk of control issues, disruptive behaviour or breach of trust?`
  },
  {
    key: 'riskToPrisoners',
    name: 'rosh_full_risk_to_prisoners',
    id: 'rosh-full-risk-to-prisoners',
    detailsKey: 'riskToPrisonersDetails',
    detailsName: 'rosh_full_risk_to_prisoners_details',
    detailsId: 'rosh-full-risk-to-prisoners-details',
    error: 'Select if there are any concerns about risk to other prisoners',
    detailsError: 'Give details of the concerns about risk to other prisoners',
    question: (firstName) => `Are there any concerns about ${firstName}’s risk to other prisoners?`
  }
]

const RISK_LEVEL_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  'very-high': 'Very high'
}

const groupById = (id) => ROSH_FULL_GROUPS.find((group) => group.id === id)

const isRoshFullPage = () =>
  window.location.pathname.includes('/03/') && window.location.pathname.includes('rosh-full')

export const roshFullHref = (page) => {
  if (!page) return ROSH_PATH
  if (page.startsWith('/')) return page
  return `${ROSH_PATH}${page}`
}

const getSearchParams = () => new URLSearchParams(window.location.search)

export const getRoshFullAnalysis = () => getPredictorsAssessmentSession().roshFullAnalysis || {}

export const setRoshFullAnalysis = (updates) => {
  const current = getRoshFullAnalysis()
  setPredictorsAssessmentSession({
    roshFullAnalysis: { ...current, ...updates }
  })
}

export const isFromFullAnswers = () =>
  getSearchParams().get('from') === FROM_ANSWERS || getRoshFullAnalysis().returnToAnswers === true

export const withFromFullAnswers = (href) => {
  if (!href || !isFromFullAnswers()) return href
  const resolved = href.startsWith('/') ? href : roshFullHref(href.replace(/^\.\//, ''))
  const url = new URL(resolved, window.location.origin)
  url.searchParams.set('from', FROM_ANSWERS)
  return `${url.pathname}${url.search}${url.hash}`
}

const persistFullEditModeFromUrl = () => {
  if (getSearchParams().get('from') === FROM_ANSWERS) {
    setRoshFullAnalysis({ returnToAnswers: true })
  }
}

const getFromParamFromHref = (href = '') => {
  const match = String(href).match(/[?&]from=([^&#]+)/)
  return match?.[1] || null
}

const startFullCheckAnswersEdit = () => {
  setRoshFullAnalysis({ returnToAnswers: true })
}

if (typeof window !== 'undefined' && isRoshFullPage()) {
  persistFullEditModeFromUrl()
}

const saveFullProgress = (updates) => {
  setRoshFullAnalysis(isFromFullAnswers() ? updates : { ...updates, complete: false })
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

const revealCheckedConditionals = (form) => {
  form.querySelectorAll('input[data-aria-controls]:checked').forEach((input) => {
    const target = document.getElementById(input.getAttribute('data-aria-controls'))
    if (!target) return
    target.classList.remove('govuk-radios__conditional--hidden')
    target.classList.remove('govuk-checkboxes__conditional--hidden')
  })
}

const offenderFirstName = () =>
  document.querySelector('[data-offender-first-name]')?.dataset.offenderFirstName || 'this person'

const selectedGroups = (analysis = getRoshFullAnalysis()) =>
  ROSH_FULL_GROUPS.filter((group) => (analysis.groups || []).includes(group.id))

const continueAfterPage = (defaultHref) => {
  if (isFromFullAnswers()) return roshFullHref(ANSWERS_PAGE)
  return withFromFullAnswers(roshFullHref(defaultHref))
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
      const insertBefore =
        group.querySelector('.govuk-fieldset, .govuk-character-count, .govuk-input, .govuk-textarea') || target
      insertBefore.insertAdjacentElement('beforebegin', message)
    }
  })
}

const setGroupSectionsVisible = (root = document, groups = selectedGroups()) => {
  const selectedIds = new Set(groups.map((group) => group.id))
  root.querySelectorAll('[data-rosh-full-group]').forEach((section) => {
    const id = section.dataset.roshFullGroup
    const show = selectedIds.has(id)
    section.hidden = !show
    section.querySelectorAll('input, textarea, select').forEach((field) => {
      field.disabled = !show
    })
  })
}

const requireSelectedGroups = () => {
  if (selectedGroups().length) return true
  window.location.replace(continueAfterPage('rosh-full-who.html'))
  return false
}

const detailsFor = (analysis, groupId) => analysis.whoDetails?.[groupId] || ''
const increaseFor = (analysis, groupId) => analysis.increaseDetails?.[groupId] || ''
const reduceFor = (analysis, groupId) => analysis.reduceDetails?.[groupId] || ''
const ratingFor = (analysis, groupId, setting) => analysis.ratings?.[groupId]?.[setting] || ''

const collectWhoFields = (form) => {
  const groups = selectedValues(form, 'rosh_full_groups')
  const whoDetails = {}
  groups.forEach((id) => {
    whoDetails[id] = textValue(form, `rosh_full_who_${id}`)
  })
  return { groups, whoDetails }
}

const collectGroupTextMap = (form, prefix) => {
  const details = {}
  selectedGroups().forEach((group) => {
    details[group.id] = textValue(form, `${prefix}${group.id}`)
  })
  return details
}

const collectRatings = (form) => {
  const ratings = {}
  selectedGroups().forEach((group) => {
    ratings[group.id] = {
      community: group.community ? checkedValue(form, `rosh_full_rating_${group.id}_community`) : '',
      custody: group.custody ? checkedValue(form, `rosh_full_rating_${group.id}_custody`) : ''
    }
  })
  return ratings
}

const collectConcernFields = (form, fields) => {
  const updates = {}
  fields.forEach((field) => {
    updates[field.key] = checkedValue(form, field.name)
    updates[field.detailsKey] = updates[field.key] === 'yes' ? textValue(form, field.detailsName) : ''
  })
  return updates
}

const validateConcernFields = (updates, fields) => {
  const errors = []
  fields.forEach((field) => {
    if (!updates[field.key]) errors.push({ id: field.id, text: field.error })
    if (updates[field.key] === 'yes' && !updates[field.detailsKey]) {
      errors.push({ id: field.detailsId, text: field.detailsError })
    }
  })
  return errors
}

const restoreConcernFields = (form, fields, analysis) => {
  fields.forEach((field) => {
    restoreRadio(form, field.name, analysis[field.key])
    restoreText(form, field.detailsName, analysis[field.detailsKey])
  })
}

const initWhoIsAtRisk = () => {
  const form = document.getElementById('rosh-full-who-form')
  if (!form) return

  const analysis = getRoshFullAnalysis()
  restoreCheckboxes(form, 'rosh_full_groups', analysis.groups)
  ROSH_FULL_GROUPS.forEach((group) => {
    restoreText(form, `rosh_full_who_${group.id}`, detailsFor(analysis, group.id))
  })
  revealCheckedConditionals(form)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const fields = collectWhoFields(form)
    const errors = []

    if (!fields.groups.length) {
      errors.push({ id: 'rosh-full-groups', text: `Select who is at risk of serious harm from ${offenderFirstName()}` })
    }

    fields.groups.forEach((id) => {
      if (!fields.whoDetails[id]) {
        const group = groupById(id)
        errors.push({
          id: `rosh-full-who-${id}`,
          text: `Give details of who is at risk and why for ${group?.shortLabel || id}`
        })
      }
    })

    showErrors(errors)
    if (errors.length) return

    const previousGroups = analysis.groups || []
    const removed = previousGroups.filter((id) => !fields.groups.includes(id))
    const whoDetails = { ...analysis.whoDetails, ...fields.whoDetails }
    const increaseDetails = { ...(analysis.increaseDetails || {}) }
    const reduceDetails = { ...(analysis.reduceDetails || {}) }
    const ratings = { ...(analysis.ratings || {}) }
    removed.forEach((id) => {
      delete whoDetails[id]
      delete increaseDetails[id]
      delete reduceDetails[id]
      delete ratings[id]
    })

    saveFullProgress({
      groups: fields.groups,
      whoDetails,
      increaseDetails,
      reduceDetails,
      ratings
    })
    window.location.href = continueAfterPage('rosh-full-nature.html')
  })
}

const initSingleTextPage = ({ formId, fieldName, fieldId, sessionKey, error, nextHref }) => {
  const form = document.getElementById(formId)
  if (!form) return
  if (!requireSelectedGroups()) return

  restoreText(form, fieldName, getRoshFullAnalysis()[sessionKey])

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const value = textValue(form, fieldName)
    if (!value) {
      showErrors([{ id: fieldId, text: error }])
      return
    }
    saveFullProgress({ [sessionKey]: value })
    window.location.href = continueAfterPage(nextHref)
  })
}

const initWhen = () => {
  const form = document.getElementById('rosh-full-when-form')
  if (!form) return
  if (!requireSelectedGroups()) return

  const analysis = getRoshFullAnalysis()
  restoreText(form, 'rosh_full_when', analysis.when)
  restoreRadio(form, 'rosh_full_imminent', analysis.imminent)
  revealCheckedConditionals(form)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const when = textValue(form, 'rosh_full_when')
    const imminent = checkedValue(form, 'rosh_full_imminent')
    const errors = []

    if (!when) {
      errors.push({
        id: 'rosh-full-when',
        text: 'Describe when the risk is likely to be greatest'
      })
    }
    if (!imminent) {
      errors.push({ id: 'rosh-full-imminent', text: 'Select yes if the risk is imminent' })
    }

    showErrors(errors)
    if (errors.length) return

    saveFullProgress({ when, imminent })
    window.location.href = continueAfterPage('rosh-full-increase.html')
  })
}

const initGroupTextPage = ({ formId, prefix, sessionKey, errorFor, nextHref }) => {
  const form = document.getElementById(formId)
  if (!form) return
  if (!requireSelectedGroups()) return

  const analysis = getRoshFullAnalysis()
  const groups = selectedGroups(analysis)
  setGroupSectionsVisible(form, groups)
  groups.forEach((group) => {
    restoreText(form, `${prefix}${group.id}`, (analysis[sessionKey] || {})[group.id])
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const details = collectGroupTextMap(form, prefix)
    const errors = []

    groups.forEach((group) => {
      if (!details[group.id]) {
        errors.push({
          id: `rosh-full-${sessionKey === 'increaseDetails' ? 'increase' : 'reduce'}-${group.id}`,
          text: errorFor(group)
        })
      }
    })

    showErrors(errors)
    if (errors.length) return

    saveFullProgress({ [sessionKey]: { ...(analysis[sessionKey] || {}), ...details } })
    window.location.href = continueAfterPage(nextHref)
  })
}

const initRatings = () => {
  const form = document.getElementById('rosh-full-ratings-form')
  if (!form) return
  if (!requireSelectedGroups()) return

  const analysis = getRoshFullAnalysis()
  const groups = selectedGroups(analysis)
  setGroupSectionsVisible(form, groups)

  groups.forEach((group) => {
    if (group.community) {
      restoreRadio(form, `rosh_full_rating_${group.id}_community`, ratingFor(analysis, group.id, 'community'))
    }
    if (group.custody) {
      restoreRadio(form, `rosh_full_rating_${group.id}_custody`, ratingFor(analysis, group.id, 'custody'))
    }
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const ratings = collectRatings(form)
    const errors = []

    groups.forEach((group) => {
      if (group.community && !ratings[group.id].community) {
        errors.push({
          id: `rosh-full-rating-${group.id}-community`,
          text: `Select the risk of serious harm to ${group.shortLabel} in the community`
        })
      }
      if (group.custody && !ratings[group.id].custody) {
        errors.push({
          id: `rosh-full-rating-${group.id}-custody`,
          text: `Select the risk of serious harm to ${group.shortLabel} in custody`
        })
      }
    })

    showErrors(errors)
    if (errors.length) return

    saveFullProgress({ ratings: { ...(analysis.ratings || {}), ...ratings } })
    window.location.href = continueAfterPage('rosh-full-individual.html')
  })
}

const initConcernsPage = ({ formId, fields, nextHref }) => {
  const form = document.getElementById(formId)
  if (!form) return

  const analysis = getRoshFullAnalysis()
  restoreConcernFields(form, fields, analysis)
  revealCheckedConditionals(form)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const updates = collectConcernFields(form, fields)
    const errors = validateConcernFields(updates, fields)
    showErrors(errors)
    if (errors.length) return
    saveFullProgress(updates)
    window.location.href = continueAfterPage(nextHref)
  })
}

const yesNoUnknown = (value) => {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  if (value === 'unknown') return 'Unknown'
  return 'Not answered'
}

const imminentLabel = (value) => {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return 'Not answered'
}

const riskLevelLabel = (value) => RISK_LEVEL_LABELS[value] || 'Not answered'

const changeLink = (href, label) =>
  `<a class="govuk-link" href="${roshFullHref(href)}?from=${FROM_ANSWERS}">Change<span class="govuk-visually-hidden"> ${label}</span></a>`

const summaryRow = (key, value, href, label) => `
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${key}</dt>
    <dd class="govuk-summary-list__value">${value || 'Not answered'}</dd>
    ${href ? `<dd class="govuk-summary-list__actions">${changeLink(href, label || key)}</dd>` : '<dd class="govuk-summary-list__actions"></dd>'}
  </div>
`

const answersSection = (heading, body) => `
  <section class="govuk-!-margin-bottom-9">
    <h3 class="govuk-heading-m">${heading}</h3>
    ${body}
  </section>
`

const answersSummaryList = (rows) => `<dl class="govuk-summary-list">${rows}</dl>`

const multilineValue = (value) => {
  if (!value) return 'Not answered'
  return String(value).replace(/\n/g, '<br>')
}

const concernRows = (fields, analysis, href) =>
  fields
    .map((field) => {
      const answer = yesNoUnknown(analysis[field.key])
      let rows = summaryRow(field.question(offenderFirstName()), answer, href, field.question(offenderFirstName()))
      if (analysis[field.key] === 'yes') {
        rows += summaryRow('Details', multilineValue(analysis[field.detailsKey]), href, `${field.question(offenderFirstName())} details`)
      }
      return rows
    })
    .join('')

const initAnswers = () => {
  const page = document.getElementById('rosh-full-answers-page')
  if (!page) return

  setRoshFullAnalysis({ returnToAnswers: false })

  const analysis = getRoshFullAnalysis()
  const groups = selectedGroups(analysis)
  const firstName = offenderFirstName()

  const completeAlert = document.querySelector('[data-rosh-full-complete-alert]')
  if (analysis.complete && completeAlert) {
    completeAlert.hidden = false
  }

  const statusTag = document.querySelector('.assessment-layout__status-tag')
  if (statusTag && analysis.complete) {
    statusTag.textContent = 'Complete'
    statusTag.classList.remove('govuk-tag--grey', 'govuk-tag--light-grey')
    statusTag.classList.add('govuk-tag--light-blue')
  }

  const who = document.querySelector('[data-rosh-full-answers-who]')
  if (who) {
    const rows = groups.length
      ? groups
          .map(
            (group) =>
              `${summaryRow(group.label, multilineValue(detailsFor(analysis, group.id)), 'rosh-full-who.html', group.label)}`
          )
          .join('')
      : summaryRow(
          `Who is at risk of serious harm from ${firstName}?`,
          'Not answered',
          'rosh-full-who.html',
          'who is at risk'
        )
    who.innerHTML = answersSection('Who is at risk', answersSummaryList(rows))
  }

  const nature = document.querySelector('[data-rosh-full-answers-nature]')
  if (nature) {
    nature.innerHTML = answersSection(
      'Nature of the risk',
      answersSummaryList(
        summaryRow('What is the nature of the risk?', multilineValue(analysis.nature), 'rosh-full-nature.html', 'nature of the risk')
      )
    )
  }

  const when = document.querySelector('[data-rosh-full-answers-when]')
  if (when) {
    when.innerHTML = answersSection(
      'When the risk is greatest',
      answersSummaryList(`
        ${summaryRow('When is the risk likely to be greatest?', multilineValue(analysis.when), 'rosh-full-when.html', 'when the risk is greatest')}
        ${summaryRow('Is the risk imminent?', imminentLabel(analysis.imminent), 'rosh-full-when.html', 'whether the risk is imminent')}
      `)
    )
  }

  const increase = document.querySelector('[data-rosh-full-answers-increase]')
  if (increase) {
    const rows = groups
      .map(
        (group) =>
          summaryRow(
            `Circumstances likely to increase the risk to ${group.shortLabel}`,
            multilineValue(increaseFor(analysis, group.id)),
            'rosh-full-increase.html',
            `circumstances that increase risk to ${group.shortLabel}`
          )
      )
      .join('')
    increase.innerHTML = answersSection('Circumstances that increase risk', answersSummaryList(rows))
  }

  const reduce = document.querySelector('[data-rosh-full-answers-reduce]')
  if (reduce) {
    const rows = groups
      .map(
        (group) =>
          summaryRow(
            `Factors likely to reduce the risk to ${group.shortLabel}`,
            multilineValue(reduceFor(analysis, group.id)),
            'rosh-full-reduce.html',
            `factors that reduce risk to ${group.shortLabel}`
          )
      )
      .join('')
    reduce.innerHTML = answersSection('Factors that reduce risk', answersSummaryList(rows))
  }

  const ratings = document.querySelector('[data-rosh-full-answers-ratings]')
  if (ratings) {
    const rows = groups
      .map((group) => {
        let groupRows = ''
        if (group.community) {
          groupRows += summaryRow(
            `${group.label} in the community`,
            riskLevelLabel(ratingFor(analysis, group.id, 'community')),
            'rosh-full-ratings.html',
            `${group.label} in the community`
          )
        }
        if (group.custody) {
          groupRows += summaryRow(
            `${group.label} in custody`,
            riskLevelLabel(ratingFor(analysis, group.id, 'custody')),
            'rosh-full-ratings.html',
            `${group.label} in custody`
          )
        }
        return groupRows
      })
      .join('')
    ratings.innerHTML = answersSection('Current risk of serious harm', answersSummaryList(rows))
  }

  const individual = document.querySelector('[data-rosh-full-answers-individual]')
  if (individual) {
    individual.innerHTML = answersSection(
      'Risk to the individual',
      answersSummaryList(concernRows(INDIVIDUAL_FIELDS, analysis, 'rosh-full-individual.html'))
    )
  }

  const other = document.querySelector('[data-rosh-full-answers-other]')
  if (other) {
    other.innerHTML = answersSection(
      'Other risks',
      answersSummaryList(concernRows(OTHER_RISK_FIELDS, analysis, 'rosh-full-other.html'))
    )
  }

  const completeButton = document.getElementById('rosh-full-confirm')
  if (completeButton) {
    if (analysis.complete) {
      completeButton.remove()
    } else {
      completeButton.addEventListener('click', () => {
        setRoshFullAnalysis({ complete: true, returnToAnswers: false })
        window.location.href = roshFullHref(ANSWERS_PAGE)
      })
    }
  }
}

const applyRoshFullCompleteNav = () => {
  const complete = getRoshFullAnalysis().complete === true

  document.querySelectorAll('[data-section-complete="rosh-full-analysis"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  document.querySelectorAll('[data-section="rosh-full-analysis"]').forEach((link) => {
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

const applyRoshFullNavHref = () => {
  const analysis = getRoshFullAnalysis()
  let href = 'rosh-full-start.html'
  if (analysis.complete) href = ANSWERS_PAGE
  else if ((analysis.groups || []).length) href = 'rosh-full-who.html'

  document.querySelectorAll('[data-section="rosh-full-analysis"]').forEach((link) => {
    link.href = href
  })
}

const applyRoshScreeningCompleteNavFromFull = () => {
  const complete = getPredictorsAssessmentSession().roshScreening?.complete === true

  document.querySelectorAll('[data-section-complete="rosh-screening"]').forEach((icon) => {
    icon.classList.toggle('assessment-section-navigation__complete-icon--visible', complete)
  })

  document.querySelectorAll('[data-section="rosh-screening"]').forEach((link) => {
    const item = link.closest('.moj-side-navigation__item')
    if (item) item.classList.toggle('assessment-section-navigation__item--complete', complete)
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  const onRoshNav = window.location.pathname.includes('/03/') && window.location.pathname.includes('rosh-')
  if (onRoshNav) {
    applyRoshFullCompleteNav()
    applyRoshFullNavHref()
  }

  if (!isRoshFullPage()) return

  applyRoshScreeningCompleteNavFromFull()
  persistFullEditModeFromUrl()

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]')
    if (!link) return
    const href = link.getAttribute('href') || ''
    if (getFromParamFromHref(href) === FROM_ANSWERS || getFromParamFromHref(link.href) === FROM_ANSWERS) {
      startFullCheckAnswersEdit()
    }
  })

  if (isFromFullAnswers()) {
    document.querySelectorAll('.govuk-back-link').forEach((link) => {
      link.href = roshFullHref(ANSWERS_PAGE)
    })
  }

  initWhoIsAtRisk()
  initSingleTextPage({
    formId: 'rosh-full-nature-form',
    fieldName: 'rosh_full_nature',
    fieldId: 'rosh-full-nature',
    sessionKey: 'nature',
    error: 'Describe the nature of the risk',
    nextHref: 'rosh-full-when.html'
  })
  initWhen()
  initGroupTextPage({
    formId: 'rosh-full-increase-form',
    prefix: 'rosh_full_increase_',
    sessionKey: 'increaseDetails',
    errorFor: (group) => `Describe the circumstances that are likely to increase the risk to ${group.shortLabel}`,
    nextHref: 'rosh-full-reduce.html'
  })
  initGroupTextPage({
    formId: 'rosh-full-reduce-form',
    prefix: 'rosh_full_reduce_',
    sessionKey: 'reduceDetails',
    errorFor: (group) => `Describe the factors that are likely to reduce the risk to ${group.shortLabel}`,
    nextHref: 'rosh-full-ratings.html'
  })
  initRatings()
  initConcernsPage({
    formId: 'rosh-full-individual-form',
    fields: INDIVIDUAL_FIELDS,
    nextHref: 'rosh-full-other.html'
  })
  initConcernsPage({
    formId: 'rosh-full-other-form',
    fields: OTHER_RISK_FIELDS,
    nextHref: ANSWERS_PAGE
  })
  initAnswers()
})
