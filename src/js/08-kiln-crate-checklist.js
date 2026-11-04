

// ════════════════════════════════════════
// KILN & CRATE CHECKLIST
// ════════════════════════════════════════
function printCrateChecklist() {
  if (!students.length) { toast('No students to print'); return; }

  const tp       = students.reduce((n,s) => n + s.pots.length, 0);
  const classInfo = cn();
  const dateInfo  = dateLong();
  const timeInfo  = document.getElementById('classTime').value || '';
  const studio    = sn();

  // Summary box date: "SATURDAY\n13 June 2026"
  const classDateVal = document.getElementById('classDate').value;
  const dateObj = classDateVal ? new Date(classDateVal + 'T12:00:00') : null;
  const summaryDay  = dateObj ? dateObj.toLocaleDateString('en-AU',{weekday:'long'}).toUpperCase() : '—';
  const summaryDate = dateObj ? dateObj.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'}) : '—';

  // Per-student cards
  const studentCards = students.map(s => {
    const name    = fullName(s) || '(no name)';
    const contact = [s.phone, s.email].filter(Boolean).join(' · ');
    const potCount = s.pots.length;

    const potRows = potCount === 0
      ? `<tr><td colspan="7" style="padding:4mm 2mm;color:#bbb;font-style:italic;font-size:8pt;">No pots recorded</td></tr>`
      : s.pots.map((p, pi) => {
          return `<tr>
            <td class="pc-num">${pi + 1}</td>
            <td class="pc-desc">${e((p.description||'').trim() || '—')}</td>
            <td class="pc-clay">${e(p.clay || '—')}</td>
            <td class="pc-glaze">${e(p.glaze || 'Not specified')}</td>
            <td class="pc-cb"><div class="cb"></div></td>
            <td class="pc-cb"><div class="cb"></div></td>
            <td class="pc-cb"><div class="cb"></div></td>
          </tr>`;
        }).join('');

    return `<div class="student-card">
      <div class="sc-head">
        <div class="sc-left">
          <span class="sc-name">${e(name)}</span>
          ${contact ? `<span class="sc-contact">${e(contact)}</span>` : ''}
        </div>
        <span class="sc-potcount">${potCount} pot${potCount !== 1 ? 's' : ''}</span>
      </div>
      <table class="pot-table">
        <thead>
          <tr>
            <th class="pc-num">#</th>
            <th class="pc-desc">Description</th>
            <th class="pc-clay">Clay</th>
            <th class="pc-glaze">Glaze</th>
            <th class="pc-cb">Fired</th>
            <th class="pc-cb">Contacted</th>
            <th class="pc-cb">Collected</th>
          </tr>
        </thead>
        <tbody>${potRows}</tbody>
      </table>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Kiln &amp; Crate Checklist — ${e(classInfo)}</title>
<style>
  ${embeddedFontCSS()}
  @page {
    size: A4;
    margin: 14mm 10mm 12mm 22mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Mono', 'Courier New', monospace; font-size: 9pt; color: #1A1410; background: white; }

  /* ── Page header ── */
  .page-header { margin-bottom: 5mm; }
  .ph-eyebrow { font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: #666; margin-bottom: 1.5mm; }
  .ph-title   { display: flex; align-items: baseline; justify-content: space-between;
                font-family: 'Petrona', Georgia, serif; font-size: 26pt; font-weight: normal; font-style: normal;
                color: #000; line-height: 1; margin-bottom: 3mm; }
  .ph-title-date { font-family: 'Petrona', Georgia, serif; font-size: 26pt; font-weight: normal; font-style: normal;
                   color: #000; white-space: nowrap; }
  .ph-rule    { height: 0; border: none; border-top: 1.5pt solid #000; margin-bottom: 4mm; }

  /* ── Summary box ── */
  .summary-box {
    display: grid;
    grid-template-columns: 2fr 1.4fr 1fr 0.9fr 1fr;
    border: 0.75pt solid #888;
    margin-bottom: 6mm;
  }
  .sb-cell {
    padding: 2.5mm 3mm;
    border-right: 0.75pt solid #888;
  }
  .sb-cell:last-child { border-right: none; }
  .sb-label { font-size: 6.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: #666; margin-bottom: 1.5mm; }
  .sb-value { font-size: 9pt; color: #000; line-height: 1.35; }

  /* ── Student card ── */
  .student-card { margin-bottom: 5mm; page-break-inside: avoid; border: 0.75pt solid #888; }

  .sc-head {
    display: flex; align-items: baseline; justify-content: space-between;
    padding: 2.5mm 3mm 2mm;
    border-bottom: 0.5pt solid #888;
    background: #D0D0D0;
  }
  .sc-left    { display: flex; align-items: baseline; gap: 4mm; flex-wrap: wrap; }
  .sc-name    { font-family: 'Petrona', Georgia, serif; font-size: 13pt; font-style: normal; font-weight: normal; color: #000; }
  .sc-contact { font-size: 9pt; font-weight: 600; color: #222; letter-spacing: 0.02em; }
  .sc-potcount{ font-size: 9pt; font-weight: 600; color: #222; letter-spacing: 0.06em; white-space: nowrap; }

  /* ── Per-student pot table ── */
  .pot-table { width: 100%; border-collapse: collapse; }
  .pot-table thead th {
    font-size: 7pt; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700;
    color: #000; padding: 2mm 2.5mm; text-align: left;
    border-bottom: 0.5pt solid #888; background: #E8E8E8;
  }
  .pot-table tbody tr                  { border-top: 0.5pt solid #CCC; background: #FFFFFF; }
  .pot-table tbody tr:nth-child(even)  { background: #F2F2F2; }
  .pot-table tbody td { padding: 2mm 2.5mm; vertical-align: top; font-size: 7.5pt; }

  .pc-num   { width: 6mm;  color: #555; font-size: 7pt; }
  .pc-desc  { }
  .pc-clay  { width: 28mm; font-size: 7.5pt; color: #222; }
  .pc-glaze { width: 40mm; font-size: 7.5pt; color: #222; }
  .pc-cb    { width: 16mm; text-align: center; }

  .cb {
    width: 4.5mm; height: 4.5mm;
    border: 0.75pt solid #555;
    display: inline-block;
    border-radius: 0.5pt;
  }


</style>
</head>
<body>

<div class="page-header">
  <div class="ph-eyebrow">${e(studio)} — Kiln &amp; Crate Checklist</div>
  <div class="ph-title">
    <span>${e(classInfo)}</span>
    ${dateObj ? `<span class="ph-title-date">${dateObj.toLocaleDateString('en-AU',{day:'2-digit',month:'2-digit',year:'numeric'})}</span>` : ''}
  </div>
  <div class="ph-rule"></div>
</div>

<div class="summary-box">
  <div class="sb-cell">
    <div class="sb-label">Class</div>
    <div class="sb-value">${e(classInfo)}</div>
  </div>
  <div class="sb-cell">
    <div class="sb-label">Date</div>
    <div class="sb-value">${summaryDay}<br>${summaryDate}</div>
  </div>
  <div class="sb-cell">
    <div class="sb-label">Time</div>
    <div class="sb-value">${e(timeInfo || '—')}</div>
  </div>
  <div class="sb-cell">
    <div class="sb-label">Clients</div>
    <div class="sb-value">${students.length}</div>
  </div>
  <div class="sb-cell">
    <div class="sb-label">Total Pots</div>
    <div class="sb-value">${tp}</div>
  </div>
</div>

${studentCards}

<script>
document.fonts.ready.then(() => {
  requestAnimationFrame(() => { window.print(); window.close(); });
});
<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) { toast('Allow popups to print the checklist'); return; }
  w.document.write(html);
  w.document.close();
  toast('Opening checklist for print…');
}