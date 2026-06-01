import 'package:flutter_test/flutter_test.dart';
import 'package:personal_newspaper/src/shared/models/article.dart';

void main() {
  test('Article.fromJson maps id from backend UUID id field', () {
    final article = Article.fromJson({
      'id': '20000000-0000-0000-0000-000000000001',
      'title': 'Public signal headline',
      'url': 'https://example.com/story',
      'source': 'Example Source',
      'summary': 'Summary',
      'thumbnail_url': null,
      'published_at': null,
      'categories': ['technology'],
      'created_at': '2026-06-01T00:00:00.000Z',
    });

    expect(article.id, '20000000-0000-0000-0000-000000000001');
    expect(article.url, 'https://example.com/story');
    expect(article.id, isNot(article.url));
  });

  test('Article.fromJson rejects URL-shaped ids before voting', () {
    expect(
      () => Article.fromJson({
        'id': 'https://example.com/story',
        'title': 'Public signal headline',
        'url': 'https://example.com/story',
        'source': 'Example Source',
        'categories': ['technology'],
      }),
      throwsFormatException,
    );
  });
}

