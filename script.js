/* ==========================================================================
   devtint portfolio: client-side rendering and routing
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  initThemeSwitcher();
  initCopyrightYear();
  initSubpathRouter();
  initLightbox();
  initPixelArt();

  showLoadingSkeletons();
  await loadPortfolioData();
  window.dispatchEvent(new Event('pixelart:redraw'));
});


/**
 * Shows placeholder rows before portfolio data has loaded.
 */
function showLoadingSkeletons() {
  const containers = {
    'projects-container': 4,
    'flagship-projects-container': 3,
    'tools-container': 3,
    'bots-container': 2,
    'activities-container': 1,
    'disclosures-container': 1
  };
  Object.entries(containers).forEach(([id, count]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const tag = el.tagName === 'UL' ? 'li' : 'div';
    el.innerHTML = `
      <${tag} class="skeleton" aria-hidden="true">
        <span class="skeleton-line short"></span>
        <span class="skeleton-line long"></span>
        <span class="skeleton-line medium"></span>
      </${tag}>`.repeat(count);
  });
}

let portfolioCache = {
  projects: [],
  tools: [],
  bots: [],
  activities: [],
  disclosures: []
};

async function loadPortfolioData() {
  const names = ["projects", "tools", "bots", "disclosures", "activities"];
  const results = await Promise.all(names.map(async name => {
    try {
      const response = await fetch("/data/" + name + ".json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } catch (err) {
      console.warn("Failed to load " + name + ".json", err);
      return [];
    }
  }));
  names.forEach((name, i) => { portfolioCache[name] = results[i]; });

  renderProjects(portfolioCache.projects);
  renderTools(portfolioCache.tools);
  renderBots(portfolioCache.bots);
  renderActivities(portfolioCache.activities);
  renderDisclosures(portfolioCache.disclosures);
}

/**
 * Turns repository style names (SOME_REPO_NAME) into breakable text.
 */
function formatTitle(title) {
  return escapeHTML(title).replace(/_/g, '_<wbr>');
}

function externalLink(url, label) {
  return url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>` : '';
}

function entryHtml({ kicker, title, summary, impact, tech, links }) {
  const linksHtml = (links || []).filter(Boolean).join('');
  return `
          <li class="entry">
            <span class="entry-kicker">${escapeHTML(kicker || '')}</span>
            <div class="entry-body">
              <h3 class="entry-title">${formatTitle(title || '')}</h3>
              ${summary ? `<p class="entry-text">${escapeHTML(summary)}</p>` : ''}
              ${impact ? `<p class="entry-meta">${escapeHTML(impact)}</p>` : ''}
              ${Array.isArray(tech) && tech.length ? `<p class="entry-meta">${tech.map(escapeHTML).join(', ')}</p>` : ''}
              ${linksHtml ? `<p class="entry-links">${linksHtml}</p>` : ''}
            </div>
          </li>`;
}

function renderProjects(data) {
  const container = document.getElementById('projects-container');
  const flagshipContainer = document.getElementById('flagship-projects-container');
  if (!container && !flagshipContainer) return;

  const FLAGSHIP_LIMIT = 4;
  let projectsHtml = '';
  let flagshipHtml = '';
  let flagshipCount = 0;

  data.forEach(p => {
    const html = entryHtml({
      kicker: p.category,
      title: p.title,
      summary: p.what_it_does,
      impact: p.business_impact,
      tech: p.tech_stack,
      links: [externalLink(p.live_url, 'Live site'), externalLink(p.github_url, 'Source code')]
    });

    projectsHtml += html;
    if (p.is_flagship && flagshipCount < FLAGSHIP_LIMIT) {
      flagshipHtml += entryHtml({
        kicker: p.category,
        title: p.title,
        summary: p.what_it_does,
        links: [externalLink(p.live_url, 'Live site'), externalLink(p.github_url, 'Source code')]
      });
      flagshipCount++;
    }
  });

  if (container) container.innerHTML = projectsHtml;
  if (flagshipContainer) flagshipContainer.innerHTML = flagshipHtml;
}

function renderTools(data) {
  const container = document.getElementById('tools-container');
  if (!container) return;

  container.innerHTML = data.map(t => entryHtml({
    kicker: t.category,
    title: t.title,
    summary: t.what_it_does,
    impact: t.business_impact,
    tech: t.tech_stack,
    links: [externalLink(t.github_url, t.title === 'WarpConfGen & Web API' ? 'API documentation' : 'Source code')]
  })).join('');
}

function renderBots(data) {
  const container = document.getElementById('bots-container');
  if (!container) return;

  container.innerHTML = data.map(b => entryHtml({
    kicker: b.category,
    title: b.title,
    summary: b.what_it_does,
    impact: b.business_impact,
    tech: b.tech_stack,
    links: [externalLink(b.telegram_url, 'Open in Telegram')]
  })).join('');
}

function formatDate(value) {
  const date = new Date(value);
  return value && !isNaN(date)
    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : (value || '');
}

function renderActivities(data) {
  const container = document.getElementById('activities-container');
  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<p class="empty-state"><canvas class="pixel-glyph" aria-hidden="true"></canvas>Activities will be added here soon.</p>`;
    return;
  }

  const sorted = [...data].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  container.innerHTML = sorted.map((a, i) => {
    const meta = [a.role, a.organization, a.location].filter(Boolean).map(escapeHTML).join(', ');
    return `
      ${i > 0 ? '<canvas class="pixel-row" aria-hidden="true"></canvas>' : ''}
      <article class="record">
        ${a.date ? `<time class="record-kicker" datetime="${escapeHTML(a.date)}">${escapeHTML(formatDate(a.date))}</time>` : ''}
        <h2 class="record-title">${escapeHTML(a.title)}</h2>
        ${meta ? `<p class="record-sub">${meta}</p>` : ''}
        ${a.image_url ? `
        <button type="button" class="record-figure" aria-label="Open image for ${escapeHTML(a.title)}" data-cert-image="${escapeHTML(a.image_url)}">
          <img src="${escapeHTML(a.image_url)}" alt="${escapeHTML(a.title)}" loading="lazy" decoding="async">
        </button>` : ''}
        ${a.description ? `<p class="record-text">${escapeHTML(a.description)}</p>` : ''}
        ${a.url ? `<p class="entry-links">${externalLink(a.url, 'Learn more')}</p>` : ''}
      </article>`;
  }).join('');
}

