

// ════════════════════════════════════════
// CLIENT JOBS EXCEL IMPORT
// ════════════════════════════════════════

// Holds parsed preview rows before committing
let cjiParsed = [];

function cjiHandleDrop(ev) {
  ev.preventDefault();
  document.getElementById('cjiDrop').classList.remove('drag-over');
  const f = ev.dataTransfer.files[0];
  if (f) cjiLoadFile(f);
}

function cjiLoadFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls'].includes(ext)) {
    cjiShowStatus('⚠ Please choose an .xlsx or .xls file', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      // Use the first sheet
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      cjiParseRows(rows);
    } catch(err) {
      cjiShowStatus('⚠ Could not read file: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function cjiSanitise(v) {
  // Convert to string, trim whitespace. The e() helper handles HTML escaping
  // at render time; here we just make sure we have clean plain text.
  return String(v == null ? '' : v).trim();
}

function cjiParseRows(rows) {
  if (!rows || rows.length < 2) {
    cjiShowStatus('⚠ File appears empty or has no data rows.', 'error');
    return;
  }

  // Normalise header: lowercase + trim for matching
  const rawHead = rows[0];
  const head = rawHead.map(h => cjiSanitise(h).toLowerCase());

  // Flexible column finder — case-insensitive, ignores leading/trailing spaces
  const col = label => {
    const target = label.toLowerCase();
    const idx = head.indexOf(target);
    return idx; // -1 if not found
  };

  // Locate item columns (item 1 … item N, case-insensitive)
  const itemCols = [];
  head.forEach((h, i) => {
    if (/^item\s*\d+$/i.test(h)) itemCols.push(i);
  });

  // Minimum required columns
  const reqCols = ['first name', 'last name'];
  const missing = reqCols.filter(r => col(r) === -1);
  if (missing.length) {
    cjiShowStatus('⚠ Missing required columns: ' + missing.map(m => '"' + m + '"').join(', ') + '. Check the spreadsheet headers.', 'error');
    return;
  }

  cjiParsed = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    // Skip completely blank rows
    if (!r || r.every(v => cjiSanitise(v) === '')) continue;

    const firstName  = cjiSanitise(r[col('first name')]);
    const lastName   = cjiSanitise(r[col('last name')]);
    if (!firstName && !lastName) continue; // must have at least one name

    const phone      = col('phone')      >= 0 ? cjiSanitise(r[col('phone')])      : '';
    const email      = col('email')      >= 0 ? cjiSanitise(r[col('email')])      : '';
    const postcode   = col('post code')  >= 0 ? cjiSanitise(r[col('post code')])  : '';
    const classType  = col('type of class') >= 0 ? cjiSanitise(r[col('type of class')]) : '';

    // Parse date if present — Excel stores dates as serial numbers
    let classDate = '';
    if (col('date') >= 0) {
      const rawDate = r[col('date')];
      if (rawDate !== '' && rawDate != null) {
        // XLSX may return a JS Date already, or a serial number, or a string
        if (rawDate instanceof Date) {
          classDate = rawDate.toISOString().split('T')[0];
        } else if (typeof rawDate === 'number') {
          // Excel date serial → JS Date
          const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          classDate = d.toISOString().split('T')[0];
        } else {
          classDate = cjiSanitise(rawDate);
        }
      }
    }

    // Collect pot descriptions from item columns
    const pots = [];
    itemCols.forEach(ci => {
      const desc = cjiSanitise(r[ci]);
      if (desc) {
        pots.push({
          description: desc,
          clay: 'White Stoneware',
          glaze: ''
        });
      }
    });

    cjiParsed.push({ firstName, lastName, phone, email, postcode, classType, classDate, pots });
  }

  if (!cjiParsed.length) {
    cjiShowStatus('⚠ No usable rows found — check that the spreadsheet has at least a First Name or Last Name value per row.', 'error');
    return;
  }

  // Render preview
  const container = document.getElementById('cjiPreviewRows');
  container.innerHTML = '';
  cjiParsed.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'cji-row';

    const num = document.createElement('span');
    num.className = 'cji-row-num';
    num.textContent = i + 1;

    const name = document.createElement('span');
    name.className = 'cji-row-name';
    name.textContent = (r.firstName + ' ' + r.lastName).trim() || '—';

    const qty = document.createElement('span');
    qty.className = 'cji-row-qty';
    qty.textContent = r.pots.length + ' pot' + (r.pots.length !== 1 ? 's' : '');

    const potList = document.createElement('span');
    potList.className = 'cji-row-pots';
    potList.textContent = r.pots.map(p => p.description).join(' · ') || '(no pots)';

    row.appendChild(num);
    row.appendChild(name);
    row.appendChild(qty);
    row.appendChild(potList);
    container.appendChild(row);
  });

  const tp = cjiParsed.reduce((n, r) => n + r.pots.length, 0);
  cjiShowStatus(
    '✓ Found ' + cjiParsed.length + ' client' + (cjiParsed.length !== 1 ? 's' : '') +
    ' with ' + tp + ' pot' + (tp !== 1 ? 's' : '') + ' total.',
    'ok'
  );

  document.getElementById('cjiPreview').classList.add('visible');
  document.getElementById('cjiMergeRow').style.display = 'flex';
  document.getElementById('cjiImportBtn').style.display = '';
}

