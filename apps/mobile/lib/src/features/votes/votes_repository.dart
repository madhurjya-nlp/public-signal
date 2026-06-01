import '../../core/network/api_client.dart';

class VotesRepository {
  const VotesRepository(this._api);

  final ApiClient _api;

  Future<void> submitVote({
    required String articleId,
    required VoteType voteType,
  }) async {
    await _api.postJson('/v1/votes', {
      'article_id': articleId,
      'vote_type': voteType.apiValue,
    });
  }
}

enum VoteType {
  critical('critical'),
  worthKnowing('worth_knowing'),
  notImportant('not_important');

  const VoteType(this.apiValue);

  final String apiValue;
}

