// Validate the actual dist export under a gateway-like subpath. Fixture data never enters the app.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const load = (name, override) => import(override ? pathToFileURL(resolve(override)).href : name)
const { chromium, webkit } = await load('playwright', process.env.SQUEEKS_PLAYWRIGHT_MODULE)
const { default: AxeBuilder } = await load('@axe-core/playwright', process.env.SQUEEKS_AXE_MODULE)
const root = resolve('dist')
const output = resolve('test/scratch/validation')
await mkdir(output, { recursive: true })
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' }
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (!pathname.startsWith('/preview/')) throw new Error('Outside preview')
    const path = resolve(root, pathname.slice(9) || 'index.html')
    if (!path.startsWith(root + sep)) throw new Error('Outside export')
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end('Not found') }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}/preview/`
const report = { mode: process.argv.includes('--live') ? 'live' : 'fixture', checks: [], browserErrors: [], consoleErrors: [], failedResources: [], failedRequests: [] }
const check = (name, detail = '') => { report.checks.push({ name, passed: true, detail }); process.stdout.write(`PASS ${name}${detail ? `: ${detail}` : ''}\n`) }
let browser, page
const nft = '0xc4c7982657f00509548f3a3a41db7fa439a6856b'
const reserve = '0xd5dab9f1d15e9d45548078726c54732a5b59eb78'
const word = value => BigInt(value).toString(16).padStart(64, '0')
const abi = values => `0x${values.map(word).join('')}`
const sleep = ms => new Promise(done => setTimeout(done, ms))

try {
  const engine = process.argv.includes('--webkit') ? webkit : chromium
  browser = await engine.launch({
    headless: true,
    ...(process.env.SQUEEKS_CHROMIUM_PATH && engine === chromium ? { executablePath: process.env.SQUEEKS_CHROMIUM_PATH } : {}),
    ...(process.env.SQUEEKS_TEST_PROXY === '1' && process.env.HTTP_PROXY ? { proxy: { server: process.env.HTTP_PROXY, bypass: '127.0.0.1,localhost' } } : {}),
  })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  if (engine === chromium) await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await context.addInitScript(() => Object.defineProperty(window, 'ethereum', { get() { throw new Error('The board accessed a wallet provider') } }))
  page = await context.newPage()
  page.on('pageerror', e => report.browserErrors.push(e.message))
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
  page.on('requestfailed', request => report.failedRequests.push({ host: new URL(request.url()).hostname === '127.0.0.1' ? 'preview' : new URL(request.url()).hostname, error: request.failure()?.errorText }))
  page.on('response', response => { if (response.url().startsWith(url) && response.status() >= 400) report.failedResources.push({ path: new URL(response.url()).pathname, status: response.status() }) })
  let wheelMode = 'active', accountMode = 'populated', rpcMode = 'normal', wheelRequests = 0, rpcRequests = 0, accountRequests = 0
  const wireMethods = new Set()
  if (report.mode === 'fixture') {
    await page.route('https://api.squeekchain.com/v1/status', async route => {
      wheelRequests++
      if (wheelMode === 'error') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"database_busy"}' })
      const stamp = new Date(wheelMode === 'stale' ? Date.now() - 180_000 : Date.now()).toISOString()
      await route.fulfill({ json: {
        schemaVersion: wheelMode === 'malformed' ? 99 : 1, generatedAt: stamp,
        measurement: { coreStatus: wheelMode === 'idle' ? 'IDLE' : wheelMode === 'fault' ? 'COUNTER_FAULT' : 'ACTIVE', rpmMilli: wheelMode === 'idle' ? 0 : 42_000 + wheelRequests * 100, freshness: 'online', observedAt: stamp, receivedAt: stamp, staleAfterSeconds: 120, provenance: 'hardware' },
        builder: { status: 'available', anchor: { cumulativeWork: '3817', blockHeight: '366', blockProgress: '425653103', workPerThousandBlocks: '9546', settledThroughRound: '329' } },
        oracle: { state: 'accepted' }, settlementQueue: { status: 'available', state: 'submitted' },
      } })
    })
    await page.route(/https:\/\/(ethereum-sepolia-rpc\.publicnode\.com|sepolia\.drpc\.org)\/?$/, async route => {
      rpcRequests++
      const requests = route.request().postDataJSON()
      const results = requests.map(request => {
        wireMethods.add(request.method)
        let result
        if (request.method === 'eth_chainId') result = rpcMode === 'wrong-chain' ? '0x1' : '0xaa36a7'
        if (request.method === 'eth_blockNumber') result = '0xb83b13'
        if (request.method === 'eth_call') {
          const map = { '0x18160ddd': [9124], '0xf5be3193': [9999], '0x219067a0': [1], '0xc19d93fb': [24283190141269248953102n, 329, 17, 100, 266, 0, 1, 1, 0, 1], '0x5c975abb': [0], '0x817b1cd2': [1234567890123456789000n], '0x582c7928': [24283190141269248953102n, 0, 0, 0, 0, 1000000000000000000000n, 0, 0, 0, 0] }
          if (rpcMode === 'partial' && request.params[0].data === '0x18160ddd') return { jsonrpc: '2.0', id: request.id, error: { code: -32000, message: 'test-only failed view' } }
          result = abi(map[request.params[0].data])
          assert.equal(request.params[1], '0xb83b13', 'All contract reads must use the pinned block')
        }
        return { jsonrpc: '2.0', id: request.id, result }
      })
      await route.fulfill({ json: results })
    })
    await page.route('https://api.squeekchain.com/v1/accounts/**', async route => {
      accountRequests++
      await sleep(150)
      if (accountMode === 'unavailable') return route.fulfill({ json: { schemaVersion: 3, status: 'unavailable', reason: 'indexer_unavailable' } })
      if (accountMode === 'rate') return route.fulfill({ status: 429, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Retry-After', 'Retry-After': '1' }, json: { error: 'rate_limited' } })
      const address = new URL(route.request().url()).pathname.split('/').at(-1)
      await route.fulfill({ json: { schemaVersion: 3, status: 'available', account: address, generatedAt: new Date().toISOString(), chain: { chainId: '11155111', safeThroughBlock: '12073714' }, deployment: { components: { collection: { address: nft }, mining: { address: accountMode === 'wrong-deployment' ? nft : '0x2dccb11fcc2defdd188555e45acb52231e82e218' }, staking: { address: '0x50fd1780526c3186a0c037c7622203bc4fb611ca' } } }, tokenCounts: { wallet: accountMode === 'empty' ? '0' : '2', staking: accountMode === 'empty' ? '0' : '1' }, stake: { principalBaseUnits: accountMode === 'empty' ? '0' : '1234567890123456789' }, rewards: { claimableBaseUnits: accountMode === 'empty' ? '0' : '24283190141269248953102' } } })
    })
  }
  await page.goto(url)
  await page.locator('.metric-value').first().filter({ hasText: report.mode === 'live' ? /IDLE|ACTIVE/ : 'ACTIVE' }).waitFor({ timeout: 45_000 })
  await page.locator('.metric-value').nth(3).filter({ hasText: /\d/ }).waitFor({ timeout: 45_000 })
  check('Wheel and Sepolia read without a wallet', (await page.locator('.metric-value').allTextContents()).join(' | '))
  await page.waitForFunction(() => Number(document.querySelector('.chart-summary div:last-child dd')?.textContent.replace(/,/g, '')) >= 2, { timeout: 15_000 })
  check('Polling records multiple real responses in the chart')
  await page.evaluate(() => document.fonts.ready)
  assert(await page.evaluate(() => document.fonts.check('400 16px "DM Sans"') && document.fonts.check('400 16px "DM Mono"')))
  check('Local fonts load')
  for (const width of [320, 390, 720, 960, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Overflow at ${width}`)
  }
  check('No horizontal overflow at 320, 390, 720, 960 and 1440')
  await page.screenshot({ path: `${output}/${report.mode}-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: `${output}/${report.mode}-390.png`, fullPage: true })
  const firstAction = await page.getByRole('link', { name: 'Look up an address' }).boundingBox()
  const firstMetric = await page.locator('.metrics').boundingBox()
  assert(firstAction.y + firstAction.height < 844 && firstMetric.y < 844)
  check('Product and lookup action appear on the first 390px screen')
  const audit = await new AxeBuilder({ page }).analyze()
  assert.deepEqual(audit.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), [])
  check('Axe automated accessibility scan has no violations')
  await page.getByRole('link', { name: 'Look up an address' }).focus()
  await page.keyboard.press('Tab')
  assert.equal(await page.getByRole('button', { name: 'Refresh now' }).evaluate(el => document.activeElement === el), true)
  await page.keyboard.press('Tab')
  assert.equal(await page.getByRole('button', { name: '5 min', exact: true }).evaluate(el => document.activeElement === el), true)
  await page.getByRole('link', { name: 'Look up an address' }).focus()
  assert.equal(await page.getByRole('link', { name: 'Look up an address' }).evaluate(el => getComputedStyle(el).outlineWidth), '2px')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${output}/${report.mode}-keyboard-focus-390.png` })
  check('Keyboard order and visible focus indicator work on the first screen')
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('#wallet-address').evaluate(el => document.activeElement === el), true)
  await page.locator('#wallet-address').fill('invalid')
  await page.getByRole('button', { name: 'Look up address', exact: true }).click()
  assert.equal(await page.locator('#wallet-address').getAttribute('aria-invalid'), 'true')
  assert(await page.locator('#wallet-error').isVisible())
  assert.equal(await page.locator('#wallet-address').evaluate(el => document.activeElement === el), true)
  check('Keyboard jump and invalid-address focus/error work')
  if (report.mode === 'fixture') {
    await page.locator('#wallet-address').fill(reserve)
    await page.keyboard.press('Enter')
    await page.locator('#wallet-address').fill(nft)
    await sleep(250)
    assert.equal(await page.locator('.lookup-result').count(), 0)
    check('Editing during lookup cancels the previous address request')
  }
  await page.locator('#wallet-address').fill(reserve)
  await page.keyboard.press('Enter')
  await page.locator('.lookup-result').waitFor({ timeout: 30_000 })
  assert.equal(await page.locator('.result-address').textContent(), reserve)
  const walletValues = await page.locator('.wallet-values dd').allTextContents()
  if (report.mode === 'fixture') assert.deepEqual(walletValues, ['2', '1', '1.234', '24,283.19'])
  check('Populated read-only lookup displays counts, stake and claimable', walletValues.join(' | '))
  if (report.mode === 'fixture') {
    accountMode = 'empty'
    await page.locator('#wallet-address').fill(nft)
    await page.keyboard.press('Enter')
    await page.getByText('No Squeeks in this address.', { exact: true }).waitFor()
    check('Confirmed empty lookup shows required copy')
    accountMode = 'unavailable'
    await page.getByRole('button', { name: 'Look up address', exact: true }).click()
    await page.locator('#wallet-error').waitFor()
    assert.equal(await page.locator('.lookup-result').count(), 0)
    check('Unavailable account is never shown as empty or zero')
    accountMode = 'wrong-deployment'
    await page.getByRole('button', { name: 'Look up address', exact: true }).click()
    await page.locator('#wallet-error').waitFor()
    assert.equal(await page.locator('.lookup-result').count(), 0)
    check('Account snapshot for another deployment is rejected')
    accountMode = 'rate'
    await page.getByRole('button', { name: 'Look up address', exact: true }).click()
    await page.locator('#wallet-error').filter({ hasText: 'busy' }).waitFor()
    const previous = accountRequests
    await page.getByRole('button', { name: 'Look up address', exact: true }).click()
    assert.equal(accountRequests, previous)
    check('Account Retry-After is respected')
    await page.getByRole('button', { name: 'Session', exact: true }).focus()
    await page.keyboard.press('Space')
    assert.equal(await page.getByRole('button', { name: 'Session', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'Pause live updates' }).click()
    const held = wheelRequests
    const heldRpc = rpcRequests
    await sleep(2_300)
    assert.equal(wheelRequests, held)
    assert.equal(rpcRequests, heldRpc)
    assert.equal(await page.locator('.live-state').textContent(), 'Paused')
    await page.getByRole('button', { name: 'Resume live updates' }).click()
    await page.locator('.live-state').filter({ hasText: 'ACTIVE' }).waitFor()
    check('Keyboard chart range and pause/resume work; polling stops while paused')
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
    const hiddenCount = wheelRequests
    await sleep(2_300)
    assert.equal(wheelRequests, hiddenCount)
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
    await page.waitForFunction(count => Number(document.querySelector('.chart-summary div:last-child dd')?.textContent.replace(/,/g, '')) > count, Number(await page.locator('.chart-summary div:last-child dd').textContent()))
    check('Hidden tabs stop polling and resume on visibility')
    wheelMode = 'idle'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.locator('.live-state').filter({ hasText: 'IDLE' }).waitFor()
    assert.equal(await page.locator('.metric-value').nth(1).textContent(), '0')
    check('IDLE displays a real zero RPM')
    wheelMode = 'fault'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.locator('.live-state').filter({ hasText: 'Counter fault' }).waitFor()
    assert.equal(await page.locator('.metric-value').nth(1).textContent(), '—')
    check('Counter faults do not appear as rest or contribute RPM samples')
    wheelMode = 'stale'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.locator('.live-state').filter({ hasText: 'Unknown' }).waitFor()
    assert.equal(await page.locator('.metric-value').nth(1).textContent(), '—')
    check('Old sensor readings become Unknown instead of live ACTIVE')
    wheelMode = 'error'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.getByText('Live feed paused — retrying.', { exact: true }).waitFor()
    assert.equal(await page.locator('.metric-value').nth(2).textContent(), '366')
    await page.screenshot({ path: `${output}/feed-error-390.png`, fullPage: true })
    check('Feed error preserves confirmed snapshot and shows required retry copy')
    wheelMode = 'active'
    await page.locator('.live-state').filter({ hasText: 'ACTIVE' }).waitFor({ timeout: 15_000 })
    check('Feed automatically recovers without another click')
    rpcMode = 'partial'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.getByText(/Sepolia reads partially unavailable/).waitFor()
    assert.equal(await page.locator('.metric-value').nth(3).textContent(), '—')
    assert.equal(await page.locator('.metric-value').nth(4).textContent(), 'Open')
    check('One failed contract view stays unknown; independent views remain usable')
    rpcMode = 'wrong-chain'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.getByText(/Sepolia reads unavailable/).waitFor()
    assert.equal(await page.locator('.protocol-title .flag.on').count(), 0)
    check('Wrong-chain RPC rejected; protocol flags are unknown')
    rpcMode = 'normal'
    await page.getByRole('button', { name: 'Refresh now' }).click()
    await page.locator('.protocol-title .flag.on').first().waitFor()
    assert.deepEqual([...wireMethods].sort(), ['eth_blockNumber', 'eth_call', 'eth_chainId'])
    check('RPC traffic is exclusively read-only')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    assert.equal(await page.locator('.wheel-rim').evaluate(el => getComputedStyle(el).animationName), 'wheel-turn')
    check('Active wheel animation follows the motion preference')
  }
  if (engine === chromium) {
    await page.getByRole('button', { name: 'Copy SqueekNFT address' }).click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '0xC4C7982657f00509548F3a3a41db7FA439a6856B')
    check('Contract chip copies the complete address')
    if (report.mode === 'fixture') {
      await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('test-only clipboard permission failure')) })
      await page.getByRole('button', { name: 'Copy SqueekMining address' }).click()
      await page.getByText('Select the address to copy it manually.', { exact: true }).waitFor()
      check('Clipboard permission failure gives a manual-copy recovery')
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.wheel-rim').evaluate(el => getComputedStyle(el).animationName), 'none')
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0)
  check('Reduced motion disables wheel animation; no address storage')
  const shares = await page.locator('meta[property="og:image"]').getAttribute('content')
  assert.equal((await page.request.get(new URL(shares, url).href)).status(), 200)
  assert.deepEqual(report.browserErrors, [])
  assert.deepEqual(report.failedResources, [])
  check('Share image exists; no page exceptions or failed local resources')
  const unexpectedConsole = report.consoleErrors.filter(message => report.mode === 'live' || !/status of (429|503)/.test(message))
  const unexpectedRequests = report.failedRequests.filter(request => !/abort|cancel/i.test(request.error ?? ''))
  assert.deepEqual(unexpectedConsole, [])
  assert.deepEqual(unexpectedRequests, [])
  check('No unexpected console errors or failed network requests', report.consoleErrors.length ? `${report.consoleErrors.length} expected HTTP errors from deliberate outage/rate-limit fixtures` : 'No console errors')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${output}/${report.mode}-desktop-final.png`, fullPage: true })
  await context.close()
} catch (error) {
  report.failure = error.stack
  if (page && !page.isClosed()) {
    report.errorText = await page.locator('#wallet-error').textContent().catch(() => null)
    await page.screenshot({ path: `${output}/${report.mode}-failure.png`, fullPage: true }).catch(() => {})
  }
  process.stderr.write(`${error.stack}\n`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await new Promise(done => server.close(done))
  await writeFile(`${output}/${report.mode}${process.argv.includes('--webkit') ? '-webkit' : ''}.json`, JSON.stringify(report, null, 2))
}
