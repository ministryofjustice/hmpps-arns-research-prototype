//
// Build GOV.UK summary list rows from Tiering session data (grouped by page)
//

import { TIERING_CHANGE_ANCHORS, tieringChangeHref } from './tiering-change-scroll.js'
import { formatDateFromParts, getOffenderDateOfBirthParts } from './tiering-assessment-session.js'
import { calculateAgeOnDate, isA5Required, isValidDateParts } from './tiering-journey.js'
import { formatOffenceCodeLabel } from './tiering-offence-browse.js'

const NOT_PROVIDED_HTML =
  '<span class="tiering-summary-list__not-provided">Not provided</span>'

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

const renderSummaryRows = (rows) =>
  rows
    .map(
      ({ key, value, changeHref, changeHidden }) => `
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">${escapeHtml(key)}</dt>
    <dd class="govuk-summary-list__value">${value}</dd>
    <dd class="govuk-summary-list__actions">
      <a class="govuk-link" href="${changeHref}">Change<span class="govuk-visually-hidden"> ${escapeHtml(changeHidden)}</span></a>
    </dd>
  </div>`
    )
    .join('')

export const buildTieringSummarySections = (session, offenderFirstName = 'Alex') => {
  const name = offenderFirstName
  const sections = []

  const createRow = (key, value, changeHref, changeHidden, allowHtml = false, changeAnchor) => {
    let display = NOT_PROVIDED_HTML

    if (value) {
      display = allowHtml ? value : escapeHtml(value)
    }

    return {
      key,
      value: display,
      changeHref: tieringChangeHref(changeHref, changeAnchor),
      changeHidden: changeHidden || key
    }
  }

  const a1Rows = []

  if (session.currentOffence?.label) {
    const codeLabel = formatOffenceCodeLabel(session.currentOffence)
    const offenceValue = codeLabel
      ? `${escapeHtml(session.currentOffence.label)}<br>${escapeHtml(codeLabel)}`
      : escapeHtml(session.currentOffence.label)
    a1Rows.push(
      createRow(
        `What is ${name}'s current offence?`,
        offenceValue,
        'a1.html',
        `What is ${name}'s current offence?`,
        true,
        TIERING_CHANGE_ANCHORS.currentOffence
      )
    )
  } else {
    a1Rows.push(
      createRow(
        `What is ${name}'s current offence?`,
        null,
        'a1.html',
        `What is ${name}'s current offence?`,
        false,
        TIERING_CHANGE_ANCHORS.currentOffence
      )
    )
  }

  a1Rows.push(
    createRow(
      `What is the date of ${name}'s current conviction?`,
      formatDateFromParts(session.convictionDate || {}),
      'a1.html',
      `What is the date of ${name}'s current conviction?`,
      false,
      TIERING_CHANGE_ANCHORS.convictionDate
    )
  )

  sections.push({ title: 'Current offence', rows: a1Rows })

  sections.push({
    title: 'Offending history',
    rows: [
      createRow(
        `What was ${name}'s date of first sanction?`,
        formatFirstSanctionAnswer(session),
        'a2.html',
        `What was the date of ${name}'s first sanction?`,
        false,
        TIERING_CHANGE_ANCHORS.firstSanctionAge
      ),
      createRow(
        `How many sanctions does ${name} have in total for all offences?`,
        session.totalSanctions,
        'a2.html',
        `How many sanctions does ${name} have in total for all offences?`,
        false,
        TIERING_CHANGE_ANCHORS.totalSanctions
      ),
      createRow(
        `How many of ${name}'s total sanctions involved violent offences?`,
        session.violentSanctions,
        'a2.html',
        `How many of ${name}'s total sanctions involved violent offences?`,
        false,
        TIERING_CHANGE_ANCHORS.violentSanctions
      ),
      createRow(
        `Has ${name} ever committed a sexual or sexually motivated offence?`,
        formatChoice(session.sexualOffence),
        'a2.html',
        `Has ${name} ever committed a sexual or sexually motivated offence?`,
        false,
        TIERING_CHANGE_ANCHORS.sexualOffence
      )
    ]
  })

  if (session.sexualOffence === 'yes') {
    sections.push({
      title: 'Sexual or sexually motivated offending',
      rows: [
        createRow(
          `Does ${name}'s current offence have a sexual motivation?`,
          formatChoice(session.sexualMotivation),
          'a3.html',
          `Does ${name}'s current offence have a sexual motivation?`,
          false,
          TIERING_CHANGE_ANCHORS.sexualMotivation
        ),
        createRow(
          `Does ${name}'s current offence involve actual or attempted direct contact against a victim who was a stranger?`,
          formatChoice(session.strangerContact),
          'a3.html',
          `Does ${name}'s current offence involve actual or attempted direct contact against a victim who was a stranger?`,
          false,
          TIERING_CHANGE_ANCHORS.strangerContact
        ),
        createRow(
          `What is the date of ${name}'s most recent sanction involving a sexual or sexually motivated offence?`,
          formatDateFromParts(session.sexualSanctionDate || {}),
          'a3.html',
          `What is the date of ${name}'s most recent sanction involving a sexual or sexually motivated offence?`,
          false,
          TIERING_CHANGE_ANCHORS.sexualSanctionDate
        )
      ]
    })

    sections.push({
      title: 'Direct contact sexual or sexually motivated offending',
      rows: [
        createRow(
          `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`,
          session.contactAdultSanctions,
          'a3dc.html',
          `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.contactAdultSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`,
          session.contactChildSanctions,
          'a3dc.html',
          `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.contactChildSanctions
        )
      ]
    })

    sections.push({
      title: 'Indirect contact sexual or sexually motivated offending',
      rows: [
        createRow(
          `How many sanctions does ${name} have for indecent child image or indirect contact child sexual or sexually motivated offences?`,
          session.indirectChildSanctions,
          'a3ic.html',
          `How many sanctions does ${name} have for indecent child image or indirect contact child sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.indirectChildSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`,
          session.nonContactSanctions,
          'a3ic.html',
          `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.nonContactSanctions
        )
      ]
    })
  }

  const communitySupervisionRows = [
    createRow(
      `Is ${name} currently being supervised in the community?`,
      formatChoice(session.supervisedInCommunity),
      'a4.html',
      `Is ${name} currently being supervised in the community?`,
      false,
      TIERING_CHANGE_ANCHORS.supervisedInCommunity
    )
  ]

  if (session.supervisedInCommunity === 'yes' || session.supervisedInCommunity === 'no') {
    communitySupervisionRows.push(
      createRow(
        session.supervisedInCommunity === 'yes'
          ? `What date did ${name}'s supervision begin?`
          : `What is the earliest date ${name} could be in the community once they've received their sentence?`,
        formatDateFromParts(session.communityDate || {}),
        'a4.html',
        session.supervisedInCommunity === 'yes'
          ? `What date did ${name}'s supervision begin?`
          : `What is the earliest date ${name} could be in the community once they've received their sentence?`,
        false,
        session.supervisedInCommunity === 'yes'
          ? TIERING_CHANGE_ANCHORS.supervisedCommunityDate
          : TIERING_CHANGE_ANCHORS.communityDate
      )
    )
  }

  sections.push({
    title: 'Community supervision',
    rows: communitySupervisionRows
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
        TIERING_CHANGE_ANCHORS.offencesSinceCommunity
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
          TIERING_CHANGE_ANCHORS.recentOffenceDate
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
        TIERING_CHANGE_ANCHORS.interviewDone
      )
    ]
  })

  return sections
}

export const renderTieringSummaryList = (container, session, offenderFirstName = 'Alex') => {
  if (!container) return

  const sections = buildTieringSummarySections(session, offenderFirstName)
  container.innerHTML = sections
    .map(
      ({ title, rows }) => `
  <section class="tiering-summary-section govuk-!-margin-bottom-6">
    <h2 class="govuk-heading-m govuk-!-margin-bottom-3">${escapeHtml(title)}</h2>
    <dl class="govuk-summary-list govuk-!-margin-bottom-0">${renderSummaryRows(rows)}</dl>
  </section>`
    )
    .join('')
}
