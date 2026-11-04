


// ════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════
function updateSum() {
  const tp=students.reduce((n,s)=>n+s.pots.length,0);
  const html=`<span class="summary-stat">${students.length}</span> student${students.length!==1?'s':''} &nbsp;·&nbsp; <span class="summary-stat">${tp}</span> pot${tp!==1?'s':''} total`;
  document.getElementById('sumA').innerHTML=html;
  const b=document.getElementById('sumB'); if(b)b.innerHTML=html;
}
function clearAll() {
  if(!students.length)return;
  if(!confirm('Clear all students and pot data for this session?'))return;
  students=[];uid=1;renderAll();toast('Cleared');
}
function hideSection(id){document.getElementById(id).classList.remove('visible');}
const fullName = s=>(s.firstName+' '+s.lastName).trim();
const e = str=>String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}
