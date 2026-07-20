# Print System Reference — Dimboola Pottery Workshop Manager
### How `pottery-studio.html` generates and styles each of its three print outputs
### Companion to `thermal-label-design-guide.md` (that file covers physical thermal-printer constraints; this one covers the app's own architecture — which code to touch, and how the three print outputs differ from each other)

---

## 0. The three print outputs, at a glance

| Output | Button | Trigger | Printer target |
|---|---|---|---|
| Class Roll (attendance list) | "🖨 Print Roll" | `window.print()` directly on the main app page | A4, normal printer |
| Name Tags | "🖨 Print Name Tags" | `window.print()` directly on the main app page | 62mm DK thermal roll |
| Pot Labels | "🖨 Print Labels" | `printPotLabels()` — opens a **popup** with its own complete HTML document | 62mm DK thermal roll |
| Kiln & Crate Checklist | "🖨 Print Crate Checklist" | `printCrateChecklist()` — opens a **popup** with its own complete HTML document | A4, normal printer |

There are only **two underlying mechanisms**, not four — see §1. Knowing which one a given output uses tells you exactly which CSS to edit, and which CSS to *ignore* because it only affects an on-screen preview.

---

## 1. Two distinct print architectures in this file

### A. In-page `@media print` (Class Roll, Name Tags)
`window.print()` is called directly on the live app document. What actually ends up on paper is controlled by the single `@media print { ... }` block near the top of the file (inside the main `<style>`, around line 169). That block:
- hides `header`, `.tab-bar`, `.panel`, `.bottom-bar`, `.export-panel` everywhere in the document (not scoped to the active tab)
- forces every `.tab-pane` and `.preview-section` to `display: block !important`, regardless of which tab is active or whether a preview has been generated

**Implication:** the on-screen classes (`.roll-table`, `.nametag`, `.nt-*`) *are* the print styling here — there is no separate print-only markup to author. If you want to change how a name tag or the roll table looks on paper, edit those classes and/or the `@media print` block directly in the main stylesheet.

### B. Self-contained popup document (Pot Labels, Crate Checklist)
`printPotLabels()` and `printCrateChecklist()` each build a **complete, separate HTML document** as a JS template string — its own `<head>`, its own `<style>` with its own `@page`, its own Google Fonts `<link>` — and write it into a blown-open popup window (`window.open('', '_blank', ...)`), then:
```js
document.fonts.ready.then(() => {
  requestAnimationFrame(() => { window.print(); window.close(); });
});
```
waiting for web fonts to load before printing (critical for `fitNames()` canvas measurement in the pot label doc, and for `Petrona`/`Georgia` headers generally) and closing the popup immediately after.

**Implication:** the on-screen preview classes (`.pot-label` in the main stylesheet, shown when you click "Generate Pot Labels ▸") are **cosmetically similar but functionally disconnected** from what actually prints. They exist only so the user can eyeball roughly what's coming before printing. **To change actual pot-label print output, edit the `<style>` block inside the `printPotLabels()` template string — editing `.pot-label` in the main stylesheet does nothing to the printed result.** The Crate Checklist has no on-screen preview at all; it goes straight from button click to popup.

### Decision rule when asked to change print text/layout
1. Is it the Pot Labels or Crate Checklist? → edit the `<style>` inside `printPotLabels()` / `printCrateChecklist()` (in the `<script>` section of `pottery-studio.html`).
2. Is it the Class Roll or Name Tags? → edit the relevant classes in the main `<style>` block and/or the `@media print` rules there. There is no popup to look for.

---

## 2. Class Roll print bug — fixed 2026-07-20

The Class Roll table (`#rollWrap`) lives inside a `.panel` div in the `tab-roll` pane. The old `@media print` rule hid `.panel` **unconditionally, everywhere in the document** — not scoped to "panels outside the roll." So clicking **"🖨 Print Roll"** used to hide the roll table itself along with everything else wrapped in a `.panel`. What printed instead was whichever `.preview-section` happened to be populated (Name Tag or Pot Label preview), because those were forced `display: block !important` regardless of tab or `.visible` state. There was also a leftover, never-applied CSS rule (`.roll-only-print .tab-pane:not(#tab-roll) {...}`) that looked like an abandoned attempt at the same fix — no JS ever added that class.

