import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app.dart';
import 'src/config/app_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: AppConfig.current.supabaseUrl,
    anonKey: AppConfig.current.supabaseAnonKey,
  );

  runApp(const ProviderScope(child: PersonalNewspaperApp()));
}
