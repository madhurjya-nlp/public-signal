import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../shared/models/collection.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';

final collectionsProvider =
    FutureProvider.autoDispose<List<KnowledgeCollection>>((ref) {
  return ref.watch(collectionsRepositoryProvider).listCollections();
});

class CollectionsScreen extends ConsumerWidget {
  const CollectionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collections = ref.watch(collectionsProvider);

    return collections.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => ErrorState(
        message: error.toString(),
        onRetry: () => ref.invalidate(collectionsProvider),
      ),
      data: (collections) {
        if (collections.isEmpty) {
          return const EmptyState(
            title: 'No saved desks yet',
            message: 'Open an article and save it to create your Reading Desk.',
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: collections.length + 1,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            if (index == 0) {
              return Text(
                'Your Desks',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              );
            }

            final collection = collections[index - 1];
            return Card(
              child: ListTile(
                title: Text(collection.name),
                subtitle: Text('${collection.itemCount} saved items'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/collections/${collection.id}'),
              ),
            );
          },
        );
      },
    );
  }
}

