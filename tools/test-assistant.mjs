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

await page.goto('http://localhost:3001/assistant', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

// Initial assistant empty state
await page.screenshot({ path: `${outDir}/assistant-screen-empty.png` })
console.log('Saved assistant-screen-empty.png')

// Click chip: "Гайд по налогам 2027"
const taxChip = page.locator('.chip:has-text("налогам 2027")')
await taxChip.click()

// Wait for bot response (1300ms + margin)
await page.waitForTimeout(1600)
await page.screenshot({ path: `${outDir}/assistant-screen-tax-response.png` })
console.log('Saved assistant-screen-tax-response.png')

// Ask: "кто ты такой?"
const input = page.locator('.composer input')
await input.fill('Ты кто?')
const sendBtn = page.locator('.composer__btn--send')
await sendBtn.click()

await page.waitForTimeout(1600)
await page.screenshot({ path: `${outDir}/assistant-screen-who-response.png` })
console.log('Saved assistant-screen-who-response.png')

await browser.close()

if (consoleErrors.length > 0) {
  console.error('Console errors found:')
  consoleErrors.forEach(e => console.error(e))
  process.exit(1)
} else {
  console.log('Assistant test passed with 0 errors!')
}
