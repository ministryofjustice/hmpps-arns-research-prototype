//
// Build GOV.UK summary list rows from Predictors session data (grouped by page)
//

import {
  PREDICTORS_CHANGE_ANCHORS,
  PREDICTORS_FROM_B11_DYNAMIC,
  PREDICTORS_FROM_B11_STATIC,
  PREDICTORS_FROM_CHECK_ANSWERS,
  predictorsChangeHref
} from './predictors-change-scroll.js'
import { formatDateFromParts, getOffenderDateOfBirthParts } from './predictors-assessment-session.js'
import { calculateAgeOnDate, enrichOffenceFromLookup, isA5Required, isValidDateParts } from './predictors-journey.js'
import { formatOffenceCodeLabel } from './predictors-offence-browse.js'
import { buildDynamicPredictorsSummarySections } from './predictors-dynamic-summary.js'

const NOT_PROVIDED_HTML =
  '<span class="predictors-summary-list__not-provided">Not provided</span>'

export const formatChoice = (value) => {
  if (!value) return null

  const labels = {
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown'
  }

  return labels[value] || value
}

const formatFirstSanctionAnswer = (session) => {
  if (isValidDateParts(session.firstSanctionDate)) {
    const formatted = formatDateFromParts(session.firstSanctionDate)
    const age = calculateAgeOnDate(getOffenderDateOfBirthParts(), session.firstSanctionDate)
    return age != null ? `${formatted} (age ${age})` : formatted
  }

  return session.firstSanctionAge
}

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const renderSummarySection = ({ title, rows }) => `
  <section class="predictors-summary-section govuk-!-margin-bottom-6">
    <h2 class="govuk-heading-m govuk-!-margin-bottom-3">${escapeHtml(title)}</h2>
    <dl class="govuk-summary-list govuk-!-margin-bottom-0">${renderSummaryRows(rows)}</dl>
  </section>`

const renderSummarySections = (sections) => sections.map(renderSummarySection).join('')

const renderSummaryGroup = (heading, sections, extraClass = '') => `
  <div class="predictors-summary-group ${extraClass}">
    <h2 class="govuk-heading-l govuk-!-margin-bottom-6">${escapeHtml(heading)}</h2>
    ${renderSummarySections(sections)}
  </div>`

const splitStaticAndDynamicSections = (sections) => {
  const interviewIndex = sections.findIndex(({ title }) => title === 'Interview')

  if (interviewIndex === -1) {
    return { staticSections: sections, dynamicSections: [] }
  }

  return {
    staticSections: sections.slice(0, interviewIndex + 1),
    dynamicSections: sections.slice(interviewIndex + 1)
  }
}

const renderSummaryRows = (rows) =>
  rows
    .map(
      ({ key, value, changeHref, changeHidden, hideChange }) => `
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(key)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>${
      hideChange
        ? ''
        : `
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${changeHref}">Change<span class="govuk-visually-hidden"> ${escapeHtml(changeHidden)}</span></a>
    </dd>`
    }
  </div>`
    )
    .join('')

