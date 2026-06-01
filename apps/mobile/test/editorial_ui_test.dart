import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:personal_newspaper/src/app.dart';
import 'package:personal_newspaper/src/features/splash/public_signal_intro_screen.dart';
import 'package:personal_newspaper/src/features/profile/profile_screen.dart';
import 'package:personal_newspaper/src/features/rankings/rankings_repository.dart';
import 'package:personal_newspaper/src/features/rankings/rankings_screen.dart';
import 'package:personal_newspaper/src/features/rankings/ranking_story_card.dart';
import 'package:personal_newspaper/src/features/saved/saved_notebook_screen.dart';
import 'package:personal_newspaper/src/features/onboarding/user_repository.dart';
import 'package:personal_newspaper/src/features/user_actions/user_actions_repository.dart';
import 'package:personal_newspaper/src/shared/models/article.dart';
import 'package:personal_newspaper/src/shared/ui/editorial_article_card.dart';
import 'package:personal_newspaper/src/shared/ui/editorial_bottom_nav.dart';

void main() {
  testWidgets('article card handles missing thumbnail and summary',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: EditorialArticleCard(
              article: const Article(
                id: '20000000-0000-0000-0000-000000000001',
                title: 'Indian Express public signal headline',
                url: 'https://indianexpress.com/article/india/example',
                source: 'The Indian Express - India',
                thumbnailUrl: null,
                publishedAt: '2026-06-01T00:00:00.000Z',
                summary: null,
                categories: ['politics'],
                createdAt: '2026-06-01T00:00:00.000Z',
              ),
              isVoting: false,
              onVote: (_) async {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('No source summary available.'), findsOneWidget);
    expect(find.text('AI brief'), findsOneWidget);
    expect(find.text('Source: The Indian Express - India'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('bottom nav exposes Vote Rankings and Profile tabs',
      (tester) async {
    var selected = 1;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: EditorialBottomNav(
            selectedIndex: selected,
            onSelected: (index) => selected = index,
          ),
        ),
      ),
    );

    expect(find.text('Vote'), findsOneWidget);
    expect(find.text('Rankings'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
    expect(find.text('V'), findsNothing);
    expect(find.text('R'), findsNothing);
    expect(find.text('P'), findsNothing);

    await tester.tap(find.text('Profile'));
    expect(selected, 2);
  });

  testWidgets('article card shows Sources for a multi-source story',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: EditorialArticleCard(
              article: const Article(
                id: '20000000-0000-0000-0000-000000000001',
                title: 'Grouped story',
                url: 'https://example.com/story',
                source: 'Example Source',
                thumbnailUrl: null,
                publishedAt: null,
                summary: null,
                categories: ['technology'],
                createdAt: '2026-06-01T00:00:00.000Z',
                relatedSources: [
                  RelatedSource(
                    source: 'Example Source',
                    url: 'https://example.com/story',
                  ),
                  RelatedSource(
                    source: 'Second Source',
                    url: 'https://example.com/second',
                  ),
                ],
              ),
              isVoting: false,
              onVote: (_) async {},
            ),
          ),
        ),
      ),
    );

    expect(
      find.text('Sources: Example Source · Second Source'),
      findsOneWidget,
    );
  });

  testWidgets('article card exposes Save and Skip secondary actions',
      (tester) async {
    var saveTapped = false;
    var skipTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: EditorialArticleCard(
              article: const Article(
                id: '20000000-0000-0000-0000-000000000001',
                title: 'Action hierarchy story',
                url: 'https://example.com/story',
                source: 'Example Source',
                thumbnailUrl: null,
                publishedAt: null,
                summary: null,
                categories: ['technology'],
                createdAt: '2026-06-01T00:00:00.000Z',
              ),
              isVoting: false,
              onVote: (_) async {},
              onToggleSave: () => saveTapped = true,
              onSkip: () => skipTapped = true,
            ),
          ),
        ),
      ),
    );

    expect(find.text('Save'), findsOneWidget);
    expect(find.text('Skip / No opinion'), findsOneWidget);
    expect(find.text('Critical'), findsOneWidget);
    expect(find.text('Worth Knowing'), findsOneWidget);
    expect(find.text('Not Important'), findsOneWidget);

    await tester.tap(find.text('Save'));
    await tester.tap(find.text('Skip / No opinion'));

    expect(saveTapped, isTrue);
    expect(skipTapped, isTrue);
  });

  testWidgets('profile shows compact dashboard without inline activity list',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          profileProvider.overrideWith(
            (ref) async => const UserProfile(
              id: '10000000-0000-0000-0000-000000000001',
              interests: ['environment'],
              suppressedTopics: [],
            ),
          ),
          userAnalyticsProvider.overrideWith(
            (ref) async => _analytics,
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: ProfileScreen())),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('CONTRIBUTION SUMMARY'), findsOneWidget);
    expect(find.text('Open Notebook'), findsOneWidget);
    expect(find.text('Edit interests'), findsOneWidget);
    expect(find.text('Inline activity should stay hidden'), findsNothing);
  });

  testWidgets('tapping Critical opens voted article detail sheet',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          profileProvider.overrideWith(
            (ref) async => const UserProfile(
              id: '10000000-0000-0000-0000-000000000001',
              interests: ['environment'],
              suppressedTopics: [],
            ),
          ),
          userAnalyticsProvider.overrideWith((ref) async => _analytics),
          votedArticlesProvider('critical').overrideWith(
            (ref) async => const VotedArticlesResponse(
              items: [
                VotedArticleItem(
                  article: _detailArticle,
                  voteType: 'critical',
                  createdAt: '2026-06-02T00:00:00.000Z',
                ),
              ],
            ),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: ProfileScreen())),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('CRITICAL'));
    await tester.pumpAndSettle();

    expect(find.text('Critical'), findsOneWidget);
    expect(find.text('Detail story'), findsOneWidget);
  });

  testWidgets('tapping Skipped opens skipped article detail sheet',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          profileProvider.overrideWith(
            (ref) async => const UserProfile(
              id: '10000000-0000-0000-0000-000000000001',
              interests: ['environment'],
              suppressedTopics: [],
            ),
          ),
          userAnalyticsProvider.overrideWith((ref) async => _analytics),
          skippedArticlesProvider.overrideWith(
            (ref) async => const SkippedArticlesResponse(
              items: [
                SkippedArticleItem(
                  article: _detailArticle,
                  skippedAt: '2026-06-02T00:00:00.000Z',
                ),
              ],
            ),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: ProfileScreen())),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('SKIPPED'));
    await tester.pumpAndSettle();

    expect(find.text('Skipped / No opinion'), findsOneWidget);
    expect(find.text('Detail story'), findsOneWidget);
  });

  testWidgets('saved notebook renders empty state', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          savedNotebookProvider.overrideWith(
            (ref) async => const SavedArticlesResponse(items: []),
          ),
        ],
        child: const MaterialApp(home: SavedNotebookScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text(
        'No saved articles yet. Save stories from the Vote tab to build your notebook.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('saved notebook groups clippings by category and date',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          savedNotebookProvider.overrideWith(
            (ref) async => SavedArticlesResponse(
              items: [
                SavedArticleItem(
                  article: _detailArticle,
                  savedAt: DateTime.now().toIso8601String(),
                ),
              ],
            ),
          ),
        ],
        child: const MaterialApp(home: SavedNotebookScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ENVIRONMENT'), findsOneWidget);
    expect(find.text('TODAY'), findsOneWidget);
    expect(find.text('EDITORIAL NOTE PENDING'), findsOneWidget);
    expect(find.text('Detail story'), findsOneWidget);
  });

  testWidgets('article card shows Saved state without hiding vote actions',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: EditorialArticleCard(
              article: const Article(
                id: '20000000-0000-0000-0000-000000000001',
                title: 'Saved story',
                url: 'https://example.com/story',
                source: 'Example Source',
                thumbnailUrl: null,
                publishedAt: null,
                summary: null,
                categories: ['technology'],
                createdAt: '2026-06-01T00:00:00.000Z',
              ),
              isVoting: false,
              isSaved: true,
              onVote: (_) async {},
              onToggleSave: () {},
              onSkip: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('Saved'), findsOneWidget);
    expect(find.text('Critical'), findsOneWidget);
    expect(find.text('Worth Knowing'), findsOneWidget);
    expect(find.text('Not Important'), findsOneWidget);
  });

  testWidgets('app shell renders selected tab content above bottom nav',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final router = GoRouter(
      initialLocation: '/feed',
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppScaffold(child: child),
          routes: [
            GoRoute(
              path: '/feed',
              builder: (context, state) => const Text('Vote Body'),
            ),
            GoRoute(
              path: '/rankings',
              builder: (context, state) => const Text('Rankings Body'),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const Text('Profile Body'),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    expect(find.text('Vote Body'), findsOneWidget);
    expect(
      tester.getBottomLeft(find.text('Vote Body')).dy,
      lessThan(tester.getTopLeft(find.text('Vote')).dy),
    );

    await tester.tap(find.text('Rankings'));
    await tester.pumpAndSettle();
    expect(find.text('Rankings Body'), findsOneWidget);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    expect(find.text('Profile Body'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('rankings screen shows Sources for a multi-source story',
      (tester) async {
    const groupedArticle = Article(
      id: '20000000-0000-0000-0000-000000000001',
      title: 'Grouped ranked story',
      url: 'https://example.com/story',
      source: 'Example Source',
      thumbnailUrl: null,
      publishedAt: null,
      summary: null,
      categories: ['technology'],
      createdAt: '2026-06-01T00:00:00.000Z',
      relatedSources: [
        RelatedSource(
          source: 'Example Source',
          url: 'https://example.com/story',
        ),
        RelatedSource(
          source: 'Second Source',
          url: 'https://example.com/second',
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          dailyRankingsProvider.overrideWith(
            (ref) async => const DailyRankings(
              mostImportant: [
                RankingItem(
                  article: groupedArticle,
                  rankingScore: 4,
                  totalVotes: 2,
                  critical: 1,
                  worthKnowing: 1,
                  notImportant: 0,
                ),
              ],
              mostIgnored: [],
              mostDivisive: [],
            ),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: RankingsScreen())),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Sources: Example Source · Second Source'),
      findsOneWidget,
    );
  });

  testWidgets(
      'rankings screen shows segmented toggle and one section at a time',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          dailyRankingsProvider.overrideWith(
            (ref) async => DailyRankings(
              mostImportant: [_rankingItem(title: 'Important visible story')],
              mostIgnored: [_rankingItem(title: 'Ignored hidden story')],
              mostDivisive: [_rankingItem(title: 'Divisive hidden story')],
            ),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: RankingsScreen())),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Most Important'), findsOneWidget);
    expect(find.text('Most Ignored'), findsOneWidget);
    expect(find.text('Most Divisive'), findsOneWidget);
    expect(find.text('Important visible story'), findsOneWidget);
    expect(find.text('Ignored hidden story'), findsNothing);
    expect(find.text('Divisive hidden story'), findsNothing);

    await tester.tap(find.text('Most Ignored'));
    await tester.pumpAndSettle();
    expect(find.text('Ignored hidden story'), findsOneWidget);
    expect(find.text('Important visible story'), findsNothing);

    await tester.tap(find.text('Most Divisive'));
    await tester.pumpAndSettle();
    expect(find.text('Divisive hidden story'), findsOneWidget);
    expect(find.text('Ignored hidden story'), findsNothing);
  });

  testWidgets('rankings screen renders at most ten cards', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          dailyRankingsProvider.overrideWith(
            (ref) async => DailyRankings(
              mostImportant: [
                for (var index = 0; index < 12; index++)
                  _rankingItem(
                    title: 'Ranked story $index',
                    id: '20000000-0000-0000-0000-${(index + 1).toString().padLeft(12, '0')}',
                  ),
              ],
              mostIgnored: const [],
              mostDivisive: const [],
            ),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: RankingsScreen())),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('#10'), findsOneWidget);
    expect(find.text('#11'), findsNothing);
    expect(find.text('Ranked story 10'), findsNothing);
  });

  testWidgets('ranking card renders thumbnail when available', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: RankingStoryCard(
              rank: 1,
              item: _rankingItem(
                title: 'Thumbnail ranked story',
                thumbnailUrl: 'https://example.com/thumb.jpg',
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.byType(Image), findsOneWidget);
    expect(find.text('Thumbnail ranked story'), findsOneWidget);
  });

  testWidgets('ranking card renders safe placeholder without thumbnail',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: RankingStoryCard(
              rank: 1,
              item: _rankingItem(title: 'Placeholder ranked story'),
            ),
          ),
        ),
      ),
    );

    expect(find.text('Placeholder ranked story'), findsOneWidget);
    expect(find.text('Source: Example Source'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('rankings screen shows selected section empty state',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          dailyRankingsProvider.overrideWith(
            (ref) async => DailyRankings(
              mostImportant: [_rankingItem(title: 'Important visible story')],
              mostIgnored: const [],
              mostDivisive: const [],
            ),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: RankingsScreen())),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Most Ignored'));
    await tester.pumpAndSettle();

    expect(
      find.text('No ignored stories in your interests yet.'),
      findsOneWidget,
    );
  });

  testWidgets('intro can be skipped with Continue', (tester) async {
    final router = GoRouter(
      initialLocation: '/intro',
      routes: [
        GoRoute(
          path: '/intro',
          builder: (context, state) =>
              const PublicSignalIntroScreen(nextLocation: '/feed'),
        ),
        GoRoute(
          path: '/feed',
          builder: (context, state) => const Scaffold(body: Text('Feed Ready')),
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Feed Ready'), findsOneWidget);
  });
}

const _detailArticle = Article(
  id: '20000000-0000-0000-0000-000000000001',
  title: 'Detail story',
  url: 'https://example.com/detail',
  source: 'Example Source',
  thumbnailUrl: null,
  publishedAt: null,
  summary: 'Summary',
  categories: ['environment'],
  createdAt: '2026-06-02T00:00:00.000Z',
);

const _analytics = UserAnalytics(
  totalVotes: 1,
  criticalVotes: 1,
  worthKnowingVotes: 0,
  notImportantVotes: 0,
  skippedArticles: 1,
  savedArticles: 1,
  uniqueSourcesVoted: 1,
  uniqueStoryGroupsVoted: 1,
  topInterests: [],
  recentActivity: [
    RecentActivity(
      type: 'vote',
      voteType: 'critical',
      articleId: '20000000-0000-0000-0000-000000000001',
      storyTitle: 'Inline activity should stay hidden',
      source: 'Example Source',
      createdAt: '2026-06-02T00:00:00.000Z',
    ),
  ],
);

RankingItem _rankingItem({
  required String title,
  String id = '20000000-0000-0000-0000-000000000001',
  String? thumbnailUrl,
}) {
  return RankingItem(
    article: Article(
      id: id,
      title: title,
      url: 'https://example.com/$id',
      source: 'Example Source',
      thumbnailUrl: thumbnailUrl,
      publishedAt: '2026-06-02T00:00:00.000Z',
      summary: null,
      categories: const ['environment'],
      createdAt: '2026-06-02T00:00:00.000Z',
    ),
    rankingScore: 4,
    totalVotes: 2,
    critical: 1,
    worthKnowing: 1,
    notImportant: 0,
  );
}
