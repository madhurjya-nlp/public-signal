import '../../core/network/api_client.dart';

class UserRepository {
  const UserRepository(this._api);

  final ApiClient _api;

  Future<UserProfile> getMe() async {
    final json = await _api.getJson('/v1/me');
    return UserProfile.fromJson(json);
  }

  Future<UserProfile> updateInterests({
    required List<String> interests,
    required List<String> suppressedTopics,
  }) async {
    final json = await _api.postJson('/v1/users/interests', {
      'interests': interests,
    });
    return UserProfile.fromJson(json);
  }
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.interests,
    required this.suppressedTopics,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String? ?? '',
      interests: (json['interests'] as List<dynamic>? ?? [])
          .map((topic) => topic.toString())
          .toList(),
      suppressedTopics: (json['suppressedTopics'] as List<dynamic>? ?? [])
          .map((topic) => topic.toString())
          .toList(),
    );
  }

  final String id;
  final List<String> interests;
  final List<String> suppressedTopics;
}