**Fix applied:** rather than a JS-toggled body/print-mode class (which would silently break printing via a plain Cmd/Ctrl+P — the Name Tag preview's own help text explicitly documents that shortcut as supported), the print CSS now derives which content to show from state that's already on the DOM:
- The generic `.tab-pane { display: block !important; }` override was removed — the pre-existing screen rule (`.tab-pane{display:none} / .tab-pane.active{display:block}`) already restricts rendering to whichever tab is active, so print now naturally follows it instead of forcing all four tabs to render.
- `.panel` stays hidden by the generic print rule, but `#tab-roll:not(:has(#nameTagSection.visible)) .panel { display: block !important; }` re-shows the roll table specifically — *unless* the Name Tag preview is the thing currently on screen, in which case the roll stays hidden and `#nameTagSection.visible { display: block !important; }` shows the name tags instead.
- The roll-header's button row got a `.roll-actions` class so it can be hidden in print (`#tab-roll:not(:has(#nameTagSection.visible)) .roll-actions { display: none !important; }`) without hiding the rest of the panel.

This means "Print Roll", the "🖨 Print Name Tags" button, and a bare Cmd/Ctrl+P from the Class Roll tab all now resolve to the correct content, driven purely by whether `#nameTagSection` currently has `.visible` (i.e. whether `genNameTags()` has been run and not yet dismissed via "Hide"). No new JS print-trigger functions were introduced — `window.print()` is still called directly from both buttons, exactly as before.

**Verified** by temporarily flipping the `@media print` rule to `@media all` in a live browser session (Chrome via `localhost`, not `file://`) and screenshotting: Roll-only, Name-Tags-only (after `genNameTags()`), and back to Roll-only (after `hideSection('nameTagSection')`) all rendered the correct, exclusive content.

---

## 3. Shared text-formatting helpers (used across all print outputs)

| Helper | Returns | Use for |
|---|---|---|
| `e(str)` | HTML-escaped string | **Always** wrap any user-entered value (name, description, note, etc.) before interpolating into a template string — prevents broken markup/XSS from a client typing `<` or `&` into a field. |
| `fullName(s)` | `"First Last"` | Client name on labels, tags, roll, checklist |
| `sn()` | Studio name, defaults to "Dimboola Pottery Classes" | Studio line on labels/tags |
| `cn()` | Class name, defaults to "Pottery Class" | Class line on labels/tags/checklist |
| `dateLong()` | e.g. `"Saturday, 13 June 2026"` | Full-width contexts with room to spare (checklist header, roll meta) |
| `dateShort()` | e.g. `"13 June 2026"` | Name tags, on-screen pot label preview — width isn't tightly constrained |
| `dateCompact()` | `"13/06/2026"`, always 10 chars | A single-line constrained column |
| `dateSplit()` | `{ line1: "13/06", line2: "2026" }`, always 5 + 4 chars | A *very* narrow column stacked over two lines — this is what the pot-label grid-frame date column uses (see `thermal-label-design-guide.md` §6 for why fixed-width matters there) |

**Rule of thumb:** the more constrained the column, the more fixed-width the date/name formatter needs to be. Don't reach for `toLocaleDateString` directly inside a new print template if the value sits in anything narrower than a full-width line — use `dateCompact()` or `dateSplit()`, or extend this table with a new fixed-width helper rather than inlining a fresh formatter.

---

## 4. Typography & colour conventions by print medium

These two mediums in this app have **opposite rules** for CSS borders — don't cross-apply them.

### 62mm DK thermal roll (Name Tags, Pot Labels)
Full detail in `thermal-label-design-guide.md`. Summary:
- **No CSS `border` properties** — they render dashed on the thermal head. Use filled `<div>` rules instead.
- Monospace (`DM Mono`) for all body text; a single serif hero element (client name) is the one confirmed exception, 18pt+, weight 500.
- Font weights: `400` default, `500` for the one hero element only. Never `600`/`700`.
- Text colour `#1A1410` (warm near-black), never pure `#000`.
- No large solid black fills.

### A4 (Class Roll, Crate Checklist)
This is a normal inkjet/laser printer, not the thermal head — the thermal constraints above **do not apply** here:
- Standard CSS `border`/`border-bottom` etc. are used freely and render fine (see `.summary-box`, `.pot-table thead th`, `.student-card` in `printCrateChecklist()`).
- Headings use `Georgia, serif` (e.g. `.ph-title` at 26pt, `.sc-name` at 13pt); body/data uses `'DM Mono', 'Courier New', monospace` at a 9pt baseline, dropping to 7–7.5pt for dense table cells.
- Colour palette is greyscale, not the thermal near-black: `#000` for primary text/headings, `#222`/`#444` secondary, `#666` labels/eyebrows, `#888`/`#CCC` rules and borders, `#D0D0D0`/`#E8E8E8`/`#F2F2F2` for header bands and zebra-striped rows.
- Crate Checklist margins are asymmetric — `14mm 10mm 12mm 22mm` (top/right/bottom/left) — the wide 22mm left margin is deliberate, for hole-punch filing. Preserve that asymmetry if the page layout changes.
- `page-break-inside: avoid` on `.student-card` keeps one client's pot table from splitting across a page boundary.

---

## 5. Checklist for changing how any print output displays text

- [ ] Identify which of the two architectures (§1) the output uses, so you edit the right `<style>` block — don't edit `.pot-label` in the main stylesheet expecting it to affect the printed pot label.
- [ ] If touching the thermal roll (Name Tags, Pot Labels): re-check every item in `thermal-label-design-guide.md` §9's checklist — border-as-filled-div, weight caps, rule join technique, `max-height` backstop on any clamped text, fixed-width dates.
- [ ] If touching A4 output (Class Roll, Crate Checklist): CSS borders are fine; keep the Georgia-headings / DM-Mono-body split and the existing 22mm hole-punch left margin unless asked to change it.
- [ ] Any new or changed date/name field: reuse or extend the helpers in §3 rather than inlining a new `toLocaleDateString` call, especially inside a constrained column.
- [ ] Escape every interpolated user value with `e()`.
- [ ] For popup-based outputs, keep the `document.fonts.ready` → `requestAnimationFrame` → `window.print()` → `window.close()` sequence — printing before web fonts load is what caused the original `fitNames()` mis-measurement issue during development.
- [ ] Test-print for real before calling a change done — see §0 to route to the correct trigger button.
