import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../features/votes/votes_repository.dart';
import '../models/article.dart';
import 'editorial_theme.dart';
import 'halftone_paper_background.dart';

class EditorialArticleCard extends StatelessWidget {
  const EditorialArticleCard({
    required this.article,
    required this.isVoting,
    required this.onVote,
    super.key,
  });

  final Article article;
  final bool isVoting;
  final Future<void> Function(VoteType voteType) onVote;

  @override
  Widget build(BuildContext context) {
    final category =
        article.categories.isNotEmpty ? article.categories.first : 'signal';
    final published = _formatDate(article.publishedAt);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paperLight,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: EditorialColors.rule),
        boxShadow: [
          BoxShadow(
            color: EditorialColors.ink.withValues(alpha: 0.08),
            blurRadius: 28,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                _ArticleImage(article: article, label: category),
                Positioned(
                  left: 14,
                  top: 14,
                  child: _EditorialChip(
                    label: category,
                    dark: true,
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 18, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        'Source: ${article.source}',
                        style: EditorialTextStyles.metadata,
                      ),
                      if (published != null)
                        Text(
                          published.toUpperCase(),
                          style: EditorialTextStyles.metadata,
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    article.title,
                    style: EditorialTextStyles.articleHeadline,
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _sourceSummary,
                    style: EditorialTextStyles.articleBody.copyWith(
                      color: EditorialColors.mutedInk,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const _AiBriefPlaceholder(),
                  if (article.categories.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final topic in article.categories)
                          _EditorialChip(label: topic),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  Text(
                    'Does this matter?',
                    style: EditorialTextStyles.sectionTitle,
                  ),
                  const SizedBox(height: 12),
                  _VoteButton(
                    label: 'Critical',
                    description: 'Major public consequence',
                    enabled: !isVoting,
                    color: EditorialColors.rust,
                    onPressed: () => onVote(VoteType.critical),
                  ),
                  const SizedBox(height: 9),
                  _VoteButton(
                    label: 'Worth Knowing',
                    description: 'Useful public context',
                    enabled: !isVoting,
                    color: EditorialColors.greenInk,
                    onPressed: () => onVote(VoteType.worthKnowing),
                  ),
                  const SizedBox(height: 9),
                  _VoteButton(
                    label: 'Not Important',
                    description: 'Low public signal',
                    enabled: !isVoting,
                    color: EditorialColors.mutedInk,
                    onPressed: () => onVote(VoteType.notImportant),
                  ),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    child: isVoting
                        ? const Padding(
                            key: ValueKey('voting'),
                            padding: EdgeInsets.only(top: 14),
                            child: Center(
                              child: Text(
                                'Recording signal...',
                                style: EditorialTextStyles.metadata,
                              ),
                            ),
                          )
                        : const SizedBox.shrink(key: ValueKey('idle')),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String get _sourceSummary {
    final summary = article.summary?.trim();
    if (summary == null || summary.isEmpty) {
      return 'No source summary available.';
    }
    return summary;
  }
}

class _ArticleImage extends StatelessWidget {
  const _ArticleImage({
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
      borderRadius: BorderRadius.circular(24),
      child: Image.network(
        thumbnail,
        height: 190,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return HalftonePanel(label: '${article.source} / $label');
        },
      ),
    );
  }
}

class _AiBriefPlaceholder extends StatelessWidget {
  const _AiBriefPlaceholder();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: EditorialColors.paper,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: EditorialColors.rule),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AI brief',
              style: EditorialTextStyles.metadata.copyWith(
                color: EditorialColors.rust,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              'A short public-interest summary will appear here after source review.',
              style: EditorialTextStyles.articleBody.copyWith(
                color: EditorialColors.mutedInk,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditorialChip extends StatelessWidget {
  const _EditorialChip({
    required this.label,
    this.dark = false,
  });

  final String label;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: dark
            ? EditorialColors.ink.withValues(alpha: 0.88)
            : EditorialColors.paperWarm,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: dark ? Colors.transparent : EditorialColors.rule,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        child: Text(
          label.toUpperCase(),
          style: EditorialTextStyles.chip.copyWith(
            color: dark ? EditorialColors.paperLight : EditorialColors.ink,
          ),
        ),
      ),
    );
  }
}

class _VoteButton extends StatefulWidget {
  const _VoteButton({
    required this.label,
    required this.description,
    required this.enabled,
    required this.color,
    required this.onPressed,
  });

  final String label;
  final String description;
  final bool enabled;
  final Color color;
  final VoidCallback onPressed;

  @override
  State<_VoteButton> createState() => _VoteButtonState();
}

class _VoteButtonState extends State<_VoteButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.enabled ? (_) => setState(() => _pressed = true) : null,
      onTapCancel:
          widget.enabled ? () => setState(() => _pressed = false) : null,
      onTapUp: widget.enabled
          ? (_) {
              setState(() => _pressed = false);
              widget.onPressed();
            }
          : null,
      child: AnimatedScale(
        scale: _pressed ? 0.985 : 1,
        duration: const Duration(milliseconds: 90),
        child: AnimatedOpacity(
          opacity: widget.enabled ? 1 : 0.55,
          duration: const Duration(milliseconds: 120),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: widget.color,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.label,
                          style: EditorialTextStyles.button.copyWith(
                            color: EditorialColors.paperLight,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.description,
                          style: EditorialTextStyles.metadata.copyWith(
                            color: EditorialColors.paperLight
                                .withValues(alpha: 0.76),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward,
                    color: EditorialColors.paperLight,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
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
