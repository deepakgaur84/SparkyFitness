(() => {
  'use strict';

  const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  const CFG = window.MUSCLEMAP_CONFIG || {};
  const SPARKY = (CFG.sparkyUrl || '').replace(/\/+$/, '');

  // Muscle names exactly as used in the exercise dataset.
  const LABELS = {
    neck: 'Neck', traps: 'Traps', shoulders: 'Shoulders', chest: 'Chest',
    biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
    abdominals: 'Abs', 'middle back': 'Mid back', lats: 'Lats', 'lower back': 'Lower back',
    glutes: 'Glutes', quadriceps: 'Quads', hamstrings: 'Hamstrings',
    adductors: 'Inner thigh', abductors: 'Outer hip', calves: 'Calves'
  };

  // Right-hand half of each muscle (viewBox 0..200, centre line x=100). The left half is mirrored.
  const FRONT = {
    neck:       ['M100,52 L108,52 L111,66 L100,70 Z'],
    traps:      ['M111,66 L124,73 L128,78 L118,80 L108,72 Z'],
    shoulders:  ['M122,78 C138,76 152,84 156,106 L140,104 C134,100 126,94 122,86 Z'],
    chest:      ['M100,82 L122,86 C126,96 125,108 120,116 C112,122 105,122 100,120 Z'],
    abdominals: ['M100,124 L116,126 L123,132 L121,186 L115,192 L100,196 Z'],
    biceps:     ['M140,106 L156,108 L160,150 L144,152 Z'],
    forearms:   ['M144,155 L160,153 L168,212 L154,215 Z'],
    abductors:  ['M129,198 L139,204 L136,242 L128,238 Z'],
    quadriceps: ['M105,206 L128,204 L128,258 L124,310 L108,312 L105,254 Z'],
    adductors:  ['M100,200 L105,206 L108,270 L100,252 Z'],
    calves:     ['M108,322 L124,322 L122,380 L113,394 L108,380 Z']
  };
  const BACK = {
    neck:         ['M100,52 L108,52 L111,66 L100,70 Z'],
    traps:        ['M100,58 L111,66 L128,76 L116,94 L100,110 Z'],
    shoulders:    ['M122,78 C138,76 152,84 156,106 L140,104 C134,100 126,94 122,86 Z'],
    'middle back':['M100,112 L116,96 L121,118 L111,132 L100,134 Z'],
    lats:         ['M123,106 L133,101 L129,148 L114,166 L110,138 L121,122 Z'],
    'lower back': ['M100,136 L110,140 L113,168 L100,178 Z'],
    triceps:      ['M140,106 L156,108 L160,150 L144,152 Z'],
    forearms:     ['M144,155 L160,153 L168,212 L154,215 Z'],
    glutes:       ['M100,182 L128,184 C134,200 126,218 100,222 Z'],
    hamstrings:   ['M102,226 L129,224 L127,292 L123,310 L107,310 L103,262 Z'],
    calves:       ['M108,322 L124,322 L122,380 L113,394 L108,380 Z']
  };

  // Plain grey parts of the figure (head, hands, feet) so it reads as a body.
  const BASE_HALF = [
    'M100,48 L108,50 L112,66 L124,74 L130,80 L156,106 L160,150 L168,212 L166,228 L156,230 L154,216 L146,154 L142,104 L124,100 L122,118 L126,190 L130,198 L136,206 L130,260 L126,312 L124,322 L123,382 L114,398 L110,418 L100,420 Z'
  ];
  const HEAD = 'M100,8 C113,8 118,20 117,32 C116,44 109,52 100,52 C91,52 84,44 83,32 C82,20 87,8 100,8 Z';
  const HANDS_FEET = [
    'M154,214 L168,212 L172,236 L164,244 L156,236 Z',
    'M108,396 L122,396 L124,420 L108,422 Z'
  ];

  const MIRROR = 'matrix(-1 0 0 1 200 0)';
  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function figure(root, x, label, shapes) {
    const g = el('g', { transform: `translate(${x} 0)` }, root);
    el('text', { class: 'fig-label', x: 100, y: 438 }, g).textContent = label;
    el('path', { class: 'base', d: HEAD }, g);
    for (const d of BASE_HALF.concat(HANDS_FEET)) {
      el('path', { class: 'base', d }, g);
      el('path', { class: 'base', d, transform: MIRROR }, g);
    }
    for (const muscle of Object.keys(shapes)) {
      const m = el('g', {
        class: 'muscle', 'data-muscle': muscle, tabindex: 0, role: 'button',
        'aria-label': `${LABELS[muscle]} exercises`
      }, g);
      for (const d of shapes[muscle]) {
        el('path', { d }, m);
        el('path', { d, transform: MIRROR }, m);
      }
    }
  }

  function buildMap() {
    const svg = el('svg', { viewBox: '0 0 440 444', role: 'img', 'aria-label': 'Front and back of the body' });
    figure(svg, 0, 'FRONT', FRONT);
    figure(svg, 240, 'BACK', BACK);
    document.getElementById('map').appendChild(svg);
    return svg;
  }

  // ---- data + state ----
  const state = { data: [], muscle: null, includeHelpers: false, equipment: '', level: '' };
  const $ = id => document.getElementById(id);

  const equipLabel = e => (!e ? 'Other' : e === 'body only' ? 'Bodyweight' : e.charAt(0).toUpperCase() + e.slice(1));
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  function matches(ex, muscle, includeHelpers) {
    if (ex.primaryMuscles.includes(muscle)) return 1;
    if (includeHelpers && ex.secondaryMuscles.includes(muscle)) return 2;
    return 0;
  }

  function currentList() {
    const out = [];
    for (const ex of state.data) {
      const kind = matches(ex, state.muscle, state.includeHelpers);
      if (!kind) continue;
      if (state.equipment && (ex.equipment || 'other') !== state.equipment) continue;
      if (state.level && ex.level !== state.level) continue;
      out.push({ ex, kind });
    }
    out.sort((a, b) =>
      a.kind - b.kind ||
      (a.ex.mechanic === 'compound' ? 0 : 1) - (b.ex.mechanic === 'compound' ? 0 : 1) ||
      a.ex.name.localeCompare(b.ex.name));
    return out;
  }

  function fillEquipment() {
    const sel = $('equipment');
    const keep = state.equipment;
    const set = new Set();
    for (const ex of state.data) {
      if (matches(ex, state.muscle, state.includeHelpers)) set.add(ex.equipment || 'other');
    }
    sel.innerHTML = '';
    sel.appendChild(new Option('Any', ''));
    [...set].sort().forEach(e => sel.appendChild(new Option(equipLabel(e), e)));
    state.equipment = set.has(keep) ? keep : '';
    sel.value = state.equipment;
  }

  function card(ex, kind) {
    const li = document.createElement('li');
    const d = document.createElement('details');
    const s = document.createElement('summary');

    const left = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'ex-name';
    name.textContent = ex.name;
    const tags = document.createElement('div');
    tags.className = 'tags';
    const t = (txt, cls) => { const x = document.createElement('span'); x.className = 'tag' + (cls ? ' ' + cls : ''); x.textContent = txt; tags.appendChild(x); };
    t(equipLabel(ex.equipment));
    if (ex.level) t(cap(ex.level));
    if (ex.mechanic) t(cap(ex.mechanic));
    if (kind === 2) t('Helper muscle', 'helper');
    left.append(name, tags);

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '▸';
    s.append(left, caret);
    d.appendChild(s);

    const body = document.createElement('div');
    body.className = 'ex-body';
    d.appendChild(body);

    // Build the heavy part only when opened.
    d.addEventListener('toggle', () => {
      if (!d.open || body.childElementCount) return;
      if (ex.images && ex.images.length) {
        const imgs = document.createElement('div');
        imgs.className = 'imgs';
        ex.images.forEach((p, i) => {
          const im = document.createElement('img');
          im.loading = 'lazy';
          im.alt = `${ex.name} step ${i + 1}`;
          im.src = IMG_BASE + p;
          im.onerror = () => im.remove();
          imgs.appendChild(im);
        });
        body.appendChild(imgs);
      }
      if (ex.secondaryMuscles.length) {
        const p = document.createElement('p');
        p.className = 'sec';
        p.textContent = 'Also works: ' + ex.secondaryMuscles.map(m => LABELS[m] || cap(m)).join(', ');
        body.appendChild(p);
      }
      if (ex.instructions && ex.instructions.length) {
        const ol = document.createElement('ol');
        ex.instructions.forEach(step => { const li2 = document.createElement('li'); li2.textContent = step; ol.appendChild(li2); });
        body.appendChild(ol);
      }
      const actions = document.createElement('div');
      actions.className = 'actions';
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn small ghost';
      copy.textContent = 'Copy name';
      copy.onclick = () => copyText(ex.name, copy);
      actions.appendChild(copy);
      if (SPARKY) {
        const a = document.createElement('a');
        a.className = 'btn small';
        a.href = SPARKY + '/exercises';
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Log in SparkyFitness';
        actions.appendChild(a);
      }
      body.appendChild(actions);
    });

    li.appendChild(d);
    return li;
  }

  function copyText(text, btn) {
    const done = () => { const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = o), 1200); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
    ta.remove();
  }

  function renderList() {
    const list = $('list');
    list.innerHTML = '';
    const items = currentList();
    $('muscleCount').textContent = `${items.length} exercise${items.length === 1 ? '' : 's'}`;
    if (!items.length) {
      const p = document.createElement('li');
      p.className = 'none';
      p.textContent = 'No exercises match these filters.';
      list.appendChild(p);
      return;
    }
    const frag = document.createDocumentFragment();
    items.forEach(({ ex, kind }) => frag.appendChild(card(ex, kind)));
    list.appendChild(frag);
  }

  function select(muscle, scroll) {
    if (!LABELS[muscle]) return;
    state.muscle = muscle;
    $('empty').hidden = true;
    $('results').hidden = false;
    $('muscleTitle').textContent = LABELS[muscle];
    document.querySelectorAll('.muscle').forEach(n => n.classList.toggle('active', n.dataset.muscle === muscle));
    document.querySelectorAll('.chip').forEach(n => n.classList.toggle('active', n.dataset.muscle === muscle));
    fillEquipment();
    renderList();
    if (location.hash !== '#' + encodeURIComponent(muscle)) history.replaceState(null, '', '#' + encodeURIComponent(muscle));
    if (scroll && window.matchMedia('(max-width: 760px)').matches) {
      $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function buildChips() {
    const box = $('chips');
    Object.keys(LABELS).forEach(m => {
      const n = state.data.filter(e => e.primaryMuscles.includes(m)).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.muscle = m;
      b.innerHTML = '';
      b.append(LABELS[m]);
      const sm = document.createElement('small');
      sm.textContent = n;
      b.appendChild(sm);
      b.onclick = () => select(m, true);
      box.appendChild(b);
    });
  }

  function wire(svg) {
    svg.addEventListener('click', e => {
      const g = e.target.closest('.muscle');
      if (g) select(g.dataset.muscle, true);
    });
    svg.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest('.muscle');
      if (g) { e.preventDefault(); select(g.dataset.muscle, true); }
    });
    $('modePrimary').onclick = () => setMode(false);
    $('modeAll').onclick = () => setMode(true);
    $('equipment').onchange = e => { state.equipment = e.target.value; renderList(); };
    $('level').onchange = e => { state.level = e.target.value; renderList(); };
    window.addEventListener('hashchange', () => {
      const m = decodeURIComponent(location.hash.slice(1));
      if (LABELS[m] && m !== state.muscle) select(m, false);
    });
  }

  function setMode(all) {
    state.includeHelpers = all;
    $('modePrimary').classList.toggle('on', !all);
    $('modeAll').classList.toggle('on', all);
    if (state.muscle) { fillEquipment(); renderList(); }
  }

  async function init() {
    const svg = buildMap();
    if (SPARKY) {
      const top = $('sparkyTop');
      top.href = SPARKY;
      top.hidden = false;
    }
    try {
      const res = await fetch('exercises.json');
      state.data = await res.json();
    } catch (e) {
      $('empty').innerHTML = '<p>Could not load the exercise list.</p>';
      return;
    }
    buildChips();
    wire(svg);
    const start = decodeURIComponent(location.hash.slice(1));
    if (LABELS[start]) select(start, false);
  }

  init();
})();
