import { sortSeriesGroups } from './utils/series-grouper.js';
import { seriesSearchQuery, sourceLabel } from './utils/search-utils.js';

const els = {
  query: document.getElementById('filter-query'),
  domain: document.getElementById('filter-domain'),
  start: document.getElementById('filter-start'),
  end: document.getElementById('filter-end'),
  sort: document.getElementById('filter-sort'),
  toggleOpen: document.getElementById('toggle-open'),
  customDomain: document.getElementById('custom-domain'),
  stats: document.getElementById('stats-bar'),
  state: document.getElementById('state'),
  list: document.getElementById('series-list'),
};

/** @type {{ groups: object[], meta: object|null, prefs: object|null, rawEntries: object[]|null }} */
let cache = { groups: [], meta: null, prefs: null, rawEntries: null };
let renderToken = 0;

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

function setState(kind, message) {
  if (!message) {
    els.state.hidden = true;
    els.state.textContent = '';
    els.state.className = 'state';
    return;
  }
  els.state.hidden = false;
  els.state.textContent = message;
  els.state.className = kind === 'error' ? 'state error' : 'state';
}

function dateInputToMs(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value + (endOfDay ? 'T23:59:59.999' : 'T00:00:00'));
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

function formatWhen(ms) {
  if (!ms) return 'unknown';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return 'unknown';
  }
}

function applyClientFilters(groups) {
  const q = els.query.value.trim().toLowerCase();
  const domain = els.domain.value.trim().toLowerCase();
  const startMs = dateInputToMs(els.start.value, false);
  const endMs = dateInputToMs(els.end.value, true);

  let filtered = groups.map((g) => {
    let pages = g.pages || [];
    if (startMs != null) pages = pages.filter((p) => (p.lastVisitTime || 0) >= startMs);
    if (endMs != null) pages = pages.filter((p) => (p.lastVisitTime || 0) <= endMs);
    if (domain && g.sourceDomain !== domain) pages = [];
    if (q) {
      const seriesHay = [g.title, g.seriesSlug, g.sourceDomain].join(' ').toLowerCase();
      if (!seriesHay.includes(q)) {
        pages = pages.filter((p) =>
          [p.url, p.normalizedUrl, p.title, p.pageId].join(' ').toLowerCase().includes(q),
        );
        if (pages.length === 0) return null;
      }
    }
    return { ...g, pages, pageCount: pages.length };
  });

  filtered = filtered.filter(Boolean);
  return sortSeriesGroups(filtered, els.sort.value || 'lastVisited');
}

function renderStats(groups, meta) {
  const seriesCount = groups.length;
  const pageCount = groups.reduce((n, g) => n + (g.pageCount || 0), 0);
  const hidden = meta?.hiddenOpenCount ?? 0;
  els.stats.innerHTML = `
    <span><strong>${seriesCount}</strong> unique series</span>
    <span><strong>${pageCount}</strong> unique pages shown</span>
    <span><strong>${hidden}</strong> pages hidden (already open)</span>
    <span title="${sourceLabel('history')}">${meta?.scannedAt ? `Scanned ${formatWhen(meta.scannedAt)}` : ''}</span>
  `;
}

function pageRowHtml(page) {
  const openBadge = page.isOpen ? '<span class="badge open">open</span>' : '';
  return `
    <li class="page-row ${page.isOpen ? 'is-open' : ''}" data-url="${escapeAttr(page.url)}">
      <div>
        <a class="page-url" href="${escapeAttr(page.url)}" data-action="open">${escapeHtml(page.url)}</a>
        <div class="page-meta">
          Last visited: ${escapeHtml(formatWhen(page.lastVisitTime))}
          · visits: ${page.visitCount || 0}
          ${page.pageId != null ? `· id: ${escapeHtml(String(page.pageId))}` : ''}
          ${openBadge}
          <span class="badge" title="${escapeAttr(sourceLabel('history'))}">history</span>
        </div>
      </div>
      <div class="page-actions">
        <button type="button" data-action="open">Open</button>
        <button type="button" data-action="copy">Copy</button>
      </div>
    </li>
  `;
}

