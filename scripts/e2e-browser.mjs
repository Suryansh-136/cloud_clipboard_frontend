/**
 * Real-browser end-to-end test that drives a browser ALREADY INSTALLED on the
 * machine (Chrome / Edge) through playwright-core — no browser download needed.
 *
 *   npm run e2e                       # registers a fresh account through the UI
 *   E2E_EMAIL=… E2E_PASSWORD=… npm run e2e
 *
 * It builds nothing: run `npm run build` first (or use `npm run e2e` which chains it).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const projectRoot = path.resolve(import.meta.dirname, '..')
const artifactsDir = path.join(projectRoot, '.e2e-artifacts')
const PORT = 4178
const BASE = `http://localhost:${PORT}`
const API_ORIGIN = (process.env.VITE_API_BASE_URL || 'https://cloud-clipboard-e1x6.onrender.com').replace(/\/+$/, '')

/**
 * The deployed backend allowlists only production frontend origins, so a page
 * served from localhost gets "Disallowed CORS origin". Tests still hit the REAL
 * API: Playwright forwards each request with an allowed Origin and re-attaches
 * CORS headers for the local page. Override with E2E_ALLOWED_ORIGIN.
 */
const BACKEND_ALLOWED_ORIGIN =
  process.env.E2E_ALLOWED_ORIGIN || 'https://cloud-clipboard-frontend.vercel.app'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding',
  'accept-encoding',
])

const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
    : null,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/microsoft-edge',
].filter(Boolean)

const checks = []
let shotIndex = 0

function check(name, passed, detail = '') {
  checks.push({ name, passed, detail })
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `  :: ${detail}` : ''}`)
}

async function screenshot(page, label) {
  shotIndex += 1
  const file = path.join(artifactsDir, `${String(shotIndex).padStart(2, '0')}-${label}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`      📸 ${path.relative(projectRoot, file)}`)
  return file
}

/** Try the installed browser first, then Playwright channel names, then headed. */
async function launchBrowser(executablePath) {
  const attempts = [
    { label: `installed browser (headless) — ${path.basename(executablePath)}`, options: { executablePath, headless: true } },
    { label: 'channel: chrome (headless)', options: { channel: 'chrome', headless: true } },
    { label: 'channel: msedge (headless)', options: { channel: 'msedge', headless: true } },
    { label: 'installed browser (headed window)', options: { executablePath, headless: false } },
  ]

  const failures = []
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch({
        args: ['--no-first-run', '--no-default-browser-check', '--disable-features=Translate'],
        ...attempt.options,
      })
      console.log(`browser: ${attempt.label}\n`)
      return { browser, label: attempt.label }
    } catch (error) {
      failures.push(`${attempt.label}: ${error.message.split('\n')[0]}`)
    }
  }

  throw new Error(`Could not launch any browser:\n  ${failures.join('\n  ')}`)
}

/**
 * Render's free tier sleeps the API. Wake it before the UI run so the first
 * live auth call is not the one paying the ~50s cold-start bill.
 */
async function warmBackend() {
  const startedAt = Date.now()

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(`${API_ORIGIN}/health`, {
        signal: AbortSignal.timeout(30000),
      })
      if (response.ok) {
        console.log(`backend : warm after ${Date.now() - startedAt}ms\n`)
        return true
      }
    } catch {
      /* sleeping or unreachable — retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  console.log('backend : /health did not answer in time — continuing anyway\n')
  return false
}

/**
 * Test-only CORS bridge. `page.route` handlers (like the guest-lookup mock) run
 * before context routes, so deliberately mocked endpoints are unaffected.
 */
async function installCorsBridge(context) {
  await context.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const requestHeaders = request.headers()
    const corsHeaders = {
      'access-control-allow-origin': BASE,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers':
        requestHeaders['access-control-request-headers'] || 'content-type, authorization, accept',
      'access-control-max-age': '600',
    }

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    const forwardHeaders = {}
    for (const [name, value] of Object.entries(requestHeaders)) {
      if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) forwardHeaders[name] = value
    }
    forwardHeaders.origin = BACKEND_ALLOWED_ORIGIN

    try {
      const response = await fetch(request.url(), {
        method: request.method(),
        headers: forwardHeaders,
        body: ['GET', 'HEAD'].includes(request.method()) ? undefined : request.postDataBuffer(),
        redirect: 'manual',
      })

      const responseHeaders = { ...corsHeaders }
      for (const [name, value] of response.headers.entries()) {
        const lower = name.toLowerCase()
        if (HOP_BY_HOP_HEADERS.has(lower) || lower.startsWith('access-control-')) continue
        responseHeaders[name] = value
      }

      await route.fulfill({
        status: response.status,
        headers: responseHeaders,
        body: Buffer.from(await response.arrayBuffer()),
      })
    } catch (error) {
      console.log(`      ⚠ CORS bridge failed: ${request.method()} ${request.url()} — ${error.message}`)
      await route.fulfill({
        status: 502,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ detail: `E2E CORS bridge could not reach the backend: ${error.message}` }),
      })
    }
  })
}