function cjiShowStatus(msg, type) {
  const el = document.getElementById('cjiStatus');
  el.textContent = msg;
  el.style.color = type === 'error' ? '#c0392b' : 'var(--glaze-green)';
  if (type === 'error') {
    document.getElementById('cjiPreview').classList.add('visible');
  }
}

function cjiImport() {
  if (!cjiParsed.length) return;
  const mode = document.querySelector('input[name="cjiMode"]:checked').value;

  if (mode === 'replace' && students.length > 0) {
    if (!confirm('This will replace the current ' + students.length + ' student(s) with ' + cjiParsed.length + ' clients from the spreadsheet.\n\nProceed?')) return;
    students = [];
    uid = 1;
  }

  cjiParsed.forEach(r => {
    students.push({
      id: uid++,
      firstName : r.firstName,
      lastName  : r.lastName,
      phone     : r.phone,
      email     : r.email,
      postcode  : r.postcode,
      note      : r.classType || '',
      source    : 'manual',
      acuityId  : '',
      certCode  : '',
      pots      : r.pots.map(p => ({ description: p.description, clay: p.clay, glaze: p.glaze }))
    });
  });

  // If all rows share the same classDate, offer to set the class date
  const dates = [...new Set(cjiParsed.map(r => r.classDate).filter(Boolean))];
  if (dates.length === 1) {
    const existing = document.getElementById('classDate').value;
    if (!existing || existing !== dates[0]) {
      if (confirm('The spreadsheet has a date of ' + dates[0] + '.\nSet this as the class date?')) {
        document.getElementById('classDate').value = dates[0];
      }
    }
  }

  // If all rows share the same classType, offer to set the class name
  const types = [...new Set(cjiParsed.map(r => r.classType).filter(Boolean))];
  if (types.length === 1) {
    const existing = document.getElementById('className').value.trim();
    if (!existing || existing === 'Pottery Class') {
      document.getElementById('className').value = types[0];
    }
  }

  renderAll();
  updateSum();
  syncInfo();

  const tp = students.reduce((n, s) => n + s.pots.length, 0);
  toast('Imported ' + cjiParsed.length + ' clients · ' + tp + ' pots');
  cjiReset();
  toggleBox('boxClientJobs');
}

function cjiReset() {
  cjiParsed = [];
  document.getElementById('cjiPreviewRows').innerHTML = '';
  document.getElementById('cjiPreview').classList.remove('visible');
  document.getElementById('cjiMergeRow').style.display = 'none';
  document.getElementById('cjiImportBtn').style.display = 'none';
  document.getElementById('cjiStatus').textContent = '';
  document.getElementById('cjiFileInput').value = '';
}