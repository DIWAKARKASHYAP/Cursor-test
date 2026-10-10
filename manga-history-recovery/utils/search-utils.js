/**
 * Optional online lookup helpers.
 * No API keys. User-triggered only. Does not replace history URLs.
 */

/**
 * Build a search-engine URL for finding an updated series link.
 * @param {string} titleOrSlug
 * @param {{ engine?: 'duckduckgo'|'google', domainHint?: string }} options
 * @returns {string|null}
 */
export function buildOnlineSearchUrl(titleOrSlug, options = {}) {
  const term = String(titleOrSlug || '').trim();
  if (!term) return null;

  const domainHint = options.domainHint || 'mangacherri';
  const query = `${term} ${domainHint}`.trim();
  const engine = options.engine || 'duckduckgo';

  if (engine === 'google') {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

/**
 * Label for UI to distinguish history vs online candidates.
 * @param {'history'|'online'} source
 */
export function sourceLabel(source) {
  if (source === 'online') return 'Online search (user-triggered)';
  return 'From Chrome history';
}

/**
 * Preferred query text from a series group.
 * @param {{ title?: string, seriesSlug?: string|null }} series
 */
export function seriesSearchQuery(series) {
  if (!series) return '';
  if (series.seriesSlug) {
    return series.seriesSlug.replace(/-/g, ' ');
  }
  return String(series.title || '').trim();
}
