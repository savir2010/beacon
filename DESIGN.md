---
name: Beacon
description: Family mediation, step by step. Calm clarity as still water light.
colors:
  canvas: "#f4f8fb"
  raised: "#ffffff"
  raised-2: "#e9f2f9"
  ink: "#14304a"
  muted: "#4a6176"
  accent: "#2a6a9a"
  accent-hi: "#235c88"
  on-accent: "#ffffff"
  danger: "#a8402f"
  hairline: "rgb(20 48 74 / 0.12)"
  hairline-strong: "rgb(20 48 74 / 0.22)"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "92px"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "46px"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"cv11\", \"ss01\""
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  control: "10px"
  card: "14px"
  panel: "18px"
  pill: "999px"
spacing:
  gutter-sm: "20px"
  gutter-md: "40px"
  container: "1280px"
  row-gap: "16px"
  panel-pad: "24px"
  panel-pad-lg: "36px"
  section-sm: "96px"
  section-lg: "128px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hi}"
  button-outline:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  field:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "48px"
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
    height: "36px"
  choice-card:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px 18px"
  panel:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  next-action-panel:
    backgroundColor: "{colors.raised-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  status:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
---

# Design System: Beacon

## Overview

**Creative North Star: "Still Water Light"**

Beacon is a pale pool seen from above on a calm day: white and light-blue ground, deep ink-blue type, and slow refracted light drifting across the floor. The light is the only atmosphere. On the public site a WebGL caustic layer sits behind the home hero and interlude and under the title band of inner pages; everywhere else the page is flat, open, and divided by hairline rules. People who arrive here are anxious and often on a phone, so the system stays quiet, the type is large, and nothing competes with the next step.

One typeface (Manrope) does all the work, from a 92px centred display line to 13px status labels. Sections are open bands on the canvas or on white, separated by single hairlines. White panels with a hairline border are reserved for things people act on or read closely: a Navigator answer, a form, a release control. The working screens (workspace, staff console) inherit the same world without the water; they are denser but use the same tokens, the same rows, and the same status language.

The build refuses the family-law default of stock photography, a navy header bar, and three feature cards.

**Key Characteristics:**
- Light blue and white ground, deep ink-blue type, one pool-blue accent.
- Caustic light as the only atmospheric device; no drop shadows on surfaces.
- Manrope throughout, medium-weight display with tight negative tracking.
- Hairline rules and open bands instead of boxed cards.
- One five-column label grid for every checklist and document row.
- Status is always an icon plus a word.

## Colors

A cool, low-chroma palette of pool whites and ink blues, with a single saturated pool-blue accent and one reserved brick red.

### Primary
- **Pool Blue** (accent): the only accent. It marks an action (primary buttons, the Ask button, focus rings, caret, selected choice cards, active filter chips, the confirmation panel before a release) or the current milestone (the ringed dot on the path, the current bar in the milestone strip). Hover deepens it to **Deep Pool** (accent-hi). Text on it is white (on-accent).

### Tertiary
- **Brick Red** (danger): reserved for safety and destructive semantics: the staff safety-request panel and safety-flag badge, the safety-flag toggle, deactivating a member, and form errors / invalid fields. A deliberate exception to one-accent-one-meaning.

### Neutral
- **Still Canvas** (canvas): the page ground on every surface and the alternating band colour on the home page.
- **White** (raised): panels people act on, the footer, the workspace hero band, the sticky app header (at 92% with backdrop blur), message bubbles from the team, fields.
- **Pale Pool** (raised-2): quiet inset fills: the next-action panel, the "Next step" bar inside an answer, "who can read this" notes, the participant's own message bubble, menu hover.
- **Deep Ink** (ink): all primary text, the wordmark, completed-milestone dots at 70% opacity.
- **Slate Ink** (muted): secondary text, meta lines, row-head labels, status words other than Available, icons beside rows.
- **Hairline** (hairline) and **Strong Hairline** (hairline-strong): ink at 12% and 22%. Hairline divides sections and rows; strong hairline outlines controls, the row-head underline, and the vertical path rules.

### Named Rules
**The One Accent, One Meaning Rule.** Pool blue means "act here" or "you are here" and nothing else. It never decorates a heading, a section band, or an icon that is not an action. Completed steps are ink, not blue.

**The Reserved Red Rule.** Brick red appears only for safety, destructive actions, and errors. It is never a brand colour and never a second accent.

