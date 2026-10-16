import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import { chromium } from 'playwright'

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

const journey = async (run) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(`${baseUrl}/san-prison/accommodation`)
    await run(page)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

const select = (page, id) => page.locator(`label[for="${id}"]`).click()
const submit = (page) => page.getByRole('button', { name: 'Save and continue', exact: true }).click()
const question = async (page, step) => {
  await page.locator(`[data-san-question="${step}"]:not([hidden])`).waitFor({ state: 'visible' })
  assert.equal(new URL(page.url()).searchParams.get('step'), step)
}
const advance = async (page, id, step) => {
  await select(page, id)
  await submit(page)
  await question(page, step)
}
const summary = async (page) => {
  await select(page, 'changes-active')
  await submit(page)
  await page.waitForURL(/\/accommodation-summary(?:\.html)?$/)
  await page.locator('[data-san-summary] .govuk-summary-list').waitFor()
}

test('first screen has only three choices and validates an empty answer', async () => journey(async (page) => {
  assert.equal(await page.locator('#san-accommodation-type-form input').count(), 3)
  assert.equal(await page.locator('#san-accommodation-type-form [data-aria-controls]').count(), 0)
  await submit(page)
  assert.match(await page.locator('.govuk-error-summary').innerText(), /Select the type of accommodation/)
}))

test('settled return Yes skips plans and living-with; suitability concerns still work', async () => journey(async (page) => {
  await advance(page, 'accommodation-settled', 'return')
  await submit(page)
  assert.match(await page.locator('.govuk-error-summary').innerText(), /Select if Alex plans to return/)
  await advance(page, 'return-yes', 'location')
  await select(page, 'location-no')
  await submit(page)
  await page.locator('[data-san-question="location-concerns"]:not([hidden])').waitFor()
  await submit(page)
  await question(page, 'suitable')
  await advance(page, 'suitable-yes', 'changes')
  await summary(page)
  const text = await page.locator('[data-san-summary]').innerText()
  assert.match(text, /Does Alex plan to return/)
  assert.doesNotMatch(text, /current plans|planning on living/)
  assert.equal(await page.locator('[data-san-go-analysis]').isVisible(), true)
}))

for (const answer of ['no', 'unknown']) {
  test(`settled return ${answer} asks plans; no plans skips suitability`, async () => journey(async (page) => {
    await advance(page, 'accommodation-settled', 'return')
    await select(page, `return-${answer}`)
    if (answer === 'unknown') {
      assert.equal(await page.locator('#return-unknown-details').isVisible(), true)
      await page.locator('#return-unknown-details').fill('Release address is not confirmed.')
    }
    await submit(page)
    await question(page, 'release-plans')
    await advance(page, 'release-plans-no', 'changes')
    await page.reload()
    await question(page, 'changes')
    await page.locator('.assessment-layout__back-link').click()
    await question(page, 'release-plans')
    assert.equal(await page.locator('#release-plans-no').isChecked(), true)
    await submit(page)
    await question(page, 'changes')
    await summary(page)
    const text = await page.locator('[data-san-summary]').innerText()
    assert.doesNotMatch(text, /suitable|planning on living/)
    if (answer === 'unknown') assert.match(text, /Release address is not confirmed/)
  }))
}

for (const subtype of ['approved-premises', 'cas2', 'cas3', 'unknown', 'immigration', 'short-term']) {
  test(`temporary ${subtype} follows the correct release journey`, async () => journey(async (page) => {
    await advance(page, 'accommodation-temporary', 'temporary-type')
    await submit(page)
    assert.match(await page.locator('.govuk-error-summary').innerText(), /Select the type of temporary accommodation/)
    await select(page, `temporary-${subtype}`)
    if (subtype !== 'unknown') {
      await page.locator(`#temporary-${subtype}-end-date-day`).fill('12')
      await page.locator(`#temporary-${subtype}-end-date-month`).fill('3')
      await page.locator(`#temporary-${subtype}-end-date-year`).fill('2027')
    }
    await submit(page)
    if (['immigration', 'short-term'].includes(subtype)) {
      await question(page, 'return')
      await advance(page, 'return-no', 'release-plans')
    } else {
      await question(page, 'release-plans')
    }
    await advance(page, 'release-plans-no', 'changes')
    await summary(page)
    const text = await page.locator('[data-san-summary]').innerText()
    assert.match(text, /What type of temporary accommodation does Alex have/)
    if (subtype !== 'unknown') assert.match(text, /Expected end date: 12 3 2027/)
    const row = page.locator('.govuk-summary-list__row').filter({ hasText: 'What type of temporary accommodation' })
    await row.getByRole('link', { name: /^Change/ }).click()
    await question(page, 'temporary-type')
    assert.equal(await page.locator(`#temporary-${subtype}`).isChecked(), true)
    if (subtype !== 'unknown') assert.equal(await page.locator(`#temporary-${subtype}-end-date-year`).inputValue(), '2027')
  }))
}

