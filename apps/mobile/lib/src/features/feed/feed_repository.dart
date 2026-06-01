import '../../core/network/api_client.dart';
import '../../shared/models/article.dart';

class FeedRepository {
  const FeedRepository(this._api);

  final ApiClient _api;

  Future<FeedResponse> getFeed() async {
    final json = await _api.getJson('/v1/articles/feed');
    return FeedResponse.fromJson(json);
  }
}

class FeedResponse {
  const FeedResponse({required this.items});

  factory FeedResponse.fromJson(Map<String, dynamic> json) {
    return FeedResponse(
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(Article.fromJson)
          .toList(),
    );
  }

  final List<Article> items;
}

