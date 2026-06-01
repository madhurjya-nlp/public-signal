import 'package:flutter/material.dart';

import '../shared/ui/editorial_theme.dart';

ThemeData buildAppTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: EditorialColors.rust,
    brightness: Brightness.light,
    surface: EditorialColors.paper,
    onSurface: EditorialColors.ink,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: EditorialColors.paper,
    textTheme: const TextTheme(
      headlineLarge: EditorialTextStyles.masthead,
      headlineMedium: EditorialTextStyles.sectionTitle,
      headlineSmall: EditorialTextStyles.articleHeadline,
      titleLarge: EditorialTextStyles.sectionTitle,
      bodyMedium: EditorialTextStyles.articleBody,
      labelLarge: EditorialTextStyles.metadata,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: EditorialColors.paper,
      foregroundColor: EditorialColors.ink,
      centerTitle: false,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: EditorialColors.paperLight,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: EditorialColors.rule),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: EditorialColors.ink,
        foregroundColor: EditorialColors.paperLight,
        textStyle: EditorialTextStyles.button,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: EditorialColors.paperLight,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: EditorialColors.rule),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: EditorialColors.rule),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: EditorialColors.rust, width: 1.4),
      ),
    ),
  );
}