## Typography

**Display Font:** Manrope (variable, 200 to 800, self-hosted) with ui-sans-serif, system-ui fallback
**Body Font:** Manrope
**Label/Mono Font:** Manrope with tabular lining numerals for references and dates; the browser monospace appears only for the MFA secret and the staff article editor.

**Character:** A single humanist geometric sans used with restraint: medium weight and tight tracking at display sizes for calm authority, regular weight and generous leading at reading sizes. Stylistic sets cv11 and ss01 are on globally.

### Hierarchy
- **Display** (500, 46px phone / 72px tablet / 92px desktop, 1.04, -0.04em): the home hero line and the interlude statement (40 to 80px). Balanced wrapping, about 14 to 17ch wide.
- **Headline** (500, 36px phone / 46 to 56px desktop, 1.04, -0.03em): section headings on public pages, the workspace current-milestone title (36 to 48px), the staff case title.
- **Title** (600, 22 to 24px, -0.02em): workspace section heads, stage names, article titles in lists, the next-action text.
- **Body** (400, 17px, 1.55): lead paragraphs, capped at 36 to 52ch; article bodies at 66ch. Working rows use 15 to 16px with a 500 weight item title.
- **Label** (500, 13px): status words, row-head labels, hints, meta lines, draft notes. Sentence case, never uppercase, never letter-spaced.

### Named Rules
**The No Kicker Rule.** Headings stand alone. No uppercase eyebrows or tracked labels above them; context goes in a muted sentence below.

## Layout

A centred container of 1280px with 20px gutters on phones and 40px from 768px. Public pages are a stack of full-width bands alternating canvas and white, each separated by a hairline and padded 96px (128px from 640px). Inside a band, a 12-column grid at large widths places a 4 or 5 column heading block against a 7 or 8 column content block; everything stacks to one column on phones.

The home page reads along one axis, Before, During, After, drawn as a three-step horizontal hairline with dots on desktop and a vertical line on phones. The hero fills the first viewport, centred, with the safety link pinned bottom-left.

The workspace places an 8-column main column (checklist, documents, messages) against a 4-column aside (sessions, path, team). Sections are spaced 56 to 64px apart; rows are 14 to 16px vertical padding with a hairline beneath.

**The One Label Grid Rule.** Every checklist and document row uses the same grid: item, status, owner, date, action (flexible, 140px, 130px, 110px, 128px) from 768px, with a 13px muted column-head row above it on a strong hairline. Below 768px it collapses to item plus status, with owner and date folded into a muted meta line and the action spanning full width.

## Elevation & Depth

Flat. Depth comes from light, not shadow: the caustic layer behind the public hero and interlude, the tonal step from canvas to white to pale pool, and hairlines. Panels never cast shadows. The only translucency is the sticky app header (white at 92% with a medium backdrop blur). A floating shadow token (`--shadow-float`) exists in the theme but is intentionally unused.

### Named Rules
**The Light Not Shadow Rule.** To lift something, change its ground (canvas to white, or white to pale pool) or give it a hairline. Do not add a box-shadow. The only gradients are the caustic layer and its static fallback wash.

**The Still Water Rule.** The caustic layer appears only on public and sign-in surfaces: full-bleed behind the home hero and interlude, as a title band at the top of inner public pages and articles, and as the sign-in side panel. Never behind working screens. Its currents fold and swirl very slowly (domain-warped noise, never a visible circle or ring; a shape stays recognisable for tens of seconds, and the filaments of light stay faint so text reads first), the pointer twists a gentle edgeless vortex into the flow, it renders one still frame under reduced motion, and falls back to a soft radial wash without WebGL.

## Shapes

Gently rounded, three steps: controls and fields at 10px, cards and choice cards at 14px, panels at 18px. Pills (full round) for the Ask field and button, suggestion chips, and radio ticks; checkbox ticks are 6px squares. Message bubbles are 16px with one 4px corner toward the speaker. Milestones are circles for Beacon steps and a 45-degree rounded diamond for court events. Borders are always 1px hairlines; the dashed hairline marks a file drop target.

The logo is Beacon Mediation's official artwork: a navy and gold compass rose around a lighthouse over a handshake, with "BEACON Mediation" lettered beneath (files in `public/brand/` and `ionic/public/brand/`, made from the 1536px original with the white background removed). Use the full stacked logo where there is room (app sign-in, launch screen); the emblem alone at small sizes (app top bars, favicon, home-screen icon); and in a header row, the emblem with the logo's own lettering beside it. Never redraw, recolour or stretch it, and keep it on light surfaces.

