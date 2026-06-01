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

Quality classifications:

- `good_candidate`: enough items, strong title/URL/date/summary coverage, low
  duplicates, and usable default category fit.
- `usable_with_limitations`: parseable and useful, but missing some metadata.
- `poor_candidate`: too sparse or inconsistent for MVP ingestion.
- `broken`: fetch failed or no usable URLs were parsed.

This score is for developer review only. Do not expose it in the app UI.

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
