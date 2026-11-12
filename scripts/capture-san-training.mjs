import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storyboardDir = path.join(root, 'storyboards', 'san-training')
const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const sectionPages = {
  accommodation: 'accommodation', employment: 'employment', finances: 'finances',
  drugs: 'drugs', alcohol: 'alcohol', health: 'health',
  relationships: 'personal-relationships-children', thinking: 'thinking-behaviours',
  offence: 'offence-analysis'
}

// Synthetic scenario answers are restored by the training pages themselves.
const answers = {
  accommodation: {
    hasSomewhereToLive: 'yes', accommodationSettled: 'yes', accommodationType: 'settled',
    releasePlans: 'yes', livingWith: ['friends'], locationSuitable: 'no',
    locationReasons: ['associates'], accommodationSuitable: 'yes-concerns',
    suitabilityReasons: ['overcrowding'], noAccommodationReasons: ['financial'],
    changes: 'need-help', changesDetails: 'Would like support finding suitable accommodation.'
  },
  employment: {
    employmentStatus: 'employed-or-self-employed', employmentHistory: 'continuous',
    commitments: ['none'], qualifications: 'yes', qualificationsDetails: 'GCSEs in English and maths.',
    skills: 'some', difficulties: ['none'], difficultyLevels: {},
    employmentChanges: 'active', employmentChangesDetails: 'Looking for further training.'
  },
  finances: {
    financeIncome: ['employment', 'family'], financeOverreliant: 'yes',
    financeOverreliantDetails: 'Parents pay rent and give cash most weeks.',
    financeCustodyIncome: ['employment', 'family'],
    financeFurtherAssessment: 'yes', financeMoneyManagement: 'necessities',
    financeDebt: ['own'], financeDebtTypes: { own: ['formal'] },
    financeDebtDetails: { own: { formal: 'Phone bill arrears.' } },
    financeChanges: 'need-help', financeChangesDetails: 'Would like help budgeting.'
  },
  drugs: {
    drugUse: 'yes', drugTypes: ['heroin'], drugLastUsed: { heroin: 'last-six' },
    drugFrequency: { heroin: 'daily' }, injectedDrugs: ['heroin'],
    injectedWhen: { heroin: ['last-six'] }, extraDrugs: [],
    drugsInCustody: 'yes', treatment: 'no', whyDrugUse: ['curiosity'],
    drugAffect: ['behaviour'], helpedReduce: 'no', drugAnalysisMotivation: 'unknown', drugChanges: 'thinking',
    drugChangesDetails: 'Considering support to reduce drug use.'
  },
  alcohol: {
    alcoholUse: 'significant', alcoholEvidence: 'some', alcoholPastIssues: 'yes',
    alcoholPastIssuesDetails: 'Alcohol has affected relationships in the past.',
    alcoholHelp: 'no', alcoholChanges: 'thinking',
    alcoholChangesDetails: 'Considering support to reduce drinking.'
  },
  health: {
    healthPhysical: 'yes', healthPhysicalDetails: 'Asthma, managed with an inhaler.',
    healthMental: 'yes', healthMentalDescribe: 'ongoing-no-significant-impact',
    healthMentalDetails: 'Anxiety, supported by their GP.', healthPsychiatric: 'no',
    healthLearning: 'no', healthCope: 'well', healthGambling: ['no'],
    healthAttitude: 'positive', healthSelfHarm: 'no', healthSuicide: 'no',
    healthChanges: 'maintain', healthChangesDetails: 'Continue attending GP appointments.'
  },
  relationships: {
    relationshipsChildren: ['lived-with'],
    relationshipsChildrenDetails: 'Example child, aged 10, sex unknown. Alex is their parent.',
    relationshipsChildrenList: [],
    relationshipsChildrenImpact: 'The child misses regular contact with Alex.',
    relationshipsChildrenVisiting: 'yes',
    relationshipsChildrenVisitingDetails: 'Example child, aged 10, visits their parent Alex once a month.',
    relationshipsParenting: 'yes',
    relationshipsParentingDetails: 'Shared parenting responsibilities.',
    relationshipsParentingManagement: 'sometimes',
    relationshipsHistory: 'mixed', relationshipsPartner: 'apart',
    relationshipsStatus: 'concerns',
    relationshipsFamily: 'mixed', relationshipsChildhood: 'some-challenges',
    relationshipsChildhoodBehaviour: 'no', relationshipsBelonging: 'yes',
    relationshipsBelongingDetails: 'Friends and a local community group.',
    relationshipsBehaviour: 'yes', relationshipsAbuseWho: ['partner'],
    relationshipsAbuseWhoDetails: { partner: 'Concerns about a previous relationship.' },
    relationshipsCoercive: 'yes', relationshipsCoerciveDetails: 'Controlling behaviour in a previous relationship.',
    relationshipsStrangulation: 'no', relationshipsVictim: 'yes',
    relationshipsChanges: 'need-help', relationshipsChangesDetails: 'Would like support with healthy relationships.'
  },
  thinking: {
    thinkingConsequences: 'yes', thinkingStable: 'sometimes', thinkingActivities: 'sometimes',
    thinkingPeers: 'sometimes', thinkingPeersDetails: 'Sometimes influenced by peers.',
    thinkingContacts: 'A wing officer and peer mentor provide positive support.',
    thinkingProblems: 'limited', thinkingViews: 'assumes', thinkingManipulative: 'none',
    thinkingTemper: 'sometimes', thinkingViolence: 'some', thinkingImpulse: 'sometimes',
    thinkingHostile: 'some', thinkingSupervision: 'some', thinkingExcuse: 'sometimes',
    thinkingChanges: 'thinking', thinkingChangesDetails: 'Considering ways to manage impulsive behaviour.',
    thinkingSexualConcerns: 'no', thinkingPreoccupation: 'some',
    thinkingInterests: 'no', thinkingIntimacy: 'no'
  },
  offence: {
    offenceDescription: 'Example index offence involving a direct victim.',
    offenceElements: ['violence'], offenceMotivations: ['financial'],
    offenceWhy: 'Financial difficulties contributed to the offence.',
    offenceCommittedAgainst: ['people'],
    offenceVictims: [{ relationship: 'stranger', age: '26-49', sex: 'unknown', ethnicity: 'unknown' }],
    offenceInvolved: '1', offenceLeader: 'no', offenceRecognise: 'yes',
    offenceResponsibility: 'yes', offencePatterns: 'Similar offences have occurred during financial difficulties.',
    offenceEscalation: 'no', offenceLinked: 'no'
  }
}
const overrides = {
  '02-no-accommodation': {
    hasSomewhereToLive: 'no', accommodationType: 'none', accommodationSettled: '',
    releasePlans: 'no'
  },
  '02-unemployed-never': { employmentStatus: 'unemployed', employedBefore: 'no', employmentHistory: '' },
  '03-reading-support': { difficulties: ['reading'], difficultyLevels: { reading: 'significant' } },
  '02-no-further': { financeIncome: ['employment'], financeOverreliant: '', financeFurtherAssessment: 'no' },
  '02-no-inject': {
    drugTypes: ['cannabis'], drugLastUsed: { cannabis: 'more-than-six' },
    drugFrequency: { cannabis: 'weekly' }, injectedDrugs: ['none'], injectedWhen: {},
    drugsInCustody: 'no'
  },
  '03-none': { drugUse: 'no', drugTypes: [], injectedDrugs: [] },
  '02-past-issues': { alcoholUse: 'none' },
  '03-never': { alcoholUse: 'never' },
  '02-no-children': {
    relationshipsChildren: ['no'], relationshipsChildrenList: [],
    relationshipsChildrenDetails: '', relationshipsChildrenImpact: '',
    relationshipsChildrenVisiting: '', relationshipsChildrenVisitingDetails: '',
    relationshipsParenting: '', relationshipsParentingDetails: '',
    relationshipsParentingManagement: '',
    relationshipsBehaviour: 'no', relationshipsCoercive: 'no',
    relationshipsAbuseWho: [], relationshipsVictim: 'no', relationshipsVictimWho: []
  },
  '02-risk-sexual-harm': { thinkingSexualConcerns: 'yes' },
  '02-other': {
    offenceDescription: 'Example index offence without a direct victim.',
    offenceElements: ['none'], offenceCommittedAgainst: ['other'],
    offenceCommittedOtherDetails: 'Damage to an unoccupied property.', offenceVictims: []
  }
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]))
const hash = data => createHash('sha256').update(data).digest('hex')
const variants = [['community', 'Community', 'index.html'], ['prison', 'Prison', 'journeys.html']]
const { values: filters } = parseArgs({
  options: { variant: { type: 'string' }, section: { type: 'string', multiple: true } }
})
assert.ok(!filters.variant || variants.some(([variant]) => variant === filters.variant), 'Unknown training variant')
assert.ok(!filters.section || filters.section.every(section => Object.hasOwn(sectionPages, section)), 'Unknown storyboard section')
const completeKeys = {
  accommodation: 'accommodationComplete', employment: 'employmentComplete',
  finances: 'financeComplete', drugs: 'drugComplete', alcohol: 'alcoholComplete',
  health: 'healthComplete', relationships: 'relationshipsComplete',
  thinking: 'thinkingComplete', offence: 'offenceComplete'
}
const analysisQuestions = ['strengths', 'harm', 'reoffending']
const noAnalysisScenarios = new Set(['02-no-further', '03-none', '03-never'])
const browser = await chromium.launch({ headless: true })

