import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'editorial_theme.dart';

class HalftonePaperBackground extends StatelessWidget {
  const HalftonePaperBackground({
    required this.child,
    super.key,
    this.padding = EdgeInsets.zero,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: EditorialColors.paper,
      child: CustomPaint(
        painter: const _HalftonePaperPainter(),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}

class HalftonePanel extends StatelessWidget {
  const HalftonePanel({
    required this.label,
    this.height = 178,
    super.key,
  });

  final String label;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: CustomPaint(
          painter: _HalftonePanelPainter(label: label),
        ),
      ),
    );
  }
}

class _HalftonePaperPainter extends CustomPainter {
  const _HalftonePaperPainter();

  static const _fragments = [
    'PUBLIC SIGNAL',
    'DAILY RANKING',
    'DOES THIS MATTER?',
    'SOURCE',
    'CRITICAL',
    'WORTH KNOWING',
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final dotPaint = Paint()
      ..color = EditorialColors.ink.withValues(alpha: 0.035);
    final warmPaint = Paint()
      ..color = EditorialColors.rust.withValues(alpha: 0.025);

    for (double y = 18; y < size.height; y += 21) {
      for (double x = 12; x < size.width; x += 19) {
        final wave = math.sin((x * 0.07) + (y * 0.04));
        if (wave > 0.24) {
          canvas.drawCircle(
            Offset(x + wave * 1.8, y),
            0.9 + wave.abs() * 0.45,
            dotPaint,
          );
        }
      }
    }

    for (var i = 0; i < 16; i++) {
      final x = ((i * 97) % (size.width + 80)) - 40;
      final y = ((i * 131) % (size.height + 120)) - 50;
      final rect = Rect.fromLTWH(
        x.toDouble(),
        y.toDouble(),
        90 + (i % 4) * 32,
        12 + (i % 3) * 8,
      );
      canvas.save();
      canvas.translate(rect.center.dx, rect.center.dy);
      canvas.rotate(((i % 7) - 3) * 0.025);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset.zero,
            width: rect.width,
            height: rect.height,
          ),
          const Radius.circular(2),
        ),
        warmPaint,
      );
      canvas.restore();
    }

    for (var i = 0; i < _fragments.length; i++) {
      final painter = TextPainter(
        text: TextSpan(
          text: _fragments[i],
          style: TextStyle(
            color: EditorialColors.ink.withValues(alpha: 0.035),
            fontSize: 12 + (i % 2) * 3,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.8,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: size.width);
      final x = (i * 73) % math.max(size.width - 120, 1);
      final y = 84 + ((i * 163) % math.max(size.height - 120, 1));
      canvas.save();
      canvas.translate(x.toDouble(), y.toDouble());
      canvas.rotate(((i % 5) - 2) * 0.035);
      painter.paint(canvas, Offset.zero);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _HalftonePanelPainter extends CustomPainter {
  const _HalftonePanelPainter({required this.label});

  final String label;

  @override
  void paint(Canvas canvas, Size size) {
    final background = Paint()..color = EditorialColors.paperWarm;
    final accent = Paint()
      ..color = EditorialColors.rust.withValues(alpha: 0.16);
    final dot = Paint()..color = EditorialColors.ink.withValues(alpha: 0.12);

    canvas.drawRect(Offset.zero & size, background);
    canvas.drawCircle(
      Offset(size.width * 0.82, size.height * 0.22),
      72,
      accent,
    );
    canvas.drawCircle(
      Offset(size.width * 0.12, size.height * 0.88),
      54,
      accent,
    );

    for (double y = 10; y < size.height; y += 13) {
      for (double x = 10; x < size.width; x += 13) {
        final strength = math.sin(x * 0.09) + math.cos(y * 0.08);
        if (strength > 0.2) {
          canvas.drawCircle(Offset(x, y), 1.25, dot);
        }
      }
    }

    final painter = TextPainter(
      text: TextSpan(
        text: label.toUpperCase(),
        style: TextStyle(
          color: EditorialColors.ink.withValues(alpha: 0.36),
          fontSize: 13,
          fontWeight: FontWeight.w900,
          letterSpacing: 2.1,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: size.width - 32);
    painter.paint(canvas, Offset(18, size.height - 36));
  }

  @override
  bool shouldRepaint(covariant _HalftonePanelPainter oldDelegate) {
    return oldDelegate.label != label;
  }
}
