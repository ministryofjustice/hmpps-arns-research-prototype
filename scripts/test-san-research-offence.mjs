import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import { chromium } from 'playwright'

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

const victims = [
  { relationship: 'staff', relationshipDetails: '', age: '26-49', sex: 'female', ethnicity: 'white-british' },
  { relationship: 'other', relationshipDetails: 'Neighbour', age: '50-64', sex: 'male', ethnicity: 'white-other' }
]
const prisonSession = { offenceVictims: [victims[0]], offenceComplete: true }

const withVictims = async (from, run) => {
  const context = await browser.newContext()
  await context.addInitScript(({ victims, prisonSession }) => {
    if (!sessionStorage.getItem('sanResearchAssessment')) {
      sessionStorage.setItem('sanResearchAssessment', JSON.stringify({ offenceCommittedAgainst: ['people'], offenceVictims: victims }))
    }
    if (!sessionStorage.getItem('sanPrisonAssessment')) {
      sessionStorage.setItem('sanPrisonAssessment', JSON.stringify(prisonSession))
    }
  }, { victims, prisonSession })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(`${baseUrl}/san-research/offence-analysis-victim-details${from === 'summary' ? '?from=summary' : ''}`)
    await run(page)
    assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('sanPrisonAssessment'))), prisonSession)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

const savedVictims = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('sanResearchAssessment')).offenceVictims)
const save = (page) => page.getByRole('button', { name: 'Save and continue', exact: true }).click()
const assertRestored = async (page, victim) => {
  await page.locator(`#relationship-${victim.relationship}:checked`).waitFor()
  assert.equal(await page.locator('#relationship-other-details').inputValue(), victim.relationshipDetails)
  assert.equal(await page.locator(`#victim-age-${victim.age}`).isChecked(), true)
  assert.equal(await page.locator(`#victim-sex-${victim.sex}`).isChecked(), true)
  assert.equal(await page.locator('#victim-ethnicity').inputValue(), victim.ethnicity)
  if (victim.relationship === 'other') assert.equal(await page.locator('#relationship-other-details').isVisible(), true)
}

for (const { index, from } of [{ index: 0, from: 'details' }, { index: 1, from: 'details' }, { index: 1, from: 'summary' }]) {
  test(`Change victim ${index} restores and updates that record, returning to ${from}`, async () => withVictims(from, async (page) => {
    await page.getByRole('link', { name: /^Change/ }).nth(index).click()
    const url = new URL(page.url())
    assert.equal(url.pathname, '/san-research/offence-analysis-victim')
    assert.equal(url.searchParams.get('victim'), String(index))
    assert.equal(url.searchParams.get('from'), from)
    await assertRestored(page, victims[index])
    await page.reload()
    await assertRestored(page, victims[index])

    const updated = { ...victims[index], age: '65-over' }
    await page.locator('#victim-age-65-over').check()
    if (updated.relationship === 'other') {
      updated.relationshipDetails = 'Updated neighbour relationship'
      await page.locator('#relationship-other-details').fill(updated.relationshipDetails)
    }
    await save(page)
    const destination = from === 'summary' ? 'offence-analysis-summary' : 'offence-analysis-victim-details'
    await page.waitForURL(url => url.pathname.replace(/\.html$/, '') === `/san-research/${destination}`)
    const expected = victims.map((victim, position) => position === index ? updated : victim)
    assert.deepEqual(await savedVictims(page), expected)
  }))
}

test('Add another victim still opens a blank form and appends one record', async () => withVictims('details', async (page) => {
  await page.locator('#add-another-victim-yes').check()
  await save(page)
  await page.waitForURL(url => url.pathname === '/san-research/offence-analysis-victim')
  await page.locator('#san-offence-victim-form').waitFor()
  assert.equal(new URL(page.url()).searchParams.has('victim'), false)
  assert.equal(new URL(page.url()).searchParams.get('from'), 'details')
  assert.equal(await page.locator('#san-offence-victim-form input:checked').count(), 0)
  assert.equal(await page.locator('#relationship-other-details').inputValue(), '')
  assert.equal(await page.locator('#victim-ethnicity').inputValue(), '')
  await page.locator('#relationship-stranger').check()
  await page.locator('#victim-age-unknown').check()
  await page.locator('#victim-sex-unknown').check()
  await page.locator('#victim-ethnicity').selectOption('unknown')
  await save(page)
  await page.waitForURL(/\/offence-analysis-victim-details(?:\.html)?$/)
  assert.deepEqual(await savedVictims(page), [
    ...victims,
    { relationship: 'stranger', relationshipDetails: '', age: 'unknown', sex: 'unknown', ethnicity: 'unknown' }
  ])
}))