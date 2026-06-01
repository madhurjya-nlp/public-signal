import 'article.dart';

class KnowledgeCollection {
  const KnowledgeCollection({
    required this.id,
    required this.name,
    required this.description,
    required this.itemCount,
  });

  factory KnowledgeCollection.fromJson(Map<String, dynamic> json) {
    return KnowledgeCollection(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Untitled Desk',
      description: json['description'] as String?,
      itemCount: json['itemCount'] as int? ?? 0,
    );
  }

  final String id;
  final String name;
  final String? description;
  final int itemCount;
}

class CollectionDetail extends KnowledgeCollection {
  const CollectionDetail({
    required super.id,
    required super.name,
    required super.description,
    required super.itemCount,
    required this.items,
  });

  factory CollectionDetail.fromJson(Map<String, dynamic> json) {
    return CollectionDetail(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Untitled Desk',
      description: json['description'] as String?,
      itemCount: json['itemCount'] as int? ?? 0,
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(CollectionItem.fromJson)
          .toList(),
    );
  }

  final List<CollectionItem> items;
}

class CollectionItem {
  const CollectionItem({
    required this.article,
    required this.note,
    required this.savedAt,
  });

  factory CollectionItem.fromJson(Map<String, dynamic> json) {
    return CollectionItem(
      article: Article.fromJson(json['article'] as Map<String, dynamic>),
      note: json['note'] as String?,
      savedAt: json['savedAt'] as String? ?? '',
    );
  }

  final Article article;
  final String? note;
  final String savedAt;
}

