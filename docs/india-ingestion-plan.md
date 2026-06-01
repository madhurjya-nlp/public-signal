# Indian News Ingestion Plan

## Goal

Expand Public Signal with Indian national and regional news while preserving:

- Source attribution.
- Canonical source links.
- Copyright boundaries.
- Predictable ingestion behavior.
- Per-source operational control.

Do not build one universal scraper. Each source type has different reliability,
rights, and extraction constraints.

## Source Tiers

### Tier 1: Official RSS

Use official RSS feeds when a source publishes them and usage is approved.

Initial candidates:

| Source | Surface | Status | Notes |
| --- | --- | --- | --- |
| India Today | `https://www.indiatoday.in/rss` | License review required | Official RSS page. Its published terms restrict commercial use without express consent. |
| Republic World | `https://www.republicworld.com/rss` | License review required | Official RSS page with section feeds. |
| Republic Bharat | `https://www.republicbharat.com/rss` | License review required | Official Hindi RSS page with section feeds. |
| PIB English press releases | `https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1` | Candidate review only | Official direct RSS endpoint. The local helper currently parses zero items. |
| The Indian Express - India | `https://indianexpress.com/section/india/feed/` | License review required | Official direct section RSS feed. Published RSS terms restrict consumption to personal and non-commercial use. |
| The Indian Express - Assam | `https://indianexpress.com/section/north-east-india/assam/feed/` | License review required | Official direct regional RSS feed. Published RSS terms restrict consumption to personal and non-commercial use. |
| The Indian Express - Technology | `https://indianexpress.com/section/technology/feed/` | License review required | Official direct section RSS feed. Published RSS terms restrict consumption to personal and non-commercial use. |

Implementation rule:

- Add a feed only after validating its URL, terms, expected language, and default
  categories.
- Store only metadata and excerpts supplied by the feed.
- Do not crawl full article bodies by default.

### Tier 2: Official HTML Indexes

Use narrow per-source adapters for official pages that expose structured article,
transcript, or bulletin listings but do not publish a suitable RSS feed.

Initial candidates:

| Source | Surface | Status | Notes |
| --- | --- | --- | --- |
| Akashvani News / NewsOnAir | `https://newsonair.gov.in/` | Adapter discovery | National and regional news, audio bulletins, transcripts, and regional text listings. |
| DD News | `https://ddnews.gov.in/en/` | Adapter discovery | Official article listing and article pages. |
| Aaj Tak | `https://www.aajtak.in/` | Permission and adapter discovery | Do not assume an RSS feed. Confirm permitted integration before writing an adapter. |

Implementation rule:

- Parse only listing metadata needed by Public Signal.
- Use source-specific selectors and fixture tests.
- Respect robots, source terms, rate limits, and retry backoff.
- Disable an adapter automatically after repeated parse failures.

### Tier 3: Regional PDF Bulletins

NewsOnAir exposes regional text bulletin listings and PDF downloads for multiple
languages. PDF processing should be a separate ingestion stage.

Pipeline:

```text
Official bulletin index
  -> PDF metadata record
  -> download with rate limit
  -> SHA-256 deduplication
  -> embedded text extraction
  -> OCR fallback only when required
  -> bulletin segmentation
  -> category classification
  -> human-review sample
  -> publish article metadata and source PDF link
```

Store:

- Source URL.
- PDF URL.
- Bulletin language.
- Region.
- Publication timestamp.
- File hash.
- Extractor version.
- Derived headline.
- Derived summary.
- Categories.

Avoid storing or republishing full bulletin text unless rights allow it.

### Tier 4: Audio Bulletins

Treat audio as a later milestone.

Preferred order:

1. Use official transcripts when present.
2. Link official audio metadata.
3. Add speech-to-text only after rights, cost, and quality review.
4. Keep transcript provenance and model metadata.

Do not scrape live broadcast streams in the first milestone.

### Tier 5: Local Newspapers

Add local newspapers one at a time. Each adapter needs:

- Written source approval or a clearly permitted official feed.
- Language and region metadata.
- Rate-limit policy.
- Fixture-based parser tests.
- Monitoring for HTML changes.

Start with one region and two or three sources, not every state at once.

## Recommended Implementation Order

### Milestone 1: Source Registry

Replace the hardcoded RSS array with a typed source registry:

```text
id
name
kind: rss | html_index | pdf_index | audio_index
url
language
region
default_categories
enabled
approval_status: candidate | approved | blocked
```

Only `approved` and `enabled` sources may run automatically.

Status: implemented in
`apps/api/src/common/public-signal/source-registry.ts`.

Current behavior:

- Existing approved RSS feeds continue to run.
- Indian source surfaces are recorded as disabled candidates.
- Automatic RSS ingestion reads only enabled sources with
  `approvalStatus: 'approved'`.

## Local Source Review Helper

Use the local RSS review helper to test one registry source at a time without
enabling it and without writing to Supabase.

Command:

```powershell
cd C:\dev\personal-newspaper
npm run review:rss-source -- --source-id=<source-id>
```

Example:

```powershell
npm run review:rss-source -- --source-id=india-today-rss-directory
```

The helper reports:

