# PGSQAF — Application Context (v2: target architecture + UI redesign)

**Postgraduate Studies Quality Appraisal Framework** — The University of Lahore.

A Next.js 15 (App Router) application where admins build versioned quality-appraisal
frameworks (criteria → indicators → rubrics), assign them to the org hierarchy
(faculties → departments → programs), and faculty members complete appraisals as
"submissions" scored against rubric descriptors.

This file has three jobs:

1. Describe what the project is and how it works **today** (short, accurate).
2. Define the **target backend + frontend approach**, using only the resources already in the repo.
3. Define the **new UI system**: clean, professional, animated with restraint.

Rule for anyone (human or AI) editing this codebase: **follow the target conventions in
sections 4–6 for all new code**, and migrate old code toward them when you touch it.

---

## 1. Stack (unchanged — no new framework, no ORM)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15.3 (App Router), React 19, TypeScript strict |
| Database | PostgreSQL via `pg` Pool, raw parameterized SQL |
| Auth | NextAuth v5 beta — Credentials (admin), Google OAuth (faculty, SAP-verified), dev-only `faculty-test` |
| Styling | Tailwind 3.4 + CVA, shadcn-style primitives in `src/components/ui`, Radix |
| Server state | TanStack Query v5 |
| UI extras | Framer Motion, Lucide, Recharts, TanStack Table, sonner, next-themes |
| Validation | Zod (+ react-hook-form) — **to be used everywhere** |
| Integration | SAP OData (`lib/sap.ts`) for faculty/employee verification (`empinfoSet` keyed by email) |
| Deploy | Plesk + PM2 (port 3006) / Vercel for previews |

### Dependency decisions (consolidate, don't add)

| Concern | Keep | Remove / stop using |
|---------|------|---------------------|
| Toasts | `sonner` | `react-hot-toast` |
| Charts | `recharts` | `chart.js` (and its wrappers) |
| HTTP | native `fetch` via one `apiClient` helper | Axios |
| Motion | `framer-motion` (used per the rules in §6.7) | ad-hoc CSS keyframes scattered in components |
| Dead code | — | delete `src/queries/` and `src/helpers/` |

---

## 2. Roles & access (as-is, with one tightening)

- `SUPER_ADMIN`, `ADMIN` — stored in `users.role`, password login.
- `FACULTY` — JWT-only, never in `users`; identity = university email, verified against SAP `empinfoSet` (case-variant retries — the SAP key filter is case-sensitive).
- Middleware keeps the coarse RBAC (faculty confined to `/profile` + their APIs).

**Tightening:** move the route → role map out of ad-hoc arrays into one file
`src/lib/permissions.ts` so middleware, `requireAdmin()` and the sidebar all read the same source.

```ts
// src/lib/permissions.ts
export const ROUTE_ACCESS = {
  "/frameworks": ["ADMIN", "SUPER_ADMIN"],
  "/setup":      ["SUPER_ADMIN"],            // user mgmt is super-admin only
  "/profile":    ["FACULTY", "ADMIN", "SUPER_ADMIN"],
} as const
```

---

## 3. Data model (as-is)

```
users ──< frameworks ──< criteria ──< indicators
                          ├───────< rubrics ──> rubric_descriptors (Outstanding … Unsatisfactory)
                          └─── criteria_quantification (1:1)
faculties ──< departments ──< programs
frameworks ──< framework_assignments   (scope: ORGANIZATION | FACULTY | DEPARTMENT | PROGRAM)
submissions ──< submission_answers     (UNIQUE (submission_id, indicator_id))
```

Additions proposed in §4.3 (all additive, nothing breaks): `framework_versions`,
`submission_attachments`, `audit_log`, `submission_criterion_scores`.

---

## 4. Backend — target approach

### 4.1 Layering: route handler → service → repository

Today each route mixes auth, validation, SQL and response shaping. Split it into three thin layers.
Still raw SQL, still `pg`, just organised.

