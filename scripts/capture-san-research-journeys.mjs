//
// Walk the SAN research journeys and save one full-page PNG per screen.
//
// Filenames sort in journey order so a folder can be dragged onto Miro.
// Also rewrites storyboards/san-research/index.html.
//
// Usage (prototype already running):
//   npm run storyboard
//   BASE_URL=http://localhost:3000 npm run storyboard
//

import { chromium } from 'playwright'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storyboardDir = path.join(root, 'storyboards', 'san-research')
const imageRoot = path.join(storyboardDir, 'images')
const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

const click = async (page, id) => {
  const label = page.locator(`label[for="${id}"]`)
  await label.scrollIntoViewIfNeeded()
  await label.click()
}

const fill = async (page, id, value) => {
  const field = page.locator(`#${id}`)
  await field.waitFor({ state: 'visible' })
  await field.fill(value)
}

const visibleQuestion = (name, attribute = 'data-san-question') => async (page) => {
  await page.locator(`[${attribute}="${name}"]:not([hidden])`).waitFor({ state: 'visible' })
}

const saveAndContinue = async (page) => {
  const before = page.url()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  try {
    await page.waitForURL((url) => url.href !== before, { timeout: 10000, waitUntil: 'load' })
  } catch (error) {
    const summary = page.locator('.govuk-error-summary')
    if (await summary.count()) {
      throw new Error(`Could not continue from ${before}\n${await summary.innerText()}`, { cause: error })
    }
    throw error
  }
  await page.locator('main').waitFor({ state: 'visible' })
}

const startSection = async (page, href) => {
  await page.goto(`${baseUrl}/san-research/accommodation`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => sessionStorage.clear())
  await page.goto(`${baseUrl}${href}`, { waitUntil: 'domcontentloaded' })
  await page.locator('main').waitFor({ state: 'visible' })
}

const screenshot = async (page, file) => {
  await page.evaluate(() => {
    document.querySelectorAll('.govuk-cookie-banner, #global-cookie-message').forEach((node) => node.remove())
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.scrollTo(0, 0)
  })
  await page.screenshot({ path: file, fullPage: true })
}

const accommodationChanges = async (page) => {
  await visibleQuestion('changes')(page)
  await click(page, 'changes-need-help')
}

const employmentDetails = (showHistory) => async (page) => {
  if (showHistory) {
    await visibleQuestion('history', 'data-ee-question')(page)
    await click(page, 'history-continuous')
  } else {
    await visibleQuestion('commitments', 'data-ee-question')(page)
    const history = page.locator('[data-ee-question="history"]')
    if (await history.isVisible()) {
      throw new Error('Employment history should be hidden when Alex has never been employed')
    }
  }
  await click(page, 'commitment-none')
  await click(page, 'qualifications-yes')
  await fill(page, 'qualifications-yes-details', 'GCSEs in English and maths.')
  await click(page, 'skills-some')
  await click(page, 'difficulty-none')
  await click(page, 'changes-active')
}

const drugBackground = async (page) => {
  await page.locator('#treatment').waitFor({ state: 'visible' })
  await click(page, 'treatment-no')
  await click(page, 'why-curiosity')
  await click(page, 'affect-behaviour')
  await click(page, 'changes-thinking')
}

