// Phase 1 – Approval Queue mock data
// Wire real data: replace with Notion API calls or DB queries.
// Fields mirror the Notion Lead Intake (Scoping) schema extended with version tracking.

export type ApprovalStatus = "needs_review" | "approved_pending_send" | "stale";

export interface ConversationMessage {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  timestamp: string; // ISO or human-readable
}

export interface QueueLead {
  id: string;
  name: string;
  company: string;
  website?: string; // company website — clickable link in UI; enriched from Notion Sales Intake (Lead Gen)
  channel: "LinkedIn" | "Telegram" | "Enreach" | "Twitter/X" | "Email";
  accountHandle: string; // e.g. @ryan_clawd — used for account block checks
  accountBlocked: boolean; // true if the sending account is rate-limited or banned
  draft: string;
  draftVersion: number;
  approvedVersion: number | null;
  approveChecked: boolean;
  approvedAt: string | null; // ISO timestamp
  lastInboundAt: string | null; // ISO timestamp
  lastOutboundAt: string | null; // ISO timestamp
  segment: "infra" | "exchange" | "founders" | "other";
  templateUsed: string;
  notes?: string; // per-lead notes — clickable to open full details drawer
  conversationThread: ConversationMessage[]; // inbound/outbound history (live or mock)
}

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

