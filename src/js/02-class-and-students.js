

// ════════════════════════════════════════
// CLASS INFO
// ════════════════════════════════════════
function syncInfo() {
  document.getElementById('rollTitle').textContent = cn() || 'Class Roll';
  const d = dateLong();
  const ti = document.getElementById('classTime').value;
  document.getElementById('rollMeta').textContent = [d,ti].filter(Boolean).join(' · ') || '—';
}
const cn  = () => (document.getElementById('className').value||'').trim() || 'Pottery Class';
const sn  = () => (document.getElementById('studioName').value||'').trim() || 'Dimboola Pottery Classes';
const dateLong = () => {
  const v = document.getElementById('classDate').value;
  return v ? new Date(v+'T12:00:00').toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';
};
const dateShort = () => {
  const v = document.getElementById('classDate').value;
  return v ? new Date(v+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'}) : 'Date not set';
};
// Fixed-width DD/MM/YYYY for the print label only — dateShort() varies from
// 10 to 18 characters depending on month name length ("1 May 2026" vs
// "23 September 2026"), which made the date column in the grid frame
// unpredictable to size. This is always exactly 10 characters. Built
// directly from the <input type="date"> value (already zero-padded
// YYYY-MM-DD) rather than via toLocaleDateString, so it never drops a
// leading zero.
const dateCompact = () => {
  const v = document.getElementById('classDate').value;
  if (!v) return 'Date not set';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
};
// Same idea as dateCompact(), split across two lines (DD/MM, then YYYY) so
// the print label's date column can be much narrower — 5 characters wide
// at most, instead of 10.
const dateSplit = () => {
  const v = document.getElementById('classDate').value;
  if (!v) return { line1: 'Date', line2: 'not set' };
  const [y, m, d] = v.split('-');
  return { line1: `${d}/${m}`, line2: y };
};

// Embedded @font-face CSS (base64), re-used inside print popups so fonts work
// under file:// and offline with no network dependency.
const embeddedFontCSS = () => document.getElementById('embeddedFonts').textContent;

// ════════════════════════════════════════
// STUDENT CRUD
// ════════════════════════════════════════
function addStudent(d={}) {
  students.push({
    id:uid++, firstName:d.firstName||'', lastName:d.lastName||'',
    phone:d.phone||'', email:d.email||'', postcode:d.postcode||'',
    note:d.note||'', source:d.source||'manual',
    acuityId:d.acuityId||'', certCode:d.certCode||'',
    pots:[]
  });
  renderAll(); updateSum();
}
function removeStudent(id) { students=students.filter(s=>s.id!==id); renderAll(); updateSum(); }
function setField(id,f,v) { const s=students.find(s=>s.id===id); if(s){s[f]=v;} updateSum(); }
function addPot(sid) { const s=students.find(s=>s.id===sid); if(s){s.pots.push({description:'',clay:'White Stoneware',glaze:''});renderPotsTab();updateSum();} }
function removePot(sid,pi) { const s=students.find(s=>s.id===sid); if(s){s.pots.splice(pi,1);renderPotsTab();updateSum();} }
function setPot(sid,pi,f,v) { const s=students.find(s=>s.id===sid); if(s&&s.pots[pi])s.pots[pi][f]=v; }