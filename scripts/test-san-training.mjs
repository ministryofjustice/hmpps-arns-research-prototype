import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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

for (const variant of variants) {
  test(`${variant.name}: employment status wording matches its setting on question, summary and edit`, async () => withPage(async page => {
    const heading = variant.name === 'community'
      ? "What is Alex's current employment status?"
      : "What was Alex's employment status before custody?"
    const prefix = `${baseUrl}/san-training/${variant.name}/employment`
    await seedSession(page, variant.key, {
      employmentStatus: 'employed-or-self-employed', employmentHistory: 'continuous',
      commitments: ['none'], qualifications: 'yes', qualificationsDetails: 'GCSEs in English and maths.',
      skills: 'some', difficulties: ['none'], difficultyLevels: {},
      employmentChanges: 'active', employmentChangesDetails: 'Looking for further training.'
    })
    await page.goto(prefix)
    assert.equal(await page.locator('main h1:visible').innerText(), heading)
    await page.goto(`${prefix}-summary`)
    const row = page.locator('[data-ee-summary] .govuk-summary-list__row').first()
    assert.equal(await row.locator('dt').innerText(), heading)
    assert.equal(await row.locator('.govuk-summary-list__value').innerText(), 'Employed or self-employed')
    await row.getByRole('link', { name: `Change ${heading}`, exact: true }).click()
    await page.waitForURL(/employment(?:\.html)?\?from=summary#employment-status$/)
    assert.equal(await page.locator('main h1:visible').innerText(), heading)
    assert.equal(await page.locator('#employment-employed-or-self-employed').isChecked(), true)
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/employment-summary(?:\.html)?$/)
    assert.equal(await row.locator('dt').innerText(), heading)
    assert.equal((await savedSession(page, variant.key)).employmentStatus, 'employed-or-self-employed')
  }))

  for (const width of [1280, 390]) {
    test(`${variant.name}/${width}: training key changes expand, filter and stay variant-specific`, async () => withPage(async page => {
      await page.goto(`${baseUrl}/san#${variant.name}-training`)
      const root = page.locator(`#${variant.name}-training [data-changelog]`)
      const details = root.locator('[data-changelog-details]')
      const toggle = root.locator('[data-changelog-details-toggle]')
      const counts = variant.name === 'prison' ? { all: 23, CD: 14, IxD: 9 } : { all: 17, CD: 11, IxD: 6 }
      assert.equal(await details.isVisible(), false)
      assert.equal(await toggle.getAttribute('aria-controls'), `${variant.name}-training-changelog-details`)
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
      assert.equal(await toggle.locator('[data-changelog-details-label]').innerText(), 'Show details')
      assert.deepEqual(await root.locator('[data-changelog-filter]').allTextContents(), ['All', 'CD', 'IxD'])
      assert.equal(await root.locator('[data-a11y], .assessment-research-changelog__tag--a11y').count(), 0)

      await toggle.click()
      assert.equal(await details.isVisible(), true)
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
      assert.equal(await toggle.locator('[data-changelog-details-label]').innerText(), 'Hide details')
      assert.equal(await root.locator('[data-changelog-panel="summary"]').isVisible(), true)
      const iteration = root.locator('[data-iteration-tab="november-2026"]')
      assert.equal(await iteration.locator('[data-count-for]').innerText(), String(counts.all))
      await iteration.click()
      const rows = root.locator('[data-change]')
      assert.deepEqual(await rows.evaluateAll(rows => [...new Set(rows.map(row => row.dataset.section))]), [
        'Offence analysis', 'Thinking, behaviours and attitudes', 'Personal relationships and community',
        'Finances', 'Employment and education'
      ])
      const text = (await rows.allTextContents()).join(' ')
      assert.ok(text.includes("Each 'Change' link opens the relevant victim page."))
      assert.ok(text.includes("Children's cards are no longer shown on the summary page."))
      assert.ok(text.includes("Only show the parenting responsibilities question when 'Yes' is selected"))
      assert.equal(text.includes('important contacts in custody'), variant.name === 'prison')
      assert.equal(text.includes('before custody'), variant.name === 'prison')
      assert.equal(text.includes('day-to-day commitments'), variant.name === 'prison')
      assert.equal(text.includes('Yes, were living together'), variant.name === 'prison')
      assert.equal(text.includes('perpetrated strangulation or suffocation'), variant.name === 'community')
      assert.equal(text.includes('TBC:'), variant.name === 'community')
      assert.equal(text.includes("Restored 'What is Alex's current employment status?'"), variant.name === 'community')

      for (const filter of ['CD', 'IxD', 'all']) {
        await root.locator(`[data-changelog-filter="${filter}"]`).click()
        assert.equal(await root.locator('[data-change]:visible').count(), counts[filter])
        assert.equal(await iteration.locator('[data-count-for]').innerText(), String(counts[filter]))
        assert.equal(await root.locator('[data-changelog-filter][aria-pressed="true"]').getAttribute('data-changelog-filter'), filter)
        if (filter !== 'all') {
          assert.deepEqual(await root.locator('[data-change]:visible').evaluateAll(rows => [...new Set(rows.map(row => row.dataset.changeType))]), [filter])
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      }
      await toggle.click()
      assert.equal(await details.isVisible(), false)
      await toggle.click()
      assert.equal(await root.locator('[data-change]:visible').count(), counts.all)
      assert.equal(await page.locator('[id]').evaluateAll(elements => {
        const ids = elements.map(element => element.id)
        return ids.length === new Set(ids).size
      }), true)
      for (const name of ['community', 'prison']) {
        assert.deepEqual(await page.locator(`#${name}-research [data-changelog-filter]`).allTextContents(), ['All', 'CD', 'IxD', 'A11y'])
        assert.equal(await page.locator(`#${name}-research [data-changelog-filter][aria-pressed="true"]`).getAttribute('data-changelog-filter'), 'all')
      }
    }, { viewport: { width, height: 900 } }))
  }
}

for (const variant of variants) {
  for (const risk of ['yes', 'no']) {
    test(`${variant.name} thinking changes/${risk}: standalone step, resume, back links, summary edits and completion`, async () => withPage(async page => {
      const prefix = `${baseUrl}/san-training/${variant.name}/thinking-behaviours`
      await seedSession(page, variant.key, {})
      await page.goto(`${prefix}-changes.html`)
      await page.waitForURL(`${prefix}.html`)
      assert.equal(await page.locator('#changes').count(), 0)
      const submit = page.getByRole('button', { name: 'Save and continue', exact: true })
      await submit.click()
      assert.ok(await page.locator('.govuk-error-summary__list a').count() > 0)
      assert.equal(await page.locator('.govuk-error-summary__list a[href="#changes"]').count(), 0)
      for (const fieldset of await page.locator('#san-thinking-questions-form fieldset').all()) {
        await fieldset.locator('input[type="radio"]').first().check()
      }
      await submit.click()
      await page.waitForURL(`${prefix}-changes.html`)
      assert.equal(await page.locator('main h1:visible').innerText(), 'Does Alex want to make changes to their thinking, behaviours and attitudes?')
      assert.equal(await page.locator('main fieldset').count(), 1)
      assert.equal(await page.getByRole('link', { name: 'Back', exact: true }).getAttribute('href'), 'thinking-behaviours.html')
      await submit.click()
      assert.equal(await page.locator('.govuk-error-summary__list a').count(), 1)
      for (const destination of ['sexual', 'sexual-harm']) {
        await page.goto(`${prefix}-${destination}.html`)
        await page.waitForURL(`${prefix}-changes.html`)
      }
      await page.goto(`${prefix}-summary.html`)
      await page.getByRole('link', { name: 'Continue', exact: true }).click()
      await page.waitForURL(`${prefix}-changes.html`)
      await page.locator('#changes-thinking').check()
      await page.locator('#changes-thinking-details').fill('Considering support with decision making.')
      await submit.click()
      await page.waitForURL(`${prefix}-sexual.html`)
      await page.getByRole('link', { name: 'Back', exact: true }).click()
      await page.waitForURL(`${prefix}-changes.html`)
      assert.equal(await page.locator('#changes-thinking').isChecked(), true)
      assert.equal(await page.locator('#changes-thinking-details').inputValue(), 'Considering support with decision making.')
      await submit.click()
      await page.waitForURL(`${prefix}-sexual.html`)
      for (const [width, fontSize] of [[390, '27px'], [1280, '36px']]) {
        await page.setViewportSize({ width, height: 900 })
        const heading = page.getByRole('heading', { name: 'Risk of sexual harm', level: 1, exact: true })
        assert.equal(await heading.evaluate(element => getComputedStyle(element).fontSize), fontSize)
      }
      await page.locator(`#sexual-concerns-${risk}`).check()
      await submit.click()
      if (risk === 'yes') {
        await page.waitForURL(`${prefix}-sexual-harm.html`)
        for (const fieldset of await page.locator('#san-thinking-sexual-harm-form fieldset').all()) {
          await fieldset.locator('input[type="radio"]').first().check()
        }
        await submit.click()
      }
      await page.waitForURL(`${prefix}-summary.html`)
      await page.locator('[data-tb-summary] a[href*="thinking-behaviours-changes"]').click()
      await page.waitForURL(/thinking-behaviours-changes(?:\.html)?\?from=summary#changes$/)
      assert.equal(await page.getByRole('link', { name: 'Back', exact: true }).getAttribute('href'), 'thinking-behaviours-summary.html')
      await page.locator('#changes-not-present').check()
      await submit.click()
      await page.waitForURL(`${prefix}-summary.html`)
      assert.equal((await savedSession(page, variant.key)).thinkingChanges, 'not-present')
      assert.equal((await savedSession(page, variant.key)).thinkingChangesDetails, '')
      await page.locator('[data-tb-summary] a[href^="thinking-behaviours?"]').first().click()
      await page.waitForURL(/thinking-behaviours\?from=summary#consequences$/)
      assert.equal(await page.locator('#changes').count(), 0)
      await submit.click()
      assert.deepEqual(await page.locator('.govuk-error-summary__list a').allTextContents(), [])
      await page.waitForURL(`${prefix}-summary.html`)
      assert.equal((await savedSession(page, variant.key)).thinkingChanges, 'not-present')
      await page.getByRole('tab', { name: 'Practitioner analysis', exact: true }).click()
      for (const question of ['strengths', 'harm', 'reoffending']) await page.locator(`#analysis-${question}-no`).check()
      await page.getByRole('button', { name: 'Mark as complete', exact: true }).click()
      await page.reload()
      assert.equal((await savedSession(page, variant.key)).thinkingComplete, true)
      assert.equal(await page.locator('[data-section-complete="thinking"]').isVisible(), true)
      assert.equal(await page.locator('[data-section-complete="thinking"] circle').getAttribute('fill'), '#1d70b8')
    }))
  }
}

for (const width of [1280, 390]) {
  test(`community drugs-help/${width}: reference headings preserve validation, conditional details and saved answers`, async () => withPage(async page => {
    const key = 'sanTrainingCommunityAssessment'
    const prefix = `${baseUrl}/san-training/community/`
    await seedSession(page, key, {
      drugUse: 'yes', drugTypes: ['heroin'], drugLastUsed: { heroin: 'last-six' },
      drugFrequency: { heroin: 'daily' }, injectedDrugs: ['heroin'],
      injectedWhen: { heroin: ['last-six'] }
    })
    await page.goto(`${prefix}drugs-help.html`)
    const heading = page.locator('main h1:visible')
    assert.equal(await heading.count(), 1)
    assert.equal(await heading.evaluate(node => node.childNodes[0].textContent.trim()), 'Drug use')
    assert.deepEqual(await page.locator('#san-drugs-help-form h2').allTextContents(), [
      'Does anything help Alex to stop or reduce their drug use?',
      'Does Alex seem motivated to stop or reduce their drug use?'
    ])
    assert.equal(await page.locator('#san-drugs-help-form .govuk-fieldset__legend--m').count(), 2)
    assert.equal(await page.locator('#helped-reduce-hint').innerText(), 'Consider any treatment, support networks or lifestyle changes.')
    assert.deepEqual(await page.locator('#analysis-motivation label').allTextContents(), [
      'Does not show motivation to stop or reduce', 'Shows some motivation to stop or reduce',
      'Motivated to stop or reduce', 'Unknown'
    ])
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    const submit = page.getByRole('button', { name: 'Save and continue', exact: true })
    await submit.click()
    assert.equal(await page.locator('.govuk-error-summary__list a').count(), 2)
    await page.locator('#helped-reduce-yes').check()
    assert.equal(await page.locator('#helped-reduce-yes-details').isVisible(), true)
    await page.locator('#analysis-motivation-motivated').check()
    await submit.click()
    assert.equal(await page.locator('.govuk-error-summary__list a').count(), 1)
    await page.locator('#helped-reduce-yes-details').fill('Support from a local treatment service.')
    await submit.click()
    await page.waitForURL(/drugs-changes\.html$/)
    const session = await savedSession(page, key)
    assert.equal(session.helpedReduce, 'yes')
    assert.equal(session.helpedReduceDetails, 'Support from a local treatment service.')
    assert.equal(session.drugAnalysisMotivation, 'motivated')
    await page.goto(`${prefix}drugs-help.html`)
    assert.equal(await page.locator('#helped-reduce-yes-details').inputValue(), session.helpedReduceDetails)
    assert.equal(await page.locator('#analysis-motivation-motivated').isChecked(), true)
    await page.locator('#helped-reduce-no').check()
    assert.equal(await page.locator('#helped-reduce-yes-details').isVisible(), false)
    await submit.click()
    await page.waitForURL(/drugs-changes\.html$/)
    assert.equal((await savedSession(page, key)).helpedReduceDetails, '')
    await seedSession(page, key, { ...session, drugLastUsed: { heroin: 'more-than-six' } })
    await page.goto(`${prefix}drugs-help-past.html`)
    assert.equal(await page.locator('main h1:visible').innerText(), 'Did anything help Alex to stop or reduce their drug use?')
    assert.equal(await page.locator('#analysis-motivation').count(), 0)
  }, { viewport: { width, height: 900 } }))
}

for (const custody of ['yes', 'no']) {
  for (const width of [1280, 390]) {
    test(`prison drugs-injected/${custody}/${width}: reference layout preserves wording, validation and checkbox answers`, async () => withPage(async page => {
      const key = 'sanTrainingPrisonAssessment'
      await seedSession(page, key, {
        drugUse: 'yes', drugsInCustody: custody, drugTypes: ['heroin'],
        drugLastUsed: { heroin: 'last-six' }, drugFrequency: { heroin: 'daily' },
        injectedDrugs: ['heroin'], injectedWhen: {}
      })
      const url = `${baseUrl}/san-training/prison/drugs-injected.html`
      await page.goto(url)
      const heading = page.locator('main h1:visible')
      assert.equal(await heading.count(), 1)
      assert.equal(await heading.getAttribute('class'), 'govuk-heading-l')
      assert.equal(await heading.innerText(), custody === 'yes' ? 'When has Alex injected drugs?' : 'When did Alex inject drugs?')
      assert.match(await page.locator('.san-content-header .govuk-caption-l').innerText(), /^Drug use/)
      const group = page.locator('[data-du-injected-when="heroin"]')
      assert.equal(await group.locator('legend').innerText(), 'Heroin')
      assert.equal(await group.locator('.govuk-hint').innerText(), 'Select one or both.')
      assert.deepEqual(await group.locator('label').allTextContents(), custody === 'yes'
        ? ['In the last 6 months', 'More than 6 months ago']
        : ['In the 6 months before custody', 'More than 6 months before custody'])
      assert.equal(await page.locator('[data-du-injected-when]:visible').count(), 1)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      const submit = page.getByRole('button', { name: 'Save and continue', exact: true })
      await submit.click()
      assert.equal(await page.locator('.govuk-error-summary__list a').innerText(), 'Select when Alex injected Heroin')
      await group.locator('input[value="last-six"]').check()
      await group.locator('input[value="more-than-six"]').check()
      await submit.click()
      await page.waitForURL(/drugs-help\.html$/)
      assert.deepEqual((await savedSession(page, key)).injectedWhen, { heroin: ['last-six', 'more-than-six'] })
      await page.goto(url)
      assert.equal(await group.locator('input:checked').count(), 2)
    }, { viewport: { width, height: 900 } }))
  }
}

for (const custody of ['yes', 'no']) {
  for (const width of [1280, 390]) {
    test(`prison drugs-when/${custody}/${width}: add button stays hidden and existing drugs validate and persist`, async () => withPage(async page => {
      const key = 'sanTrainingPrisonAssessment'
      for (const otherKey of sessionKeys.filter(value => value !== key)) await seedSession(page, otherKey, { sentinel: otherKey })
      await seedSession(page, key, {
        drugUse: 'yes', drugsInCustody: custody, drugTypes: ['heroin', 'other'],
        extraDrugs: [
          { id: 'extra-1', name: '', lastUsed: '' },
          { id: 'extra-2', name: 'Second example substance', lastUsed: 'more-than-six' }
        ]
      })
      const prefix = `${baseUrl}/san-training/prison/`
      await page.goto(`${prefix}drugs-when`)
      assert.equal(await page.locator('main h1').count(), 1)
      assert.equal(await page.locator('main h1').innerText(), 'When did Alex last use these drugs?')
      assert.match(await page.locator('.san-content-header .govuk-caption-l').innerText(), /^Drug use/)
      const labels = custody === 'no'
        ? ['In the 6 months before custody', 'More than 6 months before custody']
        : ['In the last 6 months', 'More than 6 months ago']
      assert.deepEqual(await page.locator('[data-du-when="heroin"] label').allTextContents(), labels)
      await page.locator('#last-used-heroin-last-six').check()
      const add = page.locator('[data-du-add-drug]')
      assert.equal(await add.isVisible(), false)
      assert.equal(await page.getByRole('button', { name: 'Add another drug', exact: true }).count(), 0)
      const extras = page.locator('[data-du-extra-item]')
      assert.equal(await extras.count(), 2)
      assert.equal(await extras.first().getByLabel('Drug name').inputValue(), '')
      assert.equal(await extras.first().locator('input:checked').count(), 0)
      assert.deepEqual(await extras.first().locator('.govuk-radios__label').allTextContents(), labels)
      const submit = page.getByRole('button', { name: 'Save and continue', exact: true })
      await submit.click()
      assert.equal(await page.locator('.govuk-error-summary__list a').count(), 2)
      await extras.first().getByLabel('Drug name').fill('First example substance')
      await extras.first().locator('input[value="last-six"]').check()
      assert.equal(await extras.count(), 2)
      assert.equal(await extras.first().getByLabel('Drug name').inputValue(), 'First example substance')
      assert.equal(await extras.first().locator('input[value="last-six"]').isChecked(), true)
      assert.equal(await page.locator('#last-used-heroin-last-six').isChecked(), true)
      await extras.nth(1).getByLabel('Drug name').fill('Second example substance')
      await extras.nth(1).locator('input[value="more-than-six"]').check()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      await submit.click()
      await page.waitForURL(/drugs-before(?:\.html)?$/)
      const saved = await savedSession(page, key)
      assert.deepEqual(saved.drugTypes, ['heroin', 'other'])
      assert.deepEqual(saved.extraDrugs, [
        { id: 'extra-1', name: 'First example substance', lastUsed: 'last-six' },
        { id: 'extra-2', name: 'Second example substance', lastUsed: 'more-than-six' }
      ])
      assert.equal(await page.locator('[data-du-frequency-extra-item]').count(), 2)
      await page.goto(`${prefix}drugs-summary`)
      assert.match(await page.locator('main').innerText(), /First example substance/)
      assert.match(await page.locator('main').innerText(), /Second example substance/)
      await page.goto(`${prefix}drugs-types`)
      assert.equal(await page.locator('input[name="drug_types"][value="other"]').isChecked(), true)
      await submit.click()
      await page.waitForURL(/drugs-when(?:\.html)?$/)
      await page.reload()
      assert.deepEqual(await extras.locator('input[type="text"]').evaluateAll(inputs => inputs.map(input => input.value)),
        ['First example substance', 'Second example substance'])
      assert.equal(await add.isVisible(), false)
      for (const otherKey of sessionKeys.filter(value => value !== key)) {
        assert.deepEqual(await savedSession(page, otherKey), { sentinel: otherKey })
      }
    }, { viewport: { width, height: 900 } }))
  }
}

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
  for (const custody of variant.name === 'prison' ? ['yes', 'no'] : ['yes']) {
    test(`${variant.name}/${custody}: Other drug validates, saves and restores a single entry`, async () => withPage(async page => {
      for (const key of sessionKeys.filter(key => key !== variant.key)) await seedSession(page, key, { sentinel: key })
      await seedSession(page, variant.key, { drugUse: 'yes', drugsInCustody: custody })
      await page.goto(`${baseUrl}/san-training/${variant.name}/drugs-types`)
      await page.locator('input[name="drug_types"][value="heroin"]').check()
      await page.locator('input[name="drug_types"][value="other"]').check()
      await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
      await page.waitForURL(/drugs-when(?:\.html)?$/)
      const extra = page.locator('[data-du-extra-item]')
      await extra.waitFor({ state: 'visible' })
      assert.equal(await extra.count(), 1)
      assert.equal(await page.locator('[data-du-add-drug]').count(), variant.name === 'prison' ? 1 : 0)
      assert.equal(await page.locator('[data-du-add-drug]:visible').count(), 0)
      assert.equal(await page.locator('[data-du-remove-drug]').count(), 0)
      await page.getByRole('heading', { name: 'Add \u2018other\u2019 drug', exact: true }).waitFor()
      await extra.getByRole('heading', { name: 'When was this drug last used?', exact: true }).waitFor()
      assert.equal(await extra.getByRole('heading', { name: /^Drug \d/ }).count(), 0)
      assert.equal(await extra.locator('hr').count(), 0)
      assert.deepEqual(await extra.locator('.govuk-radios__label').allTextContents(), await page.locator('[data-du-when="heroin"] .govuk-radios__label').allTextContents())
      await page.locator('#last-used-heroin-last-six').check()
      await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
      assert.equal(await page.locator('.govuk-error-summary__list a').count(), 2)
      await page.getByLabel('Drug name', { exact: true }).fill('Example substance')
      await extra.locator('input[value="last-six"]').check()
      await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
      await page.waitForURL(/drugs-before(?:\.html)?$/)
      const saved = await savedSession(page, variant.key)
      assert.deepEqual(saved.extraDrugs, [{ id: 'extra-1', name: 'Example substance', lastUsed: 'last-six' }])
      await page.goto(`${baseUrl}/san-training/${variant.name}/drugs-when`)
      assert.equal(await page.getByLabel('Drug name', { exact: true }).inputValue(), 'Example substance')
      assert.equal(await extra.locator('input[value="last-six"]').isChecked(), true)
      for (const key of sessionKeys.filter(key => key !== variant.key)) assert.deepEqual(await savedSession(page, key), { sentinel: key })
    }))
  }

  test(`${variant.name}: Other drug is available alone and removed by deselecting Other`, async () => withPage(async page => {
    await seedSession(page, variant.key, { drugUse: 'yes', drugsInCustody: 'no', drugTypes: ['other'] })
    await page.goto(`${baseUrl}/san-training/${variant.name}/drugs-when`)
    await page.getByRole('heading', { name: 'Add \u2018other\u2019 drug', exact: true }).waitFor()
    assert.equal(await page.locator('[data-du-extra-item]').count(), 1)
    await page.getByLabel('Drug name', { exact: true }).fill('Example substance')
    await page.locator('[data-du-extra-item] input[value="more-than-six"]').check()
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/drugs-before(?:\.html)?$/)
    await page.goto(`${baseUrl}/san-training/${variant.name}/drugs-types`)
    await page.locator('input[name="drug_types"][value="other"]:checked').waitFor()
    await page.locator('input[name="drug_types"][value="other"]').uncheck()
    await page.locator('input[name="drug_types"][value="heroin"]').check()
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/drugs-when(?:\.html)?$/)
    assert.equal(await page.locator('[data-du-extra-drugs]').isVisible(), false)
    assert.equal(await page.locator('[data-du-extra-item], [data-du-remove-drug]').count(), 0)
    assert.equal(await page.locator('[data-du-add-drug]').count(), variant.name === 'prison' ? 1 : 0)
    assert.equal(await page.locator('[data-du-add-drug]:visible').count(), 0)
    assert.deepEqual((await savedSession(page, variant.key)).extraDrugs, [])
    await page.locator('#last-used-heroin-last-six').check()
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/drugs-before(?:\.html)?$/)
  }))

  test(`${variant.name}: Other drug summary edits preserve previously saved entries`, async () => withPage(async page => {
    const extras = [
      { id: 'extra-1', name: 'First substance', lastUsed: 'last-six' },
      { id: 'extra-2', name: 'Second substance', lastUsed: 'more-than-six' }
    ]
    await seedSession(page, variant.key, {
      drugUse: 'yes', drugsInCustody: 'yes', drugTypes: ['heroin', 'other'],
      drugLastUsed: { heroin: 'last-six' }, extraDrugs: extras,
      drugFrequency: { heroin: 'occasionally', 'extra-1': 'occasionally', 'extra-2': 'occasionally' }, injectedDrugs: ['none']
    })
    await page.goto(`${baseUrl}/san-training/${variant.name}/drugs-summary`)
    await page.locator('a[href*="drugs-when"][href*="extra-1"]').first().click()
    await page.waitForURL(/drugs-when/)
    await page.getByLabel('Drug name', { exact: true }).fill('Updated substance')
    assert.equal(await page.locator('[data-du-extra-item]').count(), 1)
    assert.equal(await page.locator('[data-du-add-drug]:visible, [data-du-remove-drug]').count(), 0)
    await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
    await page.waitForURL(/drugs-summary(?:\.html)?$/)
    assert.deepEqual((await savedSession(page, variant.key)).extraDrugs, [{ ...extras[0], name: 'Updated substance' }, extras[1]])
  }))

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
for (const variant of variants) {
  for (const [section, file, completeKey] of analysisSections) {
    test(`${variant.name} training ${section}: completion updates immediately and survives refresh`, async () => withPage(async page => {
      await page.goto(`${baseUrl}/san-training/${variant.name}/${file}-summary.html#practitioner-analysis`)
      const complete = page.getByRole('button', { name: 'Mark as complete', exact: true })
      await complete.click()
      assert.equal(await page.locator('.govuk-error-summary__list a').count(), 3)
      assert.equal(await page.locator(`[data-section-complete="${section}"]`).isVisible(), false)
      for (const question of ['strengths', 'harm', 'reoffending']) await page.locator(`label[for="analysis-${question}-no"]`).click()
      await complete.click()
      for (const refresh of [false, true]) {
        if (refresh) await page.reload()
        await page.locator('[data-san-status]').filter({ hasText: /^Complete$/ }).waitFor()
        assert.equal(await page.locator(`[data-section-complete="${section}"]`).isVisible(), true)
        assert.equal(await page.locator(`[data-section-complete="${section}"] circle`).getAttribute('fill'), '#1d70b8')
        assert.equal(await page.locator('#practitioner-analysis .govuk-summary-list__row').count(), 3)
        assert.equal((await savedSession(page, variant.key))[completeKey], true)
      }
    }))
  }
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
  for (const file of ['index.html', 'community/index.html', 'community/accommodation/index.html', 'prison/index.html', 'prison/journeys.html']) {
    const url = new URL(file, root)
    const content = await readFile(url, 'utf8')
    const assets = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      return [...doc.querySelectorAll('img[src]')].map(image => image.getAttribute('src'))
    }, content)
    assert.ok(assets.length > 0, file)
    for (const asset of assets) await access(new URL(asset, url))
    assert.doesNotMatch(content, /href=["'][^"']*\/(?:san-research|san-prison)\//)
    assert.doesNotMatch(content, /community\/overview\.html/)
  }
  await assert.rejects(access(new URL('community/overview.html', root)), { code: 'ENOENT' })
  for (const file of ['community/index.html', 'prison/journeys.html']) {
    await page.goto(new URL(file, root).href)
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager' }))
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))
    assert.equal(await page.locator('[role="tab"]').count(), 9)
    assert.equal(await page.locator('.journey__header').count(), 20)
    await page.getByRole('tab', { name: 'Drug use', exact: true }).click()
    assert.equal(await page.locator('#drugs').isVisible(), true)
    assert.equal(await page.locator('#accommodation').isVisible(), false)
  }
}))

