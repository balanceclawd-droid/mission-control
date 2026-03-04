"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { docs, docTypeLabels, docTypeColors, type DocType, type DocEntry } from "@/lib/mock/phase1-docs";

// ── Doc Type Tag ────────────────────────────────────────────────────────────────
function DocTypeTag({ type }: { type: DocType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${docTypeColors[type]}`}>
      {docTypeLabels[type]}
    </span>
  );
}

// ── Doc Detail / Edit Drawer ────────────────────────────────────────────────────
function DocDetailDrawer({
  doc,
  onClose,
  onSave,
}: {
  doc: DocEntry;
  onClose: () => void;
  onSave: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc.content ?? doc.summary);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave(doc.id, draft);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl bg-[#0b0f19] border-l border-slate-700 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-800 px-5 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <DocTypeTag type={doc.type} />
                {doc.pinned && <span className="text-amber-400 text-xs">📌 Pinned</span>}
              </div>
              <h2 className="text-sm font-semibold text-slate-200 leading-snug">{doc.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
                {doc.project && <span>📁 {doc.project}</span>}
                <span>Updated {doc.lastUpdated}</span>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Open source ↗
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>

          {/* Tags */}
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {doc.tags.map((tag) => (
                <span key={tag} className="text-xs text-slate-600">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-medium text-slate-400">Content</span>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs text-emerald-400">✓ Saved (local)</span>
              )}
              {editing ? (
                <>
                  <button
                    onClick={() => { setDraft(doc.content ?? doc.summary); setEditing(false); }}
                    className="px-2.5 py-1 rounded text-xs text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-2.5 py-1 rounded text-xs text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <textarea
              className="w-full h-full min-h-[400px] bg-[#0f1623] border border-slate-700 rounded-lg p-4 text-sm text-slate-200 font-mono leading-relaxed resize-none focus:outline-none focus:border-slate-500 transition-colors"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#0f1623] border border-slate-800 rounded-lg p-4">
              {draft}
            </div>
          )}

          {editing && (
            <p className="text-xs text-slate-600 mt-2">
              ℹ Local state only — changes persist in this session. Wire to Notion/GDocs API for persistence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Doc Card ────────────────────────────────────────────────────────────────────
function DocCard({ doc, onClick }: { doc: DocEntry; onClick: () => void }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-[#0f1623] p-4 hover:border-slate-600 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors leading-snug">
            {doc.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {doc.pinned && (
            <span className="text-xs text-amber-400" title="Pinned">📌</span>
          )}
          <DocTypeTag type={doc.type} />
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">{doc.summary}</p>

      <div className="flex items-center gap-2 flex-wrap mt-1">
        {doc.project && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            📁 {doc.project}
          </span>
        )}
        {doc.tags.map((tag) => (
          <span key={tag} className="text-xs text-slate-600">#{tag}</span>
        ))}
        <span className="ml-auto text-xs text-slate-600 flex items-center gap-1">
          {doc.lastUpdated}
          <span className="text-slate-700 group-hover:text-slate-500 transition-colors">→</span>
        </span>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
const ALL_TYPES: Array<{ value: DocType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "playbook", label: "Playbooks" },
  { value: "pitch", label: "Pitch" },
  { value: "meeting_note", label: "Meeting Notes" },
  { value: "active_doc", label: "Active Docs" },
  { value: "template", label: "Templates" },
];

export default function DocsMemoryPage() {
  const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);
  const [docContents, setDocContents] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<DocType | "all">("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build merged docs with edited content
  const mergedDocs = useMemo(
    () => docs.map((d) => docContents[d.id] !== undefined ? { ...d, content: docContents[d.id] } : d),
    [docContents]
  );

  const projects = useMemo(() => {
    const set = new Set(docs.filter((d) => d.project).map((d) => d.project!));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return mergedDocs.filter((d) => {
      if (filterType !== "all" && d.type !== filterType) return false;
      if (filterProject !== "all" && d.project !== filterProject) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !d.title.toLowerCase().includes(q) &&
          !d.summary.toLowerCase().includes(q) &&
          !d.tags.some((t) => t.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [mergedDocs, filterType, filterProject, searchQuery]);

  const pinned = filtered.filter((d) => d.pinned);
  const unpinned = filtered.filter((d) => !d.pinned);

  function handleSave(id: string, content: string) {
    setDocContents((prev) => ({ ...prev, [id]: content }));
    // Update selectedDoc to reflect the edit
    if (selectedDoc?.id === id) {
      setSelectedDoc((prev) => prev ? { ...prev, content } : prev);
    }
  }

  function openDoc(doc: DocEntry) {
    const merged = docContents[doc.id] !== undefined ? { ...doc, content: docContents[doc.id] } : doc;
    setSelectedDoc(merged);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Detail drawer */}
      {selectedDoc && (
        <DocDetailDrawer
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onSave={handleSave}
        />
      )}

      <div>
        <h1 className="text-lg font-semibold text-slate-100">Docs & Memory</h1>
        <p className="text-xs text-slate-500 mt-0.5">Playbooks, pitch notes, meeting logs, and active documents</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Type filter tabs */}
        <div className="flex gap-1.5 flex-wrap border-b border-slate-800 pb-3">
          {ALL_TYPES.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value as DocType | "all")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterType === tab.value
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + project filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search docs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-48 bg-[#0f1623] border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
          />
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[#0f1623] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
          >
            {projects.map((p) => (
              <option key={p} value={p}>{p === "all" ? "All projects" : p}</option>
            ))}
          </select>
          {(filterType !== "all" || filterProject !== "all" || searchQuery) && (
            <button
              onClick={() => { setFilterType("all"); setFilterProject("all"); setSearchQuery(""); }}
              className="px-2.5 py-1.5 rounded text-xs text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-slate-600">{filtered.length} doc{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">No docs match your filters.</p>
        </Card>
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="Pinned" subtitle="High-priority references" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinned.map((doc) => (
                  <DocCard key={doc.id} doc={doc} onClick={() => openDoc(doc)} />
                ))}
              </div>
            </section>
          )}

          {/* Other docs — grouped by type unless filtered */}
          {unpinned.length > 0 && (
            filterType !== "all" ? (
              <section className="space-y-3">
                <SectionHeader title={docTypeLabels[filterType as DocType]} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unpinned.map((doc) => (
                    <DocCard key={doc.id} doc={doc} onClick={() => openDoc(doc)} />
                  ))}
                </div>
              </section>
            ) : (
              <>
                {(["active_doc", "meeting_note", "playbook", "pitch", "template"] as DocType[]).map((type) => {
                  const typeDocs = unpinned.filter((d) => d.type === type);
                  if (typeDocs.length === 0) return null;
                  return (
                    <section key={type} className="space-y-3">
                      <SectionHeader title={docTypeLabels[type]} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {typeDocs.map((doc) => (
                          <DocCard key={doc.id} doc={doc} onClick={() => openDoc(doc)} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
