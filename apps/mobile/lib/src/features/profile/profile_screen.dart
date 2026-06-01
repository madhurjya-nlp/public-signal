import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/widgets/error_state.dart';
import '../onboarding/user_repository.dart';

final profileProvider = FutureProvider.autoDispose<UserProfile>((ref) {
  return ref.watch(userRepositoryProvider).getMe();
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final email =
        Supabase.instance.client.auth.currentUser?.email ?? 'Signed in';

    return profile.when(
      loading: () => const Center(
        child: Text(
          'Preparing your edition...',
          style: EditorialTextStyles.metadata,
        ),
      ),
      error: (error, stackTrace) => ErrorState(
        message: 'Profile could not be loaded.',
        onRetry: () => ref.invalidate(profileProvider),
      ),
      data: (profile) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Text('Profile', style: EditorialTextStyles.sectionTitle),
            const SizedBox(height: 14),
            _ProfileCard(
              children: [
                const Text('ACCOUNT', style: EditorialTextStyles.profileLabel),
                const SizedBox(height: 6),
                Text(email, style: EditorialTextStyles.articleBody),
              ],
            ),
            const SizedBox(height: 14),
            _ProfileCard(
              children: [
                const Text(
                  'SELECTED INTERESTS',
                  style: EditorialTextStyles.profileLabel,
                ),
                const SizedBox(height: 10),
                if (profile.interests.isEmpty)
                  Text(
                    'No interests selected yet.',
                    style: EditorialTextStyles.articleBody.copyWith(
                      color: EditorialColors.mutedInk,
                    ),
                  )
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final interest in profile.interests)
                        Chip(
                          label: Text(interest),
                          backgroundColor: EditorialColors.paperWarm,
                          side: const BorderSide(color: EditorialColors.rule),
                        ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 14),
            _ProfileCard(
              children: [
                const Text(
                  'LOCAL DEVELOPMENT',
                  style: EditorialTextStyles.profileLabel,
                ),
                const SizedBox(height: 8),
                Text(
                  'Indian candidate sources are local-only until approved. Smoke-test articles may appear in this local database without changing production source policy.',
                  style: EditorialTextStyles.articleBody.copyWith(
                    color: EditorialColors.mutedInk,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () async {
                await ref.read(authRepositoryProvider).signOut();
                if (context.mounted) {
                  context.go('/auth');
                }
              },
              child: const Text('Sign out'),
            ),
          ],
        );
      },
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        ),
      ),
    );
  }
}
