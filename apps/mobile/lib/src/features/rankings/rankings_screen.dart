import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/ui/editorial_page.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import 'ranking_story_card.dart';
import 'rankings_repository.dart';

final dailyRankingsProvider = FutureProvider.autoDispose<DailyRankings>((ref) {
  return ref.watch(rankingsRepositoryProvider).getDailyRankings();
});

enum RankingTab {
  important('Most Important'),
  ignored('Most Ignored'),
  divisive('Most Divisive');

  const RankingTab(this.label);

  final String label;
}

class RankingsScreen extends ConsumerStatefulWidget {
  const RankingsScreen({super.key});

  @override
  ConsumerState<RankingsScreen> createState() => _RankingsScreenState();
}

class _RankingsScreenState extends ConsumerState<RankingsScreen> {
  RankingTab _selected = RankingTab.important;

  @override
  Widget build(BuildContext context) {
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

        return EditorialPage(
          maxWidth: 700,
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
              _RankingSegmentedControl(
                selected: _selected,
                onSelected: (tab) => setState(() => _selected = tab),
              ),
              const SizedBox(height: 18),
              if (isEmpty)
                const EmptyState(
                  title: 'Your interest-based rankings are still warming up.',
                  message: 'Vote on articles to generate rankings.',
                )
              else
                _RankingList(
                  tab: _selected,
                  items: _itemsForTab(rankings, _selected),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _RankingSegmentedControl extends StatelessWidget {
  const _RankingSegmentedControl({
    required this.selected,
    required this.onSelected,
  });

  final RankingTab selected;
  final ValueChanged<RankingTab> onSelected;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.all(5),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 520;
            final children = [
              for (final tab in RankingTab.values)
                _SegmentButton(
                  tab: tab,
                  selected: selected == tab,
                  onTap: () => onSelected(tab),
                ),
            ];

            if (compact) {
              return Column(
                children: [
                  for (final child in children)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: child,
                    ),
                ],
              );
            }

            return Row(
              children: [
                for (final child in children) Expanded(child: child),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.tab,
    required this.selected,
    required this.onTap,
  });

  final RankingTab tab;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        decoration: BoxDecoration(
          color: selected ? EditorialColors.ink : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          tab.label,
          textAlign: TextAlign.center,
          style: EditorialTextStyles.button.copyWith(
            color: selected ? EditorialColors.paperLight : EditorialColors.ink,
          ),
        ),
      ),
    );
  }
}

class _RankingList extends StatelessWidget {
  const _RankingList({
    required this.tab,
    required this.items,
  });

  final RankingTab tab;
  final List<RankingItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return _RankingEmptyState(tab: tab);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tab.label.toUpperCase(), style: EditorialTextStyles.metadata),
        const SizedBox(height: 10),
        for (final entry in items.take(10).toList().asMap().entries) ...[
          RankingStoryCard(
            key: ValueKey('${tab.name}-${entry.value.article.id}'),
            item: entry.value,
            rank: entry.key + 1,
          ),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _RankingEmptyState extends StatelessWidget {
  const _RankingEmptyState({required this.tab});

  final RankingTab tab;

  @override
  Widget build(BuildContext context) {
    return switch (tab) {
      RankingTab.important => const EmptyState(
          title: 'No important stories in your interests yet.',
          message: 'Vote on articles to build this signal.',
        ),
      RankingTab.ignored => const EmptyState(
          title: 'No ignored stories in your interests yet.',
          message: 'Mark articles Not Important to shape this view.',
        ),
      RankingTab.divisive => const EmptyState(
          title: 'No divisive stories in your interests yet.',
          message: 'Divisive stories appear when readers disagree.',
        ),
    };
  }
}

List<RankingItem> _itemsForTab(DailyRankings rankings, RankingTab tab) {
  return switch (tab) {
    RankingTab.important => rankings.mostImportant,
    RankingTab.ignored => rankings.mostIgnored,
    RankingTab.divisive => rankings.mostDivisive,
  };
}
