(() => {
  'use strict';

  const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  const CFG = window.MUSCLEMAP_CONFIG || {};
  const SPARKY = (CFG.sparkyUrl || '').replace(/\/+$/, '');

  const QUOTES = [
    'Pick a muscle. Make it count.',
    'Strong is built one rep at a time.',
    'Show up. Lift. Repeat.',
    "Today's effort is tomorrow's strength.",
    'No shortcuts, just reps.',
    'Earn the pump.',
    'Small sets, big progress.',
    'Consistency beats intensity.',
    'The last rep is where it counts.',
    'Do it for the version of you that is coming.',
    'Train like it matters.',
    'Progress, not perfection.'
  ];

  // Muscle names exactly as used in the exercise dataset.
  const LABELS = {
    neck: 'Neck', traps: 'Traps', shoulders: 'Shoulders', chest: 'Chest',
    biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
    abdominals: 'Abs', 'middle back': 'Mid back', lats: 'Lats', 'lower back': 'Lower back',
    glutes: 'Glutes', quadriceps: 'Quads', hamstrings: 'Hamstrings',
    adductors: 'Inner thigh', abductors: 'Outer hip', calves: 'Calves'
  };

  // One colour per muscle group, so the body reads like an anatomy chart.
  const COLORS = {
    neck: '#6366f1', traps: '#8b5cf6', shoulders: '#f59e0b', chest: '#ef4444',
    biceps: '#f97316', triceps: '#ec4899', forearms: '#14b8a6', abdominals: '#3b82f6',
    'middle back': '#22c55e', lats: '#06b6d4', 'lower back': '#84cc16', glutes: '#d946ef',
    quadriceps: '#10b981', hamstrings: '#eab308', adductors: '#f472b6', abductors: '#a3e635',
    calves: '#38bdf8'
  };

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Each figure is drawn in a 1000 x 2000 box (shapes come from body-data.js).
  function figure(root, x, label, shapes) {
    const g = el('g', { transform: `translate(${x} 0)` }, root);
    el('text', { class: 'fig-label', x: 500, y: 2275 }, g).textContent = label;
    const groups = {};
    for (const s of shapes) {
      if (!s.m) { el('polygon', { class: 'base', points: s.p }, g); continue; }
      if (!groups[s.m]) {
        groups[s.m] = el('g', {
          class: 'muscle', 'data-muscle': s.m, tabindex: 0, role: 'button',
          'aria-label': `${LABELS[s.m]} exercises`, style: `--c:${COLORS[s.m]}`
        }, g);
      }
      el('polygon', { class: 'fill', points: s.p }, groups[s.m]);
    }
  }

  function buildMap() {
    const svg = el('svg', { viewBox: '-20 -20 2080 2340', role: 'img', 'aria-label': 'Front and back of the body' });
    figure(svg, 0, 'FRONT', window.BODY.anterior);
    figure(svg, 1040, 'BACK', window.BODY.posterior);
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
    $('muscleTitle').style.borderLeftColor = COLORS[muscle];
    document.querySelector('#map svg').classList.add('has-active');
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
      b.style.setProperty('--c', COLORS[m]);
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

  function showQuote() {
    // A new line each day, same all day.
    const day = Math.floor(Date.now() / 86400000);
    $('quote').textContent = QUOTES[day % QUOTES.length];
  }

  async function init() {
    showQuote();
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
