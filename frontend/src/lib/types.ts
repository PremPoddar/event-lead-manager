export type Status = "new" | "contacted" | "follow_up" | "closed";

export const STATUSES: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow up" },
  { value: "closed", label: "Closed" },
];

export interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  event: string;
  notes: string;
  status: Status;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadInput = Pick<Lead, "name" | "company" | "email" | "event" | "notes" | "status">;

export interface Draft {
  subject: string;
  body: string;
}

export interface LeadFilters {
  search?: string;
  status?: Status | "";
  event?: string;
  sort?: "newest" | "oldest" | "name";
}
