# AarogyaHub admin panel

The admin console of the AarogyaHub telemedicine platform. It follows the *System Architecture* document (folder layout in section 5, API in section 8) and the *Frontend Design System* (colours, type, components).

It is written in plain React with TypeScript: React Router for pages, Tailwind for styling and axios for the API. There is no state-management or form library.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

In development the app runs against a **fake backend** (`src/mocks`), so no server is needed. On the login page, click **Fill demo login**. The sample data resets every time you reload the page.

`patient@aarogyahub.in` / `Patient@123` is also available, to see what a non-admin gets.

| Command | What it does |
|---|---|
| `npm run dev` | Start the app with the fake backend |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run lint` | Check the code with ESLint (including accessibility rules) |
| `npm run test` | Run the tests |

## Using the real backend

Create `.env.local`:

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
```

The backend must allow this site with credentials, because the refresh token is an HttpOnly cookie.

## Folders

```
src/
  main.tsx                 Starts the app
  app/
    router.tsx             Every URL and the page it shows. Start reading here.
    providers.tsx          Wraps the app: sign-in state and toast messages
    RequireRole.tsx        Only lets admins into /admin
  api/                     Talking to the backend
    client.ts              axios client: adds the token, renews it on 401, turns errors into ApiError
    auth.ts                login, logout, refresh
    admin.ts               Admin actions: verifyDoctor, setUserBlocked, publishArticle, ...
    types.ts               The shapes of the data (from the architecture doc)
  features/
    auth/                  Login page
    admin/
      AdminLayout.tsx      Sidebar + top bar around every admin page
      Sidebar.tsx
      overview/            Dashboard: numbers, charts, waiting doctors, recent activity
      verifications/       Doctor queue, review panel, document viewer
      users/               Accounts, block and unblock
      appointments/        Consultations, timeline, admin overrides
      kb/                  Chatbot knowledge base: list and editor
      audit/               Audit log, CSV export
    errors/                Not found, no access, crash pages
  components/ui/           Small building blocks: Button, Input, Select, Table, Modal, Badge, ...
  hooks/
    useApi.ts              Load data: const { data, loading, error } = useApi("/admin/users")
    useAuth.ts             Who is signed in
    useTheme.ts            Light / dark / system
    useDebounced.ts        Wait until typing stops (search boxes)
  store/AuthContext.tsx    Keeps the signed-in user
  lib/                     Plain helpers: dates in IST, rupees, form checks, cn()
  mocks/                   The fake backend (development and tests only)
  styles/theme.css         Design tokens: colours, type sizes, radius, motion
  test/                    Tests of the main admin flows
```

## How a page works

Take the Users page (`features/admin/users/UsersPage.tsx`):

1. Filters and the page number are ordinary `useState` values.
2. `useApi("/admin/users", { q, role, status, page })` loads the list. It loads again whenever a filter changes.
3. `<Table>` shows the rows, or a spinner, an error or "no results". `<Pagination>` shows the page buttons.
4. Clicking a row sets `openId`, which shows `<UserPanel>` on the right.
5. **Block user** calls `setUserBlocked()` from `api/admin.ts`. When it succeeds, `refreshData()` makes every list and panel on screen load again. That includes the audit log and the sidebar badge.

Every screen follows the same pattern.

## Adding a page

1. Create `src/features/admin/<name>/<Name>Page.tsx` ending with `export default function <Name>Page()`.
2. Add a line to `app/router.tsx` and a link to `NAV_ITEMS` in `features/admin/Sidebar.tsx`.
3. Add any new data types to `api/types.ts`, actions to `api/admin.ts`, and a fake endpoint in `mocks/handlers/`.

## API endpoints to agree with the backend team

`src/api/types.ts` follows the architecture document. The app also uses these endpoints, which the document doesn't list:

- `GET /admin/doctors/{id}` (doctor with documents)
- `GET /admin/doctors/{id}/documents/{doc_id}/view` (short-lived signed link, audited)
- `GET /admin/users/{id}` (user with consultation stats)
- `GET /admin/appointments` (list with filters)
- `POST /admin/kb/articles/{id}/publish` and `/unpublish`

Errors are expected as `{ "error": { "code", "message", "request_id" } }`. The request ID is shown to admins on error screens.

## Design notes

- Colours come only from the tokens in `styles/theme.css`, and ESLint rejects raw colours like `bg-[#123456]`.
- The admin sidebar is stone-800. Neem green is used for main actions, haldi for "waiting", and sindoor only for destructive actions.
- Status badges always pair colour with a dot and a word, so they don't rely on colour alone.
- Chart colours were checked for colour-blind separation on light and dark backgrounds.
- On phones the menu slides out from the left, rather than using the bottom tab bar (six sections don't fit).
- All text is English, written directly in the components. For Hindi or Punjabi later, the strings would move into a translation library such as i18next.
