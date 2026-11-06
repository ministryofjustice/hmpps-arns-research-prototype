import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storyboardDir = path.join(root, 'storyboards', 'san-training')
const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const sections = [
  ['accommodation', 'Accommodation'],
  ['employment', 'Employment and education'],
  ['finances', 'Finances'],
  ['drugs', 'Drug use'],
  ['alcohol', 'Alcohol use'],
  ['health', 'Health and wellbeing'],
  ['personal-relationships-children', 'Personal relationships and community'],
  ['thinking-behaviours', 'Thinking, behaviours and attitudes'],
  ['offence-analysis', 'Offence analysis']
]
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]))
const documentHtml = (title, content) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #0b0c0c; background: #f3f2f1; font-family: "GDS Transport", Arial, sans-serif; letter-spacing: 0; }
    header { background: white; border-top: 10px solid #1d70b8; border-bottom: 1px solid #b1b4b6; padding: 28px max(20px, calc((100% - 1320px) / 2)); }
    h1 { font-size: 32px; margin: 20px 0 0; }
    h2 { font-size: 22px; margin: 0; overflow-wrap: anywhere; }
    nav { display: flex; flex-wrap: wrap; gap: 12px 24px; }
    a { color: #1d70b8; text-underline-offset: 3px; }
    a:focus { color: #0b0c0c; background: #ffdd00; outline: 3px solid #ffdd00; }
    main { max-width: 1360px; margin: auto; padding: 28px 20px; }
    .screens { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 24px; }
    article { background: white; border: 1px solid #b1b4b6; min-width: 0; }
    article h2, article p { padding: 18px; margin: 0; }
    article > a { display: block; }
    img { display: block; width: 100%; height: auto; border-top: 1px solid #b1b4b6; }
    .preview { aspect-ratio: 4 / 3; object-fit: cover; object-position: top; }
    .links { margin-top: 28px; line-height: 1.6; }
    @media print { article { break-inside: avoid; } }
  </style>
</head>
<body>${content}</body>
</html>
`

const browser = await chromium.launch({ headless: true })
try {
  for (const [variant, label] of [['community', 'Community'], ['prison', 'Prison']]) {
    const imagesDir = path.join(storyboardDir, variant, 'images', 'overview')
    await mkdir(imagesDir, { recursive: true })
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const cards = []
    for (const [file, section] of sections) {
      const url = `${baseUrl}/san-training/${variant}/${file}`
      const response = await page.goto(url)
      assert.equal(response.status(), 200, url)
      await page.locator('[data-san-status]').waitFor()
      await page.evaluate(() => document.fonts.ready)
      assert.equal(new URL(page.url()).pathname.replace(/\.html$/, ''), `/san-training/${variant}/${file}`)
      await page.screenshot({ path: path.join(imagesDir, `${file}.png`), fullPage: true })
      cards.push(`<article><h2><a href="${escapeHtml(url)}">${escapeHtml(section)}</a></h2>
        <a href="images/overview/${file}.png"><img src="images/overview/${file}.png" alt="${escapeHtml(section)}: opening question" loading="lazy"></a></article>`)
    }
    assert.deepEqual(errors, [], `${variant} browser errors`)
    const filename = variant === 'community' ? 'overview.html' : 'index.html'
    await writeFile(path.join(storyboardDir, variant, filename), documentHtml(`SAN ${label} training storyboard`, `
      <header><nav><a href="../index.html">Training storyboards</a><a href="${escapeHtml(baseUrl)}/san#${variant}-training">Start SAN ${label}</a></nav>
        <h1>SAN ${label} training: section overview</h1></header>
      <main><div class="screens">${cards.join('\n')}</div></main>`))
    await context.close()
    console.log(`Captured ${sections.length} ${label} training section screens.`)
  }
  await writeFile(path.join(storyboardDir, 'index.html'), documentHtml('SAN training storyboards', `
    <header><nav><a href="${escapeHtml(baseUrl)}/san#community-training">Community training</a><a href="${escapeHtml(baseUrl)}/san#prison-training">Prison training</a></nav><h1>SAN training storyboards</h1></header>
    <main><div class="screens">
      <article><h2><a href="community/overview.html">SAN Community</a></h2><p>Section overview</p><a href="community/overview.html"><img class="preview" src="community/images/overview/accommodation.png" alt="Community training accommodation question"></a></article>
      <article><h2><a href="prison/index.html">SAN Prison</a></h2><p>Section overview</p><a href="prison/index.html"><img class="preview" src="prison/images/overview/accommodation.png" alt="Prison training accommodation question"></a></article>
    </div><nav class="links"><a href="community/index.html">Community journey snapshots</a><a href="community/accommodation/index.html">Community accommodation snapshots</a></nav></main>`))
} finally {
  await browser.close()
}