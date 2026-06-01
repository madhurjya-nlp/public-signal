import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../shared/models/collection.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';

final collectionDetailProvider = FutureProvider.autoDispose
    .family<CollectionDetail, String>((ref, collectionId) {
  return ref.watch(collectionsRepositoryProvider).getCollection(collectionId);
});

class CollectionDetailScreen extends ConsumerWidget {
  const CollectionDetailScreen({
    required this.collectionId,
    super.key,
  });

  final String collectionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collection = ref.watch(collectionDetailProvider(collectionId));

    return Scaffold(
      appBar: AppBar(title: const Text('Saved Desk')),
      body: collection.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(collectionDetailProvider(collectionId)),
        ),
        data: (collection) {
          if (collection.items.isEmpty) {
            return EmptyState(
              title: collection.name,
              message: 'This desk is empty.',
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: collection.items.length + 1,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              if (index == 0) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      collection.name,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text('${collection.itemCount} saved items'),
                  ],
                );
              }

              final item = collection.items[index - 1];
              return Card(
                child: ListTile(
                  title: Text(item.article.headline),
                  subtitle: Text(item.article.sourceName),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/articles/${item.article.id}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

