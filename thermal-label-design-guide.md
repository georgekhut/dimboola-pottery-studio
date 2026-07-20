# Thermal Label Design Guide
## Brother QL-820NWB · 62mm DK Continuous Roll
### Lessons learned through iterative test printing — Dimboola Pottery Classes, June–July 2026

---

## 1. Page Size & Orientation

**For a 62mm roll, Chrome sees two valid label sizes:**

| Chrome label | Physical meaning | Use when |
|---|---|---|
| `62 × 100 mm` | Portrait — 62mm wide, 100mm tall | Tall label, feeds lengthways |
| `100 × 62 mm` | **Landscape — 100mm wide, 62mm tall** | Wider card format, needs the rotation trick below |

**The winning `@page` rule for a landscape label taller than the roll's own cross-web width:**
```css
@page { size: 100mm 62mm; margin: 1.5mm; }
```

**Critical:** inject this `@page` rule *inside the label's own `<style>` block* — do not rely on the host page's print CSS. When printing from a web app, the host page may set `@page { size: A4 }` which overrides label sizes. Self-contained styles win.

**No rotation needed for compact labels.** If the label's length (feed direction) is *shorter* than the 62mm roll width — e.g. a 62mm × 45mm label — it's already landscape-shaped without any rotation trick:
```css
@page { size: 62mm 45mm; margin: 0; }
```
The rotation/`.rotated { transform: rotate(-90deg) }` container is only needed when the label is *longer* than 62mm and you want it to read landscape (as in the original 100×62mm design below).

**Print dialog settings (Chrome):**
- Paper size: select the matching physical size (see §8 for how to add sizes that aren't in Chrome's default list)
- Margins: Minimum / None
- Scale: 100
- Headers and footers: **unchecked**
- Background graphics: checked

---

## 2. Font Choices

### Use a monospace sans-serif for body text — serif is fine for a large, isolated hero element
Serif fonts (e.g. Garamond, Times) have hairline thin strokes that thermal dot matrices cannot resolve cleanly at small sizes — they wash out or fill in unpredictably. Monospace fonts have consistent, even stroke weights that print reliably, and remain the right default for anything at body-text size (7–12pt).

**Update, July 2026:** a serif face (Petrona, weight 500) was tested for a single large hero element — the client name, printed at 18–20pt — and reproduced cleanly with no wash-out. At that size the strokes are thick enough for the thermal head to resolve. The original "no serifs" rule holds for anything at body-text size; it does not need to apply to a single large (~18pt+) headline element. Test print before committing either way — this was a deliberate, confirmed exception, not a blanket reversal of the rule.

**Recommended:** `DM Mono`, `Courier New`, or any monospace system font for everything except a single large hero element, which may use a serif face if printed at 18pt or larger.

### Font weight hierarchy for thermal printing

| Element | Weight | Notes |
|---|---|---|
| Studio/header metadata | `400` | Small size, needs clean strokes |
| Section labels (DESCRIPTION, GLAZE) | `400` | Keep at small uppercase, slightly darker colour |
| Body text (description, glaze name) | `400` | Regular weight — bold fills in on thermal |
| Client name / primary identifier | `500` | Medium only — the single heavier element |
| **Never use** | `600`, `700` | Strokes merge and clog at thermal resolution |

**Rule of thumb:** Use `font-weight: 500` for *one* hierarchy level only (the most important element — the client name). Everything else at `400`.

---

## 3. Dividing Rules & Grid Lines

### The core problem
CSS `border` properties render as dashed or dotted lines on many thermal print engines — the dots between pixels get interpreted as gaps. This produces the broken/dashed rule effect.

### The solution: filled `<div>` elements
Replace every CSS border with a solid filled `<div>`:

```html
<!-- ❌ Don't use CSS borders -->
<div style="border-top: 1px solid black;"></div>

<!-- ✅ Use a filled div -->
<div class="rule"></div>
```