```
src/server/
├── http/
│   ├── handler.ts        # withAuth(), withAdmin(), withFaculty() wrappers
│   ├── errors.ts         # AppError, NotFound, Forbidden, Conflict, ValidationError
│   └── response.ts       # ok(), created(), fail()
├── repos/                # SQL only — one file per aggregate
│   ├── frameworks.repo.ts
│   ├── submissions.repo.ts
│   ├── org.repo.ts       # faculties / departments / programs
│   └── users.repo.ts
├── services/             # business rules, transactions, scoring calls
│   ├── frameworks.service.ts
│   ├── submissions.service.ts
│   └── reports.service.ts
├── scoring/
│   ├── calculate.ts      # PURE functions, no DB — unit tested
│   └── calculate.test.ts
├── storage/              # attachment storage abstraction (§4.5)
└── sap/                  # moved from lib/sap.ts (+ cache, timeout, redaction)
```

Route handlers become ~10 lines:

```ts
// src/app/api/frameworks/route.ts
export const POST = withAdmin(async ({ req, session }) => {
  const input = createFrameworkSchema.parse(await req.json())
  const framework = await frameworksService.create(input, session.user.id)
  return created(framework)
})
```

`withAdmin` does: auth check → try/catch → maps `ZodError`/`AppError` to the standard
`{ error: { code, message, details? } }` body → logs `[METHOD /api/path]` with a request id.

### 4.2 Validation: Zod on every boundary

- One schema file per feature: `src/schemas/framework.ts`, `submission.ts`, `org.ts`, `user.ts`.
- The **same schema** is used by the route (`.parse`) and by the form (`zodResolver`). Types come from `z.infer`, so `types/index.ts` stops being hand-maintained for request shapes.
- Replace the "validate manually" routes first: `POST /api/frameworks`, `PATCH /api/submissions/[id]`, org CRUD.

### 4.3 Data & lifecycle fixes (highest impact first)

1. **Fix `created_by = 1`** in `POST /api/frameworks` → `session.user.id`. (Quick win, do it first.)
2. **Framework versioning that is real.** Published frameworks must be immutable.
   - `PUBLISHED` → editing creates a new `DRAFT` version (`framework_versions`: `framework_id`, `version`, `snapshot jsonb`, `published_at`).
   - `submissions.framework_version_id` pins each appraisal to the exact version the student saw, so later edits never change old scores.
3. **Store per-criterion scores** in `submission_criterion_scores` (`submission_id`, `criteria_id`, `raw`, `max`, `normalized`, `weight`) when a submission is submitted. Reports then read stored numbers instead of recomputing.
4. **Submission status machine** (explicit, enforced in the service, not scattered):
   `DRAFT → SUBMITTED → (optional) UNDER_REVIEW → APPROVED | RETURNED → DRAFT`.
   Only `DRAFT` is student-mutable; `RETURNED` re-opens it. Ship `DRAFT → SUBMITTED` first, add review later without schema pain.
5. **`audit_log`** (`actor_id`, `actor_type`, `action`, `entity`, `entity_id`, `meta jsonb`, `at`) written in the same transaction for publish, assign, submit, delete, role changes.
6. **Indexes** (add in a migration): `submissions(erp_id, status)`, `submissions(framework_id)`, `submission_answers(submission_id)`, `framework_assignments(framework_id, scope)`, `criteria(framework_id)`, `indicators(criteria_id)`.
7. **Pagination everywhere** lists can grow (`frameworks`, `submissions`, `users`): `?page=&pageSize=&q=&status=` → `{ data, page, pageSize, total }`.

### 4.4 Migrations instead of "apply schema.sql manually"

- Keep `schema.sql` as a generated snapshot, but make **numbered SQL migrations the source of truth**:
  `db/migrations/0001_init.sql`, `0002_submissions.sql`, `0003_versions.sql`, …
- One tiny runner `scripts/migrate.ts` (tracks applied files in a `schema_migrations` table; each file runs in a transaction).
- Merge the two existing `migrate-add-*.ts` scripts into numbered files.
- Rule: **schema changes happen at deploy time via `npm run migrate`, never inside a request handler.**

### 4.5 Attachments: get base64 out of the database

Current: base64 text in `submission_answers.attachment_data` (5 MB cap). It bloats rows, slows
every answer query and backups.

Target (works on the existing Plesk server, no new service):

