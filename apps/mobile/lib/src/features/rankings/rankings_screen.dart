import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/ui/editorial_page.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import 'rankings_repository.dart';

final dailyRankingsProvider = FutureProvider.autoDispose<DailyRankings>((ref) {
  return ref.watch(rankingsRepositoryProvider).getDailyRankings();
});

class RankingsScreen extends ConsumerWidget {
  const RankingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rankings = ref.watch(dailyRankingsProvider);

    return rankings.when(
      loading: () => const Center(
        child: Text(
          'Counting today\'s public signal...',
          style: EditorialTextStyles.metadata,
        ),
      ),
      error: (error, stackTrace) => ErrorState(
        message: 'Daily rankings could not be loaded.',
        onRetry: () => ref.invalidate(dailyRankingsProvider),
      ),
      data: (rankings) {
        final isEmpty = rankings.mostImportant.isEmpty &&
            rankings.mostIgnored.isEmpty &&
            rankings.mostDivisive.isEmpty;

        if (isEmpty) {
          return const EmptyState(
            title: 'No public signal yet.',
            message: 'Vote on articles to generate rankings.',
          );
        }

        return EditorialPage(
          maxWidth: 680,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            children: [
              Text('Daily Rankings', style: EditorialTextStyles.sectionTitle),
              const SizedBox(height: 6),
              Text(
                'A live index of what readers say matters today.',
                style: EditorialTextStyles.articleBody.copyWith(
                  color: EditorialColors.mutedInk,
                ),
              ),
              const SizedBox(height: 18),
              _RankingSection(
                title: 'Most Important',
                items: rankings.mostImportant,
              ),
              _RankingSection(
                title: 'Most Ignored',
                items: rankings.mostIgnored,
              ),
              _RankingSection(
                title: 'Most Divisive',
                items: rankings.mostDivisive,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RankingSection extends StatelessWidget {
  const _RankingSection({
    required this.title,
    required this.items,
  });

  final String title;
  final List<RankingItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.toUpperCase(), style: EditorialTextStyles.metadata),
        const SizedBox(height: 9),
        for (final item in items) ...[
          _RankingCard(item: item),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 10),
      ],
    );
  }
}

class _RankingCard extends StatelessWidget {
  const _RankingCard({required this.item});

  final RankingItem item;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperLight,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    item.article.title,
                    style: EditorialTextStyles.rankingTitle,
                  ),
                ),
                const SizedBox(width: 12),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: EditorialColors.ink,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Text(
                      item.rankingScore.toString(),
                      style: EditorialTextStyles.button.copyWith(
                        color: EditorialColors.paperLight,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Source: ${item.article.source}',
              style: EditorialTextStyles.metadata,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _VoteCount(label: 'Critical', value: item.critical),
                _VoteCount(label: 'Worth Knowing', value: item.worthKnowing),
                _VoteCount(label: 'Not Important', value: item.notImportant),
                _VoteCount(label: 'Total', value: item.totalVotes),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _VoteCount extends StatelessWidget {
  const _VoteCount({
    required this.label,
    required this.value,
  });

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paper,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          '$label $value',
          style: EditorialTextStyles.chip.copyWith(fontSize: 11),
        ),
      ),
    );
  }
}
