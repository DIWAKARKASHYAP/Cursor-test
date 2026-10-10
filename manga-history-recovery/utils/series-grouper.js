/**
 * Conservative series grouping for manga/manhwa history entries.
 *
 * Match order:
 * 1. Site-specific series slug / identifier
 * 2. Reliable title from page title or URL
 * 3. Conservative normalized-title matching (uncertain)
 */

import { mangaCherriAdapter } from '../sites/mangacherri.js';

const ADAPTERS = [mangaCherriAdapter];

/**
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitleKey(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\s*[-|–—:].*$/, '') // drop site suffix after separators
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {object} entry
 * @returns {{ key: string, confidence: 'high'|'medium'|'low'|'uncertain', title: string, domain: string }}
 */
export function resolveSeriesIdentity(entry) {
  const domain = entry.domain || '';
  const adapter = ADAPTERS.find((a) => a.domain === domain || a.matches?.(entry.url));

  if (adapter) {
    const parsed = entry.siteParse || adapter.parse(entry.url);
    const siteKey = adapter.seriesKey(parsed);
    if (siteKey) {
      return {
        key: siteKey,
        confidence: 'high',
        title: parsed.titleHint || entry.title || parsed.seriesSlug || 'Unknown series',
        domain: adapter.domain,
        seriesSlug: parsed.seriesSlug || null,
      };
    }
  }

  if (entry.title) {
    const titleKey = normalizeTitleKey(entry.title);
    if (titleKey.length >= 4) {
      return {
        key: `${domain}::title::${titleKey}`,
        confidence: 'medium',
        title: entry.title,
        domain,
        seriesSlug: null,
      };
    }
  }

  // Fallback: host + first path segment if it looks slug-like
  try {
    const u = new URL(entry.normalizedUrl || entry.url);
    const seg = u.pathname.split('/').filter(Boolean)[0];
    if (seg && /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(seg)) {
      const slug = seg.toLowerCase();
      return {
        key: `${domain}::path::${slug}`,
        confidence: 'low',
        title: slug.replace(/-/g, ' '),
        domain,
        seriesSlug: slug,
      };
    }
  } catch {
    // ignore
  }

  // Uncertain singleton — do not merge with others
  const singleton = entry.normalizedUrl || entry.url || String(Math.random());
  return {
    key: `${domain}::singleton::${singleton}`,
    confidence: 'uncertain',
    title: entry.title || entry.url || 'Unrecognized page',
    domain,
    seriesSlug: null,
  };
}

/**
 * Group history entries into series. Different chapters stay as separate pages.
 * Similar titles on different keys are not merged; uncertain matches stay separate.
 *
 * @param {object[]} entries
 * @returns {object[]} series groups sorted by lastVisited desc
 */
export function groupBySeries(entries) {
  /** @type {Map<string, object>} */
  const groups = new Map();

  for (const entry of entries) {
    if (!entry?.normalizedUrl && !entry?.url) continue;
    const identity = resolveSeriesIdentity(entry);
    let group = groups.get(identity.key);
    if (!group) {
      group = {
        id: identity.key,
        title: identity.title,
        sourceDomain: identity.domain,
        seriesSlug: identity.seriesSlug,
        matchingConfidence: identity.confidence,
        uncertain: identity.confidence === 'uncertain',
        pages: [],
        pageMap: new Map(),
        lastVisitTime: 0,
        totalVisitCount: 0,
      };
      groups.set(identity.key, group);
    } else if (identity.confidence === 'high' && group.matchingConfidence !== 'high') {
      group.matchingConfidence = 'high';
      group.uncertain = false;
      if (identity.title) group.title = identity.title;
    }

    const pageKey = entry.normalizedUrl || entry.url;
    const existing = group.pageMap.get(pageKey);
    if (!existing) {
      const page = {
        url: entry.url,
        normalizedUrl: entry.normalizedUrl,
        title: entry.title,
        lastVisitTime: entry.lastVisitTime || 0,
        visitCount: entry.visitCount || 0,
        pageId: entry.siteParse?.pageId ?? null,
        isOpen: Boolean(entry.isOpen),
      };
      group.pageMap.set(pageKey, page);
      group.pages.push(page);
    } else {
      existing.lastVisitTime = Math.max(existing.lastVisitTime || 0, entry.lastVisitTime || 0);
      existing.visitCount = Math.max(existing.visitCount || 0, entry.visitCount || 0);
      if (!existing.title && entry.title) existing.title = entry.title;
      if ((entry.lastVisitTime || 0) >= (existing.lastVisitTime || 0)) {
        existing.url = entry.url;
      }
      existing.isOpen = existing.isOpen || Boolean(entry.isOpen);
    }

    // Prefer a better display title
    if (identity.confidence === 'high' && identity.title) {
      group.title = identity.title;
    } else if ((!group.title || group.title === 'Unknown series') && entry.title) {
      group.title = entry.title;
    }

    group.lastVisitTime = Math.max(group.lastVisitTime, entry.lastVisitTime || 0);
    group.totalVisitCount += entry.visitCount || 0;
  }

  const result = [...groups.values()].map((g) => {
    const { pageMap, ...rest } = g;
    rest.pages.sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
    rest.pageCount = rest.pages.length;
    return rest;
  });

  result.sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
  return result;
}

/**
 * @param {object[]} groups
 * @param {'lastVisited'|'title'|'visitCount'} sortBy
 */
export function sortSeriesGroups(groups, sortBy = 'lastVisited') {
  const copy = [...groups];
  switch (sortBy) {
    case 'title':
      copy.sort((a, b) => String(a.title).localeCompare(String(b.title)));
      break;
    case 'visitCount':
      copy.sort((a, b) => (b.totalVisitCount || 0) - (a.totalVisitCount || 0));
      break;
    case 'lastVisited':
    default:
      copy.sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
      break;
  }
  return copy;
}
