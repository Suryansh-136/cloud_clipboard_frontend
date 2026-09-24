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

async function run() {
  const executablePath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!executablePath) {
    throw new Error('No system browser found — set BROWSER_PATH to your chrome/edge executable.')
  }
  if (!existsSync(path.join(projectRoot, 'dist/index.html'))) {
    throw new Error('dist/index.html is missing — run `npm run build` first.')
  }

  mkdirSync(artifactsDir, { recursive: true })

  const server = await preview({
    root: projectRoot,
    logLevel: 'error',
    preview: { port: PORT, strictPort: true },
  })

  const { browser } = await launchBrowser(executablePath)
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })

  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) {
      consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

  const apiFailures = []
  page.on('response', (response) => {
    if (response.url().includes('cloud-clipboard-e1x6.onrender.com') && response.status() >= 400) {
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

    await page.locator('.clay-tab', { hasText: 'Create account' }).click()
    await page.waitForSelector('#confirmPassword')
    await assertAuthThemeToggle('register')
    await screenshot(page, 'register-theme')

    /* ---------- 2. auth ---------- */
    if (credentials.fresh) {
      await page.fill('#email', credentials.email)
      await page.fill('#password', credentials.password)
      await page.fill('#confirmPassword', credentials.password)
      await page.locator('form').getByRole('button', { name: 'Create account' }).click()
      check('registered a new account through the UI', true, credentials.email)
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

