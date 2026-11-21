import type { Milestone, Msg } from "../../components/ui";

export type Workspace = {
  viewerName: string;
  case: { id: string; reference: string; closed: boolean; closedAt: string | null; accessUntil: string | null; updatedAt: string; updatedBy: string | null; nextAction: string | null; nextActionOwner: string | null };
  current: { title: string; description: string | null; step: number; of: number } | null;
  milestones: Milestone[];
  sessions: { id: string; title: string; startsAt: string; durationMin: number; location: string; prep: string | null; ics: string }[];
  updates: { id: string; body: string; releasedAt: string }[];
  checklist: { id: string; title: string; description: string | null; status: string; dueDate: string | null; owner: string; canUpload: boolean; ics: string | null }[];
  documents: { id: string; title: string; status: string; owner: string; seenBy: string; date: string; size: number; mime: string }[];
  messages: Msg[];
  readers: string;
  privacyNote: string;
  team: { name: string; role: string }[];
};

export type ClientHome = {
  cases: { id: string; reference: string; closed: boolean; updatedAt: string }[];
  consultation: { id: string; status: string; createdAt: string; preferredContact: string; bestTime: string | null; topics: string[]; mediator: string | null } | null;
};
