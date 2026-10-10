/**
 * URL normalization for duplicate comparison.
 * Preserves chapter/page identifiers; strips only safe tracking params.
 */

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'ref',
  '_ga',
  'yclid',
]);

/**
 * @param {string} raw
 * @returns {string|null} normalized URL string, or null if unparseable
 */
export function normalizeUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;

  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  url.protocol = 'https:';
  url.hostname = url.hostname.toLowerCase();
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
  }

  // Drop default ports
  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }

  // Remove fragment
  url.hash = '';

  // Strip tracking query params; keep everything else (sorted for stability)
  const kept = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      kept.push([key, value]);
    }
  }
  kept.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  url.search = '';
  for (const [key, value] of kept) {
    url.searchParams.append(key, value);
  }

  // Normalize pathname: decode safely, collapse duplicate slashes, trim trailing slash
  let path = url.pathname || '/';
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep encoded path if malformed
  }
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  url.pathname = path;

  // Prefer https host + path + search (no username/password)
  return `${url.protocol}//${url.host}${url.pathname}${url.search}`;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function urlsMatch(a, b) {
  const na = normalizeUrl(a);
  const nb = normalizeUrl(b);
  return na !== null && nb !== null && na === nb;
}

export { TRACKING_PARAMS };
