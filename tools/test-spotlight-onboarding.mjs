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

const page = await browser.newPage({
  viewport: { width: 380, height: 800 },
  deviceScaleFactor: 2,
})

page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(`[Console Error] ${msg.text()}`)
  }
})
page.on('requestfailed', req => {
  consoleErrors.push(`[Request Failed] ${req.url()}`)
})

// Clear localStorage before navigation so tutorial appears
await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  localStorage.clear()
})
await page.reload({ waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

// Step 1: Stories
await page.screenshot({ path: `${outDir}/spotlight-step-1.png` })
console.log('Saved spotlight-step-1.png')

// Next step: Cards
const nextBtn = page.locator('button:has-text("Дальше")')
await nextBtn.click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${outDir}/spotlight-step-2.png` })
console.log('Saved spotlight-step-2.png')

// Next step: Assistant tab
await nextBtn.click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${outDir}/spotlight-step-3.png` })
console.log('Saved spotlight-step-3.png')

// Next step: MVP disclaimer
await nextBtn.click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${outDir}/spotlight-step-4.png` })
console.log('Saved spotlight-step-4.png')

// Finish tutorial -> opens Onboarding
const finishBtn = page.locator('button:has-text("Подобрать меры")')
await finishBtn.click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${outDir}/spotlight-onboarding-open.png` })
console.log('Saved spotlight-onboarding-open.png')

await browser.close()

if (consoleErrors.length > 0) {
  console.error('Console errors found:')
  consoleErrors.forEach(e => console.error(e))
  process.exit(1)
} else {
  console.log('Spotlight & Onboarding test passed with 0 console errors!')
}
