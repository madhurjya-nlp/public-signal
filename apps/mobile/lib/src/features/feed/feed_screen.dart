import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/models/article.dart';
import '../../shared/ui/editorial_article_card.dart';
import '../../shared/ui/editorial_page.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../votes/votes_repository.dart';
import 'feed_repository.dart';

final publicSignalFeedProvider =
    FutureProvider.autoDispose<FeedResponse>((ref) {
  return ref.watch(feedRepositoryProvider).getFeed();
});

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final List<Article> _previousArticles = [];
  final Set<String> _savedArticleIds = {};
  int _index = 0;
  bool _isVoting = false;
  bool _isSaving = false;
  bool _isSkipping = false;

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(publicSignalFeedProvider);

    return feed.when(
      loading: () => const Center(
        child: Text(
          'Setting the front page...',
          style: EditorialTextStyles.metadata,
        ),
      ),
      error: (error, stackTrace) => ErrorState(
        message:
            'The feed could not be loaded. Check the backend and try again.',
        onRetry: () => ref.invalidate(publicSignalFeedProvider),
      ),
      data: (feed) {
        if (feed.items.isEmpty || _index >= feed.items.length) {
          return EmptyState(
            title: 'No articles available yet.',
            message: 'Run local ingestion or broaden your interests.',
            action: FilledButton(
              onPressed: () {
                setState(() {
                  _index = 0;
                  _previousArticles.clear();
                });
                ref.invalidate(publicSignalFeedProvider);
              },
              child: const Text('Refresh feed'),
            ),
          );
        }

        final article = feed.items[_index];
        return EditorialPage(
          child: _VotingArticleView(
            article: article,
            position: _index + 1,
            total: feed.items.length,
            hasPrevious: _previousArticles.isNotEmpty,
            isVoting: _isVoting,
            isSaving: _isSaving,
            isSkipping: _isSkipping,
            isSaved: _savedArticleIds.contains(article.id) || article.isSaved,
            onPrevious: _showPrevious,
            onVote: _submitVote,
            onToggleSave: _toggleSave,
            onSkip: _skipArticle,
          ),
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
        setState(() {
          _previousArticles.add(article);
          _index += 1;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vote could not be saved. Please try again.'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isVoting = false);
      }
    }
  }

  Future<void> _toggleSave(Article article) async {
    if (_isVoting || _isSaving || _isSkipping) {
      return;
    }

    final isSaved = _savedArticleIds.contains(article.id) || article.isSaved;
    setState(() => _isSaving = true);

    try {
      if (isSaved) {
        await ref.read(userActionsRepositoryProvider).unsaveArticle(article.id);
        if (mounted) {
          setState(() => _savedArticleIds.remove(article.id));
        }
      } else {
        await ref.read(userActionsRepositoryProvider).saveArticle(article.id);
        if (mounted) {
          setState(() => _savedArticleIds.add(article.id));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Save state could not be updated.'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _skipArticle(Article article) async {
    if (_isVoting || _isSaving || _isSkipping) {
      return;
    }

    setState(() => _isSkipping = true);

    try {
      await ref.read(userActionsRepositoryProvider).skipArticle(article.id);
      if (mounted) {
        setState(() {
          _previousArticles.add(article);
          _index += 1;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Skipped. No vote recorded.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Article could not be skipped. Please try again.'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSkipping = false);
      }
    }
  }

  void _showPrevious() {
    if (_previousArticles.isEmpty || _isVoting || _isSaving || _isSkipping) {
      return;
    }

    setState(() {
      _previousArticles.removeLast();
      _index = math.max(0, _index - 1);
    });
  }
}

class _VotingArticleView extends StatelessWidget {
  const _VotingArticleView({
    required this.article,
    required this.position,
    required this.total,
    required this.hasPrevious,
    required this.isVoting,
    required this.isSaving,
    required this.isSkipping,
    required this.isSaved,
    required this.onPrevious,
    required this.onVote,
    required this.onToggleSave,
    required this.onSkip,
  });

  final Article article;
  final int position;
  final int total;
  final bool hasPrevious;
  final bool isVoting;
  final bool isSaving;
  final bool isSkipping;
  final bool isSaved;
  final VoidCallback onPrevious;
  final Future<void> Function(Article article, VoteType voteType) onVote;
  final Future<void> Function(Article article) onToggleSave;
  final Future<void> Function(Article article) onSkip;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Article $position of $total',
                style: EditorialTextStyles.metadata,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 260),
          transitionBuilder: (child, animation) {
            final offset = Tween<Offset>(
              begin: const Offset(0.05, 0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeOut),
            );
            return FadeTransition(
              opacity: animation,
              child: SlideTransition(position: offset, child: child),
            );
          },
          child: EditorialArticleCard(
            key: ValueKey(article.id),
            article: article,
            isVoting: isVoting,
            isSaved: isSaved,
            isSaving: isSaving,
            isSkipping: isSkipping,
            onVote: (voteType) => onVote(article, voteType),
            onToggleSave: () => onToggleSave(article),
            onSkip: () => onSkip(article),
            onPrevious: hasPrevious ? onPrevious : null,
          ),
        ),
      ],
    );
  }
}
