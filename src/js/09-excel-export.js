

// ════════════════════════════════════════
// EXCEL EXPORT
// ════════════════════════════════════════
function exportExcel() {
  if(!students.length){toast('No students to export');return;}
  const wb=XLSX.utils.book_new();
  const tp=students.reduce((n,s)=>n+s.pots.length,0);

  // Sheet 1: Summary
  const ws1=XLSX.utils.aoa_to_sheet([
    ['Dimboola Pottery Classes — Class Record'],[], 
    ['Class Name',cn()],['Date',dateLong()],
    ['Time',document.getElementById('classTime').value],
    ['Studio',sn()],['Total Students',students.length],
    ['Total Pots',tp],['Exported',new Date().toLocaleString('en-AU')]
  ]);
  ws1['!cols']=[{wch:20},{wch:42}];
  XLSX.utils.book_append_sheet(wb,ws1,'Class Summary');

  // Sheet 2: Student Roll
  const rollH=['#','First Name','Last Name','Phone','Email','Postcode','Note','Source','Acuity ID','Cert Code'];
  const rollR=students.map((s,i)=>[i+1,s.firstName,s.lastName,s.phone,s.email,s.postcode,s.note,s.source,s.acuityId,s.certCode]);
  const ws2=XLSX.utils.aoa_to_sheet([rollH,...rollR]);
  ws2['!cols']=[{wch:4},{wch:14},{wch:14},{wch:16},{wch:30},{wch:10},{wch:20},{wch:8},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws2,'Student Roll');

  // Sheet 3: Pots & Glazes
  const potH=['Student First','Student Last','Pot #','Total Pots','Description','Clay','Glaze'];
  const potR=[];
  students.forEach(s=>{
    if(s.pots.length===0){potR.push([s.firstName,s.lastName,'—',0,'','','']);}
    else s.pots.forEach((p,i)=>{
      potR.push([s.firstName,s.lastName,i+1,s.pots.length,p.description,p.clay,p.glaze]);
    });
  });
  const ws3=XLSX.utils.aoa_to_sheet([potH,...potR]);
  ws3['!cols']=[{wch:14},{wch:14},{wch:6},{wch:10},{wch:28},{wch:16},{wch:28}];
  XLSX.utils.book_append_sheet(wb,ws3,'Pots & Glazes');

  const fname=cn().replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_');
  const dt=document.getElementById('classDate').value||'undated';
  XLSX.writeFile(wb,`${fname}_${dt}.xlsx`);
  toast('Excel file downloaded — save to Dropbox');
}

// ════════════════════════════════════════

// ════════════════════════════════════════
// EXCEL RESTORE
// ════════════════════════════════════════
function restoreFromExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById('restoreStatus');
  status.textContent = 'Reading file…';
  status.style.color = 'var(--text-muted)';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});

      // Validate required sheets
      const required = ['Class Summary','Student Roll','Pots & Glazes'];
      const missing = required.filter(s => !wb.SheetNames.includes(s));
      if (missing.length) {
        status.textContent = '⚠ Not a valid app backup — missing sheet(s): ' + missing.join(', ');
        status.style.color = '#c0392b';
        input.value = '';
        return;
      }

      // Class Summary
      const sum = XLSX.utils.sheet_to_json(wb.Sheets['Class Summary'], {header:1});
      const sumMap = {};
      sum.forEach(row => { if (row[0] && row[1] != null) sumMap[String(row[0]).trim()] = row[1]; });
      const className  = sumMap['Class Name'] || '';
      const classDate  = sumMap['Date']        || '';
      const classTime  = sumMap['Time']        || '';
      const studioName = sumMap['Studio']      || 'Dimboola Pottery Classes';

      // Student Roll
      const rollRows = XLSX.utils.sheet_to_json(wb.Sheets['Student Roll'], {header:1});
      if (rollRows.length < 2) { throw new Error('Student Roll sheet appears empty'); }
      const rollHead = rollRows[0].map(h => String(h||'').trim());
      const col = h => rollHead.indexOf(h);

      const studentList = [];
      for (let i = 1; i < rollRows.length; i++) {
        const r = rollRows[i];
        if (!r || r.every(v => v == null || v === '')) continue;
        studentList.push({
          id: uid++,
          firstName : String(r[col('First Name')] || '').trim(),
          lastName  : String(r[col('Last Name')]  || '').trim(),
          phone     : String(r[col('Phone')]       || '').trim(),
          email     : String(r[col('Email')]       || '').trim(),
          postcode  : String(r[col('Postcode')]    || '').trim(),
          note      : String(r[col('Note')]        || '').trim(),
          source    : String(r[col('Source')]      || 'manual').trim(),
          acuityId  : String(r[col('Acuity ID')]   || '').trim(),
          certCode  : String(r[col('Cert Code')]   || '').trim(),
          pots      : []
        });
      }

      // Pots & Glazes
      let glazesRenamed = 0;
      const potRows = XLSX.utils.sheet_to_json(wb.Sheets['Pots & Glazes'], {header:1});
      if (potRows.length > 1) {
        const potHead = potRows[0].map(h => String(h||'').trim());
        const pc = h => potHead.indexOf(h);
        for (let i = 1; i < potRows.length; i++) {
          const r = potRows[i];
          if (!r || r.every(v => v == null || v === '')) continue;
          const first = String(r[pc('Student First')] || '').trim();
          const last  = String(r[pc('Student Last')]  || '').trim();
          const desc  = String(r[pc('Description')]   || '').trim();
          const clay  = String(r[pc('Clay')]          || 'White Stoneware').trim();
          const glazeRaw = String(r[pc('Glaze')]      || '').trim();
          const glaze = GLAZE_RENAMES[glazeRaw] || glazeRaw;
          if (glaze !== glazeRaw) glazesRenamed++;
          if (String(r[pc('Pot #')]) === '\u2014') continue; // skip "no pots" placeholder rows
          const student = studentList.find(s => s.firstName === first && s.lastName === last);
          if (student) {
            student.pots.push({ description: desc, clay, glaze });
          }
        }
      }

      if (!studentList.length) { throw new Error('No students found in Student Roll sheet'); }

      // Parse date string (e.g. "Sunday 12 April 2026") back to YYYY-MM-DD
      let isoDate = '';
      if (classDate) {
        const parsed = new Date(String(classDate));
        if (!isNaN(parsed)) {
          isoDate = parsed.toISOString().split('T')[0];
        }
      }

      // Confirm before overwriting existing data
      if (students.length > 0) {
        if (!confirm('This will replace the current ' + students.length + ' student(s) with ' + studentList.length + ' students from the backup.\n\nClass: ' + className + '\nDate: ' + classDate + '\n\nProceed?')) {
          status.textContent = 'Restore cancelled.';
          input.value = '';
          return;
        }
      }

      // Apply to app state
      students = studentList;
      document.getElementById('className').value   = className;
      document.getElementById('studioName').value  = studioName;
      document.getElementById('classTime').value   = classTime || '';
      if (isoDate) document.getElementById('classDate').value = isoDate;

      renderAll();
      updateSum();
      syncInfo();

      const tp = students.reduce((n,s) => n + s.pots.length, 0);
      status.textContent = '✓ Restored: ' + students.length + ' students, ' + tp + ' pots' + (glazesRenamed ? ' (' + glazesRenamed + ' glaze name' + (glazesRenamed!==1?'s':'') + ' updated to new names)' : '');
      status.style.color = 'var(--glaze-green)';
      input.value = '';
      toast('Restored ' + students.length + ' students from backup');

    } catch(err) {
      status.textContent = '⚠ Error: ' + err.message;
      status.style.color = '#c0392b';
      input.value = '';
    }
  };
  reader.readAsArrayBuffer(file);
}