## Components

### Buttons
Quiet and solid, never loud.
- **Shape:** gently rounded (10px), 46px tall; large 54px, small 36px. Ask is a full pill.
- **Primary:** pool blue with white text, 500 weight, 15px. One per view region.
- **Hover / Focus:** primary deepens to Deep Pool over 160ms; all buttons press down 1px on active; focus shows a 2px pool-blue outline offset 3px.
- **Outline:** white with strong hairline border, ink text; border darkens to 40% ink on hover. Used for secondary actions and Download.
- **Quiet:** text only, 5% ink wash on hover. Used for header nav, section nav, and low-emphasis row actions.
- **Danger:** white with brick-red text and a 40% brick border, 6% red wash on hover. Only for safety toggles and deactivation.
- Icons are lucide line icons at 15 to 17px, 1.75 stroke, placed before or after the word.

### Chips
- **Style:** full pill, 36px min height, strong hairline border, white at 72% so the water shows through, 14px ink text.
- **State:** hover and selected switch the border to pool blue. Used for suggested questions and audit filters.

### Cards / Containers
- **Corner Style:** 18px panels, 14px cards.
- **Background:** white for panels people act on; pale pool for the next-action panel and inset notes; canvas for nested forms inside a row.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** one hairline on white panels; pale-pool fills carry no border. Release confirmation panels use a 40% pool-blue border on a 5% pool-blue tint.
- **Internal Padding:** 24px, 28 to 36px at larger widths.

### Inputs / Fields
- **Style:** 48px tall, white, strong hairline border, 10px radius, 16px ink text, slate placeholder. Textareas start at 112px. Selects carry a thin slate chevron.
- **Focus:** border turns pool blue with a 3px pool-blue halo at 16%.
- **Error / Disabled:** invalid fields take a brick-red border and a 14px brick-red message below; disabled controls drop to 50% opacity.
- **Choice cards:** radio and checkbox options are full cards (14px radius, 16 by 18px padding) with a round or square tick; checked turns the border and tick pool blue over a 6% pool-blue tint.
- Labels are 14px 500 above the field; hints are 13px muted below.

### Navigation
- **Public header:** 76px, wordmark left, quiet links plus one small primary "Request a consultation" right; overlays the water on the home page, sits on canvas with a hairline elsewhere. On phones it collapses to an outline Menu disclosure with a white 14px-radius sheet.
- **App header:** 64px, sticky, translucent white with blur, small mark and wordmark, quiet section links, the person's name and role at right, outline Sign out. On phones the section links move to a horizontally scrolling second row.
- **Safety link:** a shield icon plus "Need help now? Private safety options", 14px 500 ink, underline on hover. Present in the hero, the close, and the footer.

### Status
Status is always an icon plus a word, never colour alone: dashed circle Requested, inbox Received, clock Under review, check circle Available. 13px 500 in slate; Available steps up to ink. No coloured pills or badges.

### Milestone Path
A vertical strong hairline with markers: completed steps a 70% ink filled dot with a white check, the current step a pool-blue ring (5px) on white with a semibold title, upcoming steps an outline circle, court events an outline diamond with a muted line stating whether the court record verifies it.

## Do's and Don'ts

### Do:
- **Do** keep pool blue for actions and the current milestone only.
- **Do** keep brick red for safety, destructive actions, and errors only.
- **Do** pair every status with its icon and word.
- **Do** put every checklist and document row on the one five-column label grid with a 13px muted head row.
- **Do** separate sections with a single hairline and a ground change (canvas to white), padded 96 to 128px.
- **Do** use white hairline panels (18px) only for things people act on or read closely.
- **Do** keep the safety link reachable from every public view.
- **Do** honour reduced motion: the water holds one still frame and reveals stop.

### Don't:
- **Don't** add box-shadows to cards, panels, or menus; lift with ground and hairline instead.
- **Don't** use gradients outside the caustic layer and its fallback wash.
- **Don't** put the caustic layer behind workspace or staff screens.
- **Don't** add uppercase eyebrows or tracked labels above headings.
- **Don't** colour status words or render status as coloured pills.
- **Don't** introduce a second typeface or a second accent colour.
- **Don't** use stock family photography, a navy header bar, or a row of three feature cards.
