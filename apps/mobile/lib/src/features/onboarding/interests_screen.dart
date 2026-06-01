import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';

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
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Tune Your Newspaper',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 12),
            const Text('Choose the public-interest areas you want to evaluate first.'),
            const SizedBox(height: 24),
            Text('Interests', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final interest in _interests)
                  FilterChip(
                    label: Text(interest),
                    selected: _selected.contains(interest),
                    onSelected: (value) {
                      setState(() {
                        value
                            ? _selected.add(interest)
                            : _selected.remove(interest);
                      });
                    },
                  ),
              ],
            ),
            const SizedBox(height: 24),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 32),
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
        context.go('/feed');
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
