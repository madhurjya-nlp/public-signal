class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
  });

  static const current = AppConfig(
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:3000',
    ),
    supabaseUrl: String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: 'http://127.0.0.1:54321',
    ),
    supabaseAnonKey: String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: '',
    ),
  );

  final String apiBaseUrl;
  final String supabaseUrl;
  final String supabaseAnonKey;
}