- `submission_attachments` table: `id`, `submission_id`, `indicator_id`, `filename`, `mime`, `size`, `sha256`, `storage_key`, `uploaded_at`.
- `src/server/storage/index.ts` interface `{ put, get, delete }` with a **local-disk driver** writing to a directory *outside* the web root (e.g. `UPLOAD_DIR=/var/pgsqaf/uploads`), keyed by UUID.
- Upload via `multipart/form-data` → `POST /api/submissions/[id]/attachments`; download via an **authenticated** route that checks ownership (student) or admin role. Never serve uploads as static files.
- Validate mime allow-list + size server-side. Swap the driver for S3-compatible storage later without touching routes.
- One-off script migrates existing base64 rows into files, then drops the column.

### 4.6 Scoring as a pure, tested module

Move the scoring rules (currently inside the PATCH handler) to `server/scoring/calculate.ts`:

```ts
calculateSubmission({ criteria, indicators, rubrics, answers }): {
  progress: number            // % indicators with a non-null score
  perCriterion: CriterionScore[]
  total: number               // weighted %, normalised by each criterion's max rubric score
}
```

- No DB, no side effects → trivially unit-testable with Vitest. Add cases: all-max, all-min, partial, zero-weight criterion, missing rubric.
- The service calls it inside the transaction and persists results (§4.3.3).

### 4.7 Autosave-friendly submissions API

The wizard should save as the student types, so the API must be cheap and safe:

- `PATCH /api/submissions/[id]` accepts **partial** `answers[]` (only changed indicators) and returns `{ progress, updatedAt }`.
- Optimistic concurrency: client sends `If-Unmodified-Since` / `version`; server returns `409` if another tab changed it.
- `action: "submit"` runs full validation (required attachments, all required indicators) and returns a field-level error list the UI can scroll to.

### 4.8 SAP integration hardening

- Timeout (e.g. 8 s) + one retry with `AbortController`.
- **In-memory TTL cache** (5–10 min) keyed by SAP ID → fewer OData calls on every page load.
- **Stop `console.log` of raw SAP responses.** Log only status + latency + SAP ID hash; redact PII fields.
- Map SAP → internal `StudentProfile` type in one function; the rest of the app never sees raw OData.
- Keep `/api/sap-debug` behind `NODE_ENV !== "production"` or SUPER_ADMIN only.

### 4.9 Reads: use Server Components, mutate with route handlers

- Dashboard, framework list/detail, profile → fetch in the **server component** by calling the service directly (no HTTP hop), pass data to client components as props; use `<Suspense>` + `loading.tsx` for streaming.
- Client components use TanStack Query **only** for interactive state (autosave, filters, builder). Set `initialData` from the server payload to avoid double fetching.
- Mutations: route handlers (kept, since the client needs them) or Server Actions for simple admin forms.
- After mutations call `revalidatePath` / `queryClient.invalidateQueries` — pick the one matching where the data was read.

### 4.10 Reporting (what makes this a *quality* system)

Add `reports.service.ts` + admin pages, all plain SQL aggregates:

- Average score per program / department / faculty, per framework version.
- Per-criterion strengths & gaps (bar chart), distribution of rubric levels (stacked bar).
- Completion funnel: assigned → started → submitted.
- Export: CSV (streamed) first; Excel via the existing stack when needed.
- Use SQL views (`v_program_scores`, `v_criterion_averages`) so the dashboard stays fast as data grows.

### 4.11 Reliability & ops

- **Logging:** structured JSON logger (`pino`) with request id; keep Sentry for errors.
- **Health:** `/api/health` returns DB latency + migration version; make it public-but-minimal for PM2/uptime checks.
- **Rate limiting:** simple in-memory limiter on sign-in and `/api/profile` (per IP + per email).
- **Security:** drop `faculty-test` provider from production builds entirely (not just hide the UI); rotate the seeded `admin@pgsqaf.edu / Admin@1234` and force password change on first login; set `secure` cookies behind the Plesk proxy; add CSP + basic security headers in `next.config`.
- **Tests:** Vitest for scoring + services (against a throwaway Postgres schema); Playwright for 3 golden paths: admin publishes a framework, student completes + submits, student cannot see another's submission.

---

## 5. Frontend — target approach

### 5.1 Feature-based structure (replace `libraries/components` sprawl)

