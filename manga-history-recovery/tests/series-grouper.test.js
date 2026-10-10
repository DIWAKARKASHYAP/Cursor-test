import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupBySeries, normalizeTitleKey } from '../utils/series-grouper.js';
import { enrichHistoryItem, dedupeHistoryEntries, buildDomainAllowlist, filterHistoryEntries } from '../utils/history-scanner.js';
import { parseMangaCherriUrl } from '../sites/mangacherri.js';

function entry(url, extras = {}) {
  const allow = buildDomainAllowlist();
  const parsed = parseMangaCherriUrl(url);
  return {
    ...enrichHistoryItem(
      {
        url,
        title: extras.title ?? parsed.titleHint,
        lastVisitTime: extras.lastVisitTime ?? 1000,
        visitCount: extras.visitCount ?? 1,
      },
      allow,
    ),
    ...extras,
  };
}

describe('series-grouper', () => {
  it('groups chapters from the same MangaCherri series', () => {
    const entries = [
      entry('https://mangacherri.com/gloomy-girl/24824', { lastVisitTime: 2000 }),
      entry('https://mangacherri.com/gloomy-girl/24825', { lastVisitTime: 3000 }),
      entry('https://mangacherri.com/gloomy-girl/24824/', { lastVisitTime: 2500, visitCount: 5 }),
    ];
    const deduped = dedupeHistoryEntries(entries);
    const groups = groupBySeries(deduped);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].pageCount, 2);
    assert.equal(groups[0].matchingConfidence, 'high');
    assert.ok(groups[0].pages.some((p) => p.normalizedUrl.endsWith('/24824')));
    assert.ok(groups[0].pages.some((p) => p.normalizedUrl.endsWith('/24825')));
  });

  it('avoids false grouping of similar titles / different slugs', () => {
    const groups = groupBySeries([
      entry('https://mangacherri.com/gloomy-girl/1'),
      entry('https://mangacherri.com/gloomy-girl-extra/1'),
    ]);
    assert.equal(groups.length, 2);
  });

  it('deduplicates repeated visits to the same normalized URL', () => {
    const deduped = dedupeHistoryEntries([
      entry('https://mangacherri.com/foo-bar/10', { lastVisitTime: 1, visitCount: 1 }),
      entry('https://mangacherri.com/foo-bar/10/', { lastVisitTime: 9, visitCount: 4 }),
    ]);
    assert.equal(deduped.length, 1);
    assert.equal(deduped[0].visitCount, 4);
    assert.equal(deduped[0].lastVisitTime, 9);
  });

  it('handles missing titles and malformed URLs safely', () => {
    const allow = buildDomainAllowlist();
    assert.equal(enrichHistoryItem({ url: 'not-a-url' }, allow), null);
    const e = enrichHistoryItem(
      { url: 'https://mangacherri.com/some-series/99', title: '', lastVisitTime: 1 },
      allow,
    );
    assert.equal(e.title, null);
    const groups = groupBySeries([e]);
    assert.equal(groups.length, 1);
    assert.ok(groups[0].title);
  });

  it('returns empty groups for empty history', () => {
    assert.deepEqual(groupBySeries([]), []);
  });

  it('filters by query / domain / date', () => {
    const entries = [
      entry('https://mangacherri.com/alpha-series/1', { lastVisitTime: 100, title: 'Alpha' }),
      entry('https://mangacherri.com/beta-series/2', { lastVisitTime: 200, title: 'Beta' }),
    ];
    const filtered = filterHistoryEntries(entries, { query: 'beta', domain: 'mangacherri.com' });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].siteParse.seriesSlug, 'beta-series');
  });

  it('normalizeTitleKey strips site suffixes', () => {
    assert.equal(normalizeTitleKey('My Manga - MangaCherri'), 'my manga');
  });
});
