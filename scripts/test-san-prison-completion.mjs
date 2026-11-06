import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import { chromium } from 'playwright'

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

const sections = [
  { key: 'accommodation', file: 'accommodation-summary', completeKey: 'accommodationComplete' },
  { key: 'employment', file: 'employment-summary', completeKey: 'employmentComplete' },
  { key: 'finances', file: 'finances-summary', completeKey: 'financeComplete', exempt: { financeFurtherAssessment: 'no' } },
  { key: 'drugs', file: 'drugs-summary', completeKey: 'drugComplete', exempt: { drugUse: 'no' } },
  { key: 'alcohol', file: 'alcohol-summary', completeKey: 'alcoholComplete', exempt: { alcoholUse: 'never' } },
  { key: 'health', file: 'health-summary', completeKey: 'healthComplete' },
  { key: 'relationships', file: 'personal-relationships-summary', completeKey: 'relationshipsComplete' },
  { key: 'thinking', file: 'thinking-behaviours-summary', completeKey: 'thinkingComplete' }
]
const questions = ['strengths', 'harm', 'reoffending']
const markComplete = (page) => page.getByRole('button', { name: 'Mark as complete', exact: true })
const analysisRows = (page) => page.locator('#practitioner-analysis .govuk-summary-list__row')
const select = (page, id) => page.locator(`label[for="${id}"]`).click()

const withSummary = async (section, run, seed = {}) => {
  const context = await browser.newContext()
  await context.addInitScript((session) => {
    if (!sessionStorage.getItem('sanPrisonAssessment')) {
      sessionStorage.setItem('sanPrisonAssessment', JSON.stringify(session))
    }
  }, seed)
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(`${baseUrl}/san-prison/${section.file}.html#practitioner-analysis`)
    await run(page)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

const assertProgress = async (page, section, complete) => {
  const label = complete ? 'Complete' : 'Incomplete'
  await page.locator('[data-san-status]').filter({ hasText: new RegExp(`^${label}$`) }).waitFor()
  assert.equal(await page.locator('[data-san-status]').evaluate((tag) => tag.classList.contains('govuk-tag--light-blue')), complete)
  assert.equal(await page.locator(`[data-section-complete="${section.key}"]`).isVisible(), complete)
  assert.equal((await page.locator(`[data-san-section-status="${section.key}"]`).innerText()).trim(), `, ${label}`)
  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sanPrisonAssessment')))
  assert.equal(!!session[section.completeKey], complete)
  assert.equal(await page.locator(`[data-section-complete]:not([data-section-complete="${section.key}"]).assessment-section-navigation__complete-icon--visible`).count(), 0)
}

const assertAnalysisComplete = async (page, section) => {
  await analysisRows(page).first().waitFor()
  await assertProgress(page, section, true)
  assert.equal(await analysisRows(page).count(), 3)
  assert.equal(await page.locator('#practitioner-analysis form').isVisible(), false)
}

for (const section of sections) {
  for (const missing of questions) {
    test(`${section.key}: requires ${missing} and completes immediately with three No answers`, async () => withSummary(section, async (page) => {
      for (const question of questions.filter((question) => question !== missing)) {
        await select(page, `analysis-${question}-no`)
      }
      await markComplete(page).click()
      await assertProgress(page, section, false)
      assert.equal(await page.locator(`.govuk-error-summary a[href="#analysis-${missing}"]`).count(), 1)
      assert.equal(await page.locator('#practitioner-analysis form').isVisible(), true)

      await select(page, `analysis-${missing}-no`)
      await markComplete(page).click()
      await assertAnalysisComplete(page, section)
      await page.reload()
      await assertAnalysisComplete(page, section)
    }))
  }

  test(`${section.key}: rejects an empty PA, requires Yes details, and refreshes edited answers`, async () => withSummary(section, async (page) => {
    await markComplete(page).click()
    await assertProgress(page, section, false)
    assert.equal(await page.locator('.govuk-error-summary__list a').count(), 3)
    for (const question of questions) await select(page, `analysis-${question}-yes`)

    for (const question of questions) {
      await markComplete(page).click()
      await assertProgress(page, section, false)
      assert.equal(await page.locator(`.govuk-error-summary a[href="#analysis-${question}-yes-details"]`).count(), 1)
      await page.locator(`#analysis-${question}-yes-details`).fill(`Details for ${question}.`)
    }
    await markComplete(page).click()
    await assertAnalysisComplete(page, section)
    for (const question of questions) {
      assert.match(await analysisRows(page).allInnerTexts().then((rows) => rows.join('\n')), new RegExp(`Details for ${question}\\.`))
    }

    await analysisRows(page).first().getByRole('link', { name: /^Change/ }).click()
    await page.locator('#analysis-strengths-yes-details').fill('Updated strengths details.')
    await markComplete(page).click()
    await assertAnalysisComplete(page, section)
    assert.match(await analysisRows(page).first().innerText(), /Updated strengths details\./)
  }))

  if (section.exempt) {
    test(`${section.key}: preserves the existing PA-not-required completion route`, async () => withSummary(section, async (page) => {
      assert.equal(await page.locator('#analysis-strengths-yes').isVisible(), false)
      await markComplete(page).click()
      await assertProgress(page, section, true)
      assert.equal(await markComplete(page).isVisible(), false)
      await page.reload()
      await assertProgress(page, section, true)
    }, section.exempt))
  }
}

test('offence: existing summary completion updates immediately without a PA tab', async () => {
  const section = { key: 'offence', file: 'offence-analysis-summary', completeKey: 'offenceComplete' }
  await withSummary(section, async (page) => {
    assert.equal(await page.locator('#practitioner-analysis').count(), 0)
    await markComplete(page).click()
    await assertProgress(page, section, true)
    assert.equal(await markComplete(page).isVisible(), false)
    await page.reload()
    await assertProgress(page, section, true)
  }, { offenceDescription: 'Description of the offences.' })
})