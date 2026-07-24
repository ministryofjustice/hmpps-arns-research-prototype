// Topic subnavs inside UX documentation tabs on /dev/ux-handover.html

function initTopicSubnav (subnav) {
  const panelRoot = subnav.closest('.govuk-tabs__panel')
  if (!panelRoot) return

  const links = Array.from(subnav.querySelectorAll('.moj-sub-navigation__link[data-topic]'))
  const panels = Array.from(panelRoot.querySelectorAll('[data-topic-panel]'))
  if (!links.length || !panels.length) return

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
    })
  }

  const initiallyActive =
    links.find((link) => link.getAttribute('aria-current') === 'page')?.getAttribute('data-topic') ||
    links[0].getAttribute('data-topic')

  showTopic(initiallyActive)

  subnav.addEventListener('click', (event) => {
    const link = event.target.closest('.moj-sub-navigation__link[data-topic]')
    if (!link || !subnav.contains(link)) return

    event.preventDefault()
    showTopic(link.getAttribute('data-topic'))
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
  document.querySelectorAll('[data-ux-docs-topic-subnav]').forEach(initTopicSubnav)
}
