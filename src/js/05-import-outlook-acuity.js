

// ════════════════════════════════════════
// IMPORT: OUTLOOK / ACUITY
// ════════════════════════════════════════
function toggleBox(id) {
  const ids=['boxOutlook','boxNames','boxClientJobs'];
  ids.forEach(i=>{ const el=document.getElementById(i); if(i===id)el.style.display=el.style.display==='none'?'block':'none'; else el.style.display='none'; });
}

function importOutlook() {
  const raw = document.getElementById('outlookPaste').value.trim();
  if (!raw) { toast('Paste some notification text first'); return; }
  const blocks = splitBlocks(raw);
  let added=0;
  blocks.forEach(b=>{ const d=parseBlock(b); if(d.firstName){addStudent({...d,source:'acuity'});added++;} });
  if (!added) { toast('No student data found — check the pasted text'); return; }
  document.getElementById('outlookPaste').value='';
  toggleBox('boxOutlook');
  toast(`${added} student${added!==1?'s':''} imported from Outlook`);
  renderAll();
}

function splitBlocks(text) {
  // Split on AcuityID= line boundaries — each booking ends with one
  const blocks=[]; let cur='';
  text.split('\n').forEach(line=>{
    cur+=line+'\n';
    if(/^AcuityID=/i.test(line.trim())){blocks.push(cur);cur='';}
  });
  if(cur.trim())blocks.push(cur);
  return blocks.length>1?blocks:[text];
}

function parseBlock(block) {
  const lines=block.split('\n').map(l=>l.trim());
  const get=(...pats)=>{ for(const p of pats)for(const l of lines){const m=l.match(p);if(m)return m[1].trim();} return ''; };

  // Name
  let firstName='',lastName='';
  const nameLine = get(/^Name:\s*(.+)/i);
  if(nameLine){const p=nameLine.split(/\s+/);firstName=p[0];lastName=p.slice(1).join(' ');}

  // Phone / Email / IDs
  const phone   = get(/^Phone:\s*(.+)/i, /^Mobile:\s*(.+)/i, /^Ph:\s*(.+)/i);
  const email   = get(/^Email:\s*(.+)/i);
  const certCode= get(/^Certificate Code:\s*(.+)/i);
  const acuityId= get(/AcuityID=(\d+)/i);

  // Postcode — look for 4-digit number after the === separator or in the postcode question line
  const postcodeMatch = block.match(/post.?code[^:]*:\s*.*?(\d{4})/i)
    || block.match(/region[^:]*:\s*.*?(\d{4})/i);
  const postcode = postcodeMatch ? postcodeMatch[1] : '';

  return {firstName,lastName,phone,email,postcode,certCode,acuityId};
}

function importNames() {
  const raw=document.getElementById('namesPaste').value.trim();
  if(!raw)return;
  let added=0;
  raw.split('\n').map(l=>l.trim()).filter(Boolean).forEach(line=>{
    const p=line.split(/\s+/);
    if(p[0]){addStudent({firstName:p[0],lastName:p.slice(1).join(' '),source:'manual'});added++;}
  });
  document.getElementById('namesPaste').value='';
  toggleBox('boxNames');
  toast(`${added} student${added!==1?'s':''} added`);
  renderAll();
}