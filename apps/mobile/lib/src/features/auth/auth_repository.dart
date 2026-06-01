import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepository {
  SupabaseClient get _client => Supabase.instance.client;

  bool get isSignedIn => _client.auth.currentSession != null;

  Future<void> signUp({
    required String email,
    required String password,
  }) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
    );

    if (response.user == null) {
      throw Exception('Signup failed. Check your email confirmation settings.');
    }

    if (response.session == null) {
      await signIn(email: email, password: password);
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() => _client.auth.signOut();
}
