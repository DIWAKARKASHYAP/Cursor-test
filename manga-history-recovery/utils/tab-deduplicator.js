/**
 * Exact-page open-tab exclusion.
 * Hides URLs that match open tabs after normalization.
 * Does NOT hide sibling chapters of the same series.
 */

import { normalizeUrl } from './url-normalizer.js';

/**
 * Build a set of normalized open-tab URLs.
 * @param {Array<{ url?: string }|string>} tabsOrUrls
 * @returns {Set<string>}
 */
export function buildOpenUrlSet(tabsOrUrls = []) {
  const set = new Set();
  for (const item of tabsOrUrls) {
    const url = typeof item === 'string' ? item : item?.url;
    const n = normalizeUrl(url);
    if (n) set.add(n);
  }
  return set;
}

/**
 * Mark entries with isOpen; optionally filter them out.
 * @param {object[]} entries
 * @param {Set<string>|Array} openTabs
 * @param {{ showOpen?: boolean }} options
 * @returns {{ visible: object[], hiddenCount: number, annotated: object[] }}
 */
export function applyOpenTabFilter(entries, openTabs, options = {}) {
  const showOpen = Boolean(options.showOpen);
  const openSet = openTabs instanceof Set ? openTabs : buildOpenUrlSet(openTabs);

  let hiddenCount = 0;
  const annotated = entries.map((entry) => {
    const key = entry.normalizedUrl || normalizeUrl(entry.url);
    const isOpen = Boolean(key && openSet.has(key));
    if (isOpen) hiddenCount += 1;
    return { ...entry, isOpen };
  });

  const visible = showOpen ? annotated : annotated.filter((e) => !e.isOpen);
  return { visible, hiddenCount, annotated };
}

/**
 * Filter pages inside series groups the same way (per-page, not per-series).
 * @param {object[]} groups
 * @param {Set<string>|Array} openTabs
 * @param {{ showOpen?: boolean }} options
 */
export function filterSeriesGroupsByOpenTabs(groups, openTabs, options = {}) {
  const showOpen = Boolean(options.showOpen);
  const openSet = openTabs instanceof Set ? openTabs : buildOpenUrlSet(openTabs);

  let hiddenCount = 0;
  const result = [];

  for (const group of groups) {
    const pages = (group.pages || []).map((p) => {
      const key = p.normalizedUrl || normalizeUrl(p.url);
      const isOpen = Boolean(key && openSet.has(key));
      if (isOpen) hiddenCount += 1;
      return { ...p, isOpen };
    });
    const visiblePages = showOpen ? pages : pages.filter((p) => !p.isOpen);
    if (visiblePages.length === 0 && !showOpen) {
      // Series with only open pages disappears from the list (pages hidden, not series-wide ban)
      continue;
    }
    result.push({
      ...group,
      pages: visiblePages,
      pageCount: visiblePages.length,
      openPageCount: pages.filter((p) => p.isOpen).length,
    });
  }

  return { groups: result, hiddenCount };
}

/**
 * True if a URL is currently open (normalized exact match).
 * @param {string} url
 * @param {Set<string>|Array} openTabs
 */
export function isUrlOpen(url, openTabs) {
  const openSet = openTabs instanceof Set ? openTabs : buildOpenUrlSet(openTabs);
  const n = normalizeUrl(url);
  return Boolean(n && openSet.has(n));
}
