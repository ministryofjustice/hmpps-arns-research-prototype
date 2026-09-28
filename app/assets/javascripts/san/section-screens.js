//
// Remember the last screen in each Strengths and needs section
// so side navigation returns there.
//

import { rememberSectionScreen, sectionLinkHref } from './session.js'

const activeSection = () => {
  const link = document.querySelector('[data-san-section-link][aria-current="location"]')
  return link ? link.getAttribute('data-san-section-link') : ''
}

const screenFromLocation = () => {
  const url = new URL(window.location.href)
  const file = url.pathname.split('/').pop()
  if (!file) return ''
  const params = new URLSearchParams(url.search)
  params.delete('example')
  const search = params.toString()
  return `${file}${search ? `?${search}` : ''}${url.hash}`
}

const rememberCurrentScreen = () => {
  const section = activeSection()
  if (!section) return
  rememberSectionScreen(section, screenFromLocation())
  const link = document.querySelector(`[data-san-section-link="${section}"]`)
  const href = sectionLinkHref(section, '')
  if (link && href) link.setAttribute('href', href)
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!document.querySelector('[data-san-section-link]')) return
  rememberCurrentScreen()
  window.addEventListener('hashchange', rememberCurrentScreen)
  document.addEventListener('click', (event) => {
    if (event.target.closest('.govuk-tabs__tab')) window.setTimeout(rememberCurrentScreen, 0)
  })
})