function seriesHtml(series, open = false) {
  const uncertain = series.uncertain || series.matchingConfidence === 'uncertain';
  const badge = uncertain
    ? '<span class="badge uncertain">uncertain match</span>'
    : `<span class="badge">${escapeHtml(series.matchingConfidence || 'grouped')}</span>`;
  return `
    <details class="series" data-series-id="${escapeAttr(series.id)}" ${open ? 'open' : ''}>
      <summary class="series-summary">
        <div>
          <p class="series-title">${escapeHtml(series.title || 'Untitled')}${badge}</p>
          <div class="series-meta">
            ${escapeHtml(series.sourceDomain || '')}
            · ${series.pageCount || 0} page(s)
            · last visited ${escapeHtml(formatWhen(series.lastVisitTime))}
          </div>
        </div>
        <div class="series-actions">
          <button type="button" data-action="search-online" title="Opens a search engine — does not replace history links">Search online</button>
        </div>
      </summary>
      <ul class="pages">
        ${(series.pages || []).map(pageRowHtml).join('')}
      </ul>
    </details>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function render() {
  const token = ++renderToken;
  const groups = applyClientFilters(cache.groups);
  if (token !== renderToken) return;

  renderStats(groups, cache.meta);

  if (!groups.length) {
    els.list.innerHTML = '';
    setState('empty', cache.meta ? 'No matching series. Try clearing filters or rescanning.' : 'No data yet.');
    return;
  }

  setState(null);
  // Incremental-ish: render in chunks for large lists
  const CHUNK = 40;
  let i = 0;
  els.list.innerHTML = '';

  const pump = () => {
    if (token !== renderToken) return;
    const slice = groups.slice(i, i + CHUNK);
    const html = slice.map((g, idx) => seriesHtml(g, i === 0 && idx === 0)).join('');
    els.list.insertAdjacentHTML('beforeend', html);
    i += CHUNK;
    if (i < groups.length) {
      requestAnimationFrame(pump);
    }
  };
  pump();
}

async function scan() {
  setState('loading', 'Scanning Chrome history…');
  els.list.innerHTML = '';
  try {
    const prefsPatch = {
      showOpenUrls: els.toggleOpen.checked,
      sortBy: els.sort.value,
    };
    await send('SET_PREFS', { prefs: prefsPatch });

    const res = await send('SCAN', {
      options: {
        showOpen: els.toggleOpen.checked,
        sortBy: els.sort.value,
      },
    });
    if (!res?.ok) throw new Error(res?.error || 'Scan failed');

    cache.groups = res.groups || [];
    cache.meta = res.meta || null;
    cache.prefs = res.prefs || null;
    syncDomainOptions(cache.prefs);
    render();
  } catch (err) {
    setState('error', err.message || String(err));
    els.stats.innerHTML = '<span>Scan failed</span>';
  }
}

function syncDomainOptions(prefs) {
  const select = els.domain;
  const current = select.value;
  const domains = new Set(['mangacherri.com', ...(prefs?.customDomains || []), ...(prefs?.allowlist || [])]);
  select.innerHTML = '<option value="">All domains</option>';
  for (const d of [...domains].sort()) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  }
  if ([...domains].includes(current) || current === '') select.value = current;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

els.list.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const action = btn.dataset.action;
  const seriesEl = btn.closest('.series');
  const pageEl = btn.closest('.page-row');

  if (action === 'search-online' && seriesEl) {
    const id = seriesEl.dataset.seriesId;
    const series = cache.groups.find((g) => g.id === id);
    await send('SEARCH_ONLINE', {
      query: seriesSearchQuery(series || {}),
      domainHint: series?.sourceDomain || 'mangacherri',
      series,
    });
    return;
  }

  const url = pageEl?.dataset.url;
  if (!url) return;

  if (action === 'copy') {
    await copyText(url);
    btn.textContent = 'Copied';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 1200);
    return;
  }

  if (action === 'open') {
    const res = await send('OPEN_URL', { url, active: true });
    if (res?.alreadyOpen) {
      // Still allow focusing by forcing open? Spec: recheck before opening — inform user
      const force = confirm('This URL appears to be open already. Open another tab anyway?');
      if (force) await send('OPEN_URL', { url, active: true, force: true });
    }
  }
});

// Prevent summary button clicks from toggling details incorrectly when clicking actions
els.list.addEventListener(
  'click',
  (e) => {
    if (e.target.closest('.series-actions')) {
      e.preventDefault();
    }
  },
  true,
);

for (const el of [els.query, els.domain, els.start, els.end, els.sort]) {
  el.addEventListener('input', () => render());
  el.addEventListener('change', () => render());
}

els.toggleOpen.addEventListener('change', () => scan());
document.getElementById('btn-refresh').addEventListener('click', () => scan());

document.getElementById('btn-add-domain').addEventListener('click', async () => {
  const domain = els.customDomain.value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
  if (!domain) return;
  const prefsRes = await send('GET_PREFS');
  const custom = new Set(prefsRes.prefs?.customDomains || []);
  custom.add(domain);
  await send('SET_PREFS', { prefs: { customDomains: [...custom] } });
  els.customDomain.value = '';
  await scan();
});

// Seed query from popup
const params = new URLSearchParams(location.search);
if (params.get('q')) els.query.value = params.get('q');

(async () => {
  const prefsRes = await send('GET_PREFS');
  if (prefsRes?.ok && prefsRes.prefs) {
    els.toggleOpen.checked = Boolean(prefsRes.prefs.showOpenUrls);
    els.sort.value = prefsRes.prefs.sortBy || 'lastVisited';
    syncDomainOptions(prefsRes.prefs);
  }
  await scan();
})();
