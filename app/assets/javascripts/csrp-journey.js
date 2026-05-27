//
// CSRP journey routing and field helpers (branching, completeness)
//

export const normaliseString = (value) => (value == null ? '' : String(value).trim())

export const normaliseDateParts = (date = {}) => ({
  day: normaliseString(date.day),
  month: normaliseString(date.month),
  year: normaliseString(date.year)
})

export const normaliseOffence = (offence) => {
  if (!offence?.id) return null

  return {
    id: normaliseString(offence.id),
    label: normaliseString(offence.label),
    code: normaliseString(offence.code)
  }
}

export const normaliseFields = (fields) => JSON.parse(JSON.stringify(fields))

export const fieldsChanged = (previousFields, newFields) =>
  JSON.stringify(normaliseFields(previousFields)) !== JSON.stringify(normaliseFields(newFields))

export const isDateComplete = (date) => {
  const parts = normaliseDateParts(date)
  return Boolean(parts.day && parts.month && parts.year)
}

export const clearA3SessionFields = () => ({
  sexualMotivation: '',
  strangerContact: '',
  sexualSanctionDate: { day: '', month: '', year: '' },
  contactAdultSanctions: '',
  contactChildSanctions: '',
  indirectChildSanctions: '',
  nonContactSanctions: ''
})

export const clearA6SessionFields = () => ({
  recentOffenceDate: { day: '', month: '', year: '' }
})

export const isA3Complete = (session) => {
  if (session.sexualOffence !== 'yes') return true

  return (
    Boolean(session.sexualMotivation) &&
    Boolean(session.strangerContact) &&
    isDateComplete(session.sexualSanctionDate) &&
    normaliseString(session.contactAdultSanctions) !== '' &&
    normaliseString(session.contactChildSanctions) !== '' &&
    normaliseString(session.indirectChildSanctions) !== '' &&
    normaliseString(session.nonContactSanctions) !== ''
  )
}

export const isA2Complete = (session) =>
  Boolean(
    normaliseString(session.firstSanctionAge) &&
      normaliseString(session.totalSanctions) &&
      normaliseString(session.violentSanctions) &&
      session.sexualOffence
  )

export const getFirstIncompleteCsrpPage = (session) => {
  if (!session.currentOffence?.id) return 'a1.html'
  if (!isA2Complete(session)) return 'a2.html'
  if (!isA3Complete(session)) return 'a3.html'
  if (!isDateComplete(session.communityDate)) return 'a4.html'
  if (!session.offencesSinceCommunity) return 'a5.html'
  if (session.offencesSinceCommunity === 'yes' && !isDateComplete(session.recentOffenceDate)) {
    return 'a6.html'
  }
  return null
}

export const applyBranchingCleanup = (currentPage, session, updates) => {
  const merged = { ...session, ...updates }

  if (currentPage === 'a2' && merged.sexualOffence !== 'yes') {
    return { ...merged, ...clearA3SessionFields() }
  }

  if (currentPage === 'a5' && merged.offencesSinceCommunity !== 'yes') {
    return { ...merged, ...clearA6SessionFields() }
  }

  return merged
}

export const getPostCheckAnswersEditHref = (session) => getFirstIncompleteCsrpPage(session) || 'a7.html'

export const getA1FieldsFromForm = (form) => {
  const offenceId = form.querySelector('[data-offence-selected-id]')?.value
  const offenceLabel = form.querySelector('[data-offence-selected-label]')?.textContent?.trim()
  const offenceCode = form.querySelector('[data-offence-selected-meta]')?.textContent?.trim() || ''

  return {
    currentOffence: normaliseOffence(
      offenceId
        ? {
            id: offenceId,
            label: offenceLabel,
            code: offenceCode.replace(/^Offence code:\s*/i, '')
          }
        : null
    ),
    convictionDate: normaliseDateParts({
      day: form.querySelector('#current-conviction-date-day')?.value,
      month: form.querySelector('#current-conviction-date-month')?.value,
      year: form.querySelector('#current-conviction-date-year')?.value
    })
  }
}

export const getA2FieldsFromForm = (form) => ({
  firstSanctionAge: normaliseString(form.querySelector('#first-sanction-age')?.value),
  totalSanctions: normaliseString(form.querySelector('#total-sanctions')?.value),
  violentSanctions: normaliseString(form.querySelector('#violent-sanctions-other')?.value),
  sexualOffence: form.querySelector('input[name="sexual_offence"]:checked')?.value || ''
})

export const getA3FieldsFromForm = (form) => ({
  sexualMotivation: form.querySelector('input[name="sexual_motivation"]:checked')?.value || '',
  strangerContact: form.querySelector('input[name="stranger_contact"]:checked')?.value || '',
  sexualSanctionDate: normaliseDateParts({
    day: form.querySelector('#sexual-sanction-date-day')?.value,
    month: form.querySelector('#sexual-sanction-date-month')?.value,
    year: form.querySelector('#sexual-sanction-date-year')?.value
  }),
  contactAdultSanctions: normaliseString(form.querySelector('#contact-adult-sanctions')?.value),
  contactChildSanctions: normaliseString(form.querySelector('#contact-child-sanctions')?.value),
  indirectChildSanctions: normaliseString(form.querySelector('#indirect-child-sanctions')?.value),
  nonContactSanctions: normaliseString(form.querySelector('#non-contact-sanctions')?.value)
})

export const getA4FieldsFromForm = (form) => ({
  communityDate: normaliseDateParts({
    day: form.querySelector('#community-date-day')?.value,
    month: form.querySelector('#community-date-month')?.value,
    year: form.querySelector('#community-date-year')?.value
  })
})

export const getA5FieldsFromForm = (form) => ({
  offencesSinceCommunity: form.querySelector('input[name="offences_since_community"]:checked')?.value || ''
})

export const getA6FieldsFromForm = (form) => ({
  recentOffenceDate: normaliseDateParts({
    day: form.querySelector('#recent-offence-date-day')?.value,
    month: form.querySelector('#recent-offence-date-month')?.value,
    year: form.querySelector('#recent-offence-date-year')?.value
  })
})
