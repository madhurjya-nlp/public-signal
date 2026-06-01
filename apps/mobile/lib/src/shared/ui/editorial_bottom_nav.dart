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
      child: Align(
        alignment: Alignment.bottomCenter,
        heightFactor: 1,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
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
                      icon: Icons.how_to_vote_outlined,
                      selectedIcon: Icons.how_to_vote,
                      selected: selectedIndex == 0,
                      onTap: () => onSelected(0),
                    ),
                    _NavItem(
                      label: 'Rankings',
                      icon: Icons.leaderboard_outlined,
                      selectedIcon: Icons.leaderboard,
                      selected: selectedIndex == 1,
                      onTap: () => onSelected(1),
                    ),
                    _NavItem(
                      label: 'Profile',
                      icon: Icons.person_outline,
                      selectedIcon: Icons.person,
                      selected: selectedIndex == 2,
                      onTap: () => onSelected(2),
                    ),
                  ],
                ),
              ),
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
    required this.icon,
    required this.selectedIcon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
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
              Icon(
                selected ? selectedIcon : icon,
                color: selected
                    ? EditorialColors.paperLight
                    : EditorialColors.rust,
                size: 17,
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
