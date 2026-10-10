/**
 * History scanning against a configurable manga-domain allowlist.
 * Pure filtering helpers are unit-testable; chrome.history is injected.
 */

import { normalizeUrl } from './url-normalizer.js';
import { mangaCherriAdapter, parseMangaCherriUrl } from '../sites/mangacherri.js';

export const DEFAULT_ALLOWLIST = [mangaCherriAdapter.domain];

const DEFAULT_BATCH_MAX = 5000;
const MAX_RESULTS_PER_QUERY = 1000;

/**
 * @param {string[]} allowlist
 * @param {string[]} [customDomains]
 * @returns {Set<string>}
 */
export function buildDomainAllowlist(allowlist = DEFAULT_ALLOWLIST, customDomains = []) {
  const set = new Set();
  for (const d of [...allowlist, ...customDomains]) {
    if (!d) continue;
    const host = String(d)
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')
      .trim();
    if (host) set.add(host);
  }
  return set;
}

/**
 * @param {string} url
 * @param {Set<string>} allowlist
 * @returns {boolean}
 */
export function urlMatchesAllowlist(url, allowlist) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return allowlist.has(host);
  } catch {
    return false;
  }
}

/**
 * Enrich a raw chrome.history item into a scanner entry.
 * @param {{ url?: string, title?: string, lastVisitTime?: number, visitCount?: number, typedCount?: number, id?: string }} item
 * @param {Set<string>} allowlist
 * @returns {object|null}
 */
export function enrichHistoryItem(item, allowlist) {
  if (!item || !item.url) return null;
  if (!urlMatchesAllowlist(item.url, allowlist)) return null;

  const normalizedUrl = normalizeUrl(item.url);
  if (!normalizedUrl) return null;

  let parsed = null;
  if (mangaCherriAdapter.matches(item.url)) {
    parsed = parseMangaCherriUrl(item.url);
  }

  return {
    url: item.url,
    normalizedUrl,
    title: item.title && String(item.title).trim() ? String(item.title).trim() : null,
    lastVisitTime: typeof item.lastVisitTime === 'number' ? item.lastVisitTime : 0,
    visitCount: typeof item.visitCount === 'number' ? item.visitCount : 0,
    typedCount: typeof item.typedCount === 'number' ? item.typedCount : 0,
    historyId: item.id ?? null,
    domain: (() => {
      try {
        return new URL(normalizedUrl).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })(),
    siteParse: parsed,
    /** Presence in history ≠ currently reachable */
    presentInHistory: true,
    reachableNow: null,
  };
}

/**
 * Deduplicate history items by normalized URL, keeping richest metadata.
 * @param {object[]} entries
 * @returns {object[]}
 */
export function dedupeHistoryEntries(entries) {
  const map = new Map();
  for (const entry of entries) {
    if (!entry?.normalizedUrl) continue;
    const prev = map.get(entry.normalizedUrl);
    if (!prev) {
      map.set(entry.normalizedUrl, { ...entry });
      continue;
    }
    map.set(entry.normalizedUrl, {
      ...prev,
      title: preferTitle(prev.title, entry.title),
      lastVisitTime: Math.max(prev.lastVisitTime || 0, entry.lastVisitTime || 0),
      visitCount: Math.max(prev.visitCount || 0, entry.visitCount || 0),
      typedCount: Math.max(prev.typedCount || 0, entry.typedCount || 0),
      url: (entry.lastVisitTime || 0) >= (prev.lastVisitTime || 0) ? entry.url : prev.url,
      siteParse: prev.siteParse || entry.siteParse,
    });
  }
  return [...map.values()];
}

function preferTitle(a, b) {
  if (a && b) return a.length >= b.length ? a : b;
  return a || b || null;
}

/**
 * Apply dashboard filters to enriched entries (pre-grouping).
 * @param {object[]} entries
 * @param {{ query?: string, domain?: string, startMs?: number|null, endMs?: number|null }} filters
 */
export function filterHistoryEntries(entries, filters = {}) {
  const q = (filters.query || '').trim().toLowerCase();
  const domain = (filters.domain || '').trim().toLowerCase().replace(/^www\./, '');
  const startMs = filters.startMs ?? null;
  const endMs = filters.endMs ?? null;

  return entries.filter((e) => {
    if (domain && e.domain !== domain) return false;
    if (startMs != null && (e.lastVisitTime || 0) < startMs) return false;
    if (endMs != null && (e.lastVisitTime || 0) > endMs) return false;
    if (!q) return true;
    const hay = [
      e.title || '',
      e.url || '',
      e.normalizedUrl || '',
      e.siteParse?.seriesSlug || '',
      e.siteParse?.titleHint || '',
      e.domain || '',
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * Scan Chrome history via injected API (chrome.history or mock).
 * Uses text queries per allowlisted domain to avoid scanning the whole web.
 *
 * @param {{
 *   historyApi?: { search: Function },
 *   allowlist?: string[],
 *   customDomains?: string[],
 *   maxResults?: number,
 *   startTime?: number
 * }} options
 */
export async function scanMangaHistory(options = {}) {
  const historyApi = options.historyApi || (typeof chrome !== 'undefined' ? chrome.history : null);
  if (!historyApi?.search) {
    throw new Error('Chrome History API is unavailable.');
  }

  const domains = buildDomainAllowlist(options.allowlist || DEFAULT_ALLOWLIST, options.customDomains || []);
  const maxResults = options.maxResults ?? DEFAULT_BATCH_MAX;
  const startTime = options.startTime ?? 0;

  const raw = [];
  for (const domain of domains) {
    let collected = 0;
    // chrome.history.search does not expose true cursor pagination; query by domain text
    // and request the largest supported page, then dedupe client-side.
    const results = await historyApi.search({
      text: domain,
      startTime,
      maxResults: Math.min(MAX_RESULTS_PER_QUERY, maxResults),
    });
    for (const item of results || []) {
      const enriched = enrichHistoryItem(item, domains);
      if (enriched) {
        raw.push(enriched);
        collected += 1;
        if (collected >= maxResults) break;
      }
    }
  }

  return dedupeHistoryEntries(raw);
}
