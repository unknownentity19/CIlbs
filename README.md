# Cilbs

A modern multi-page marketing site and product hub for Cilbs — a visual AI workflow builder.

Built with **Next.js 16** (App Router, Turbopack), **React 19**, **Tailwind v4**, **Framer Motion**, **cmdk**, and **lucide-react**.

## Routes

| Path         | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| `/`          | Marketing home with full SaaS sections                   |
| `/product`   | Product overview + architecture + comparison             |
| `/features`  | Six in-depth features with use cases and UI mocks        |
| `/studio`    | Workflow builder — canvas, inspector, simulated runs (sign-in required) |
| `/about`     | Company story, principles, and team                      |
| `/solutions` | Industry use cases with example workflows                |
| `/docs`      | Developer docs with sticky sidebar                       |
| `/pricing`   | Tiered pricing, comparison table, FAQ                    |
| `/signin`    | Email + social sign-in (mocked, client-side persistence) |
| `/signup`    | Account creation with workspace + password strength      |
| `/dashboard` | Auth-gated mock dashboard                                |
| `/security`  | Security practices and vulnerability disclosure           |
| `/privacy`   | Privacy policy                                           |
| `/terms`     | Terms of service                                         |

Auth uses a client-side mock with `localStorage` to demonstrate the flow end-to-end. Replace `src/components/auth/auth-provider.tsx` with a real provider (NextAuth, Clerk, etc.) when wiring to a backend.

## The studio

`/studio` is a working, fully client-side workflow builder — no backend, no
account. It ships with:

- **Infinite canvas** with pan, pinch/⌘-scroll zoom, fit-to-view, and grid snap
- **Undo/redo** with gesture coalescing (one ⌘Z undoes a whole drag)
- **Branching**: edges out of a Condition carry a `true`/`false` label, and the
  simulated run skips the side that wasn't taken
- **Live validation** — orphan nodes, missing triggers, cycles, and unconfigured
  fields are listed in the Issues panel and select the node on click
- **Tidy layout**, JSON import/export, and a draft autosaved to `localStorage`
- **Keyboard shortcuts** throughout (press `?` for the list)

The runner in `src/app/studio/runner.ts` is a simulation: it walks the graph in
topological order and emits believable output per node. Nothing leaves the
browser, which is why the page labels itself a sandbox — swap the runner for a
real API client to make it live.

## Saving, and not losing work

The editor autosaves — 400ms to browser storage, 1.5s to the account when
server storage is available — but autosave alone isn't an answer to "did that
save?", so saving is also something you can do and see:

- **A Save button and ⌘S.** (⌘S used to export a JSON file, which is not what
  that key means to anyone; export moved to ⇧⌘E.)
- **A status that names the sink** — "Unsaved changes", "Saving…", "Saved in
  this browser", or "Saved to your account" — so it's never a guess where the
  work actually is.
- **A warning before it can be lost.** Leaving the site (closing the tab,
  reloading, typing another URL) triggers the browser's own confirm dialog;
  moving to another page inside the app, which never fires that event, is
  caught by a click interceptor in `src/components/navigation-guard.tsx`.
  Loading a template, clearing the canvas, and importing a file ask too.
- **A flush on the way out.** React unmount effects don't run when a tab is
  closed, so `pagehide` and `visibilitychange` write the draft synchronously
  and, for account storage, post it with `navigator.sendBeacon` — which the
  browser delivers after the page is gone. A `"use server"` action can't be
  called that way, which is why `/api/workflows/save` exists alongside it.

Two honest limits. The browser owns the wording of the leave-the-site dialog
and will only show it at all if you have interacted with the page — that is a
browser rule, not a choice. And a failed save deliberately leaves the draft
marked unsaved, so the warning keeps firing rather than quietly implying the
work is somewhere it isn't.

## Brand assets

`brand/logo-master.webp` is the artwork as supplied — 1254px with a real alpha
channel — and everything else is generated from it:

```bash
node scripts/generate-brand-assets.mjs
```

