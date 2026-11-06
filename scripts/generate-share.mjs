import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.SQUEEKS_PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.SQUEEKS_PLAYWRIGHT_MODULE)).href : 'playwright')
const font = await readFile('public/fonts/dm-sans-latin-variable.woff2')
const svg = await readFile('public/share.svg', 'utf8')
const browser = await chromium.launch({ headless: true, ...(process.env.SQUEEKS_CHROMIUM_PATH ? { executablePath: process.env.SQUEEKS_CHROMIUM_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.setContent(`<style>@font-face{font-family:'DM Sans';src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:100 1000}body{margin:0;background:#141412}svg{display:block}</style>${svg}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'public/share.png' })
  console.log('Generated public/share.png (1200 × 630) from public/share.svg and the local font.')
} finally { await browser.close() }
