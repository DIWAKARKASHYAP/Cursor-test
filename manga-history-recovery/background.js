/**
 * MV3 service worker — coordinates history scan, tabs, prefs, and tab opens.
 * History is queried on demand; never uploaded.
 */

import { scanMangaHistory, DEFAULT_ALLOWLIST } from './utils/history-scanner.js';
import { groupBySeries, sortSeriesGroups } from './utils/series-grouper.js';
import {
  buildOpenUrlSet,
  filterSeriesGroupsByOpenTabs,
  isUrlOpen,
} from './utils/tab-deduplicator.js';
import { buildOnlineSearchUrl, seriesSearchQuery } from './utils/search-utils.js';

const STORAGE_KEYS = {
  prefs: 'mhr_prefs',
  lastScanMeta: 'mhr_last_scan_meta',
};

const DEFAULT_PREFS = {
  customDomains: [],
  showOpenUrls: false,
  sortBy: 'lastVisited',
  allowlist: [...DEFAULT_ALLOWLIST],
};

async function getPrefs() {
  const data = await chrome.storage.local.get(STORAGE_KEYS.prefs);
  return { ...DEFAULT_PREFS, ...(data[STORAGE_KEYS.prefs] || {}) };
}

async function setPrefs(partial) {
  const current = await getPrefs();
  const next = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.prefs]: next });
  return next;
}

async function queryOpenTabUrls() {
  const tabs = await chrome.tabs.query({});
  return tabs.map((t) => t.url).filter(Boolean);
}

async function runRecoveryScan(options = {}) {
  const prefs = await getPrefs();
  const showOpen = options.showOpen ?? prefs.showOpenUrls;
  const sortBy = options.sortBy ?? prefs.sortBy;

  const entries = await scanMangaHistory({
    allowlist: prefs.allowlist,
    customDomains: prefs.customDomains,
  });

  const openUrls = await queryOpenTabUrls();
  const openSet = buildOpenUrlSet(openUrls);

  const groups = groupBySeries(entries);
  const { groups: filtered, hiddenCount } = filterSeriesGroupsByOpenTabs(groups, openSet, {
    showOpen,
  });
  const sorted = sortSeriesGroups(filtered, sortBy);

  const uniquePages = entries.length;
  const meta = {
    scannedAt: Date.now(),
    seriesCount: sorted.length,
    pageCount: uniquePages,
    hiddenOpenCount: hiddenCount,
    visiblePageCount: sorted.reduce((n, g) => n + (g.pageCount || 0), 0),
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.lastScanMeta]: meta });

  return { groups: sorted, meta, prefs };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => {
      console.error('[mhr]', err);
      sendResponse({ ok: false, error: err?.message || String(err) });
    });
  return true; // async
});

async function handleMessage(message) {
  switch (message?.type) {
    case 'GET_PREFS': {
      const prefs = await getPrefs();
      const meta = (await chrome.storage.local.get(STORAGE_KEYS.lastScanMeta))[
        STORAGE_KEYS.lastScanMeta
      ];
      return { prefs, meta: meta || null };
    }

    case 'SET_PREFS': {
      const prefs = await setPrefs(message.prefs || {});
      return { prefs };
    }

    case 'SCAN': {
      const result = await runRecoveryScan(message.options || {});
      return result;
    }

    case 'GET_OPEN_TABS': {
      const urls = await queryOpenTabUrls();
      return { urls, openSet: [...buildOpenUrlSet(urls)] };
    }

    case 'OPEN_DASHBOARD': {
      const url = chrome.runtime.getURL('dashboard.html');
      await chrome.tabs.create({ url });
      return { opened: true };
    }

    case 'OPEN_URL': {
      if (!message.url) throw new Error('Missing URL.');
      // Recheck open tabs immediately before opening
      const openUrls = await queryOpenTabUrls();
      if (isUrlOpen(message.url, openUrls) && !message.force) {
        return { opened: false, alreadyOpen: true };
      }
      await chrome.tabs.create({ url: message.url, active: Boolean(message.active ?? true) });
      return { opened: true, alreadyOpen: false };
    }

    case 'SEARCH_ONLINE': {
      const query = message.query || seriesSearchQuery(message.series || {});
      const searchUrl = buildOnlineSearchUrl(query, {
        domainHint: message.domainHint || 'mangacherri',
        engine: message.engine || 'duckduckgo',
      });
      if (!searchUrl) throw new Error('Missing search query.');
      await chrome.tabs.create({ url: searchUrl, active: true });
      return { opened: true, searchUrl, source: 'online' };
    }

    case 'GET_POPUP_SUMMARY': {
      const prefs = await getPrefs();
      const cached = (await chrome.storage.local.get(STORAGE_KEYS.lastScanMeta))[
        STORAGE_KEYS.lastScanMeta
      ];
      // Lightweight: return cache if fresh (< 5 min), else quick scan meta only
      const fresh = cached && Date.now() - cached.scannedAt < 5 * 60 * 1000;
      if (fresh) {
        return { meta: cached, prefs, fromCache: true };
      }
      const { meta } = await runRecoveryScan({ showOpen: prefs.showOpenUrls, sortBy: prefs.sortBy });
      return { meta, prefs, fromCache: false };
    }

    default:
      throw new Error(`Unknown message type: ${message?.type}`);
  }
}
