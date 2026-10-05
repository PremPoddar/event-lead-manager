"use client";

import { useCallback, useEffect, useState } from "react";
import LeadDetail from "@/components/LeadDetail";
import LeadForm from "@/components/LeadForm";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { createLead, deleteLead, getEvents, getLeads, updateLead } from "@/lib/api";
import { STATUSES, type Lead, type LeadFilters, type LeadInput } from "@/lib/types";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadFilters>({ status: "", event: "", sort: "newest" });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const load = useCallback(async () => {
    try {
      const [data, evs] = await Promise.all([getLeads({ ...filters, search }), getEvents()]);
      setLeads(data);
      setEvents(evs);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load leads");
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  // debounce so we don't hit the api on every keystroke
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave(data: LeadInput) {
    if (formMode === "edit" && selected) {
      await updateLead(selected.id, data);
    } else {
      const lead = await createLead(data);
      setSelectedId(lead.id);
    }
    setFormMode(null);
    await load();
  }

  async function handleDelete() {
    if (!selected || !confirm(`Delete ${selected.name}? This can't be undone.`)) return;
    try {
      await deleteLead(selected.id);
      setSelectedId(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function replaceLead(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  const hasFilters = search || filters.status || filters.event;
  const selectClass = "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Event Leads</h1>
          <p className="text-sm text-zinc-500">People you met at events, and where things stand with them.</p>
        </div>
        <button
          onClick={() => setFormMode("add")}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Add lead
        </button>
      </header>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          placeholder="Search name, company, email or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <select
            aria-label="Filter by event"
            value={filters.event}
            onChange={(e) => setFilters({ ...filters, event: e.target.value })}
            className={selectClass}
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as LeadFilters["status"] })}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as LeadFilters["sort"] })}
            className={selectClass}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
        <span>{!loading && `${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}</span>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setFilters({ status: "", event: "", sort: filters.sort });
            }}
            className="hover:text-zinc-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}. Is the backend running?
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-zinc-400">Loading...</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="font-medium">{hasFilters ? "No leads match your filters" : "No leads yet"}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {hasFilters ? "Try a different search." : "Add someone you met at an event to get started."}
          </p>
        </div>
      ) : (
        <>
          {/* table for desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.map((lead) => (
                  <tr key={lead.id} onClick={() => setSelectedId(lead.id)} className="cursor-pointer hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-zinc-500">{lead.email}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{lead.company || "—"}</td>
                    <td className="px-4 py-3 text-zinc-700">{lead.event}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(lead.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* cards for mobile */}
          <ul className="space-y-2 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id}>
                <button
                  onClick={() => setSelectedId(lead.id)}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left active:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{lead.name}</p>
                      <p className="truncate text-sm text-zinc-500">{lead.company || lead.email}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-2 truncate text-xs text-zinc-500">{lead.event}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && !formMode && (
        <LeadDetail
          key={selected.id}
          lead={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setFormMode("edit")}
          onDelete={handleDelete}
          onChange={replaceLead}
        />
      )}

      {formMode && (
        <Modal title={formMode === "edit" ? "Edit lead" : "Add lead"} onClose={() => setFormMode(null)}>
          <LeadForm
            lead={formMode === "edit" ? selected ?? undefined : undefined}
            events={events}
            onSubmit={handleSave}
            onCancel={() => setFormMode(null)}
          />
        </Modal>
      )}
    </main>
  );
}
