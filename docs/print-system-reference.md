# Print System Reference — Dimboola Pottery Workshop Manager
### How `index.html` generates and styles each of its five print outputs
### Companion to `thermal-label-design-guide.md` (that file covers physical thermal-printer constraints; this one covers the app's own architecture — which code to touch, and how the print outputs differ from each other)

---

## 0. The five print outputs, at a glance

| Output | Button | Trigger | Printer target |
|---|---|---|---|
| Class Roll (attendance list) | "🖨 Print Roll" | `window.print()` directly on the main app page | A4, normal printer |
| Name Tags | "🖨 Print Name Tags" (in the preview section) | `printNameTags()` — opens a **popup** with its own complete HTML document | 62mm DK thermal roll |
| Pot Labels | "🖨 Print Labels" | `printPotLabels()` — opens a **popup** with its own complete HTML document | 62mm DK thermal roll |
| Carton Labels | "🖨 Print Carton Labels" (Pots & Glazes tab, panel 6) | `printCartonLabels()` — opens a **popup** with its own complete HTML document | 62mm DK thermal roll (100×62mm landscape) |
| Kiln & Crate Checklist | "🖨 Print Crate Checklist" | `printCrateChecklist()` — opens a **popup** with its own complete HTML document | A4, normal printer |
| Glaze Sheet (pre-class pots & glazes form) | "🖨 Print Glaze Sheet" (Pots & Glazes tab) | `printGlazeSheet()` — opens a **popup** with its own complete HTML document | A4 landscape (up to 4 clients) or A3 landscape (5–12 per page), normal printer |

There are only **two underlying mechanisms**, not five — see §1. Knowing which one a given output uses tells you exactly which CSS to edit, and which CSS to *ignore* because it only affects an on-screen preview.

**2026-07-20:** Name Tags moved from mechanism A to mechanism B, so the roll's proper 100×62mm landscape shape (thermal-label-design-guide.md §1) could be used instead of printing at A4 via the host page. The roll-header "🏷 Generate Name Tags ▸" button still only builds the on-screen preview grid (`genNameTags()`, mirroring "Generate Pot Labels ▸"); the actual print now happens via the dedicated button inside the preview section, which calls `printNameTags()`. An initial version of `printNameTags()` used a CSS `transform: rotate()` trick to fit the landscape label onto a portrait `@page`; that was replaced the same day after a real test print showed inconsistent alignment and overlapping text — see the `@page`/orientation note in §1 below.

**2026-11-12:** Label redesign, done in Affinity and ported into the app. Fonts are now **IBM Plex Mono SemiBold** (one weight, no italics) plus **Petrona Medium and Medium Italic** only, embedded as three base64 woff2 faces (sources and licences in `assets/fonts/`, CSS in `assets/fonts/fonts-embedded.css`) — DM Mono is gone. Pot label is now 62×29mm, the name tag is simplified, and a new Carton Label (100×62mm) was added. Every thermal label keeps at least 3mm clear on all four sides. Full specs in §7.

**2026-11-02:** Added the Glaze Sheet (§6) and a 30mm left/right page margin on it for lever-arch hole punching. The app file is now `index.html` (previously `pottery-studio.html`), served by GitHub Pages. Fonts (Petrona, DM Mono — since replaced, see 2026-11-12 above) are embedded as base64 in the page and reused in every print popup via `embeddedFontCSS()`, replacing the per-popup Google Fonts `<link>`; SheetJS is still loaded from a CDN.

---

## 1. Two distinct print architectures in this file

### A. In-page `@media print` (Class Roll only)
`window.print()` is called directly on the live app document. What actually ends up on paper is controlled by the single `@media print { ... }` block near the top of the file (inside the main `<style>`, around line 169). That block:
- hides `header`, `.tab-bar`, `.panel`, `.bottom-bar`, `.export-panel` everywhere in the document (not scoped to the active tab)
- re-shows `#tab-roll .panel` so the roll table (otherwise caught by the generic `.panel` hide) prints
- keeps `.preview-section` (both the Name Tag and Pot Label on-screen previews) hidden unconditionally — neither prints in-page any more

