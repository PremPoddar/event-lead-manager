import type { Draft, Lead, LeadFilters, LeadInput } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) message = data.detail[0]?.msg ?? message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getLeads(filters: LeadFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return request<Lead[]>(`/leads?${params}`);
}

export const getEvents = () => request<string[]>("/events");

export const createLead = (data: LeadInput) =>
  request<Lead>("/leads", { method: "POST", body: JSON.stringify(data) });

export const updateLead = (id: number, data: Partial<LeadInput>) =>
  request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteLead = (id: number) => request<void>(`/leads/${id}`, { method: "DELETE" });

export const summarizeLead = (id: number) => request<Lead>(`/leads/${id}/summary`, { method: "POST" });

export const draftFollowup = (id: number, tone: string) =>
  request<Draft>(`/leads/${id}/draft`, { method: "POST", body: JSON.stringify({ tone }) });
