# Manga & Manhwa History Recovery

Chrome extension (Manifest V3) that recovers manga/manhwa reading history from **local** Chrome History. It groups chapters by series, hides URLs already open in tabs, and presents results in a searchable dark-mode-friendly dashboard.

Core scan / group / dedupe works **offline**. Optional online lookup opens a search-engine tab only when you click it. Nothing is uploaded.

## Install (Load unpacked)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `manga-history-recovery/`
5. Pin the extension and open the popup, or open the full dashboard from the popup button

## Permissions

| Permission | Why |
|------------|-----|
| `history` | Scan your Chrome browsing history for manga site URLs |
| `tabs` | Detect already-open URLs (exclude duplicates) and open recovered links / the dashboard |
| `storage` | Save preferences (filters, custom domains, show-open toggle) — **not** a full history dump |

No host permissions and no content scripts are requested.

## Features

- Scan history for allowlisted manga domains (starts with `mangacherri.com`)
- Parse MangaCherri URLs like `/{series-slug}/{numeric-id}`
- Group pages by series (conservative matching)
- Hide exact open-tab URLs without hiding sibling chapters
- Search, filter by domain/date, sort, copy, open individually
- Optional “Search online” (DuckDuckGo) — user-triggered only
- Custom domain allowlist entries

## Development

```bash
cd manga-history-recovery
npm test
npm run check:syntax
```

Uses Node’s built-in test runner. No bundler; plain JS modules.

## Privacy

- History is processed locally in the extension
- Core functionality does not require network access
- Online search never silently replaces history-derived URLs
- Prefer querying `chrome.history` on each scan rather than storing full history

## Manual test checklist

1. Load unpacked; popup shows series/page counts without errors
2. Open dashboard; loading → results (or empty state if no MangaCherri history)
3. With a MangaCherri tab open, confirm that exact URL is hidden but other chapters remain
4. Toggle “Show already-open URLs” and verify open pages reappear
5. Search by slug/title; filter domain/date; sort options work
6. Copy URL and Open URL work; Open rechecks open tabs first
7. “Search online” opens a search tab and labels history links separately
8. Disconnect network; rescan still works from local history
9. Add a custom domain; prefs persist after reload

## Project layout

See files under `utils/`, `sites/`, `tests/`, plus `popup.*`, `dashboard.*`, `background.js`, `manifest.json`.