| Asset | Purpose |
| ----- | ------- |
| `public/logo.png` / `logo-512.png` | Transparent exports (1024 / 512); the app renders the 512 |
| `src/app/icon.png` | Favicon |
| `src/app/apple-icon.png` | iOS home screen, on a white plate — a transparent icon shows through as black there |
| `src/components/brand/mark-data.ts` | The mark as a data URI, because Satori renders the Open Graph card without filesystem access |

The generator trims the master's transparent margin and re-centres it before
resizing. That matters: the artwork's own padding is uneven (49px left against
33px right), so a straight resize would leave the mark visibly off-centre in a
square favicon.

The mark stays a raster rather than becoming an SVG on purpose — it is built
from overlapping translucent shapes with gradients, and tracing it to paths
would discard the blending that gives it its depth.

## Local development

```bash
npm install
npm run dev
```

The app will start on http://localhost:3000.

### Useful scripts

```bash
npm run dev         # Turbopack dev server
npm run build       # Production build
npm run start       # Run the production server locally
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (flat config, next/core-web-vitals + next/typescript)
npm run test        # Vitest unit tests
npm run check       # typecheck + lint + test, the same gate CI runs
npm run test:e2e    # Playwright end-to-end suite (builds and serves the app)
npm run db:generate # generate SQL migrations from the Drizzle schema
npm run db:migrate  # apply migrations
```

## Accounts and storage

Three shapes, decided entirely by which environment variables exist. Nothing
crashes in the leaner ones, which is what makes the site deployable before any
of it is set up.

| Configured | What you get |
| --- | --- |
| Nothing | The public site. Sign-in reports that it isn't configured, and `/studio` and `/dashboard` both redirect there — the editor fails closed rather than standing open. |
| `AUTH_SECRET` + an OAuth provider | Sign-in with GitHub or Google and **no database at all** — Auth.js runs on JWT sessions, so the session lives in a signed cookie. The editor opens once signed in, saving to browser storage. |
| `AUTH_SECRET` + `DATABASE_URL` | Accounts in Postgres (email/password and OAuth), plus studio workflows synced to the account and reachable from another device. |

The middle row is worth understanding before choosing it: signing in without a
database gives you an identity, not durability. The editor's work is still in
that one browser, so clearing site data or switching machines loses it whether
you were signed in or not. Email and password need the database either way —
there is nowhere else to keep the hash — so a database-less deployment offers
only the OAuth buttons, and the sign-in page says as much rather than showing
a form that cannot work.

### Setting it up on free tiers

