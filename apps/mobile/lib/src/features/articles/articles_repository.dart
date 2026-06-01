import '../../core/network/api_client.dart';
import '../../shared/models/article.dart';

class ArticlesRepository {
  const ArticlesRepository(this._api);

  final ApiClient _api;

  Future<Article> getArticle(String id) async {
    final json = await _api.getJson('/v1/articles/$id');
    return Article.fromJson(json);
  }
}