function renderDisclosures(data, activeRoute = null) {
  const container = document.getElementById('disclosures-container');
  const dirGrid = document.getElementById('disclosures-directory-grid');
  const listView = document.getElementById('disclosures-list-view');
  if (!container) return;

  const currentPath = (activeRoute || window.location.pathname).toLowerCase().replace(/\/$/, '') || '/';
  const isRootDisclosures = currentPath === '/disclosures';

  if (dirGrid) dirGrid.hidden = !isRootDisclosures;
  const backRow = listView ? listView.querySelector('.back-row') : null;
  if (backRow) backRow.hidden = isRootDisclosures;

  const category = isRootDisclosures ? 'all' : currentPath.split('/').pop();
  const filtered = category === 'all' ? data : data.filter(d => (d.program_type || '').toLowerCase() === category);

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-state"><canvas class="pixel-glyph" aria-hidden="true"></canvas>Nothing published in this category yet.</p>`;
    return;
  }

  container.innerHTML = (isRootDisclosures ? '<canvas class="pixel-row" aria-hidden="true"></canvas>' : '') + filtered.map((d, i) => {
    const isCert = d.program_type === 'certifications';

    let findingsHtml = '';
    if (Array.isArray(d.findings) && d.findings.length > 0) {
      findingsHtml = `
        <h3 class="record-subhead">Reported findings</h3>
        <ul class="findings-list">${d.findings.map(f => `
          <li>
            <span class="finding-title">${escapeHTML(f.title)}</span>
            <span class="finding-meta">${[f.severity ? f.severity + ' severity' : '', f.status, f.date].filter(Boolean).map(escapeHTML).join(', ')}</span>
          </li>`).join('')}
        </ul>`;
    }

    const certId = d.verify_url
      ? `<a href="${escapeHTML(d.verify_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(d.cert_id)}</a>`
      : escapeHTML(d.cert_id || 'N/A');

    return `
      ${i > 0 ? '<canvas class="pixel-row" aria-hidden="true"></canvas>' : ''}
      <article class="record">
        <span class="record-kicker">${escapeHTML(formatDate(d.issue_date))}</span>
        <h2 class="record-title">${escapeHTML(d.title)}</h2>
        <p class="record-sub">${escapeHTML(d.organization)}</p>
        <p class="record-text">${escapeHTML(d.description)}</p>
        <dl class="meta-table">
          ${d.vulnerabilities ? `<div class="meta-row"><dt>${isCert ? 'Focus' : 'Issues'}</dt><dd>${escapeHTML(d.vulnerabilities)}</dd></div>` : ''}
          <div class="meta-row"><dt>Certificate ID</dt><dd class="mono">${certId}</dd></div>
          ${d.signed_by ? `<div class="meta-row"><dt>Signed by</dt><dd>${escapeHTML(d.signed_by)}</dd></div>` : ''}
          ${d.sha256 && d.sha256 !== d.cert_id ? `<div class="meta-row"><dt>SHA-256</dt><dd class="mono">${escapeHTML(d.sha256)}</dd></div>` : ''}
        </dl>
        ${findingsHtml}
        ${d.image_url ? `
        <button type="button" class="record-figure" aria-label="Open certificate for ${escapeHTML(d.title)}" data-cert-image="${escapeHTML(d.image_url)}">
          <img src="${escapeHTML(d.image_url)}" alt="Certificate for ${escapeHTML(d.title)}" loading="lazy" decoding="async">
        </button>` : ''}
        ${d.verify_url || d.live_url ? `
        <p class="entry-links">${externalLink(d.verify_url, 'Verify credential')}${externalLink(d.live_url, 'Read write-up')}</p>` : ''}
      </article>`;
  }).join('');
}

/**
 * Pixel art: an asterisk beside the name and divider rows with a sliding band.
 * Canvases are re-measured each frame so ones inside hidden views start
 * drawing as soon as their view becomes visible.
 */
