import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../shared/models/article.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/ui/halftone_paper_background.dart';
import 'rankings_repository.dart';

class RankingStoryCard extends StatelessWidget {
  const RankingStoryCard({
    required this.item,
    required this.rank,
    super.key,
  });

  final RankingItem item;
  final int rank;

  @override
  Widget build(BuildContext context) {
    final article = item.article;
    final category =
        article.categories.isNotEmpty ? article.categories.first : 'signal';
    final published =
        _formatDate(item.latestPublishedAt ?? article.publishedAt);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperLight,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: EditorialColors.rule),
        boxShadow: [
          BoxShadow(
            color: EditorialColors.ink.withValues(alpha: 0.07),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _RankingImage(article: article, label: category),
            const SizedBox(height: 14),
            Row(
              children: [
                _RankBadge(rank: rank),
                const Spacer(),
                _ScoreBadge(score: item.rankingScore),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _TopicChip(label: category),
                if (published != null)
                  Text(
                    published.toUpperCase(),
                    style: EditorialTextStyles.metadata,
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              article.storyTitle,
              style: EditorialTextStyles.articleHeadline.copyWith(fontSize: 23),
            ),
            const SizedBox(height: 10),
            Text(
              _sourceLabel(article),
              style: EditorialTextStyles.metadata,
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _VoteMetric(label: 'Critical', value: item.critical),
                _VoteMetric(label: 'Worth Knowing', value: item.worthKnowing),
                _VoteMetric(label: 'Not Important', value: item.notImportant),
                _VoteMetric(label: 'Total', value: item.totalVotes),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RankingImage extends StatelessWidget {
  const _RankingImage({
    required this.article,
    required this.label,
  });

  final Article article;
  final String label;

  @override
  Widget build(BuildContext context) {
    final thumbnail = article.thumbnailUrl;
    if (thumbnail == null || thumbnail.isEmpty) {
      return HalftonePanel(label: '${article.source} / $label');
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Image.network(
          thumbnail,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return HalftonePanel(label: '${article.source} / $label');
          },
        ),
      ),
    );
  }
}

class _RankBadge extends StatelessWidget {
  const _RankBadge({required this.rank});

  final int rank;

  @override
  Widget build(BuildContext context) {
    return Text(
      '#$rank',
      style: EditorialTextStyles.sectionTitle.copyWith(
        color: EditorialColors.deepMaroon,
      ),
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  const _ScoreBadge({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.ink,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Text(
          'Score $score',
          style: EditorialTextStyles.button.copyWith(
            color: EditorialColors.paperLight,
          ),
        ),
      ),
    );
  }
}

class _TopicChip extends StatelessWidget {
  const _TopicChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperWarm,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
        child: Text(label.toUpperCase(), style: EditorialTextStyles.chip),
      ),
    );
  }
}

class _VoteMetric extends StatelessWidget {
  const _VoteMetric({
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
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
        child: Text(
          '$label $value',
          style: EditorialTextStyles.metadata.copyWith(
            fontSize: 10,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
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

String? _formatDate(String? raw) {
  if (raw == null || raw.isEmpty) {
    return null;
  }
  final date = DateTime.tryParse(raw);
  if (date == null) {
    return null;
  }
  return DateFormat.MMMd().format(date.toLocal());
}
