//
// Shared “Filter by” category dropdown for offence browse pages (a1o, a1o3)
//

import { OFFENCE_BROWSE_SORT_CATEGORIES } from '../offences-data.js'
import { escapeOffenceHtml } from './predictors-offence-browse.js'

const OFFENCE_SORT_SELECT_MIN_WIDTH_PX = 200
const OFFENCE_SORT_SELECT_CHEVRON_PADDING_PX = 44
const OFFENCE_SORT_MOBILE_MEDIA = '(max-width: 40.0625em)'

let offenceSortSelectMeasurer = null

const getOffenceSortSelectMeasurer = () => {
  if (offenceSortSelectMeasurer) return offenceSortSelectMeasurer

  offenceSortSelectMeasurer = document.createElement('span')
  offenceSortSelectMeasurer.className = 'offence-browse-heading__sort-measure'
  offenceSortSelectMeasurer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(offenceSortSelectMeasurer)
  return offenceSortSelectMeasurer
}

export const resizeOffenceSortSelect = (select) => {
  if (!select) return

  if (select.closest('.offence-a1o3-category-select')) {
    select.style.width = ''
    return
  }

  if (window.matchMedia(OFFENCE_SORT_MOBILE_MEDIA).matches) {
    select.style.width = ''
    return
  }

  const measurer = getOffenceSortSelectMeasurer()
  const option = select.options[select.selectedIndex]
  const text = option?.text?.trim() || 'Select a category'
  const selectStyles = getComputedStyle(select)

  measurer.style.font = selectStyles.font
  measurer.style.letterSpacing = selectStyles.letterSpacing
  measurer.textContent = text

  const textWidth = measurer.getBoundingClientRect().width
  const width = Math.ceil(textWidth) + OFFENCE_SORT_SELECT_CHEVRON_PADDING_PX

  select.style.width = `${Math.max(width, OFFENCE_SORT_SELECT_MIN_WIDTH_PX)}px`
}

export const populateOffenceSortOptions = (select) => {
  if (!select || select.dataset.sortOptionsReady === 'true') return

  const options = OFFENCE_BROWSE_SORT_CATEGORIES.map(
    (category) =>
      `<option value="${escapeOffenceHtml(category)}">${escapeOffenceHtml(category)}</option>`
  ).join('')

  select.insertAdjacentHTML('beforeend', options)
  select.dataset.sortOptionsReady = 'true'
  resizeOffenceSortSelect(select)
}

export const initOffenceSortSelectResize = (select) => {
  if (!select) return

  window.matchMedia(OFFENCE_SORT_MOBILE_MEDIA).addEventListener('change', () => {
    resizeOffenceSortSelect(select)
  })
}
