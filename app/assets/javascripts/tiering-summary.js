//
// Build GOV.UK summary list rows from Tiering session data (grouped by page)
//

import { TIERING_CHANGE_ANCHORS, tieringChangeHref } from './tiering-change-scroll.js'
import { formatDateFromParts } from './tiering-assessment-session.js'

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
    const offenceValue = session.currentOffence.code
      ? `${escapeHtml(session.currentOffence.label)}<br>Offence code: ${escapeHtml(session.currentOffence.code)}`
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
        `How old was ${name} when they received their first sanction?`,
        session.firstSanctionAge,
        'a2.html',
        `How old was ${name} when they received their first sanction?`,
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
      title: 'Sexual offending',
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
        ),
        createRow(
          `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`,
          session.contactAdultSanctions,
          'a3.html',
          `How many sanctions does ${name} have for contact adult sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.contactAdultSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`,
          session.contactChildSanctions,
          'a3.html',
          `How many sanctions does ${name} have for direct contact child sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.contactChildSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for indecent child image or indirect contact child sexual or sexually motivated offences?`,
          session.indirectChildSanctions,
          'a3.html',
          `How many sanctions does ${name} have for indecent child image or indirect contact child sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.indirectChildSanctions
        ),
        createRow(
          `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`,
          session.nonContactSanctions,
          'a3.html',
          `How many sanctions does ${name} have for other non-contact sexual or sexually motivated offences?`,
          false,
          TIERING_CHANGE_ANCHORS.nonContactSanctions
        )
      ]
    })
  }

  sections.push({
    title: 'Community date',
    rows: [
      createRow(
        `What is the earliest date ${name} could next be in the community once they've received their sentence?`,
        formatDateFromParts(session.communityDate || {}),
        'a4.html',
        `What is the earliest date ${name} could next be in the community once they've received their sentence?`,
        false,
        TIERING_CHANGE_ANCHORS.communityDate
      )
    ]
  })

  const communityDateLabel = formatDateFromParts(session.communityDate || {}) || 'that date'
  sections.push({
    title: 'Offences since community date',
    rows: [
      createRow(
        `Since ${communityDateLabel}, has ${name} committed any offences?`,
        formatChoice(session.offencesSinceCommunity),
        'a5.html',
        `Since ${communityDateLabel}, has ${name} committed any offences?`,
        false,
        TIERING_CHANGE_ANCHORS.offencesSinceCommunity
      )
    ]
  })

  if (session.offencesSinceCommunity === 'yes') {
    sections.push({
      title: 'Most recent offence date',
      rows: [
        createRow(
          `What is the date of ${name}'s most recent offence?`,
          formatDateFromParts(session.recentOffenceDate || {}),
          'a6.html',
          `What is the date of ${name}'s most recent offence?`,
          false,
          TIERING_CHANGE_ANCHORS.recentOffenceDate
        )
      ]
    })
  }

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
