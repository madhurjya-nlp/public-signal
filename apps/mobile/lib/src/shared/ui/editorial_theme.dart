import 'package:flutter/material.dart';

class EditorialColors {
  const EditorialColors._();

  static const paper = Color(0xFFF7F0E1);
  static const paperLight = Color(0xFFFFFBF1);
  static const paperWarm = Color(0xFFEEDDC4);
  static const ink = Color(0xFF1F1A14);
  static const mutedInk = Color(0xFF75685A);
  static const rule = Color(0xFFD9C9AE);
  static const rust = Color(0xFF9D4327);
  static const saffron = Color(0xFFC47A2C);
  static const greenInk = Color(0xFF355E46);
}

class EditorialTextStyles {
  const EditorialTextStyles._();

  static const _serifFallback = ['Georgia', 'Times New Roman', 'serif'];

  static const masthead = TextStyle(
    color: EditorialColors.ink,
    fontSize: 31,
    fontWeight: FontWeight.w800,
    height: 0.95,
    letterSpacing: -1.2,
    fontFamilyFallback: _serifFallback,
  );

  static const sectionTitle = TextStyle(
    color: EditorialColors.ink,
    fontSize: 21,
    fontWeight: FontWeight.w800,
    height: 1.05,
    fontFamilyFallback: _serifFallback,
  );

  static const articleHeadline = TextStyle(
    color: EditorialColors.ink,
    fontSize: 27,
    fontWeight: FontWeight.w800,
    height: 1.03,
    letterSpacing: -0.6,
    fontFamilyFallback: _serifFallback,
  );

  static const articleBody = TextStyle(
    color: EditorialColors.ink,
    fontSize: 15,
    height: 1.45,
    letterSpacing: 0.05,
  );

  static const metadata = TextStyle(
    color: EditorialColors.mutedInk,
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.2,
  );

  static const chip = TextStyle(
    color: EditorialColors.ink,
    fontSize: 12,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.2,
  );

  static const button = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.2,
  );

  static const rankingTitle = TextStyle(
    color: EditorialColors.ink,
    fontSize: 17,
    fontWeight: FontWeight.w800,
    height: 1.15,
    fontFamilyFallback: _serifFallback,
  );

  static const profileLabel = TextStyle(
    color: EditorialColors.mutedInk,
    fontSize: 12,
    fontWeight: FontWeight.w800,
    letterSpacing: 1.1,
  );
}
