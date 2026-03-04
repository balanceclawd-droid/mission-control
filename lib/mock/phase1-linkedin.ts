// Phase 1 – LinkedIn Pipeline Console mock data
// Wire real data: PhantomBuster export CSVs, Notion DB, or LinkedIn Sales Navigator API.

export type LinkedInSegment = "infra" | "exchange" | "founders" | "all";

export interface LinkedInProfile {
  id: string;
  name: string;
  company: string;
  role: string;
  segment: Exclude<LinkedInSegment, "all">;
  processedAt: string;
  status: "processed" | "drafted" | "sent" | "replied" | "no_response";
  templateUsed: string;
  draftReady: boolean;
  sent: boolean;
}

export interface TemplateStats {
  id: string;
  name: string;
  segment: Exclude<LinkedInSegment, "all">;
  sent: number;
  replies: number;
  replyRate: number; // percent
}

export const linkedInProfiles: LinkedInProfile[] = [
  { id: "li1", name: "Alex Turner", company: "Vortex Labs", role: "CEO", segment: "founders", processedAt: "2h ago", status: "drafted", templateUsed: "Founder Intro v3", draftReady: true, sent: false },
  { id: "li2", name: "Kai Larsen", company: "MetaFund", role: "CEO", segment: "founders", processedAt: "3h ago", status: "processed", templateUsed: "Founder Intro v3", draftReady: false, sent: false },
  { id: "li3", name: "James Patel", company: "DeFi Protocol X", role: "Founder", segment: "infra", processedAt: "5h ago", status: "sent", templateUsed: "Infra Cold Opener v2", draftReady: false, sent: true },
  { id: "li4", name: "Dan Fox", company: "Blockwave", role: "Head of Growth", segment: "infra", processedAt: "6h ago", status: "no_response", templateUsed: "Infra Cold Opener v2", draftReady: false, sent: true },
  { id: "li5", name: "Maria Chen", company: "Apex Marketing", role: "CMO", segment: "exchange", processedAt: "1d ago", status: "replied", templateUsed: "Exchange CMO v1", draftReady: false, sent: true },
  { id: "li6", name: "Rachel Davies", company: "CryptoEdge", role: "Marketing Director", segment: "exchange", processedAt: "1d ago", status: "replied", templateUsed: "Exchange CMO v1", draftReady: false, sent: true },
  { id: "li7", name: "Priya Shah", company: "ZeroGas Protocol", role: "COO", segment: "infra", processedAt: "2d ago", status: "drafted", templateUsed: "Infra Cold Opener v2", draftReady: true, sent: false },
  { id: "li8", name: "Tom Nguyen", company: "ChainGrowth", role: "BizDev", segment: "exchange", processedAt: "2d ago", status: "sent", templateUsed: "Exchange CMO v1", draftReady: false, sent: true },
  { id: "li9", name: "Sara Kim", company: "NovaBridge", role: "Growth Lead", segment: "founders", processedAt: "3d ago", status: "replied", templateUsed: "Founder Intro v3", draftReady: false, sent: true },
  { id: "li10", name: "Lena Moore", company: "Stellar DAO", role: "Head of Comms", segment: "founders", processedAt: "4d ago", status: "sent", templateUsed: "Founder Intro v3", draftReady: false, sent: true },
  { id: "li11", name: "Emma Walsh", company: "PermaChain", role: "CTO", segment: "infra", processedAt: "4d ago", status: "drafted", templateUsed: "Infra Cold Opener v2", draftReady: true, sent: false },
  { id: "li12", name: "Yuki Tanaka", company: "ByteSwap", role: "CEO", segment: "exchange", processedAt: "5d ago", status: "no_response", templateUsed: "Exchange CMO v1", draftReady: false, sent: true },
];

export const templateStats: TemplateStats[] = [
  { id: "ts1", name: "Founder Intro v3", segment: "founders", sent: 24, replies: 9, replyRate: 37 },
  { id: "ts2", name: "Founder Intro v2", segment: "founders", sent: 31, replies: 7, replyRate: 23 },
  { id: "ts3", name: "Infra Cold Opener v2", segment: "infra", sent: 18, replies: 6, replyRate: 33 },
  { id: "ts4", name: "Infra Cold Opener v1", segment: "infra", sent: 22, replies: 4, replyRate: 18 },
  { id: "ts5", name: "Exchange CMO v1", segment: "exchange", sent: 15, replies: 7, replyRate: 47 },
  { id: "ts6", name: "Exchange Director v1", segment: "exchange", sent: 19, replies: 4, replyRate: 21 },
];

export function getLinkedInMetrics(profiles: LinkedInProfile[], segment: LinkedInSegment) {
  const filtered = segment === "all" ? profiles : profiles.filter((p) => p.segment === segment);
  return {
    total: filtered.length,
    processed: filtered.filter((p) => p.status === "processed").length,
    drafted: filtered.filter((p) => p.draftReady).length,
    sent: filtered.filter((p) => p.sent).length,
    replied: filtered.filter((p) => p.status === "replied").length,
    noResponse: filtered.filter((p) => p.status === "no_response").length,
  };
}
