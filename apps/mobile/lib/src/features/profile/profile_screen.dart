import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers.dart';
import '../../shared/models/article.dart';
import '../../shared/ui/editorial_page.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/widgets/error_state.dart';
import '../feed/feed_screen.dart';
import '../onboarding/user_repository.dart';
import '../user_actions/user_actions_repository.dart';

final profileProvider = FutureProvider.autoDispose<UserProfile>((ref) {
  return ref.watch(userRepositoryProvider).getMe();
});

final userAnalyticsProvider = FutureProvider.autoDispose<UserAnalytics>((ref) {
  return ref.watch(userActionsRepositoryProvider).fetchUserAnalytics();
});

final votedArticlesProvider = FutureProvider.autoDispose
    .family<VotedArticlesResponse, String?>((ref, voteType) {
  return ref
      .watch(userActionsRepositoryProvider)
      .fetchVotedArticles(voteType: voteType);
});

final skippedArticlesProvider =
    FutureProvider.autoDispose<SkippedArticlesResponse>((ref) {
  return ref.watch(userActionsRepositoryProvider).fetchSkippedArticles();
});

const _interestOptions = [
  'science',
  'history',
  'technology',
  'culture',
  'politics',
  'business',
  'environment',
];

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final analytics = ref.watch(userAnalyticsProvider);

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
      data: (profile) => EditorialPage(
        maxWidth: 660,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Text('Profile', style: EditorialTextStyles.sectionTitle),
            const SizedBox(height: 14),
            _AccountSection(email: _currentEmail()),
            const SizedBox(height: 14),
            _InterestsSection(profile: profile),
            const SizedBox(height: 14),
            analytics.when(
              loading: () => const _LoadingCard(
                title: 'CONTRIBUTION SUMMARY',
                message: 'Counting your public signal...',
              ),
              error: (error, stackTrace) => const _LoadingCard(
                title: 'CONTRIBUTION SUMMARY',
                message: 'Analytics could not be loaded.',
              ),
              data: (analytics) => _ContributionSummary(analytics: analytics),
            ),
            const SizedBox(height: 14),
            const _SavedNotebookCard(),
            const SizedBox(height: 14),
            const _SourcePolicyCard(),
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
        ),
      ),
    );
  }
}

class _AccountSection extends StatelessWidget {
  const _AccountSection({required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    return _ProfileCard(
      children: [
        const Text('ACCOUNT', style: EditorialTextStyles.profileLabel),
        const SizedBox(height: 6),
        Text(email, style: EditorialTextStyles.articleBody),
      ],
    );
  }
}

class _InterestsSection extends ConsumerWidget {
  const _InterestsSection({required this.profile});

  final UserProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _ProfileCard(
      children: [
        const Text('INTERESTS', style: EditorialTextStyles.profileLabel),
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
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => _showEditInterestsSheet(context, ref, profile),
          icon: const Icon(Icons.tune, size: 18),
          label: const Text('Edit interests'),
        ),
      ],
    );
  }
}

class _ContributionSummary extends ConsumerWidget {
  const _ContributionSummary({required this.analytics});

  final UserAnalytics analytics;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _ProfileCard(
      children: [
        const Text(
          'CONTRIBUTION SUMMARY',
          style: EditorialTextStyles.profileLabel,
        ),
        const SizedBox(height: 6),
        Text(
          'Tap a card to open the private detail panel.',
          style: EditorialTextStyles.articleBody.copyWith(
            color: EditorialColors.mutedInk,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            _StatCard(
              label: 'votes',
              value: analytics.totalVotes,
              onTap: () => _showRecentActivitySheet(context, analytics),
            ),
            _StatCard(
              label: 'critical',
              value: analytics.criticalVotes,
              onTap: () => _showVotedArticlesSheet(
                context,
                ref,
                title: 'Critical',
                voteType: 'critical',
              ),
            ),
            _StatCard(
              label: 'worth knowing',
              value: analytics.worthKnowingVotes,
              onTap: () => _showVotedArticlesSheet(
                context,
                ref,
                title: 'Worth Knowing',
                voteType: 'worth_knowing',
              ),
            ),
            _StatCard(
              label: 'not important',
              value: analytics.notImportantVotes,
              onTap: () => _showVotedArticlesSheet(
                context,
                ref,
                title: 'Not Important',
                voteType: 'not_important',
              ),
            ),
            _StatCard(
              label: 'skipped',
              value: analytics.skippedArticles,
              onTap: () => _showSkippedArticlesSheet(context, ref),
            ),
            _StatCard(
              label: 'saved',
              value: analytics.savedArticles,
              onTap: () => context.push('/saved-notebook'),
            ),
            _StatCard(
              label: 'sources',
              value: analytics.uniqueSourcesVoted,
              onTap: () => _showSourcesSheet(context, analytics),
            ),
            _StatCard(
              label: 'stories',
              value: analytics.uniqueStoryGroupsVoted,
              onTap: () => _showStoriesSheet(context, analytics),
            ),
          ],
        ),
      ],
    );
  }
}

