import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const variants = [
  { name: 'community', key: 'sanTrainingCommunityAssessment' },
  { name: 'prison', key: 'sanTrainingPrisonAssessment' }
]
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

const withPage = async (run) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
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
const seed = (page, key, data) => page.evaluate(({ key, data }) => {
  sessionStorage.setItem(key, JSON.stringify(data))
}, { key, data })
const saved = (page, key) => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)
const focusedId = page => page.evaluate(() => document.activeElement.id)

for (const variant of variants) {
  const prefix = `${baseUrl}/san-training/${variant.name}`

  test(`${variant.name}: labelled children fields, hints and conditional keyboard access`, async () => withPage(async page => {
    await page.goto(`${prefix}/personal-relationships-children`)
    const checkbox = page.getByRole('checkbox', { name: 'Yes, children that live with them', exact: true })
    const field = page.getByRole('textbox', { name: 'Details of children living with Alex', exact: true })
    assert.equal(await field.count(), 0)
    await checkbox.focus()
    await page.keyboard.press('Space')
    await field.waitFor()
    assert.equal(await checkbox.getAttribute('aria-expanded'), 'true')
    assert.equal(await field.getAttribute('aria-describedby'), 'relationships-children-details-hint relationships-children-details-info')
    await page.keyboard.press('Tab')
    assert.equal(await focusedId(page), 'relationships-children-details')
    await checkbox.uncheck()
    assert.equal(await field.count(), 0)
    assert.equal(await page.locator('#children-no').getAttribute('aria-describedby'), 'children-no-hint')
    if (variant.name === 'prison') {
      await seed(page, variant.key, { relationshipsChildren: ['lived-with'] })
      await page.goto(`${prefix}/personal-relationships-child-details`)
      assert.equal(await page.getByRole('textbox', { name: 'How are the children identified affected by Alex’s sentence?', exact: true }).count(), 1)
    }
  }))

  test(`${variant.name}: native GOV.UK counts announce limits and block overlong answers without truncation`, async () => withPage(async page => {
    await page.goto(`${prefix}/personal-relationships-children`)
    await page.locator('#children-lived-with').check()
    const field = page.locator('#relationships-children-details')
    const root = page.locator('[data-san-error-group="character-count-relationships-children-details"]')
    const status = root.locator('.govuk-character-count__status')
    const live = root.locator('.govuk-character-count__sr-status')
    assert.equal(await field.getAttribute('maxlength'), null)
    assert.equal(await root.getAttribute('data-govuk-character-count-init'), '')
    assert.equal(await live.getAttribute('aria-live'), 'polite')
    assert.equal(await status.getAttribute('aria-hidden'), 'true')
    assert.equal(await page.locator('#relationships-children-details-info').textContent(), 'You can enter up to 400 characters')
    assert.equal(await status.textContent(), 'You have 400 characters remaining')

    for (const [length, message] of [
      [399, 'You have 1 character remaining'],
      [400, 'You have 0 characters remaining'],
      [401, 'You have 1 character too many']
    ]) {
      await field.fill('x'.repeat(length))
      assert.equal((await field.inputValue()).length, length)
      assert.equal(await status.textContent(), message)
      await page.waitForFunction(({ id, message }) => document.getElementById(id).parentElement.querySelector('[aria-live]').textContent === message, { id: 'relationships-children-details', message })
    }
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    assert.ok(page.url().endsWith('/personal-relationships-children'))
    assert.equal(await page.locator('.govuk-error-summary:focus').count(), 1)
    assert.equal((await saved(page, variant.key)).relationshipsChildrenDetails, undefined)
    const errorLink = page.locator('.govuk-error-summary a')
    assert.equal(await errorLink.textContent(), 'Details of children living with Alex must be 400 characters or fewer')
    await errorLink.click()
    assert.equal(await focusedId(page), 'relationships-children-details')
    assert.match(await field.getAttribute('aria-describedby'), /san-error-character-count-relationships-children-details-0/)
    assert.equal(await status.textContent(), 'You have 1 character too many')
    assert.equal(await live.count(), 1)

    await field.fill('x'.repeat(400))
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/personal-relationships-child-details(?:\.html)?$/)
    assert.equal((await saved(page, variant.key)).relationshipsChildrenDetails.length, 400)
    await page.goto(`${prefix}/personal-relationships-children`)
    assert.equal(await field.inputValue(), 'x'.repeat(400))
    assert.equal(await status.textContent(), 'You have 0 characters remaining')
    assert.equal(await live.count(), 1)

    await field.fill('x'.repeat(401))
    await page.locator('#children-no').check()
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/personal-relationships-questions(?:\.html)?$/)
    assert.deepEqual((await saved(page, variant.key)).relationshipsChildren, ['no'])
  }))

  test(`${variant.name}: 2000-character limits and other validation errors preserve the counter`, async () => withPage(async page => {
    await page.goto(`${prefix}/offence-analysis`)
    const field = page.locator('#offence-description')
    const root = page.locator('[data-san-error-group="character-count-offence-description"]')
    await field.fill('x'.repeat(2001))
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    assert.match(await page.locator('.govuk-error-summary').innerText(), /2,000 characters or fewer/)
    assert.equal((await field.inputValue()).length, 2001)
    await field.fill('x'.repeat(2000))
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    assert.doesNotMatch(await page.locator('.govuk-error-summary').innerText(), /characters or fewer/)
    assert.equal(await root.locator('.govuk-character-count__status').textContent(), 'You have 0 characters remaining')
    assert.equal(await root.locator('[aria-live="polite"]').count(), 1)
    assert.doesNotMatch(await field.getAttribute('aria-describedby'), /san-error-character-count/)
  }))

  test(`${variant.name}: short conditional limits are retained`, async () => withPage(async page => {
    await page.goto(`${prefix}/offence-analysis`)
    await page.locator('#motivation-other').check()
    const field = page.locator('#motivation-other-details')
    const status = field.locator('..').locator('.govuk-character-count__status')
    await field.fill('x'.repeat(128))
    assert.equal(await status.textContent(), 'You have 0 characters remaining')
    await field.press('End')
    await page.keyboard.type('x')
    assert.equal((await field.inputValue()).length, 129)
    assert.equal(await status.textContent(), 'You have 1 character too many')
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    assert.match(await page.locator('.govuk-error-summary').innerText(), /128 characters or fewer/)
  }))

  test(`${variant.name}: conditional radios keep GOV.UK ARIA and keyboard behaviour`, async () => withPage(async page => {
    await page.goto(`${prefix}/health`)
    const yes = page.locator('#physical-yes')
    const details = page.locator('#physical-yes-details')
    assert.equal(await yes.getAttribute('aria-controls'), 'conditional-physical-yes')
    assert.equal(await yes.getAttribute('aria-expanded'), 'false')
    await yes.focus()
    await page.keyboard.press('Space')
    assert.equal(await yes.getAttribute('aria-expanded'), 'true')
    await page.keyboard.press('Tab')
    assert.equal(await focusedId(page), 'physical-yes-details')
    assert.equal(await details.isVisible(), true)
    assert.match(await page.locator('#conditional-physical-yes').ariaSnapshot(), /textbox "Give details \(optional\)"/)
    await yes.focus()
    await page.keyboard.press('ArrowDown')
    assert.equal(await page.locator('#physical-no').isChecked(), true)
    assert.equal(await yes.getAttribute('aria-expanded'), 'false')
    assert.equal(await details.isVisible(), false)
  }))

  test(`${variant.name}: labels, counters and errors reflow at 320px`, async () => withPage(async page => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto(`${prefix}/personal-relationships-children`)
    await page.locator('#children-lived-with').check()
    await page.locator('#relationships-children-details').fill('x'.repeat(401))
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    assert.equal(await page.locator('.govuk-error-summary:focus').count(), 1)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  }))

  test(`${variant.name}: dynamically generated drug details use the same count component`, async () => withPage(async page => {
    await seed(page, variant.key, {
      drugUse: 'yes', drugTypes: ['other'], drugsInCustody: 'yes',
      extraDrugs: [{ id: 'extra-1', name: 'Example substance', lastUsed: 'last-six' }],
      drugLastUsed: {}, drugFrequency: { 'extra-1': 'daily' }
    })
    await page.goto(`${prefix}/drugs-before`)
    const field = page.locator('#frequency-extra-1-details')
    await field.waitFor()
    await field.fill('x'.repeat(2001))
    const count = field.locator('..').locator('.govuk-character-count__status')
    assert.equal(await count.textContent(), 'You have 1 character too many')
    assert.match(await field.getAttribute('aria-describedby'), /frequency-extra-1-details-hint/)
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    assert.equal(await page.locator('.govuk-error-summary:focus').count(), 1)
    assert.ok(page.url().endsWith('/drugs-before'))
  }))

  test(`${variant.name}: one banner, main and footer; drug summary heading hierarchy`, async () => withPage(async page => {
    await seed(page, variant.key, {
      drugUse: 'yes', drugTypes: ['heroin'], drugLastUsed: { heroin: 'last-six' },
      drugFrequency: { heroin: 'daily' }, injectedDrugs: ['none'], drugsInCustody: 'yes'
    })
    await page.goto(`${prefix}/drugs-summary`)
    for (const role of ['banner', 'main', 'contentinfo']) assert.equal(await page.getByRole(role).count(), 1)
    assert.equal(await page.getByRole('contentinfo').getByRole('link', { name: 'Accessibility statement' }).count(), 1)
    assert.equal(await page.locator('main h1:visible').count(), 1)
    const headings = await page.locator('#summary h2, #summary h3').evaluateAll(elements => elements.map(element => ({ tag: element.tagName, text: element.textContent.trim() })))
    assert.match(headings[0].text, /Used in/)
    assert.equal(headings[0].tag, 'H2')
    assert.deepEqual(headings[1], { tag: 'H3', text: 'Heroin' })
    const tab = page.getByRole('tab', { name: 'Summary', exact: true })
    await tab.focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await page.getByRole('tab', { name: 'Practitioner analysis', exact: true }).getAttribute('aria-selected'), 'true')
  }))

  for (const file of ['accommodation', 'employment', 'health', 'personal-relationships', 'thinking-behaviours']) {
    test(`${variant.name}/${file}: completion focuses the updated heading, not the hidden form`, async () => withPage(async page => {
      await page.goto(`${prefix}/${file}-summary.html#practitioner-analysis`)
      for (const question of ['strengths', 'harm', 'reoffending']) await page.locator(`#analysis-${question}-no`).check()
      const complete = page.getByRole('button', { name: 'Mark as complete', exact: true })
      await complete.focus()
      await page.keyboard.press('Enter')
      await page.locator('.san-content-header h1:focus').waitFor()
      assert.match(await page.locator('h1:focus').textContent(), /, Complete/)
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('[role="tab"]:focus').count(), 1)
      await page.reload()
      assert.equal(await page.locator('[data-san-status]').textContent(), 'Complete')
    }))
  }

  test(`${variant.name}: direct offence completion focuses its updated heading`, async () => withPage(async page => {
    await seed(page, variant.key, { offenceDescription: 'Synthetic example offence.' })
    await page.goto(`${prefix}/offence-analysis-summary`)
    await page.locator('[data-oa-mark-complete]').click()
    await page.locator('.san-content-header h1:focus').waitFor()
    assert.match(await page.locator('h1:focus').textContent(), /, Complete/)
  }))
}

test('character counts and landmarks outside training are not changed', async () => withPage(async page => {
  for (const path of ['/san-research/offence-analysis', '/san-prison/offence-analysis']) {
    await page.goto(`${baseUrl}${path}`)
    assert.equal(await page.locator('#offence-description').getAttribute('maxlength'), '2000')
    assert.equal(await page.locator('[data-module="govuk-character-count"]').count(), 0)
    assert.equal(await page.getByRole('banner').count(), 2)
  }
}))
