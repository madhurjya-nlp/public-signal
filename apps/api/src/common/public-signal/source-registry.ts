import { InterestCategory } from './categories';

export const SOURCE_KINDS = [
  'rss',
  'html_index',
  'pdf_index',
  'audio_index',
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export const SOURCE_APPROVAL_STATUSES = [
  'candidate',
  'approved',
  'blocked',
] as const;

export type SourceApprovalStatus = (typeof SOURCE_APPROVAL_STATUSES)[number];

export interface IngestionSource {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  language: string;
  region: string;
  defaultCategories: InterestCategory[];
  enabled: boolean;
  approvalStatus: SourceApprovalStatus;
  pollIntervalMinutes?: number;
  notes?: string;
}

export const SOURCE_REGISTRY: IngestionSource[] = [
  {
    id: 'nasa-breaking-news',
    name: 'NASA Breaking News',
    kind: 'rss',
    url: 'https://www.nasa.gov/news-release/feed/',
    language: 'en',
    region: 'global',
    defaultCategories: ['science'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'mit-technology-review',
    name: 'MIT Technology Review',
    kind: 'rss',
    url: 'https://www.technologyreview.com/feed/',
    language: 'en',
    region: 'global',
    defaultCategories: ['technology', 'business'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'harvard-gazette',
    name: 'Harvard Gazette',
    kind: 'rss',
    url: 'https://news.harvard.edu/gazette/feed/',
    language: 'en',
    region: 'global',
    defaultCategories: ['science', 'culture'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'yale-environment-360',
    name: 'Yale Environment 360',
    kind: 'rss',
    url: 'https://e360.yale.edu/feed.xml',
    language: 'en',
    region: 'global',
    defaultCategories: ['environment'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'npr-politics',
    name: 'NPR Politics',
    kind: 'rss',
    url: 'https://feeds.npr.org/1014/rss.xml',
    language: 'en',
    region: 'united-states',
    defaultCategories: ['politics'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'npr-business',
    name: 'NPR Business',
    kind: 'rss',
    url: 'https://feeds.npr.org/1006/rss.xml',
    language: 'en',
    region: 'united-states',
    defaultCategories: ['business'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'smithsonian-magazine',
    name: 'Smithsonian Magazine',
    kind: 'rss',
    url: 'https://www.smithsonianmag.com/rss/latest_articles/',
    language: 'en',
    region: 'global',
    defaultCategories: ['history', 'culture'],
    enabled: true,
    approvalStatus: 'approved',
    pollIntervalMinutes: 120,
  },
  {
    id: 'india-today-rss-directory',
    name: 'India Today',
    kind: 'rss',
    url: 'https://www.indiatoday.in/rss',
    language: 'en',
    region: 'india',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official RSS directory. Commercial use requires express consent and section feed URLs must be selected explicitly.',
  },
  {
    id: 'pib-press-releases-english',
    name: 'Press Information Bureau - Press Releases',
    kind: 'rss',
    url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1',
    language: 'en',
    region: 'india',
    defaultCategories: ['politics'],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official Government of India English press-release RSS feed. Review as a government source before any local-only approval.',
  },
  {
    id: 'indian-express-india',
    name: 'The Indian Express - India',
    kind: 'rss',
    url: 'https://indianexpress.com/section/india/feed/',
    language: 'en',
    region: 'india',
    defaultCategories: ['politics'],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official India section RSS feed. Published RSS terms restrict consumption to personal and non-commercial use.',
  },
  {
    id: 'indian-express-assam',
    name: 'The Indian Express - Assam',
    kind: 'rss',
    url: 'https://indianexpress.com/section/north-east-india/assam/feed/',
    language: 'en',
    region: 'india-assam',
    defaultCategories: ['politics'],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official Assam section RSS feed. Published RSS terms restrict consumption to personal and non-commercial use.',
  },
  {
    id: 'indian-express-technology',
    name: 'The Indian Express - Technology',
    kind: 'rss',
    url: 'https://indianexpress.com/section/technology/feed/',
    language: 'en',
    region: 'india',
    defaultCategories: ['technology'],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official technology section RSS feed. Published RSS terms restrict consumption to personal and non-commercial use.',
  },
  {
    id: 'republic-world-rss-directory',
    name: 'Republic World',
    kind: 'rss',
    url: 'https://www.republicworld.com/rss',
    language: 'en',
    region: 'india',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official RSS directory. Select and approve section feed URLs before enabling ingestion.',
  },
  {
    id: 'republic-bharat-rss-directory',
    name: 'Republic Bharat',
    kind: 'rss',
    url: 'https://www.republicbharat.com/rss',
    language: 'hi',
    region: 'india',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official Hindi RSS directory. Select and approve section feed URLs before enabling ingestion.',
  },
  {
    id: 'newsonair-home',
    name: 'Akashvani News / NewsOnAir',
    kind: 'html_index',
    url: 'https://newsonair.gov.in/',
    language: 'multi',
    region: 'india',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official national, regional, transcript, audio, and bulletin index. Requires a source-specific adapter.',
  },
  {
    id: 'newsonair-regional-text',
    name: 'NewsOnAir Regional Text Bulletins',
    kind: 'pdf_index',
    url: 'https://www.newsonair.gov.in/bulletins-category/regional-text/',
    language: 'multi',
    region: 'india-regional',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Official regional bulletin listing. Add metadata indexing before PDF extraction.',
  },
  {
    id: 'dd-news-english',
    name: 'DD News',
    kind: 'html_index',
    url: 'https://ddnews.gov.in/en/',
    language: 'en',
    region: 'india',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes: 'Official article listing. Requires a source-specific adapter.',
  },
  {
    id: 'aaj-tak-home',
    name: 'Aaj Tak',
    kind: 'html_index',
    url: 'https://www.aajtak.in/',
    language: 'hi',
    region: 'india',
    defaultCategories: [],
    enabled: false,
    approvalStatus: 'candidate',
    notes:
      'Confirm permitted integration and define a source-specific adapter before enabling.',
  },
];

export function getEnabledApprovedSources(kind?: SourceKind): IngestionSource[] {
  return SOURCE_REGISTRY.filter((source) => {
    const hasRequestedKind = kind ? source.kind === kind : true;

    return (
      hasRequestedKind &&
      source.enabled &&
      source.approvalStatus === 'approved'
    );
  });
}
