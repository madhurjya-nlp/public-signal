import 'package:flutter/material.dart';

import 'editorial_theme.dart';

class EditorialBottomNav extends StatelessWidget {
  const EditorialBottomNav({
    required this.selectedIndex,
    required this.onSelected,
    super.key,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: EditorialColors.paperLight.withValues(alpha: 0.94),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: EditorialColors.rule),
            boxShadow: [
              BoxShadow(
                color: EditorialColors.ink.withValues(alpha: 0.08),
                blurRadius: 22,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(6),
            child: Row(
              children: [
                _NavItem(
                  label: 'Vote',
                  symbol: 'V',
                  selected: selectedIndex == 0,
                  onTap: () => onSelected(0),
                ),
                _NavItem(
                  label: 'Rankings',
                  symbol: 'R',
                  selected: selectedIndex == 1,
                  onTap: () => onSelected(1),
                ),
                _NavItem(
                  label: 'Profile',
                  symbol: 'P',
                  selected: selectedIndex == 2,
                  onTap: () => onSelected(2),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.label,
    required this.symbol,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String symbol;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 8),
          decoration: BoxDecoration(
            color: selected ? EditorialColors.ink : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                symbol,
                style: EditorialTextStyles.metadata.copyWith(
                  color: selected
                      ? EditorialColors.paperLight
                      : EditorialColors.rust,
                  fontSize: 12,
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 160),
                child: selected
                    ? const SizedBox(width: 7)
                    : const SizedBox.shrink(),
              ),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: EditorialTextStyles.button.copyWith(
                    color: selected
                        ? EditorialColors.paperLight
                        : EditorialColors.mutedInk,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
