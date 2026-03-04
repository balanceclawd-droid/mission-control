// Phase 1 – Docs & Memory mock data
// Wire real data: Notion pages API, Google Docs API, or local markdown files.

export type DocType = "playbook" | "pitch" | "meeting_note" | "active_doc" | "template";

export interface DocEntry {
  id: string;
  title: string;
  type: DocType;
  project?: string;
  lastUpdated: string;
  summary: string;
  url?: string; // Notion/GDoc URL — empty = local
  tags: string[];
  pinned?: boolean;
  content?: string; // full document content for editing in UI (mock persistence via local state)
}

export const docs: DocEntry[] = [
  {
    id: "d1",
    title: "BD Playbook — DM Strategy & Sequencing",
    type: "playbook",
    lastUpdated: "2d ago",
    summary: "Full playbook: ICP, opening lines, follow-up cadence, objection handling, and close framework.",
    url: "https://notion.so/bd-playbook",
    tags: ["bd", "linkedin", "enreach"],
    pinned: true,
    content: `# BD Playbook — DM Strategy & Sequencing

## ICP Definition
- Infra/protocol founders or CMOs at seed → Series B
- Teams spending £5k–£30k/mo on growth
- Pain: inconsistent distribution, no community flywheel, launch without strategy

## Opener Principles
- Never pitch in opener. One question, peer-to-peer tone.
- Reference something specific to their project or tweet.
- Max 2-3 sentences.

## Sequencing
1. Day 1: Cold opener (personalised)
2. Day 4: Follow-up if no reply (soft re-engage)
3. Day 8: Final bump with a value prop hook
4. After 2 exchanges: pivot to 20-min call ask

## Objection Handling
- "Not right now" → park it, ask what's blocking, re-engage in 4 weeks
- "We handle in-house" → validate, ask what's the bottleneck, plant a seed
- "What's the cost?" → park until discovery done, always qualify pain first

## Close Framework
1. Confirm pain (distribution, launch, community)
2. Share relevant result (case study, not a pitch)
3. Direct ask: "20 min Tue or Wed?"
`,
  },
  {
    id: "d2",
    title: "Agency Pitch Deck — Q1 2026",
    type: "pitch",
    project: "Agency GTM",
    lastUpdated: "3d ago",
    summary: "Core pitch: problem, solution, case studies, pricing tiers, and CTA. Latest version with Vortex Labs case study added.",
    url: "https://docs.google.com/presentation/agency-pitch-q1",
    tags: ["pitch", "sales", "deck"],
    pinned: true,
    content: `# Agency Pitch Deck — Q1 2026

## Slide 1: Problem
Web3 teams launch without distribution infrastructure. Communities stall, TVL stays flat, token price drifts.

## Slide 2: Solution
0xBalance builds your go-to-market engine: community strategy, BD comms, content ops.

## Slide 3: Case Studies
- **Vortex Labs** — 3x community growth in 90 days
- **Apex Marketing** — content volume 2x, consistent pipeline
- **ZeroGas Protocol** — developer acquisition strategy

## Slide 4: Pricing Tiers
- Starter: £5k/mo (2 channels)
- Growth: £10k/mo (full GTM)
- Scale: £20k/mo+ (dedicated team)

## Slide 5: CTA
Book a 20-min discovery call.
`,
  },
  {
    id: "d3",
    title: "Meeting Notes — Apex Marketing Discovery Call",
    type: "meeting_note",
    project: "Apex Marketing",
    lastUpdated: "Yesterday",
    summary: "CMO (Maria Chen) confirmed £8k budget. Key pain: inconsistent content volume. Next step: prep deck, send before Thursday call.",
    tags: ["apex", "meeting", "hot"],
    content: `# Meeting Notes — Apex Marketing Discovery Call

**Date:** Yesterday
**Attendees:** Maria Chen (CMO, Apex Marketing), Ryan

## Key Points
- Budget confirmed: ~£8k/mo
- Main pain: content production is inconsistent and uncoordinated across channels
- Team size: 4 marketers, no dedicated content ops
- Interested in a retainer covering LinkedIn, Twitter, and email

## Next Steps
- Prep Q1 2026 pitch deck tailored to Apex
- Send deck before Thursday 2pm call
- Follow up with Maria on content ops process question she raised

## Temperature: 🔥 Hot
`,
  },
  {
    id: "d4",
    title: "Scope Document — ZeroGas Protocol",
    type: "active_doc",
    project: "ZeroGas Protocol",
    lastUpdated: "Today",
    summary: "Draft scope for GTM launch campaign. Awaiting delivery to Priya Shah (COO). 3-month retainer model.",
    tags: ["scope", "infra", "zerogas"],
    pinned: true,
    content: `# Scope Document — ZeroGas Protocol

**Status:** Draft — awaiting delivery to Priya Shah
**Model:** 3-month retainer

## Deliverables
1. Developer acquisition strategy (community + BD)
2. Monthly content calendar (Twitter/X, blog, Discord)
3. Partnership outreach (3 target protocols/month)
4. Monthly reporting

## Pricing
£12k/mo for 3 months (£36k total)

## Timeline
- Month 1: Strategy + setup
- Month 2: Execution begins
- Month 3: Optimisation + reporting

## Notes
Priya asked specifically for developer growth. Scope tailored to infra-native distribution.
`,
  },
  {
    id: "d5",
    title: "LinkedIn DM Templates Library",
    type: "template",
    lastUpdated: "4d ago",
    summary: "All active LinkedIn opener templates by segment: infra, exchange, founders. Includes A/B test notes.",
    url: "https://notion.so/linkedin-templates",
    tags: ["linkedin", "templates"],
    content: `# LinkedIn DM Templates Library

## Infra Segment
**Template A (Protocol Launch)**
> "Noticed [Protocol] is ramping up — we've helped a few infra teams with their developer acquisition strategy. Worth a quick chat?"

## Exchange / CEX Segment
**Template B (TVL Focus)**
> "Have you found tactics that actually move TVL beyond the initial listing bump? Working with a few teams on this exact problem."

## Founders Segment
**Template C (Cold Opener)**
> "[First name] — the [specific thing they built/tweeted] caught my attention. We've been doing GTM for similar founders. Worth 20 mins?"

## A/B Notes
- Template A: 18% reply rate
- Template B: 12% reply rate
- Template C: 22% reply rate (highest — personalization works)
`,
  },
  {
    id: "d6",
    title: "Meeting Notes — DeFi Protocol X (James Patel)",
    type: "meeting_note",
    project: "DeFi Protocol X",
    lastUpdated: "3d ago",
    summary: "No reply to first DM. Profile is strong ICP — founder, £15k/mo potential. Needs personalised follow-up referencing their protocol launch.",
    tags: ["defi", "meeting", "warm"],
    content: `# Meeting Notes — DeFi Protocol X (James Patel)

**Status:** No reply yet
**Channel:** LinkedIn

## Research Notes
- James is founder of DeFi Protocol X
- Protocol launching Q2 2026
- Estimated budget: £15k/mo based on team size and stage
- Strong ICP match: infra/protocol, launch-phase, no distribution team

## Outreach Strategy
- Reference protocol launch specifically in follow-up
- Hook: developer acquisition and community growth pre-launch
- Move to call ask quickly if reply received

## Next Step
Send personalised follow-up. Reference their protocol launch date.
`,
  },
  {
    id: "d7",
    title: "Enreach Lead Capture — SOP",
    type: "playbook",
    lastUpdated: "5d ago",
    summary: "Standard operating procedure for reviewing, approving, and sending Enreach DMs via Lester. Includes approval flow and account checks.",
    url: "https://notion.so/enreach-sop",
    tags: ["enreach", "sop", "automations"],
    content: `# Enreach Lead Capture — SOP

## Overview
Lester runs Enreach lead capture every 12 hours. Ryan's role is minimal:
1. Check draft in Notion
2. Edit if needed
3. Tick Approve

## Workflow
1. Lester polls 7 Enreach Telegram accounts
2. Extracts new DM replies from past 24 hours
3. Matches against Notion "B2B Sales DMs" by Telegram handle
4. Drafts reply using bd-reply skill
5. Saves to Notion and outbox.md
6. Notifies Ryan on Telegram

## Approval Rules
- Only send when Approved Version = Draft Version
- New inbound invalidates approval automatically
- Blocked accounts: never switch accounts — flag and wait

## Accounts
Victor=10529, frnk_og=10300, Lucas=10161, Jimx02=10157, Clono903=10159, Hexnryz=10299, Bearsamaoso=10528
`,
  },
  {
    id: "d8",
    title: "GTM Case Studies Pack",
    type: "active_doc",
    lastUpdated: "1w ago",
    summary: "3 anonymised case studies: DeFi launch, CEX growth, L2 community. Used in proposal and sales conversations.",
    tags: ["case-studies", "sales"],
    content: `# GTM Case Studies Pack

## Case Study 1 — DeFi Launch
**Result:** 3x developer growth in 90 days
**Strategy:** Community-first distribution, targeted Twitter threads, BD outreach to wallets/integrations

## Case Study 2 — CEX Growth
**Result:** TVL up 40% in 60 days post-listing
**Strategy:** Liquidity incentive communications, influencer partnerships, exchange-native content

## Case Study 3 — L2 Community
**Result:** Discord grew from 2k → 8k in 45 days
**Strategy:** Ecosystem grant program, developer content, AMA series with L1 protocols
`,
  },
  {
    id: "d9",
    title: "Q1 Agency Revenue Tracker",
    type: "active_doc",
    project: "Agency GTM",
    lastUpdated: "Today",
    summary: "Live spreadsheet tracking MRR, pipeline, closed deals, and target vs actual. £12.4k MRR vs £30k target.",
    url: "https://docs.google.com/spreadsheets/revenue-q1",
    tags: ["revenue", "reporting"],
    pinned: true,
    content: `# Q1 Agency Revenue Tracker

## Current MRR: £12,400
**Target:** £30,000

## Closed Deals
| Client | MRR | Start |
|--------|-----|-------|
| Client A | £5k | Jan |
| Client B | £7.4k | Feb |

## Hot Pipeline (likely close this month)
- Apex Marketing: £8k/mo — call Thu
- ZeroGas Protocol: £12k/mo — scope sent

## Targets
- Q2: £30k/mo
- EOY: £100k/mo
`,
  },
  {
    id: "d10",
    title: "Perp Farmers — Outreach Research Notes",
    type: "active_doc",
    lastUpdated: "2d ago",
    summary: "Notes on X search queries, qualifying criteria, and best opening messages for active perp trader accounts.",
    tags: ["perp-farmers", "research"],
    content: `# Perp Farmers — Outreach Research Notes

## X Search Queries
- "perp trading" filter:accounts
- "perpetuals dex" since:2024-01-01
- "funding rate" min_faves:10

## Qualifying Criteria
- Posts about perp trades with P&L screenshots
- Active in last 7 days
- 500+ followers
- Not a bot / not a CT influencer

## Best Opening Messages
- Reference their most recent trade post
- Ask about their preferred protocol
- Never pitch a service — build rapport first

## Results So Far
- 47 qualified profiles found last run
- 12 logged to Google Sheet
`,
  },
];

export const docTypeLabels: Record<DocType, string> = {
  playbook: "Playbook",
  pitch: "Pitch",
  meeting_note: "Meeting Note",
  active_doc: "Active Doc",
  template: "Template",
};

export const docTypeColors: Record<DocType, string> = {
  playbook: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  pitch: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  meeting_note: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  active_doc: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  template: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
