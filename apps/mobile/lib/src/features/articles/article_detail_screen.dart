import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/models/article.dart';
import '../../shared/widgets/error_state.dart';
import '../collections/collections_screen.dart';

final articleProvider =
    FutureProvider.autoDispose.family<Article, String>((ref, articleId) {
  return ref.watch(articlesRepositoryProvider).getArticle(articleId);
});

class ArticleDetailScreen extends ConsumerStatefulWidget {
  const ArticleDetailScreen({
    required this.articleId,
    super.key,
  });

  final String articleId;

  @override
  ConsumerState<ArticleDetailScreen> createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends ConsumerState<ArticleDetailScreen> {
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    final article = ref.watch(articleProvider(widget.articleId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Article'),
      ),
      body: article.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(articleProvider(widget.articleId)),
        ),
        data: (article) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              article.sourceName,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              article.headline,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                  ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (article.readingTimeMinutes != null)
                  Chip(label: Text('${article.readingTimeMinutes} min read')),
                for (final topic in article.relatedTopics)
                  Chip(label: Text(topic)),
              ],
            ),
            const SizedBox(height: 24),
            _EditorialBlock(
              title: 'AI Summary',
              body: article.summary ?? 'Summary is not available yet.',
            ),
            const SizedBox(height: 16),
            _EditorialBlock(
              title: 'Why It Matters',
              body: article.whyItMatters ?? 'Context is not available yet.',
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _isSaving ? null : () => _save(article),
              icon: _isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.bookmark_add_outlined),
              label: Text(_isSaving ? 'Saving...' : 'Save to Reading Desk'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save(Article article) async {
    setState(() => _isSaving = true);

    try {
      final collections = ref.read(collectionsRepositoryProvider);
      final collection = await collections.getOrCreateReadingDesk();
      await collections.saveArticle(
        collectionId: collection.id,
        articleId: article.id,
      );
      ref.invalidate(collectionsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved to ${collection.name}')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }
}

class _EditorialBlock extends StatelessWidget {
  const _EditorialBlock({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 8),
            Text(body),
          ],
        ),
      ),
    );
  }
}
