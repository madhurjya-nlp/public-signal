class Article {
  const Article({
    required this.id,
    required this.title,
    required this.url,
    required this.source,
    required this.thumbnailUrl,
    required this.publishedAt,
    required this.summary,
    required this.categories,
    required this.createdAt,
    this.storyGroupId,
    String? storyTitle,
    List<RelatedSource>? relatedSources,
    this.isSaved = false,
    this.hasSkipped = false,
  })  : storyTitle = storyTitle ?? title,
        relatedSources = relatedSources ?? const [];

  factory Article.fromJson(Map<String, dynamic> json) {
    final sourceObject = json['source'];
    final id = json['id'];

    if (id is! String || !_uuidPattern.hasMatch(id)) {
      throw FormatException('Article id is not a valid UUID: $id');
    }

    return Article(
      id: id,
      title: (json['title'] ?? json['headline']) as String? ?? 'Untitled',
      url: (json['url'] ?? json['canonicalUrl']) as String? ?? '',
      source: sourceObject is String
          ? sourceObject
          : (sourceObject is Map<String, dynamic>
              ? sourceObject['name'] as String? ?? 'Unknown Source'
              : json['sourceName'] as String? ?? 'Unknown Source'),
      thumbnailUrl: (json['thumbnail_url'] ?? json['thumbnailUrl']) as String?,
      publishedAt: (json['published_at'] ?? json['publishedAt']) as String?,
      summary: json['summary'] as String?,
      categories: ((json['categories'] ??
              json['relatedTopics'] ??
              const <dynamic>[]) as List<dynamic>)
          .map((category) => category.toString())
          .toList(),
      createdAt: (json['created_at'] ?? json['createdAt']) as String? ?? '',
      storyGroupId: (json['story_group_id'] ?? json['storyGroupId']) as String?,
      storyTitle: (json['story_title'] ?? json['storyTitle']) as String?,
      relatedSources: ((json['related_sources'] ??
              json['relatedSources'] ??
              const <dynamic>[]) as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(RelatedSource.fromJson)
          .toList(),
      isSaved: (json['is_saved'] ?? json['isSaved']) as bool? ?? false,
      hasSkipped: (json['has_skipped'] ?? json['hasSkipped']) as bool? ?? false,
    );
  }

  final String id;
  final String title;
  final String url;
  final String source;
  final String? thumbnailUrl;
  final String? publishedAt;
  final String? summary;
  final List<String> categories;
  final String createdAt;
  final String? storyGroupId;
  final String storyTitle;
  final List<RelatedSource> relatedSources;
  final bool isSaved;
  final bool hasSkipped;

  String get headline => title;
  String get sourceName => source;
  String get canonicalUrl => url;
  String? get whyItMatters => null;
  List<String> get relatedTopics => categories;
  int? get readingTimeMinutes => null;
}

class RelatedSource {
  const RelatedSource({
    required this.source,
    required this.url,
  });

  factory RelatedSource.fromJson(Map<String, dynamic> json) {
    return RelatedSource(
      source: json['source'] as String? ?? 'Unknown Source',
      url: json['url'] as String?,
    );
  }

  final String source;
  final String? url;
}

final _uuidPattern = RegExp(
  r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);
