import '../../core/network/api_client.dart';
import '../../shared/models/article.dart';

class UserActionsRepository {
  const UserActionsRepository(this._api);

  final ApiClient _api;

  Future<bool> saveArticle(String articleId) async {
    final json = await _api.postJson('/v1/articles/$articleId/save', {});
    return json['saved'] as bool? ?? true;
  }

  Future<bool> unsaveArticle(String articleId) async {
    final json = await _api.deleteJson('/v1/articles/$articleId/save');
    return json['saved'] as bool? ?? false;
  }

  Future<bool> skipArticle(String articleId) async {
    final json = await _api.postJson('/v1/articles/$articleId/skip', {});
    return json['skipped'] as bool? ?? true;
  }

  Future<SavedArticlesResponse> fetchSavedArticles() async {
    final json = await _api.getJson('/v1/me/saved-articles');
    return SavedArticlesResponse.fromJson(json);
  }

  Future<UserAnalytics> fetchUserAnalytics() async {
    final json = await _api.getJson('/v1/me/analytics');
    return UserAnalytics.fromJson(json);
  }

  Future<VotedArticlesResponse> fetchVotedArticles({String? voteType}) async {
    final suffix = voteType == null ? '' : '?vote_type=$voteType';
    final json = await _api.getJson('/v1/me/voted-articles$suffix');
    return VotedArticlesResponse.fromJson(json);
  }

  Future<SkippedArticlesResponse> fetchSkippedArticles() async {
    final json = await _api.getJson('/v1/me/skipped-articles');
    return SkippedArticlesResponse.fromJson(json);
  }
}

class SavedArticlesResponse {
  const SavedArticlesResponse({required this.items});

  factory SavedArticlesResponse.fromJson(Map<String, dynamic> json) {
    return SavedArticlesResponse(
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(SavedArticleItem.fromJson)
          .toList(),
    );
  }

  final List<SavedArticleItem> items;
}

class SavedArticleItem {
  const SavedArticleItem({
    required this.article,
    required this.savedAt,
  });

  factory SavedArticleItem.fromJson(Map<String, dynamic> json) {
    return SavedArticleItem(
      article: Article.fromJson(json['article'] as Map<String, dynamic>),
      savedAt: json['saved_at'] as String? ?? '',
    );
  }

  final Article article;
  final String savedAt;
}

class VotedArticlesResponse {
  const VotedArticlesResponse({required this.items});

  factory VotedArticlesResponse.fromJson(Map<String, dynamic> json) {
    return VotedArticlesResponse(
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(VotedArticleItem.fromJson)
          .toList(),
    );
  }

  final List<VotedArticleItem> items;
}

class VotedArticleItem {
  const VotedArticleItem({
    required this.article,
    required this.voteType,
    required this.createdAt,
  });

  factory VotedArticleItem.fromJson(Map<String, dynamic> json) {
    return VotedArticleItem(
      article: Article.fromJson(json['article'] as Map<String, dynamic>),
      voteType: json['vote_type'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  final Article article;
  final String voteType;
  final String createdAt;
}

class SkippedArticlesResponse {
  const SkippedArticlesResponse({required this.items});

  factory SkippedArticlesResponse.fromJson(Map<String, dynamic> json) {
    return SkippedArticlesResponse(
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(SkippedArticleItem.fromJson)
          .toList(),
    );
  }

  final List<SkippedArticleItem> items;
}

class SkippedArticleItem {
  const SkippedArticleItem({
    required this.article,
    required this.skippedAt,
  });

  factory SkippedArticleItem.fromJson(Map<String, dynamic> json) {
    return SkippedArticleItem(
      article: Article.fromJson(json['article'] as Map<String, dynamic>),
      skippedAt: json['skipped_at'] as String? ?? '',
    );
  }

  final Article article;
  final String skippedAt;
}

class UserAnalytics {
  const UserAnalytics({
    required this.totalVotes,
    required this.criticalVotes,
    required this.worthKnowingVotes,
    required this.notImportantVotes,
    required this.skippedArticles,
    required this.savedArticles,
    required this.uniqueSourcesVoted,
    required this.uniqueStoryGroupsVoted,
    required this.topInterests,
    required this.recentActivity,
  });

  factory UserAnalytics.fromJson(Map<String, dynamic> json) {
    return UserAnalytics(
      totalVotes: json['total_votes'] as int? ?? 0,
      criticalVotes: json['critical_votes'] as int? ?? 0,
      worthKnowingVotes: json['worth_knowing_votes'] as int? ?? 0,
      notImportantVotes: json['not_important_votes'] as int? ?? 0,
      skippedArticles: json['skipped_articles'] as int? ?? 0,
      savedArticles: json['saved_articles'] as int? ?? 0,
      uniqueSourcesVoted: json['unique_sources_voted'] as int? ?? 0,
      uniqueStoryGroupsVoted: json['unique_story_groups_voted'] as int? ?? 0,
      topInterests: (json['top_interests'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(InterestStat.fromJson)
          .toList(),
      recentActivity: (json['recent_activity'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(RecentActivity.fromJson)
          .toList(),
    );
  }

  final int totalVotes;
  final int criticalVotes;
  final int worthKnowingVotes;
  final int notImportantVotes;
  final int skippedArticles;
  final int savedArticles;
  final int uniqueSourcesVoted;
  final int uniqueStoryGroupsVoted;
  final List<InterestStat> topInterests;
  final List<RecentActivity> recentActivity;
}

class InterestStat {
  const InterestStat({required this.interest, required this.votes});

  factory InterestStat.fromJson(Map<String, dynamic> json) {
    return InterestStat(
      interest: json['interest'] as String? ?? '',
      votes: json['votes'] as int? ?? 0,
    );
  }

  final String interest;
  final int votes;
}

class RecentActivity {
  const RecentActivity({
    required this.type,
    required this.articleId,
    required this.storyTitle,
    required this.source,
    required this.createdAt,
    this.voteType,
  });

  factory RecentActivity.fromJson(Map<String, dynamic> json) {
    return RecentActivity(
      type: json['type'] as String? ?? 'vote',
      voteType: json['vote_type'] as String?,
      articleId: json['article_id'] as String? ?? '',
      storyTitle: json['story_title'] as String? ?? 'Untitled',
      source: json['source'] as String? ?? 'Unknown Source',
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  final String type;
  final String articleId;
  final String storyTitle;
  final String source;
  final String createdAt;
  final String? voteType;
}