**Implication:** `.roll-table` *is* the print styling here — there is no separate print-only markup to author. If you want to change how the roll table looks on paper, edit that class and/or the `@media print` block directly in the main stylesheet.

### B. Self-contained popup document (Name Tags, Pot Labels, Carton Labels, Crate Checklist, Glaze Sheet)
`printNameTags()`, `printPotLabels()`, `printCartonLabels()`, `printCrateChecklist()`, and `printGlazeSheet()` each build a **complete, separate HTML document** as a JS template string — its own `<head>`, its own `<style>` with its own `@page`, its own embedded font CSS (`embeddedFontCSS()`) — and write it into a blown-open popup window (`window.open('', '_blank', ...)`), then:
```js
document.fonts.ready.then(() => {
  requestAnimationFrame(() => { window.print(); window.close(); });
});
```
waiting for web fonts to load before printing (critical for the canvas-measurement `fitNames()` in both the name tag and pot label docs, and for `Cormorant Garamond`/`Petrona`/`Georgia` headers generally) and closing the popup immediately after.

**Implication:** the on-screen preview classes (`.nametag`/`.nt-*` and `.pot-label` in the main stylesheet, shown by "Generate Name Tags ▸" / "Generate Pot Labels ▸") are **cosmetically similar but functionally disconnected** from what actually prints. They exist only so the user can eyeball roughly what's coming before printing. **To change actual name-tag or pot-label print output, edit the `<style>` block inside `printNameTags()` / `printPotLabels()` — editing `.nametag`/`.pot-label` in the main stylesheet does nothing to the printed result.** The Crate Checklist has no on-screen preview at all; it goes straight from button click to popup.

**Landscape content wider than the roll (Name Tags):** `printNameTags()`'s `@page` is declared directly in the label's own natural shape (`100mm 62mm`) with no CSS rotation of any kind — content is a plain top-to-bottom flex layout, same structure as `printPotLabels()`'s compact design. Getting it onto the physically-62mm-wide roll is a print-dialog job, not a CSS one: the printing instructions (in the Name Tag preview section, and the toast/help text) tell the user to select **Landscape** orientation in the system print dialog. See thermal-label-design-guide.md §1 for why a `transform: rotate()` CSS wrapper was tried first and abandoned — it doesn't survive Chrome's print pipeline reliably.

### Decision rule when asked to change print text/layout
1. Is it Name Tags, Pot Labels, Carton Labels, the Crate Checklist, or the Glaze Sheet? → edit the `<style>` inside `printNameTags()` / `printPotLabels()` / `printCartonLabels()` / `printCrateChecklist()` / `printGlazeSheet()` (in the `<script>` section of `index.html`).
2. Is it the Class Roll? → edit the relevant classes in the main `<style>` block and/or the `@media print` rules there. There is no popup to look for.

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
| `shortName(s)` | `"Priya S."` (first name + last initial; just the first name if there is no surname) | Name tag |
| `dateLabel()` | `"31 October, 2026"` from `#classDate` | Pot label, name tag, carton label |
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

### 62mm DK thermal roll (Name Tags, Pot Labels, Carton Labels)
Full detail in `thermal-label-design-guide.md`. Summary:
- **No CSS `border` properties** — they render dashed on the thermal head. Use filled `<div>` rules instead (the current labels need no rules at all).
- Fonts: IBM Plex Mono SemiBold for the label text, Petrona Medium for the name tag, Petrona Medium Italic for the pot description. Only these faces are embedded, so any `font-weight` in a label's CSS resolves to the one embedded face.
- **Weight caution:** SemiBold is 600, which the earlier test prints suggested could blur on the thermal head. It was chosen deliberately and still needs a physical test print; raise the printer density rather than the weight if text looks light.
- Text colour `#000`, no fills.
- **Minimum 3mm clear on all four sides** of every thermal label (measured on the printed ink, not just the text box). See §7.
- No large solid black fills.