test('every journey PNG is a verified capture of its own training variant, not a copied research image', async () => withPage(async page => {
  const root = new URL('../storyboards/', import.meta.url)
  const referenceHtml = await readFile(new URL('san-research/index.html', root), 'utf8')
  const reference = await page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return [...doc.querySelectorAll('.tab-panel')].map(section => ({
      id: section.id,
      scenarios: [...section.querySelectorAll('.journey')].map(journey =>
        journey.querySelector('img').getAttribute('src').split('/').pop().split('__')[0]),
      images: [...section.querySelectorAll('img')].map(image => image.getAttribute('src'))
    }))
  }, referenceHtml)
  const digest = data => createHash('sha256').update(data).digest('hex')
  const researchHashes = new Set()
  for (const section of reference) {
    for (const image of section.images) {
      researchHashes.add(digest(await readFile(new URL(`san-research/${image}`, root))))
    }
  }
  for (const [variant, filename] of [['community', 'index.html'], ['prison', 'journeys.html']]) {
    const directory = new URL(`san-training/${variant}/`, root)
    const captures = JSON.parse(await readFile(new URL('captures.json', directory), 'utf8'))
    await page.goto(new URL(filename, directory).href)
    assert.equal(await page.locator('.card img').count(), captures.length)
    const assets = await page.locator('.card img').evaluateAll(images => images.map(image => image.getAttribute('src')))
    const cards = await page.locator('.card').evaluateAll(nodes => nodes.map(node => ({
      title: node.querySelector('.card__title').textContent,
      alt: node.querySelector('img').alt
    })))
    assert.equal(new Set(assets).size, captures.length)
    for (const section of reference) {
      assert.deepEqual([...new Set(captures.filter(capture => capture.section === section.id).map(capture => capture.scenario))], section.scenarios)
      for (const scenario of section.scenarios) {
        const journey = captures.filter(capture => capture.section === section.id && capture.scenario === scenario)
        if (section.id === 'employment') {
          assert.equal(journey[0].title, variant === 'community'
            ? "What is Alex's current employment status?"
            : "What was Alex's employment status before custody?")
        }
        if (section.id === 'relationships') {
          const screens = journey.filter(capture => capture.stage === 'questions').map(capture =>
            new URL(capture.url).pathname.split('/').pop().replace(/\.html$/, '').replace('personal-relationships-', ''))
          assert.deepEqual(screens, scenario === '01-children-and-abuse'
            ? ['children', 'child-details', 'questions', 'perpetrator',
                'domestic-abuse', 'strangulation', 'victim', 'victim-who', 'changes']
            : ['children', 'questions', 'perpetrator', 'victim', 'changes'],
          `${variant}/${scenario}: incorrect relationship screen sequence`)
          if (scenario === '01-children-and-abuse') {
            assert.equal(journey.find(capture => new URL(capture.url).pathname.endsWith('/personal-relationships-victim-who.html')).title, 'Who committed the abuse against Alex?')
          }
        }
        if (section.id === 'thinking') {
          const screens = journey.filter(capture => capture.stage === 'questions').map(capture =>
            new URL(capture.url).pathname.split('/').pop().replace(/\.html$/, ''))
          assert.deepEqual(screens, [
            'thinking-behaviours', 'thinking-behaviours-changes', 'thinking-behaviours-sexual',
            ...(scenario === '02-risk-sexual-harm' ? ['thinking-behaviours-sexual-harm'] : [])
          ], `${variant}/${scenario}: incorrect thinking screen sequence`)
          assert.equal(journey[1].title, 'Does Alex want to make changes to their thinking, behaviours and attitudes?')
          assert.equal(journey[2].title, 'Risk of sexual harm')
        }
        const final = journey.at(-1)
        assert.equal(final.stage, 'complete', `${variant}/${section.id}/${scenario}`)
        assert.equal(final.complete, true)
        assert.ok(journey.some(capture => capture.stage === 'summary'))
        if (section.id === 'offence') {
          assert.equal(journey.filter(capture => capture.stage.startsWith('analysis')).length, 0)
        } else if (['02-no-further', '03-none', '03-never'].includes(scenario)) {
          const exempt = journey.find(capture => capture.stage === 'analysis-not-required')
          assert.equal(exempt.tab, 'Practitioner analysis')
          assert.equal(exempt.answeredAnalysisQuestions, 0)
        } else {
          assert.deepEqual(journey.slice(-3).map(capture => capture.stage), ['analysis', 'analysis-answered', 'complete'])
          assert.equal(journey.at(-3).answeredAnalysisQuestions, 0)
          assert.equal(journey.at(-2).answeredAnalysisQuestions, 3)
          assert.equal(journey.at(-2).complete, false)
          assert.equal(final.tab, 'Practitioner analysis')
        }
      }
    }
    for (const [index, capture] of captures.entries()) {
      const asset = `images/${capture.section}/${capture.file}`
      assert.ok(assets.includes(asset), asset)
      assert.ok(new URL(capture.url).pathname.startsWith(`/san-training/${variant}/`), capture.url)
      assert.equal(capture.phase, 'beta')
      assert.ok(capture.heading.trim())
      const title = `${capture.heading}${capture.tab && capture.heading !== capture.tab ? ` - ${capture.tab}` : ''}${capture.stage === 'complete' ? ' - Complete' : ''}`
      assert.equal(capture.title, title)
      assert.deepEqual(cards[index], { title, alt: title })
      const image = await readFile(new URL(asset, directory))
      assert.equal(digest(image), capture.sha256, asset)
      assert.equal(researchHashes.has(capture.sha256), false, `Copied research PNG: ${asset}`)
    }
    const paths = captures.map(capture => new URL(capture.url).pathname.replace(/\.html$/, ''))
    for (const required of ['drugs-types', 'drugs-when', 'drugs-before', 'drugs-injected', 'drugs-help', 'drugs-help-past']) {
      assert.ok(paths.some(path => path.endsWith(`/${required}`)), `${variant} missing ${required}`)
    }
    if (variant === 'prison') {
      assert.ok(paths.some(path => path.endsWith('/drugs-custody')))
      assert.equal(captures.filter(capture => capture.section === 'finances' && new URL(capture.url).pathname.replace(/\.html$/, '').endsWith('/finances-custody-income')).length, 2)
      assert.ok(captures.some(capture => capture.title === 'Where does Alex get their money from in custody?'))
      assert.ok(captures.some(capture => capture.title === "What was Alex's employment status before custody?"))
      assert.ok(captures.some(capture => new URL(capture.url).searchParams.get('step') === 'release-plans'))
    }
    for (const section of reference) {
      const files = (await readdir(new URL(`images/${section.id}/`, directory))).filter(file => file.endsWith('.png')).sort()
      assert.deepEqual(files, captures.filter(capture => capture.section === section.id).map(capture => capture.file).sort(),
        `${variant}/${section.id}: stale or missing PNGs`)
    }
  }
}))

