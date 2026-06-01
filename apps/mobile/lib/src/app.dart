import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/auth_screen.dart';
import 'features/feed/feed_screen.dart';
import 'features/onboarding/interests_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/rankings/rankings_screen.dart';
import 'features/splash/public_signal_intro_screen.dart';
import 'features/startup/startup_screen.dart';
import 'shared/ui/editorial_bottom_nav.dart';
import 'shared/ui/halftone_paper_background.dart';
import 'shared/ui/public_signal_masthead.dart';
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
    GoRoute(
      path: '/intro',
      builder: (context, state) {
        final next = state.uri.queryParameters['next'] ?? '/feed';
        return PublicSignalIntroScreen(nextLocation: next);
      },
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
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
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
    final selectedIndex = location.startsWith('/rankings')
        ? 1
        : location.startsWith('/profile')
            ? 2
            : 0;

    return Scaffold(
      body: HalftonePaperBackground(
        child: SafeArea(
          child: Column(
            children: [
              const PublicSignalMasthead(compact: true),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  child: KeyedSubtree(
                    key: ValueKey(location),
                    child: child,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: EditorialBottomNav(
        selectedIndex: selectedIndex,
        onSelected: (index) {
          context.go(
            switch (index) {
              1 => '/rankings',
              2 => '/profile',
              _ => '/feed',
            },
          );
        },
      ),
    );
  }
}
