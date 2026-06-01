# Mobile App

Flutter source shell for the Personal Newspaper iOS and Android app.

This folder includes:

- `pubspec.yaml`
- App routing
- Editorial theme foundation
- MVP screens for feed, collections, search, assistant, and interest tuning

## Platform Folders

The generated `android/` and `ios/` folders are intentionally not hand-written.

Generate them with the official Flutter tool:

```bash
flutter create --platforms=android,ios --project-name personal_newspaper .
```

Then install dependencies and run:

```bash
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=http://127.0.0.1:54321 \
  --dart-define=SUPABASE_ANON_KEY=your-local-anon-key \
  --dart-define=API_BASE_URL=http://localhost:3000
```

For the Android emulator, use `http://10.0.2.2:3000` for `API_BASE_URL`.

## Architecture Direction

The mobile app should remain thin:

- Supabase Auth session handling.
- API client calls to the NestJS backend.
- Local cache for feed and saved-item state.
- Offline-friendly UI states.
- No direct LLM provider calls.
- No service-role secrets.
