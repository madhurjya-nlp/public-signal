import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
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
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => ErrorState(
        message: error.toString(),
        onRetry: () => ref.invalidate(dailyRankingsProvider),
      ),
      data: (rankings) {
        final isEmpty = rankings.mostImportant.isEmpty &&
            rankings.mostIgnored.isEmpty &&
            rankings.mostDivisive.isEmpty;

        if (isEmpty) {
          return const EmptyState(
            title: 'No rankings yet',
            message: 'Daily rankings appear after people vote on articles.',
          );
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Daily Rankings',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 16),
            _RankingSection(title: 'Most Important', items: rankings.mostImportant),
            _RankingSection(title: 'Most Ignored', items: rankings.mostIgnored),
            _RankingSection(title: 'Most Divisive', items: rankings.mostDivisive),
          ],
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
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 8),
        for (final item in items) ...[
          Card(
            child: ListTile(
              title: Text(item.article.title),
              subtitle: Text(
                '${item.article.source} · score ${item.rankingScore} · ${item.totalVotes} votes',
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 10),
      ],
    );
  }
}

