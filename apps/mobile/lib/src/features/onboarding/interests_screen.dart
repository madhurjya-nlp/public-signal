import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../shared/ui/editorial_theme.dart';
import '../../shared/ui/editorial_page.dart';
import '../../shared/ui/halftone_paper_background.dart';
import '../../shared/ui/public_signal_masthead.dart';

class InterestsScreen extends ConsumerStatefulWidget {
  const InterestsScreen({super.key});

  @override
  ConsumerState<InterestsScreen> createState() => _InterestsScreenState();
}

class _InterestsScreenState extends ConsumerState<InterestsScreen> {
  static const _interests = [
    'science',
    'history',
    'technology',
    'culture',
    'politics',
    'business',
    'environment',
  ];

  final Set<String> _selected = {};
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: HalftonePaperBackground(
        child: SafeArea(
          child: EditorialPage(
            maxWidth: 560,
            child: ListView(
              padding: const EdgeInsets.all(22),
              children: [
                const PublicSignalMasthead(),
                const SizedBox(height: 22),
                Text(
                  'Tune your newspaper',
                  style: EditorialTextStyles.sectionTitle,
                ),
                const SizedBox(height: 12),
                Text(
                  'Choose the public-interest areas you want to evaluate first.',
                  style: EditorialTextStyles.articleBody.copyWith(
                    color: EditorialColors.mutedInk,
                  ),
                ),
                const SizedBox(height: 26),
                const Text('INTERESTS', style: EditorialTextStyles.metadata),
                const SizedBox(height: 12),
                GridView.builder(
                  itemCount: _interests.length,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.45,
                  ),
                  itemBuilder: (context, index) {
                    final interest = _interests[index];
                    final selected = _selected.contains(interest);

                    return _InterestTile(
                      label: interest,
                      selected: selected,
                      onTap: () {
                        setState(() {
                          selected
                              ? _selected.remove(interest)
                              : _selected.add(interest);
                        });
                      },
                    );
                  },
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ],
                const SizedBox(height: 30),
                FilledButton(
                  onPressed: _isLoading ? null : _save,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Start voting'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (_selected.isEmpty) {
      setState(() => _error = 'Select at least one interest.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(userRepositoryProvider).updateInterests(
        interests: _selected.toList(),
        suppressedTopics: const [],
      );

      if (mounted) {
        context.go('/intro?next=/feed');
      }
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}

class _InterestTile extends StatelessWidget {
  const _InterestTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          color: selected ? EditorialColors.ink : EditorialColors.paperLight,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected ? EditorialColors.ink : EditorialColors.rule,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: EditorialColors.ink.withValues(alpha: 0.12),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ]
              : null,
        ),
        padding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            Positioned(
              right: -12,
              bottom: -12,
              child: Text(
                label.substring(0, 1).toUpperCase(),
                style: EditorialTextStyles.masthead.copyWith(
                  color: selected
                      ? EditorialColors.paperLight.withValues(alpha: 0.1)
                      : EditorialColors.rust.withValues(alpha: 0.08),
                  fontSize: 54,
                ),
              ),
            ),
            Align(
              alignment: Alignment.bottomLeft,
              child: Text(
                label,
                style: EditorialTextStyles.chip.copyWith(
                  color: selected
                      ? EditorialColors.paperLight
                      : EditorialColors.ink,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
