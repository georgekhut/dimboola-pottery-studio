

// ═══════════════════════════════════════
// GLAZE SHEET — print-before-class, handwrite-after-class
// ═══════════════════════════════════════
// One row per client; name column on the left, then 4+ pot cells each holding an
// Item line and a Glaze line. Anything already stored in the app is printed in the
// cell; otherwise the line is left blank for handwriting. A4 landscape for up to
// 4 clients, A3 landscape beyond that (12 clients per A3 page; more spill onto
// further pages). Hairline rules only, no fills, to keep ink use low.
function printGlazeSheet() {
  if (!students.length) { toast('Add students first'); return; }

  const big      = students.length > 4;
  const paper    = big ? 'A3' : 'A4';
  const perPage  = big ? 12 : 4;
  const pageH    = big ? 277 : 190;               // mm of usable height (297/210 minus 10mm margins)
  const maxPots  = students.reduce((m, s) => Math.max(m, s.pots.length), 0);
  const cols     = Math.min(6, Math.max(4, maxPots));
  const classInfo = cn();
  const dateInfo  = dateLong();
  const timeInfo  = document.getElementById('classTime').value || '';

  const pages = [];
  for (let i = 0; i < students.length; i += perPage) pages.push(students.slice(i, i + perPage));

  const pagesHtml = pages.map((chunk, pi) => {
    const rows = chunk.map(s => {
      let cells = '';
      for (let i = 0; i < cols; i++) {
        const p = s.pots[i] || {};
        cells += `<div class="cell"><span class="pn">${i + 1}</span>
          <div class="ln"><div class="hd"><b>Item</b><i class="clay">Buff / White</i></div><span class="v">${e(p.description || '')}</span></div>
          <div class="ln"><div class="hd"><b>Glaze</b></div><span class="v">${e(p.glaze || '')}</span></div></div>`;
      }
      return `<div class="row"><div class="who">${e(fullName(s) || '(no name)')}</div>${cells}</div>`;
    }).join('');
    return `<div class="sheet${pi < pages.length - 1 ? ' brk' : ''}">
      <div class="eyebrow">${e(sn())} — Glaze sheet${pages.length > 1 ? ` · page ${pi + 1} of ${pages.length}` : ''}</div>
      <div class="head"><div class="title">${e(classInfo)}${dateInfo ? ' — ' + e(dateInfo) : ''}</div>${timeInfo ? `<div class="meta">${e(timeInfo)}</div>` : ''}</div>
      <div class="rule"></div>
      <div class="grid">${rows}</div>
      <div class="foot">Write items and glazes after class, then enter them in the app (Pots &amp; Glazes tab)</div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Glaze Sheet — ${e(classInfo)}</title>
<style>
  ${embeddedFontCSS()}
  @page { size: ${paper} landscape; margin: 10mm 30mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Mono', 'Courier New', monospace; color: #1A1410; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { height: ${pageH}mm; display: flex; flex-direction: column; overflow: hidden; }
  .sheet.brk { page-break-after: always; }
  .eyebrow { font-size: 6.5pt; letter-spacing: 0.22em; text-transform: uppercase; color: #444; }
  .head { display: flex; justify-content: flex-start; align-items: baseline; gap: 6mm; margin: 1mm 0 2mm; }
  .title { font-family: 'Petrona', Georgia, serif; font-size: 20pt; line-height: 1; }
  .meta { font-size: 9pt; }
  .rule { height: 0.3mm; background: #1A1410; }
  .grid { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  .row { display: grid; grid-template-columns: 68mm repeat(${cols}, minmax(0, 1fr)); flex: 1 1 0; max-height: 42mm; border-bottom: 0.2mm solid #777; }
  .who { font-family: 'Petrona', Georgia, serif; font-size: 14pt; padding: 2mm 2mm 0 0; line-height: 1.1; }
  .cell { position: relative; border-left: 0.2mm solid #777; padding: 1.5mm 3mm 1mm 7mm; display: flex; flex-direction: column; }
  .pn { position: absolute; left: 1.8mm; top: 1.2mm; font-size: 7pt; color: #444; }
  /* Heading on its own line, writing space underneath (no rules). */
  .ln { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }
  .hd { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 0.8mm; }
  .ln b { font-weight: 400; font-size: 6pt; letter-spacing: 0.14em; text-transform: uppercase; color: #444; }
  /* Clay body to circle or underline by hand — printed plain; the app's default clay is not a decision. */
  .clay { font-style: normal; font-size: 6.5pt; letter-spacing: 0.1em; text-transform: uppercase; color: #1A1410; }
  .v { font-size: 9pt; line-height: 1.15; max-height: 2.3em; overflow: hidden; overflow-wrap: anywhere; }
  .foot { font-size: 6pt; color: #444; margin-top: 1.5mm; letter-spacing: 0.08em; }
</style>
</head>
<body>
${pagesHtml}
<script>
document.fonts.ready.then(function() {
  requestAnimationFrame(function() { window.print(); window.close(); });
});
<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) { toast('Allow popups to print the glaze sheet'); return; }
  w.document.write(html);
  w.document.close();
  toast(`Opening ${paper} landscape glaze sheet…`);
}