```
src/
├── app/                      # routes only — thin pages, metadata, loading.tsx, error.tsx
├── features/
│   ├── frameworks/
│   │   ├── components/       # FrameworksTable, FrameworkBuilder, FrameworkStatusBadge
│   │   ├── hooks/            # useFrameworks, useFramework, usePublishFramework
│   │   ├── api.ts            # typed fetchers (use apiClient)
│   │   └── schema.ts         # re-export from src/schemas
│   ├── submissions/          # SubmissionWizard, RubricPicker, AttachmentField, ScoreRing
│   ├── org/                  # faculties/departments/programs management
│   ├── users/
│   ├── reports/
│   └── dashboard/
├── components/
│   ├── ui/                   # primitives (existing shadcn set)
│   ├── layout/               # AppShell, Sidebar, Topbar, PageHeader, CommandMenu
│   └── feedback/             # EmptyState, ErrorState, Skeletons, ConfirmDialog
├── lib/                      # apiClient, utils, motion presets, query keys
└── server/                   # backend layers from §4
```

Rules:
- A feature owns its components, hooks and API calls. Features don't import from each other — shared things go to `components/` or `lib/`.
- Centralise query keys: `qk.frameworks.list(filters)`, `qk.submissions.detail(id)`.
- One `apiClient` that unwraps the `{ error }` shape and throws typed errors; hooks never call `fetch` directly.
- Merge `/settings` into `/setup` and delete the legacy page.

### 5.2 Framework builder (admin) — the most complex screen

Today it's a form. Make it a **three-pane builder**:

```
┌──────────────┬──────────────────────────────┬───────────────────┐
│ Outline      │ Editor                       │ Live preview      │
│ ▸ Criteria 1 │ Criteria title / weight      │ How a student     │
│   • Ind 1.1  │ Indicators (add / reorder)   │ sees this         │
│   • Ind 1.2  │ Rubric per indicator         │ criterion         │
│ ▸ Criteria 2 │ Evidence / attachment rules  │ + weight summary  │
└──────────────┴──────────────────────────────┴───────────────────┘
```

- `react-hook-form` + Zod with `useFieldArray` for criteria → indicators → rubrics; autosave the draft.
- Weight meter: live total of indicator weights per criterion with a clear over/under state.
- Reordering via drag handles (`@dnd-kit` is the only optional new dependency; keep up/down buttons as the accessible fallback).
- Publish dialog shows a checklist (all criteria weighted, every indicator has rubrics, assignments set) before enabling **Publish**.

### 5.3 Submission wizard (faculty) — the most important screen

- Left rail: criteria list with per-criterion completion state; top: overall progress.
- Each indicator is a **rubric ladder**: six descriptors (Outstanding → Unsatisfactory) as selectable rows, descriptor text visible, selected row highlighted. Keyboard: arrow keys move, Enter selects.
- Autosave on change (debounced 800 ms) with a quiet status: "Saved just now" / "Saving…" / "Couldn't save — retry".
- Attachment field: drag-and-drop, progress bar, file chip with remove; shows when attachment is required.
- Review step before submit: unanswered indicators listed with jump links; submit is blocked until required ones are complete.
- After submit: a result screen with the animated score ring and per-criterion breakdown.
- Guard against leaving with unsaved changes.

### 5.4 State, forms, errors

- Server state → TanStack Query; local UI state → `useState`/`useReducer`; no global store.
- Every list/detail view implements four states: **loading (skeleton) · empty · error (with retry) · data**.
- `error.tsx` per route segment, not just the root.
- Toasts (sonner) only for confirmations/errors of user actions — not for passive loads.

### 5.5 Accessibility floor

Visible focus rings, full keyboard operation of the wizard and builder, `aria-live` for autosave and
toasts, color never the only signal (icons/labels with status colors), 4.5:1 contrast in both themes,
`prefers-reduced-motion` honoured (see §6.7).

---

## 6. UI system — clean, professional, animated with intent

### 6.1 Design direction

**Calm academic-professional.** This is a tool people use to judge quality, so it should feel
precise, trustworthy and quiet, with polish coming from typography, spacing and *purposeful*
motion rather than decoration.

- One memorable thing: the **score ring + rubric ladder**. Everything else stays restrained.
- Not a generic card-grid SaaS dashboard: vary the structure — tables where data is tabular, a
  wide hero stat area where it matters, and plain sections (not boxed cards) for supporting content.
- Cool neutral surfaces, a single teal accent, deep-navy ink. No gradient washes as decoration.

