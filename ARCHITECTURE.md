# Workshop Manager: architecture map

Single-file HTML app (runs from `file://` and GitHub Pages) for Dimboola Pottery class rolls, pots and glazes, and print output. **Edit `src/`, then run `python3 build.py` to regenerate `index.html`.** Never hand-edit `index.html`; commit `src/` and the rebuilt `index.html` together (GitHub Pages serves `index.html`).

Read `thermal-label-design-guide.md` before touching label output, and `docs/` for the Zoho/Acuity flows and print system.

## Layout

| Path | What it holds |
| --- | --- |
| `src/shell/head.html` | `<head>` start: meta, title |
| `src/fonts.css` | `@font-face` rules with `{{font:NAME.woff2}}` placeholders |
| `fonts/*.woff2` | Petrona 300/400/500 (+ italics), DM Mono 400/500 |
| `src/shell/vendor.html` | SheetJS `<script>` (loaded from cdnjs, not embedded) |
| `src/styles.css` | All app CSS |
| `src/shell/body.html` | All page HTML: four tabs, import boxes, toast |
| `src/js/NN-*.js` | App JavaScript, joined in filename order (see below) |
| `src/shell/tail.html` | Closing tags |
| `build.py` | Stitches everything into one `index.html`, embedding fonts as base64 |

## JS modules (one shared global scope, no imports)

| File | Functions / purpose |
| --- | --- |
| `01-constants-state-tabs` | `CLAY`, `GLAZES`, `GLAZE_RENAMES`, state, init, `switchTab` |
| `02-class-and-students` | `syncInfo`, `addStudent`, `removeStudent`, `setField`, `addPot`, `removePot`, `setPot` |
| `03-render-setup-roll` | `renderAll`, `renderSetup` (student cards), `renderRoll` |
| `04-render-pots-tab` | Pots and Glazes tab: `renderPotsTab`, grid and list views |
| `05-import-outlook-acuity` | Paste import: `importOutlook`, `splitBlocks`, `parseBlock`, `importNames` |
| `06-nametags-and-pot-labels` | `genNameTags`, `genPotLabels`, `printPotLabels` (62x45mm), `printNameTags` (100x62mm) |
| `07-glaze-sheet` | `printGlazeSheet` (print before class, handwrite after) |
| `08-kiln-crate-checklist` | `printCrateChecklist` |
| `09-excel-export` | `exportExcel`, `restoreFromExcel`, `exportHTML` |
| `10-client-jobs-import` | Client Jobs Excel importer (`cji*`) |
| `11-utilities` | `updateSum`, `clearAll`, `hideSection`, `toast` |

## Rules that keep it working

- The fonts block must keep `id="embeddedFonts"`: `embeddedFontCSS()` copies it into print popups.
- Print popups are HTML strings inside the JS (modules 06 to 08). Their markup contains escaped `<\/script>` tags; keep the escaping.
- Fonts, thermal-label CSS and `file://` quirks: see `thermal-label-design-guide.md`.
- Use fake sample data only (for example Jane Sample, 0400 123 456). The repo is public.
- To add a module, create `src/js/NN-name.js`; build order is alphabetical.
