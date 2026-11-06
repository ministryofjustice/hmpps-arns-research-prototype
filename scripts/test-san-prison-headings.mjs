import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { test, before, after } from 'node:test'
import { chromium } from 'playwright'

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

const headingText = (page) => page.locator('main h1').evaluate(heading => {
  const copy = heading.cloneNode(true)
  copy.querySelectorAll('.govuk-visually-hidden').forEach(node => node.remove())
  return copy.textContent.trim()
})

test('all multi-question Prison templates use expected H1s and medium question legends', async () => {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    const files = (await readdir(new URL('../app/views/san-prison/', import.meta.url)))
      .filter(file => file.endsWith('.html') && file !== 'layout.html')
    for (const file of files) {
      const response = await page.request.get(`${baseUrl}/san-prison/${file}`)
      assert.equal(response.ok(), true, file)
      const result = await page.evaluate(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const main = doc.querySelector('main')
        if (!main) return null
        const questions = [...main.querySelectorAll('form legend, form h2.govuk-label-wrapper, form > h2.govuk-heading-m')]
          .filter(node => !node.closest('.govuk-radios__conditional, .govuk-checkboxes__conditional, [data-san-question]'))
        if (questions.length < 2) return null
        const title = main.querySelector('[aria-current="location"] .assessment-section-navigation__label')?.textContent.trim()
        const headings = [...main.querySelectorAll('h1')].filter(node => !node.closest('[data-san-question]')).map(node => {
          const copy = node.cloneNode(true)
          copy.querySelectorAll('.govuk-visually-hidden').forEach(child => child.remove())
          return copy.textContent.trim()
        })
        const mismatchedLegends = questions.filter(node => node.tagName === 'LEGEND' && !node.classList.contains('govuk-fieldset__legend--m'))
        return { title, headings, mismatchedLegends: mismatchedLegends.length, adaptive: !!main.querySelector('[data-ee-page="difficulty"]') }
      }, await response.text())
      if (!result) continue
      const expectedTitle = file === 'offence-analysis-victim.html' ? "What are the victim's details?" : result.title
      if (!result.adaptive) assert.deepEqual(result.headings, [expectedTitle], file)
      assert.equal(result.mismatchedLegends, 0, file)
    }
  } finally {
    await context.close()
  }
})

for (const drugsInCustody of ['yes', 'no']) {
  test(`Drug use custody headings match on questions and summary when custody use is ${drugsInCustody}`, async () => {
    const context = await browser.newContext()
    await context.addInitScript(drugsInCustody => {
      sessionStorage.setItem('sanPrisonAssessment', JSON.stringify({
        drugUse: 'yes',
        drugsInCustody,
        drugTypes: ['heroin', 'cannabis'],
        drugLastUsed: { heroin: 'last-six', cannabis: 'more-than-six' },
        drugFrequency: { heroin: 'occasionally' }
      }))
    }, drugsInCustody)
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      for (const file of ['drugs-before', 'drugs-summary']) {
        await page.goto(`${baseUrl}/san-prison/${file}.html`)
        await page.getByRole('heading', { name: 'Used in the 6 months before custody', exact: true }).waitFor()
        await page.getByRole('heading', { name: 'Not used in the 6 months before custody', exact: true }).waitFor()
        assert.equal(await page.getByRole('heading', { name: /^(Not used|Used) in the last 6 months$/ }).count(), 0)
      }
      assert.deepEqual(errors, [])
    } finally {
      await context.close()
    }
  })
}

const changedPages = [
  ['drugs-help', 'Drug use'],
  ['drugs-before', 'Drug use'],
  ['drugs-background', 'Drug use'],
  ['drugs-when', 'Drug use'],
  ['drugs-injected', 'Drug use'],
  ['offence-analysis-victim', "What are the victim's details?"],
  ['personal-relationships-child-details', 'Personal relationships and community'],
  ['thinking-behaviours-sexual-harm', 'Thinking, behaviours and attitudes']
]

for (const width of [1280, 390]) {
  for (const [file, title] of changedPages) {
    test(`${file}: expected H1 and matching question sizes at ${width}px`, async () => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } })
      const page = await context.newPage()
      try {
        await page.goto(`${baseUrl}/san-prison/${file}.html`)
        assert.equal(await page.locator('main h1').count(), 1)
        assert.equal(await headingText(page), title)
        if (file === 'offence-analysis-victim') {
          assert.match(await page.locator('.san-content-header .govuk-caption-l').innerText(), /^Offence analysis/)
          const titleSize = await page.locator('main h1').evaluate(node => parseFloat(getComputedStyle(node).fontSize))
          const questionSize = await page.locator('#victim-relationship h2').evaluate(node => parseFloat(getComputedStyle(node).fontSize))
          assert.ok(titleSize > questionSize)
        }
        const sizes = await page.locator('form legend.govuk-fieldset__legend--m, form label.govuk-label--m, form > h2.govuk-heading-m')
          .evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fontSize))
        assert.ok(sizes.length > 1)
        assert.equal(new Set(sizes).size, 1)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      } finally {
        await context.close()
      }
    })
  }

  for (const difficulties of [['reading'], ['reading', 'writing'], ['reading', 'writing', 'numeracy']]) {
    test(`Employment: ${difficulties.length} difficulty questions at ${width}px`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      await context.addInitScript(difficulties => {
        sessionStorage.setItem('sanPrisonAssessment', JSON.stringify({ employmentStatus: 'employed', difficulties }))
      }, difficulties)
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.goto(`${baseUrl}/san-prison/employment-difficulty.html`)
        await page.locator('[data-ee-difficulty="reading"]:not([hidden])').waitFor()
        assert.equal(await page.locator('main h1').count(), 1)
        assert.equal(await headingText(page), difficulties.length === 1
          ? 'How much support does Alex need with reading?'
          : 'Employment and education')
        const questions = page.locator('[data-ee-difficulty]:not([hidden]) .govuk-fieldset__heading')
        assert.equal(await questions.count(), difficulties.length)
        const headings = await questions.evaluateAll(nodes => nodes.map(node => ({ tag: node.tagName, size: getComputedStyle(node).fontSize })))
        assert.ok(headings.every(heading => heading.tag === (difficulties.length === 1 ? 'H1' : 'H2')))
        assert.equal(new Set(headings.map(heading => heading.size)).size, 1)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        assert.deepEqual(errors, [])
      } finally {
        await context.close()
      }
    })
  }
}