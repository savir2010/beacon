# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + React + Tailwind CSS 4 + TypeScript, matching the team's existing club project. Local SQLite database via Prisma for version 1. Production hosting, a real email provider, and an external security review are deferred.

## Users

- **Prospective clients:** California adults exploring separation or divorce, often anxious, frequently on a phone, sometimes researching privately. They need to know what applies to their stage, what their next step is, and where to find information, without creating an account or disclosing their case.
- **Active clients (participants):** people in a Beacon mediation case, each with an individual invitation-only account. They check the current milestone, their next action, upcoming sessions, and documents released to them.
- **Beacon staff:** mediators and authorized case staff who create cases, invite participants, assign checklist items, update milestones, and release documents to specific recipients.

## Product Purpose

Beacon Mediation Services' family mediation platform: a public starting point (Mediation Navigator + Resource Center) for families exploring mediation, and a private case workspace for families in mediation. Version 1 is a mobile-friendly website. Success means families can always answer "what applies to me, what's next, where is it," and Beacon sees fewer status emails and document resend requests.

## Positioning

Unlike free self-help guides (California Courts Self Help) or online-divorce services (Hello Divorce), Beacon offers one continuous path from first question through preparation and live case updates, run by an operating mediation practice where the case team controls what appears and when. The mediator guides; the parties decide.

## Operating Context

- Beacon's own practice pilots the product on real cases first; independent mediators may adopt it later.
- Mediation sessions happen live; the workspace handles preparation and coordination between sessions.
- Beacon workflow milestones are distinct from verified court filings or court events and must be labeled that way.
- Families in this situation may face fear, coercion, or safety concerns; the other party must never be notified automatically.

## Capabilities and Constraints

Version 1 scope:
- **Mediation Navigator** (public, no login): guided questionnaire producing a downloadable preparation checklist and questions for a mediator; free-text questions answered by search over the reviewed library (retrieval only, no AI generation); each answer shows its source and a next step; low-confidence or case-specific questions hand off to a person or independent legal help; private safety route; separate consultation contact form. Must not collect case narratives, children's names, or financial documents.
- **Resource Center** (public): short articles with reviewer, review date, official links; same library feeds the Navigator; no comments.
- **Case Workspace** (invitation only): client home (milestone, next action, owner, last updated), sessions, document checklist (requested / received / under review / available), authorized downloads, logistics messages showing readers before sending. Staff: create cases, invite participants, assign checklist items, update milestones, publish documents to chosen recipients with recipient confirmation, joint updates.
- Notifications say only "please sign in"; no sensitive content.
- Individual accounts, role permissions, per-document access control, shared / restricted / staff-only separation, staff MFA, audit log of access, releases, and permission changes.

Out of scope for v1: conversational AI, paid Divorce Prep, online offers/counteroffers, co-parenting vendor integrations, native app, subscriptions, outside-mediator tenancy.

Terminology: "Mediation Navigator", "Resource Center", "case workspace", "participant", "milestone", "release".

## Brand Commitments

- Name: Beacon (Beacon Mediation Services). No logo exists yet.
- Voice: plain language, calm, neutral between parties, never giving legal advice.
- User-specified palette: light blue and white. Professional, ambient feel.

## Evidence on Hand

- `Beacon_App_White_Paper.docx` (product white paper, November 2026, concept stage).
- No reviewed legal content exists yet. All Navigator and Resource Center content is draft, labeled "Draft — pending legal review", with no invented reviewer names.
- No testimonials, client counts, outcomes, pricing, or partnerships exist. Do not fabricate any.

## Product Principles

1. A clear next step and a route to a person, at every stage.
2. The case team controls what each person sees; nothing is shared or sent automatically.
3. Safety first: private routes, neutral notifications, no surprise contact with the other party.
4. Information, not advice: show sources, and route legal or case-specific questions to independent counsel.
5. Collect the minimum; public pages work without login or personal details.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Users may be distressed, on small phones, or reading in a second language: plain language, large tap targets, and no reliance on color alone for status.
