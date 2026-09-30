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
  if (!link || link.hasAttribute('data-san-nav-disabled')) return
  const href = sectionLinkHref(section, '')
  if (href) link.setAttribute('href', href)
}

const lockDisabledNavLinks = () => {
  document.querySelectorAll('[data-san-nav-disabled]').forEach((link) => {
    const lock = () => {
      if (link.hasAttribute('href')) link.removeAttribute('href')
    }

    lock()
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })

    const observer = new MutationObserver(lock)
    observer.observe(link, { attributes: true, attributeFilter: ['href'] })
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  if (!window.location.pathname.startsWith("/san-research/")) return
  if (!document.querySelector('[data-san-section-link]')) return
  lockDisabledNavLinks()
  rememberCurrentScreen()
  window.addEventListener('hashchange', rememberCurrentScreen)
  document.addEventListener('click', (event) => {
    if (event.target.closest('.govuk-tabs__tab')) window.setTimeout(rememberCurrentScreen, 0)
  })
})
