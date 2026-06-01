# Product MVP

## Problem

Most news products optimize for recency, page views, and generic trends. This product should optimize for meaningful knowledge collection.

The MVP must prove that users can:

1. Define interests and suppress unwanted topics.
2. Receive a useful personalized feed.
3. Save items into collections.
4. Search and ask questions over their knowledge archive.

## Recommended MVP

The first production slice should include:

- Email/social authentication through Supabase Auth.
- Interest onboarding with positive and negative topic signals.
- A feed built from article metadata, AI summaries, topics, and ranking signals.
- Save-to-collection flow as the primary interaction.
- Semantic search over articles, summaries, notes, and collections.
- A basic assistant that can answer questions using saved/read content.

## Success Metrics

Primary:

- Saved items per user per week.

Secondary:

- Collection creation rate.
- Return visits.
- Reading completion rate.
- AI interactions.
- Knowledge retention signals.

## Product Constraints

- No comments.
- No public profiles.
- No social graph.
- No intrusive ads.
- No infinite engagement loops.
- No hardcoded AI provider.
- No storage of full copyrighted articles unless licensing allows it.

## First User Flow

1. User signs up.
2. User selects interests and suppressed topics.
3. User lands on today's personal edition.
4. User opens an article card.
5. User saves it into a collection.
6. User searches or asks a question over saved material.