test('release plans require details; living-with radios and optional details persist', async () => journey(async (page) => {
  await advance(page, 'accommodation-settled', 'return')
  await advance(page, 'return-unknown', 'release-plans')
  await submit(page)
  assert.match(await page.locator('.govuk-error-summary').innerText(), /Select if Alex has any current plans/)
  await select(page, 'release-plans-yes')
  await page.locator('#release-plans-details').fill('   ')
  await submit(page)
  assert.match(await page.locator('.govuk-error-summary').innerText(), /Enter details about Alex's plans/)
  await page.locator('#release-plans-details').fill('Stay with partner.')
  await submit(page)
  await question(page, 'living-with')
  assert.equal(await page.locator('input[name="living_with"][type="radio"]').count(), 7)
  assert.deepEqual(await page.locator('#living-with .govuk-radios__label').allTextContents(), [
    'Friends', 'Family', 'Partner', 'Person under 18 years old', 'Other', 'Unknown', 'Alone'
  ])
  await submit(page)
  assert.match(await page.locator('.govuk-error-summary').innerText(), /Select who Alex is planning/)
  await select(page, 'living-partner')
  assert.match(await page.locator('#living-partner-hint').innerText(), /For example name, age and gender/)
  await page.locator('#living-partner-details').fill('Sam, 35, female.')
  await select(page, 'living-other')
  assert.equal(await page.locator('#living-other-details').isVisible(), true)
  assert.equal(await page.locator('#living-partner').isChecked(), false)
  await select(page, 'living-partner')
  await submit(page)
  await question(page, 'location')
  await advance(page, 'location-yes', 'suitable')
  await advance(page, 'suitable-yes', 'changes')
  await summary(page)
  assert.match(await page.locator('[data-san-summary]').innerText(), /Stay with partner[\s\S]*Sam, 35, female/)
  const row = page.locator('.govuk-summary-list__row').filter({ hasText: 'current plans for accommodation' })
  await row.getByRole('link', { name: /^Change/ }).click()
  await question(page, 'release-plans')
  await advance(page, 'release-plans-no', 'changes')
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sanPrisonAssessment')))
  assert.deepEqual(saved.livingWith, [])
  assert.equal(saved.locationSuitable, '')
  assert.equal(saved.accommodationSuitable, '')
  assert.equal(saved.releasePlansDetails, '')
  await summary(page)
  assert.doesNotMatch(await page.locator('[data-san-summary]').innerText(), /Stay with partner|Sam, 35|suitable|planning on living/)
}))

test('No accommodation keeps the existing reasons and changes journey', async () => journey(async (page) => {
  await advance(page, 'accommodation-none', 'no-accommodation')
  await advance(page, 'no-accommodation-financial', 'changes')
  await summary(page)
  assert.match(await page.locator('[data-san-summary]').innerText(), /Financial difficulties/)
  await page.locator('[data-san-go-analysis]').click()
  for (const id of ['analysis-strengths-no', 'analysis-harm-no', 'analysis-reoffending-no']) {
    await select(page, id)
  }
  await page.getByRole('button', { name: 'Mark as complete', exact: true }).click()
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('sanPrisonAssessment')).accommodationComplete), true)
  await page.reload()
  await page.locator('[data-san-analysis-summary]:not([hidden])').waitFor()
  assert.equal(await page.locator('[data-san-status]').innerText(), 'Complete')
}))

test('all living-with choices continue to suitability with optional details blank', async () => journey(async (page) => {
  await advance(page, 'accommodation-settled', 'return')
  await advance(page, 'return-no', 'release-plans')
  await select(page, 'release-plans-yes')
  await page.locator('#release-plans-details').fill('Arrange a release address.')
  await submit(page)
  await question(page, 'living-with')
  for (const value of ['friends', 'family', 'partner', 'under-18', 'other', 'unknown', 'alone']) {
    await advance(page, `living-${value}`, 'location')
    await page.locator('.assessment-layout__back-link').click()
    await question(page, 'living-with')
    assert.equal(await page.locator(`#living-${value}`).isChecked(), true)
  }
}))

test('changing temporary type clears obsolete release answers and dates', async () => journey(async (page) => {
  await advance(page, 'accommodation-temporary', 'temporary-type')
  await advance(page, 'temporary-immigration', 'return')
  await advance(page, 'return-yes', 'location')
  await advance(page, 'location-yes', 'suitable')
  await advance(page, 'suitable-yes', 'changes')
  await summary(page)
  const row = page.locator('.govuk-summary-list__row').filter({ hasText: 'What type of temporary accommodation' })
  await row.getByRole('link', { name: /^Change/ }).click()
  await question(page, 'temporary-type')
  await advance(page, 'temporary-cas2', 'release-plans')
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sanPrisonAssessment')))
  assert.equal(saved.returnToAccommodation, '')
  assert.equal(saved.locationSuitable, '')
  assert.equal(saved.accommodationSuitable, '')
  assert.equal(saved.changes, '')
  assert.equal(saved.temporaryEndYear, '')
  await advance(page, 'release-plans-no', 'changes')
  await summary(page)
  assert.doesNotMatch(await page.locator('[data-san-summary]').innerText(), /plan to return|suitable/)
}))
