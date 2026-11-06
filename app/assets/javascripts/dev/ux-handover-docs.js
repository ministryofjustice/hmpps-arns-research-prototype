// Topic subnavs inside a tab panel. Used on /dev/ux-handover.html and /san.

function initTopicSubnav (subnav) {
  const panelRoot = subnav.closest('.govuk-tabs__panel')
  if (!panelRoot) return

  const links = Array.from(subnav.querySelectorAll('.moj-sub-navigation__link[data-topic]'))
  const panels = Array.from(panelRoot.querySelectorAll('[data-topic-panel]'))
  if (!links.length || !panels.length) return
  const deepLinks = subnav.hasAttribute('data-topic-deep-links')

  const showTopic = (topicId) => {
    if (!topicId) return

    links.forEach((link) => {
      const isActive = link.getAttribute('data-topic') === topicId
      if (isActive) {
        link.setAttribute('aria-current', 'page')
      } else {
        link.removeAttribute('aria-current')
      }
    })

    panels.forEach((panel) => {
      const isActive = panel.getAttribute('data-topic-panel') === topicId
      panel.hidden = !isActive
      panel.classList.toggle('ux-docs-topic-block--hidden', !isActive)
      panel.classList.toggle('assessment-home-topic--hidden', !isActive)
    })
  }

  const initiallyActive =
    links.find((link) => link.getAttribute('aria-current') === 'page')?.getAttribute('data-topic') ||
    links[0].getAttribute('data-topic')

  showTopic(initiallyActive)

  const showTopicFromHash = () => {
    const topicId = window.location.hash.slice(1)
    if (!links.some((link) => link.getAttribute('data-topic') === topicId)) return

    showTopic(topicId)
    const tabsRoot = panelRoot.closest('[data-module="govuk-tabs"]')
    const parentTab = tabsRoot?.querySelector(`.govuk-tabs__tab[href="#${panelRoot.id}"]`)
    if (parentTab?.getAttribute('role') === 'tab') {
      tabsRoot.querySelectorAll('.govuk-tabs__tab').forEach((tab) => {
        const selected = tab === parentTab
        tab.setAttribute('aria-selected', String(selected))
        tab.setAttribute('tabindex', selected ? '0' : '-1')
        tab.parentElement.classList.toggle('govuk-tabs__list-item--selected', selected)
        document.getElementById(tab.hash.slice(1))?.classList.toggle('govuk-tabs__panel--hidden', !selected)
      })
    } else {
      panelRoot.scrollIntoView({ block: 'start' })
    }
  }

  if (deepLinks) {
    showTopicFromHash()
    window.addEventListener('hashchange', showTopicFromHash)
    window.addEventListener('resize', () => window.requestAnimationFrame(showTopicFromHash))
  }

  subnav.addEventListener('click', (event) => {
    const link = event.target.closest('.moj-sub-navigation__link[data-topic]')
    if (!link || !subnav.contains(link)) return

    event.preventDefault()
    showTopic(link.getAttribute('data-topic'))
    if (deepLinks && window.location.hash !== link.hash) {
      window.history.pushState(null, '', link.hash)
    }
  })

  // Optional: click a stats topic / churn / impact card to open that inventory section
  panelRoot.querySelectorAll(
    '.ux-docs-stats__topic[data-topic], .ux-docs-stats__churn-item[data-topic], .ux-docs-stats__impact-item[data-topic]'
  ).forEach((item) => {
    item.setAttribute('role', 'button')
    item.setAttribute('tabindex', '0')
    if (item.classList.contains('ux-docs-stats__topic')) {
      item.classList.add('ux-docs-stats__topic--link')
    } else if (item.classList.contains('ux-docs-stats__churn-item')) {
      item.classList.add('ux-docs-stats__churn-item--link')
    } else {
      item.classList.add('ux-docs-stats__impact-item--link')
    }

    const activate = () => {
      showTopic(item.getAttribute('data-topic'))
      const activePanel = panelRoot.querySelector(`[data-topic-panel="${item.getAttribute('data-topic')}"]`)
      activePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    item.addEventListener('click', activate)
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        activate()
      }
    })
  })
}

export function initUxHandoverTopicSubnav () {
  document.querySelectorAll('[data-ux-docs-topic-subnav], [data-topic-subnav]').forEach(initTopicSubnav)
}
