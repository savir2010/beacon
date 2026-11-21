// Beacon's reviewed-content library: the single source for the Resource Center and the
// Mediation Navigator. EVERYTHING HERE IS DRAFT and must be reviewed by California counsel
// before launch. Do not add a reviewer name until a real person has reviewed the entry.
// Official links point to public California and national resources; confirm each before launch.

export const OFFICIAL = {
  selfHelp: { label: "California Courts Self-Help Guide", url: "https://selfhelp.courts.ca.gov/" },
  divorceGuide: { label: "California Courts: divorce and legal separation", url: "https://selfhelp.courts.ca.gov/divorce" },
  disclosures: { label: "California Courts: financial disclosures", url: "https://selfhelp.courts.ca.gov/divorce/financial-disclosures" },
  courtMediation: { label: "California Courts: child custody mediation", url: "https://selfhelp.courts.ca.gov/child-custody/mediation" },
  forms: { label: "California Judicial Council forms", url: "https://courts.ca.gov/rules-forms/find-your-court-forms" },
  barReferral: { label: "State Bar of California: find legal help", url: "https://www.calbar.ca.gov/Public/Need-Legal-Help" },
  lawHelp: { label: "LawHelpCA: free and low-cost legal help", url: "https://www.lawhelpca.org/" },
  hotline: { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org/" },
};

export const ARTICLES = [
  {
    slug: "what-happens-in-the-first-session",
    title: "What happens in the first session",
    summary:
      "A first mediation meeting is mostly about understanding the process, agreeing how you will work together, and listing the topics you need to decide.",
    stage: "BEFORE",
    readMinutes: 4,
    officialLinks: [OFFICIAL.divorceGuide, OFFICIAL.selfHelp],
    body: `Most people arrive at a first mediation session unsure what will be asked of them. The short answer: not very much yet. The first session is about how the process works, not about deciding everything.

## Before the session
Beacon usually talks with each person separately before anyone meets together. This private conversation lets the mediator understand whether mediation is a good fit and whether anything should change about how the sessions are set up, such as meeting separately or by video.

## What the mediator explains
- What a mediator does and does not do. The mediator is neutral, guides the conversation, and helps you reach your own decisions. The mediator does not represent either of you and does not give either of you legal advice.
- How confidentiality works in mediation, and its limits.
- How sessions are scheduled, what they cost, and how documents are shared.
- That each of you may consult your own independent lawyer at any point.

## What you will talk about
The mediator will help you list the topics you need to decide. For many families these include a parenting schedule, child support, spousal support, property and debts, and timing. You do not need to solve them in the first meeting. You will usually leave with a short list of what to prepare for next time.

## What to bring
Bring your questions and a calendar. If you have already gathered financial documents, bring a list of what you have rather than the originals. Your Beacon workspace will show anything the team asks you to prepare.

## If you have a safety concern
Tell Beacon privately before any joint meeting is scheduled. The mediator will talk with you about whether and how mediation can work safely, and you can stop at any time.`,
  },
  {
    slug: "preparing-your-documents",
    title: "How to prepare your documents",
    summary:
      "California divorce requires both people to share financial information. Gathering it early makes mediation shorter and calmer.",
    stage: "BEFORE",
    readMinutes: 5,
    officialLinks: [OFFICIAL.disclosures, OFFICIAL.forms],
    body: `In a California divorce or legal separation, both people must exchange financial information, called disclosures. Mediation works the same way: decisions about support and property depend on a clear, shared picture of income, assets, and debts.

## Start with a list, not a pile
Make a simple list of every account and obligation you know about: bank accounts, retirement accounts, real estate, vehicles, credit cards, loans, and any business interest. A list is easier to discuss than a stack of statements, and it shows what is still missing.

## Documents most families gather
- Recent pay stubs and the last two years of tax returns.
- Recent statements for checking, savings, and investment accounts.
- Retirement and pension statements.
- Mortgage statements, a recent property tax bill, and any appraisal.
- Vehicle loan or lease documents.
- Credit card and other loan statements.
- Health insurance and childcare costs, if you have children.

## The court forms
California uses Judicial Council forms for disclosures, including the Income and Expense Declaration (FL-150) and the Schedule of Assets and Debts (FL-142). Beacon's team can tell you which forms your case needs and when. You can review the forms yourself on the California Courts website.

## Sharing documents through Beacon
Upload documents only when your workspace asks for them. Each request shows who will be able to see the document before you upload it. Documents you submit are not shared with the other participant unless the case team releases them, and you will be told before that happens.`,
  },
  {
    slug: "mediator-and-independent-lawyer",
    title: "A mediator and your own lawyer are different roles",
    summary:
      "The mediator is neutral and cannot advise either of you. Your own lawyer can tell you whether a proposal is a good idea for you.",
    stage: "BEFORE",
    readMinutes: 3,
    officialLinks: [OFFICIAL.barReferral, OFFICIAL.lawHelp],
    body: `People often ask whether they need a lawyer if they are using a mediator. The two roles are different, and many families use both.

## What a mediator does
A mediator is neutral. The mediator helps both people talk productively, organizes the issues, explains the general process, and helps write down the decisions you reach. The mediator does not take sides and cannot tell either of you what you should accept.

## What your own lawyer does
An independent lawyer works only for you. A lawyer can explain your rights, tell you how a court might view a proposal, and review an agreement before you sign it. Some people consult a lawyer once or twice during mediation; others keep a lawyer throughout.

## When to talk to a lawyer
- Before signing any agreement.
- When you are unsure whether a proposal is fair to you.
- When your question is about your rights in your specific situation, or what a court is likely to do.

Beacon's Mediation Navigator will point you to independent legal help when a question needs a lawyer rather than general information.

## Finding legal help
The State Bar of California lists certified lawyer referral services, and LawHelpCA lists free and low-cost legal aid by county.`,
  },
  {
    slug: "after-you-reach-an-agreement",
    title: "What happens after an agreement",
    summary:
      "An agreement reached in mediation usually becomes a written settlement that is filed with the court as part of the judgment.",
    stage: "AFTER",
    readMinutes: 4,
    officialLinks: [OFFICIAL.divorceGuide, OFFICIAL.forms],
    body: `Reaching agreement in mediation is a major step, but it is not the last one. Here is what usually follows.

## The written agreement
The mediator helps put your decisions into writing, often called a marital settlement agreement. Each of you should have the draft reviewed by your own lawyer before signing.

## Filing with the court
In California, a divorce or legal separation becomes final through a court judgment. The signed agreement is usually filed with the court as part of that judgment. Your workspace will show Beacon's steps separately from court events, because only the court can confirm when a judgment is entered.

## Your final documents
When your case closes, Beacon releases your authorized final documents in your workspace so you can download and keep them. Download them before your access ends.

## Day-to-day logistics
Many families move parenting schedules and shared expenses into a co-parenting tool afterward. Beacon can point you to setup guides, but it does not send your case file to any other company.

## If something changes later
Schedules change and children grow. If you need to revisit part of your agreement, you can return to mediation for that one issue.`,
  },
];

// Navigator library. Each entry is a reviewed question with a short answer, a source, and a next step.
export const QA = [
  {
    question: "Can I explore mediation if my spouse hasn't agreed?",
    phrasings: `my spouse hasn't agreed to mediation
partner doesn't want mediation
can i start mediation alone
other person not on board
husband won't agree to mediation
wife won't agree to mediation
what if they say no to mediation`,
    answer:
      "Yes. You can learn about mediation and talk with Beacon privately before the other person is involved. Mediation itself is voluntary, so joint sessions only begin when both people agree. Beacon never contacts the other person without talking with you first.",
    topic: "GETTING_STARTED",
    stage: "BEFORE",
    articleSlug: "what-happens-in-the-first-session",
    source: OFFICIAL.divorceGuide,
    nextLabel: "Request a private consultation",
    nextHref: "/consultation",
  },
  {
    question: "What should I bring to the first meeting?",
    phrasings: `what to bring to mediation
first mediation meeting what do i need
prepare for first session
what do i need for mediation
documents for first meeting`,
    answer:
      "Bring your questions, your calendar, and a list of the financial documents you already have. You do not need originals at the first meeting. The first session focuses on how mediation works and which topics you need to decide.",
    topic: "PROCESS",
    stage: "BEFORE",
    articleSlug: "what-happens-in-the-first-session",
    source: OFFICIAL.divorceGuide,
    nextLabel: "Build your preparation checklist",
    nextHref: "/navigator/guided",
  },
  {
    question: "What does a mediator do?",
    phrasings: `role of a mediator
is the mediator on my side
mediator neutral
what is mediation
how does mediation work`,
    answer:
      "A mediator is neutral. The mediator guides the conversation, organizes the issues, and helps both of you reach your own decisions. The mediator does not represent either person and cannot give either of you legal advice.",
    topic: "PROCESS",
    stage: "BEFORE",
    articleSlug: "mediator-and-independent-lawyer",
    source: OFFICIAL.selfHelp,
    nextLabel: "Read: mediator and lawyer roles",
    nextHref: "/resources/mediator-and-independent-lawyer",
  },
  {
    question: "Do I still need a lawyer if we use a mediator?",
    phrasings: `do i need a lawyer
should i hire an attorney
lawyer and mediator
attorney during mediation
can i have a lawyer in mediation`,
    answer:
      "You are not required to have a lawyer to use mediation, but many people consult one. A lawyer works only for you and can review a proposal or an agreement before you sign it. You can consult a lawyer at any point.",
    topic: "PROCESS",
    stage: "BEFORE",
    articleSlug: "mediator-and-independent-lawyer",
    source: OFFICIAL.barReferral,
    nextLabel: "Find independent legal help",
    nextHref: "/legal-help",
  },
  {
    question: "How long does mediation take?",
    phrasings: `how many sessions
how long is the process
timeline for mediation
how many meetings will we need`,
    answer:
      "It depends on how many topics you need to decide and how much preparation is done between sessions. Some families need two or three sessions; others need more. Preparing documents early usually shortens the process.",
    topic: "PROCESS",
    stage: "BEFORE",
    articleSlug: "preparing-your-documents",
    source: OFFICIAL.divorceGuide,
    nextLabel: "Start preparing now",
    nextHref: "/navigator/guided",
  },
  {
    question: "Is what we say in mediation confidential?",
    phrasings: `confidentiality in mediation
is mediation private
can what i say be used in court
privacy of mediation`,
    answer:
      "California law generally keeps mediation communications confidential, with some exceptions. The mediator explains how confidentiality applies, and its limits, at the start. If you have a question about how it applies to your situation, ask an independent lawyer.",
    topic: "PROCESS",
    stage: "BEFORE",
    articleSlug: "what-happens-in-the-first-session",
    source: OFFICIAL.selfHelp,
    nextLabel: "Read: the first session",
    nextHref: "/resources/what-happens-in-the-first-session",
  },
  {
    question: "What financial documents will I need?",
    phrasings: `financial disclosure
which documents do i need
tax returns pay stubs
income and expense declaration
fl-150
schedule of assets and debts
fl-142
bank statements`,
    answer:
      "California requires both people to share financial information. Most families gather recent pay stubs, two years of tax returns, account and retirement statements, mortgage and loan statements, and credit card statements. Beacon tells you which court forms your case needs.",
    topic: "DOCUMENTS",
    stage: "BEFORE",
    articleSlug: "preparing-your-documents",
    source: OFFICIAL.disclosures,
    nextLabel: "Read: preparing your documents",
    nextHref: "/resources/preparing-your-documents",
  },
  {
    question: "How do we start talking about a parenting schedule?",
    phrasings: `custody schedule
parenting plan
visitation schedule
who gets the kids
time with children
holiday schedule
co-parenting schedule`,
    answer:
      "Many families start with the regular school-week routine, then holidays, school breaks, and transportation. Before mediation, it helps to note your children's current routines and your own work schedule. The mediator helps both parents work through each part.",
    topic: "PARENTING",
    stage: "BEFORE",
    articleSlug: "what-happens-in-the-first-session",
    source: OFFICIAL.courtMediation,
    nextLabel: "Get parenting preparation questions",
    nextHref: "/navigator/guided?topics=PARENTING",
  },
  {
    question: "Is court-connected custody mediation the same as private mediation?",
    phrasings: `court mediation custody
family court services
child custody recommending counseling
mandatory mediation california`,
    answer:
      "No. When parents disagree about custody or visitation in a California court case, the court usually sends them to a court-connected mediation program. Private mediation with Beacon is separate and can cover more topics. Beacon does not replace a court program you have been ordered to attend.",
    topic: "PARENTING",
    stage: "BEFORE",
    articleSlug: null,
    source: OFFICIAL.courtMediation,
    nextLabel: "Find independent legal help",
    nextHref: "/legal-help",
  },
  {
    question: "How is child support decided?",
    phrasings: `child support amount
calculate child support
child support guideline
how much child support`,
    answer:
      "California uses a statewide guideline formula based mostly on each parent's income and parenting time. In mediation, parents work from the same financial information. The mediator cannot tell you what amount to accept; an independent lawyer can.",
    topic: "FINANCES",
    stage: "BEFORE",
    articleSlug: "preparing-your-documents",
    source: OFFICIAL.selfHelp,
    nextLabel: "Get finance preparation questions",
    nextHref: "/navigator/guided?topics=FINANCES",
  },
  {
    question: "What happens to our house and debts?",
    phrasings: `property division
who keeps the house
community property
dividing debts
split assets
retirement accounts divorce`,
    answer:
      "California is a community property state, which generally affects how property and debts from the marriage are divided. Mediation lets you decide together how to divide them, using a shared list of assets and debts. Ask an independent lawyer how the rules apply to you.",
    topic: "FINANCES",
    stage: "BEFORE",
    articleSlug: "preparing-your-documents",
    source: OFFICIAL.divorceGuide,
    nextLabel: "Read: preparing your documents",
    nextHref: "/resources/preparing-your-documents",
  },
  {
    question: "What happens after we reach an agreement?",
    phrasings: `after agreement
settlement agreement next steps
filing the agreement
marital settlement agreement
judgment`,
    answer:
      "The mediator helps put your decisions into a written agreement. Each of you should have it reviewed by your own lawyer before signing. It is then usually filed with the court as part of the judgment; only the court can make the divorce final.",
    topic: "AFTER",
    stage: "AFTER",
    articleSlug: "after-you-reach-an-agreement",
    source: OFFICIAL.divorceGuide,
    nextLabel: "Read: after an agreement",
    nextHref: "/resources/after-you-reach-an-agreement",
  },
  {
    question: "Can we meet separately instead of in the same room?",
    phrasings: `separate sessions
not in the same room
caucus
meet by video
online mediation
don't want to see my spouse`,
    answer:
      "Often, yes. Mediators can hold separate meetings, use video, or keep people in different rooms. Tell Beacon privately what would make you comfortable before any joint session is scheduled.",
    topic: "PROCESS",
    stage: "BEFORE",
    articleSlug: "what-happens-in-the-first-session",
    source: OFFICIAL.selfHelp,
    nextLabel: "Request a private consultation",
    nextHref: "/consultation",
  },
  {
    question: "How do I see what Beacon needs from me next?",
    phrasings: `check my case
case status
next step in my case
workspace login
sign in to my case`,
    answer:
      "If you are a Beacon client, sign in to your case workspace. The home screen shows your current milestone, your next action, who owns it, and when the team last updated your file.",
    topic: "PROCESS",
    stage: "DURING",
    articleSlug: null,
    source: { label: "Beacon case workspace", url: "/app" },
    nextLabel: "Sign in to your workspace",
    nextHref: "/app",
  },
  {
    question: "How much does mediation cost?",
    phrasings: `price of mediation
fees
cost of a mediator
how much will this cost`,
    answer:
      "Fees depend on the number of sessions and the preparation involved. Beacon explains its fees during a private consultation, before you commit to anything.",
    topic: "GETTING_STARTED",
    stage: "BEFORE",
    articleSlug: null,
    source: { label: "Beacon Mediation Services", url: "/consultation" },
    nextLabel: "Request a private consultation",
    nextHref: "/consultation",
  },
];

// Phrases that signal a question about one's own rights, a recommendation, or a likely court
// outcome. These go to independent legal help instead of an answer.
export const LEGAL_ADVICE_SIGNALS = [
  "should i accept",
  "should i sign",
  "should i agree",
  "is this fair",
  "is it fair",
  "will i get",
  "will i lose",
  "will the judge",
  "what will the court",
  "would a judge",
  "my rights",
  "am i entitled",
  "am i owed",
  "how much will i get",
  "how much will i pay",
  "can i keep the house",
  "will i get custody",
  "full custody",
  "sole custody",
  "can he take",
  "can she take",
  "can they take",
  "win",
  "sue",
];

// Phrases that signal fear, coercion, or a safety concern. These open the private safety route
// immediately and are never stored.
export const SAFETY_SIGNALS = [
  "afraid",
  "scared",
  "fear",
  "threat",
  "threaten",
  "hit me",
  "hurt me",
  "hurts me",
  "abuse",
  "abusive",
  "violence",
  "violent",
  "unsafe",
  "not safe",
  "danger",
  "stalk",
  "controlling",
  "forced",
  "forcing me",
  "pressured",
  "pressuring",
  "coerce",
  "restraining order",
  "protective order",
  "kill",
  "weapon",
  "gun",
];