// HTML EXPORT
// ════════════════════════════════════════
function exportHTML() {
  if(!students.length){toast('No students to export');return;}
  const tp=students.reduce((n,s)=>n+s.pots.length,0);
  const rows=students.map((s,i)=>{
    const pList=s.pots.length===0
      ? '<em style="color:#bbb">No pots recorded</em>'
      : s.pots.map((p,pi)=>{
          return `<div style="padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:12px;">
            <strong>Pot ${pi+1}/${s.pots.length}</strong> — ${e(p.description||'—')}
            &nbsp;·&nbsp;<span style="color:#4A6741">Glaze: ${e(p.glaze||'not specified')}</span>
            &nbsp;·&nbsp;<span style="color:#aaa">${e(p.clay)}</span>
          </div>`;
        }).join('');
    return `<tr style="background:${i%2===0?'#fff':'#fafaf8'}">
      <td style="padding:10px 8px;color:#8B5E3C;font-weight:bold;vertical-align:top">${i+1}</td>
      <td style="padding:10px 8px;vertical-align:top">
        <div style="font-size:16px;font-family:'Petrona',Georgia,serif;color:#1A1410">${e(fullName(s)||'—')}</div>
        ${s.postcode?`<div style="font-size:10px;color:#aaa">Postcode: ${e(s.postcode)}</div>`:''}
        ${s.phone?`<div style="font-size:10px;color:#aaa">${e(s.phone)}</div>`:''}
        ${s.email?`<div style="font-size:10px;color:#aaa">${e(s.email)}</div>`:''}
        ${s.note?`<div style="font-size:10px;color:#C4956A;font-style:italic;margin-top:3px">${e(s.note)}</div>`:''}
      </td>
      <td style="padding:10px 8px;vertical-align:top;font-size:10px;color:#aaa">${s.source==='acuity'?'Acuity':'Walk-in'}</td>
      <td style="padding:10px 8px;vertical-align:top">${pList}</td>
    </tr>`;
  }).join('');

  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${e(cn())} — ${e(dateLong())}</title>
<style>body{font-family:'Petrona',Georgia,serif;background:#F5F0EA;color:#1A1410;margin:0;padding:0}
.wrap{max-width:900px;margin:0 auto;padding:40px 28px}
h1{font-size:30px;font-weight:300;font-style:italic;color:#1A1410;margin-bottom:4px}
.meta{font-size:12px;color:#9B8878;font-family:monospace;margin-bottom:26px}
table{width:100%;border-collapse:collapse;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
th{background:#2C2218;color:#F5F0EA;padding:9px 8px;text-align:left;font-size:10px;letter-spacing:0.1em;font-family:monospace;text-transform:uppercase}
.foot{margin-top:20px;font-size:10px;color:#bbb;font-family:monospace}
</style></head><body><div class="wrap">
<h1>${e(cn())}</h1>
<div class="meta">${e(sn())} · ${e(dateLong())} · ${students.length} students · ${tp} pots</div>
<table><thead><tr><th>#</th><th>Student</th><th>Source</th><th>Pots &amp; Glazes</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="foot">Exported ${new Date().toLocaleString('en-AU')} — Dimboola Pottery Classes Workshop Manager</div>
</div></body></html>`;

  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
  const fname=cn().replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_');
  a.download=`${fname}_${document.getElementById('classDate').value||'undated'}_record.html`;
  a.click();
  toast('HTML record downloaded — save to Dropbox');
}