"use client";

import { useState } from "react";
import { STATUSES, type Lead, type LeadInput } from "@/lib/types";

interface Props {
  lead?: Lead;
  events: string[];
  onSubmit: (data: LeadInput) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

export default function LeadForm({ lead, events, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<LeadInput>({
    name: lead?.name ?? "",
    company: lead?.company ?? "",
    email: lead?.email ?? "",
    event: lead?.event ?? "",
    notes: lead?.notes ?? "",
    status: lead?.status ?? "new",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof LeadInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({ ...form, name: form.name.trim(), event: form.event.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Name *</span>
          <input required value={form.name} onChange={set("name")} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Company</span>
          <input value={form.company} onChange={set("company")} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email *</span>
          <input required type="email" value={form.email} onChange={set("email")} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Event *</span>
          <input required list="event-options" value={form.event} onChange={set("event")} className={inputClass} placeholder="e.g. TechSparks 2026" />
          <datalist id="event-options">
            {events.map((ev) => (
              <option key={ev} value={ev} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Status</span>
        <select value={form.status} onChange={set("status")} className={inputClass}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Notes</span>
        <textarea
          rows={5}
          value={form.notes}
          onChange={set("notes")}
          className={inputClass}
          placeholder="What did you talk about? Any next steps?"
        />
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {saving ? "Saving..." : lead ? "Save changes" : "Add lead"}
        </button>
      </div>
    </form>
  );
}