1. Create a Postgres database — [Neon](https://neon.tech)'s free tier is the
   one this is tuned for. Copy the **pooled** connection string (the host with
   `-pooler` in it) so serverless instances don't exhaust the connection limit.
2. Generate a session secret: `openssl rand -base64 32`.
3. Put them in `.env.local` (see `.env.example`), then apply the schema:

```bash
npm run db:migrate
```

`drizzle.config.ts` loads `.env.local` itself, so the connection string never
has to go on a command line where your shell would record it. It prefers
`DIRECT_URL` when set — Neon's pooler is right for the app's short queries,
but schema changes are better off talking to the database directly.

4. Set the same two variables in your host's project settings before deploying.

### Sign-in methods

Email and password work as soon as `DATABASE_URL` and `AUTH_SECRET` are set. GitHub and
Google are optional and appear on the sign-in page only when configured —
`SocialButtons` asks Auth.js which providers exist and renders exactly those,
because a button for an unconfigured provider is a 500 rather than a login.

| Provider | Variables | Callback URL |
| --- | --- | --- |
| GitHub | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | `/api/auth/callback/github` |
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | `/api/auth/callback/google` |

Both providers link to an existing account with the same verified email
address, so signing up with a password and later clicking "Continue with
GitHub" lands in the same account instead of an "account not linked" dead end.

Neon's free tier suspends an idle database and wakes it on the next query, so
the first request after a quiet spell takes about a second. That is the trade
for $0 — and it's the reason to prefer it over free tiers that *pause* a
project until you unpause it by hand.

### Schema changes

```bash
npm run db:generate   # writes SQL to drizzle/ after editing src/db/schema.ts
npm run db:migrate    # applies pending migrations
npm run db:studio     # browse the data
```

Migrations are committed, so the schema history is reviewable.

### Backups

Free databases don't back themselves up.
`.github/workflows/backup.yml` runs `pg_dump` daily and keeps 30 days of
compressed dumps as workflow artifacts — add `DATABASE_URL` as a repository
secret to switch it on. It only works for a database GitHub can reach, so a
self-hosted Postgres bound to localhost needs the local equivalent instead
(`deploy/windows/backup.ps1` on a scheduled task). Restore with:

```bash
gunzip -c cilbs-YYYY-MM-DD.sql.gz | psql "$DATABASE_URL"
```

## Security

- **CSP** — a baseline policy in `next.config.ts` covers the static pages, and
  `src/proxy.ts` swaps in a strict nonce-based policy for authenticated routes.
  The split exists because Next can only attach a nonce to a dynamically
  rendered page; applying it everywhere would make the whole static site
  render per-request for no benefit.
- **Sessions** are signed httpOnly cookies (Auth.js, JWT strategy — required
  by the credentials provider). Passwords are bcrypt hashes, cost 12.
- **Route protection** is server-side. `src/proxy.ts` does a cheap cookie
  check at the edge, and the dashboard page plus every server action verify the
  session properly with `getSession()` / `requireUser()`.
- **Input validation** on every server action via zod, with caps on graph size
  so one request can't write an unbounded row.
- Other headers: HSTS (`vercel.json`), `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`,
  `Permissions-Policy`.

## Quality gates

`npm run check` runs the same three steps as CI: `tsc --noEmit`, ESLint, and the
Vitest suite. `npm run test:e2e` adds the Playwright suite, which builds the app
and drives it in a real browser. GitHub Actions
(`.github/workflows/ci.yml`) runs all of it — plus a production build and
`npm audit --omit=dev` — on every push and pull request.

The end-to-end suite has two halves. The **public** half runs against a
deployment with nothing configured — no database, no session secret — because
that is the state the site ships in and has to keep working in. The **gated**
half needs an account, since the editor is behind sign-in, and runs only with
`E2E_WITH_DB=1`:

```bash
node scripts/dev-postgres.mjs start
DATABASE_URL=postgresql://cilbs:cilbs@127.0.0.1:55432/cilbs npm run db:migrate
DATABASE_URL=... AUTH_SECRET=... npm run start -- --port 3100
E2E_WITH_DB=1 E2E_BASE_URL=http://127.0.0.1:3100 npx playwright test
```

A Playwright setup project signs in once and shares the session with the gated
specs, which run single-file — they share one account, and with cloud sync they
would otherwise overwrite each other's canvas mid-assertion. CI runs both
halves, with Postgres as a service container.

End-to-end specs live in `e2e/` and cover what a unit test can't: every public
page returning 200 with the right heading and no CSP or hydration errors, the
security headers, the sitemap, the dashboard's auth gate, and the studio
(template load, simulated run, undo, the issues panel). Unit tests live in
`tests/` and cover the studio's pure logic — graph ordering
and branch evaluation (`runner`), the linter behind the Issues panel
(`validate`), the tidy layout (`auto-layout`), undo/redo including gesture
coalescing (`history`), and draft parsing (`persistence`). React surfaces are
verified in a browser rather than mocked.

## Errors and telemetry

Client errors are caught by `src/app/error.tsx` (per route) and
`src/app/global-error.tsx` (root layout); server errors by `onRequestError` in
`src/instrumentation.ts`. All three go through `src/lib/telemetry.ts`.

By default reports POST to this app's own collector at `/api/telemetry`, which
records them in the `event_log` table — rate limited, size capped, written
after the response so a slow database never delays a page, and trimmed to the
newest 500 rows so it can't fill a free-tier disk. With no database configured
it falls back to the platform's log stream.

That means error visibility costs nothing and needs no account. To send
reports to a vendor instead, point them elsewhere:

```bash
NEXT_PUBLIC_TELEMETRY_URL=...   # browser errors and product events
TELEMETRY_URL=...               # server-side request errors
NEXT_PUBLIC_RELEASE=$(git rev-parse --short HEAD)
```

Note that a service expecting its own wire format (Sentry, for one) needs its
SDK rather than just a URL — the built-in payload is plain JSON.

Rate limiting (`src/lib/rate-limit.ts`) guards sign-up, login, and the
collector. It counts in process memory, so on serverless it applies per warm
instance rather than globally — enough to turn an unbounded loop into a slow
one, and honest about not being exact.

## Accessibility

`e2e/a11y.spec.ts` runs axe over the main pages in both themes and both
layouts, failing on any serious or critical violation. Fixing what it found
changed real things: `--muted-foreground` is a step darker (the old value
measured 4.43:1 on the accent surface, under the 4.5:1 AA floor), code-syntax
colours moved from 600 to 700 weights in light mode, wide code blocks and
comparison tables became keyboard-scrollable, and the studio's node cards are
`role="group"` rather than nested buttons.

The suite emulates reduced motion before measuring — mid-fade, axe samples a
partially transparent colour and reports failures that don't exist in the
shipped palette.

## Running it on your own server

There is a complete, copy-pasteable Windows runbook in
[`deploy/windows/README.md`](deploy/windows/README.md), with a service
installer, a Caddy config for automatic HTTPS, and a backup script. The rest of
this section is the platform-neutral version.

Everything here works on a plain VPS or a Windows box you RDP into — and it is
the one setup where the database costs nothing extra, because Postgres runs
beside the app instead of at a hosted provider.

**1. Install** Node 20+ and PostgreSQL 14+, then create the database:

```bash
createdb cilbs
psql cilbs -c "CREATE USER cilbs WITH PASSWORD 'choose-a-real-one'; GRANT ALL ON DATABASE cilbs TO cilbs;"
```

**2. Build.** Clone the repo, then:

```bash
npm ci
npm run build
```

**3. Configure** a `.env.local` beside `package.json`:

```bash
DATABASE_URL=postgresql://cilbs:choose-a-real-one@127.0.0.1:5432/cilbs
AUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_SITE_URL=https://your-domain
```

**4. Apply the schema**, once per deploy that changes it:

```bash
npm run db:migrate
```

**5. Run it under a supervisor** so it survives a reboot. On Linux, a systemd
unit; on Windows, [PM2](https://pm2.keymetrics.io/) (`npm i -g pm2`,
`pm2 start npm --name cilbs -- run start`, `pm2 save`, `pm2 startup`) or NSSM.
The server itself is just:

```bash
npm run start -- --hostname 0.0.0.0 --port 3000
```

**6. Terminate TLS in front of it** — nginx or Caddy on Linux, IIS with the
URL Rewrite module on Windows. Forward `X-Forwarded-Host` and
`X-Forwarded-Proto`: Auth.js builds its OAuth callback URLs from those, and
sign-in will redirect to the wrong origin without them. Never expose port 3000
directly; cookies are marked `Secure`, so sign-in only works over HTTPS.

### A local database for development

No hosted account needed to work on the account flow:

```bash
node scripts/dev-postgres.mjs start   # downloads Postgres, listens on 55432
DATABASE_URL=postgresql://cilbs:cilbs@127.0.0.1:55432/cilbs npm run db:migrate
```

That is also what the account integration tests run against:

```bash
E2E_WITH_DB=1 E2E_BASE_URL=http://127.0.0.1:3100 npx playwright test e2e/auth-db.spec.ts
```

They cover sign-up, sign-out, sign-in, a rejected password, and a rejected
duplicate address, and they are skipped by default so the main suite can keep
proving the site works with nothing configured.

## Deployment to Vercel

This project is preconfigured for Vercel. The simplest path:

1. Push the repo to GitHub / GitLab / Bitbucket.
2. Visit https://vercel.com/new and import the project.
3. Vercel auto-detects Next.js — accept the defaults.
4. In **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL` → your production URL, e.g. `https://cilbs.com`
5. Deploy.

The first build runs `npm run build`; subsequent pushes trigger preview deploys per branch.

### Why `NEXT_PUBLIC_SITE_URL`?

It's used to render absolute URLs in:

- `metadataBase` (Open Graph, canonical, Twitter card)
- `sitemap.xml`
- `robots.txt`
- The dynamic OG image at `/opengraph-image`

If unset, the app falls back to `VERCEL_URL` for preview deployments and `http://localhost:3000` for local dev — so you only need to set it explicitly for the production environment.

### What the project ships out of the box

- **All routes statically prerendered** at build time
- **Dynamic Open Graph image** at `/opengraph-image` (Edge runtime)
- **`sitemap.xml`** generated from `src/app/sitemap.ts`
- **`robots.txt`** with sensible defaults (blocks `/dashboard`)
- **Custom 404 page** at `not-found.tsx`
- **Security headers** set in `next.config.ts` and `vercel.json`
- **`/login` → `/signin`** and **`/register` → `/signup`** redirects
- **Theme toggle** with light/dark/system persistence
- **Command palette** (⌘K) for navigation
- **Web app manifest** at `/manifest.webmanifest`, installable, opening to the studio
- **Structured data** (Organization, WebSite, SoftwareApplication, FAQPage) via `src/lib/structured-data.ts`
- **`/.well-known/security.txt`** pointing at the disclosure process on `/security`

### Custom domains

Add your domain under **Settings → Domains** on Vercel, then update `NEXT_PUBLIC_SITE_URL` to match. The metadata, sitemap, and OG images will pick it up automatically on the next deploy.

## Project structure

```
src/
├── app/
│   ├── (auth)/             # /signin, /signup, account creation action
│   ├── api/auth/           # Auth.js route handler
│   ├── dashboard/
│   ├── docs/
│   ├── features/
│   ├── pricing/
│   ├── product/
│   ├── solutions/
│   ├── studio/             # Workflow builder (canvas, inspector, runner)
│   ├── privacy/, terms/, security/
│   ├── error.tsx           # Route error boundary
│   ├── global-error.tsx    # Root error boundary
│   ├── instrumentation.ts  # Server error hook (see src/instrumentation.ts)
│   ├── layout.tsx          # Root layout, metadata, providers
│   ├── not-found.tsx
│   ├── opengraph-image.tsx # Dynamic OG (edge)
│   ├── robots.ts
│   ├── sitemap.ts
│   └── globals.css
├── components/
│   ├── auth/               # Mock auth provider + social icons
│   ├── legal/              # Shared shell for the policy pages
│   ├── brand/              # Logo + logomark
│   ├── command/            # ⌘K palette
│   ├── docs/               # Docs sidebar + code block
│   ├── layout/             # Navbar + footer
│   ├── motion/             # Framer Motion helpers
│   ├── ui/                 # Buttons, cards, inputs, sections, badges
│   └── visuals/            # Workflow preview, integration logos, mocks
├── db/
│   ├── index.ts            # Lazy Postgres client (node-postgres + Drizzle)
│   └── schema.ts           # Auth.js tables + workflows
├── auth.ts                 # Auth.js config, getSession(), requireUser()
├── proxy.ts                # Edge auth gate + strict CSP for app routes
└── lib/
    ├── env.ts              # zod-validated environment
    ├── site.ts             # Site config (name, URL, OG)
    ├── telemetry.ts        # Vendor-neutral error + event reporting
    └── utils.ts            # cn()

drizzle/                    # Generated SQL migrations (committed)
e2e/                        # Playwright end-to-end specs
tests/                      # Vitest suites for the studio's pure logic
```

## License

UNLICENSED — internal use only for now.
