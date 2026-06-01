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
  });

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

  String get headline => title;
  String get sourceName => source;
  String get canonicalUrl => url;
  String? get whyItMatters => null;
  List<String> get relatedTopics => categories;
  int? get readingTimeMinutes => null;
}

final _uuidPattern = RegExp(
  r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);
