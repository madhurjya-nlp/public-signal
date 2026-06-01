import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/auth_screen.dart';
import 'features/feed/feed_screen.dart';
import 'features/onboarding/interests_screen.dart';
import 'features/rankings/rankings_screen.dart';
import 'features/startup/startup_screen.dart';
import 'theme/app_theme.dart';

class PersonalNewspaperApp extends StatelessWidget {
  const PersonalNewspaperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Public Signal',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const StartupScreen(),
    ),
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const InterestsScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => AppScaffold(child: child),
      routes: [
        GoRoute(
          path: '/feed',
          builder: (context, state) => const FeedScreen(),
        ),
        GoRoute(
          path: '/rankings',
          builder: (context, state) => const RankingsScreen(),
        ),
      ],
    ),
  ],
);

class AppScaffold extends StatelessWidget {
  const AppScaffold({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;

    return Scaffold(
      body: SafeArea(child: child),
      bottomNavigationBar: NavigationBar(
        selectedIndex: location.startsWith('/rankings') ? 1 : 0,
        onDestinationSelected: (index) {
          context.go(index == 1 ? '/rankings' : '/feed');
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.how_to_vote_outlined),
            selectedIcon: Icon(Icons.how_to_vote),
            label: 'Vote',
          ),
          NavigationDestination(
            icon: Icon(Icons.leaderboard_outlined),
            selectedIcon: Icon(Icons.leaderboard),
            label: 'Rankings',
          ),
        ],
      ),
    );
  }
}

