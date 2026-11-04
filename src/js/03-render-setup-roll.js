

// ════════════════════════════════════════
// RENDER ORCHESTRATOR
// ════════════════════════════════════════
function renderAll() { renderSetup(); renderRoll(); renderPotsTab(); updateSum(); syncInfo(); }

// ════════════════════════════════════════
// RENDER: SETUP — STUDENT CARDS
// ════════════════════════════════════════
function renderSetup() {
  const c = document.getElementById('studentsContainer');
  if (!students.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">🏺</div><p>No students yet.<br>Import from Outlook or add a walk-in manually.</p></div>`;
    return;
  }
  c.innerHTML = students.map((s,i)=>{
    const full = fullName(s)||'New Student';
    const srcBadge = s.source==='acuity'
      ? `<span class="badge badge-acuity">Acuity</span>`
      : `<span class="badge badge-manual">Walk-in</span>`;
    const contactHtml = (s.phone||s.email||s.acuityId) ? `
      <div class="contact-strip" style="margin-bottom:10px;">
        <div class="cs-item"><label>Acuity ID</label><span>${e(s.acuityId)||'—'}</span></div>
      </div>` : '';
    return `
    <div class="student-card">
      <div class="sc-head">
        <div class="sc-left">
          <span class="sc-num">${i+1}</span>
          <span class="sc-name">${e(full)}</span>
          ${srcBadge}
        </div>
        <button class="btn-rm" onclick="removeStudent(${s.id})">Remove</button>
      </div>
      <div class="sc-body">
        ${contactHtml}
        <div class="field-row-4">
          <div class="fg"><label>First Name</label>
            <input value="${e(s.firstName)}" placeholder="First"
              oninput="setField(${s.id},'firstName',this.value);this.closest('.student-card').querySelector('.sc-name').textContent=fullName(students.find(x=>x.id==${s.id}))||'New Student'" /></div>
          <div class="fg"><label>Last Name</label>
            <input value="${e(s.lastName)}" placeholder="Last"
              oninput="setField(${s.id},'lastName',this.value);this.closest('.student-card').querySelector('.sc-name').textContent=fullName(students.find(x=>x.id==${s.id}))||'New Student'" /></div>
          <div class="fg"><label>Postcode</label>
            <input value="${e(s.postcode)}" placeholder="e.g. 3424" oninput="setField(${s.id},'postcode',this.value)" /></div>
          <div class="fg"><label>Note</label>
            <input value="${e(s.note)}" placeholder="e.g. cash, Emily's Mum" oninput="setField(${s.id},'note',this.value)" /></div>
        </div>
        <div class="field-row">
          <div class="fg"><label>Phone</label>
            <input type="tel" value="${e(s.phone)}" placeholder="e.g. +61 4xx xxx xxx"
              oninput="setField(${s.id},'phone',this.value)" /></div>
          <div class="fg"><label>Email</label>
            <input type="email" value="${e(s.email)}" placeholder="e.g. jane@email.com"
              oninput="setField(${s.id},'email',this.value)" /></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════
// RENDER: CLASS ROLL
// ════════════════════════════════════════
function renderRoll() {
  const w = document.getElementById('rollWrap');
  if (!students.length) {
    w.innerHTML = `<p style="font-size:12px;color:var(--text-muted);">Add students in the Class Setup tab to see the roll here.</p>`;
    return;
  }
  w.innerHTML = `<table class="roll-table">
    <thead><tr>
      <th>#</th><th>Student</th><th>Postcode</th><th>Contact</th><th>Note</th><th>Source</th><th style="text-align:center">Arrived ✓</th>
    </tr></thead>
    <tbody>
    ${students.map((s,i)=>`
      <tr>
        <td style="color:var(--text-muted);font-size:11px;">${i+1}</td>
        <td><div class="roll-name">${e(fullName(s)||'—')}</div></td>
        <td style="font-size:11px;color:var(--text-secondary);">${e(s.postcode)||'—'}</td>
        <td><div class="roll-sub">${s.phone?e(s.phone)+'<br>':''}${e(s.email)}</div></td>
        <td style="font-size:11px;color:var(--clay-dark);font-style:italic;">${e(s.note)}</td>
        <td><span class="badge ${s.source==='acuity'?'badge-acuity':'badge-manual'}">${s.source==='acuity'?'Acuity':'Walk-in'}</span></td>
        <td style="text-align:center;"><input type="checkbox" class="arrived-cb" /></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}