const sections = [
  {
    id: 'accommodation',
    title: 'Accommodation',
    lede: 'Settled accommodation asks location, then suitability. A concern page follows only when the answer needs it. No accommodation skips settled and both concern pages, and asks why there is no accommodation and about changes on the same page.',
    routes: [
      ['Somewhere to live', 'Is it settled?', 'Yes'],
      ['Somewhere to live', 'Why no accommodation, and changes', 'No. Both questions on one page'],
      ['Location is not suitable', 'Location concerns', ''],
      ['Suitability concerns, or not suitable', 'Suitability concerns', ''],
      ['No concerns', 'Changes', 'Location yes and suitability yes'],
      ['Changes', 'Summary', '']
    ],
    journeys: [
      {
        id: '01-settled-with-concerns',
        title: 'Settled, with concerns',
        summary: 'Has somewhere to live, settled. Location is not suitable and there are suitability concerns, so both concern pages are shown.',
        start: '/san-research/accommodation',
        steps: [
          {
            slug: 'somewhere-to-live',
            title: 'Does Alex currently have somewhere to live?',
            note: 'Yes selected',
            fill: async (page) => { await click(page, 'somewhere-to-live-yes') }
          },
          {
            slug: 'settled',
            title: "Is Alex's accommodation settled?",
            note: 'Yes selected',
            ready: async (page) => { await page.locator('#accommodation-settled-yes').waitFor() },
            fill: async (page) => { await click(page, 'accommodation-settled-yes') }
          },
          {
            slug: 'location',
            title: "Is the location of Alex's accommodation suitable?",
            note: 'No selected',
            ready: visibleQuestion('location'),
            fill: async (page) => { await click(page, 'location-no') }
          },
          {
            slug: 'location-concerns',
            title: "Concerns about the location",
            note: 'Shown because location is not suitable',
            ready: visibleQuestion('location-concerns'),
            fill: async (page) => { await click(page, 'location-associates') }
          },
          {
            slug: 'suitability',
            title: "Is Alex's accommodation suitable?",
            note: 'Yes, with concerns',
            ready: visibleQuestion('suitable'),
            fill: async (page) => { await click(page, 'suitable-concerns') }
          },
          {
            slug: 'suitability-concerns',
            title: 'Concerns about suitability',
            note: 'Shown because there are suitability concerns',
            ready: visibleQuestion('suitability-concerns'),
            fill: async (page) => { await click(page, 'suitability-overcrowding') }
          },
          {
            slug: 'changes',
            title: 'Does Alex want to make changes to their accommodation?',
            note: 'Last question before summary',
            ready: visibleQuestion('changes'),
            fill: accommodationChanges
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => { await page.locator('[data-san-summary], .govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      },
      {
        id: '02-no-accommodation',
        title: 'No accommodation',
        summary: 'Skips the settled and concerns pages. Why there is no accommodation and whether Alex wants to make changes are on the same page.',
        start: '/san-research/accommodation',
        steps: [
          {
            slug: 'somewhere-to-live',
            title: 'Does Alex currently have somewhere to live?',
            note: 'No selected',
            fill: async (page) => { await click(page, 'somewhere-to-live-no') }
          },
          {
            slug: 'no-accommodation',
            title: 'Why no accommodation, and changes',
            note: 'Both questions on one page',
            ready: async (page) => {
              await visibleQuestion('no-accommodation')(page)
              await visibleQuestion('changes')(page)
            },
            fill: async (page) => {
              await click(page, 'no-accommodation-financial')
              await click(page, 'changes-need-help')
            }
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment and education',
    lede: 'Employed or self-employed goes straight to details, including employment history. Unemployed asks if Alex has been employed before. Never employed hides employment history. These journeys select no reading, writing or numeracy difficulties, so the difficulty page is skipped.',
    routes: [
      ['Employment status', 'Details', 'Employed, self-employed or retired'],
      ['Employment status', 'Employed before?', 'Unemployed or unavailable'],
      ['Employed before?', 'Details', 'Yes or no'],
      ['Details', 'How much difficulty?', 'Reading, writing or numeracy selected'],
      ['Details', 'Summary', 'No difficulties']
    ],
    journeys: [
      {
        id: '01-employed',
        title: 'Employed',
        summary: 'Employed or self-employed. Skips the “employed before” page. Details includes employment history.',
        start: '/san-research/employment',
        steps: [
          {
            slug: 'status',
            title: "What is Alex's current employment status?",
            note: 'Employed or self-employed',
            fill: async (page) => { await click(page, 'employment-employed-or-self-employed') }
          },
          {
            slug: 'details',
            title: 'History, commitments, qualifications, skills and changes',
            note: 'Employment history is shown',
            ready: visibleQuestion('history', 'data-ee-question'),
            fill: employmentDetails(true)
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab. Difficulty page skipped',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      },
      {
        id: '02-unemployed-never',
        title: 'Unemployed, never employed',
        summary: 'Asks if Alex has been employed before. Details hides employment history.',
        start: '/san-research/employment',
        steps: [
          {
            slug: 'status',
            title: "What is Alex's current employment status?",
            note: 'Unemployed',
            fill: async (page) => { await click(page, 'employment-unemployed') }
          },
          {
            slug: 'job',
            title: 'Has Alex ever had a job?',
            note: 'No selected',
            ready: async (page) => { await page.locator('#employed-before-no').waitFor() },
            fill: async (page) => { await click(page, 'employed-before-no') }
          },
          {
            slug: 'details',
            title: 'Commitments, qualifications, skills and changes',
            note: 'Employment history hidden',
            ready: visibleQuestion('commitments', 'data-ee-question'),
            fill: employmentDetails(false)
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      }
    ]
  },
  {
    id: 'finances',
    title: 'Finances',
    lede: 'Income from family or friends opens the over-reliant page. Yes on that page skips the further assessment question and goes straight to money management. No or unknown still asks further assessment. Own debt adds a debt types page.',
    routes: [
      ['Income', 'Over-reliant on family?', 'Income includes family or friends'],
      ['Income', 'Further assessment?', 'No family income'],
      ['Over-reliant on family?', 'Money management', 'Yes'],
      ['Over-reliant on family?', 'Further assessment?', 'No or unknown'],
      ['Further assessment?', 'Summary', 'No'],
      ['Further assessment?', 'Money management', 'Yes'],
      ['Debt', 'Debt types', 'Own debt'],
      ['Debt types or no own debt', 'Changes, then summary', '']
    ],
    journeys: [
      {
        id: '01-full-follow-on',
        title: 'Further assessment, with family income and own debt',
        summary: 'Family income shows the over-reliant page. Yes is selected, so the further assessment question is skipped. Money management, debt, debt types and changes follow.',
        start: '/san-research/finances',
        steps: [
          {
            slug: 'income',
            title: 'Where does Alex currently get their money from?',
            note: 'Employment and family or friends',
            fill: async (page) => {
              await click(page, 'income-employment')
              await click(page, 'income-family')
            }
          },
          {
            slug: 'overreliant',
            title: 'Is Alex over-reliant on family or friends for money?',
            note: 'Yes selected. This skips the further assessment question',
            ready: async (page) => { await page.locator('#overreliant-yes').waitFor() },
            fill: async (page) => {
              await click(page, 'overreliant-yes')
              await fill(page, 'overreliant-yes-details', 'Parents pay rent and give cash most weeks.')
            }
          },
          {
            slug: 'money-management',
            title: 'How good is Alex at managing their money?',
            note: 'Follow-on starts here',
            ready: async (page) => {
              if (page.url().includes('finances-assessment')) {
                throw new Error('Yes to over-reliant should skip the further assessment question')
              }
              await page.locator('#money-necessities').waitFor()
            },
            fill: async (page) => { await click(page, 'money-necessities') }
          },
          {
            slug: 'debt',
            title: 'Is Alex affected by debt?',
            note: 'Own debt selected',
            ready: async (page) => { await page.locator('#debt-own').waitFor() },
            fill: async (page) => { await click(page, 'debt-own') }
          },
          {
            slug: 'debt-types',
            title: 'What type of debt does Alex have?',
            note: 'Only shown for own debt',
            ready: async (page) => { await page.locator('#debt-own-formal').waitFor() },
            fill: async (page) => { await click(page, 'debt-own-formal') }
          },
          {
            slug: 'changes',
            title: 'Does Alex want to make changes to their finances?',
            note: 'Last follow-on page',
            ready: async (page) => { await page.locator('#changes-need-help').waitFor() },
            fill: async (page) => { await click(page, 'changes-need-help') }
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab. Includes yes to over-reliant',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      },
      {
        id: '02-no-further',
        title: 'No further assessment',
        summary: 'Wages only, so the over-reliant page is skipped. Further assessment no goes straight to summary.',
        start: '/san-research/finances',
        steps: [
          {
            slug: 'income',
            title: 'Where does Alex currently get their money from?',
            note: 'Employment only. Skips over-reliant',
            fill: async (page) => { await click(page, 'income-employment') }
          },
          {
            slug: 'assessment',
            title: "Is there anything about Alex's financial situation that may need further assessment?",
            note: 'No selected. Skips follow-on pages',
            ready: async (page) => {
              if (page.url().includes('finances-overreliant')) {
                throw new Error('Employment income only should skip the over-reliant page')
              }
              await page.locator('#further-assessment-no').waitFor()
            },
            fill: async (page) => { await click(page, 'further-assessment-no') }
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      }
    ]
  },
  {
    id: 'drugs',
    title: 'Drug use',
    lede: 'No drug use goes to summary. Yes then asks which drugs, when they were last used, and background. The injected-when page appears only if an injectable drug was injected.',
    routes: [
      ['Ever used drugs?', 'Summary', 'No'],
      ['Ever used drugs?', 'Which drugs?', 'Yes'],
      ['When last used', 'Background', ''],
      ['Background', 'When injected', 'Injected an injectable drug'],
      ['Background', 'Summary', 'Did not inject, or the drug is not injectable']
    ],
    journeys: [
      {
        id: '01-injects',
        title: 'Uses drugs and injects',
        summary: 'Heroin used in the last 6 months is injectable, so the injected-when page is shown.',
        start: '/san-research/drugs',
        steps: [
          {
            slug: 'use',
            title: 'Has Alex ever used illegal drugs or misused medication?',
            note: 'Yes selected',
            fill: async (page) => { await click(page, 'drug-use-yes') }
          },
          {
            slug: 'types',
            title: 'Which drugs has Alex used?',
            note: 'Heroin',
            ready: async (page) => { await page.locator('#drug-type-heroin').waitFor() },
            fill: async (page) => { await click(page, 'drug-type-heroin') }
          },
          {
            slug: 'when',
            title: 'When did Alex use these drugs?',
            note: 'Heroin in the last 6 months',
            ready: async (page) => { await page.locator('#last-used-heroin-last-six').waitFor() },
            fill: async (page) => { await click(page, 'last-used-heroin-last-six') }
          },
          {
            slug: 'before',
            title: 'Drug use background',
            note: 'Frequency, and heroin selected as injected',
            ready: async (page) => { await page.locator('#injected-heroin').waitFor() },
            fill: async (page) => {
              await click(page, 'frequency-heroin-weekly')
              await click(page, 'injected-heroin')
            }
          },
          {
            slug: 'injected',
            title: 'When has Alex injected this drug?',
            note: 'Only shown because heroin was injected',
            ready: async (page) => {
              if (!page.url().includes('drugs-injected')) {
                throw new Error(`Expected the injected-when page, got ${page.url()}`)
              }
              await page.locator('#injected-when-heroin-last-six').waitFor()
            },
            fill: async (page) => { await click(page, 'injected-when-heroin-last-six') }
          },
          {
            slug: 'background',
            title: 'Treatment, why, how it affects them, and changes',
            note: 'After the injecting question',
            ready: async (page) => { await page.locator('#treatment-no').waitFor() },
            fill: drugBackground
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      },
      {
        id: '02-no-inject',
        title: 'Uses drugs, does not inject',
        summary: 'Cannabis only is not injectable, so the injected-when page is skipped.',
        start: '/san-research/drugs',
        steps: [
          {
            slug: 'use',
            title: 'Has Alex ever used illegal drugs or misused medication?',
            note: 'Yes selected',
            fill: async (page) => { await click(page, 'drug-use-yes') }
          },
          {
            slug: 'types',
            title: 'Which drugs has Alex used?',
            note: 'Cannabis only',
            ready: async (page) => { await page.locator('#drug-type-cannabis').waitFor() },
            fill: async (page) => { await click(page, 'drug-type-cannabis') }
          },
          {
            slug: 'when',
            title: 'When did Alex use these drugs?',
            note: 'Last 6 months',
            ready: async (page) => { await page.locator('#last-used-cannabis-last-six').waitFor() },
            fill: async (page) => { await click(page, 'last-used-cannabis-last-six') }
          },
          {
            slug: 'before',
            title: 'Drug use background',
            note: 'Injecting question hidden',
            ready: async (page) => { await page.locator('#frequency-cannabis-weekly').waitFor() },
            fill: async (page) => {
              const inject = page.locator('[data-du-inject-section]')
              if (await inject.isVisible()) {
                throw new Error('Injecting question should be hidden for cannabis only')
              }
              await click(page, 'frequency-cannabis-weekly')
            }
          },
          {
            slug: 'background',
            title: 'Treatment, why, how it affects them, and changes',
            note: 'Injected-when skipped',
            ready: async (page) => {
              if (page.url().includes('drugs-injected')) {
                throw new Error('Cannabis only should skip the injected-when page')
              }
              await page.locator('#treatment-no').waitFor()
            },
            fill: drugBackground
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => { await page.locator('.govuk-summary-list').first().waitFor() },
            last: true
          }
        ]
      },
      {
        id: '03-none',
        title: 'No drug use',
        summary: 'Goes straight to summary.',
        start: '/san-research/drugs',
        steps: [
          {
            slug: 'use',
            title: 'Has Alex ever used illegal drugs or misused medication?',
            note: 'No selected',
            fill: async (page) => { await click(page, 'drug-use-no') }
          },
          {
            slug: 'summary',
            title: 'Summary',
            note: 'Answers tab',
            ready: async (page) => {
              if (!page.url().includes('drugs-summary')) {
                throw new Error(`Expected summary, got ${page.url()}`)
              }
              await page.locator('main').waitFor()
            },
            last: true
          }
        ]
      }
    ]
  }
]

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const storyboardHtml = (captured) => {
  const tabs = captured.map((section, index) => {
    const selected = index === 0 ? 'true' : 'false'
    return `<a class="tabs__tab" role="tab" href="#${section.id}" id="tab-${section.id}" aria-selected="${selected}" aria-controls="${section.id}">${escapeHtml(section.title)}</a>`
  }).join('')

  const panels = captured.map((section, index) => {
    const routes = section.routes.map(([from, to, when]) => `<li class="flow__item">
      <span class="flow__from">${escapeHtml(from)}</span>
      <span class="flow__arrow" aria-hidden="true">→</span>
      <span class="flow__to">${escapeHtml(to)}</span>
      ${when ? `<span class="flow__when">${escapeHtml(when)}</span>` : ''}
    </li>`).join('')

    const journeys = section.journeys.map((journey) => {
      const cards = journey.steps.map((step, stepIndex) => `<li class="card">
        <p class="card__step">Step ${stepIndex + 1}</p>
        <h3 class="card__title">${escapeHtml(step.title)}</h3>
        <p class="card__note">${escapeHtml(step.note)}</p>
        <p class="card__file">${escapeHtml(step.file)}</p>
        <img src="images/${section.id}/${escapeHtml(step.file)}" alt="${escapeHtml(step.title)}">
      </li>`).join('\n')

      return `<section class="journey">
      <header class="journey__header">
        <h2>${escapeHtml(journey.title)}</h2>
        <p>${escapeHtml(journey.summary)}</p>
      </header>
      <ol class="journey__steps">
      ${cards}</ol>
    </section>`
    }).join('\n')

    return `<section class="tab-panel" role="tabpanel" id="${section.id}" aria-labelledby="tab-${section.id}"${index === 0 ? '' : ' hidden'}>
    <p class="lede">${escapeHtml(section.lede)}</p>
    <h2>Routes</h2>
    <ol class="flow">${routes}</ol>
    ${journeys}
  </section>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SAN research storyboard</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #0b0c0c;
      --muted: #505a5f;
      --line: #b1b4b6;
      --paper: #f3f2f1;
      --card: #ffffff;
      --link: #1d70b8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 32px 64px;
      font-family: "GDS Transport", arial, sans-serif;
      color: var(--ink);
      background: var(--paper);
    }
    h1 { font-size: 28px; margin: 0 0 8px; }
    h2 { font-size: 22px; margin: 0 0 8px; }
    h3 { font-size: 16px; margin: 0 0 8px; }
    p { margin: 0 0 8px; }
    code { font-family: ui-monospace, monospace; }
    .lede { color: var(--muted); max-width: 72ch; margin-bottom: 24px; }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0;
      margin: 0 0 24px;
      padding: 0;
      border-bottom: 1px solid var(--line);
    }
    .tabs__tab {
      display: inline-block;
      padding: 10px 16px;
      color: var(--link);
      text-decoration: none;
      border: 1px solid transparent;
      margin-bottom: -1px;
    }
    .tabs__tab[aria-selected="true"] {
      background: var(--card);
      color: var(--ink);
      border-color: var(--line);
      border-bottom-color: var(--card);
      font-weight: 700;
    }
    .flow {
      list-style: none;
      margin: 0 0 32px;
      padding: 16px 20px;
      background: var(--card);
      border: 1px solid var(--line);
    }
    .flow__item {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: baseline;
      padding: 6px 0;
      border-bottom: 1px solid var(--paper);
    }
    .flow__item:last-child { border-bottom: 0; }
    .flow__arrow { color: var(--muted); }
    .flow__when { color: var(--muted); font-size: 14px; }
    .journey { margin-bottom: 40px; }
    .journey__header { margin-bottom: 16px; max-width: 80ch; }
    .journey__header p { color: var(--muted); }
    .journey__steps {
      display: flex;
      gap: 16px;
      list-style: none;
      margin: 0;
      padding: 8px 0 16px;
      overflow-x: auto;
    }
    .card {
      flex: 0 0 420px;
      background: var(--card);
      border: 1px solid var(--line);
      padding: 12px;
    }
    .card__step {
      font-size: 14px;
      font-weight: 700;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .card__note, .card__file {
      font-size: 13px;
      color: var(--muted);
    }
    .card__file { font-family: ui-monospace, monospace; word-break: break-all; }
    .card img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--line);
      margin-top: 12px;
    }
    .howto {
      margin: 0 0 28px;
      padding: 12px 16px;
      background: var(--card);
      border-left: 4px solid var(--link);
      max-width: 80ch;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .tabs, .howto { display: none; }
      .tab-panel[hidden] { display: block !important; }
      .journey__steps { overflow: visible; flex-wrap: wrap; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>SAN research storyboard</h1>
  <p class="lede">Screen-by-screen journeys for accommodation, employment and education, finances and drug use.</p>
  <p class="howto">For Miro, open <code>storyboards/san-research/images</code> and drag a section folder onto the board. Filenames sort in journey order, so the screens land in step sequence. You can also copy the PNGs and paste them straight onto a frame.</p>
  <nav class="tabs" role="tablist" aria-label="SAN research sections">${tabs}</nav>
  ${panels}
  <script>
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'))
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
    const show = (id) => {
      const next = panels.some((panel) => panel.id === id) ? id : panels[0].id
      panels.forEach((panel) => { panel.hidden = panel.id !== next })
      tabs.forEach((tab) => {
        const selected = tab.getAttribute('href') === '#' + next
        tab.setAttribute('aria-selected', selected ? 'true' : 'false')
      })
    }
    tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault()
        const id = tab.getAttribute('href').slice(1)
        show(id)
        history.replaceState({}, '', '#' + id)
      })
    })
    show(location.hash.slice(1))
  </script>
</body>
</html>
`
}

const captureJourney = async (page, section, journey) => {
  await startSection(page, journey.start)
  const files = []

  for (let index = 0; index < journey.steps.length; index += 1) {
    const step = journey.steps[index]
    if (step.ready) await step.ready(page)
    if (step.fill) await step.fill(page)

    const file = `${journey.id}__${String(index + 1).padStart(2, '0')}__${step.slug}.png`
    const directory = path.join(imageRoot, section.id)
    await mkdir(directory, { recursive: true })
    await screenshot(page, path.join(directory, file))
    files.push(file)
    console.log(`${section.id}/${file}`)

    if (!step.last) await saveAndContinue(page)
  }

  return files
}

const removeStaleImages = async (sectionId, kept) => {
  const directory = path.join(imageRoot, sectionId)
  const existing = await readdir(directory)
  await Promise.all(existing.filter((name) => name.endsWith('.png') && !kept.has(name)).map((name) => (
    rm(path.join(directory, name))
  )))
}

const main = async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce'
  })
  const page = await context.newPage()
  const captured = []

  try {
    for (const section of sections) {
      const journeys = []
      const kept = new Set()
      for (const journey of section.journeys) {
        const files = await captureJourney(page, section, journey)
        files.forEach((file) => kept.add(file))
        journeys.push({
          ...journey,
          steps: journey.steps.map((step, index) => ({
            title: step.title,
            note: step.note,
            file: files[index]
          }))
        })
      }
      await removeStaleImages(section.id, kept)
      captured.push({ ...section, journeys })
    }
  } finally {
    await browser.close()
  }

  await writeFile(path.join(storyboardDir, 'index.html'), storyboardHtml(captured))
  console.log('Wrote storyboards/san-research/index.html')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