function initPixelArt() {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const color = name => css.getPropertyValue(name).trim();

  function prepare(canvas, state) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    if (state.w !== w || state.h !== h) {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      state.ctx = canvas.getContext('2d');
      state.ctx.setTransform(d, 0, 0, d, 0, 0);
      state.w = w;
      state.h = h;
    }
    return true;
  }

  const N = 17, H = (N - 1) / 2;
  const sparkCells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x - H, dy = y - H, r = Math.hypot(dx, dy);
      if (r > H + 0.3) continue;
      // Solid core plus four lines (eight rays) roughly two cells thick
      let on = r <= 2.2;
      for (let k = 0; k < 4 && !on; k++) {
        const a = k * Math.PI / 4;
        on = Math.abs(-Math.sin(a) * dx + Math.cos(a) * dy) < 0.9;
      }
      if (on) sparkCells.push({ x, y, a: 1 });
    }
  }
  const sparks = Array.from(document.querySelectorAll('canvas.pixel-spark')).map(c => ({ c, s: {} }));

  // Third eye beside the brand, after Erlang Shen: a vertical almond with a
  // double lid, an iris and a slit pupil. The pupil
  // follows the pointer, watches the bug, widens when the cursor is near,
  // gets sleepy when idle and now and then rolls.
  const EYE_W = 15, EYE_CX = 7;
  const EYE_HW = [0, 2, 3, 4, 5, 5, 6, 5, 5, 4, 3, 2, 0];
  const EYE_TOP = 0;
  const eyes = Array.from(document.querySelectorAll('canvas.pixel-eye')).map(c => ({ c, s: {}, lx: 0, ly: 0, close: 0, dil: 0 }));
  const pointer = { x: 0, y: 0, active: false, last: performance.now() };
  const eyeMood = { idle: { x: 0, y: 0, next: 0 }, blinkUntil: 0, nextBlink: 0, rollUntil: 0, nextRoll: 0, watchUntil: 0, nextWatch: 0, happyUntil: 0 };
  function notePointer(e) {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.last = performance.now();
    if (reduced) requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', notePointer, { passive: true });
  window.addEventListener('pointerdown', notePointer, { passive: true });
  window.addEventListener('scroll', () => { pointer.last = performance.now(); }, { passive: true });
  window.addEventListener('bug:squashed', () => { eyeMood.happyUntil = performance.now() + 1400; });

  // Screen position of a visible crawling bug, if any
  function visibleBug() {
    for (const c of document.querySelectorAll('canvas.pixel-scene[data-scene="bug"]')) {
      const st = rowStates.get(c);
      if (!st || !st.w || st.dead || st.zap) continue;
      const r = c.getBoundingClientRect();
      const bx = r.left + st.x + SPRITE_W * CELL / 2, by = r.bottom - 22;
      if (r.bottom > 0 && r.top < window.innerHeight && bx > r.left && bx < r.right) return { x: bx, y: by, c, st };
    }
    return null;
  }

  function drawEye(e, ts, clay) {
    const s = e.s;
    if (!prepare(e.c, s)) return;
    const cell = 2, rows = EYE_TOP + EYE_HW.length;
    const ox = Math.floor((s.w - EYE_W * cell) / 2), oy = Math.floor((s.h - rows * cell) / 2);
    const r = e.c.getBoundingClientRect();
    const ecx = r.left + r.width / 2, ecy = r.top + r.height / 2 + 4;
    const m = eyeMood;
    const idleFor = ts - pointer.last;

    // Pick what to look at
    const aim = (px, py) => {
      const dx = px - ecx, dy = py - ecy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
      return [dx / d * k, dy / d * k, d];
    };
    let tx = 0, ty = 0, near = false;
    if (!reduced && ts > m.nextWatch && ts > m.watchUntil) {
      if (visibleBug() && Math.random() < 0.5) m.watchUntil = ts + 3500;
      m.nextWatch = ts + 9000 + Math.random() * 8000;
    }
    if (!reduced && ts > m.nextRoll) {
      m.rollUntil = ts + 1400;
      m.nextRoll = ts + 25000 + Math.random() * 25000;
    }
    const bug = ts < m.watchUntil ? visibleBug() : null;
    const target = beam ? beamTarget() : null;
    if (target) {
      [tx, ty] = aim(target.x, target.y);
      near = true;
    } else if (ts < m.rollUntil && !reduced) {
      const a = (1 - (m.rollUntil - ts) / 1400) * Math.PI * 2 - Math.PI / 2;
      tx = Math.cos(a) * 0.9; ty = Math.sin(a) * 0.9;
    } else if (bug) {
      [tx, ty] = aim(bug.x, bug.y);
    } else if (pointer.active && idleFor < 4000) {
      let d;
      [tx, ty, d] = aim(pointer.x, pointer.y);
      near = d < 90;
    } else if (!reduced) {
      if (ts > m.idle.next) {
        const a = Math.random() * Math.PI * 2, k = Math.random() < 0.3 ? 0 : 0.8;
        m.idle = { x: Math.cos(a) * k, y: Math.sin(a) * k, next: ts + 1500 + Math.random() * 2500 };
      }
      tx = m.idle.x; ty = m.idle.y;
    }
    const ease = reduced ? 1 : 0.2;
    e.lx += (tx - e.lx) * ease;
    e.ly += (ty - e.ly) * ease;
    e.dil += ((near ? 1 : 0) - e.dil) * ease;

    // Lids close sideways: blink, sleepy after a long idle, a pleased squint
    if (!reduced && ts > m.nextBlink) { m.blinkUntil = ts + 140; m.nextBlink = ts + 3000 + Math.random() * 4000; }
    let close = 0;
    if (!reduced && idleFor > 20000) close = 0.6;
    if (ts < m.happyUntil) close = 0.45;
    if (!reduced && ts < m.blinkUntil) close = 1;
    e.close += (close - e.close) * (close === 1 ? 1 : 0.35);

    const icx = EYE_CX + e.lx * 2, icy = 6 + e.ly * 3;
    s.ctx.clearRect(0, 0, s.w, s.h);
    s.ctx.fillStyle = clay;
    const put = (x, y, a) => {
      s.ctx.globalAlpha = a;
      s.ctx.fillRect(ox + x * cell, oy + y * cell, cell - gapFor(cell), cell - gapFor(cell));
    };
    EYE_HW.forEach((hw, i) => {
      const y = EYE_TOP + i;
      put(EYE_CX - hw, y, 1);
      put(EYE_CX + hw, y, 1);
      if (e.close >= 0.98) { if (hw > 0) put(EYE_CX, y, 1); return; }
      const open = (hw - 1) * (1 - e.close);
      if (e.close > 0.05 && hw >= 2) {
        // Lid edges drawn where the lids currently meet the opening
        const edge = Math.max(0, Math.round(open));
        put(EYE_CX - edge, y, 1);
        put(EYE_CX + edge, y, 1);
      }
      for (let x = EYE_CX - hw + 1; x <= EYE_CX + hw - 1; x++) {
        const off = Math.abs(x - EYE_CX);
        if (off > open + 0.01) continue;
        if (hw >= 2 && off === hw - 1) { put(x, y, 0.4); continue; }
        const slit = Math.abs(x - icx) <= 0.5 + e.dil * 0.6 && Math.abs(i - icy) <= 2 + e.dil;
        const d = Math.hypot(x - icx, (i - icy) * 0.85);
        if (slit) put(x, y, 1);
        else if (d <= 2.6 + e.dil * 0.6) put(x, y, 0.45);
      }
    });
    s.ctx.globalAlpha = 1;
  }

  // 4x4 loader glyph: a short trail walking around the perimeter
  const ring = [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1]];
  const TRAIL = 4;

  // Pixel characters. "X" is a filled cell, "o" a half tone cell, anything else empty.
  const SPRITES = {
    botA: ['........XX........', '........oo........', '...XXXXXXXXXXXX...', '..XXXXXXXXXXXXXX..', '..XX..........XX..', '..XX.XX....XX.XX..', '..XX.XX....XX.XX..', '..XX....oo....XX..', '..XXXXXXXXXXXXXX..', '...XXXXXXXXXXXX...', '.....XXXXXXXX.....', 'XX.XXXXXXXXXXXX.XX', 'XX.XXXX....XXXX.XX', '...XXXX.oo.XXXX...', '...XXXXXXXXXXXX...', '....XXXXXXXXXX....', '..XXXXXXXXXXXXXX..', '..XXXX......XXXX..', '.XX.XXX....XX.XXX.', '.X.XX.X....X.XX.X.', '.X.XX.X....X.XX.X.', '.XXX.XX....XXX.XX.', '..XXXX......XXXX..'],
    botB: ['........XX........', '........oo........', '...XXXXXXXXXXXX...', '..XXXXXXXXXXXXXX..', '..XX..........XX..', '..XX.XX....XX.XX..', '..XX.XX....XX.XX..', '..XX....oo....XX..', '..XXXXXXXXXXXXXX..', '...XXXXXXXXXXXX...', '.....XXXXXXXX.....', 'XX.XXXXXXXXXXXX.XX', 'XX.XXXX....XXXX.XX', '...XXXX.oo.XXXX...', '...XXXXXXXXXXXX...', '....XXXXXXXXXX....', '..XXXXXXXXXXXXXX..', '..XXXX......XXXX..', '.XXX.XX....XXX.XX.', '.X.XX.X....X.XX.X.', '.X.XX.X....X.XX.X.', '.XX.XXX....XX.XXX.', '..XXXX......XXXX..'],
    botBlink: ['........XX........', '........oo........', '...XXXXXXXXXXXX...', '..XXXXXXXXXXXXXX..', '..XX..........XX..', '..XX..........XX..', '..XX.XX....XX.XX..', '..XX....oo....XX..', '..XXXXXXXXXXXXXX..', '...XXXXXXXXXXXX...', '.....XXXXXXXX.....', 'XX.XXXXXXXXXXXX.XX', 'XX.XXXX....XXXX.XX', '...XXXX.oo.XXXX...', '...XXXXXXXXXXXX...', '....XXXXXXXXXX....', '..XXXXXXXXXXXXXX..', '..XXXX......XXXX..', '.XX.XXX....XX.XXX.', '.X.XX.X....X.XX.X.', '.X.XX.X....X.XX.X.', '.XXX.XX....XXX.XX.', '..XXXX......XXXX..'],
    bugA: ['X......X...X......', '.X......X.X.......', '..X..XXXXXXXXX....', '..XXXXXXXXXXXXXX..', '.XX.XXXXXoXX.XXXX.', '.XXXXXXXXoXXXXXXXX', '.XXXXXXXXoXXXXXXXX', '.XX.XXXXXoXXXX.XX.', '..XXXXXXXXXXXXXX..', '..X..XXXXXXXXX....', '.X......X.X.......', 'X......X...X......'],
    bugB: ['X.......X...X.....', '.X.......X.X......', '..X..XXXXXXXXX....', '..XXXXXXXXXXXXXX..', '.XX.XXXXXoXX.XXXX.', '.XXXXXXXXoXXXXXXXX', '.XXXXXXXXoXXXXXXXX', '.XX.XXXXXoXXXX.XX.', '..XXXXXXXXXXXXXX..', '..X..XXXXXXXXX....', '.X.......X.X......', 'X.......X...X.....'],
    catA: ['.X....X...........', '.XX..XX...........', '.XoXXoX...........', 'XXXXXXXX..........', 'XX.XX.XX..........', 'XXXXXXXX..........', 'oXXoXXXo..........', '.XXXXXX...........', '..XXXXXX..........', '..XXXXXXX.........', '..XXXXXXXX........', '..XXXXXXXXX.......', '..XXXXXXXXX.....X.', '..XXXXXXXXXX.....X', '..XXXXXXXXXX.....X', '..XXXXXXXXXX....X.', '..XX.XX.XXXXXXXX..', '..XX.XX.XXXXXXX...'],
    catB: ['.X....X...........', '.XX..XX...........', '.XoXXoX...........', 'XXXXXXXX..........', 'XX.XX.XX..........', 'XXXXXXXX..........', 'oXXoXXXo..........', '.XXXXXX...........', '..XXXXXX..........', '..XXXXXXX.........', '..XXXXXXXX........', '..XXXXXXXXX.......', '..XXXXXXXXX.......', '..XXXXXXXXXX......', '..XXXXXXXXXX....XX', '..XXXXXXXXXX...X..', '..XX.XX.XXXXXXX...', '..XX.XX.XXXXXX....'],
    catBlink: ['.X....X...........', '.XX..XX...........', '.XoXXoX...........', 'XXXXXXXX..........', 'XXXXXXXX..........', 'XX.XX.XX..........', 'oXXoXXXo..........', '.XXXXXX...........', '..XXXXXX..........', '..XXXXXXX.........', '..XXXXXXXX........', '..XXXXXXXXX.......', '..XXXXXXXXX.....X.', '..XXXXXXXXXX.....X', '..XXXXXXXXXX.....X', '..XXXXXXXXXX....X.', '..XX.XX.XXXXXXXX..', '..XX.XX.XXXXXXX...'],
    heart: ['.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'],
    birdUp: ['....XX............', '....XXX...........', '.....XXX..........', '.....XXXX....XXX..', '......XXXX..XXXXX.', 'X......XXXXXXX.XXX', 'XX....XXXXXXXXXXX.', '.XXXXXXXXXXXXXXX..', '..XXXXXXXXXXXXX...', '....XXXXXXXXXX....', '......XXXXXX......'],
    birdDown: ['..................', '..................', '..................', '.............XXX..', '............XXXXX.', 'X..........XXX.XXX', 'XX....XXXXXXXXXXX.', '.XXXXXXXXXXXXXXX..', '..XXXXooXXXXXXX...', '....XXXXXXXXXX....', '......XXXXXXXX....', '.......XXXXX......', '........XXX.......', '.........X........'],
    snail: ['X.X...............', 'X.X.......XXXX....', '.X.X....XXXXXXXX..', '.X.X...XXX....XXX.', '..XX..XXX.XXXX.XX.', '..XX..XX.XX..XX.XX', '..XX..XX.XX.X.X.XX', '..XX..XX.XX..XX.XX', '..XX..XXX.XXXX.XX.', '..XXX..XXX....XX..', '..XXXX..XXXXXXX...', '.XXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX'],
    rabbit: ['......XX.XX.......', '......XoXoX.......', '......XoXoX.......', '......XX.XX.......', '......XXXXX.......', '.....XXXXXXX......', '.....XXXXX.XX.....', '.....XXXXXXXXo....', '......XXXXXX......', '....XXXXXXXX......', '..XXXXXXXXXXX.....', '.XXXXXXXXXXXX.....', 'oXXXXXXXXXXXX.....', 'oXXXXXXXXXXXXX....', 'XXXXXXXXXXXXXX....', '.XXXXXXXXXXXX.....', '..XXXX...XXXX.....', '.XXXXX..XXXXXX....'],
    rabbitJump: ['......XX.XX.......', '......XoXoX.......', '......XoXoX.......', '......XX.XX.......', '......XXXXX.......', '.....XXXXXXX......', '.....XXXXX.XX.....', '.....XXXXXXXXo....', '......XXXXXX......', '....XXXXXXXX......', '..XXXXXXXXXXX.....', '.XXXXXXXXXXXX.....', 'oXXXXXXXXXXXX.....', 'oXXXXXXXXXXXXX....', 'XXXXXXXXXXXXXX....', '.XXXXXXXXXXXX.....', 'XXXX.......XXX....', 'XX...........XX...'],
    laptop: ['..XXXXXXXXXXXXXX..', '..X............X..', '..X.oooo.......X..', '..X.oooooo.....X..', '..X.ooo........X..', '..X.ooooo......X..', '..X............X..', '..XXXXXXXXXXXXXX..', '.XXXXXXXXXXXXXXXX.', 'XXXXXXXXXXXXXXXXXX'],
    cup: ['XXXXXXXXX...', 'XXXXXXXXXXX.', 'XXXXXXXXX.XX', 'XXXXXXXXX.XX', 'XXXXXXXXXXX.', '.XXXXXXX....', '..XXXXX.....', 'XXXXXXXXXXX.'],
    steamA: ['..o....o....', '...o....o...', '..o....o....', '.o....o.....', '..o....o....', '...o....o...'],
    steamB: ['...o....o...', '..o....o....', '.o....o.....', '..o....o....', '...o....o...', '..o....o....'],
    skull: ['..XXXXXXXX..', '.XXXXXXXXXX.', 'XXXXXXXXXXXX', 'XX...XX...XX', 'XX...XX...XX', 'XXXXX..XXXXX', '.XXXXXXXXXX.', '..XXXXXXXX..', '..X.X..X.X..', '..XXXXXXXX..'],
  };
  const CELL = 3, STEP = 6, SPRITE_W = 18;
  // Gap between pixels: a hairline on dense screens; on standard screens small
  // cells stay solid so they do not wash out, larger cells keep a 1px gap
  const HI_DPI = (window.devicePixelRatio || 1) >= 2;
  const gapFor = cell => HI_DPI ? 0.5 : (cell <= 2 ? 0 : 1);
  const GAP = gapFor(3);

  function drawSprite(ctx, rows, x, y, flip, alpha) {
    const base = alpha === undefined ? 1 : alpha;
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch !== 'X' && ch !== 'o') continue;
        ctx.globalAlpha = ch === 'X' ? base : base * 0.4;
        const cx = flip ? row.length - 1 - c : c;
        ctx.fillRect(Math.round(x) + cx * CELL, Math.round(y) + r * CELL, CELL - GAP, CELL - GAP);
      }
    });
    ctx.globalAlpha = 1;
  }

  let lastScene = -1e9;

  function stepScene(s) {
    const maxX = Math.max(0, s.w - SPRITE_W * CELL);
    if (s.wait > 0) { s.wait--; }
    s.blink = Math.random() < 0.06;
    switch (s.kind) {
      case 'bot':
        if (s.wait <= 0) {
          s.x += s.dir * STEP;
          s.step = !s.step;
          if (s.x <= 0 || s.x >= maxX) { s.x = Math.min(Math.max(s.x, 0), maxX); s.dir *= -1; s.wait = 6; }
          else if (Math.random() < 0.02) { s.wait = 10; }
        }
        break;
      case 'bug':
        if (!s.dead && !s.zap && s.wait <= 0) {
          s.x -= STEP * 1.5;
          s.step = !s.step;
          if (s.x < -SPRITE_W * CELL) s.x = s.w;
          if (Math.random() < 0.03) s.wait = 5;
        }
        break;
      case 'cat':
        s.x = Math.max(0, maxX - 16);
        s.tailTick = (s.tailTick + 1) % 5;
        if (s.tailTick === 0) s.step = !s.step;
        if (!s.hearts) s.hearts = [];
        if (Math.random() < 0.025) s.hearts.push({ y: 0, life: 1 });
        s.hearts.forEach(h => { h.y -= 3; h.life -= 0.08; });
        s.hearts = s.hearts.filter(h => h.life > 0);
        break;
      case 'bot-look':
        if (Math.random() < 0.08) s.dir *= -1;
        break;
      case 'bird':
        s.step = !s.step;
        s.x += STEP;
        s.bob = (s.bob || 0) + 0.5;
        if (s.x > s.w) s.x = -SPRITE_W * CELL;
        break;
      case 'snail':
        s.slow = ((s.slow || 0) + 1) % 4;
        if (s.slow === 0) s.x -= STEP;
        if (s.x < -SPRITE_W * CELL) s.x = s.w;
        break;
      case 'rabbit':
        if (s.wait > 0) { s.step = false; break; }
        s.hop = (s.hop || 0) + 1;
        s.step = s.hop <= 2;
        s.x += s.dir * STEP;
        if (s.hop >= 3) { s.hop = 0; s.wait = 4 + Math.floor(Math.random() * 6); }
        if (s.x <= 0 || s.x >= maxX) { s.x = Math.min(Math.max(s.x, 0), maxX); s.dir *= -1; }
        break;
      case 'desk':
        s.step = !s.step;
        s.cursor = ((s.cursor || 0) + 1) % 6;
        break;
    }
  }

  function drawScene(c, s, clay, faint, muted) {
    const groundY = s.h - 4;
    // Top edge for a sprite standing on the ground line
    const stand = rows => groundY - rows.length * CELL - 2;
    s.ctx.clearRect(0, 0, s.w, s.h);
    if (s.kind !== 'bot-look') {
      s.ctx.fillStyle = faint;
      const cols = Math.floor(s.w / 4);
      for (let x = 0; x < cols; x++) s.ctx.fillRect(x * 4, groundY, 3, 3);
    }
    s.ctx.fillStyle = clay;
    const flip = s.dir < 0;
    switch (s.kind) {
      case 'bot':
      case 'bot-look': {
        const rows = s.blink ? SPRITES.botBlink : (s.kind === 'bot' && s.step ? SPRITES.botB : SPRITES.botA);
        drawSprite(s.ctx, rows, s.kind === 'bot-look' ? Math.floor((s.w - SPRITE_W * CELL) / 2) : s.x, s.kind === 'bot-look' ? Math.floor((s.h - rows.length * CELL) / 2) : stand(rows), flip);
        break;
      }
      case 'bug': {
        const by = stand(SPRITES.bugA);
        if (!s.dead) {
          drawSprite(s.ctx, s.step ? SPRITES.bugB : SPRITES.bugA, s.x, by, false);
          break;
        }
        // Squashed: flips over and wiggles, then a skull floats up with a note
        const t = performance.now() - s.dead.t;
        if (t < 700) {
          const rows = (Math.floor(t / 90) % 2 ? SPRITES.bugB : SPRITES.bugA).slice().reverse();
          drawSprite(s.ctx, rows, s.x, by, false);
        } else if (t < 2600) {
          const k = (t - 700) / 1900;
          drawSprite(s.ctx, SPRITES.skull, s.x + 3 * CELL, by - k * 24, false, 1 - k);
          s.ctx.globalAlpha = Math.min(1, (1 - k) * 1.5);
          s.ctx.fillStyle = muted;
          s.ctx.font = '600 12px ' + getComputedStyle(document.body).fontFamily;
          s.ctx.textBaseline = 'top';
          const label = s.dead.auto ? 'Spotted by the third eye.' : 'Bug squashed. ' + s.dead.count + ' so far';
          const tw = s.ctx.measureText(label).width;
          s.ctx.fillText(label, Math.max(0, Math.min(s.w - tw, s.x - tw / 2 + SPRITE_W * CELL / 2)), 2);
          s.ctx.globalAlpha = 1;
          s.ctx.fillStyle = clay;
        } else {
          s.dead = null;
          s.x = s.w;
        }
        break;
      }
      case 'cat': {
        const rows = s.blink ? SPRITES.catBlink : (s.step ? SPRITES.catB : SPRITES.catA);
        drawSprite(s.ctx, rows, s.x, stand(rows), false);
        (s.hearts || []).forEach(h => drawSprite(s.ctx, SPRITES.heart, s.x + CELL, stand(rows) - 10 * CELL + h.y, false, Math.max(0, h.life)));
        break;
      }
      case 'bird':
        drawSprite(s.ctx, s.step ? SPRITES.birdDown : SPRITES.birdUp, s.x, 7 + Math.round(Math.sin(s.bob || 0) * 2) * CELL, false);
        break;
      case 'snail':
        drawSprite(s.ctx, SPRITES.snail, s.x, stand(SPRITES.snail), false);
        break;
      case 'rabbit': {
        const rows = s.step ? SPRITES.rabbitJump : SPRITES.rabbit;
        drawSprite(s.ctx, rows, s.x, stand(rows) - (s.step ? 4 * CELL : 0), flip);
        break;
      }
      case 'desk': {
        const lx = Math.floor(s.w * 0.12 / CELL) * CELL, cx = lx + 21 * CELL;
        const ly = stand(SPRITES.laptop), cy = stand(SPRITES.cup);
        drawSprite(s.ctx, SPRITES.laptop, lx, ly, false);
        if ((s.cursor || 0) < 3) s.ctx.fillRect(lx + 4 * CELL, ly + 6 * CELL, CELL * 2 - GAP, CELL - GAP);
        drawSprite(s.ctx, SPRITES.cup, cx, cy, false);
        drawSprite(s.ctx, s.step ? SPRITES.steamB : SPRITES.steamA, cx, cy - 7 * CELL, false);
        break;
      }
    }
  }

  const rowStates = new WeakMap();
  let lastSpark = -1e9, lastRow = -1e9, tick = 0;
  let lastGlyph = -1e9, glyphTick = 0, lastSky = -1e9, skyT = 0;

  function frame(ts) {
    const clay = color('--clay'), faint = color('--faint');

    if (ts - lastSpark > 220) {
      lastSpark = ts;
      sparkCells[Math.floor(Math.random() * sparkCells.length)].a = 0.15;
    }
    sparks.forEach(({ c, s }) => {
      if (!prepare(c, s)) return;
      const size = Math.floor(Math.min(s.w, s.h) / N), gap = gapFor(size);
      const ox = Math.floor((s.w - size * N) / 2), oy = Math.floor((s.h - size * N) / 2);
      s.ctx.clearRect(0, 0, s.w, s.h);
      s.ctx.fillStyle = clay;
      sparkCells.forEach(p => {
        s.ctx.globalAlpha = p.a;
        s.ctx.fillRect(ox + p.x * size, oy + p.y * size, size - gap, size - gap);
      });
      s.ctx.globalAlpha = 1;
    });
    sparkCells.forEach(p => { p.a += (1 - p.a) * 0.04; });

    if (ts - lastRow > 120) { lastRow = ts; tick++; }
    document.querySelectorAll('canvas.pixel-row').forEach((c, i) => {
      let s = rowStates.get(c);
      if (!s) { s = { offset: i * 7 }; rowStates.set(c, s); }
      if (!prepare(c, s)) return;
      const S = 4, BAND = 48, cols = Math.floor(s.w / S);
      const head = reduced ? -1 : (tick + s.offset) % (cols + BAND);
      s.ctx.clearRect(0, 0, s.w, s.h);
      for (let x = 0; x < cols; x++) {
        const d = head - x, on = d >= 0 && d < BAND;
        s.ctx.fillStyle = on ? clay : faint;
        s.ctx.globalAlpha = on ? 1 - d / BAND : 1;
        s.ctx.fillRect(x * S, 0, S - 1, S - 1);
      }
      s.ctx.globalAlpha = 1;
    });

    if (ts - lastGlyph > 160) { lastGlyph = ts; glyphTick++; }
    document.querySelectorAll('canvas.pixel-glyph').forEach((c, i) => {
      let s = rowStates.get(c);
      if (!s) { s = { offset: i * 3 }; rowStates.set(c, s); }
      if (!prepare(c, s)) return;
      const size = Math.floor(Math.min(s.w, s.h) / 4), gap = Math.max(1, Math.round(size * 0.18));
      const head = reduced ? TRAIL - 1 : (glyphTick + s.offset) % ring.length;
      s.ctx.clearRect(0, 0, s.w, s.h);
      ring.forEach(([x, y], k) => {
        const d = (head - k + ring.length) % ring.length;
        const on = d < TRAIL;
        s.ctx.fillStyle = on ? clay : faint;
        s.ctx.globalAlpha = on ? 1 - d / TRAIL * 0.7 : 1;
        s.ctx.fillRect(x * size, y * size, size - gap, size - gap);
      });
      s.ctx.globalAlpha = 1;
    });

    if (ts - lastSky > 200) { lastSky = ts; skyT += 0.06; }
    document.querySelectorAll('canvas.pixel-skyline').forEach(c => {
      let s = rowStates.get(c);
      if (!s) { s = {}; rowStates.set(c, s); }
      if (!prepare(c, s)) return;
      const S = 4, rows = Math.floor(s.h / S), cols = Math.floor(s.w / S);
      s.ctx.clearRect(0, 0, s.w, s.h);
      for (let x = 0; x < cols; x++) {
        const v = 0.5 + 0.3 * Math.sin(x * 0.105 + skyT) + 0.2 * Math.sin(x * 0.035 - skyT * 0.6);
        const height = Math.max(1, Math.round(v * rows));
        for (let y = 0; y < height; y++) {
          s.ctx.fillStyle = y === height - 1 ? clay : faint;
          s.ctx.fillRect(x * S, s.h - (y + 1) * S, S - 1, S - 1);
        }
      }
    });

    const stepNow = ts - lastScene > 140;
    if (stepNow) lastScene = ts;
    document.querySelectorAll('canvas.pixel-scene').forEach(c => {
      let s = rowStates.get(c);
      if (!s) {
        s = { kind: c.getAttribute('data-scene'), x: 0, dir: 1, step: false, wait: 0, blink: false, tailTick: 0 };
        rowStates.set(c, s);
      }
      if (!prepare(c, s)) return;
      if (!s.placed) {
        s.placed = true;
        if (s.kind === 'bug') s.x = s.w * 0.7;
        if (s.kind === 'bot') s.x = Math.floor(s.w * 0.15 / CELL) * CELL;
        if (s.kind === 'bird') s.x = Math.floor(s.w * 0.3 / CELL) * CELL;
        if (s.kind === 'snail') s.x = Math.floor(s.w * 0.6 / CELL) * CELL;
        if (s.kind === 'rabbit') s.x = Math.floor(s.w * 0.4 / CELL) * CELL;
      }
      if (stepNow && !reduced) stepScene(s);
      if (reduced && s.kind === 'cat') s.x = Math.max(0, s.w - SPRITE_W * CELL - 16);
      drawScene(c, s, clay, faint, color('--muted'));
    });

    eyes.forEach(e => drawEye(e, ts, clay));
    drawBeam(ts, clay);

    // Now and then the eye spots a visible bug and zaps it on its own
    if (!reduced && !beam && ts > nextAutoZap) {
      const found = visibleBug();
      if (found && document.visibilityState === 'visible') zapBug(found.c, found.st, true);
      nextAutoZap = ts + 25000 + Math.random() * 25000;
    }

    if (!reduced) requestAnimationFrame(frame);
  }

  // Easter egg: click or tap the crawling bug to squash it. Either way the
  // third eye fires a pixel beam at the bug before it goes down.
  let beam = null, nextAutoZap = performance.now() + 20000;
  const overlay = document.createElement('canvas');
  overlay.className = 'pixel-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);
  const overlayState = {};
  const BEAM_TRAVEL = 320, BEAM_HIT = 360, BEAM_END = 640;

  function beamTarget() {
    const r = beam.c.getBoundingClientRect();
    return { x: r.left + beam.st.x + SPRITE_W * CELL / 2, y: r.bottom - 22 };
  }

  function zapBug(c, st, auto) {
    if (!st || st.dead || st.zap) return;
    st.zap = true;
    beam = { c, st, t0: performance.now(), auto };
    if (reduced) {
      const until = performance.now() + BEAM_END + 2800;
      (function tick() { frame(performance.now()); if (performance.now() < until) requestAnimationFrame(tick); })();
    }
  }

  function drawBeam(ts, clay) {
    if (!beam && !overlayState.dirty) return;
    if (!prepare(overlay, overlayState)) return;
    overlayState.ctx.clearRect(0, 0, overlayState.w, overlayState.h);
    overlayState.dirty = false;
    if (!beam) return;

    const t = ts - beam.t0;
    if (t >= BEAM_HIT && !beam.st.dead) {
      let count = 0;
      if (!beam.auto) {
        try { count = (parseInt(localStorage.getItem('bugsSquashed'), 10) || 0) + 1; localStorage.setItem('bugsSquashed', String(count)); } catch (e) { count = 1; }
      }
      beam.st.zap = false;
      beam.st.dead = { t: performance.now(), count, auto: beam.auto };
      window.dispatchEvent(new Event('bug:squashed'));
    }
    if (t >= BEAM_END) { beam = null; overlayState.dirty = true; return; }

    const er = eyes.length ? eyes[0].c.getBoundingClientRect() : null;
    if (!er) return;
    const from = { x: er.left + er.width / 2, y: er.top + er.height / 2 };
    const to = beamTarget();
    const ctx = overlayState.ctx;
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const reach = Math.min(1, t / BEAM_TRAVEL) * len;
    const fade = t > BEAM_HIT ? 1 - (t - BEAM_HIT) / (BEAM_END - BEAM_HIT) : 1;
    const ux = (to.x - from.x) / (len || 1), uy = (to.y - from.y) / (len || 1);
    ctx.fillStyle = clay;
    // Bolt: a short run of pixels that leaves the eye and flies to the bug,
    // brightest at its head with a fading tail
    if (t < BEAM_TRAVEL) {
      const BOLT = 48;
      for (let d = Math.max(0, reach - BOLT); d <= reach; d += 5) {
        const px = Math.round((from.x + ux * d) / 2) * 2, py = Math.round((from.y + uy * d) / 2) * 2;
        const k = 1 - (reach - d) / BOLT;
        ctx.globalAlpha = 0.2 + 0.8 * k;
        const size = k > 0.8 ? 6 : 4;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      }
    }
    // Impact burst once the beam lands
    if (t > BEAM_TRAVEL) {
      const k = Math.min(1, (t - BEAM_TRAVEL) / (BEAM_END - BEAM_TRAVEL));
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, rad = 6 + k * 18;
        ctx.globalAlpha = fade * (1 - k * 0.6);
        ctx.fillRect(Math.round(to.x + Math.cos(a) * rad) - 2, Math.round(to.y + Math.sin(a) * rad) - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1;
    overlayState.dirty = true;
  }

  function bugHit(c, ev) {
    const st = rowStates.get(c);
    if (!st || !st.w || st.dead || st.zap) return null;
    const r = c.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    const pad = 10;
    return x >= st.x - pad && x <= st.x + SPRITE_W * CELL + pad && y >= st.h - 4 - 12 * CELL - pad ? st : null;
  }
  document.querySelectorAll('canvas.pixel-scene[data-scene="bug"]').forEach(c => {
    c.addEventListener('pointermove', ev => { c.style.cursor = bugHit(c, ev) ? 'crosshair' : ''; });
    c.addEventListener('click', ev => {
      const st = bugHit(c, ev);
      if (!st) return;
      c.style.cursor = '';
      zapBug(c, st, false);
    });
  });

  requestAnimationFrame(frame);
  if (reduced) {
    // Draw again once data driven rows and route changes have settled
    window.addEventListener('pixelart:redraw', () => requestAnimationFrame(frame));
  }
}

function initLightbox() {
  const lightbox = document.getElementById('cert-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');

  if (!lightbox) return;

  const close = () => {
    lightbox.classList.remove('open');
    document.body.classList.remove('no-scroll');
    if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
      lightboxReturnFocus.focus();
    }
    lightboxReturnFocus = null;
  };

  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close when the overlay outside the image is clicked
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  // Open previews via delegation (no inline handlers, keeps CSP strict)
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest && e.target.closest('[data-cert-image]');
    if (trigger) openCertLightbox(trigger.getAttribute('data-cert-image'));
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Tab') {
      // Only the close button is focusable inside the dialog, so keep focus on it
      e.preventDefault();
      if (closeBtn) closeBtn.focus();
    }
  });
}

