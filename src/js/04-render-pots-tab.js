

// ════════════════════════════════════════
// RENDER: POTS TAB
// ════════════════════════════════════════
function setPotsView(v) {
  potsView = v === 'list' ? 'list' : 'grid';
  document.getElementById('vtGrid').classList.toggle('active', potsView === 'grid');
  document.getElementById('vtList').classList.toggle('active', potsView === 'list');
  renderPotsTab();
}

// Glaze <option> list. A saved glaze that is no longer in GLAZES is kept as a selected
// "(previous name)" option so it is never silently dropped.
function glazeOptionsHtml(selected) {
  return `<option value="">— select —</option>`
    + GLAZES.map(g=>`<option value="${e(g)}"${g===selected?' selected':''}>${e(g)}</option>`).join('')
    + (selected && !GLAZES.includes(selected) ? `<option value="${e(selected)}" selected>${e(selected)} (previous name)</option>` : '');
}

function renderPotsTab() {
  const w = document.getElementById('potsWrap');
  if (!students.length) {
    w.innerHTML = `<p style="font-size:12px;color:var(--text-muted);">Add students in the Class Setup tab first.</p>`;
    return;
  }
  if (potsView === 'grid') renderPotsGrid(w); else renderPotsList(w);
  // update second summary
  const tp=students.reduce((n,s)=>n+s.pots.length,0);
  document.getElementById('sumB').innerHTML=`<span class="summary-stat">${students.length}</span> students &nbsp;·&nbsp; <span class="summary-stat">${tp}</span> pots`;
}

// Grid view — same shape as the printed Glaze Sheet. An empty cell becomes a pot the
// first time something is entered in it (no re-render, so focus is never lost).
function renderPotsGrid(w) {
  const cols = Math.min(8, Math.max(4, students.reduce((m,s)=>Math.max(m,s.pots.length),0)));
  const clayOpts = sel => CLAY.map(c=>`<option value="${e(c)}"${c===sel?' selected':''}>${e(c.replace(' Stoneware',''))}</option>`).join('');
  const head = `<div class="pg-row pg-head"><div>Client</div>`
    + Array.from({length:cols},(_,i)=>`<div>Pot ${i+1}</div>`).join('') + `<div></div></div>`;
  const rows = students.map(s=>{
    let cells = '';
    for (let i = 0; i < cols; i++) {
      const p = s.pots[i], has = !!p;
      cells += `<div class="pg-cell${has?' has-pot':''}" data-sid="${s.id}" data-pi="${has?i:''}">
        <div class="pg-top">
          <input class="pg-item" placeholder="Item" value="${has?e(p.description):''}" oninput="gridSet(this,'description',this.value)" />
          <select class="pg-clay" title="Clay body" onchange="gridSet(this,'clay',this.value)">${clayOpts(has?p.clay:'White Stoneware')}</select>
        </div>
        <select class="pg-glaze" onchange="gridSet(this,'glaze',this.value)">${glazeOptionsHtml(has?p.glaze:'')}</select>
        <button type="button" class="pg-x" onclick="gridRemove(this)" title="Remove this pot">✕</button>
      </div>`;
    }
    return `<div class="pg-row"><div class="pg-who">${e(fullName(s)||'New Student')}</div>${cells}
      <div class="pg-add"><button type="button" class="btn btn-ghost" onclick="addPot(${s.id})">+ pot</button></div></div>`;
  }).join('');
  w.innerHTML = `<div class="pg-scroll"><div class="pg" style="--cols:${cols}">${head}${rows}</div></div>`;
}

function gridSet(el, field, value) {
  const cell = el.closest('.pg-cell');
  const s = students.find(x => x.id === +cell.dataset.sid);
  if (!s) return;
  if (cell.dataset.pi === '') {            // first entry in an empty cell → create the pot
    s.pots.push({description:'', clay:'White Stoneware', glaze:''});
    cell.dataset.pi = s.pots.length - 1;
    cell.classList.add('has-pot');
  }
  s.pots[+cell.dataset.pi][field] = value;
  updateSum();
}

function gridRemove(btn) {
  const cell = btn.closest('.pg-cell');
  if (cell.dataset.pi === '') return;
  removePot(+cell.dataset.sid, +cell.dataset.pi);
}

function renderPotsList(w) {
  w.innerHTML = students.map(s=>{
    const potsHtml = s.pots.map((p,pi)=>{
      return `
      <div class="pot-row">
        <div class="pot-num">${pi+1}</div>
        <div class="fg"><label>Description</label>
          <input value="${e(p.description)}" placeholder="e.g. Oval plate"
            oninput="setPot(${s.id},${pi},'description',this.value)" /></div>
        <div class="fg"><label>Glaze</label>
          <select onchange="setPot(${s.id},${pi},'glaze',this.value)">
            ${glazeOptionsHtml(p.glaze)}
          </select></div>
        <div class="fg"><label>Clay</label>
          <select onchange="setPot(${s.id},${pi},'clay',this.value)">
            ${CLAY.map(c=>`<option value="${e(c)}"${c===p.clay?' selected':''}>${e(c)}</option>`).join('')}
          </select></div>
        <button class="btn-rm-pot" onclick="removePot(${s.id},${pi})" title="Remove">✕</button>
      </div>`;
    }).join('');
    return `
    <div style="border:1px solid var(--border);border-radius:2px;margin-bottom:14px;overflow:hidden;">
      <div style="background:var(--kiln-dark);padding:9px 15px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:'Petrona',serif;font-size:17px;font-style:italic;color:var(--ash-white);">${e(fullName(s)||'New Student')}</span>
        <span class="badge badge-pots">${s.pots.length} pot${s.pots.length!==1?'s':''}</span>
      </div>
      <div style="padding:14px 16px;">
        <div class="pots-title">Pots made in this class</div>
        ${potsHtml||`<p style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">No pots added yet.</p>`}
        <button class="btn btn-ghost" style="margin-top:8px;" onclick="addPot(${s.id})">+ Add a pot</button>
      </div>
    </div>`;
  }).join('');
}