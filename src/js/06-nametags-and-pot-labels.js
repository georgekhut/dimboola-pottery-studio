

// ════════════════════════════════════════
// NAME TAGS
// ════════════════════════════════════════
function genNameTags() {
  if(!students.length){toast('No students to make name tags for');return;}
  const grid=document.getElementById('nameTagGrid');
  grid.innerHTML='';
  students.forEach(s=>{
    const display=fullName(s)||'Unknown';
    const tag=document.createElement('div');
    tag.className='nametag';
    tag.innerHTML=`
      <div class="nt-studio">${e(sn())}</div>
      <div class="nt-name">${e(display)}</div>
      <div class="nt-class">${e(cn())} · ${e(dateShort())}</div>`;
    grid.appendChild(tag);
  });
  document.getElementById('nameTagSection').classList.add('visible');
  document.getElementById('nameTagSection').scrollIntoView({behavior:'smooth',block:'start'});
  toast(`${students.length} name tag${students.length!==1?'s':''} ready to print`);
}

// ════════════════════════════════════════
// POT LABELS
// ════════════════════════════════════════
function genPotLabels() {
  const tp=students.reduce((n,s)=>n+s.pots.length,0);
  if(!students.length){toast('Add students first');return;}
  if(!tp){toast('Add pot details in the Pots & Glazes tab first');return;}
  const grid=document.getElementById('potLabelGrid');
  grid.innerHTML='';
  students.forEach(s=>{
    const total=s.pots.length;
    s.pots.forEach((p,idx)=>{
      const label=document.createElement('div');
      label.className='pot-label';
      const item=total>1?`Item ${idx+1} of ${total}`:'Single item';
      label.innerHTML=`
        <div>
          <div class="pl-studio">${e(sn())}</div>
          <div class="pl-name">${e(fullName(s)||'Unknown')}</div>
          <div class="pl-class">${e(cn())}</div>
        </div>
        <div class="pl-div"></div>
        <div>
          <div class="pl-desc">${e(p.description||'Pot — no description')}</div>
          <div class="pl-clay">${e(p.clay)}</div>
          <div class="pl-glaze">Glaze: ${e(p.glaze||'Not specified')}</div>
        </div>
        <div class="pl-footer">
          <div class="pl-date">${e(dateShort())}</div>
          <div class="pl-count">${e(item)}</div>
        </div>`;
      grid.appendChild(label);
    });
  });
  document.getElementById('potLabelSection').classList.add('visible');
  document.getElementById('potLabelSection').scrollIntoView({behavior:'smooth',block:'start'});
  toast(`${tp} pot label${tp!==1?'s':''} generated`);
}

