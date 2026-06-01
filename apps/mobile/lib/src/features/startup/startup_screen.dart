import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';

class StartupScreen extends ConsumerStatefulWidget {
  const StartupScreen({super.key});

  @override
  ConsumerState<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends ConsumerState<StartupScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _route());
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Preparing your edition...'),
      ),
    );
  }

  Future<void> _route() async {
    final auth = ref.read(authRepositoryProvider);
    if (!auth.isSignedIn) {
      if (mounted) {
        context.go('/auth');
      }
      return;
    }

    try {
      final profile = await ref.read(userRepositoryProvider).getMe();
      if (!mounted) {
        return;
      }
      context
          .go(profile.interests.isEmpty ? '/onboarding' : '/intro?next=/feed');
    } catch (_) {
      if (mounted) {
        context.go('/onboarding');
      }
    }
  }
}