let lightboxReturnFocus = null;

function openCertLightbox(imgUrl) {
  const lightbox = document.getElementById('cert-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  if (lightbox && lightboxImg) {
    lightboxReturnFocus = document.activeElement;
    lightboxImg.src = imgUrl;
    lightbox.classList.add('open');
    document.body.classList.add('no-scroll');
    const closeBtn = document.getElementById('lightbox-close-btn');
    if (closeBtn) closeBtn.focus();
  }
}

/**
 * Toggles light and dark themes. The initial theme is applied by /theme.js.
 */
function initThemeSwitcher() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const root = document.documentElement;
  const sync = () => themeToggleBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  sync();

  themeToggleBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
    window.dispatchEvent(new Event('pixelart:redraw'));
  });
}

function initCopyrightYear() {
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Subpath router that syncs the URL path with the active view.
 * Handles /, /projects, /tools, /disclosures, /activities, /api, /bots
 */
const ROUTE_META = {
  '/': ['Tint Naing Win (devtint) | Security Researcher and Tool Builder', 'Tint Naing Win (devtint) is a security researcher in Bangkok focused on web application, API and AI security, who builds open source security tools and Telegram bots.'],
  '/projects': ['Projects | Tint Naing Win (devtint)', 'Security and software projects by Tint Naing Win (devtint), covering vulnerability management, API testing, AI security research and automation.'],
  '/tools': ['Tools | Tint Naing Win (devtint)', 'Open source utilities and command line tools by Tint Naing Win (devtint) for networking, automation and development.'],
  '/disclosures': ['Disclosures and Certifications | Tint Naing Win (devtint)', 'Responsible security disclosures acknowledged by universities and companies, plus security certifications earned by Tint Naing Win (devtint).'],
  '/disclosures/certifications': ['Certifications | Tint Naing Win (devtint)', 'Security certifications earned by Tint Naing Win (devtint), including AI penetration testing and ethical hacking credentials.'],
  '/disclosures/corporate': ['Corporate Disclosures | Tint Naing Win (devtint)', 'Security issues responsibly reported to companies and SaaS providers by Tint Naing Win (devtint).'],
  '/disclosures/institutions': ['Institution Disclosures | Tint Naing Win (devtint)', 'Security issues responsibly reported to public institutions by Tint Naing Win (devtint).'],
  '/disclosures/university': ['University Disclosures | Tint Naing Win (devtint)', 'Security issues responsibly reported to universities by Tint Naing Win (devtint), with verified acknowledgements.'],
  '/activities': ['Activities | Tint Naing Win (devtint)', 'Events, workshops and community activities organized or co-organized by Tint Naing Win (devtint).'],
  '/api': ['API Docs | Tint Naing Win (devtint)', 'Public API documentation for services maintained by Tint Naing Win (devtint).'],
  '/bots': ['Telegram Bots | Tint Naing Win (devtint)', 'Telegram bots built and maintained by Tint Naing Win (devtint) for everyday utility tasks.']
};

function updateRouteMeta(route) {
  const entry = ROUTE_META[route] || ROUTE_META['/'];
  const url = window.location.origin + (ROUTE_META[route] ? route : '/');
  document.title = entry[0];
  const set = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  set('meta[name="description"]', 'content', entry[1]);
  set('link[rel="canonical"]', 'href', url);
  set('meta[property="og:title"]', 'content', entry[0]);
  set('meta[property="og:description"]', 'content', entry[1]);
  set('meta[property="og:url"]', 'content', url);
  set('meta[name="twitter:title"]', 'content', entry[0]);
  set('meta[name="twitter:description"]', 'content', entry[1]);
}

function setActiveLinks(navLinks, route) {
  navLinks.forEach(link => {
    if (link.classList.contains('brand')) return;
    const linkRoute = (link.getAttribute('data-route') || '').toLowerCase().replace(/\/$/, '') || '/';
    const isActive = linkRoute === route || (linkRoute === '/disclosures' && route.startsWith('/disclosures/'));
    const inNav = link.closest('.nav-menu');
    link.classList.toggle('active', isActive && !!inNav);
    if (inNav) {
      if (isActive && inNav.scrollWidth > inNav.clientWidth) {
        inNav.scrollLeft = Math.max(0, link.offsetLeft - (inNav.clientWidth - link.offsetWidth) / 2);
      }
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  });
}

function initSubpathRouter() {
  const navLinks = document.querySelectorAll('.nav-link[data-route]');
  const views = document.querySelectorAll('.subpath-view');

  if (views.length <= 1) return;

  function navigateTo(pathname, updateHistory = true) {
    let route = (pathname || '/').toLowerCase().replace(/\/$/, '') || '/';

    let matched = false;
    views.forEach(view => {
      const viewRoute = view.getAttribute('data-view-route');
      const isMatch = viewRoute === route || (viewRoute === '/disclosures' && route.startsWith('/disclosures/'));
      view.classList.toggle('active-view', isMatch);
      if (isMatch) matched = true;
    });

    if (!matched) {
      const homeView = document.querySelector('.subpath-view[data-view-route="/"]');
      if (homeView) homeView.classList.add('active-view');
      route = '/';
    }

    setActiveLinks(navLinks, route);
    updateRouteMeta(route);
    window.dispatchEvent(new Event('pixelart:redraw'));

    if (route === '/disclosures' || route.startsWith('/disclosures/')) {
      renderDisclosures(portfolioCache.disclosures, route);
    }

    if (updateHistory) {
      window.scrollTo(0, 0);
      const main = document.getElementById('main-content');
      if (main) main.focus({ preventScroll: true });
      if (window.location.pathname !== route && window.location.protocol !== 'file:') {
        history.pushState({ route }, '', route);
      }
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const route = link.getAttribute('data-route');
      if (route && !route.startsWith('http')) {
        e.preventDefault();
        navigateTo(route);
      }
    });
  });

  window.addEventListener('popstate', () => {
    navigateTo(window.location.pathname, false);
  });

  navigateTo(window.location.pathname, false);
}

/**
 * Strict HTML entity escaping for content rendered from data files.
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