### 6.2 Color tokens (HSL CSS variables, light + dark)

Add to `globals.css`; tailwind.config.ts already maps `bg-card`, `text-muted-foreground`, etc. to these.

```css
:root {
  --background: 216 24% 97%;        /* #F5F7FA  page */
  --foreground: 222 40% 16%;        /* #18233A  ink navy */
  --card: 0 0% 100%;
  --card-foreground: 222 40% 16%;
  --muted: 218 22% 93%;
  --muted-foreground: 219 14% 40%;
  --border: 218 20% 88%;
  --input: 218 20% 88%;
  --primary: 222 52% 24%;           /* #1D2F5E  deep navy: primary buttons, active nav */
  --primary-foreground: 0 0% 100%;
  --accent: 182 78% 30%;            /* #108A8F  teal: focus, progress, selected rubric */
  --accent-foreground: 0 0% 100%;
  --success: 152 55% 32%;
  --warning: 38 85% 45%;
  --destructive: 0 68% 46%;
  --ring: 182 78% 30%;
  --radius: 0.625rem;

  /* Rubric scale — sequential, colour-blind safe, always paired with the label */
  --lvl-outstanding: 182 78% 26%;
  --lvl-excellent:   172 55% 36%;
  --lvl-good:        95 40% 42%;
  --lvl-average:     42 80% 48%;
  --lvl-poor:        22 80% 50%;
  --lvl-unsatisfactory: 0 65% 46%;
}

.dark {
  --background: 222 34% 9%;
  --foreground: 216 24% 94%;
  --card: 222 30% 12%;
  --card-foreground: 216 24% 94%;
  --muted: 222 24% 17%;
  --muted-foreground: 218 14% 66%;
  --border: 222 22% 22%;
  --input: 222 22% 22%;
  --primary: 210 70% 78%;
  --primary-foreground: 222 40% 12%;
  --accent: 178 62% 46%;
  --ring: 178 62% 46%;
}
```

Use status colors only for status. Surfaces differ by **tone and border**, not heavy shadows
(one soft shadow token for popovers/dialogs only).

### 6.3 Typography

Replace Inter (the default everyone reaches for) with a deliberate pair via `next/font/google`:

- **Headings & big numbers:** `Newsreader` (serif, weights 500/600) — gives the academic character; used for page titles, framework names and the score figure.
- **UI & body:** `Instrument Sans` (weights 400/500/600) — clean, slightly characterful, very legible in dense forms and tables.
- Scale: 12 / 13 / 14 (base) / 16 / 20 / 28 / 40. Tabular numerals (`font-variant-numeric: tabular-nums`) in tables, scores and weights.
- Sentence case everywhere. No all-caps eyebrows above headings; no decorative labels. Body line length ≤ 70ch.

### 6.4 App shell

- **Sidebar:** 248 px, collapsible to a 64 px icon rail (state persisted); active item = filled `primary` tint + 2 px accent bar; role-aware items (admins: Dashboard, Frameworks, Reports, Profile, Setup; students: Profile only).
- **Topbar:** breadcrumb + page title on the left; command menu trigger (`⌘K`, built on the existing Radix Dialog + `cmdk` if added), theme toggle, user menu on the right.
- **Page header:** title (Newsreader 28), one-line description, primary action on the right. Sticky filter bar on list pages.
- Content max-width 1280 px; 24/32 px page padding; 8 px spacing grid.
- Mobile: sidebar becomes a sheet; tables switch to stacked rows; wizard rail becomes a top stepper.

### 6.5 Page-by-page redesign

**Sign-in**
- Split layout: left = quiet brand panel (university name, one sentence on what the portal does, a subtle animated progress-ring motif); right = form.
- Two clear tabs: *Faculty (Google)* and *Admin (email)*. Inline errors that say what to do ("This email isn't linked to a SAP student ID. Use your university Google account.").

**Dashboard (admin)**
- Top: a wide summary strip — total submissions, completion rate, average score, frameworks published — as plain figures with small trend deltas (not four identical cards).
- Middle: Recharts line/area of submissions over time + a horizontal bar of average score by faculty.
- Bottom: "Recent submissions" as a compact table with status badges and a "View" action.
- Org counts (faculties/departments/programs) move to a slim secondary row.