```css
/* Screen: 1px renders consistently across browsers */
.rule { height: 1px; width: 100%; background: #1A1410; flex-shrink: 0; }

/* Print: convert to physical mm units */
@media print {
  .rule { height: 0.5mm; }
}
```

### Vertical rules
The same principle applies — use a grid column of explicit width rather than a border:

```css
.label-body {
  display: grid;
  grid-template-columns: 1fr 1px 1fr; /* 1px on screen */
}
@media print {
  .label-body { grid-template-columns: 1fr 0.5mm 1fr; }
}

.vertical-rule { background: #1A1410; } /* no width/height needed — grid controls it */
```

### Rule weight consistency
All rules must be the same physical weight. Use a single shared class for all horizontal rules, and match the vertical rule to the same `mm` value via `@media print`.

- **0.5mm** is the sweet spot for the QL-820NWB — thick enough to print solid, thin enough not to dominate.
- **Lock rule thickness explicitly on every rule, not just vertical ones.** The original advice here only called out the vertical rule (`width: 0.5mm`), but the same issue showed up on horizontal rules sitting in a `grid-template-rows` track: relying on the grid track alone to size a `0.5mm` row rendered at a visibly different weight than a rule with `height: 0.5mm` set directly on the element. Set the explicit dimension on *every* rule element, in addition to whatever grid track it sits in:

```css
.frame-hrule-top, .frame-hrule-bottom {
  height: 0.5mm;   /* explicit — don't rely on the 0.5mm grid row alone */
  background: #1A1410;
}
.frame-vrule {
  width: 0.5mm;     /* explicit — don't rely on the 0.5mm grid column alone */
  background: #1A1410;
}
```

### Connecting rules (flex two-column layout)
For a vertical rule to connect cleanly with horizontal rules in a simple flex/block layout:
- The body container must have **no horizontal padding** — padding on the outer wrapper pushes the vertical rule away from the edges, leaving gaps.
- Apply padding **inside** the left and right column divs instead.

```html
<!-- ✅ Correct structure -->
<div class="label-body">           <!-- no padding here -->
  <div class="col-left">...</div>  <!-- padding: 1.5mm 2.5mm here -->
  <div class="vertical-rule"></div>
  <div class="col-right">...</div> <!-- padding: 1.5mm 2.5mm here -->
</div>
```

### Building a fully joined grid frame (rules that touch on all sides)
The two-column technique above still leaves a *gap* between the vertical rule and any horizontal rule above or below it, unless they're all part of the same flow with zero margin. For a genuine boxed frame — top rule, vertical divider, bottom rule, all physically touching, like a small table — build it as a single 3×3 CSS Grid instead of separate stacked elements:

```css
.frame {
  display: grid;
  grid-template-columns: 2fr 0.5mm 1fr;  /* left col / vrule / right col */
  grid-template-rows: 0.5mm auto 0.5mm;  /* top rule / content / bottom rule */
}
.frame-hrule-top, .frame-hrule-bottom {
  grid-column: 1 / 4;   /* span all three columns */
  height: 0.5mm;
  background: #1A1410;
}
.frame-hrule-top    { grid-row: 1; }
.frame-hrule-bottom { grid-row: 3; }
.frame-vrule {
  grid-row: 1 / 4;      /* span all three rows — this is what makes it touch both rules */
  grid-column: 2;
  width: 0.5mm;
  background: #1A1410;
}
.frame-col-left  { grid-row: 2; grid-column: 1; padding: 2mm 2mm 1.5mm 0; }
.frame-col-right { grid-row: 2; grid-column: 3; padding: 2mm 0 1.5mm 2mm; }
```

The key detail: the vertical rule spans `grid-row: 1 / 4` (all three rows), not just the middle content row. That's what makes it physically join the top and bottom horizontal rules instead of floating between them with a gap. Breathing room between a rule and the text below it lives in the content cell's own `padding`, not in a separate margin/gap element — this keeps the join intact no matter how much padding you add.

