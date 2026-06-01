import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/ui/editorial_theme.dart';
import '../../shared/ui/halftone_paper_background.dart';

class PublicSignalIntroScreen extends StatefulWidget {
  const PublicSignalIntroScreen({
    required this.nextLocation,
    super.key,
  });

  final String nextLocation;

  @override
  State<PublicSignalIntroScreen> createState() =>
      _PublicSignalIntroScreenState();
}

class _PublicSignalIntroScreenState extends State<PublicSignalIntroScreen> {
  var _step = 0;
  Timer? _timer;

  static const _copy = [
    'PUBLIC SIGNAL',
    'News is everywhere.',
    'Importance is not.',
    'Vote what matters.',
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 740), (timer) {
      if (!mounted) {
        return;
      }
      if (_step >= _copy.length - 1) {
        timer.cancel();
        Future<void>.delayed(const Duration(milliseconds: 620), _continue);
      } else {
        setState(() => _step += 1);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: HalftonePaperBackground(
        child: SafeArea(
          child: InkWell(
            onTap: _continue,
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 420),
                    transitionBuilder: (child, animation) {
                      final offset = Tween<Offset>(
                        begin: const Offset(0, 0.08),
                        end: Offset.zero,
                      ).animate(animation);
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(position: offset, child: child),
                      );
                    },
                    child: Text(
                      _copy[_step],
                      key: ValueKey(_copy[_step]),
                      textAlign: TextAlign.center,
                      style: _step == 0
                          ? EditorialTextStyles.masthead.copyWith(fontSize: 42)
                          : EditorialTextStyles.sectionTitle.copyWith(
                              fontSize: 30,
                              height: 1.08,
                            ),
                    ),
                  ),
                  const SizedBox(height: 26),
                  Center(
                    child: Text(
                      'Tap to continue',
                      style: EditorialTextStyles.metadata.copyWith(
                        color: EditorialColors.mutedInk,
                      ),
                    ),
                  ),
                  const Spacer(),
                  FilledButton(
                    onPressed: _continue,
                    child: const Text('Continue'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _continue() {
    if (!mounted) {
      return;
    }
    _timer?.cancel();
    context.go(widget.nextLocation);
  }
}
