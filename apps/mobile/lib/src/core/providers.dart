import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'network/api_client.dart';
import '../features/articles/articles_repository.dart';
import '../features/auth/auth_repository.dart';
import '../features/collections/collections_repository.dart';
import '../features/feed/feed_repository.dart';
import '../features/onboarding/user_repository.dart';
import '../features/rankings/rankings_repository.dart';
import '../features/user_actions/user_actions_repository.dart';
import '../features/votes/votes_repository.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(),
);

final userRepositoryProvider = Provider<UserRepository>(
  (ref) => UserRepository(ref.watch(apiClientProvider)),
);

final feedRepositoryProvider = Provider<FeedRepository>(
  (ref) => FeedRepository(ref.watch(apiClientProvider)),
);

final articlesRepositoryProvider = Provider<ArticlesRepository>(
  (ref) => ArticlesRepository(ref.watch(apiClientProvider)),
);

final collectionsRepositoryProvider = Provider<CollectionsRepository>(
  (ref) => CollectionsRepository(ref.watch(apiClientProvider)),
);

final votesRepositoryProvider = Provider<VotesRepository>(
  (ref) => VotesRepository(ref.watch(apiClientProvider)),
);

final rankingsRepositoryProvider = Provider<RankingsRepository>(
  (ref) => RankingsRepository(ref.watch(apiClientProvider)),
);

final userActionsRepositoryProvider = Provider<UserActionsRepository>(
  (ref) => UserActionsRepository(ref.watch(apiClientProvider)),
);
