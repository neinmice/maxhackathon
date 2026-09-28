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

const targetPath = process.argv[2] || '/'
const namePrefix = process.argv[3] || 'check'
let url = targetPath
if (targetPath.startsWith('http://') || targetPath.startsWith('https://') || targetPath.startsWith('file://')) {
  url = targetPath
} else if (targetPath.startsWith('/')) {
  url = `http://localhost:3001${targetPath}`
} else {
  url = `file://${resolve(process.cwd(), targetPath)}`
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
const consoleErrors = []

async function capture(width, height, suffix, scrollToBottom = false) {
  const page = await browser.newPage({
    viewport: { width, height },
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

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)

  if (scrollToBottom) {
    await page.evaluate(() => {
      const m = document.querySelector('.main')
      if (m) m.scrollTop = m.scrollHeight
    })
    await page.waitForTimeout(400)
  }

  const filePath = `${outDir}/${namePrefix}-${suffix}.png`
  await page.screenshot({ path: filePath, fullPage: true })
  console.log(`Saved screenshot: ${filePath}`)
  await page.close()
}

await capture(380, 800, '380')
await capture(380, 800, '380-bottom', true)
await capture(1440, 900, '1440')

await browser.close()

if (consoleErrors.length > 0) {
  console.error('Console errors found:')
  consoleErrors.forEach(e => console.error(e))
  process.exit(1)
} else {
  console.log('Console check: 0 errors')
}
