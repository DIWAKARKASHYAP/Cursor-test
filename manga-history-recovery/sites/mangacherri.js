/**
 * MangaCherri site adapter.
 * Provisional URL pattern: /{series-slug}/{numeric-id}
 * Sample: https://mangacherri.com/what-id-like-to-do-with-that-gloomy-girl/24824
 *
 * The numeric id is treated as a page identifier, not necessarily a chapter number.
 */

import { normalizeUrl } from '../utils/url-normalizer.js';

export const MANGACHERRI_DOMAIN = 'mangacherri.com';
export const MANGACHERRI_HOSTS = new Set(['mangacherri.com', 'www.mangacherri.com']);

/** Path: /slug/numericId with optional trailing slash */
const SERIES_PAGE_RE = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(\d+)\/?$/i;

/**
 * @param {string} hostname
 * @returns {boolean}
 */
export function isMangaCherriHost(hostname) {
  if (!hostname) return false;
  const host = String(hostname).toLowerCase().replace(/^www\./, '');
  return host === MANGACHERRI_DOMAIN;
}

/**
 * @param {string} rawUrl
 * @returns {boolean}
 */
export function isMangaCherriUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return isMangaCherriHost(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Parse a MangaCherri URL into structured fields.
 * @param {string} rawUrl
 * @returns {{
 *   hostname: string,
 *   seriesSlug: string|null,
 *   pageId: string|null,
 *   originalUrl: string,
 *   normalizedUrl: string|null,
 *   kind: 'series-page'|'series-root'|'other'|'invalid',
 *   titleHint: string|null
 * }}
 */
export function parseMangaCherriUrl(rawUrl) {
  const originalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const normalizedUrl = normalizeUrl(originalUrl);

  if (!normalizedUrl) {
    return {
      hostname: '',
      seriesSlug: null,
      pageId: null,
      originalUrl,
      normalizedUrl: null,
      kind: 'invalid',
      titleHint: null,
    };
  }

  let url;
  try {
    url = new URL(normalizedUrl);
  } catch {
    return {
      hostname: '',
      seriesSlug: null,
      pageId: null,
      originalUrl,
      normalizedUrl: null,
      kind: 'invalid',
      titleHint: null,
    };
  }

  const hostname = url.hostname.replace(/^www\./, '');
  if (!isMangaCherriHost(hostname)) {
    return {
      hostname,
      seriesSlug: null,
      pageId: null,
      originalUrl,
      normalizedUrl,
      kind: 'other',
      titleHint: null,
    };
  }

  const path = url.pathname || '/';
  const pageMatch = path.match(SERIES_PAGE_RE);
  if (pageMatch) {
    const seriesSlug = pageMatch[1].toLowerCase();
    const pageId = pageMatch[2];
    return {
      hostname,
      seriesSlug,
      pageId,
      originalUrl,
      normalizedUrl,
      kind: 'series-page',
      titleHint: slugToTitleHint(seriesSlug),
    };
  }

  // Series listing / root-ish: /slug or /slug/
  const rootMatch = path.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/i);
  if (rootMatch && rootMatch[1].toLowerCase() !== 'search') {
    const seriesSlug = rootMatch[1].toLowerCase();
    return {
      hostname,
      seriesSlug,
      pageId: null,
      originalUrl,
      normalizedUrl,
      kind: 'series-root',
      titleHint: slugToTitleHint(seriesSlug),
    };
  }

  return {
    hostname,
    seriesSlug: null,
    pageId: null,
    originalUrl,
    normalizedUrl,
    kind: 'other',
    titleHint: null,
  };
}

/**
 * @param {string} slug
 * @returns {string}
 */
export function slugToTitleHint(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Site adapter interface used by scanner / grouper.
 */
export const mangaCherriAdapter = {
  id: 'mangacherri',
  domain: MANGACHERRI_DOMAIN,
  matches(url) {
    return isMangaCherriUrl(url);
  },
  parse(url) {
    return parseMangaCherriUrl(url);
  },
  /**
   * Stable series key when slug is available.
   * @param {ReturnType<typeof parseMangaCherriUrl>} parsed
   * @returns {string|null}
   */
  seriesKey(parsed) {
    if (parsed?.seriesSlug) {
      return `${MANGACHERRI_DOMAIN}::slug::${parsed.seriesSlug}`;
    }
    return null;
  },
};