class _SavedNotebookCard extends StatelessWidget {
  const _SavedNotebookCard();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.indigoInk,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Saved Notebook',
              style: EditorialTextStyles.sectionTitle.copyWith(
                color: EditorialColors.paperLight,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              'Articles you saved for later reading and future editorial review.',
              style: EditorialTextStyles.articleBody.copyWith(
                color: EditorialColors.paperLight.withValues(alpha: 0.82),
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: () => context.push('/saved-notebook'),
              style: FilledButton.styleFrom(
                backgroundColor: EditorialColors.paperWarm,
                foregroundColor: EditorialColors.ink,
              ),
              child: const Text('Open Notebook'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SourcePolicyCard extends StatelessWidget {
  const _SourcePolicyCard();

  @override
  Widget build(BuildContext context) {
    return Material(
      color: EditorialColors.paperLight,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: EditorialColors.rule),
      ),
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 18),
        childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
        title: const Text(
          'SOURCE POLICY',
          style: EditorialTextStyles.profileLabel,
        ),
        children: [
          Text(
            'Indian candidate sources are local-only until approved. Smoke-test articles may appear in this local database without changing production source policy.',
            style: EditorialTextStyles.articleBody.copyWith(
              color: EditorialColors.mutedInk,
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return _ProfileCard(
      children: [
        Text(title, style: EditorialTextStyles.profileLabel),
        const SizedBox(height: 8),
        Text(message, style: EditorialTextStyles.articleBody),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final int value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        width: 136,
        decoration: BoxDecoration(
          color: EditorialColors.paperWarm,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: EditorialColors.rule),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('$value', style: EditorialTextStyles.sectionTitle),
              const SizedBox(height: 4),
              Text(label.toUpperCase(), style: EditorialTextStyles.metadata),
            ],
          ),
        ),
      ),
    );
  }
}

class _EditInterestsSheet extends ConsumerStatefulWidget {
  const _EditInterestsSheet({required this.profile});

  final UserProfile profile;

  @override
  ConsumerState<_EditInterestsSheet> createState() =>
      _EditInterestsSheetState();
}

class _EditInterestsSheetState extends ConsumerState<_EditInterestsSheet> {
  late Set<String> _selected;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _selected = widget.profile.interests.toSet();
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final interest in _interestOptions)
          FilterChip(
            label: Text(interest),
            selected: _selected.contains(interest),
            onSelected: _isSaving
                ? null
                : (selected) {
                    setState(() {
                      selected
                          ? _selected.add(interest)
                          : _selected.remove(interest);
                    });
                  },
          ),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isSaving ? null : _save,
            child: Text(_isSaving ? 'Saving interests...' : 'Update interests'),
          ),
        ),
      ],
    );
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await ref.read(userRepositoryProvider).updateInterests(
        interests: _selected.toList(),
        suppressedTopics: const [],
      );
      ref.invalidate(profileProvider);
      ref.invalidate(publicSignalFeedProvider);
      if (mounted) {
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }
}

class _VotedArticlesPanel extends ConsumerWidget {
  const _VotedArticlesPanel({required this.voteType});

  final String voteType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(votedArticlesProvider(voteType)).when(
          loading: () => const _SheetMessage('Loading voted articles...'),
          error: (error, stackTrace) =>
              const _SheetMessage('Voted articles could not be loaded.'),
          data: (response) => _DetailList(
            emptyMessage: 'No matching votes yet.',
            items: [
              for (final item in response.items)
                _DetailItem(
                  article: item.article,
                  metadata: '${item.voteType} · ${_formatDate(item.createdAt)}',
                ),
            ],
          ),
        );
  }
}

class _SkippedArticlesPanel extends ConsumerWidget {
  const _SkippedArticlesPanel();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(skippedArticlesProvider).when(
          loading: () => const _SheetMessage('Loading skipped articles...'),
          error: (error, stackTrace) =>
              const _SheetMessage('Skipped articles could not be loaded.'),
          data: (response) => _DetailList(
            emptyMessage: 'No skipped articles yet.',
            items: [
              for (final item in response.items)
                _DetailItem(
                  article: item.article,
                  metadata: 'Skipped · ${_formatDate(item.skippedAt)}',
                ),
            ],
          ),
        );
  }
}

class _DetailList extends StatelessWidget {
  const _DetailList({required this.emptyMessage, required this.items});

