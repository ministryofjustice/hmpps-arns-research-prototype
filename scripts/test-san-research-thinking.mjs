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
    await page.goto(`${baseUrl}/san-research/thinking-behaviours`)
    await run(page)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

const submit = (page) => page.getByRole('button', { name: 'Save and continue', exact: true }).click()
const choose = (page, id) => page.locator(`label[for="${id}"]`).click()

const answerQuestions = async (page) => {
  const names = await page.locator('#san-thinking-questions-form fieldset input[type="radio"]').evaluateAll(
    (inputs) => [...new Set(inputs.map((input) => input.name))]
  )
  for (const name of names) {
    const id = await page.locator(`input[name="${name}"]`).first().getAttribute('id')
    await choose(page, id)
  }
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-changes')
}

test('changes is the second page, validates, saves details and proceeds to sexual risk', async () => journey(async (page) => {
  assert.equal(await page.locator('#changes').count(), 0)
  await answerQuestions(page)
  assert.equal(await page.locator('#san-thinking-changes-form fieldset').count(), 1)
  await submit(page)
  assert.match(await page.locator('.govuk-error-summary').innerText(), /Select if they want to make changes/)
  await choose(page, 'changes-need-help')
  await page.locator('#changes-need-help-details').fill('Support with making changes.')
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-sexual')
  await page.locator('.assessment-layout__back-link').click()
  await page.waitForURL('**/thinking-behaviours-changes')
  assert.equal(await page.locator('#changes-need-help').isChecked(), true)
  assert.equal(await page.locator('#changes-need-help-details').inputValue(), 'Support with making changes.')
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-sexual')
  await choose(page, 'sexual-concerns-no')
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-summary')
  const summary = page.locator('[data-tb-summary]')
  assert.match(await summary.innerText(), /Support with making changes/)
  const rows = await summary.locator('.govuk-summary-list__key').allInnerTexts()
  assert.ok(rows.indexOf('Does Alex want to make changes to their thinking, behaviours and attitudes?') <
    rows.indexOf('Are there any concerns that Alex poses a risk of sexual harm to others?'))
  await summary.getByRole('link', { name: /Change Does Alex want to make changes/ }).click()
  await page.waitForURL('**/thinking-behaviours-changes?from=summary#changes')
  assert.equal(await page.locator('#changes-need-help').isChecked(), true)
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-summary')
}))

test('sexual concerns still lead to the sexual harm questions after changes', async () => journey(async (page) => {
  await page.goto(`${baseUrl}/san-research/thinking-behaviours-sexual`)
  await page.waitForURL('**/thinking-behaviours')
  await answerQuestions(page)
  await page.goto(`${baseUrl}/san-research/thinking-behaviours-sexual`)
  await page.waitForURL('**/thinking-behaviours-changes')
  await choose(page, 'changes-not-applicable')
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-sexual')
  await choose(page, 'sexual-concerns-yes')
  await submit(page)
  await page.waitForURL('**/thinking-behaviours-sexual-harm')
  assert.equal(await page.locator('#preoccupation').isVisible(), true)
}))
