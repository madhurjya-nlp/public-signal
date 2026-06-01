import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers.dart';
import '../../shared/models/article.dart';
import '../../shared/ui/editorial_page.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/ui/halftone_paper_background.dart';
import '../../shared/ui/public_signal_masthead.dart';
import '../../shared/widgets/error_state.dart';
import '../user_actions/user_actions_repository.dart';

final savedNotebookProvider =
    FutureProvider.autoDispose<SavedArticlesResponse>((ref) {
  return ref.watch(userActionsRepositoryProvider).fetchSavedArticles();
});

class SavedNotebookScreen extends ConsumerWidget {
  const SavedNotebookScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedNotebookProvider);

    return Scaffold(
      body: HalftonePaperBackground(
        child: SafeArea(
          child: Column(
            children: [
              const PublicSignalMasthead(compact: true),
              Expanded(
                child: EditorialPage(
                  maxWidth: 720,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 30),
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: () => context.go('/profile'),
                          icon: const Icon(Icons.arrow_back),
                          label: const Text('Back to Profile'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Saved Notebook',
                        style: EditorialTextStyles.sectionTitle,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Articles saved for later reading and future editorial review.',
                        style: EditorialTextStyles.articleBody.copyWith(
                          color: EditorialColors.mutedInk,
                        ),
                      ),
                      const SizedBox(height: 18),
                      saved.when(
                        loading: () => const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'Opening your notebook...',
                              style: EditorialTextStyles.metadata,
                            ),
                          ),
                        ),
                        error: (error, stackTrace) => ErrorState(
                          message: 'Saved notebook could not be loaded.',
                          onRetry: () => ref.invalidate(savedNotebookProvider),
                        ),
                        data: (response) => _NotebookContents(
                          response: response,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotebookContents extends StatelessWidget {
  const _NotebookContents({required this.response});

  final SavedArticlesResponse response;

  @override
  Widget build(BuildContext context) {
    if (response.items.isEmpty) {
      return const _NotebookEmptyState();
    }

    final groups = _groupItems(response.items);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final topic in groups.keys) ...[
          _TopicHeading(topic: topic),
          const SizedBox(height: 10),
          for (final dateGroup in groups[topic]!.entries) ...[
            Text(
              dateGroup.key.toUpperCase(),
              style: EditorialTextStyles.metadata,
            ),
            const SizedBox(height: 8),
            for (final item in dateGroup.value) _NotebookClipping(item: item),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _NotebookEmptyState extends StatelessWidget {
  const _NotebookEmptyState();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: const Padding(
        padding: EdgeInsets.all(20),
        child: Text(
          'No saved articles yet. Save stories from the Vote tab to build your notebook.',
          style: EditorialTextStyles.articleBody,
        ),
      ),
    );
  }
}

class _TopicHeading extends StatelessWidget {
  const _TopicHeading({required this.topic});

  final String topic;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            color: EditorialColors.indigoInk,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            child: Text(
              topic.toUpperCase(),
              style: EditorialTextStyles.chip.copyWith(
                color: EditorialColors.paperLight,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        const Expanded(child: Divider(color: EditorialColors.rule)),
      ],
    );
  }
}

class _NotebookClipping extends ConsumerWidget {
  const _NotebookClipping({required this.item});

  final SavedArticleItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final article = item.article;
    final summary = article.summary?.trim();
    final date = DateTime.tryParse(item.savedAt);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: EditorialColors.paperLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: EditorialColors.rule),
          boxShadow: [
            BoxShadow(
              color: EditorialColors.ink.withValues(alpha: 0.05),
              blurRadius: 14,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_sourceLabel(article), style: EditorialTextStyles.metadata),
              const SizedBox(height: 6),
              Text(
                article.storyTitle,
                style: EditorialTextStyles.rankingTitle,
              ),
              if (summary != null && summary.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  summary,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: EditorialTextStyles.articleBody.copyWith(
                    color: EditorialColors.mutedInk,
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (date != null)
                    Text(
                      'Saved ${DateFormat.MMMd().format(date.toLocal())}',
                      style: EditorialTextStyles.metadata,
                    ),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: EditorialColors.paperWarm,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Padding(
                      padding:
                          EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      child: Text(
                        'EDITORIAL NOTE PENDING',
                        style: EditorialTextStyles.metadata,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      await ref
                          .read(userActionsRepositoryProvider)
                          .unsaveArticle(article.id);
                      ref.invalidate(savedNotebookProvider);
                    },
                    child: const Text('Unsave'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Map<String, Map<String, List<SavedArticleItem>>> _groupItems(
  List<SavedArticleItem> items,
) {
  final groups = <String, Map<String, List<SavedArticleItem>>>{};

  for (final item in items) {
    final topic = item.article.categories.isNotEmpty
        ? item.article.categories.first
        : 'Unsorted';
    final bucket = _savedDateBucket(item.savedAt);
    groups.putIfAbsent(topic, () => <String, List<SavedArticleItem>>{});
    groups[topic]!.putIfAbsent(bucket, () => <SavedArticleItem>[]);
    groups[topic]![bucket]!.add(item);
  }

  return Map.fromEntries(
    groups.entries.toList()
      ..sort((a, b) => a.key.toLowerCase().compareTo(b.key.toLowerCase())),
  );
}

String _savedDateBucket(String rawDate) {
  final savedAt = DateTime.tryParse(rawDate)?.toLocal();
  if (savedAt == null) {
    return 'Older';
  }

  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final savedDay = DateTime(savedAt.year, savedAt.month, savedAt.day);
  final days = today.difference(savedDay).inDays;

  if (days == 0) {
    return 'Today';
  }
  if (days == 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return 'This week';
  }
  return 'Older';
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
