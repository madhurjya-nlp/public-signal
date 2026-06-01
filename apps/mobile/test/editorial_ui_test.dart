import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:personal_newspaper/src/app.dart';
import 'package:personal_newspaper/src/features/splash/public_signal_intro_screen.dart';
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
