/**
 * Zero-dependency render smoke test.
 *
 *   npm run smoke
 *
 * Server-renders every page plus item cards for each real API row shape through
 * Vite's SSR pipeline. It catches things a bundle build cannot, e.g. identifiers
 * that were never imported (those only blow up at runtime in the browser).
 */
import path from 'node:path'
import { createServer } from 'vite'

const projectRoot = path.resolve(import.meta.dirname, '..')

/* Minimal browser globals — the app itself is a client-only SPA. */
globalThis.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  },
  setItem(key, value) {
    this.store.set(key, String(value))
  },
  removeItem(key) {
    this.store.delete(key)
  },
}

if (!globalThis.window) {
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    setTimeout: globalThis.setTimeout,
    location: { href: 'http://localhost/', pathname: '/' },
  }
}

const server = await createServer({
  root: projectRoot,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true },
  resolve: {
    alias: [
      {
        find: 'react-hot-toast',
        replacement: path.join(projectRoot, 'scripts/stubs/react-hot-toast.js'),
      },
    ],
  },
})

const checks = []
const check = (name, passed, detail = '') => {
  checks.push({ name, passed, detail })
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `  :: ${detail}` : ''}`)
}

try {
  const { renderAll } = await server.ssrLoadModule('/scripts/render-smoke-entry.jsx')
  const result = renderAll()
  const { pages } = result

  check('login page renders', pages.login.includes('Welcome back') && pages.login.includes('Sign in to dashboard'))
  check('login page has email + password fields', pages.login.includes('you@example.com') && pages.login.includes('type="password"'))
  check('register page renders confirm field', pages.register.includes('Confirm password') && pages.register.includes('Create account'))
  check('auth tabs switch between states', pages.login.includes('Create account') && pages.register.includes('Sign in instead'))

  check('dashboard renders navbar + logout', pages.dashboard.includes('Cloud ClipBoard') && pages.dashboard.includes('Logout'))
  check(
    'navbar renders a theme switcher',
    result.navbar.includes('Switch to light mode') || result.navbar.includes('Switch to dark mode'),
  )
  check('dashboard renders both action tabs', pages.dashboard.includes('Text Snippet') && pages.dashboard.includes('Media / File Upload'))
  check('dashboard renders the snippet form', pages.dashboard.includes('Save Snippet'))
  check('dashboard renders feed controls', pages.dashboard.includes('Your clipboard') && pages.dashboard.includes('Search snippets and files'))
  check('dashboard shows skeletons while loading', pages.dashboard.includes('clay-skeleton'))
  check('guarded route hides dashboard from anonymous users', !pages.guarded.includes('Add to your bridge') && !pages.guarded.includes('Save Snippet'))
  check('404 page renders', pages.notFound.includes('404') && pages.notFound.includes('Back to dashboard'))
  check('error boundary passes children through', pages.boundary.includes('healthy boundary'))

  const byId = new Map(result.items.map((row) => [row.normalized.id, row]))
  const textItem = byId.get(7)
  const megaItem = byId.get(8)
  const localFileItem = byId.get(9)

  check('items sorted newest first', result.items[0].normalized.id === 9 && result.items.at(-1).normalized.id === 7)

  check('text row normalises to a snippet', textItem.normalized.isText === true && textItem.normalized.title === 'Smoke snippet 42', JSON.stringify(textItem.normalized))
  check('text card renders copy action', textItem.html.includes('Copy to Clipboard') && textItem.html.includes('Text snippet'))
  check('text card renders the snippet body', textItem.html.includes('Smoke snippet 42'))

  check('MEGA row becomes an external file', megaItem.normalized.isExternalFile === true && megaItem.normalized.fileProvider === 'MEGA', JSON.stringify(megaItem.normalized))
  check('MEGA file name comes from the stored title', megaItem.normalized.fileName === 'smoke-upload.txt')
  check('MEGA card renders download + provider link', megaItem.html.includes('Download') && megaItem.html.includes('Open on') && megaItem.html.includes('https://mega.co.nz/'))
  check('MEGA card picks the icon from the extension', megaItem.html.includes('Text file'))

  check('server-local path stays internal', localFileItem.normalized.isExternalFile === false && localFileItem.normalized.fileName === '9-report.pdf', JSON.stringify(localFileItem.normalized))
  check('server-local card uses the backend proxy link', localFileItem.html.includes('Backend download proxy') && localFileItem.html.includes('PDF document'))

  const failed = checks.filter((row) => !row.passed)
  console.log(`\nsummary: ${checks.length - failed.length}/${checks.length} passed`)
  if (failed.length) {
    console.log('failures:', JSON.stringify(failed, null, 2))
    process.exitCode = 1
  }
} catch (error) {
  console.error('render smoke test crashed:', error)
  process.exitCode = 1
} finally {
  await server.close()
}