**Frameworks list**
- TanStack Table: search, status filter chips (Draft / Published / Archived), sortable columns, row actions menu, sticky header.
- Status badge with dot + label. Empty state: "No frameworks yet — Create your first framework" with a primary button.

**Framework detail**
- Header with status, version, assigned scope chips, Publish / Edit / Duplicate actions.
- Criteria as an accordion list with weight bars; expand to see indicators and rubric preview.
- Tab: Assignments (tree of faculty → department → program with checkboxes).

**Faculty profile**
- Top: identity block from SAP (name, employee no., designation, department) — plain, no avatar decoration.
- "Your appraisals": rows with framework name, status, progress bar, last saved, **Continue** / **View result**.
- Start new appraisal = a list of ALL published frameworks — appraisals are not assigned per program; the submission rows carry the applicant's SAP identity (students are not stored in `users`).

**Submission wizard** — see §5.3; this is where visual polish concentrates.

**Setup**
- Tabs: Users | Organization. Organization as a three-column drill-down (faculties → departments → programs) with inline add/edit; user management as a table with role select and a confirm dialog on role/delete changes.

### 6.6 Component specs

| Component | Spec |
|-----------|------|
| Button | 36 px height, radius 8, primary / secondary / ghost / destructive; loading state swaps label for spinner without width change; `active:scale-[0.98]` |
| Input / Select | 36 px, 1 px border, focus = 2 px accent ring + border color shift; inline helper/error text below |
| Table | 44 px rows, hover tint, sticky header, zebra off, tabular numbers right-aligned |
| Badge | dot + text, tinted background at 10 % of status color |
| Dialog / Sheet | Radix, 160 ms fade + 8 px translate; focus trapped, Esc closes |
| Skeleton | shimmer 1.4 s, matches final layout dimensions (no layout shift) |
| Progress | 6 px bar, accent fill, animates width on change |
| **ScoreRing** | SVG circle, stroke-dashoffset animates 0 → value; centre shows score in Newsreader with tabular numerals; ring color = rubric level token for that score band |
| **RubricLadder** | radio-group of six rows; selected row gets level color rail + subtle tinted background; descriptor text always visible |
| EmptyState / ErrorState | icon, one-line title, one-line help, one action |

### 6.7 Motion system (Framer Motion, used sparingly)

