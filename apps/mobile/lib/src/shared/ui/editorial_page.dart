import 'package:flutter/material.dart';

class EditorialPage extends StatelessWidget {
  const EditorialPage({
    required this.child,
    super.key,
    this.maxWidth = 620,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: SizedBox(
            height: double.infinity,
            child: child,
          ),
        ),
      ),
    );
  }
}
