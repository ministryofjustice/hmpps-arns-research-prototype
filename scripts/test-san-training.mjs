import assert from 'node:assert/strict'
import { access, readdir, readFile } from 'node:fs/promises'
import { test, before, after } from 'node:test'
import { chromium } from 'playwright'

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const variants = [
  { name: 'community', key: 'sanTrainingCommunityAssessment' },
  { name: 'prison', key: 'sanTrainingPrisonAssessment' }
]
const sessionKeys = ['sanAssessment', 'sanResearchAssessment', 'sanPrisonAssessment', ...variants.map(variant => variant.key)]
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

const withPage = async (run, options = {}) => {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(`${baseUrl}/san`)
    await run(page)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}
const seedSession = (page, key, session) => page.evaluate(({ key, session }) => {
  sessionStorage.setItem(key, JSON.stringify(session))
}, { key, session })
const savedSession = (page, key) => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)

const accessibilityJourneys = ['san', 'san-research', 'san-prison', ...variants.map(variant => `san-training/${variant.name}`)]
for (const journey of accessibilityJourneys) {
  test(`${journey}: Accessibility returns to the previous assessment page and tab`, async () => withPage(async page => {
    for (const file of ['accommodation?from=summary', 'health-summary.html#practitioner-analysis']) {
      await page.goto(`${baseUrl}/${journey}/${file}`)
      const previousUrl = page.url()
      await page.getByRole('link', { name: 'Accessibility statement', exact: true }).click()
      await page.waitForURL(url => url.pathname.replace(/\.html$/, '') === `/${journey}/accessibility`)
      await page.getByRole('link', { name: 'Back to Strengths and Needs', exact: true }).click()
      await page.waitForURL(previousUrl)
      if (file.includes('#practitioner-analysis')) {
        await page.locator('#practitioner-analysis').waitFor({ state: 'visible' })
      }
    }
  }))

  test(`${journey}: directly opened Accessibility falls back to its own journey`, async () => withPage(async page => {
    const directPage = await page.context().newPage()
    try {
      await directPage.goto(`${baseUrl}/${journey}/accessibility.html`)
      assert.equal(await directPage.evaluate(() => document.referrer), '')
      await directPage.getByRole('link', { name: 'Back to Strengths and Needs', exact: true }).click()
      await directPage.waitForURL(`${baseUrl}/${journey}/accommodation`)
    } finally {
      await directPage.close()
    }
  }))
}

