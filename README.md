 🦎 Mission Control

Ryan's personal mission control dashboard — incident.io-style dark interface for managing leads, automations, tools, and pipeline.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** — dark slate palette, dense but readable
- **Mock data** — no backend required, all data in `lib/mock/`

## Run it

```bash
cd mission-control
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages & Interaction Model

| Route | Description |
|-------|-------------|
| `/` | Dashboard — KPI cards, activity feed, tasks, pipeline |
| `/approval-queue` | DM draft review with conversation thread, clickable company links, notes drawer |
| `/leads` | Lead command center — views: warm/hot, awaiting approval, blocked, overdue |
| `/tasks` | Task board with annoyance scoring, mini sprint, Google Tasks API badge |
| `/linkedin` | LinkedIn pipeline console — processed/drafted/sent metrics and template analytics |
| `/automations` | Cron diagnostics with click-through detail panel per automation |
| `/docs-memory` | Docs with filters, full-screen detail view, and in-UI editing |
| `/tools` | Tools grouped by category, click-through detail panel per tool |
| `/settings` | Preferences, notifications, integrations |

---

## Module Interaction Details

### Approval Queue (`/approval-queue`)
- **Conversation thread panel** — shows inbound/outbound message history per lead (mock; wire to live source)
- **Company field** — rendered as clickable website link (source: `website` field on `QueueLead`, enriched from Notion Sales Intake via enreach skill)
- **Notes** — truncated in list; click to open full notes drawer/modal
- Filter by: Needs Review / Approved Pending Send / Stale Approval
- Draft editor + approve/mark-sent flow with version locking and stale detection
- **Live data source:** Notion "B2B Sales DMs" DB
- **Mock data:** `lib/mock/phase1-approval-queue.ts`

### Tasks (`/tasks`)
- **Live Google Tasks sync** — fetches real tasks from two lists:
  - `To do today` (fuzzy-matched, title must contain "today" but not "right now"/"blocked"/"short")
  - `To do, Right Now, Short Tasks / Blocked for today` (matched by "right now")
- **Completion toggles** — checkbox per task; clicking calls `POST /api/tasks/complete` and optimistically updates the UI with a toast confirmation
- **Token refresh** — server auto-refreshes expired OAuth access tokens using the stored refresh_token; writes the new token back to disk
- **Fallback mode** — if API is unreachable or returns errors, falls back to mock data with an amber "API error — mock fallback" badge; completion still works locally in this mode
- Mini sprint block, annoyance scoring, start-here callout, and priority weighting all preserved
- **Mock data (fallback):** `lib/mock/phase1-tasks.ts`

#### Setup: Google Tasks OAuth
1. Token file: `~/.openclaw/credentials/google-tasks-token.json`
   - Must contain: `token`, `refresh_token`, `token_uri`, `client_id`, `client_secret`, `expiry`
   - Required scope: `https://www.googleapis.com/auth/tasks` (read + write)
2. No environment variables needed — token is read server-side at request time
3. Token is automatically refreshed (60s buffer before expiry) and written back to disk

#### Troubleshooting
| Symptom | Fix |
|---------|-----|
| Badge shows "API error — mock fallback" | Check `~/.openclaw/credentials/google-tasks-token.json` exists and has `tasks` scope (not `tasks.readonly`) |
| Tasks from wrong lists shown | Check your Google Tasks list names; edit `TARGET_LIST_MATCHERS` in `lib/google-tasks-server.ts` to match |
| Token refresh fails | Re-run OAuth flow to get a fresh refresh_token; copy new JSON to credentials file |
| `npm run build` fails with `fs` import error | Ensure `lib/google-tasks-server.ts` is never imported from a client component (`"use client"`) |
| Completion not persisting after refresh | Completed tasks are filtered from Google Tasks API response by default (`showCompleted=false`); they won't reappear |

### Automations (`/automations`)
- **Click-through detail panel** — click any row or "Details →" button to open a right-side panel showing:
  - Schedule, next/last run, owner
  - Delivery health badge
  - Failure reasons list
  - Recent events feed (run/success/failure/warn)