// ════════════════════════════════════════
// PRINT POT LABELS — popup · Brother QL-820NWB · 62×45mm
// ════════════════════════════════════════
function printPotLabels() {
  const tp = students.reduce((n,s) => n + s.pots.length, 0);
  if (!students.length) { toast('Add students first'); return; }
  if (!tp) { toast('Add pot details in the Pots & Glazes tab first'); return; }

  /*
   * @page: 62mm × 45mm landscape (62mm roll width, 45mm feed length).
   * No rotation needed — 62mm width already matches the roll, and the
   * label is naturally wider than it is tall, so content lays out directly.
   * All dimensions in mm. All text #1A1410 — near-black, prints clean on thermal.
   * Divider is a filled div, not a border (borders render dashed on thermal).
   * Client name auto-fits via fitNames() below, based on the design sketches
   * worked through with George — see thermal-label-design-guide.md.
   */

  const allPots = [];
  students.forEach(s => s.pots.forEach((p, idx) => allPots.push({s, p, idx})));

  const labelsHtml = allPots.map(({s, p, idx}, li) => {
    const total    = s.pots.length;
    const item     = total > 1 ? `Item ${idx+1} of ${total}` : 'Single item';
    const isLast   = li === allPots.length - 1;
    const descClay = [(p.description || 'Pot — no description'), p.clay].filter(Boolean).join(' · ');
    const dateLines = dateSplit();

    return `
    <div class="page${isLast ? ' last' : ''}">
      <div class="card">
        <div class="pl-studio">${e(sn())}</div>
        <div class="pl-name">${e(fullName(s)||'Unknown')}</div>
        <div class="pl-frame">
          <div class="pl-frame-hrule-top"></div>
          <div class="pl-class-col">${e(cn())}</div>
          <div class="pl-frame-vrule"></div>
          <div class="pl-date-col">
            <div>${e(dateLines.line1)}</div>
            <div>${e(dateLines.line2)}</div>
          </div>
          <div class="pl-frame-hrule-bottom"></div>
        </div>
        <div class="pl-desc">${e(descClay)}</div>
        <div class="pl-glaze">Glaze: ${e(p.glaze||'Not specified')}</div>
        <div class="pl-count">${e(item)}</div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pot Labels — ${e(cn())}</title>
<style>
  ${embeddedFontCSS()}
  @page { size: 62mm 45mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'DM Mono', monospace;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Landscape page: 62mm wide (roll width) x 45mm tall — one label per page */
  .page {
    width: 62mm;
    height: 45mm;
    page-break-after: always;
    overflow: hidden;
  }
  .page.last { page-break-after: auto; }

  /* Card fills the page. Padding = margins: 3mm top, 4mm sides, 4mm bottom.
     Top trimmed from 5mm to make room for the new I-beam rule frame below. */
  .card {
    width: 62mm;
    height: 45mm;
    display: flex;
    flex-direction: column;
    padding: 3mm 4mm 4mm 4mm;
    overflow: hidden;
  }

  /* Line 1 — studio name, 6pt all caps, touches line 2 below */
  .pl-studio {
    font-size: 6pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #1A1410;
    line-height: 1.1;
  }

  /* Line 2 — client name, Petrona serif, auto-fit width via fitNames() below.
     Touches line 1 above and line 3 below (0mm gap). 20pt cap, 8pt floor. */
  .pl-name {
    font-family: 'Petrona', Georgia, serif;
    font-size: 20pt;
    font-weight: 500;
    color: #1A1410;
    line-height: 1.3;
    white-space: nowrap;
    overflow: visible;
    margin-bottom: 1mm;
  }

  /* True grid frame around class name + date, so the vertical rule physically
     joins the top and bottom horizontal rules (no floating gaps). The grid
     has 3 rows (top rule / content / bottom rule) and 3 columns (class /
     vertical rule / date). The vertical rule spans grid-row 1/4, so it runs
     the full frame height regardless of how tall the content row is. Extra
     breathing room above and below the text lives in the column padding,
     not in separate margins, so it doesn't break the rule/rule join.
     Class column is weighted 2fr vs date's 1fr — the date is always short
     ("11 June 2026"), so the class + organisation name gets most of the room. */
  .pl-frame {
    display: grid;
    grid-template-columns: 4fr 0.5mm 1fr;
    grid-template-rows: 0.5mm auto 0.5mm;
    margin-bottom: 2.5mm;
  }
  /* Explicit height on both horizontal rules — matching the explicit width
     already set on the vertical rule below. Relying on the grid row track
     alone (0.5mm) left the two rules rendering at slightly different
     weights when printed; locking height directly on the elements fixes it. */
  .pl-frame-hrule-top,
  .pl-frame-hrule-bottom {
    grid-column: 1 / 4;
    height: 0.5mm;
    background: #1A1410;
  }
  .pl-frame-hrule-top { grid-row: 1; }
  .pl-frame-hrule-bottom { grid-row: 3; }
  .pl-frame-vrule {
    grid-row: 1 / 4;
    grid-column: 2;
    width: 0.5mm;
    background: #1A1410;
  }
  /* Class name: line 1 runs full width, line 2 truncates with an ellipsis.
     -webkit-line-clamp alone wasn't being respected as a grid item with an
     "auto" row — a third line was bleeding through into the rule below it.
     max-height is a hard backstop: even if line-clamp fails to visually
     truncate, overflow:hidden + max-height guarantees nothing past 2 lines
     is ever shown or affects the row's height.
     max-height must include the padding, since box-sizing:border-box (set
     globally above) counts padding inside height/max-height — 2 lines at
     7pt/1.25 is 6.17mm, plus 2mm + 1.5mm padding = 9.67mm. The previous
     6.2mm left only ~2.7mm for text, which is what sliced line 2 in half. */
  .pl-class-col {
    grid-row: 2;
    grid-column: 1;
    font-size: 7pt;
    color: #1A1410;
    line-height: 1.25;
    padding: 2mm 2mm 1.5mm 0;
    max-height: 9.7mm;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  /* Date: always exactly two short, fixed-format lines (DD/MM, YYYY), so
     no wrapping or truncation risk — no line-clamp needed here. Column is
     narrower now (1fr vs class name's 4fr) since 5 characters is the most
     it will ever need to hold. */
  .pl-date-col {
    grid-row: 2;
    grid-column: 3;
    font-size: 7pt;
    color: #1A1410;
    line-height: 1.25;
    text-align: right;
    padding: 2mm 0 1.5mm 2mm;
  }

  /* Line 4 — description + clay body, 7pt, 1mm below */
  .pl-desc {
    font-size: 7pt;
    color: #1A1410;
    margin-bottom: 1mm;
  }

  /* Line 5 — glaze, 7pt */
  .pl-glaze {
    font-size: 7pt;
    color: #1A1410;
  }

  /* Line 6 — item count, 8pt, right-aligned, anchored to the 4mm bottom
     margin via margin-top: auto — absorbs whatever space is left above it */
  .pl-count {
    font-size: 8pt;
    color: #1A1410;
    text-align: right;
    white-space: nowrap;
    margin-top: auto;
  }
</style>
</head>
<body>
${labelsHtml}
<script>
  // Shrink the client name to fit the 54mm content width (62mm card minus
  // 4mm left + 4mm right padding), stepping down from the 20pt cap to an
  // 8pt floor. Runs once fonts are loaded so Petrona measures correctly.
  function fitNames() {
    var availableMm = 54;
    var pxPerMm = 96 / 25.4;
    var maxPt = 20, minPt = 8, stepPt = 0.5;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    document.querySelectorAll('.pl-name').forEach(function(el) {
      var pt = maxPt;
      var text = el.textContent;
      while (pt > minPt) {
        ctx.font = '500 ' + pt + 'pt Petrona, Georgia, serif';
        var widthMm = ctx.measureText(text).width / pxPerMm;
        if (widthMm <= availableMm) break;
        pt -= stepPt;
      }
      el.style.fontSize = pt + 'pt';
    });
  }
  document.fonts.ready.then(function() {
    fitNames();
    requestAnimationFrame(function() { window.print(); window.close(); });
  });
<\/script>
</body>
</html>`;

  const popup = window.open('', '_blank', 'width=400,height=600');
  if (!popup) { toast('Pop-up blocked — allow pop-ups for this page and try again'); return; }
  popup.document.write(html);
  popup.document.close();
  toast(`${tp} pot label${tp !== 1 ? 's' : ''} sent to print`);
}

function printNameTags() {
  if (!students.length) { toast('No students to make name tags for'); return; }

  /*
   * Brother QL-820NWB · 62mm DK roll — same architecture as printPotLabels():
   * self-contained popup with its own @page, so the host page's A4 print
   * rule never applies (see thermal-label-design-guide.md §1).
   *
   * @page is declared 100mm x 62mm — the label's own natural landscape
   * shape — with NO CSS transform/rotation. A CSS `transform: rotate()`
   * used to fake the rotation here, but that doesn't survive Chrome's
   * print pipeline reliably (confirmed on a real test print: inconsistent
   * alignment, name/footer overlap). Getting a landscape label onto the
   * portrait 62mm roll is instead a print-dialog job: select "Landscape"
   * orientation in the system print dialog (⌥⌘P → the native panel, not
   * Chrome's own dropdown), plus the "62mm Roll" length closest to 100mm.
   * See thermal-label-design-guide.md §1.
   */

  const studioVal = sn();
  const classVal  = cn();
  const dateVal   = dateShort();

  const labelsHtml = students.map((s, i) => {
    const isLast = i === students.length - 1;
    return `
    <div class="page${isLast ? ' last' : ''}">
      <div class="nt-studio">${e(studioVal)}</div>
      <div class="nt-name-zone"><div class="nt-name">${e(fullName(s) || 'Unknown')}</div></div>
      <div class="nt-footer">${e(classVal)} &nbsp;·&nbsp; ${e(dateVal)}</div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Name Tags — ${e(classVal)}</title>
<style>
  ${embeddedFontCSS()}
  @page { size: 100mm 62mm; margin: 1.5mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'DM Mono', monospace;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Label authored directly in its natural landscape shape — select
     Landscape orientation in the print dialog to fit the portrait roll. */
  .page {
    width: 100mm;
    height: 62mm;
    display: flex;
    flex-direction: column;
    padding: 4mm 6mm;
    page-break-after: always;
    overflow: hidden;
  }
  .page.last { page-break-after: auto; }

  .nt-studio {
    font-size: 7pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #555;
    text-align: center;
    flex-shrink: 0;
  }

  /* Name zone takes all remaining space and centres the hero name.
     Font size starts at the 44pt cap; fitNames() below shrinks it per
     label so First + Last always fits on one line. */
  .nt-name-zone {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }
  .nt-name {
    font-family: 'Petrona', serif;
    font-weight: 500;
    color: #1A1410;
    line-height: 1;
    letter-spacing: -0.01em;
    text-align: center;
    white-space: nowrap;
    font-size: 44pt;
  }

  .nt-footer {
    font-size: 9pt;
    color: #555;
    text-align: center;
    flex-shrink: 0;
  }
</style>
</head>
<body>
${labelsHtml}
<script>
  // Shrink the client name to fit the 88mm content width (100mm box minus
  // 6mm left + 6mm right padding), stepping down from the 44pt cap to a
  // 10pt floor — low enough that even an unusually long double-barrelled
  // name still lands on one line rather than overflowing (Petrona's
  // letterforms run wider than Cormorant Garamond at the same point size,
  // so the floor here is lower than printPotLabels()'s). Same
  // canvas-measurement technique as fitNames() in printPotLabels(). Runs
  // once fonts are loaded so Petrona measures correctly.
  function fitNames() {
    var availableMm = 88;
    var pxPerMm = 96 / 25.4;
    var maxPt = 44, minPt = 10, stepPt = 0.5;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    document.querySelectorAll('.nt-name').forEach(function(el) {
      var pt = maxPt;
      var text = el.textContent;
      while (pt > minPt) {
        ctx.font = '500 ' + pt + 'pt Petrona, Georgia, serif';
        var widthMm = ctx.measureText(text).width / pxPerMm;
        if (widthMm <= availableMm) break;
        pt -= stepPt;
      }
      el.style.fontSize = pt + 'pt';
    });
  }
  document.fonts.ready.then(function() {
    fitNames();
    requestAnimationFrame(function() { window.print(); window.close(); });
  });
<\/script>
</body>
</html>`;

  const popup = window.open('', '_blank', 'width=400,height=650');
  if (!popup) { toast('Pop-up blocked — allow pop-ups for this page and try again'); return; }
  popup.document.write(html);
  popup.document.close();
  toast(`${students.length} name tag${students.length !== 1 ? 's' : ''} sent to print`);
}