for (const variant of variants) {
  for (const width of [1280, 390]) {
    test(`${variant.name}/${width}: shareable Training tab, refresh and isolated Start`, async () => withPage(async page => {
      const clearRequests = []
      page.on('request', request => {
        if (request.url().includes('/clear-data')) clearRequests.push(request.url())
      })
      await page.goto(`${baseUrl}/san#${variant.name}-training`)
      const topic = page.locator(`#${variant.name}-training`)
      await topic.waitFor({ state: 'visible' })
      await page.reload()
      await topic.waitFor({ state: 'visible' })
      const tabs = page.locator(`#${variant.name} [data-topic-subnav] a`)
      const expectedTabs = variant.name === 'community' ? ['Research', 'Reference', 'Training'] : ['Research', 'Training']
      assert.deepEqual(await tabs.allTextContents().then(labels => labels.map(label => label.trim())), expectedTabs)
      assert.equal(await tabs.last().getAttribute('aria-current'), 'page')
      if (width > 600) {
        assert.equal(await page.locator(`.govuk-tabs__tab[href="#${variant.name}"]`).getAttribute('aria-selected'), 'true')
      }
      const start = topic.locator('[data-clear-session-on-start]')
      const rectangle = await start.boundingBox()
      assert.ok(rectangle.y >= 0 && rectangle.y + rectangle.height <= 900)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      for (const key of sessionKeys) await seedSession(page, key, { sentinel: key })
      for (const item of variants) await seedSession(page, `draft:/san-training/${item.name}/accommodation`, { sentinel: item.name })
      await start.click()
      await page.waitForURL(url => url.pathname === `/san-training/${variant.name}/accommodation`)
      assert.equal((await savedSession(page, variant.key))?.sentinel, undefined)
      assert.equal(await savedSession(page, `draft:/san-training/${variant.name}/accommodation`), null)
      for (const key of sessionKeys.filter(key => key !== variant.key)) {
        assert.deepEqual(await savedSession(page, key), { sentinel: key })
      }
      const other = variants.find(item => item !== variant)
      assert.deepEqual(await savedSession(page, `draft:/san-training/${other.name}/accommodation`), { sentinel: other.name })
      assert.deepEqual(clearRequests, [])
    }, { viewport: { width, height: 900 } }))
  }

  test(`${variant.name}: all copied pages render with training-only journey links and the private beta banner`, async () => withPage(async page => {
    const files = (await readdir(new URL(`../app/views/san-training/${variant.name}/`, import.meta.url)))
      .filter(file => file.endsWith('.html') && file !== 'layout.html')
    for (const file of files) {
      const response = await page.request.get(`${baseUrl}/san-training/${variant.name}/${file}`)
      assert.equal(response.status(), 200, file)
      const rendered = await page.evaluate(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const banners = [...doc.querySelectorAll('.govuk-phase-banner')]
        const feedback = banners[0]?.querySelector('a')
        return {
          links: [...doc.querySelectorAll('a[href], form[action]')].map(element => element.getAttribute('href') || element.getAttribute('action')),
          bannerCount: banners.length,
          tag: banners[0]?.querySelector('.govuk-tag')?.textContent.trim(),
          text: banners[0]?.querySelector('.govuk-phase-banner__text')?.textContent.replace(/\s+/g, ' ').trim(),
          feedbackHref: feedback?.getAttribute('href'),
          feedbackInactive: feedback?.hasAttribute('data-predictors-inactive-link')
        }
      }, await response.text())
      assert.deepEqual(rendered.links.filter(href => /^\/(?:san|san-research|san-prison)\//.test(href)), [], file)
      assert.equal(rendered.bannerCount, 1, file)
      assert.equal(rendered.tag, 'Beta', file)
      assert.equal(rendered.text, 'This is a new service - your feedback (opens in new tab) will help us improve it.', file)
      assert.equal(rendered.feedbackHref, '#', file)
      assert.equal(rendered.feedbackInactive, true, file)
    }
  }))

  test(`${variant.name}: answer persistence and nine independent section links`, async () => withPage(async page => {
    await page.goto(`${baseUrl}/san-training/${variant.name}/accommodation`)
    const links = await page.locator('[data-san-section-link]').evaluateAll(links => links.map(link => link.href))
    assert.equal(links.length, 9)
    assert.ok(links.every(href => new URL(href).pathname.startsWith(`/san-training/${variant.name}/`)))
    await page.getByRole('radio', { name: 'No', exact: true }).check()
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/accommodation-details\?step=no-accommodation/)
    assert.equal((await savedSession(page, variant.key)).hasSomewhereToLive, 'no')
    await page.goto(`${baseUrl}/san-training/${variant.name}/accommodation`)
    await page.locator('input[type="radio"][value="no"]:checked').waitFor()
    for (const key of sessionKeys.filter(key => key !== variant.key)) assert.equal(await savedSession(page, key), null)
  }))

  test(`${variant.name}: victim Change restores and updates without duplicates`, async () => withPage(async page => {
    const victims = [
      { relationship: 'staff', relationshipDetails: '', age: '26-49', sex: 'female', ethnicity: 'white-british' },
      { relationship: 'other', relationshipDetails: 'Neighbour', age: '50-64', sex: 'male', ethnicity: 'white-other' }
    ]
    await seedSession(page, variant.key, { offenceCommittedAgainst: ['people'], offenceVictims: victims })
    await page.goto(`${baseUrl}/san-training/${variant.name}/offence-analysis-victim-details?from=summary`)
    await page.getByRole('link', { name: /^Change/ }).nth(1).click()
    await page.waitForURL(url => url.pathname.replace(/\.html$/, '') === `/san-training/${variant.name}/offence-analysis-victim`)
    assert.equal(new URL(page.url()).searchParams.get('victim'), '1')
    assert.equal(new URL(page.url()).searchParams.get('from'), 'summary')
    await page.locator('#relationship-other:checked').waitFor()
    assert.equal(await page.locator('#relationship-other-details').inputValue(), 'Neighbour')
    await page.locator('#victim-age-65-over').check()
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/offence-analysis-summary(?:\.html)?$/)
    assert.deepEqual((await savedSession(page, variant.key)).offenceVictims, [victims[0], { ...victims[1], age: '65-over' }])
  }))
}

