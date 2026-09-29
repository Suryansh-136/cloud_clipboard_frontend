# 🧱 Cloud ClipBoard — Claymorphic React Frontend

A production-ready, claymorphic (soft 3D "inflatable") React frontend for the deployed
**Personal Digital Bridge** FastAPI backend.

- **Live API:** `https://cloud-clipboard-e1x6.onrender.com`
- **Stack:** React 19 + Vite 8 + Tailwind CSS v4 (CSS-first config) + React Router DOM v6 + Axios + `lucide-react` + `react-hot-toast`
- **Verified against the live backend** — including several places where the real API
  contract differs from the original spec (documented in [API contract](#-api-contract-verified-against-the-live-backend)).

---

## 🚀 Quick start

```bash
# 1. install dependencies
npm install

# 2. (optional) point at your own backend
copy .env.example .env        # or: cp .env.example .env

# 3. run the dev server  ->  http://localhost:5173
npm run dev

# 4. production build + local preview
npm run build
npm run preview

# 5. render smoke test (no test framework required)
npm run smoke
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serves the built bundle locally |
| `npm run smoke` | Server-renders every page + item card and asserts on the markup |
| `npm run e2e` | Builds, serves `dist/`, then drives **your installed Chrome/Edge** through the real app |

### Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://cloud-clipboard-e1x6.onrender.com` | Any trailing slash is stripped automatically |
| `E2E_EMAIL` / `E2E_PASSWORD` | — | Reuse an existing account instead of registering a throwaway one |
| `E2E_ALLOWED_ORIGIN` | Vercel production URL | Origin the E2E CORS bridge forwards to the API |
| `BROWSER_PATH` | auto-detected | Force a specific Chrome / Edge executable |

The app boots with zero configuration: if `VITE_API_BASE_URL` is missing it falls back to
the production URL baked into `src/api/client.js`.

---

## 📁 Project structure

```
cloud_clipboard_frontend/
├── index.html                  # Google Fonts + favicon + #root
├── vite.config.js              # react() + tailwindcss() plugins
├── vercel.json                 # SPA rewrite so /login, /register, /dashboard deep-link
├── .env / .env.example         # VITE_API_BASE_URL
├── public/favicon.svg          # clay-styled clipboard glyph
├── scripts/
│   ├── render-smoke.mjs        # npm run smoke  (SSR render assertions)
│   ├── render-smoke-entry.jsx  # what gets rendered + sample API rows
│   └── stubs/react-hot-toast.js
└── src/
    ├── main.jsx                # React 19 createRoot
    ├── App.jsx                 # ErrorBoundary › BrowserRouter › AuthProvider › Routes
    ├── index.css               # ⭐ the whole claymorphism design system
    ├── api/
    │   ├── client.js           # axios instance, Bearer interceptor, 401 handling, error parsing
    │   ├── auth.js             # register · login (form-encoded) · me
    │   ├── items.js            # list · create text · upload · download · delete
    │   └── publicClips.js      # guest share-key lookup (no auth)
    ├── context/AuthContext.jsx # JWT lifecycle (localStorage key: `token`)
    ├── hooks/useItems.js       # feed state: load, refresh, prepend, delete
    ├── components/
    │   ├── AuthPage.jsx        # /login + /register (one animated card)
    │   ├── GuestClipLookup.jsx # Guest Access share-key lookup + inline clip list
    │   ├── ThemeToggleButton.jsx # shared light/dark switch (auth + navbar)
    │   ├── ProtectedRoute.jsx  # redirects anonymous users, clay session loader
    │   ├── Navbar.jsx          # logo badge · sync time · email badge · logout
    │   ├── ActionBox.jsx       # Text Snippet ⟷ Media / File Upload tabs
    │   ├── TextSnippetForm.jsx
    │   ├── FileUploadForm.jsx  # drag & drop + upload progress
    │   ├── ItemsFeed.jsx       # search, filters, skeletons, empty/error states
    │   ├── ItemCard.jsx        # copy · download · two-step delete
    │   ├── ErrorBoundary.jsx
    │   ├── ToastHost.jsx
    │   └── ui/                 # ClayButton, ClayCard, ClayField, ClayBadge,
    │                           # ClayIconBadge, ClayProgress, ClaySpinner
    ├── pages/Dashboard.jsx     # protected home screen
    ├── pages/NotFoundPage.jsx
    └── utils/                  # format · files · items · externalLinks · clipboard
```

---

## 🎨 Claymorphism design system (`src/index.css`)

Tailwind v4 is configured **CSS-first** — there is no `tailwind.config.js`. Everything lives in
`src/index.css`:

1. **Motion primitives** — `clay-float`, `clay-pop`, `clay-shimmer`, `clay-pulse-ring`.
2. **`@theme` tokens** — colours, fonts, radii, shadows and animations that generate Tailwind
   utilities: `bg-clay-900`, `text-mint`, `rounded-clay`, `shadow-clay`, `animate-float`, …
3. **`@layer base`** — deep indigo body gradient, clay scrollbars, selection colour.
4. **`@layer components`** — the reusable clay recipes.
5. **`prefers-reduced-motion`** — every animation is disabled for users who ask for that.

### Clay recipes available in JSX

| Class | Use |
| --- | --- |
| `clay-panel` | Large raised slab (auth card, dashboard panels) |
| `clay-card` / `clay-card-hover` | Item cards with a lift-on-hover transition |
| `clay-inset` / `clay-inset-sm` | Pressed-in surfaces (snippet preview, file info) |
| `clay-btn` + `clay-btn-{indigo,mint,violet,rose,ghost}` | Tactile buttons (`active:scale-95` built in) |
| `clay-field` / `clay-field-invalid` | Inset inputs with an indigo focus ring |
| `clay-dropzone` / `clay-dropzone-active` | Drag & drop target (turns mint while dragging) |
| `clay-tab-track` / `clay-tab` / `clay-tab-active` | The pill toggles used for tabs and filters |
| `clay-icon-badge` | Soft circular badge that hosts a lucide icon |
| `clay-progress-track` / `clay-progress-fill` | Indigo → violet → mint progress meter |
| `clay-chip`, `clay-divider`, `clay-skeleton`, `clay-text-gradient`, `clay-link` | Support pieces |

The canonical double shadow from the spec is used verbatim as a theme token:

```css
--shadow-clay: 8px 8px 16px #090d16, -8px -8px 16px #1e293b;
```

Component classes keep **literal** colour values instead of `var(--token)` on purpose: Tailwind v4
tree-shakes unused theme variables, so referencing them from hand-written CSS can silently break.

---

## 📡 API contract (verified against the live backend)

Authentication is OAuth2 password flow: the JWT is stored in `localStorage` under the key
**`token`** and injected by an Axios request interceptor as `Authorization: Bearer <token>`.
Any response that comes back `401` (except the login/register calls themselves) clears the token,
fires a `cloud-clipboard:unauthorized` event and the auth context signs the user out with a toast.

| Method | Endpoint | Body | Used for |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | JSON `{ email, password }` | Sign up (then auto sign-in) |
| `POST` | `/api/v1/auth/login` | `x-www-form-urlencoded` `username`, `password` | Sign in, returns `{ access_token, token_type }` |
| `GET` | `/api/v1/auth/me` | — | Profile badge (`{ id, email, is_active, created_at }`) |
| `GET` | `/api/v1/items/` | — | The feed |
| `POST` | `/api/v1/items/` | JSON `{ content_type, text_payload }` | Save a text snippet |
| `POST` | `/api/v1/items/upload` | multipart `file`, optional `title` | Upload a file |
| `GET` | `/api/v1/items/api/v1/items/{id}/download` | — | Backend download proxy (public route) |
| `DELETE` | `/api/v1/items/{id}` | — | Delete an item |
| `GET` | `/api/v1/items/public/{share_key}` | — | Guest share-key lookup (no auth, returns `ItemOut[]`) |
| `POST` | `/api/v1/auth/generate_share_key` | — | Mint/replace the signed-in user's `share_key` (used via `/docs`, no UI yet) |

### ⚠️ Where the real API differs from the original spec

These were discovered by probing the deployed service and are handled by the code:

1. **`POST /api/v1/items/text` does not exist.** The backend answers `405`; the working route is
   `POST /api/v1/items/` with `{ "content_type": "text", "text_payload": "…" }`.
2. **`ItemResponse` has no `title`, `type`, `content` or `file_name`.** The real shape is
   `{ id, user_id, content_type, text_payload, file_path, created_at }`:
   - text snippet → `content_type: "text"`, `text_payload` = the body, `file_path: null`
   - uploaded file → `content_type: "file"`, `text_payload` = **the optional upload title**,
     `file_path` = a storage URL
3. **The upload title is stored in `text_payload`, and the original file name is not persisted.**
   The card therefore falls back to the first line of a snippet (or the stored title for files) as
   the visible label, and `FileUploadForm` pre-fills the title with the **full file name including
   its extension** so the icon and label survive the round trip.
4. **`file_path` is an external share URL** (production uses MEGA, e.g.
   `https://mega.co.nz/#!…`), not a local path. The item card shows the provider badge and hands the
   link straight to the browser for downloads.
5. **The download proxy is double-prefixed *and* currently broken:**
   `GET /api/v1/items/api/v1/items/{id}/download` returns **HTTP 500** for real file items
   (the PRD's `/api/v1/items/{id}/download` returns 404). The UI only uses the proxy for
   server-local paths and otherwise relies on the share URL — the proxy URL is still shown on
   such cards so the endpoint stays discoverable.
6. **`created_at` is a naive UTC timestamp** (`2026-09-23T11:22:53.424263`). `parseApiDate()` appends
   `Z` before parsing so relative times are correct instead of shifted by your UTC offset.
7. **Cold starts are real.** The Render free instance sleeps; a request can take ~50 s. The client
   allows 120 s (300 s for uploads/downloads) and the feed explains the delay instead of failing.
8. **Guest share keys use a different path than the PRD.** `GET /api/v1/public/clips/{key}` does not
   exist; the deployed route is `GET /api/v1/items/public/{share_key}` (unauthenticated, returns
   `ItemOut[]`). Keys are minted with the authenticated
   `POST /api/v1/auth/generate_share_key`, whose response is `UserOut` with `share_key`. A bad key
   answers `404 {"detail":"Invalid or expired share key"}` (older builds answered 500); both are
   mapped to the inline “Invalid Share Key” message in `GuestClipLookup`.

---

## ✅ Feature walkthrough

### Auth (`/login`, `/register`)
- One clay card that morphs between states (`key={mode}` + `animate-pop`), with a segmented clay
  toggle and a link at the bottom; both states share validation logic.
- Inline field validation (email shape, 6-character minimum matching the backend, password confirm)
  plus the server's own `detail` message surfaced as a toast **and** an inset alert inside the card.
- Show/hide password, autocomplete hints, `aria-invalid` and `role="alert"` for screen readers.
- Register posts JSON and then signs in automatically with the same credentials.
- **Guest Access (login only):** a collapsible section under the form takes a share key (`clip…`)
  and calls the public route without an `Authorization` header. Clips render inline — no reload, no
  navigation — with per-clip **Copy Text** / **Copy Link**, provider links for file items and a
  **Clear / Back** action that resets the view and returns to the form. Loading, empty, invalid-key
  and network errors are shown inline (`role="alert"`). Keys are generated by the backend
  (`POST /api/v1/auth/generate_share_key`, e.g. via `/docs`); there is no dashboard UI for that yet.

### Dashboard (`/dashboard`, protected)
- **Navbar:** logo badge, item counter, relative "synced …" clock, manual refresh, the signed-in
  email badge and a rose clay **Logout** button.
- **Clay action box:** `Text Snippet` ⟷ `Media / File Upload` tabs, each with its own icon badge and
  description; the body re-animates on switch.
- **Text form:** title (optional) + multiline snippet with live word/character counts, a 20 000
  character guard and a `Save Snippet` clay button.
- **File form:** click-or-drag dropzone that turns mint while dragging, keyboard operable
  (`Enter`/`Space`), a staged-file chip with size and type, a 100 MB soft warning, a gradient upload
  progress meter and an `Upload File` button.
- **Feed:** search box + `All / Text / Files` filter with live counts, shimmering clay skeletons,
  a "bridge is empty" state, a "nothing matches" state with a clear-filters action and an error state
  with retry that explains cold starts.
- **Cards:** text cards show the snippet in an inset mono block with a one-click
  **Copy to Clipboard** button (with a legacy `execCommand` fallback); file cards show an
  extension-aware icon, the provider badge, the share link and a **Download** button; every card has
  a two-click confirm **Delete**.

---

## 🧪 What was verified

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 1 972 modules, no warnings |
| `npm run smoke` | ✅ 28/28 render assertions (all pages, all three item shapes, guest panel + results) |
| `npm run e2e` | ✅ **36/36 in a real browser** — headless Edge driving the built bundle, incl. the Guest Access flow |
| Dev server boot | ✅ `/`, `/src/main.jsx`, `/src/index.css` all HTTP 200 |
| Generated CSS | ✅ every `clay-*` class, `bg-linear-to-br` gradient and keyframe present |
| Live API end-to-end | ✅ register → login → me → create text → upload → list → delete (14 requests) |
| Timestamp semantics | ✅ confirmed the naive `created_at` values are UTC |
| Route guard + reload | ✅ `/dashboard` while signed out → `/login`; token survives a hard reload |
| Clipboard | ✅ the OS clipboard actually contained the snippet text after clicking Copy |
| Upload + delete | ✅ real MEGA upload, both cards deleted, empty state restored |
| Hygiene | ✅ zero console errors, zero failed API calls |
| Guest endpoint on Render | ✅ bad key → `404 {"detail":"Invalid or expired share key"}` (no longer 500) |

Three genuine bugs were found by the runtime tests (the browser run caught the third) and fixed:

1. `src/utils/files.js` referenced a `FileCode` icon that was never imported — a `ReferenceError` that
   only fires when a `.js/.ts/.py`-style file card renders (the bundler cannot see it).
2. Server-local `file_path` values linked the raw path instead of the backend proxy URL.
3. **`ItemCard` passed the whole item object to `removeItem(itemId)`**, so every delete hit
   `/api/v1/items/[object Object]` → 404. The build and the API-level tests could not catch this;
   only clicking the button in a browser did.

> The live-API smoke run created one throwaway account,
> `cline.smoke.<timestamp>@example.com`, on the deployed backend. Every item it created was deleted
> again; only that user row remains (there is no delete-user endpoint).

---

## 🧭 Real-browser E2E (`npm run e2e`)

Drives a browser **already installed on your machine** through `playwright-core` — no
`npx playwright install`, no ~120 MB Chromium download. It auto-detects Edge / Chrome / Brave
(`BROWSER_PATH` overrides that) and falls back to Playwright channel names, then to a headed window.

```bash
npm run e2e                       # registers a fresh account through the UI
# reuse an existing account instead:
E2E_EMAIL=you@example.com E2E_PASSWORD=secret npm run e2e
# PowerShell:  $env:E2E_EMAIL='you@example.com'; $env:E2E_PASSWORD='secret'; npm run e2e
```

Against the **built bundle** served from `dist/` it asserts:

1. `/dashboard` while signed out redirects to `/login`
2. signing in (or registering through the UI) lands on the dashboard
3. the JWT sits in `localStorage.token` and the navbar email badge renders
4. a hard reload restores the session from that token
5. a new snippet appears as a card, and the **real OS clipboard** contains the exact snippet body
   after clicking *Copy to Clipboard*
6. switching to the file tab, staging a temp file and uploading produces a card with the storage
   provider badge and share link
7. deleting both items (two-step confirm) removes the cards and restores the feed size
8. logout returns to `/login` and clears the token
9. there are **zero console errors and zero failed API calls** for the whole journey
10. the **Guest Access** panel on `/login` opens, mocked clips render inline (text + file), **Copy
    Text** puts the exact body on the clipboard, **Clear / Back** restores the form, and a bad key
    shows the friendly “Invalid Share Key” error — the public route is mocked, so no live data is
    touched

> **CORS bridge (test-only).** The deployed API allowlists only production frontend origins, so a
> page served from localhost would fail preflight. The harness forwards browser API calls with an
> allowed `Origin` (`E2E_ALLOWED_ORIGIN`, default the Vercel URL) and re-attaches CORS headers for
> the local page — requests still hit the real backend, and `page.route` mocks (the guest lookup)
> take precedence.

Every stage is screenshotted into `.e2e-artifacts/` (git-ignored) — a quick way to review the clay UI.
Each run pushes one tiny file through the backend's real storage provider and deletes the item again,
so point it at a test account.

---

## 🚢 Deployment

The build is a static SPA, so the only requirement is an SPA rewrite to `index.html`:

**Netlify** — `public/_redirects`:
```
/*  /index.html  200
```

**Vercel** — `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Then set `VITE_API_BASE_URL` in the host's environment variables if you are not using the default.

---

## 🔧 Troubleshooting & known limitations

- **"The server is taking too long to answer"** — the free Render instance was asleep. Reload or hit
  retry; the app keeps the session and retries cleanly.
- **Copy button does nothing** — `navigator.clipboard` needs HTTPS (or `localhost`). The fallback
  covers most cases; on a plain-HTTP LAN preview the browser may block both paths.
- **A file download opens MEGA instead of saving directly** — intentional: the backend's own
  download proxy currently returns `500`, so the share URL is the only reliable route.
- **No ESLint config is shipped** (it is not part of the requested stack). Add
  `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` and `globals`,
  then a flat `eslint.config.js`, if you want linting in CI.
- **`react-hot-toast` is not SSR-safe** in this version — the render smoke test aliases it to a stub
  (`scripts/stubs/react-hot-toast.js`). Irrelevant for the shipped SPA.
- **Uploads are single-file**; the endpoint accepts one `file` field per request.
- **Local dev against Render fails with a CORS error** — the deployed API allows only production
  origins. Point `VITE_API_BASE_URL` at your local FastAPI (and allow `http://localhost:5173` in its
  CORS config) or add the localhost origins to the backend allowlist. `npm run e2e` works around this
  with a test-only CORS bridge.
- **Where do I get a share key?** `POST /api/v1/auth/generate_share_key` with a Bearer token
  (Swagger `/docs` or curl) returns `UserOut.share_key`; paste that key into the Guest Access panel
  on `/login`. There is no dashboard UI for generating or copying it yet.
