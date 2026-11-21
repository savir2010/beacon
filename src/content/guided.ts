// The guided Navigator path. Answers are never stored; the checklist is computed on request.
// DRAFT content pending legal review, like the rest of the library.

export type StageKey = "EXPLORING" | "DECIDED" | "FILED" | "IN_MEDIATION";
export type TopicKey = "PARENTING" | "FINANCES" | "PROPERTY" | "DOCUMENTS" | "COMMUNICATION";
export type AwareKey = "YES" | "NO" | "UNSURE";

export const STAGES: { key: StageKey; label: string; hint: string }[] = [
  { key: "EXPLORING", label: "Just exploring", hint: "Learning what mediation involves" },
  { key: "DECIDED", label: "We've decided to separate", hint: "Nothing filed with the court yet" },
  { key: "FILED", label: "A case is filed with the court", hint: "One of you has filed a petition" },
  { key: "IN_MEDIATION", label: "Already working with Beacon", hint: "You have a case workspace" },
];

export const TOPICS: { key: TopicKey; label: string }[] = [
  { key: "PARENTING", label: "Parenting and schedules" },
  { key: "FINANCES", label: "Support and income" },
  { key: "PROPERTY", label: "Home, property and debts" },
  { key: "DOCUMENTS", label: "Gathering documents" },
  { key: "COMMUNICATION", label: "Talking with the other person" },
];

export const AWARE: { key: AwareKey; label: string }[] = [
  { key: "YES", label: "Yes, they know" },
  { key: "NO", label: "Not yet" },
  { key: "UNSURE", label: "I'm not sure" },
];

type Item = { title: string; detail?: string };

const STAGE_STEPS: Record<StageKey, Item[]> = {
  EXPLORING: [
    { title: "Read how the first session works", detail: "Beacon Resource Center: What happens in the first session." },
    { title: "Write down the decisions you think you'll need to make", detail: "A list is enough. You don't need answers yet." },
    { title: "Decide whether you'd like a private consultation", detail: "It's a conversation with Beacon only. The other person isn't contacted." },
  ],
  DECIDED: [
    { title: "Request a private consultation with Beacon", detail: "Beacon talks with each person separately before any joint meeting." },
    { title: "Start a list of accounts, property and debts", detail: "Names of accounts and approximate balances are enough to begin." },
    { title: "Note any dates that matter", detail: "Date of separation, school calendars, planned moves or job changes." },
  ],
  FILED: [
    { title: "Keep your court case number and deadlines in one place", detail: "Beacon's steps are separate from court deadlines; the court controls those." },
    { title: "Check whether the court has ordered custody mediation", detail: "A court-connected program is separate from private mediation." },
    { title: "Consider consulting an independent lawyer about deadlines", detail: "A lawyer can explain what your filing requires of you." },
  ],
  IN_MEDIATION: [
    { title: "Sign in to your Beacon workspace", detail: "Your next action and document requests are listed there." },
    { title: "Complete any checklist items marked Requested", detail: "Each item shows who will see what you upload." },
    { title: "Bring your questions to the next session", detail: "Use the questions below as a starting point." },
  ],
};

const TOPIC_PREP: Record<TopicKey, { checklist: Item[]; questions: string[] }> = {
  PARENTING: {
    checklist: [
      { title: "Write down your children's current weekly routine", detail: "School, activities, bedtimes, who usually drives." },
      { title: "Collect the school calendar for this year", detail: "Holidays and breaks are often the hardest part of a schedule." },
      { title: "Note your own work schedule and any planned changes" },
    ],
    questions: [
      "How do other families usually divide school weeks, weekends and holidays?",
      "How do we handle transportation and exchanges?",
      "How do we make decisions about school, health care and activities?",
      "What happens if one of us needs to change the schedule later?",
    ],
  },
  FINANCES: {
    checklist: [
      { title: "Gather your last two years of tax returns" },
      { title: "Collect recent pay stubs or proof of income" },
      { title: "List regular monthly expenses", detail: "Housing, childcare, health insurance, transportation." },
    ],
    questions: [
      "What financial information do we each need to share, and by when?",
      "Which court forms will our case need?",
      "How do we work from the same numbers when we discuss support?",
      "When should I have an independent lawyer review a support proposal?",
    ],
  },
  PROPERTY: {
    checklist: [
      { title: "List every account, property and vehicle you know of", detail: "Include retirement accounts and any business interest." },
      { title: "List debts: mortgage, loans and credit cards" },
      { title: "Find recent statements for each item on your list" },
    ],
    questions: [
      "How do we build one shared list of assets and debts?",
      "What happens with the house while we're still deciding?",
      "Do we need an appraisal or valuation for anything?",
      "How are retirement accounts usually handled in an agreement?",
    ],
  },
  DOCUMENTS: {
    checklist: [
      { title: "Make one folder for everything", detail: "Paper or digital. Label documents by month and type." },
      { title: "Make a list of what you have and what's missing" },
      { title: "Wait for Beacon to request uploads", detail: "Upload only when your workspace asks, so you know who will see it." },
    ],
    questions: [
      "Which documents do you need from me, and which from both of us?",
      "Who will be able to see each document I upload?",
      "How will I know when a document has been reviewed?",
    ],
  },
  COMMUNICATION: {
    checklist: [
      { title: "Think about what format feels workable", detail: "Same room, separate rooms, or video." },
      { title: "Note topics that have been hard to discuss", detail: "You can raise these privately with the mediator first." },
    ],
    questions: [
      "Can we meet separately or by video?",
      "How does confidentiality work in mediation, and what are its limits?",
      "What should we do if a conversation becomes too difficult?",
    ],
  },
};

export type GuidedResult = {
  stage: (typeof STAGES)[number];
  topics: (typeof TOPICS)[number][];
  aware: AwareKey;
  steps: Item[];
  checklist: { topic: string; items: Item[] }[];
  questions: { topic: string; items: string[] }[];
  awarenessNote: string | null;
};

export function parseGuided(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (Array.isArray(params[k]) ? params[k]![0] : params[k]) as string | undefined;
  const stageKey = one("stage") as StageKey | undefined;
  const aware = (one("aware") as AwareKey | undefined) ?? "UNSURE";
  const topicKeys = (one("topics") ?? "")
    .split(",")
    .filter((t): t is TopicKey => TOPICS.some((x) => x.key === t));
  return { stageKey, aware, topicKeys };
}

export function buildGuided(stageKey: StageKey, topicKeys: TopicKey[], aware: AwareKey): GuidedResult {
  const stage = STAGES.find((s) => s.key === stageKey) ?? STAGES[0];
  const topics = TOPICS.filter((t) => topicKeys.includes(t.key));
  const chosen = topics.length ? topics : TOPICS.filter((t) => t.key === "DOCUMENTS");
  return {
    stage,
    topics: chosen,
    aware,
    steps: STAGE_STEPS[stage.key],
    checklist: chosen.map((t) => ({ topic: t.label, items: TOPIC_PREP[t.key].checklist })),
    questions: chosen.map((t) => ({ topic: t.label, items: TOPIC_PREP[t.key].questions })),
    awarenessNote:
      aware === "YES"
        ? null
        : "You can prepare and talk with Beacon privately first. Beacon won't contact the other person without talking with you, and joint sessions begin only when both people agree.",
  };
}