---

## 4. Colour & Contrast

### Avoid large solid black fill areas
The QL-820NWB is a direct thermal printer — large black fills consume a lot of heat and can cause:
- Blotchy, uneven coverage
- Paper curl from heat concentration
- Nearby text looking washed out in contrast

**Avoid:** white text on solid black header bands.
**Use instead:** black text on white, with a solid rule line as the separator.

```css
/* ❌ Avoid */
.header { background: black; color: white; }

/* ✅ Prefer */
.header { background: white; color: #1A1410; }
/* Then use a .rule div underneath */
```

### Colour values
For all black text and rules, use `#1A1410` (warm near-black) rather than pure `#000000`. Slightly softer, prints cleanly, avoids harsh contrast that can make lighter text nearby appear even more washed out.

### Secondary text colours
On a thermal printer, colours are irrelevant (it prints black only), but they affect *relative density*:
- `#888` or lighter → prints very faint, easily missed
- `#555` → reliable for secondary labels
- `#666` → good for supporting detail (clay body, diameter)

**Test rule:** if you wouldn't be happy reading it on a photocopy, it's too light.

---

## 5. Label Layout Structure

### Worked example A — landscape 100×62mm (rotated, June 2026)

```html
<div class="label-page">
  <!-- Header: metadata + item count -->
  <div class="lbl-band">
    <span class="lbl-studio">Studio Name</span>
    <span class="lbl-count">Item 1 of 3</span>
  </div>

  <!-- Rule 1 -->
  <div class="rule"></div>

  <!-- Primary identifier: client name -->
  <div class="lbl-name-row">
    <div class="lbl-name">Jane S</div>
  </div>

  <!-- Rule 2 -->
  <div class="rule"></div>

  <!-- Body: two-column grid, NO outer padding -->
  <div class="lbl-body">
    <div class="lbl-left">
      <!-- Description, clay, diameter -->
    </div>
    <div class="lbl-vRule"></div>
    <div class="lbl-right">
      <!-- Glaze -->
    </div>
  </div>

  <!-- Rule 3 -->
  <div class="rule"></div>

  <!-- Footer: class name + date -->
  <div class="lbl-footer">
    <span class="lbl-class">Plate & Platter</span>
    <span class="lbl-date">7 June 2026</span>
  </div>
</div>
```

| Zone | Content | Size | Weight |
|---|---|---|---|
| Header | Studio name · Item count | 7pt | 400 / 600 |
| ── rule ── | | 0.5mm | |
| Name | Client first name + last initial | 24pt | 500 |
| ── rule ── | | 0.5mm | |
| Body left | Section label / Description / Clay / Diameter | 7pt / 11pt / 8pt / 7pt | 400 |
| Body right | Section label / Glaze name | 7pt / 11pt | 400 |
| ── rule ── | | 0.5mm | |
| Footer | Class type · Date | 11pt | 400 |

### Worked example B — compact 62×45mm, no rotation (July 2026)

Built for a much shorter label (saves roll length) with six fields instead of the original's five, using the grid-join frame technique from §3:

```html
<div class="card">                                  <!-- padding: 3mm 4mm 4mm 4mm -->
  <div class="pl-studio">DIMBOOLA POTTERY CLASSES</div>   <!-- touches name below -->
  <div class="pl-name">Angie Wait</div>                    <!-- 1mm margin-bottom -->
  <div class="pl-frame">                                   <!-- joined grid frame, §3 -->
    <div class="pl-frame-hrule-top"></div>
    <div class="pl-class-col">Plate & Platter: Uniting Wimmera SPS Program</div>
    <div class="pl-frame-vrule"></div>
    <div class="pl-date-col">
      <div>11/06</div>
      <div>2026</div>
    </div>
    <div class="pl-frame-hrule-bottom"></div>
  </div>
  <div class="pl-desc">small oval · Buff Stoneware</div>
  <div class="pl-glaze">Glaze: Moon White (gloss, thick)</div>
  <div class="pl-count">Item 1 of 3</div>              <!-- margin-top: auto — pinned to bottom margin -->
</div>
```