  final String emptyMessage;
  final List<Widget> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return _SheetMessage(emptyMessage);
    }
    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (context, index) =>
          const Divider(color: EditorialColors.rule),
      itemBuilder: (context, index) => items[index],
    );
  }
}

class _DetailItem extends StatelessWidget {
  const _DetailItem({required this.article, required this.metadata});

  final Article article;
  final String metadata;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_sourceLabel(article), style: EditorialTextStyles.metadata),
          const SizedBox(height: 5),
          Text(article.storyTitle, style: EditorialTextStyles.rankingTitle),
          const SizedBox(height: 5),
          Text(metadata.toUpperCase(), style: EditorialTextStyles.metadata),
        ],
      ),
    );
  }
}

class _SheetMessage extends StatelessWidget {
  const _SheetMessage(this.message);

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(message, style: EditorialTextStyles.articleBody),
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

Future<void> _showEditInterestsSheet(
  BuildContext context,
  WidgetRef ref,
  UserProfile profile,
) {
  return _showEditorialSheet(
    context,
    title: 'Edit interests',
    child: _EditInterestsSheet(profile: profile),
  );
}

Future<void> _showVotedArticlesSheet(
  BuildContext context,
  WidgetRef ref, {
  required String title,
  required String voteType,
}) {
  return _showEditorialSheet(
    context,
    title: title,
    child: _VotedArticlesPanel(voteType: voteType),
  );
}

Future<void> _showSkippedArticlesSheet(BuildContext context, WidgetRef ref) {
  return _showEditorialSheet(
    context,
    title: 'Skipped / No opinion',
    child: const _SkippedArticlesPanel(),
  );
}

Future<void> _showRecentActivitySheet(
  BuildContext context,
  UserAnalytics analytics,
) {
  return _showEditorialSheet(
    context,
    title: 'Recent contributions',
    child: _DetailList(
      emptyMessage: 'No contribution activity yet.',
      items: [
        for (final activity in analytics.recentActivity)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${activity.voteType ?? activity.type} · ${activity.source}',
                  style: EditorialTextStyles.metadata,
                ),
                const SizedBox(height: 4),
                Text(
                  activity.storyTitle,
                  style: EditorialTextStyles.rankingTitle,
                ),
              ],
            ),
          ),
      ],
    ),
  );
}

Future<void> _showSourcesSheet(
  BuildContext context,
  UserAnalytics analytics,
) {
  final counts = <String, int>{};
  for (final activity in analytics.recentActivity) {
    counts[activity.source] = (counts[activity.source] ?? 0) + 1;
  }
  final entries = counts.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));

  return _showEditorialSheet(
    context,
    title: 'Recent sources',
    child: _DetailList(
      emptyMessage: 'No voted sources yet.',
      items: [
        for (final entry in entries)
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(entry.key, style: EditorialTextStyles.articleBody),
            trailing:
                Text('${entry.value}', style: EditorialTextStyles.metadata),
          ),
      ],
    ),
  );
}

Future<void> _showStoriesSheet(
  BuildContext context,
  UserAnalytics analytics,
) {
  final stories = <String>{};
  for (final activity in analytics.recentActivity) {
    stories.add(activity.storyTitle);
  }

  return _showEditorialSheet(
    context,
    title: 'Recent stories',
    child: _DetailList(
      emptyMessage: 'No voted stories yet.',
      items: [
        for (final story in stories)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(story, style: EditorialTextStyles.rankingTitle),
          ),
      ],
    ),
  );
}

Future<void> _showEditorialSheet(
  BuildContext context, {
  required String title,
  required Widget child,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => FractionallySizedBox(
      heightFactor: 0.78,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 680),
          child: DecoratedBox(
            decoration: const BoxDecoration(
              color: EditorialColors.paper,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: EditorialColors.rule,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(title, style: EditorialTextStyles.sectionTitle),
                  const SizedBox(height: 12),
                  Expanded(child: child),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

String _currentEmail() {
  try {
    return Supabase.instance.client.auth.currentUser?.email ?? 'Signed in';
  } catch (_) {
    return 'Signed in';
  }
}

String _sourceLabel(Article article) {
  final sources = article.relatedSources
      .map((source) => source.source)
      .where((source) => source.trim().isNotEmpty)
      .toSet()
      .toList();

  if (sources.length > 1) {
    return 'Sources: ${sources.join(' · ')}';
  }

  return 'Source: ${sources.isNotEmpty ? sources.first : article.source}';
}

String _formatDate(String rawDate) {
  final date = DateTime.tryParse(rawDate);
  return date == null ? '' : DateFormat.MMMd().format(date.toLocal());
}