export const queueLeads: QueueLead[] = [
  {
    id: "ql1",
    name: "Alex Turner",
    company: "Vortex Labs",
    website: "https://vortexlabs.io",
    channel: "LinkedIn",
    accountHandle: "@ryan_clawd_li",
    accountBlocked: false,
    draft:
      "Hey Alex — following up on the revised proposal. Happy to jump on a quick call this week to walk through it. Let me know what works.",
    draftVersion: 2,
    approvedVersion: 1,
    approveChecked: true,
    approvedAt: daysAgo(2),
    lastInboundAt: hoursAgo(6), // newer than approvedAt → stale
    lastOutboundAt: daysAgo(3),
    segment: "founders",
    templateUsed: "Proposal Follow-up v2",
    notes: "Warm lead. CMO at Vortex Labs. Interested in GTM for their Q2 launch. Budget ~£10k. Sent revised proposal 3 days ago.",
    conversationThread: [
      { id: "m1-1", direction: "outbound", text: "Hey Alex, saw what you're building at Vortex — really interesting timing given the market. We've been helping a few infra teams with their GTM. Worth a quick chat?", timestamp: daysAgo(7) },
      { id: "m1-2", direction: "inbound", text: "Hey, yeah we're in the middle of planning our Q2 push. Send me more on what you do.", timestamp: daysAgo(6) },
      { id: "m1-3", direction: "outbound", text: "Sent over a quick proposal — covers community growth + strategic BD comms for launch. Happy to walk through it whenever.", timestamp: daysAgo(3) },
      { id: "m1-4", direction: "inbound", text: "Reviewed it. Some good stuff. Can we tweak the scope a bit? Also what's your timeline flexibility?", timestamp: hoursAgo(6) },
    ],
  },
  {
    id: "ql2",
    name: "Maria Chen",
    company: "Apex Marketing",
    website: "https://apexmktg.com",
    channel: "LinkedIn",
    accountHandle: "@ryan_clawd_li",
    accountBlocked: false,
    draft:
      "Hi Maria, excited for Thursday's call! Sending over our deck in advance so you can review ahead of time. See attached.",
    draftVersion: 1,
    approvedVersion: 1,
    approveChecked: true,
    approvedAt: hoursAgo(3),
    lastInboundAt: hoursAgo(10),
    lastOutboundAt: daysAgo(1),
    segment: "exchange",
    templateUsed: "Pre-call Prep",
    notes: "CMO. Confirmed £8k budget. Pain: inconsistent content volume. Call booked Thursday.",
    conversationThread: [
      { id: "m2-1", direction: "outbound", text: "Maria, noticed you're scaling Apex's B2B side — have you cracked a content system that keeps volume consistent?", timestamp: daysAgo(5) },
      { id: "m2-2", direction: "inbound", text: "Honestly no, it's been a mess. We're producing but nothing feels coordinated. You do this for clients?", timestamp: daysAgo(4) },
      { id: "m2-3", direction: "outbound", text: "Yeah, that's exactly what we fix. Free for a 20 min call Thu or Fri to go through what's broken?", timestamp: daysAgo(3) },
      { id: "m2-4", direction: "inbound", text: "Thu works, 2pm GMT. Looking forward to it.", timestamp: hoursAgo(10) },
    ],
  },
  {
    id: "ql3",
    name: "James Patel",
    company: "DeFi Protocol X",
    website: "https://defiprotocolx.io",
    channel: "LinkedIn",
    accountHandle: "@ryan_clawd_li",
    accountBlocked: false,
    draft:
      "Hey James, just circling back — sent you a DM a few days ago about our GTM work with DeFi protocols. Worth a quick chat?",
    draftVersion: 1,
    approvedVersion: null,
    approveChecked: false,
    approvedAt: null,
    lastInboundAt: null,
    lastOutboundAt: daysAgo(3),
    segment: "infra",
    templateUsed: "Cold Follow-up v1",
    notes: "Strong ICP — founder, £15k/mo potential. No reply yet. Referencing protocol launch in follow-up.",
    conversationThread: [
      { id: "m3-1", direction: "outbound", text: "James, we've been working with a few DeFi teams on launch distribution and community — saw the Protocol X launch is coming up. Happy to share what worked for similar teams?", timestamp: daysAgo(3) },
    ],
  },
  {
    id: "ql4",
    name: "Tom Nguyen",
    company: "ChainGrowth",
    website: "https://chaingrowth.xyz",
    channel: "Enreach",
    accountHandle: "@enreach_account_1",
    accountBlocked: true, // blocked account
    draft:
      "Tom, noticed you opened our last message — happy to share more details on how we've helped similar growth teams. Free this week?",
    draftVersion: 1,
    approvedVersion: null,
    approveChecked: false,
    approvedAt: null,
    lastInboundAt: null,
    lastOutboundAt: daysAgo(4),
    segment: "infra",
    templateUsed: "Soft Re-engage",
    notes: "Opened message but no reply. Account blocked — cannot send until resolved.",
    conversationThread: [
      { id: "m4-1", direction: "outbound", text: "Hey Tom, working with a few growth-focused teams in the infra space right now — thought this might be relevant to what ChainGrowth is doing. Worth exploring?", timestamp: daysAgo(4) },
    ],
  },
  {
    id: "ql5",
    name: "Rachel Davies",
    company: "CryptoEdge",
    website: "https://cryptoedge.io",
    channel: "LinkedIn",
    accountHandle: "@ryan_clawd_li",
    accountBlocked: false,
    draft:
      "Rachel — here are the case studies you asked for. LMK if any questions, happy to walk through the results on a call.",
    draftVersion: 2,
    approvedVersion: 2,
    approveChecked: true,
    approvedAt: hoursAgo(1),
    lastInboundAt: hoursAgo(4),
    lastOutboundAt: daysAgo(1),
    segment: "exchange",
    templateUsed: "Case Study Send",
    notes: "Requested case studies after initial call. Hot lead, ready to buy. Budget TBC.",
    conversationThread: [
      { id: "m5-1", direction: "outbound", text: "Rachel, we've been doing GTM for a couple of CEX-adjacent projects — have you found exchange-native growth tactics that actually move TVL?", timestamp: daysAgo(8) },
      { id: "m5-2", direction: "inbound", text: "Not really, honestly struggling with that right now. What have you seen work?", timestamp: daysAgo(7) },
      { id: "m5-3", direction: "outbound", text: "Happy to share what we've done for similar teams. Do you have 20 min Tue or Wed?", timestamp: daysAgo(6) },
      { id: "m5-4", direction: "inbound", text: "Wednesday works. Can you send over any case studies beforehand so I can prep?", timestamp: hoursAgo(4) },
    ],
  },
  {
    id: "ql6",
    name: "Priya Shah",
    company: "ZeroGas Protocol",
    website: "https://zerogas.network",
    channel: "Telegram",
    accountHandle: "@lester_tg",
    accountBlocked: false,
    draft:
      "Priya — scope doc coming your way today. Let me know when you've had a chance to review and we can align on next steps.",
    draftVersion: 3,
    approvedVersion: 2, // draftVersion > approvedVersion → stale
    approveChecked: true,
    approvedAt: daysAgo(1),
    lastInboundAt: daysAgo(1),
    lastOutboundAt: daysAgo(2),
    segment: "founders",
    templateUsed: "Scope Delivery",
    notes: "COO. 3-month retainer model. Scope doc drafted. Awaiting delivery.",
    conversationThread: [
      { id: "m6-1", direction: "outbound", text: "Priya, we've been helping a few infra protocols with their launch communications and community strategy. ZeroGas looks interesting — what's your GTM focus for Q2?", timestamp: daysAgo(10) },
      { id: "m6-2", direction: "inbound", text: "We're focused on getting more devs building on the protocol. Distribution has been the bottleneck.", timestamp: daysAgo(9) },
      { id: "m6-3", direction: "outbound", text: "That's exactly what we fix. Tue or Wed for 20 mins?", timestamp: daysAgo(8) },
      { id: "m6-4", direction: "inbound", text: "Let's do it. Can you send a scope doc first so I can share with our team?", timestamp: daysAgo(1) },
    ],
  },
  {
    id: "ql7",
    name: "Lena Moore",
    company: "Stellar DAO",
    website: "https://stellardao.org",
    channel: "Telegram",
    accountHandle: "@lester_tg",
    accountBlocked: false,
    draft:
      "Hey Lena — we've been helping a few DAOs with comms and community growth. Thought it might be relevant given what Stellar is building. Worth a chat?",
    draftVersion: 1,
    approvedVersion: null,
    approveChecked: false,
    approvedAt: null,
    lastInboundAt: null,
    lastOutboundAt: null,
    segment: "founders",
    templateUsed: "Cold Opener v3",
    notes: "Cold outreach. No prior contact. DAO governance focus.",
    conversationThread: [],
  },
];

export function deriveApprovalStatus(lead: QueueLead): ApprovalStatus {
  // Stale if: inbound arrived after approval OR draft was updated after approval
  if (
    lead.approveChecked &&
    lead.approvedAt &&
    (
      (lead.lastInboundAt && lead.lastInboundAt > lead.approvedAt) ||
      (lead.approvedVersion !== null && lead.draftVersion > lead.approvedVersion)
    )
  ) {
    return "stale";
  }
  if (lead.approveChecked && lead.approvedVersion === lead.draftVersion) {
    return "approved_pending_send";
  }
  return "needs_review";
}

export function canSendLead(lead: QueueLead): boolean {
  if (lead.accountBlocked) return false;
  const status = deriveApprovalStatus(lead);
  return status === "approved_pending_send";
}
