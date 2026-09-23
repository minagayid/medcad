const parts = [
  { id: 'socket', name: 'Transtibial socket', kind: 'Socket shell', category: 'Lower limb', meta: 'PE-101', thumb: 'socket', desc: 'Lower limb · parametric', length: 420, thickness: 4.5, radius: 8, color: '#d27650' },
  { id: 'cranial', name: 'Cranial plate', kind: 'Contour plate', category: 'Craniofacial', meta: 'CF-204', thumb: 'cranial', desc: 'Craniofacial · contour', length: 142, thickness: 3.2, radius: 5, color: '#9fb9dc' },
  { id: 'finger', name: 'Finger phalanx', kind: 'Joint segment', category: 'Upper limb', meta: 'UL-031', thumb: 'finger', desc: 'Upper limb · joint study', length: 52, thickness: 2.6, radius: 2.5, color: '#95d3a0' },
  { id: 'orbit', name: 'Orbital rim', kind: 'Rim support', category: 'Craniofacial', meta: 'CF-118', thumb: 'orbit', desc: 'Craniofacial · rim support', length: 76, thickness: 2.8, radius: 4, color: '#d6ad74' },
  { id: 'blank', name: 'Custom blank', kind: 'Start from volume', category: 'All', meta: 'CUSTOM', thumb: 'blank', desc: 'Custom · empty study', length: 100, thickness: 4, radius: 6, color: '#b6c2bc' },
];

