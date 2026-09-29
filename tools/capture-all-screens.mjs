import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('/Users/stanislav/.npm/_npx/2bf7f25197c22677/node_modules/playwright'))
} catch {
  ;({ chromium } = require('/Users/stanislav/.npm/_npx/44b85dff014d9ceb/node_modules/playwright'))
}

const auditDir = resolve(process.cwd(), 'docs/visual-qa/audit')
mkdirSync(auditDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

async function createMobilePage(seenIntro = true) {
  const page = await browser.newPage({
    viewport: { width: 380, height: 800 },
    deviceScaleFactor: 2,
  })

  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' })
  await page.evaluate((seen) => {
    localStorage.removeItem('zvery_viewed_slides')
    localStorage.removeItem('zvery_viewed_stories')
    if (seen) {
      localStorage.setItem('zvery_intro_seen', 'true')
    } else {
      localStorage.removeItem('zvery_intro_seen')
    }
  }, seenIntro)

  return page
}

console.log('Capturing App Visual Audit Suite...')

// 1. Home Top
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/01-home-top.png` })
  console.log('✓ 01-home-top.png')
  await page.close()
}

// 2. Home Categories (Scrolled)
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    const m = document.querySelector('.main')
    if (m) m.scrollTop = 280
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/02-home-categories.png` })
  console.log('✓ 02-home-categories.png')
  await page.close()
}

// 2b. Home Finance Cards Scrolled Right
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    const m = document.querySelector('.main')
    if (m) m.scrollTop = 280
    const fin = document.querySelector('.home-sec--finance .cards')
    if (fin) fin.scrollLeft = 500
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/02b-home-finance-scrolled.png` })
  console.log('✓ 02b-home-finance-scrolled.png')
  await page.close()
}

// 3. Home Bottom
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    const m = document.querySelector('.main')
    if (m) m.scrollTop = m.scrollHeight
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/03-home-bottom.png` })
  console.log('✓ 03-home-bottom.png')
  await page.close()
}

// 4. Spotlight Tutorial Step 1
{
  const page = await createMobilePage(false)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${auditDir}/04-spotlight-step1.png` })
  console.log('✓ 04-spotlight-step1.png')
  await page.close()
}

// 5. Spotlight Tutorial Step 3 (Mascot Tab Highlight)
{
  const page = await createMobilePage(false)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  // Click Next twice to reach Step 3 (index 2)
  const nextBtn = page.locator('.spotlight-btn--next')
  if (await nextBtn.isVisible()) {
    await nextBtn.click()
    await page.waitForTimeout(350)
    await nextBtn.click()
    await page.waitForTimeout(350)
  }
  await page.screenshot({ path: `${auditDir}/05-spotlight-step3-mascot.png` })
  console.log('✓ 05-spotlight-step3-mascot.png')
  await page.close()
}

// 6. Onboarding Questionnaire Sheet
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/?startapp=onboarding', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${auditDir}/06-onboarding-sheet.png` })
  console.log('✓ 06-onboarding-sheet.png')
  await page.close()
}

// 7. Card Detail Sheet (Measure detail)
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/card/self-start', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${auditDir}/07-card-detail-sheet.png` })
  console.log('✓ 07-card-detail-sheet.png')
  await page.close()
}

// 8. Story Viewer
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  const firstStory = page.locator('.story-tile').first()
  await firstStory.click({ force: true })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${auditDir}/08-story-viewer.png` })
  console.log('✓ 08-story-viewer.png')
  await page.close()
}

// 9. Assistant Empty State
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/assistant', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/09-assistant-empty.png` })
  console.log('✓ 09-assistant-empty.png')
  await page.close()
}

// 10. Assistant Dialogue State
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/assistant', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  const promptChip = page.locator('.a-suggest button').first()
  if (await promptChip.isVisible()) {
    await promptChip.click()
    await page.waitForTimeout(700)
  }
  await page.screenshot({ path: `${auditDir}/10-assistant-dialog.png` })
  console.log('✓ 10-assistant-dialog.png')
  await page.close()
}

// 11. Services Directory
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/services', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/11-services.png` })
  console.log('✓ 11-services.png')
  await page.close()
}

// 12. Grants Catalog
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/grants', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/12-grants.png` })
  console.log('✓ 12-grants.png')
  await page.close()
}

// 13. Learning Center
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/learning', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/13-learning.png` })
  console.log('✓ 13-learning.png')
  await page.close()
}

// 14. Quiz Certificate
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/?cert=1&quiz=1', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    const fact = document.querySelector('.facts')
    if (fact) fact.click()
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${auditDir}/14-quiz-certificate.png` })
  console.log('✓ 14-quiz-certificate.png')
  await page.close()
}

// 15. Search Empty State (Shrug Mascot)
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/search', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const inp = page.locator('.search-bar__field input')
  if (await inp.isVisible()) {
    await inp.fill('абвгдеёжзийклмноп')
    await page.waitForTimeout(400)
  }
  await page.screenshot({ path: `${auditDir}/15-search-empty.png` })
  console.log('✓ 15-search-empty.png')
  await page.close()
}

// 16. Profile Page
{
  const page = await createMobilePage(true)
  await page.goto('http://localhost:3001/profile', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${auditDir}/16-profile.png` })
  console.log('✓ 16-profile.png')
  await page.close()
}

await browser.close()
console.log(`\nAll 16 audit screenshots successfully saved in: ${auditDir}`)
