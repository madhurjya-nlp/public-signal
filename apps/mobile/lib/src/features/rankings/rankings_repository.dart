import '../../core/network/api_client.dart';
import '../../shared/models/article.dart';

class RankingsRepository {
  const RankingsRepository(this._api);

  final ApiClient _api;

  Future<DailyRankings> getDailyRankings() async {
    final json = await _api.getJson('/v1/rankings/daily');
    return DailyRankings.fromJson(json);
  }
}

class DailyRankings {
  const DailyRankings({
    required this.mostImportant,
    required this.mostIgnored,
    required this.mostDivisive,
  });

  factory DailyRankings.fromJson(Map<String, dynamic> json) {
    return DailyRankings(
      mostImportant: _items(json['most_important']),
      mostIgnored: _items(json['most_ignored']),
      mostDivisive: _items(json['most_divisive']),
    );
  }

  static List<RankingItem> _items(Object? raw) {
    return (raw as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(RankingItem.fromJson)
        .toList();
  }

  final List<RankingItem> mostImportant;
  final List<RankingItem> mostIgnored;
  final List<RankingItem> mostDivisive;
}

class RankingItem {
  const RankingItem({
    required this.article,
    required this.rankingScore,
    required this.totalVotes,
    required this.critical,
    required this.worthKnowing,
    required this.notImportant,
  });

  factory RankingItem.fromJson(Map<String, dynamic> json) {
    final counts = json['voteCounts'] as Map<String, dynamic>? ?? {};
    return RankingItem(
      article: Article.fromJson(json),
      rankingScore: json['rankingScore'] as int? ?? 0,
      totalVotes: json['totalVotes'] as int? ?? 0,
      critical: counts['critical'] as int? ?? 0,
      worthKnowing: counts['worthKnowing'] as int? ?? 0,
      notImportant: counts['notImportant'] as int? ?? 0,
    );
  }

  final Article article;
  final int rankingScore;
  final int totalVotes;
  final int critical;
  final int worthKnowing;
  final int notImportant;
}