| Line | Content | Size | Weight | Notes |
|---|---|---|---|---|
| 1 | Studio name | 6pt | 400 | All caps, tracked, touches line 2 |
| 2 | Client name | 20pt cap, auto-fit down to 8pt | 500, serif (Petrona) | Touches line 1 and the rule below |
| — | Rule (frame top) | 0.5mm | | |
| 3 | Class name (left, up to 2 lines, ellipsis on 2nd) + date (right, fixed 2 lines) | 7pt | 400 | Joined grid frame, §3; column split 4fr class : 1fr date |
| — | Rule (frame bottom) | 0.5mm | | |
| 4 | Description + clay | 7pt | 400 | |
| 5 | Glaze | 7pt | 400 | |
| 6 | Item count | 8pt | 400 | Right-aligned, `margin-top: auto` pins it to the bottom margin regardless of how tall lines 3–5 end up |

**Margins:** 3mm top, 4mm left/right, 4mm bottom — trimmed down from an initial 5mm top once the grid frame needed the room.

---

## 6. Multi-line Fields, Truncation & Fixed-Width Data

New section, July 2026 — covers problems that only show up once a label has fields that can vary a lot in length (a long class name, a locale-formatted date).

### `-webkit-line-clamp` is unreliable inside a CSS Grid item with an `auto` row
The standard multi-line-ellipsis technique —

