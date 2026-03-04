"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  queueLeads,
  deriveApprovalStatus,
  canSendLead,
  type QueueLead,
  type ApprovalStatus,
} from "@/lib/mock/phase1-approval-queue";

type FilterTab = "all" | ApprovalStatus;

const filterTabs: Array<{ value: FilterTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "needs_review", label: "Needs Review" },
  { value: "approved_pending_send", label: "Approved – Pending Send" },
  { value: "stale", label: "Stale Approval" },
];

const statusStyles: Record<ApprovalStatus, string> = {
  needs_review: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved_pending_send: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  stale: "bg-red-500/15 text-red-400 border-red-500/30",
};

const statusLabels: Record<ApprovalStatus, string> = {
  needs_review: "Needs Review",
  approved_pending_send: "Approved – Pending Send",
  stale: "Stale",
};

// ── Notes Drawer ──────────────────────────────────────────────────────────────
function NotesDrawer({ lead, onClose }: { lead: QueueLead; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#0f1623] border border-slate-700 rounded-xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">{lead.name}</div>
            <div className="text-xs text-slate-500">{lead.company}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-400 mb-2">Notes</div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {lead.notes ?? "No notes recorded for this lead."}
          </p>
        </div>
        <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div><span className="text-slate-400">Segment:</span> {lead.segment}</div>
          <div><span className="text-slate-400">Channel:</span> {lead.channel}</div>
          <div><span className="text-slate-400">Template:</span> {lead.templateUsed}</div>
          <div><span className="text-slate-400">Handle:</span> {lead.accountHandle}</div>
        </div>
      </div>
    </div>
  );
}

