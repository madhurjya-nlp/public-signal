import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  const paper = Color(0xFFF8F1E3);
  const ink = Color(0xFF1F1B16);
  const accent = Color(0xFF9B3D20);

  final colorScheme = ColorScheme.fromSeed(
    seedColor: accent,
    brightness: Brightness.light,
    surface: paper,
    onSurface: ink,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: paper,
    appBarTheme: const AppBarTheme(
      backgroundColor: paper,
      foregroundColor: ink,
      centerTitle: false,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFFFFFAEF),
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: Color(0xFFE6D8BF)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: paper,
      indicatorColor: const Color(0xFFE9D2BE),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
  );
}