### A4 / A3 (Class Roll, Crate Checklist, Glaze Sheet)
This is a normal inkjet/laser printer, not the thermal head — the thermal constraints above **do not apply** here:
- Standard CSS `border`/`border-bottom` etc. are used freely and render fine (see `.summary-box`, `.pot-table thead th`, `.student-card` in `printCrateChecklist()`).
- Headings use `'Petrona', Georgia, serif` (e.g. `.ph-title` at 26pt, `.sc-name` at 13pt) — Petrona is now the one serif face used app-wide (screen UI, all print/export outputs), embedded in the page as base64 and injected into each popup's `<head>` via `embeddedFontCSS()`; body/data uses `'IBM Plex Mono', 'Courier New', monospace` at a 9pt baseline, dropping to 7–7.5pt for dense table cells.
- Colour palette is greyscale, not the thermal near-black: `#000` for primary text/headings, `#222`/`#444` secondary, `#666` labels/eyebrows, `#888`/`#CCC` rules and borders, `#D0D0D0`/`#E8E8E8`/`#F2F2F2` for header bands and zebra-striped rows.
- Crate Checklist margins are asymmetric — `14mm 10mm 12mm 22mm` (top/right/bottom/left) — the wide 22mm left margin is deliberate, for hole-punch filing. Preserve that asymmetry if the page layout changes.
- Glaze Sheet margins are `10mm 30mm` (top/bottom, left/right) — the 30mm side margins leave room for lever-arch punch holes on both edges, so the sheet can be filed either way up. Usable area is therefore 237 × 190mm (A4 landscape) or 360 × 277mm (A3 landscape).
- `page-break-inside: avoid` on `.student-card` keeps one client's pot table from splitting across a page boundary.

---

## 5. Checklist for changing how any print output displays text

- [ ] Identify which of the two architectures (§1) the output uses, so you edit the right `<style>` block — don't edit `.pot-label` in the main stylesheet expecting it to affect the printed pot label.
- [ ] If touching the thermal roll (Name Tags, Pot Labels, Carton Labels): re-check `thermal-label-design-guide.md` §9 and re-measure the 3mm minimum margin on all four sides with worst-case text (long name, long description plus note, letters with descenders) — §7 below.
- [ ] If touching A4/A3 output (Class Roll, Crate Checklist, Glaze Sheet): CSS borders are fine; keep the Petrona-headings / Plex-Mono-body split, the Crate Checklist's 22mm hole-punch left margin, and the Glaze Sheet's 30mm left/right margins unless asked to change them.
- [ ] Any new or changed date/name field: reuse or extend the helpers in §3 rather than inlining a new `toLocaleDateString` call, especially inside a constrained column.
- [ ] Escape every interpolated user value with `e()`.
- [ ] For popup-based outputs, keep the `document.fonts.ready` → `requestAnimationFrame` → `window.print()` → `window.close()` sequence — printing before web fonts load is what caused the original `fitNames()` mis-measurement issue during development.
- [ ] Test-print for real before calling a change done — see §0 to route to the correct trigger button.

---

## 6. Glaze Sheet (`printGlazeSheet()`)

A pre-class form, printed before each class so glaze choices can be handwritten during the workshop and keyed into the Pots & Glazes tab afterwards. It is designed to use as little ink as possible.

- **Paper:** `students.length > 4` → A3 landscape, 12 clients per page; otherwise A4 landscape, 4 per page. `@page { size: A4|A3 landscape; margin: 10mm 30mm; }` — vertical usable height is 190mm / 277mm (`pageH` in the code), and `.sheet` is fixed to that height with `overflow:hidden`. More clients than fit → multiple `.sheet` pages.
- **Heading:** left-aligned `Class name — Date` in the same large serif size, with the time in the smaller mono size beside it.
- **Rows:** one row per client — a 68mm name column, then 4–6 pot columns (`cols = min(6, max(4, most pots on any client))`, so there is always at least one spare cell for an extra pot). `grid-template-columns: 68mm repeat(cols, minmax(0,1fr))`; `minmax(0,…)` keeps columns equal even with a long legacy glaze name. Rows are `flex:1 1 0; max-height:42mm`.
- **Pot cell:** numbered, with an `ITEM` heading (plus a `Buff / White` clay label to circle or underline) and a `GLAZE` heading; saved item/glaze values print beneath the headings, otherwise the space is blank for handwriting. Values use `.v` (9pt, wrapped, clamped to ~2 lines). Notes are deliberately not printed. No dotted rules.
- **Data source:** `students[].pots[]` = `{description, clay, glaze}`. Edited in the Pots & Glazes tab — Grid view (default; one card per client, `+ pot` adds a pot) or List view, switched with the Grid/List toggle (`setPotsView`).
- **Printing it:** an A3 sheet sent to an A4-only printer is shrunk by the browser's "fit to page"; choose an A3 printer/paper size and scale 100% for true size.