const state = {
  selectedPart: 'socket', category: 'All', query: '', tool: 'select', view: 'solid', grid: true,
  yaw: -0.32, pitch: -0.1, zoom: 1, dragging: false, lastX: 0, lastY: 0, history: [], historyIndex: -1,
  length: 420, thickness: 4.5, radius: 8, symmetry: true, plane: true,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canvas = $('#modelCanvas');
const ctx = canvas.getContext('2d');

function currentPart() { return parts.find((part) => part.id === state.selectedPart) || parts[0]; }
function toast(message) { const element = $('#toast'); element.textContent = message; element.classList.add('is-visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('is-visible'), 2200); }

function renderLibrary() {
  const filtered = parts.filter((part) => {
    const matchesCategory = state.category === 'All' || part.category === state.category;
    const haystack = `${part.name} ${part.kind} ${part.category}`.toLowerCase();
    return matchesCategory && haystack.includes(state.query.toLowerCase());
  });
  $('#libraryList').innerHTML = filtered.map((part) => `
    <button class="library-card ${part.id === state.selectedPart ? 'is-selected' : ''}" data-part="${part.id}">
      <span class="part-thumbnail ${part.thumb}" style="--part-accent:${part.color}"></span>
      <span class="library-card-copy"><strong>${part.name}</strong><small>${part.kind}</small></span>
      <span class="library-card-meta">${part.meta}</span>
    </button>`).join('') || '<div class="empty-library">No starter geometry matches that search.</div>';
  $$('.library-card').forEach((button) => button.addEventListener('click', () => selectPart(button.dataset.part)));
}

function selectPart(id) {
  const part = parts.find((item) => item.id === id) || parts[0];
  state.selectedPart = part.id; state.length = part.length; state.thickness = part.thickness; state.radius = part.radius;
  pushHistory(); renderLibrary(); renderProperties(); resizeCanvas(); toast(`${part.name} loaded into the scene`);
}

function renderProperties() {
  const part = currentPart();
  $('#propertyTitle').textContent = part.name; $('#objectName').textContent = part.kind; $('#objectDescriptor').textContent = part.desc;
  $('#lengthSlider').value = state.length; $('#thicknessSlider').value = state.thickness; $('#radiusSlider').value = state.radius;
  $('#lengthOutput').textContent = `${Number(state.length).toFixed(1)} mm`; $('#thicknessOutput').textContent = `${Number(state.thickness).toFixed(1)} mm`; $('#radiusOutput').textContent = `${Number(state.radius).toFixed(1)} mm`;
  $('#measureValue').textContent = Number(state.length).toFixed(1);
  $('#symmetryToggle').classList.toggle('is-on', state.symmetry); $('#symmetryToggle').setAttribute('aria-checked', state.symmetry);
  $('#planeToggle').classList.toggle('is-on', state.plane); $('#planeToggle').setAttribute('aria-checked', state.plane);
  renderValidation();
}

function renderValidation() {
  const minWall = state.thickness >= 3;
  const passes = minWall && state.length >= 30;
  $('#validationCard').innerHTML = `<div class="validation-icon">${passes ? '✓' : '!'}</div><div><strong>${passes ? 'Starter checks passed' : 'Review wall thickness'}</strong><p>${passes ? 'Solid wall · no open edges · within envelope' : 'Increase wall thickness before export'}</p></div>`;
  $('#validationCard').style.borderColor = passes ? 'rgba(149,211,160,.25)' : 'rgba(210,118,80,.55)';
  $('#validationMessage').textContent = passes ? 'Geometry within starter envelope' : 'Geometry needs review before export';
  $('#validationMessage').style.color = passes ? '' : 'var(--copper)';
}

function pushHistory() {
  const snapshot = JSON.stringify({ selectedPart: state.selectedPart, length: state.length, thickness: state.thickness, radius: state.radius, symmetry: state.symmetry, plane: state.plane });
  state.history = state.history.slice(0, state.historyIndex + 1); state.history.push(snapshot); state.historyIndex = state.history.length - 1;
}
function restoreHistory(index) { if (index < 0 || index >= state.history.length) return; Object.assign(state, JSON.parse(state.history[index])); state.historyIndex = index; renderLibrary(); renderProperties(); drawViewport(); }

function drawGrid(width, height) {
  if (!state.grid) return;
  ctx.save(); ctx.globalAlpha = .24; ctx.strokeStyle = '#304048'; ctx.lineWidth = 1;
  const centerX = width / 2, centerY = height * .53, step = Math.max(18, 28 * state.zoom);
  for (let x = centerX % step; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = centerY % step; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.globalAlpha = .55; ctx.strokeStyle = '#4b6566'; ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke(); ctx.restore();
}

function project(x, y, z, scale, centerX, centerY) {
  const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw), cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
  const x1 = x * cy - z * sy, z1 = x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
  const perspective = 1 + z2 / 1100;
  return { x: centerX + x1 * scale * perspective, y: centerY - y1 * scale * perspective, depth: z2 };
}

function drawMesh() {
  const width = canvas.width / devicePixelRatio, height = canvas.height / devicePixelRatio, cx = width / 2, cy = height * .52;
  const part = currentPart(), size = Math.min(width, height) * .00113 * state.zoom * (part.id === 'socket' ? 1 : .9);
  const halfLength = state.length * .46, wide = Math.max(22, state.length * .21), depth = Math.max(30, state.length * .18);
  const layers = 18, rings = [];
  for (let i = 0; i <= layers; i++) {
    const y = -halfLength + (i / layers) * halfLength * 2;
    const taper = i / layers; const radius = wide * (0.72 + .34 * Math.sin(taper * Math.PI)) * (1 - .12 * taper);
    const ring = [];
    for (let j = 0; j < 22; j++) { const a = (j / 22) * Math.PI * 2; ring.push(project(Math.cos(a) * radius * (1 + .12 * Math.cos(a)), y, Math.sin(a) * depth * (1 + .1 * Math.sin(a)), size, cx, cy)); }
    rings.push(ring);
  }
  const base = state.view === 'xray' ? 'rgba(159,185,220,.17)' : 'rgba(229,222,210,.78)';
  const edge = state.view === 'xray' ? 'rgba(159,185,220,.6)' : 'rgba(229,222,210,.82)';
  ctx.save();
  for (let i = 0; i < layers; i++) {
    for (let j = 0; j < 22; j++) {
      const p1 = rings[i][j], p2 = rings[i][(j + 1) % 22], p3 = rings[i + 1][(j + 1) % 22], p4 = rings[i + 1][j];
      const shade = Math.max(.16, Math.min(.85, .35 + (p1.depth + p2.depth + p3.depth + p4.depth) / 1600));
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
      ctx.fillStyle = state.view === 'wire' ? 'transparent' : `rgba(229,222,210,${shade * (state.view === 'xray' ? .35 : .6)})`;
      ctx.fill(); ctx.strokeStyle = edge; ctx.globalAlpha = state.view === 'wire' ? .52 : .22; ctx.lineWidth = state.view === 'wire' ? 1 : .5; ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const outline = [rings[0][0], ...rings[Math.floor(layers / 2)].slice(0, 12), rings[layers][12]];
  ctx.strokeStyle = part.color; ctx.lineWidth = 2; ctx.setLineDash([3, 7]); ctx.beginPath(); outline.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
  if (state.symmetry) { ctx.strokeStyle = 'rgba(149,211,160,.62)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); const top = project(0, -halfLength * .98, 0, size, cx, cy), bottom = project(0, halfLength * .98, 0, size, cx, cy); ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke(); ctx.setLineDash([]); }
  if (state.plane) { ctx.strokeStyle = 'rgba(159,185,220,.22)'; ctx.beginPath(); ctx.ellipse(cx, cy + 3, wide * size * 1.05, depth * size * .52, -.12, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function drawViewport() {
  const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
  canvas.width = Math.round(rect.width * devicePixelRatio); canvas.height = Math.round(rect.height * devicePixelRatio); ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = '#101a21'; ctx.fillRect(0, 0, rect.width, rect.height); drawGrid(rect.width, rect.height);
  const glow = ctx.createRadialGradient(rect.width / 2, rect.height * .5, 20, rect.width / 2, rect.height * .5, Math.min(rect.width, rect.height) * .48); glow.addColorStop(0, 'rgba(149,211,160,.055)'); glow.addColorStop(1, 'rgba(149,211,160,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, rect.width, rect.height);
  drawMesh();
}
function resizeCanvas() { requestAnimationFrame(drawViewport); }

function createMeshText(type) {
  const part = currentPart(), s = Math.max(1, state.length / 140), h = state.length * .8, w = state.length * .42, d = state.length * .34;
  const verts = [[-w,0,-d],[w,0,-d],[w,0,d],[-w,0,d],[-w,h,-d*.72],[w,h,-d*.72],[w,h,d*.72],[-w,h,d*.72]];
  const faces = [[1,2,6,5],[0,4,7,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,2,1]];
  if (type === 'obj') return `# pro-esthetic export\n# ${part.name} · starter geometry\n${verts.map(v => `v ${v.map((n) => n.toFixed(3)).join(' ')}`).join('\n')}\n${faces.map(f => `f ${f.map((n) => n + 1).join(' ')}`).join('\n')}\n`;
  const triangles = faces.flatMap((face) => [[face[0], face[1], face[2]], [face[0], face[2], face[3]]]);
  const lines = ['solid pro_esthetic']; triangles.forEach(([a,b,c]) => { const v1=verts[a], v2=verts[b], v3=verts[c]; lines.push(`facet normal 0 0 0`, ' outer loop', `  vertex ${v1.join(' ')}`, `  vertex ${v2.join(' ')}`, `  vertex ${v3.join(' ')}`, ' endloop', 'endfacet'); }); lines.push('endsolid pro_esthetic'); return lines.join('\n');
}
function download(name, body, type) { const blob = new Blob([body], { type }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function downloadDataUrl(name, dataUrl) { const link = document.createElement('a'); link.href = dataUrl; link.download = name; link.click(); }
function exportMesh() { const extension = $('#exportButton').dataset.type || 'stl'; const format = extension === 'obj' ? 'obj' : 'stl'; download(`pro-esthetic-${currentPart().id}.${format}`, createMeshText(format), format === 'obj' ? 'text/plain' : 'model/stl'); toast(`Starter ${format.toUpperCase()} exported · review before manufacture`); }

$$('.rail-button[data-tool]').forEach((button) => button.addEventListener('click', () => { $$('.rail-button[data-tool]').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); state.tool = button.dataset.tool; $('#toolLabel').textContent = `${button.dataset.tool.toUpperCase()} / OBJECT`; if (state.tool === 'reference') openAtlas(); else toast(`${button.textContent.trim()} tool active`); }));
$$('.filter-chip').forEach((button) => button.addEventListener('click', () => { $$('.filter-chip').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); state.category = button.dataset.category; renderLibrary(); }));
$$('.view-mode').forEach((button) => button.addEventListener('click', () => { $$('.view-mode').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); state.view = button.dataset.view; drawViewport(); }));
$('#librarySearch').addEventListener('input', (event) => { state.query = event.target.value; renderLibrary(); });
[['#lengthSlider','length','lengthOutput',' mm'],['#thicknessSlider','thickness','thicknessOutput',' mm'],['#radiusSlider','radius','radiusOutput',' mm']].forEach(([selector, key, output, suffix]) => $(selector).addEventListener('input', (event) => { state[key] = Number(event.target.value); $(output).textContent = `${state[key].toFixed(1)}${suffix}`; if (key === 'length') $('#measureValue').textContent = state[key].toFixed(1); renderValidation(); drawViewport(); }));
['#symmetryToggle','#planeToggle'].forEach((selector) => $(selector).addEventListener('click', () => { const key = selector.includes('symmetry') ? 'symmetry' : 'plane'; state[key] = !state[key]; renderProperties(); drawViewport(); }));
$('#resetGeometry').addEventListener('click', () => { const part = currentPart(); state.length = part.length; state.thickness = part.thickness; state.radius = part.radius; renderProperties(); drawViewport(); toast('Geometry reset to starter values'); });
$('#gridButton').addEventListener('click', () => { state.grid = !state.grid; drawViewport(); toast(state.grid ? 'Construction grid shown' : 'Construction grid hidden'); });
$('#fitButton').addEventListener('click', () => { state.zoom = 1; state.yaw = -.32; state.pitch = -.1; drawViewport(); toast('Viewport fitted to object'); });
$('#viewport').addEventListener('pointerdown', (event) => { state.dragging = true; state.lastX = event.clientX; state.lastY = event.clientY; $('#viewport').setPointerCapture(event.pointerId); });
$('#viewport').addEventListener('pointermove', (event) => { if (!state.dragging) return; state.yaw += (event.clientX - state.lastX) * .008; state.pitch = Math.max(-.8, Math.min(.8, state.pitch + (event.clientY - state.lastY) * .006)); state.lastX = event.clientX; state.lastY = event.clientY; drawViewport(); });
$('#viewport').addEventListener('pointerup', () => { state.dragging = false; });
$('#viewport').addEventListener('wheel', (event) => { event.preventDefault(); state.zoom = Math.max(.62, Math.min(1.7, state.zoom - event.deltaY * .001)); drawViewport(); }, { passive: false });
$('#viewport').addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'r') { state.zoom = 1; state.yaw = -.32; state.pitch = -.1; drawViewport(); } });
$('#exportButton').addEventListener('click', exportMesh); $('#exportStlButton').addEventListener('click', exportMesh);
$('#saveButton').addEventListener('click', () => { localStorage.setItem('pro-esthetic-snapshot', JSON.stringify(state)); toast('Snapshot saved locally'); });
$('#validateButton').addEventListener('click', () => { renderValidation(); toast($('#validationMessage').textContent); });
$('#undoButton').addEventListener('click', () => { restoreHistory(state.historyIndex - 1); toast('Previous geometry state restored'); }); $('#redoButton').addEventListener('click', () => { restoreHistory(state.historyIndex + 1); toast('Next geometry state restored'); });

function openAtlas() { $('#atlasModal').showModal(); }
function closeAtlas() { $('#atlasModal').close(); }
function openHelp() { $('#helpModal').showModal(); }
$('#referenceAtlasButton').addEventListener('click', openAtlas); $('#closeAtlas').addEventListener('click', closeAtlas); $('#helpButton').addEventListener('click', openHelp); $('#closeHelp').addEventListener('click', () => $('#helpModal').close());
$('#importReferenceButton').addEventListener('click', () => $('#referenceInput').click()); $('#referenceInput').addEventListener('change', (event) => { const file = event.target.files[0]; if (file) { closeAtlas(); toast(`Reference queued · ${file.name}`); } });
$$('[data-atlas-action]').forEach((button) => button.addEventListener('click', () => toast(`${button.dataset.atlasAction} notes are in the reference notebook`)));
$('#addPartButton').addEventListener('click', () => { selectPart('blank'); toast('Custom blank added · shape it in the viewport'); });
$('#menuButton').addEventListener('click', openHelp); $('#cameraButton').addEventListener('click', () => { downloadDataUrl('pro-esthetic-viewport.png', canvas.toDataURL('image/png')); toast('Viewport image captured'); });
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); $('#librarySearch').focus(); } if (event.key === 'Escape') { if ($('#atlasModal').open) closeAtlas(); if ($('#helpModal').open) $('#helpModal').close(); } });
window.addEventListener('resize', resizeCanvas);

pushHistory(); renderLibrary(); renderProperties(); resizeCanvas();