async function run() {
  const executablePath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!executablePath) {
    throw new Error('No system browser found — set BROWSER_PATH to your chrome/edge executable.')
  }
  if (!existsSync(path.join(projectRoot, 'dist/index.html'))) {
    throw new Error('dist/index.html is missing — run `npm run build` first.')
  }

  mkdirSync(artifactsDir, { recursive: true })
  await warmBackend()

  const server = await preview({
    root: projectRoot,
    logLevel: 'error',
    preview: { port: PORT, strictPort: true },
  })

  const { browser } = await launchBrowser(executablePath)
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await installCorsBridge(context)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })

  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', (message) => {
    // The guest invalid-key case is mocked on purpose, so its failed network
    // entry (logged by the browser) is not an app console error.
    const source = message.location()?.url ?? ''
    if (
      message.type() === 'error' &&
      !message.text().includes('favicon') &&
      !source.includes('/items/public/')
    ) {
      consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(API_ORIGIN)) {
      console.log(
        `      ⚠ request failed: ${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`,
      )
    }
  })

  const apiFailures = []
  page.on('response', (response) => {
    // The guest lookup is deliberately mocked (including its error case), so it
    // is excluded from the live-API failure counter.
    if (
      response.url().startsWith(API_ORIGIN) &&
      !response.url().includes('/items/public/') &&
      response.status() >= 400
    ) {
      apiFailures.push(`${response.status()} ${response.request().method()} ${response.url()}`)
    }
  })

  const stamp = Date.now()
  const snippetLine = `E2E snippet ${stamp}`
  const snippetBody = `${snippetLine}\nsecond line that must land on the clipboard`
  const fileName = `e2e-note-${stamp}.txt`
  const credentials =
    EMAIL && PASSWORD
      ? { email: EMAIL, password: PASSWORD, fresh: false }
      : { email: `cline.e2e.${stamp}@example.com`, password: 'BridgeE2E123!', fresh: true }

  console.log(`app      : ${BASE}`)
  console.log(`browser  : ${path.basename(executablePath)}`)
  console.log(`account  : ${credentials.email}${credentials.fresh ? '  (registered through the UI)' : ''}\n`)

  try {
    /* ---------- 1. route guard ---------- */
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForURL('**/login', { timeout: 45000 }).catch(() => {})
    check('signed-out /dashboard redirects to /login', page.url().endsWith('/login'), page.url())
    await page.waitForSelector('#email', { timeout: 30000 })

    const assertAuthThemeToggle = async (routeLabel) => {
      const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/ })
      const box = await toggle.boundingBox()
      check(
        `${routeLabel} page exposes a top-right theme toggle`,
        Boolean(box && box.x > 1100 && box.y < 100),
        box ? `x=${Math.round(box.x)}, y=${Math.round(box.y)}` : 'not visible',
      )

      const before = await page.evaluate(() => document.documentElement.dataset.theme || 'dark')
      await toggle.click()
      await page.waitForFunction(
        (previous) => (document.documentElement.dataset.theme || 'dark') !== previous,
        before,
        { timeout: 5000 },
      )
      const after = await page.evaluate(() => document.documentElement.dataset.theme)
      check(
        `${routeLabel} theme toggle updates the active palette`,
        after === 'light' || after === 'dark',
        `${before} -> ${after}`,
      )
    }

    await assertAuthThemeToggle('login')
    await screenshot(page, 'login-theme')

    /* ---------- 1b. guest lookup (public route mocked, no backend data) --- */
    let guestResponse = {
      status: 200,
      body: [
        {
          id: 9001,
          user_id: 3,
          content_type: 'text',
          text_payload: 'Shared clip from the E2E mock\nsecond line',
          file_path: null,
          created_at: '2026-09-23T11:22:53.424263',
        },
        {
          id: 9002,
          user_id: 3,
          content_type: 'file',
          text_payload: 'guest-demo.txt',
          file_path: 'https://mega.co.nz/#!GuestDemo!SharedFile',
          created_at: null,
        },
      ],
    }

    await page.route('**/api/v1/items/public/**', (route) =>
      route.fulfill({
        status: guestResponse.status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(guestResponse.body),
      }),
    )

    await page.getByRole('button', { name: /Guest Access/ }).click()
    await page.waitForSelector('#shareKey')
    check('guest access panel opens on the login page', await page.locator('#shareKey').isVisible())

    await page.fill('#shareKey', 'clip-e2e-demo')
    await page.getByRole('button', { name: 'View Clips' }).click()
    await page.waitForSelector('text=Shared clip from the E2E mock', { timeout: 15000 })
    check('guest clips render inline without navigating away', page.url().endsWith('/login'))
    check(
      'guest file clip renders its provider link',
      (await page
        .locator('article')
        .filter({ hasText: 'guest-demo.txt' })
        .locator('a[href^="https://mega"]')
        .count()) > 0,
    )
    await screenshot(page, 'guest-access')

    const guestTextCard = page.locator('article').filter({ hasText: 'Shared clip from the E2E mock' })
    await guestTextCard.getByRole('button', { name: 'Copy Text' }).click()
    check(
      'guest copy button flips to its "Copied!" state',
      await guestTextCard
        .getByRole('button', { name: 'Copied!' })
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false),
    )
    const guestClipboard = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')
    check(
      'guest copy writes the exact clip body',
      guestClipboard === 'Shared clip from the E2E mock\nsecond line',
      JSON.stringify(guestClipboard).slice(0, 70),
    )

    await page.getByRole('button', { name: 'Clear / Back' }).click()
    await page.waitForSelector('#shareKey', { state: 'detached' })
    check('Clear / Back returns to the login form view', await page.locator('#email').isVisible())

    guestResponse = { status: 404, body: { detail: 'Invalid or expired share key' } }
    await page.getByRole('button', { name: /Guest Access/ }).click()
    await page.waitForSelector('#shareKey')
    await page.fill('#shareKey', 'wrong-key')
    await page.getByRole('button', { name: 'View Clips' }).click()
    await page.waitForSelector('text=Invalid Share Key', { timeout: 15000 })
    check('invalid share key shows a friendly error', true)
    await page.getByRole('button', { name: 'Clear / Back' }).click()
    await page.waitForSelector('#shareKey', { state: 'detached' })

    await page.unroute('**/api/v1/items/public/**')

    await page.locator('.clay-tab', { hasText: 'Create account' }).click()
    await page.waitForSelector('#confirmPassword')
    await assertAuthThemeToggle('register')
    await screenshot(page, 'register-theme')

    /* ---------- 2. auth ---------- */
    if (credentials.fresh) {
      await page.fill('#email', credentials.email)
      await page.fill('#password', credentials.password)
      await page.fill('#confirmPassword', credentials.password)

      const registerResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/auth/register'),
        { timeout: 120000 },
      )
      await page.locator('form').getByRole('button', { name: 'Create account' }).click()
      const registerResponse = await registerResponsePromise.catch(() => null)

      let registerDetail = credentials.email
      if (!registerResponse) {
        registerDetail = `no response from /auth/register — ${credentials.email}`
      } else if (!registerResponse.ok()) {
        const body = (await registerResponse.text().catch(() => '')).slice(0, 140)
        registerDetail = `${registerResponse.status()} ${body}`
      }

      if (!registerResponse?.ok()) {
        const diagnostics = await page.evaluate(() => ({
          email: document.querySelector('#email')?.value ?? null,
          passwordLength: document.querySelector('#password')?.value?.length ?? 0,
          confirmLength: document.querySelector('#confirmPassword')?.value?.length ?? 0,
          alert: document.querySelector('[role="alert"]')?.textContent?.trim() ?? null,
        }))
        console.log(`      register diagnostics: ${JSON.stringify(diagnostics)}`)
        console.log(`      console errors: ${JSON.stringify(consoleErrors.slice(-6))}`)
        console.log(`      api failures: ${JSON.stringify(apiFailures.slice(-6))}`)
        await screenshot(page, 'register-error')
      }

      check('registered a new account through the UI', Boolean(registerResponse?.ok()), registerDetail)
    } else {
      await page.locator('.clay-tab', { hasText: 'Sign in' }).click()
      await page.waitForSelector('#confirmPassword', { state: 'detached' })
      await page.fill('#email', credentials.email)
      await page.fill('#password', credentials.password)
      await page.locator('form').getByRole('button', { name: 'Sign in to dashboard' }).click()
    }

    await page.waitForURL('**/dashboard', { timeout: 90000 })
    await page.waitForSelector('text=Your clipboard', { timeout: 45000 })
    check('login lands on the dashboard', page.url().includes('/dashboard'))

    const token = await page.evaluate(() => localStorage.getItem('token'))
    check('JWT stored in localStorage under "token"', Boolean(token) && token.split('.').length === 3, token ? `${token.length} chars` : 'missing')

    check('navbar shows the signed-in email', await page
      .locator('header')
      .getByTitle(credentials.email)
      .first()
      .waitFor({ state: 'visible', timeout: 30000 })
      .then(() => true)
      .catch(() => false))

    /* ---------- 3. token survives a reload ---------- */
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('text=Your clipboard', { timeout: 45000 })
    check('session is restored after a hard reload', page.url().includes('/dashboard'))
    await screenshot(page, 'dashboard-empty')

    /* ---------- 3a. public share key widget ---------- */
    check(
      'share key widget replaced the Bridge tips card',
      (await page.getByRole('heading', { name: 'Public Share Link' }).count()) === 1 &&
        (await page.getByText('Bridge tips').count()) === 0,
    )

    await page.getByRole('button', { name: 'Generate Public Key' }).click()
    const shareKeyInput = page.locator('#publicShareKey')
    await shareKeyInput.waitFor({ state: 'visible', timeout: 45000 })
    const shareKey = await shareKeyInput.inputValue()
    check('generated share key is displayed in a read-only field', shareKey.length !== 0, shareKey.length + ' chars')
    check('share key field is read-only', (await shareKeyInput.getAttribute('readonly')) !== null)

    await page.getByRole('button', { name: 'Copy Key' }).click()
    check(
      'share key copy button shows feedback',
      await page
        .getByRole('button', { name: 'Copied!' })
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false),
    )
    const clipboardKey = (await page.evaluate(() => navigator.clipboard.readText())).trim()
    check('clipboard holds the exact share key', clipboardKey === shareKey, clipboardKey.length + ' chars')
    await screenshot(page, 'share-key-widget')

    /* ---------- 3b. light/dark theme toggle (Navbar, next to logout) --- */
    const themeToggle = page.locator('header').getByRole('button', { name: /Switch to (light|dark) mode/ })
    const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme || 'dark')
    await themeToggle.click()
    await page.waitForFunction(
      (previous) => (document.documentElement.dataset.theme || 'dark') !== previous,
      themeBefore,
      { timeout: 5000 },
    )
    const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme)
    check('theme toggle flips the active palette', themeAfter === 'light' || themeAfter === 'dark', themeBefore + ' -> ' + themeAfter)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header', { timeout: 20000 })
    check(
      'theme survives a hard reload',
      (await page.evaluate(() => document.documentElement.dataset.theme)) === themeAfter &&
        (await page.evaluate(() => localStorage.getItem('theme'))) === themeAfter,
      themeAfter,
    )
    check('share key survives a hard reload', (await page.locator('#publicShareKey').inputValue()) === shareKey)

    await screenshot(page, 'dashboard-theme')
    // Switch back so the rest of the flow runs in the default palette.
    await page.locator('header').getByRole('button', { name: /Switch to (light|dark) mode/ }).click()
    await page.waitForFunction(
      (previous) => (document.documentElement.dataset.theme || 'dark') !== previous,
      themeAfter,
      { timeout: 5000 },
    )

    /* ---------- 4. save a text snippet ---------- */
    const articlesBefore = await page.locator('article').count()
    await page.fill('#snippet-title', 'E2E title (dropped by the API by design)')
    await page.fill('#snippet-content', snippetBody)
    await page.locator('form').getByRole('button', { name: 'Save Snippet' }).click()

    const textCard = page.locator('article').filter({ hasText: snippetLine }).first()
    await textCard.waitFor({ state: 'visible', timeout: 45000 })
    check('saved snippet appears in the feed', true, await textCard.locator('h3').first().innerText())
    check('snippet card is typed as a text snippet', await textCard.getByText('Text snippet').isVisible())

    /* ---------- 5. copy to clipboard ---------- */
    await textCard.getByRole('button', { name: 'Copy to Clipboard' }).click()
    // Wait for the label flip (it reverts after 2s, so assert it before slow work).
    check('copy button flips to its "Copied!" state', await textCard
      .getByRole('button', { name: 'Copied!' })
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false))

    const clipboard = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')
    check('clipboard holds the exact snippet body', clipboard === snippetBody, JSON.stringify(clipboard).slice(0, 70))

    /* ---------- 6. upload a file ---------- */
    const tempFile = path.join(artifactsDir, fileName)
    writeFileSync(tempFile, `hello from the E2E browser ${stamp}\n`)

    await page.locator('.clay-tab', { hasText: 'Media / File Upload' }).click()
    await page.setInputFiles('input[type="file"]', tempFile)
    await page.waitForSelector(`text=${fileName}`, { timeout: 20000 })
    check('staged file chip shows the file name', true)

    await page.locator('form').getByRole('button', { name: 'Upload File' }).click()

    const fileCard = page.locator('article').filter({ hasText: fileName }).first()
    await fileCard.waitFor({ state: 'visible', timeout: 180000 })
    check('uploaded file card appears in the feed', true)
    check('file card shows the storage provider badge', await fileCard.getByText('MEGA').first().isVisible())
    check('file card links to the external share URL', (await fileCard.locator('a[href^="https://mega"]').count()) > 0)

    await screenshot(page, 'items-feed')

    /* ---------- 7. delete both items ---------- */
    for (const [label, card] of [
      ['snippet', textCard],
      ['file', fileCard],
    ]) {
      await card.getByRole('button', { name: 'Delete' }).click()
      check(`${label} card asks for confirmation first`, await card.getByRole('button', { name: 'Confirm' }).isVisible())
      await card.getByRole('button', { name: 'Confirm' }).click()
      await card.waitFor({ state: 'detached', timeout: 45000 })
      check(`${label} card is removed from the feed`, (await card.count()) === 0)
    }

    if (articlesBefore === 0) {
      await page.waitForSelector('text=Your bridge is empty', { timeout: 45000 })
      check('empty state returns once everything is deleted', true)
    } else {
      const articlesAfter = await page.locator('article').count()
      check('feed returns to its pre-test size', articlesAfter === articlesBefore, `${articlesBefore} -> ${articlesAfter}`)
    }
    await screenshot(page, 'feed-after-delete')

    /* ---------- 8. logout ---------- */
    await page.locator('header').getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL('**/login', { timeout: 45000 })
    check('logout returns to the login screen', page.url().endsWith('/login'))
    check('logout cleared the stored token', (await page.evaluate(() => localStorage.getItem('token'))) === null)

    /* ---------- 8b. live guest lookup with the real generated key ---------- */
    await page.getByRole('button', { name: /Guest Access/ }).click()
    await page.waitForSelector('#shareKey')
    await page.fill('#shareKey', shareKey)

    const publicLookup = page.waitForResponse(
      (response) => response.url().includes('/items/public/') && response.request().method() === 'GET',
      { timeout: 45000 },
    )
    await page.getByRole('button', { name: 'View Clips' }).click()
    const publicResponse = await publicLookup.catch(() => null)
    check(
      'real share key returns live clips from the public endpoint',
      publicResponse?.status() === 200,
      publicResponse ? `${publicResponse.status()}` : 'no response',
    )
    check('guest lookup stays on the login page', page.url().endsWith('/login'))

    /* ---------- 9. hygiene ---------- */
    check('no uncaught errors in the browser console', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300))
    check('no failed calls to the API', apiFailures.length === 0, apiFailures.join(' | ').slice(0, 300))
  } finally {
    await browser.close().catch(() => {})
    await server.close().catch(() => {})
  }

  report()
}

function report() {
  const failed = checks.filter((row) => !row.passed)
  console.log(`\nsummary: ${checks.length - failed.length}/${checks.length} passed`)
  if (failed.length) {
    console.log('failures:', JSON.stringify(failed, null, 2))
    process.exitCode = 1
  }
  console.log(`screenshots: ${path.relative(projectRoot, artifactsDir)}`)
}

run().catch((error) => {
  console.error('\nE2E run crashed:', error)
  process.exitCode = 1
})

