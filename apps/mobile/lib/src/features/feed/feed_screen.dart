import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/models/article.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../votes/votes_repository.dart';
import 'feed_repository.dart';

final publicSignalFeedProvider = FutureProvider.autoDispose<FeedResponse>((ref) {
  return ref.watch(feedRepositoryProvider).getFeed();
});

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  int _index = 0;
  bool _isVoting = false;

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(publicSignalFeedProvider);

    return feed.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => ErrorState(
        message: error.toString(),
        onRetry: () => ref.invalidate(publicSignalFeedProvider),
      ),
      data: (feed) {
        if (feed.items.isEmpty || _index >= feed.items.length) {
          return EmptyState(
            title: 'No more articles',
            message: 'You have evaluated the available public signals.',
            action: FilledButton(
              onPressed: () {
                setState(() => _index = 0);
                ref.invalidate(publicSignalFeedProvider);
              },
              child: const Text('Refresh feed'),
            ),
          );
        }

        return _VotingArticleView(
          article: feed.items[_index],
          position: _index + 1,
          total: feed.items.length,
          isVoting: _isVoting,
          onVote: _submitVote,
        );
      },
    );
  }

  Future<void> _submitVote(Article article, VoteType voteType) async {
    if (_isVoting) {
      return;
    }

    setState(() => _isVoting = true);

    try {
      await ref.read(votesRepositoryProvider).submitVote(
            articleId: article.id,
            voteType: voteType,
          );

      if (mounted) {
        setState(() => _index += 1);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isVoting = false);
      }
    }
  }
}

class _VotingArticleView extends StatelessWidget {
  const _VotingArticleView({
    required this.article,
    required this.position,
    required this.total,
    required this.isVoting,
    required this.onVote,
  });

  final Article article;
  final int position;
  final int total;
  final bool isVoting;
  final Future<void> Function(Article article, VoteType voteType) onVote;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Public Signal',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 4),
        Text('Article $position of $total'),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (article.thumbnailUrl != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.network(
                      article.thumbnailUrl!,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const SizedBox.shrink(),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  article.source,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  article.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.08,
                      ),
                ),
                if (article.summary != null && article.summary!.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(article.summary!),
                ],
                const SizedBox(height: 18),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final category in article.categories)
                      Chip(label: Text(category.toString())),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Does this matter?',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 12),
        _VoteButton(
          label: 'Critical',
          icon: Icons.priority_high,
          enabled: !isVoting,
          onPressed: () => onVote(article, VoteType.critical),
        ),
        const SizedBox(height: 10),
        _VoteButton(
          label: 'Worth Knowing',
          icon: Icons.check_circle_outline,
          enabled: !isVoting,
          onPressed: () => onVote(article, VoteType.worthKnowing),
        ),
        const SizedBox(height: 10),
        _VoteButton(
          label: 'Not Important',
          icon: Icons.remove_circle_outline,
          enabled: !isVoting,
          onPressed: () => onVote(article, VoteType.notImportant),
        ),
        if (isVoting) ...[
          const SizedBox(height: 16),
          const Center(child: CircularProgressIndicator()),
        ],
      ],
    );
  }
}

class _VoteButton extends StatelessWidget {
  const _VoteButton({
    required this.label,
    required this.icon,
    required this.enabled,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: enabled ? onPressed : null,
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

