//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

addFilter('striptags', (value) => {
  if (!value) return ''
  return String(value).replace(/<[^>]*>/g, '')
})
