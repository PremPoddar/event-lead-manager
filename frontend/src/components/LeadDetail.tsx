"use client";

import { useEffect, useState } from "react";
import { draftFollowup, summarizeLead, updateLead } from "@/lib/api";
import { STATUSES, type Draft, type Lead, type Status } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  lead: Lead;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChange: (lead: Lead) => void;
}

const TONES = ["friendly", "formal", "short and direct"];

export default function LeadDetail({ lead, onClose, onEdit, onDelete, onChange }: Props) {
  const [summarizing, setSummarizing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [tone, setTone] = useState(TONES[0]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSummarize() {
    setSummarizing(true);
    setError("");
    try {
      onChange(await summarizeLead(lead.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate summary");
    } finally {
      setSummarizing(false);
    }
  }

  async function handleDraft() {
    setDrafting(true);
    setError("");
    try {
      setDraft(await draftFollowup(lead.id, tone));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft email");
    } finally {
      setDrafting(false);
    }
  }

  async function handleStatus(status: Status) {
    try {
      onChange(await updateLead(lead.id, { status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update status");
    }
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const mailto = draft
    ? `mailto:${lead.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
    : "";

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full flex-col overflow-y-auto bg-white shadow-xl sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{lead.name}</h2>
            <p className="truncate text-sm text-zinc-500">
              {lead.company || "No company"} · {lead.event}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          <section className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Email</span>
              <a href={`mailto:${lead.email}`} className="truncate pl-4 text-zinc-900 underline-offset-2 hover:underline">
                {lead.email}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Status</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={lead.status} />
                <select
                  aria-label="Change status"
                  value={lead.status}
                  onChange={(e) => handleStatus(e.target.value as Status)}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Added</span>
              <span>{new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Notes</h3>
            {lead.notes ? (
              <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">{lead.notes}</p>
            ) : (
              <p className="text-sm text-zinc-400">No notes yet. Add some to use the AI summary.</p>
            )}
          </section>

          <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-950">✨ AI summary</h3>
              <button
                onClick={handleSummarize}
                disabled={summarizing || !lead.notes.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                {summarizing ? "Thinking..." : lead.summary ? "Regenerate" : "Summarize notes"}
              </button>
            </div>
            {lead.summary ? (
              <p className="whitespace-pre-wrap text-sm text-zinc-700">{lead.summary}</p>
            ) : (
              <p className="text-sm text-zinc-500">Get the key points and next steps from your notes.</p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <h3 className="mb-3 text-sm font-semibold">✉️ Follow-up email</h3>
            <div className="flex gap-2">
              <select
                aria-label="Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm capitalize"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDraft}
                disabled={drafting}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                {drafting ? "Drafting..." : draft ? "Redo" : "Draft email"}
              </button>
            </div>

            {draft && (
              <div className="mt-4 space-y-2">
                <input
                  aria-label="Subject"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                />
                <textarea
                  aria-label="Body"
                  rows={9}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={copyDraft} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <a href={mailto} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                    Open in mail app
                  </a>
                </div>
              </div>
            )}
          </section>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-zinc-200 bg-white px-5 py-3">
          <button onClick={onEdit} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium hover:bg-zinc-50">
            Edit
          </button>
          <button onClick={onDelete} className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