try {
  const cataloguePage = await browser.newPage()
  const reference = await readFile(path.join(root, 'storyboards', 'san-research', 'index.html'), 'utf8')
  const catalogue = await cataloguePage.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return {
      style: doc.querySelector('style').textContent.replace(/[ \t]+$/gm, ''),
      script: doc.querySelector('script').textContent,
      sections: [...doc.querySelectorAll('.tab-panel')].map(section => ({
        id: section.id,
        title: doc.querySelector(`#tab-${section.id}`).textContent,
        journeys: [...section.querySelectorAll('.journey')].map(journey => ({
          id: journey.querySelector('img').getAttribute('src').split('/').pop().split('__')[0],
          title: journey.querySelector('h2').textContent
        }))
      }))
    }
  }, reference)
  await cataloguePage.close()

  const documentHtml = (title, body, script = '') => `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><style>${catalogue.style}
nav.links { display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 24px; }
.card a { color: var(--link); }
</style></head><body>${body}<script>${script}</script></body></html>
`
  const renderSections = (sections, variant) => {
    const tabs = sections.map((section, index) => `<a class="tabs__tab" role="tab" href="#${section.id}" id="tab-${section.id}" aria-selected="${index === 0}" aria-controls="${section.id}">${escapeHtml(section.title)}</a>`).join('')
    const panels = sections.map((section, index) => `<section class="tab-panel" role="tabpanel" id="${section.id}" aria-labelledby="tab-${section.id}"${index ? ' hidden' : ''}>
<h2>${escapeHtml(section.title)}</h2>
${section.journeys.map(journey => `<section class="journey"><header class="journey__header"><h2>${escapeHtml(journey.title)}</h2>
<p>Captured from the ${escapeHtml(variant)} training prototype in journey order.</p></header>
<ol class="journey__steps">${journey.steps.map((step, stepIndex) => `<li class="card">
<p class="card__step">Step ${stepIndex + 1}</p><h3 class="card__title">${escapeHtml(step.title)}</h3>
${step.note ? `<p class="card__note">${escapeHtml(step.note)}</p>` : ''}
<p class="card__file">${escapeHtml(step.file)}</p>
<p><a href="${escapeHtml(step.url)}">Open training screen</a> | <a href="images/${section.id}/${step.file}" download>Download PNG</a></p>
<a href="images/${section.id}/${step.file}"><img src="images/${section.id}/${step.file}" alt="${escapeHtml(step.title)}"></a>
</li>`).join('\n')}</ol></section>`).join('\n')}</section>`).join('\n')
    return `<nav class="tabs" role="tablist" aria-label="SAN training sections">${tabs}</nav>${panels}`
  }

  const firstScreens = {}
  for (const [variant, label, filename] of variants) {
    if (filters.variant && variant !== filters.variant) continue
    const previousCaptures = filters.section
      ? JSON.parse(await readFile(path.join(storyboardDir, variant, 'captures.json'), 'utf8'))
      : []
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce'
    })
    await context.addInitScript(() => {
      const scenario = JSON.parse(sessionStorage.getItem('trainingStoryboardScenario') || 'null')
      if (scenario) {
        const current = JSON.parse(sessionStorage.getItem(scenario.key) || '{}')
        sessionStorage.setItem(scenario.key, JSON.stringify({ ...current, ...scenario.session }))
      }
    })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const prefix = `/san-training/${variant}/`
    const key = variant === 'community' ? 'sanTrainingCommunityAssessment' : 'sanTrainingPrisonAssessment'
    await page.goto(`${baseUrl}${prefix}accommodation`)
    const captured = []
    const manifest = []

    const verifyTraining = async () => {
      assert.ok(new URL(page.url()).pathname.startsWith(prefix), `Not a ${variant} training screen: ${page.url()}`)
      await page.locator('[data-san-status]').waitFor()
      assert.equal((await page.locator('.govuk-phase-banner__content strong').innerText()).trim().toLowerCase(), 'beta', page.url())
      const scripts = await page.evaluate(() => performance.getEntriesByType('resource').map(resource => new URL(resource.name).pathname))
      assert.ok(scripts.some(src => src.startsWith(`/public/javascripts/san-training/${variant}/`)), `Missing ${variant} training scripts: ${page.url()}`)
      assert.deepEqual(errors, [], `Browser errors on ${page.url()}`)
    }

    for (const section of catalogue.sections) {
      if (filters.section && !filters.section.includes(section.id)) {
        const journeys = section.journeys.map(scenario => {
          const steps = previousCaptures.filter(capture => capture.section === section.id && capture.scenario === scenario.id)
          assert.ok(steps.length, `Missing existing captures: ${variant}/${section.id}/${scenario.id}`)
          manifest.push(...steps)
          return { ...scenario, steps }
        })
        captured.push({ ...section, journeys })
        continue
      }
      const journeys = []
      const imagesDir = path.join(storyboardDir, variant, 'images', section.id)
      await mkdir(imagesDir, { recursive: true })
      const kept = new Set()
      for (const scenario of section.journeys) {
        const session = { ...answers[section.id], ...overrides[scenario.id] }
        await page.evaluate(({ key, session }) => {
          sessionStorage.clear()
          sessionStorage.setItem('trainingStoryboardScenario', JSON.stringify({ key, session }))
          sessionStorage.setItem(key, JSON.stringify(session))
        }, { key, session })
        const start = `${baseUrl}${prefix}${sectionPages[section.id]}`
        assert.equal((await page.goto(start)).status(), 200, start)
        const steps = []
        const visited = new Set()
        const visibleHeading = async () => {
          const heading = page.locator('main h1:visible')
          assert.equal(await heading.count(), 1, `Expected one visible page heading: ${page.url()}`)
          return heading.evaluate(node => {
            const copy = node.cloneNode(true)
            copy.querySelectorAll('.govuk-visually-hidden').forEach(child => child.remove())
            return copy.textContent.replace(/\s+/g, ' ').trim()
          })
        }
        const assertComplete = async () => {
          await page.locator('[data-san-status]').filter({ hasText: /^Complete$/ }).waitFor()
          assert.ok(await page.locator('[data-san-status]').evaluate(node => node.classList.contains('govuk-tag--light-blue')))
          const tick = page.locator(`[data-section-complete="${section.id}"]`)
          await tick.waitFor({ state: 'visible' })
          assert.equal(await tick.locator('circle').getAttribute('fill'), '#1d70b8', 'Completion tick must be blue')
          assert.equal(await page.evaluate(({ key, completeKey }) => JSON.parse(sessionStorage.getItem(key))[completeKey],
            { key, completeKey: completeKeys[section.id] }), true, `${variant}/${section.id} completion not saved`)
        }
        const capture = async (stage = 'questions', note = '') => {
          await verifyTraining()
          await page.evaluate(async () => {
            await document.fonts.ready
            document.querySelectorAll('.govuk-cookie-banner, #global-cookie-message').forEach(node => node.remove())
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
            window.scrollTo(0, 0)
          })
          const url = page.url()
          const parsed = new URL(url)
          const slug = `${parsed.pathname.split('/').pop().replace(/\.html$/, '')}${parsed.searchParams.has('step') ? `-${parsed.searchParams.get('step')}` : ''}${stage === 'questions' ? '' : `-${stage}`}`
          const file = `${scenario.id}__${String(steps.length + 1).padStart(2, '0')}__${slug}.png`
          const heading = await visibleHeading()
          const activeTab = page.locator('.govuk-tabs__list-item--selected .govuk-tabs__tab')
          const tab = await activeTab.count() ? (await activeTab.innerText()).trim() : ''
          const title = `${heading}${tab && heading !== tab ? ` - ${tab}` : ''}${stage === 'complete' ? ' - Complete' : ''}`
          const answeredAnalysisQuestions = await page.locator('#practitioner-analysis input[type="radio"]:checked').count()
          const complete = await page.locator(`[data-section-complete="${section.id}"]`).isVisible()
          if (stage === 'complete') await assertComplete()
          const image = await page.screenshot({ path: path.join(imagesDir, file), fullPage: true })
          assert.equal(await visibleHeading(), heading, `Heading changed during capture: ${url}`)
          const step = { file, title, url, note }
          steps.push(step)
          manifest.push({
            section: section.id, scenario: scenario.id, ...step,
            heading, tab, stage, complete, answeredAnalysisQuestions,
            phase: 'beta', sha256: hash(image)
          })
          kept.add(file)
        }

        for (let count = 0; count < 40; count += 1) {
          await verifyTraining()
          const url = page.url()
          assert.ok(!visited.has(url), `Journey loop: ${variant}/${section.id}/${scenario.id}: ${url}`)
          visited.add(url)
          const pathname = new URL(url).pathname.replace(/\.html$/, '')
          const victimList = pathname.endsWith('/offence-analysis-victim-details')
          if (pathname.endsWith('/personal-relationships-victim-who')) {
            await page.locator('#victim-who-partner').check()
            await page.locator('#victim-who-partner-details').fill('Reports abuse in a previous relationship.')
          }
          if (victimList) {
            await page.goto(`${baseUrl}${prefix}offence-analysis-victim?victim=0`)
            await capture()
            await page.goto(url)
          }
          await capture(pathname.endsWith('-summary') ? 'summary' : 'questions')
          if (victimList) {
            await page.goto(`${baseUrl}${prefix}offence-analysis-victim-delete?victim=0`)
            await capture()
            await page.goto(url)
          }
          if (pathname.endsWith('-summary')) break
          if (variant === 'prison' && section.id === 'drugs') {
            // These entry screens resume at the next unanswered question.
            const pending = pathname.endsWith('/drugs') ? { drugsInCustody: '' }
              : pathname.endsWith('/drugs-custody') ? { drugTypes: [] } : null
            if (pending) {
              await page.evaluate(({ key, pending }) => {
                sessionStorage.setItem(key, JSON.stringify({
                  ...JSON.parse(sessionStorage.getItem(key)), ...pending
                }))
              }, { key, pending })
            }
          }
          const button = page.getByRole('button', {
            name: pathname.endsWith('/offence-analysis-impact') ? 'Mark as complete' : 'Save and continue',
            exact: true
          })
          await button.click()
          const failure = page.locator('.govuk-error-summary')
          if (await failure.isVisible()) {
            throw new Error(`${variant}/${section.id}/${scenario.id}: ${url}\n${await failure.innerText()}`)
          }
          await page.waitForURL(next => next.href !== url, { waitUntil: 'load' })
        }
        assert.ok(new URL(page.url()).pathname.replace(/\.html$/, '').endsWith('-summary'), `${scenario.id} did not reach summary`)
        await page.evaluate(() => sessionStorage.removeItem('trainingStoryboardScenario'))
        if (section.id !== 'offence') {
          await page.locator('.govuk-tabs__tab[href="#practitioner-analysis"]').click()
          await page.locator('#practitioner-analysis').waitFor({ state: 'visible' })
          if (noAnalysisScenarios.has(scenario.id)) {
            await page.getByText('Practitioner analysis not required.', { exact: true }).waitFor()
            await capture('analysis-not-required', 'Practitioner analysis is not required for this scenario. Select Mark as complete.')
          } else {
            await capture('analysis', 'Practitioner analysis: answer the three questions.')
            for (const question of analysisQuestions) {
              await page.locator(`#analysis-${question}-no`).check()
            }
            assert.equal(await page.locator('#practitioner-analysis input[type="radio"]:checked').count(), 3)
            await capture('analysis-answered', 'All three questions answered No. Select Mark as complete.')
          }
          await page.getByRole('button', { name: 'Mark as complete', exact: true }).click()
        }
        await assertComplete()
        await page.reload()
        await assertComplete()
        if (section.id !== 'offence' && !noAnalysisScenarios.has(scenario.id)) {
          assert.equal(await page.locator('#practitioner-analysis .govuk-summary-list__row').count(), 3)
        }
        await capture('complete', section.id === 'offence'
          ? 'Offence analysis completes directly from the final questions, without a practitioner-analysis tab. The blue tick confirms completion.'
          : 'Marked as complete. The blue tick confirms completion, which persists after refresh.')
        journeys.push({ ...scenario, steps })
        console.log(`${variant}/${section.id}/${scenario.id}: ${steps.length} training screens`)
      }
      for (const file of await readdir(imagesDir)) {
        if (file.endsWith('.png') && !kept.has(file)) await rm(path.join(imagesDir, file))
      }
      captured.push({ ...section, journeys })
    }

    const title = `SAN ${label} training storyboard`
    const body = `<nav class="links"><a href="../index.html">Training storyboards</a><a href="${baseUrl}/san#${variant}-training">Start SAN ${label}</a></nav>
<h1>${title}</h1><p class="lede">Screen-by-screen training journeys using the research storyboard scenarios. Every PNG is captured from the ${label} training prototype, with its Beta banner.</p>
<p class="howto">For Miro, right-click a screen and choose Copy image, or download its full-size PNG. You can also drag the PNGs from <code>storyboards/san-training/${variant}/images</code> onto your board. Filenames sort in journey order.</p>
${renderSections(captured, variant)}`
    await writeFile(path.join(storyboardDir, variant, filename), documentHtml(title, body, catalogue.script))
    await writeFile(path.join(storyboardDir, variant, 'captures.json'), `${JSON.stringify(manifest, null, 2)}\n`)
    firstScreens[variant] = captured[0].journeys[0].steps[0]

    if (variant === 'community' && (!filters.section || filters.section.includes('accommodation'))) {
      const accommodation = captured.filter(section => section.id === 'accommodation')
      const legacy = documentHtml('Community training accommodation', `<p><a href="../index.html#accommodation">All Community training journeys</a></p><h1>Community training accommodation</h1>${renderSections(accommodation, variant)}`, catalogue.script)
        .replaceAll('href="images/', 'href="../images/').replaceAll('src="images/', 'src="../images/')
      await writeFile(path.join(storyboardDir, 'community', 'accommodation', 'index.html'), legacy)
    } else if (variant === 'prison') {
      const overview = captured.map(section => {
        const step = section.journeys[0].steps[0]
        return `<li class="card"><h2><a href="journeys.html#${section.id}">${escapeHtml(section.title)}</a></h2><a href="journeys.html#${section.id}"><img src="images/${section.id}/${step.file}" alt="${escapeHtml(step.title)}"></a></li>`
      }).join('')
      await writeFile(path.join(storyboardDir, 'prison', 'index.html'), documentHtml('Prison training sections', `<nav class="links"><a href="../index.html">Training storyboards</a><a href="journeys.html">All Prison journeys</a></nav><h1>Prison training sections</h1><ul class="journey__steps">${overview}</ul>`))
    }
    await context.close()
  }

  for (const relative of filters.variant || filters.section ? [] : ['community/accommodation/images', 'community/images/overview', 'prison/images/overview']) {
    const directory = path.join(storyboardDir, relative)
    await mkdir(directory, { recursive: true })
    for (const file of await readdir(directory)) {
      if (file.endsWith('.png')) await rm(path.join(directory, file))
    }
  }

  if (!filters.variant && !filters.section) {
    const cards = variants.map(([variant, label, filename]) => `<li class="card"><h2><a href="${variant}/${filename}">SAN ${label} journey snapshots</a></h2>
<a href="${variant}/${filename}"><img src="${variant}/images/accommodation/${firstScreens[variant].file}" alt="${label} training accommodation question"></a></li>`).join('')
    await writeFile(path.join(storyboardDir, 'index.html'), documentHtml('SAN training storyboards', `<h1>SAN training storyboards</h1><p class="lede">Fresh screenshots from each training prototype, using the research scenarios. Open a journey to copy or download individual screens for Miro.</p><ul class="journey__steps">${cards}</ul>`))
  }
} finally {
  await browser.close()
}
