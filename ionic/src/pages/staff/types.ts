import type { Milestone } from "../../components/ui";

export type StaffCase = {
  case: { id: string; reference: string; title: string; status: string; safetyFlag: boolean; nextAction: string | null; nextActionOwner: string | null; updatedAt: string; closedAt: string | null };
  setup: { key: string; label: string; done: boolean }[];
  participants: { memberId: string; userId: string; name: string; email: string; active: boolean; invitedAt: string | null; notificationsEnabled: boolean; lastSignInAt: string | null }[];
  team: { memberId: string; userId: string; name: string; role: string; active: boolean }[];
  milestones: Milestone[];
  sessions: { id: string; title: string; startsAt: string; durationMin: number; location: string; prep: string | null; past: boolean; ics: string }[];
  checklist: { id: string; title: string; description: string | null; status: string; dueDate: string | null; assignee: { id: string; name: string } | null; overdue: boolean }[];
  documents: { id: string; title: string; state: string; visibility: string; size: number; mime: string; uploadedBy: string; date: string; audience: string; visibleTo: string[]; recipients: string[] }[];
  threads: { userId: string; name: string; awaitingReply: boolean; messages: { id: string; fromParticipant: boolean; author: string; body: string; at: string }[] }[];
  updates: { id: string; body: string; releasedAt: string }[];
  activity: { id: string; at: string; actor: string; action: string; detail: string | null }[];
  mediators: { id: string; name: string }[];
};

export type CaseRow = { id: string; reference: string; title: string; status?: string; safetyFlag: boolean; updatedAt: string; participants: string[]; mediators: string[]; milestone: string | null; nextAction: string | null; nextSession?: string | null };
export type Attention = { kind: string; caseId?: string; reference?: string; title: string; detail: string; at: string; tab?: string };

export type Consultation = { id: string; name: string; email: string; phone: string | null; preferredContact: string; bestTime: string | null; safeToLeaveMessage: boolean; topics: string[]; status: string; createdAt: string; assignee: { id: string; name: string } | null };
export type SafetyReq = { id: string; contactMethod: string; contactValue: string; safeTimes: string | null; safeToLeaveMessage: boolean; status: string; createdAt: string };
