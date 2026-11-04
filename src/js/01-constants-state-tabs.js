
// ════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════
const CLAY = ['White Stoneware','Buff Stoneware'];
const GLAZES = [
  'White gloss, thick',
  'White gloss, thin',
  'Green',
  'Matt White',
  'Matt White, thin',
  'Yellow Ash',
  'Opal',
  'Pink',
  'Turquoise',
  'Black-Brown',
  'Blue on Black'
];
// Old glaze names -> current names, applied when an Excel backup is restored so
// older class records pick up the new naming. Horsley Matt and Blanc Cremeau
// have no current equivalent: they are left as saved and shown in the dropdown
// as "(previous name)".
const GLAZE_RENAMES = {
  'Moon White (gloss, thick)': 'White gloss, thick',
  'Moon White (gloss, thin)':  'White gloss, thin',
  'Bottle Green (clear)':      'Green',
  'EC Matt':                   'Matt White',
  'EC Matt, very thin':        'Matt White, thin',
  'Chrome Pink':               'Pink',
  'Turquoise Matt':            'Turquoise',
  'Black-Brown (Tenmoku)':     'Black-Brown'
};


// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
let students = [];
let potsView = 'grid';   // Pots & Glazes tab view: 'grid' (mirrors the printed glaze sheet) or 'list'
let uid = 1;

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  const t = new Date();
  document.getElementById('classDate').value = t.toISOString().split('T')[0];
  document.getElementById('headerDate').textContent =
    t.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  renderAll();
});

// ════════════════════════════════════════
// TABS
// ════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  const idx = ['setup','roll','pots','print'].indexOf(name);
  document.querySelectorAll('.tab-btn')[idx].classList.add('active');
  renderAll();
}