---

## 7. Thermal label specs (as built, 12 Nov 2026)

All three are designed in Affinity (300 dpi, 11.81 px/mm), then ported as absolutely positioned mm values. Each popup has its own `@page` (margin 0), embeds the fonts via `embeddedFontCSS()`, and runs `document.fonts.ready` → `requestAnimationFrame` → `window.print()` → `window.close()`. A fit script shrinks text to a floor size and then truncates with an ellipsis, so nothing can run off the label.

**Margin rule: at least 3mm clear of ink on all four sides, on every thermal label.** Checked by rendering each popup in Playwright at 8x with worst-case content and measuring the ink bounding box. Latest measurements: pot label 3.2mm minimum, name tag 4.8mm, carton label 6.2mm.

### Pot label — `printPotLabels()` — 62 × 29mm, one per pot
| Field | Font | Position (mm) | Notes |
|---|---|---|---|
| Name | Plex SemiBold 12pt | left 3.3, top 2.6 | fits down to 7pt, then ellipsis; max width 55.4 |
| Class | Plex SemiBold 8pt | left 3.3, top 7.35 | fits down to 5.5pt |
| Description | Petrona Medium Italic 8pt | left 3.3, top 13.05, 55.4 wide, max-height 9 | `"<description>, <clay> clay, <glaze> glaze. <pot note>."`; shrinks to 7pt, then the description is shortened with an ellipsis (clay, glaze and note kept — the note is cut last), then a line clamp |
| Date | Plex SemiBold 8pt | left 3.3, top 22.5 | "31 October, 2026" |
| Item | Plex SemiBold 8pt | right 3.3, top 22.5 | "Item 1 of 4" / "Single item" |

No SHIP field or marker on this label. Text frames are 55.4mm wide (3.3mm side inset).

### Name tag — `printNameTags()` — 100 × 62mm landscape, one per client
Centred, Petrona Medium. Name = `shortName(s)` 44pt (fits down to 10pt) at top 20mm, class 12pt (down to 8pt) at top 48.42mm, date 10pt at top 53.81mm. Name frame left 4.19mm, 91.63 wide; class and date frames left 6mm, 88 wide.

### Carton / bag label — `printCartonLabels()` — 100 × 62mm landscape, one per carton
| Field | Font | Position (mm) |
|---|---|---|
| Class | Plex SemiBold 12pt (fits down to 8pt) | left 6, top 5.48, 88 wide |
| Date | Plex SemiBold 12pt | left 6, top 12 |
| SHIP | Plex SemiBold 10pt, right-aligned | right 6, top 6 — printed only when the client's Ship box is ticked |
| Full name | Plex SemiBold 28pt, fits down to 12pt, then ellipsis | left 6, top 22.64, 88 wide |
| Carton | Plex SemiBold 12pt | left 6, top 50 — "Carton 2 of 2" |
| Items | Plex SemiBold 12pt, right-aligned | right 6, top 50 — "4 items", the total across all cartons |

Data and UI: panel **6 Carton Labels** (Pots & Glazes tab) lists each client who has pots, with a Cartons number (default 1, stored as `students[i].cartons`) and a Ship checkbox (`students[i].ship`). `renderCartonList()` rebuilds the list and runs from `renderAll()`. Neither value is persisted between sessions yet. One label prints per carton (`Carton c of n`).

Print dialog for both 100×62mm labels: Landscape, margins None, scale 100.
