import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOpenTabFilter,
  filterSeriesGroupsByOpenTabs,
  buildOpenUrlSet,
  isUrlOpen,
} from '../utils/tab-deduplicator.js';
import { groupBySeries } from '../utils/series-grouper.js';
import { enrichHistoryItem, buildDomainAllowlist, dedupeHistoryEntries } from '../utils/history-scanner.js';

function entry(url, extras = {}) {
  const allow = buildDomainAllowlist();
  return enrichHistoryItem(
    { url, title: extras.title, lastVisitTime: extras.lastVisitTime ?? 1, visitCount: 1 },
    allow,
  );
}

describe('tab-deduplicator', () => {
  it('excludes exact open-tab URLs after normalization', () => {
    const entries = [
      entry('https://mangacherri.com/gloomy-girl/24824'),
      entry('https://mangacherri.com/gloomy-girl/24825'),
    ];
    const open = buildOpenUrlSet(['https://www.mangacherri.com/gloomy-girl/24824/']);
    const { visible, hiddenCount } = applyOpenTabFilter(entries, open, { showOpen: false });
    assert.equal(hiddenCount, 1);
    assert.equal(visible.length, 1);
    assert.ok(visible[0].normalizedUrl.endsWith('/24825'));
  });

  it('keeps other chapters when one chapter is open', () => {
    const entries = dedupeHistoryEntries([
      entry('https://mangacherri.com/gloomy-girl/24824'),
      entry('https://mangacherri.com/gloomy-girl/24825'),
      entry('https://mangacherri.com/gloomy-girl/24826'),
    ]);
    const groups = groupBySeries(entries);
    const { groups: filtered, hiddenCount } = filterSeriesGroupsByOpenTabs(
      groups,
      ['https://mangacherri.com/gloomy-girl/24825'],
      { showOpen: false },
    );
    assert.equal(hiddenCount, 1);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].pageCount, 2);
    assert.ok(filtered[0].pages.every((p) => !p.normalizedUrl.endsWith('/24825')));
  });

  it('toggle showOpen keeps open URLs visible', () => {
    const entries = [entry('https://mangacherri.com/gloomy-girl/1')];
    const { visible, hiddenCount } = applyOpenTabFilter(
      entries,
      ['https://mangacherri.com/gloomy-girl/1'],
      { showOpen: true },
    );
    assert.equal(hiddenCount, 1);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].isOpen, true);
  });

  it('isUrlOpen respects normalization', () => {
    assert.equal(
      isUrlOpen('https://mangacherri.com/x/1/', ['http://www.mangacherri.com/x/1']),
      true,
    );
    assert.equal(isUrlOpen('https://mangacherri.com/x/2', ['https://mangacherri.com/x/1']), false);
  });

  it('handles empty history / empty open tabs', () => {
    const { visible, hiddenCount } = applyOpenTabFilter([], [], { showOpen: false });
    assert.equal(visible.length, 0);
    assert.equal(hiddenCount, 0);
    const groups = groupBySeries([]);
    const r = filterSeriesGroupsByOpenTabs(groups, [], { showOpen: false });
    assert.deepEqual(r.groups, []);
  });
});