- source id
- source name
- URL
- source kind
- current `enabled` value
- current `approvalStatus`
- fetch success or failure
- number of parsed items
- number of items with title
- number of items with URL
- number of items with published date
- number of items with summary
- number of items with thumbnail
- unique URL count
- duplicate URL count
- default categories
- example parsed item
- local-only quality classification
- whether the source is safe to review further

The helper uses a bounded 15-second fetch timeout. A candidate that times out or
returns no usable item URLs is classified as `broken`.

Quality classifications:

- `good_candidate`: enough items, strong title/URL/date/summary coverage, low
  duplicates, and usable default category fit.
- `usable_with_limitations`: parseable and useful, but missing some metadata.
- `poor_candidate`: too sparse or inconsistent for MVP ingestion.
- `broken`: fetch failed or no usable URLs were parsed.

This score is for developer review only. Do not expose it in the app UI.

## Direct RSS Candidate Review Results

Reviewed locally on June 1, 2026. Every source below remains disabled with
`approvalStatus: 'candidate'`.

| Source ID | Items parsed | Quality classification | Notes |
| --- | ---: | --- | --- |
| `pib-press-releases-english` | 0 | `broken` | The official endpoint fetched successfully but produced no usable RSS items for the current parser. |
| `indian-express-india` | 200 | `usable_with_limitations` | Titles, URLs, published dates, and URL uniqueness are complete. Summaries and thumbnails are absent. |
| `indian-express-assam` | 200 | `usable_with_limitations` | Titles, URLs, published dates, and URL uniqueness are complete. Summaries and thumbnails are absent. Review freshness before use because the regional section may update less frequently. |
| `indian-express-technology` | 200 | `usable_with_limitations` | Titles, URLs, published dates, and URL uniqueness are complete. Summaries and thumbnails are absent. |

Do not permanently approve these feeds yet. For the next strictly local-only
smoke test, test `indian-express-india` alone. It has the broadest current India
coverage in this batch and consistent metadata, but its published RSS terms
still require legal review before any production or commercial use.

## Local-only Candidate Ingestion Smoke Test

Use this command to ingest one reviewed RSS candidate into local Supabase only:

```powershell
cd C:\dev\personal-newspaper
npm run ingest:rss-source:local -- --source-id=indian-express-india --limit=20
```

Purpose:

- Test one reviewed candidate source against the existing local MVP feed,
  voting, and rankings flow.
- Preserve source metadata, database-generated article UUIDs, canonical URL
  deduplication, and default source categories.

Constraints:

- This is not production approval.
- This does not enable automatic ingestion.
- This does not affect scheduled ingestion.
- This does not mutate `enabled`.
- This does not mutate `approvalStatus`.
- This requires `SUPABASE_URL` to point to `localhost` or `127.0.0.1`.

Warning: `indian-express-india` must not be approved for production without
terms and legal review. Its RSS terms appear limited to personal and
non-commercial use.

Next manual verification:

1. Start local Supabase.
2. Start the backend.
3. Run the local candidate ingestion command.
4. Start Flutter.
5. Confirm Indian articles appear in the feed.
6. Vote on an Indian article.
7. Verify rankings update.

## Approval Checklist Before Enabling a Source

Do not enable a candidate source until all checklist items pass:

- The source URL is official.
- Terms and copyright posture are reviewed.
- The source is appropriate for metadata/excerpt ingestion.
- The source returns enough usable items.
- URLs are canonical and mostly unique.
- Titles are consistently present.
- Published dates are usable or the limitation is accepted.
- Summaries are present or the limitation is accepted.
- Missing thumbnails do not break ingestion.
- Default Public Signal categories are selected intentionally.
- Language and region metadata are correct.
- One source has been tested alone before testing another.
- The source has fixture or unit coverage where practical.

Warning: do not enable all Indian sources at once. Start with one source only,
preferably Akashvani News / NewsOnAir or DD News after a source-specific adapter
exists. RSS review currently applies only to registry entries with `kind: 'rss'`.

### Milestone 2: Approved Indian RSS Feeds

Add approved India Today and Republic feeds through the existing RSS parser.

Acceptance:

- Metadata ingestion works.
- URL deduplication works.
- Source and language are preserved.
- Failures are isolated per feed.

### Milestone 3: NewsOnAir Transcript and Regional Index Adapter

Add a NewsOnAir index adapter for:

- Current national news metadata.
- Regional text bulletin metadata.
- PDF links.
- Audio links.

Do not OCR PDFs yet.

### Milestone 4: PDF Extraction Worker

Add a bounded PDF extraction service with:

- Download size limit.
- MIME validation.
- Hash deduplication.
- Text extraction.
- OCR fallback.
- Language metadata.
- Extraction audit record.

### Milestone 5: Topic Classification

Start with deterministic keyword/category mappings. Add model-assisted
classification only after the extraction pipeline is measurable.

Supported Public Signal categories remain:

- science
- history
- technology
- culture
- politics
- business
- environment

## Security and Operational Constraints

- Block arbitrary user-provided crawl URLs.
- Allowlist hosts in the source registry.
- Set request timeouts and response-size limits.
- Rate-limit each host.
- Store canonical links and attribution.
- Keep ingestion failures observable per source.
- Do not expose ingestion controls publicly in production.
- Do not store full copyrighted articles by default.