// ── Conversation Thread ────────────────────────────────────────────────────────
function ConversationPanel({ lead }: { lead: QueueLead }) {
  if (!lead.conversationThread || lead.conversationThread.length === 0) {
    return (
      <Card>
        <SectionHeader title="Conversation Thread" subtitle="No history available" />
        <p className="text-xs text-slate-600 mt-2">No previous messages recorded for this lead.</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader
        title="Conversation Thread"
        subtitle={`${lead.conversationThread.length} message${lead.conversationThread.length !== 1 ? "s" : ""} · mock history`}
      />
      <div className="space-y-3 mt-3">
        {lead.conversationThread.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.direction === "outbound"
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-200"
                  : "bg-slate-800 border border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs opacity-70">
                  {msg.direction === "outbound" ? "↑ You" : `↓ ${lead.name.split(" ")[0]}`}
                </span>
                <span className="text-xs opacity-50">{typeof msg.timestamp === "string" && msg.timestamp.includes("T")
                  ? new Date(msg.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : msg.timestamp}
                </span>
              </div>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ApprovalQueuePage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(queueLeads[0]?.id ?? null);
  const [leads, setLeads] = useState<QueueLead[]>(queueLeads);
  const [notesLead, setNotesLead] = useState<QueueLead | null>(null);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return leads;
    return leads.filter((l) => deriveApprovalStatus(l) === activeFilter);
  }, [leads, activeFilter]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    needs_review: leads.filter((l) => deriveApprovalStatus(l) === "needs_review").length,
    approved_pending_send: leads.filter((l) => deriveApprovalStatus(l) === "approved_pending_send").length,
    stale: leads.filter((l) => deriveApprovalStatus(l) === "stale").length,
  }), [leads]);

  function handleDraftChange(value: string) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedId
          ? { ...l, draft: value, draftVersion: l.draftVersion + 1 }
          : l
      )
    );
  }

  function handleApprove() {
    if (!selected) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedId
          ? {
              ...l,
              approveChecked: true,
              approvedVersion: l.draftVersion,
              approvedAt: new Date().toISOString(),
            }
          : l
      )
    );
  }

  function handleMarkSent() {
    if (!selected) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedId
          ? { ...l, lastOutboundAt: new Date().toISOString() }
          : l
      )
    );
  }

  const selectedStatus = selected ? deriveApprovalStatus(selected) : null;
  const sendable = selected ? canSendLead(selected) : false;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Notes drawer */}
      {notesLead && <NotesDrawer lead={notesLead} onClose={() => setNotesLead(null)} />}

      <div>
        <h1 className="text-lg font-semibold text-slate-100">Approval Queue</h1>
        <p className="text-xs text-slate-500 mt-0.5">Review, edit, and approve DM drafts before they send</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Needs Review" value={String(counts.needs_review)} trend="warn" />
        <StatCard label="Approved – Pending Send" value={String(counts.approved_pending_send)} trend="up" />
        <StatCard label="Stale Approvals" value={String(counts.stale)} trend={counts.stale > 0 ? "down" : "neutral"} />
      </div>

      {/* Stale warning */}
      {counts.stale > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400">
          <span className="text-base mt-0.5">⚠️</span>
          <div>
            <strong>{counts.stale}</strong> stale approval{counts.stale > 1 ? "s" : ""} — a new inbound message
            or draft update invalidated the last approval. Re-review before sending.
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-slate-800 pb-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeFilter === tab.value
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && counts[tab.value as ApprovalStatus] > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">
                {counts[tab.value as ApprovalStatus]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Left: Queue list */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500 text-center py-6">No leads match this filter.</p>
            </Card>
          ) : (
            filtered.map((lead) => {
              const status = deriveApprovalStatus(lead);
              const sendOk = canSendLead(lead);
              const isSelected = lead.id === selectedId;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  className={`cursor-pointer rounded-lg border px-4 py-3 transition-all ${
                    isSelected
                      ? "bg-slate-800 border-slate-600"
                      : "bg-[#0f1623] border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{lead.name}</div>
                      <div className="text-xs text-slate-500">
                        {/* Company as clickable website link */}
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
                          >
                            {lead.company}
                          </a>
                        ) : (
                          lead.company
                        )}{" "}
                        · {lead.channel}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {lead.accountBlocked && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-red-500/15 text-red-400 border-red-500/30">
                        🔒 Account Blocked
                      </span>
                    )}
                    {sendOk && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        ✓ Ready to Send
                      </span>
                    )}
                    <span className="text-xs text-slate-600">
                      v{lead.draftVersion} draft
                      {lead.approvedVersion !== null ? ` · v${lead.approvedVersion} approved` : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Editor + Context panels */}
        {selected ? (
          <div className="lg:col-span-3 space-y-4">
            {/* Lead info */}
            <Card>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{selected.name}</div>
                  <div className="text-xs text-slate-500">
                    {selected.website ? (
                      <a
                        href={selected.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
                      >
                        {selected.company}
                      </a>
                    ) : (
                      selected.company
                    )}{" "}
                    · {selected.channel} · {selected.accountHandle}
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[selectedStatus!]}`}>
                  {statusLabels[selectedStatus!]}
                </span>
              </div>

              {/* Notes — clickable to open drawer */}
              {selected.notes && (
                <div
                  className="mb-3 px-3 py-2 rounded bg-slate-800/60 border border-slate-700 cursor-pointer hover:border-slate-500 transition-colors group"
                  onClick={() => setNotesLead(selected)}
                  title="Click to open full notes"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">Notes</span>
                    <span className="text-xs text-slate-600 group-hover:text-slate-400">↗ open</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{selected.notes}</p>
                </div>
              )}

              {/* Version info */}
              <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3">
                <span>Draft version: <span className="text-slate-300 font-mono">v{selected.draftVersion}</span></span>
                <span>Approved: <span className="text-slate-300 font-mono">{selected.approvedVersion !== null ? `v${selected.approvedVersion}` : "—"}</span></span>
                <span>Template: <span className="text-slate-300">{selected.templateUsed}</span></span>
              </div>

              {/* Stale explanation */}
              {selectedStatus === "stale" && (
                <div className="mt-3 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {selected.lastInboundAt && selected.approvedAt && selected.lastInboundAt > selected.approvedAt
                    ? "⚠️ New inbound message received after approval — re-review required."
                    : "⚠️ Draft was edited after approval — re-approve to send."}
                </div>
              )}

              {/* Account blocked */}
              {selected.accountBlocked && (
                <div className="mt-3 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  🔒 Sending account <strong>{selected.accountHandle}</strong> is blocked or rate-limited. Fix the account before sending.
                </div>
              )}
            </Card>

            {/* Draft editor */}
            <Card>
              <SectionHeader title="Draft Message" subtitle="Edit and approve below" />
              <textarea
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-md p-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-slate-500 transition-colors"
                rows={6}
                value={selected.draft}
                onChange={(e) => handleDraftChange(e.target.value)}
              />
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <button
                  onClick={handleApprove}
                  disabled={selectedStatus === "approved_pending_send" && !selected.accountBlocked}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedStatus === "approved_pending_send"
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {selectedStatus === "approved_pending_send" ? "✓ Approved" : "Approve"}
                </button>
                <button
                  onClick={handleMarkSent}
                  disabled={!sendable}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    sendable
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                  title={!sendable ? "Approve the draft first (and check account status)" : "Mark as sent"}
                >
                  Mark Sent
                </button>
                {!sendable && selectedStatus === "approved_pending_send" && (
                  <span className="text-xs text-red-400">Account blocked — resolve before sending</span>
                )}
              </div>
            </Card>

            {/* Conversation Thread */}
            <ConversationPanel lead={selected} />

            {/* Timeline */}
            <Card>
              <SectionHeader title="Activity Timeline" />
              <div className="space-y-2 text-xs text-slate-500">
                {selected.lastOutboundAt && (
                  <div className="flex gap-2"><span>📤</span><span>Last outbound: {new Date(selected.lastOutboundAt).toLocaleString()}</span></div>
                )}
                {selected.lastInboundAt && (
                  <div className="flex gap-2"><span>📥</span><span>Last inbound: {new Date(selected.lastInboundAt).toLocaleString()}</span></div>
                )}
                {selected.approvedAt && (
                  <div className="flex gap-2"><span>✅</span><span>Last approved: {new Date(selected.approvedAt).toLocaleString()}</span></div>
                )}
                {!selected.lastOutboundAt && !selected.lastInboundAt && !selected.approvedAt && (
                  <div className="text-slate-600">No activity recorded yet.</div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-3">
            <Card>
              <p className="text-sm text-slate-500 text-center py-12">Select a lead to review their draft</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
