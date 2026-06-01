# Security

## Principles

- Treat every public endpoint as hostile.
- Never expose service-role Supabase keys to clients.
- Never put LLM provider keys in the mobile app.
- Use row-level security for user-owned data.
- Validate all request bodies.
- Rate-limit expensive AI and search endpoints.

## Authentication

The mobile app authenticates with Supabase Auth and sends the Supabase JWT to the NestJS API.

The API must:

- Verify the JWT.
- Resolve the user ID.
- Enforce authorization in service logic.
- Rely on RLS as an additional database boundary.

## Data Privacy

User-owned data:

- Profile.
- Interests and suppressions.
- Collections.
- Saved articles.
- Notes.
- Assistant conversations.
- Behavioral signals.

AI providers should receive only the minimum context needed for a task. Do not send unnecessary profile or identity information to model providers.

## API Security

Required before production:

- Helmet.
- CORS allowlist.
- Request validation.
- Structured logging without secrets.
- Rate limiting.
- Audit logs for AI calls and data export/delete events.
- Provider key rotation.

## Content and Copyright

Store:

- Headline.
- Source.
- URL.
- Metadata.
- Thumbnail.
- Summary.
- Why It Matters.
- Topics.
- Embeddings.

Avoid storing full article content unless there is explicit licensing or user-provided content rights.