- Overview tab: all automations table with success rate bars
- Diagnostics tab: cron delivery status, account send volume, error feed
- **Mock data:** `lib/mock/automations.ts` + `lib/mock/phase1-automations.ts`

### Docs & Memory (`/docs-memory`)
- **Filters** — type tabs (All / Playbooks / Pitch / Meeting Notes / Active Docs / Templates), project dropdown, search box
- **Click-through detail view** — click any doc card to open a full-height right-side drawer with complete content
- **Edit support** — "Edit" button in drawer enables textarea editing; "Save" persists to local React state (session-only; wire to Notion/GDocs API for persistence)
- **Mock data:** `lib/mock/phase1-docs.ts` (includes `content` field per doc)

### Tools (`/tools`)
- **Grouping** — tools organised by group: Outreach / Ops / Analytics / Infrastructure / Comms / Finance
- Group filter tabs at top + status filter (click summary cards)
- **Click-through detail panel** — click any tool card to open right-side panel showing: status, owner, notes, dependencies, external link
- **Mock data:** `lib/mock/tools.ts` (includes `group`, `owner`, `notes`, `dependencies` fields)

---

## Data Sources

| Module | Live Source | Mock Fallback |
|--------|-------------|---------------|
| Approval Queue | Notion "B2B Sales DMs" DB | `lib/mock/phase1-approval-queue.ts` |
| Tasks | Google Tasks API (`NEXT_PUBLIC_TASKS_DATA_SOURCE=google-tasks`) | `lib/mock/phase1-tasks.ts` |
| Automations | OpenClaw cron state / session logs | `lib/mock/automations.ts` |
| Docs | Notion Pages API / Google Docs | `lib/mock/phase1-docs.ts` |
| Tools | Static config | `lib/mock/tools.ts` |
| Leads | Notion "B2B Sales DMs" DB | `lib/mock/leads.ts` |

---

## Enreach Skill Integration

The Enreach lead capture skill (`skills/enreach-lead-capture/SKILL.md`) enriches leads with a `website` field sourced from Notion "Sales Intake (Lead Gen)" DB, which propagates into the Approval Queue data model (`QueueLead.website`).

- **Notion token for Sales Intake:** `NOTION_TOKEN_PLACEHOLDER`
- **DB name:** `Sales Intake (Lead Gen)` — DB ID resolved at runtime via Notion search API
- **Fallback:** If DB unresolvable, skill logs a warning and skips website enrichment for that lead — run continues normally

---

## Credential / Runtime Blockers

| Item | Status |
|------|--------|
| Notion "B2B Sales DMs" — lead write | ✅ Credential in SKILL.md |
| Notion "Sales Intake (Lead Gen)" — website enrichment | ✅ Token in SKILL.md (NOTION_TOKEN_PLACEHOLDER) — DB ID needs runtime resolution |
| Google Tasks API | ✅ Live — token at `~/.openclaw/credentials/google-tasks-token.json`, auto-refresh enabled |
| Enreach accounts | ⚠ @enreach_account_1 spam-blocked per mock data |
| PhantomBuster | ⚠ Quota exceeded — scraper failing |
| LinkedIn session | ⚠ Cookie expired — follow-up automation failing |

---

## Mock vs Live

| Feature | Status |
|---------|--------|
| Approval queue split-view + editor | ✅ Live UI, mock data |
| Conversation thread panel | ✅ Live UI, mock thread data |
| Company website link | ✅ Live UI, mock `website` field |
| Notes drawer | ✅ Live UI, mock notes |
| Automations detail panel | ✅ Live UI, mock event feed |
| Docs filters + search | ✅ Live UI, mock data |
| Docs edit + save | ✅ Live UI, local state (session only) |
| Tools grouping + detail panel | ✅ Live UI, mock data |
| Tasks Google Tasks sync | ✅ Live API, completion toggles, token auto-refresh, mock fallback |
| Enreach website enrichment | ✅ Skill updated, runtime resolution needed |
