import '../../core/network/api_client.dart';
import '../../shared/models/collection.dart';

class CollectionsRepository {
  const CollectionsRepository(this._api);

  final ApiClient _api;

  Future<List<KnowledgeCollection>> listCollections() async {
    final json = await _api.getJson('/v1/collections');
    return (json['collections'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(KnowledgeCollection.fromJson)
        .toList();
  }

  Future<CollectionDetail> getCollection(String id) async {
    final json = await _api.getJson('/v1/collections/$id');
    return CollectionDetail.fromJson(json);
  }

  Future<KnowledgeCollection> createCollection({
    required String name,
    String? description,
  }) async {
    final json = await _api.postJson('/v1/collections', {
      'name': name,
      if (description != null) 'description': description,
      'isPublic': false,
    });
    return KnowledgeCollection.fromJson(json);
  }

  Future<void> saveArticle({
    required String collectionId,
    required String articleId,
  }) async {
    await _api.postJson('/v1/collections/$collectionId/items', {
      'articleId': articleId,
    });
  }

  Future<KnowledgeCollection> getOrCreateReadingDesk() async {
    final collections = await listCollections();
    if (collections.isNotEmpty) {
      return collections.first;
    }

    return createCollection(
      name: 'Reading Desk',
      description: 'Your first saved knowledge collection.',
    );
  }
}