```css
.el {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

— visually truncates the text with an ellipsis as expected, but when `.el` is a grid item and its row is sized `auto`, the row can still grow to fit the **unclamped** content. The result: the ellipsis shows correctly on line 2, but a 3rd line of text still renders, overflowing into whatever sits below it (in our case, bleeding into the rule underneath). Line-clamp alone is not enough of a guarantee inside Grid.

**Fix — pair it with an explicit `max-height` as a hard backstop:**

```css
.el {
  max-height: 9.7mm;   /* see formula below — must include padding */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
```

### `max-height` must include padding under `box-sizing: border-box`
If your stylesheet has a global `* { box-sizing: border-box; }` reset (recommended, and used throughout this project), `max-height` constrains the *whole box* — padding included — not just the text content. Forgetting this clips the text itself, not just the overflow.

**Correct formula:**

```
max-height = (line-height × font-size × number-of-lines × 0.3528mm/pt) + padding-top + padding-bottom
```

Worked example: 7pt text, `line-height: 1.25`, 2 lines, `padding: 2mm 2mm 1.5mm 0`:
```
(1.25 × 7 × 2 × 0.3528) + 2 + 1.5 = 6.17 + 3.5 = 9.67mm  →  round to 9.7mm
```
The first attempt at this used `6.2mm` (the text-only figure) and clipped line 2 in half — always add the padding back in.

### Fixed-width date formatting for predictable columns
`toLocaleDateString(..., {day:'numeric', month:'long', year:'numeric'})` produces strings anywhere from 10 characters ("1 May 2026") to 18 ("23 September 2026") depending on the month name — a swing that makes it impossible to reliably size a column around. For any date sitting in a constrained column (rather than a full-width line with room to spare), use a fixed-width numeric format instead:

```js
// Build directly from the <input type="date"> value (already zero-padded
// YYYY-MM-DD) rather than via toLocaleDateString, so it never drops a
// leading zero the way Intl's 'numeric' option can (e.g. "3/6/2026").
const dateSplit = () => {
  const v = document.getElementById('classDate').value;
  if (!v) return { line1: 'Date', line2: 'not set' };
  const [y, m, d] = v.split('-');
  return { line1: `${d}/${m}`, line2: y };  // DD/MM on line 1, YYYY on line 2
};
```

`DD/MM` + `YYYY` on two lines is always exactly 5 and 4 characters — a column can be sized to that with confidence, freeing width for whatever sits next to it.

---

## 7. Printer Hardware Settings

**Print density:** The QL-820NWB has a print density/darkness setting accessible via:
- Mac: Brother Printer Utility app → QL-820NWB → Print Quality
- Or: System Settings → Printers & Scanners → Options & Supplies

Increase density 1–2 notches to bring up lighter-weight text without blowing out bold elements. The default setting is conservative for general label use but underpowers fine text.

**One label per page:** Ensure `@page { size: <width>mm <height>mm }` is set, with `page-break-after: always` on each label div (except the last). This feeds one label per cut on the continuous roll.

**Diagnosing a blank physical print (preview looks correct):** if the print preview / PDF shows the label correctly but the paper that comes out of the printer is blank, this is a hardware issue, not a code issue — don't start editing CSS. Check, in order:
1. **Label loaded backwards.** Direct thermal paper has a heat-sensitive coated side; the print head only marks that side. Easy to get turned around when reloading a roll — this was the actual cause the one time we hit this.
2. **Print density set too low** (see above).
3. Roll not seated firmly enough for the head to make full contact, or the head needs a wipe.

---

## 8. Print Dialog & Custom Paper Sizes (macOS)

**Chrome's own print dialog cannot add custom paper sizes.** The dropdown it shows is a fixed list of the driver's preset sizes (Brother's standard DK die-cut label catalogue — 12×12mm, 29×62mm, 62×100mm, etc.), and there's no way to define a new one from there.

**To add a custom size:** click **"Print using system dialogue… (⌥⌘P)"** at the bottom of Chrome's print panel. This opens the native macOS print panel, which has a "Loaded Papers → 62mm Roll" submenu (or similar, depending on driver version) plus a **"Manage Custom Sizes…"** option at the bottom of the Paper Size list — that's where an arbitrary width × height can be defined.

**The driver snaps continuous-roll lengths to fixed increments, not arbitrary mm.** For the 62mm roll, the "62mm Roll" submenu offers discrete lengths roughly 4.33mm apart (e.g. `62 × 34.88mm`, `62 × 37.20mm`, `62 × 41.33mm`, `62 × 46.50mm`, `62 × 62.00mm`...) rather than the exact value typed into "Manage Custom Sizes." Design to the nearest available increment, or expect the driver to round your target height by up to ~2mm — build a little slack into the layout rather than assuming pixel-perfect mm.

---

## 9. Quick Checklist for New Label Designs

- [ ] `@page` size set correctly and injected in label's own `<style>` block
- [ ] Rotation container (`transform: rotate(-90deg)`) only used if the label is *longer* than the roll width — skip it for compact labels
- [ ] Monospace font used for body text; serif reserved for a single large (18pt+) hero element only, and test-printed to confirm
- [ ] Font weights: `500` for name only, `400` for everything else
- [ ] All rules are filled `<div>` elements — no CSS `border` properties
- [ ] Every rule has its thickness set **explicitly** (`height` on horizontal, `width` on vertical) — don't rely on a grid track's size alone
- [ ] If rules need to form a joined frame, build it as one grid (vertical rule spanning all rows) rather than separately-margined elements
- [ ] Any `-webkit-line-clamp` element also has an explicit `max-height` backstop, calculated *including* padding if `box-sizing: border-box` is set
- [ ] Any field with unpredictable width (e.g. locale-formatted dates) reformatted to a fixed-width representation if it sits in a constrained column
- [ ] No large solid black fill areas
- [ ] Secondary text at `#555` or darker
- [ ] `page-break-after: always` on each label
- [ ] Chrome print dialog: correct paper size selected (via system dialog + Manage Custom Sizes if not in Chrome's default list), headers/footers off, scale 100
- [ ] If a physical print comes out blank but the preview looks correct: check the label orientation and print density before touching any code
