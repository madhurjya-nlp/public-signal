import 'package:flutter/material.dart';

import 'editorial_theme.dart';

class PublicSignalMasthead extends StatelessWidget {
  const PublicSignalMasthead({
    super.key,
    this.compact = false,
  });

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 720),
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, compact ? 10 : 16, 20, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const DecoratedBox(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: EditorialColors.rule),
                  ),
                ),
                child: SizedBox(height: 7),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Expanded(
                    child: Text(
                      'Public Signal',
                      style: EditorialTextStyles.masthead,
                    ),
                  ),
                  Text(
                    'Does this matter?',
                    style: EditorialTextStyles.metadata.copyWith(
                      color: EditorialColors.rust,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 9),
              const DecoratedBox(
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: EditorialColors.rule),
                  ),
                ),
                child: SizedBox(height: 1),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