for (const variant of variants) {
  for (const hasChildrenAndAbuse of [true, false]) {
    test(`${variant.name} relationships: ${hasChildrenAndAbuse ? 'victim Yes opens who before changes' : 'no children or abuse skips follow-up screens'}`, async () => withPage(async page => {
      await seedSession(page, variant.key, {
        relationshipsChildren: [hasChildrenAndAbuse ? 'yes' : 'no'],
        relationshipsChildrenList: hasChildrenAndAbuse ? [{
          name: 'Example child', age: '10', relationship: 'parent', livesWith: 'no',
          parentalResponsibility: 'no', contact: 'yes'
        }] : [],
        relationshipsHistory: 'mixed', relationshipsPartner: 'apart',
        relationshipsStatus: 'concerns', relationshipsParenting: 'sometimes',
        relationshipsFamily: 'mixed', relationshipsChildhood: 'some-challenges',
        relationshipsChildhoodBehaviour: 'no', relationshipsBelonging: 'no'
      })
      const prefix = `${baseUrl}/san-training/${variant.name}/personal-relationships-`
      const advance = async screen => {
        await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
        await page.waitForURL(url => url.pathname.replace(/\.html$/, '').endsWith(`/personal-relationships-${screen}`))
      }
      await page.goto(`${prefix}children`)
      await advance(hasChildrenAndAbuse ? 'children-list' : 'questions')
      if (hasChildrenAndAbuse) {
        await page.locator('#add-another-child-no').check()
        await advance('questions')
      }
      await advance('perpetrator')
      await page.locator(hasChildrenAndAbuse ? '#behaviour-yes' : '#behaviour-no').check()
      await advance(hasChildrenAndAbuse ? 'domestic-abuse' : 'victim')
      if (hasChildrenAndAbuse) {
        await page.locator('#abuse-partner').check()
        await page.locator('#abuse-partner-details').fill('Concerns about a previous relationship.')
        await page.locator('#coercive-no').check()
        await advance('strangulation')
        await page.locator('#strangulation-no').check()
        await advance('victim')
      }
      await page.getByRole('heading', { name: 'Is there evidence that Alex has ever been a victim of domestic abuse?', exact: true }).waitFor()
      await page.locator(hasChildrenAndAbuse ? '#victim-yes' : '#victim-no').check()
      await advance(hasChildrenAndAbuse ? 'victim-who' : 'changes')
      if (hasChildrenAndAbuse) {
        await page.getByRole('heading', { name: 'Who committed the abuse against Alex?', exact: true }).waitFor()
        await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
        assert.equal(await page.locator('.govuk-error-summary__list a').count(), 1)
        await page.locator('#victim-who-family').check()
        await page.getByRole('button', { name: 'Save and continue', exact: true }).click()
        assert.equal(await page.locator('.govuk-error-summary a[href="#victim-who-family-details"]').count(), 1)
        await page.locator('#victim-who-family-details').fill('Reports abuse by a family member.')
        await advance('changes')
        const saved = await savedSession(page, variant.key)
        assert.deepEqual(saved.relationshipsVictimWho, ['family'])
        assert.equal(saved.relationshipsVictimWhoDetails.family, 'Reports abuse by a family member.')
      } else {
        const saved = await savedSession(page, variant.key)
        assert.deepEqual(saved.relationshipsAbuseWho, [])
        assert.deepEqual(saved.relationshipsVictimWho, [])
        assert.equal(saved.relationshipsStrangulation, '')
      }
    }))
  }

  test(`${variant.name} storyboard accommodation titles match the visible training questions, not hidden headings`, async () => withPage(async page => {
    await seedSession(page, variant.key, {
      hasSomewhereToLive: 'yes', accommodationSettled: 'yes', accommodationType: 'settled',
      releasePlans: 'yes', livingWith: ['friends'], locationSuitable: 'no',
      accommodationSuitable: 'yes-concerns', changes: 'need-help',
      locationConcernsSeen: true, suitabilityConcernsSeen: true
    })
    const captures = JSON.parse(await readFile(new URL(`../storyboards/san-training/${variant.name}/captures.json`, import.meta.url), 'utf8'))
    const accommodation = variant.name === 'prison' ? 'proposed accommodation' : 'accommodation'
    for (const [step, expected] of [
      ['location', `Is the location of Alex's ${accommodation} suitable?`],
      ['suitable', `Is Alex's ${accommodation} suitable?`],
      ['changes', variant.name === 'prison'
        ? 'Does Alex want to make changes to their living arrangements when they are released?'
        : 'Does Alex want to make changes to their accommodation?']
    ]) {
      await page.goto(`${baseUrl}/san-training/${variant.name}/accommodation-details?step=${step}`)
      const heading = page.locator('main h1:visible')
      assert.equal(await heading.count(), 1)
      const text = (await heading.innerText()).replace(/\s+/g, ' ').trim()
      assert.equal(text, expected)
      const screen = captures.find(capture => capture.section === 'accommodation'
        && capture.scenario === '01-settled-with-concerns'
        && new URL(capture.url).searchParams.get('step') === step
        && new URL(capture.url).pathname.endsWith('/accommodation-details'))
      assert.ok(screen, `${variant.name}: missing ${step} capture`)
      assert.equal(screen.title, text)
    }
  }))
}