export const buildPredictorsSummarySections = (session, offenderFirstName = 'Alex', options = {}) => {
  const name = offenderFirstName
  const sections = []
  const staticCheckAnswersFrom =
    options.staticCheckAnswersFrom ||
    options.checkAnswersFrom ||
    PREDICTORS_FROM_CHECK_ANSWERS
  const dynamicCheckAnswersFrom =
    options.dynamicCheckAnswersFrom ||
    options.checkAnswersFrom ||
    PREDICTORS_FROM_CHECK_ANSWERS

  const createRow = (
    key,
    value,
    changeHref,
    changeHidden,
    allowHtml = false,
    changeAnchor,
    hideChange = false,
    from = staticCheckAnswersFrom
  ) => {
    let display = NOT_PROVIDED_HTML

    if (value) {
      display = allowHtml ? value : escapeHtml(value)
    }

    return {
      key,
      value: display,
      changeHref: predictorsChangeHref(changeHref, changeAnchor, from),
      changeHidden: changeHidden || key,
      hideChange
    }
  }

  const createDynamicRow = (
    key,
    value,
    changeHref,
    changeHidden,
    allowHtml = false,
    changeAnchor,
    hideChange = false
  ) =>
    createRow(
      key,
      value,
      changeHref,
      changeHidden,
      allowHtml,
      changeAnchor,
      hideChange,
      dynamicCheckAnswersFrom
    )

  const currentOffence = enrichOffenceFromLookup(session.currentOffence)
  const convictionDateLabel = formatDateFromParts(session.convictionDate || {})
  const offenceCodeLabel = formatOffenceCodeLabel(currentOffence || {})

  sections.push({
    title: 'Current offence details',
    rows: [
      createRow(
        'Offence name',
        currentOffence?.label || null,
        'a1.html',
        'Offence name',
        false,
        PREDICTORS_CHANGE_ANCHORS.currentOffence,
        true
      ),
      createRow(
        'Offence code',
        offenceCodeLabel || null,
        'a1.html',
        'Offence code',
        false,
        PREDICTORS_CHANGE_ANCHORS.currentOffence,
        true
      ),
      createRow(
        'Date of current conviction',
        convictionDateLabel || null,
        'a1.html',
        'Date of current conviction',
        false,
        PREDICTORS_CHANGE_ANCHORS.convictionDate,
        true
      )
    ]
  })

  sections.push({
    title: 'Offending history',
    rows: [
      createRow(
        `What was ${name}'s date of first sanction?`,
        formatFirstSanctionAnswer(session),
        'a2b.html',
        `What was the date of ${name}'s first sanction?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.firstSanctionAge
      ),
      createRow(
        `How many sanctions does ${name} have in total for all offences?`,
        session.totalSanctions,
        'a2b.html',
        `How many sanctions does ${name} have in total for all offences?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.totalSanctions
      ),
      createRow(
        `How many of ${name}'s total sanctions involved violent offences?`,
        session.violentSanctions,
        'a2b.html',
        `How many of ${name}'s total sanctions involved violent offences?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.violentSanctions
      ),
      createRow(
        `Has ${name} ever committed a sexual or sexually motivated offence?`,
        formatChoice(session.sexualOffence),
        'a2b.html',
        `Has ${name} ever committed a sexual or sexually motivated offence?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.sexualOffence
      )
    ]
  })

  if (session.sexualOffence === 'yes') {
    sections.push({
      title: 'Current and recent sexual offending',
      rows: [
        createRow(
          `Does ${name}'s current offence have a sexual motivation?`,
          formatChoice(session.sexualMotivation),
          'a3.html',
          `Does ${name}'s current offence have a sexual motivation?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.sexualMotivation
        ),
        createRow(
          `Does ${name}'s current offence involve actual or attempted direct contact against a victim who was a stranger?`,
          formatChoice(session.strangerContact),
          'a3.html',
          `Does ${name}'s current offence involve actual or attempted direct contact against a victim who was a stranger?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.strangerContact
        ),
        createRow(
          `What is the date of ${name}'s most recent sanction involving a sexual or sexually motivated offence?`,
          formatDateFromParts(session.sexualSanctionDate || {}),
          'a3.html',
          `What is the date of ${name}'s most recent sanction involving a sexual or sexually motivated offence?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.sexualSanctionDate
        )
      ]
    })

    sections.push({
      title: 'Direct contact sexual or sexually motivated offending',
      rows: [
        createRow(
          `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`,
          session.contactAdultSanctions,
          'a3.html',
          `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.contactAdultSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`,
          session.contactChildSanctions,
          'a3.html',
          `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.contactChildSanctions
        )
      ]
    })

    sections.push({
      title: 'Images and indirect contact sexual or sexually motivated offending',
      rows: [
        createRow(
          `How many sanctions does ${name} have for indecent child image, or indirect contact child, sexual or sexually motivated offences?`,
          session.indirectChildSanctions,
          'a3.html',
          `How many sanctions does ${name} have for indecent child image, or indirect contact child, sexual or sexually motivated offences?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.indirectChildSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`,
          session.nonContactSanctions,
          'a3.html',
          `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.nonContactSanctions
        )
      ]
    })
  }

  sections.push({
    title: 'Community supervision',
    rows: [
      createRow(
        `What date did ${name}'s current supervision in the community begin?`,
        formatDateFromParts(session.communityDate || {}),
        'a4.html',
        `What date did ${name}'s current supervision in the community begin?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.supervisedCommunityDate
      )
    ]
  })

  const communityDateLabel = formatDateFromParts(session.communityDate || {}) || 'that date'

  if (isA5Required(session)) {
    const offencesSinceCommunityRows = [
      createRow(
        `Has ${name} committed any offences since ${communityDateLabel}?`,
        formatChoice(session.offencesSinceCommunity),
        'a5.html',
        `Has ${name} committed any offences since ${communityDateLabel}?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.offencesSinceCommunity
      )
    ]

    if (session.offencesSinceCommunity === 'yes') {
      offencesSinceCommunityRows.push(
        createRow(
          `What is the date of ${name}'s most recent offence?`,
          formatDateFromParts(session.recentOffenceDate || {}),
          'a5.html',
          `What is the date of ${name}'s most recent offence?`,
          false,
          PREDICTORS_CHANGE_ANCHORS.recentOffenceDate
        )
      )
    }

    sections.push({
      title: 'Offences since community date',
      rows: offencesSinceCommunityRows
    })
  }

  sections.push({
    title: 'Interview',
    rows: [
      createRow(
        `Have you done an interview with ${name}?`,
        formatChoice(session.interviewDone),
        'a6.html',
        `Have you done an interview with ${name}?`,
        false,
        PREDICTORS_CHANGE_ANCHORS.interviewDone
      )
    ]
  })

  if (options.includeDynamic) {
    sections.push(...buildDynamicPredictorsSummarySections(session, offenderFirstName, createDynamicRow))
  }

  return sections
}

export const renderPredictorsSummaryList = (container, session, offenderFirstName = 'Alex', options = {}) => {
  if (!container) return

  const sections = buildPredictorsSummarySections(session, offenderFirstName, options)

  if (options.includeDynamic) {
    const { staticSections, dynamicSections } = splitStaticAndDynamicSections(sections)

    container.innerHTML =
      renderSummaryGroup('Static factors', staticSections) +
      renderSummaryGroup('Dynamic factors', dynamicSections, 'predictors-summary-group--separated')

    return
  }

  container.innerHTML = renderSummarySections(sections)
}
