const statsEl = document.getElementById('stats');
const errorEl = document.getElementById('error');
const searchEl = document.getElementById('quick-search');

function showError(msg) {
  errorEl.hidden = !msg;
  errorEl.textContent = msg || '';
}

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

function renderMeta(meta) {
  if (!meta) {
    statsEl.textContent = 'No scan data yet.';
    return;
  }
  const series = meta.seriesCount ?? 0;
  const pages = meta.visiblePageCount ?? meta.pageCount ?? 0;
  const hidden = meta.hiddenOpenCount ?? 0;
  statsEl.textContent = `${series} recoverable series · ${pages} pages shown · ${hidden} open-tab pages hidden`;
}

async function loadSummary() {
  showError('');
  statsEl.textContent = 'Scanning history…';
  try {
    const res = await send('GET_POPUP_SUMMARY');
    if (!res?.ok) throw new Error(res?.error || 'Scan failed');
    renderMeta(res.meta);
  } catch (err) {
    statsEl.textContent = 'Unable to read history.';
    showError(err.message || String(err));
  }
}

document.getElementById('open-dashboard').addEventListener('click', async () => {
  const q = searchEl.value.trim();
  const url = chrome.runtime.getURL(
    q ? `dashboard.html?q=${encodeURIComponent(q)}` : 'dashboard.html',
  );
  await chrome.tabs.create({ url });
  window.close();
});

document.getElementById('refresh').addEventListener('click', () => loadSummary());

searchEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('open-dashboard').click();
  }
});

loadSummary();
