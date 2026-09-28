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

const outDir = resolve(process.cwd(), 'docs/visual-qa')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
const consoleErrors = []

async function takePage(name, path, actions = null) {
  const page = await browser.newPage({
    viewport: { width: 380, height: 800 },
    deviceScaleFactor: 2,
  })

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${name} Error] ${msg.text()}`)
    }
  })
  page.on('requestfailed', req => {
    consoleErrors.push(`[${name} ReqFailed] ${req.url()}`)
  })

  // Prevent tutorial popup on general pages
  await page.goto('http://localhost:3001' + path, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.setItem('zvery_intro_seen', 'true')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)

  if (actions) {
    await actions(page)
  }

  await page.screenshot({ path: `${outDir}/${name}-380.png` })
  console.log(`Saved ${name}-380.png`)

  // Check bottom scroll if needed
  await page.evaluate(() => {
    const m = document.querySelector('.main')
    if (m) m.scrollTop = m.scrollHeight
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${outDir}/${name}-380-bottom.png` })
  console.log(`Saved ${name}-380-bottom.png`)

  await page.close()
}

// 1. Home
await takePage('qa-home', '/')

// 2. Services
await takePage('qa-services', '/services')

// 3. Grants
await takePage('qa-grants', '/grants')

// 4. Course
await takePage('qa-course', '/learning/basics')

// 5. Card Detail
await takePage('qa-card-detail', '/card/self-start')

// 6. Search Empty State
await takePage('qa-search-empty', '/search', async (page) => {
  const inp = page.locator('.search-bar__field input')
  await inp.fill('несуществующийзапрос123')
  await page.waitForTimeout(400)
})

// 7. Quiz Certificate
await takePage('qa-quiz-cert', '/?cert=1&quiz=1', async (page) => {
  // Click on "Пройти тест" in Facts or Profile to open Quiz with cert
  await page.evaluate(() => {
    // Open quiz via click or state
    const fact = document.querySelector('.facts')
    if (fact) fact.click()
  })
  await page.waitForTimeout(500)
})

await browser.close()

if (consoleErrors.length > 0) {
  console.error('Final QA found console errors:')
  consoleErrors.forEach(e => console.error(e))
  process.exit(1)
} else {
  console.log('ALL FINAL QA SCREENSHOTS COMPLETED WITH 0 CONSOLE ERRORS!')
}
