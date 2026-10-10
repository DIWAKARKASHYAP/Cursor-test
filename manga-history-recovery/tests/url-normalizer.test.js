import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, urlsMatch } from '../utils/url-normalizer.js';
import { parseMangaCherriUrl, isMangaCherriUrl } from '../sites/mangacherri.js';

describe('url-normalizer', () => {
  it('normalizes trailing slashes and https', () => {
    const a = normalizeUrl('http://www.mangacherri.com/what-id-like-to-do-with-that-gloomy-girl/24824/');
    const b = normalizeUrl('https://mangacherri.com/what-id-like-to-do-with-that-gloomy-girl/24824');
    assert.equal(a, b);
  });

  it('removes tracking parameters but keeps distinguishing params', () => {
    const n = normalizeUrl(
      'https://mangacherri.com/series/1?utm_source=x&page=2&fbclid=abc',
    );
    assert.ok(n.includes('page=2'));
    assert.ok(!n.includes('utm_source'));
    assert.ok(!n.includes('fbclid'));
  });

  it('distinguishes different chapter/page identifiers', () => {
    const a = normalizeUrl('https://mangacherri.com/gloomy-girl/24824');
    const b = normalizeUrl('https://mangacherri.com/gloomy-girl/24825');
    assert.notEqual(a, b);
    assert.equal(urlsMatch(a, b), false);
  });

  it('strips fragments and default ports', () => {
    const n = normalizeUrl('https://mangacherri.com:443/foo/1#section');
    assert.equal(n, 'https://mangacherri.com/foo/1');
  });

  it('returns null for malformed URLs', () => {
    assert.equal(normalizeUrl('not a url'), null);
    assert.equal(normalizeUrl(''), null);
  });
});

describe('MangaCherri parser', () => {
  const sample = 'https://mangacherri.com/what-id-like-to-do-with-that-gloomy-girl/24824';

  it('parses sample series-page URL', () => {
    const p = parseMangaCherriUrl(sample);
    assert.equal(p.kind, 'series-page');
    assert.equal(p.hostname, 'mangacherri.com');
    assert.equal(p.seriesSlug, 'what-id-like-to-do-with-that-gloomy-girl');
    assert.equal(p.pageId, '24824');
    assert.ok(p.normalizedUrl);
    assert.equal(isMangaCherriUrl(sample), true);
  });

  it('handles trailing slash and query params', () => {
    const p = parseMangaCherriUrl(sample + '/?utm_source=test&ref=1');
    assert.equal(p.kind, 'series-page');
    assert.equal(p.seriesSlug, 'what-id-like-to-do-with-that-gloomy-girl');
    assert.equal(p.pageId, '24824');
    assert.ok(!p.normalizedUrl.includes('utm_source'));
  });

  it('rejects invalid / unexpected paths as non series-page', () => {
    assert.equal(parseMangaCherriUrl('https://mangacherri.com/').kind, 'other');
    assert.equal(parseMangaCherriUrl('https://mangacherri.com/search').kind, 'other');
    assert.equal(parseMangaCherriUrl('https://example.com/foo/1').kind, 'other');
    assert.equal(parseMangaCherriUrl('totally-broken').kind, 'invalid');
  });

  it('parses series-root slug paths', () => {
    const p = parseMangaCherriUrl('https://mangacherri.com/what-id-like-to-do-with-that-gloomy-girl/');
    assert.equal(p.kind, 'series-root');
    assert.equal(p.seriesSlug, 'what-id-like-to-do-with-that-gloomy-girl');
    assert.equal(p.pageId, null);
  });

  it('does not treat numeric id as chapter number field', () => {
    const p = parseMangaCherriUrl(sample);
    assert.equal(p.pageId, '24824');
    assert.equal('chapterNumber' in p, false);
  });
});
