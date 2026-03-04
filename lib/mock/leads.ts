export type LeadTemp = "hot" | "warm" | "cold";
export type LeadStatus = "new" | "contacted" | "replied" | "meeting" | "proposal" | "closed" | "lost";

export interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  channel: string;
  temp: LeadTemp;
  status: LeadStatus;
  value: string;
  lastContact: string;
  notes: string;
}

export const leads: Lead[] = [
  {
    id: "l1",
    name: "Alex Turner",
    company: "Vortex Labs",
    role: "CEO",
    channel: "LinkedIn",
    temp: "hot",
    status: "proposal",
    value: "£12,000/mo",
    lastContact: "Today",
    notes: "Very interested, waiting on revised proposal",
  },
  {
    id: "l2",
    name: "Maria Chen",
    company: "Apex Marketing",
    role: "CMO",
    channel: "Enreach",
    temp: "hot",
    status: "meeting",
    value: "£8,000/mo",
    lastContact: "Yesterday",
    notes: "Call booked for Thurs 14:00",
  },
  {
    id: "l3",
    name: "Sara Kim",
    company: "NovaBridge",
    role: "Growth Lead",
    channel: "Twitter/X",
    temp: "warm",
    status: "replied",
    value: "£5,000/mo",
    lastContact: "2d ago",
    notes: "Interested but budget not confirmed",
  },
  {
    id: "l4",
    name: "James Patel",
    company: "DeFi Protocol X",
    role: "Founder",
    channel: "LinkedIn",
    temp: "warm",
    status: "contacted",
    value: "£15,000/mo",
    lastContact: "3d ago",
    notes: "Follow-up due — no reply to first DM",
  },
  {
    id: "l5",
    name: "Lena Moore",
    company: "Stellar DAO",
    role: "Head of Comms",
    channel: "Telegram",
    temp: "cold",
    status: "new",
    value: "£3,500/mo",
    lastContact: "1w ago",
    notes: "Scraped from Phantom, not yet messaged",
  },
  {
    id: "l6",
    name: "Tom Nguyen",
    company: "ChainGrowth",
    role: "BizDev",
    channel: "Enreach",
    temp: "warm",
    status: "contacted",
    value: "£6,000/mo",
    lastContact: "4d ago",
    notes: "Opened email but no reply",
  },
  {
    id: "l7",
    name: "Rachel Davies",
    company: "CryptoEdge",
    role: "Marketing Director",
    channel: "LinkedIn",
    temp: "hot",
    status: "replied",
    value: "£9,500/mo",
    lastContact: "Today",
    notes: "Asked for case studies — send tomorrow",
  },
  {
    id: "l8",
    name: "Kai Larsen",
    company: "MetaFund",
    role: "CEO",
    channel: "Twitter/X",
    temp: "cold",
    status: "new",
    value: "£7,000/mo",
    lastContact: "2w ago",
    notes: "ICP match, needs personalised outreach",
  },
  {
    id: "l9",
    name: "Priya Shah",
    company: "ZeroGas Protocol",
    role: "COO",
    channel: "LinkedIn",
    temp: "warm",
    status: "meeting",
    value: "£10,000/mo",
    lastContact: "Yesterday",
    notes: "Discovery call done, sending scope this week",
  },
  {
    id: "l10",
    name: "Dan Fox",
    company: "Blockwave",
    role: "Head of Growth",
    channel: "Enreach",
    temp: "cold",
    status: "contacted",
    value: "£4,000/mo",
    lastContact: "5d ago",
    notes: "Low engagement on outreach so far",
  },
];
