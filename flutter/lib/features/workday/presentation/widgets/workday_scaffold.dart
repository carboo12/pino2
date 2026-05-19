import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import 'sync_status_strip.dart';

class WorkdayScaffold extends ConsumerWidget {
  final String title;
  final List<BottomNavItem> bottomNavItems;
  final Widget body;
  final Widget? syncBanner;
  final Widget? actionFooter;
  final Widget? leading;

  const WorkdayScaffold({
    super.key,
    required this.title,
    required this.bottomNavItems,
    required this.body,
    this.syncBanner,
    this.actionFooter,
    this.leading,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncQueueProcessorProvider);
    final showSync = syncState.pendingCount > 0 ||
        syncState.status == SyncQueueStatus.error;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        leading: leading,
        actions: [
          if (ref.watch(authControllerProvider).session?.user.role != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Text(
                roleLabel(normalizeRole(
                    ref.watch(authControllerProvider).session?.user.role)),
                style: TextStyle(
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          if (showSync)
            syncBanner ?? const SyncStatusStrip(),
          Expanded(child: body),
          ?actionFooter,
        ],
      ),
      bottomNavigationBar: NavigationBar(
        destinations: bottomNavItems
            .map((item) => NavigationDestination(
                  icon: Icon(item.icon),
                  selectedIcon: Icon(item.activeIcon),
                  label: item.label,
                ))
            .toList(),
        onDestinationSelected: (index) => bottomNavItems[index].onTap(),
        selectedIndex: bottomNavItems.indexWhere((item) => item.isSelected),
      ),
    );
  }
}

class BottomNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final VoidCallback onTap;
  final bool isSelected;

  const BottomNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.onTap,
    this.isSelected = false,
  });
}