**Principles**
1. Motion answers an action or explains a change; it doesn't decorate.
2. One orchestrated entrance per screen load (the dashboard summary strip, or the result screen's score ring) — not a fade-in on every section.
3. Fast and quiet: most transitions 120–220 ms; nothing over 500 ms except the score ring (900 ms, once).
4. **Never animate rows of large tables** (no `motion.tr`, no `AnimatePresence` per row) — this is a known perf trap on big lists. Use plain CSS hover transitions there.
5. Respect `prefers-reduced-motion`: swap movement for instant/opacity-only changes.

**Presets** (`src/lib/motion.ts`):

```ts
export const ease = [0.22, 1, 0.36, 1] as const          // easeOutExpo-like

export const t = {
  fast:   { duration: 0.14, ease },
  base:   { duration: 0.22, ease },
  slow:   { duration: 0.5,  ease },
  spring: { type: "spring", stiffness: 420, damping: 34 },
}

export const fadeUp = {            // dialogs, popovers, toasts
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: t.base },
}

export const stagger = (gap = 0.05) => ({ show: { transition: { staggerChildren: gap } } })
```

Wrap the app in `<MotionConfig reducedMotion="user">` inside `providers/index.tsx` so reduced-motion
is honoured globally.

**Where motion is used**

| Moment | Motion |
|--------|--------|
| Dashboard first load | summary figures count up + chart lines draw in, once, ~600 ms total |
| Route change | 120 ms opacity cross-fade of main content only (shell stays put) |
| Sidebar collapse | width spring + label fade |
| Wizard step change | content slides 12 px in the direction of travel; progress bar width eases |
| Selecting a rubric level | the selected row's tint and level rail animate in (layout animation); the criterion progress updates |
| Autosave status | text cross-fades "Saving…" → "Saved just now" |
| Accordion / dialogs / menus | height or fade+translate, 160–220 ms |
| Submit success | score ring draws to value, figure counts up, breakdown rows stagger in (the one big moment) |
| Buttons | `active` press scale only |

### 6.8 Dark mode

Same structure, tokens from §6.2. Charts read colors from CSS variables (not hard-coded hex) so
Recharts follows the theme. Keep `defaultTheme="light"` with system option enabled.

### 6.9 Content & microcopy

- Buttons say what happens: "Save draft", "Submit appraisal", "Publish framework" — and the toast repeats the same verb: "Framework published".
- Errors explain the fix and never apologise: "Attachment is over 5 MB. Upload a smaller file."
- Empty states are invitations: "No appraisals yet. Start one from a published framework."
- Use "criteria / indicators / rubric" consistently — don't alternate with synonyms.

---

## 7. Known quirks to resolve (carried forward)

| Issue | Resolution |
|-------|-----------|
| `src/queries/`, `src/helpers/` dead code | Delete (§1) |
| `created_by = 1` hardcode | Use `session.user.id` (§4.3.1) |
| `/settings` vs `/setup` overlap | Remove `/settings` (§5.1) |
| Base64 attachments in DB | File storage + `submission_attachments` (§4.5) |
| Raw SAP logging (PII) | Redacted logging + cache (§4.8) |
| README mentions `NEXT_PUBLIC_API_URL` | Remove; env contract below |
| `next start` on 3006 vs dev on 3000 | Document in README; keep |

---

## 8. Environment variables (updated)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pgsqaf
NEXTAUTH_SECRET=...              # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SAP_BASE_URL=...                 # optional; defaults http://uolerp.uol.edu.pk:8000
SAP_EMP_BASIC_AUTH_USERNAME=...
SAP_EMP_BASIC_AUTH_PASSWORD=...
SAP_CACHE_TTL_SECONDS=600        # new
UPLOAD_DIR=/var/pgsqaf/uploads   # new — outside web root
UPLOAD_MAX_MB=5                  # new
LOG_LEVEL=info                   # new
SENTRY_DSN=...                   # optional
```

## 9. Commands

```bash
npm run dev                # next dev (3000)
npm run build
npm run start              # serves on 3006
npm run migrate            # apply db/migrations/*.sql (new)
npm run seed:admin         # SUPER_ADMIN — change the password immediately
npm run test               # vitest (scoring + services)
npm run test:e2e           # playwright golden paths
```

Setup: create DB → `npm run migrate` → `npm run seed:admin` → optional demo seeds.

---

## 10. Suggested rollout (each phase ships on its own)

**Phase 1 — Foundations (backend, low risk)**
1. Fix `created_by`; delete dead code; remove duplicate libs (toast/chart/axios).
2. `withAdmin/withFaculty` wrappers + error format + Zod schemas on the framework and submission routes.
3. Migration runner + indexes; extract `scoring/calculate.ts` with tests.
4. SAP: timeout, cache, redacted logs.

**Phase 2 — UI foundation**
1. Tokens, fonts, dark mode, `MotionConfig`, motion presets.
2. New AppShell (sidebar, topbar, page header), skeleton/empty/error components.
3. Restyle sign-in, frameworks list, setup.

**Phase 3 — The core experience**
1. Submission wizard: rubric ladder, autosave, review step, ScoreRing result screen.
2. Attachments to file storage.
3. Framework builder three-pane editor + publish checklist.

**Phase 4 — Integrity & insight**
1. Framework versions + submission pinning; status machine; audit log.
2. Reports (SQL views + charts + CSV export); dashboard rebuild.
3. Playwright golden paths; security headers; rate limiting; production hardening.

---

## 11. Conventions cheat-sheet (for AI assistants working in this repo)

- Raw parameterized SQL only, inside `server/repos/*`. Never string-concatenate values.
- Multi-write operations: transaction in the **service**, not the route.
- Every API input is parsed by a Zod schema; every API error uses `{ error: { code, message } }`.
- `params` in route handlers are Promises in Next 15 — always `await`.
- Student routes always scope by `session.user.email`; only `DRAFT` (or `RETURNED`) submissions are mutable.
- Prefer server components for reads; TanStack Query for interactive client state.
- Use sonner for toasts, Recharts for charts, `lib/motion.ts` presets for animation.
- Never animate individual rows of large tables; respect reduced motion.
- No schema changes in request handlers — migrations only.
- Colors come from CSS variable tokens; no hard-coded hex in components.