test('nested tab Back/Forward, keyboard navigation and resizing preserve selection', async () => withPage(async page => {
  await page.goto(`${baseUrl}/san#prison-training`)
  await page.locator('#prison-training').waitFor({ state: 'visible' })
  await page.locator('[data-topic="prison-research"]').click()
  assert.equal(new URL(page.url()).hash, '#prison-research')
  await page.goBack()
  await page.locator('#prison-training').waitFor({ state: 'visible' })
  await page.goForward()
  await page.locator('#prison-research').waitFor({ state: 'visible' })
  await page.locator('[data-topic="prison-training"]').click()
  await page.getByRole('tab', { name: 'Prison', exact: true }).focus()
  await page.keyboard.press('ArrowLeft')
  assert.equal(await page.getByRole('tab', { name: 'Community', exact: true }).getAttribute('aria-selected'), 'true')
  await page.keyboard.press('ArrowRight')
  await page.locator('#prison-training').waitFor({ state: 'visible' })
  await page.goto(`${baseUrl}/san#prison-training`)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.locator('#prison-training').waitFor({ state: 'visible' })
}))

const analysisSections = [
  ['accommodation', 'accommodation', 'accommodationComplete'],
  ['employment', 'employment', 'employmentComplete'],
  ['finances', 'finances', 'financeComplete'],
  ['drugs', 'drugs', 'drugComplete'],
  ['alcohol', 'alcohol', 'alcoholComplete'],
  ['health', 'health', 'healthComplete'],
  ['relationships', 'personal-relationships', 'relationshipsComplete'],
  ['thinking', 'thinking-behaviours', 'thinkingComplete']
]
for (const [section, file, completeKey] of analysisSections) {
  test(`Prison training ${section}: completion updates immediately and survives refresh`, async () => withPage(async page => {
    await page.goto(`${baseUrl}/san-training/prison/${file}-summary.html#practitioner-analysis`)
    for (const question of ['strengths', 'harm', 'reoffending']) await page.locator(`label[for="analysis-${question}-no"]`).click()
    await page.getByRole('button', { name: 'Mark as complete', exact: true }).click()
    for (const refresh of [false, true]) {
      if (refresh) await page.reload()
      await page.locator('[data-san-status]').filter({ hasText: /^Complete$/ }).waitFor()
      assert.equal(await page.locator(`[data-section-complete="${section}"]`).isVisible(), true)
      assert.equal(await page.locator('#practitioner-analysis .govuk-summary-list__row').count(), 3)
      assert.equal((await savedSession(page, 'sanTrainingPrisonAssessment'))[completeKey], true)
    }
  }))
}

test('Research/Reference entry links and the other topic-subnav consumer remain unchanged', async () => withPage(async page => {
  for (const [topic, version, href] of [
    ['community-research', 'san-research', '/san-research/accommodation.html'],
    ['community-reference', 'san', '/san/accommodation.html'],
    ['prison-research', 'san-prison', '/san-prison/accommodation.html']
  ]) {
    await page.goto(`${baseUrl}/san#${topic}`)
    const start = page.locator(`#${topic} [data-clear-session-on-start]`)
    await start.waitFor({ state: 'visible' })
    assert.equal(await start.getAttribute('href'), href)
    assert.equal(await start.getAttribute('data-prototype-version'), version)
  }
  await page.goto(`${baseUrl}/dev/ux-handover`)
  assert.equal(await page.locator('[data-topic-deep-links]').count(), 0)
}))

test('training storyboards have local images and training-only prototype links', async () => withPage(async page => {
  const root = new URL('../storyboards/san-training/', import.meta.url)
  for (const file of ['index.html', 'community/overview.html', 'community/index.html', 'community/accommodation/index.html', 'prison/index.html']) {
    const url = new URL(file, root)
    const content = await readFile(url, 'utf8')
    const assets = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      return [...doc.querySelectorAll('img[src]')].map(image => image.getAttribute('src'))
    }, content)
    assert.ok(assets.length > 0, file)
    for (const asset of assets) await access(new URL(asset, url))
    assert.doesNotMatch(content, /href=["'][^"']*\/(?:san-research|san-prison)\//)
  }
  for (const file of ['community/overview.html', 'prison/index.html']) {
    await page.goto(new URL(file, root).href)
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager' }))
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))
    assert.equal(await page.locator('img').count(), 9)
  }
}))