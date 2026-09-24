/* Render smoke entry — imported by scripts/render-smoke.mjs through Vite's SSR loader. */
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

import { AuthPage } from '../src/components/AuthPage'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import { ItemCard } from '../src/components/ItemCard'
import { Navbar } from '../src/components/Navbar'
import { ProtectedRoute } from '../src/components/ProtectedRoute'
import { ToastHost } from '../src/components/ToastHost'
import { AuthProvider } from '../src/context/AuthContext'
import { ThemeProvider } from '../src/context/ThemeContext'
import { Dashboard } from '../src/pages/Dashboard'
import { NotFoundPage } from '../src/pages/NotFoundPage'
import { normalizeItems } from '../src/utils/items'

const withRouter = (element, path = '/') =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ThemeProvider>
          <ToastHost />
          {element}
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>,
  )

/** Rows shaped exactly like the live API's `ItemResponse`. */
const SAMPLE_ROWS = [
  {
    id: 7,
    user_id: 3,
    content_type: 'text',
    text_payload: 'Smoke snippet 42\nsecond line',
    file_path: null,
    created_at: '2026-09-23T11:22:53.424263',
  },
  {
    id: 8,
    user_id: 3,
    content_type: 'file',
    text_payload: 'smoke-upload.txt',
    file_path: 'https://mega.co.nz/#!O8xTkDpS!IGP5Ow_U-a3GpeBovphYD58euq9Q2AU_3HRcyq_wuCY',
    created_at: '2026-09-23T11:22:57.731727',
  },
  {
    id: 9,
    user_id: 3,
    content_type: 'file',
    text_payload: '',
    file_path: '/var/data/files/9-report.pdf',
    created_at: '2026-09-23T11:23:00.000000',
  },
]

export function renderAll() {
  const items = normalizeItems(SAMPLE_ROWS)

  return {
    pages: {
      login: withRouter(<AuthPage mode="login" />, '/login'),
      register: withRouter(<AuthPage mode="register" />, '/register'),
      dashboard: withRouter(<Dashboard />, '/dashboard'),
      notFound: withRouter(<NotFoundPage />, '/404'),
      guarded: withRouter(
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>,
        '/dashboard',
      ),
      boundary: renderToString(
        <ErrorBoundary>
          <p>healthy boundary</p>
        </ErrorBoundary>,
      ),
    },
    items: items.map((item) => ({
      normalized: {
        id: item.id,
        isText: item.isText,
        title: item.title,
        fileName: item.fileName,
        contentType: item.contentType,
        isExternalFile: item.isExternalFile,
        fileProvider: item.fileProvider,
        fileUrl: item.fileUrl,
      },
      html: renderToString(
        <MemoryRouter>
          <AuthProvider>
            <ThemeProvider>
              <ItemCard item={item} onDelete={() => {}} deleting={false} />
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>,
      ),
    })),
    navbar: withRouter(<Navbar />, '/dashboard'),
  }
}
