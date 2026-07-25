/**
 * useSyncStatus Hook
 * 
 * Custom hook for monitoring synchronization status of a store
 */


import { useEffect, useState } from 'react';
import { syncService } from '@/lib/sync-service';
import type { SyncStatus } from '@/lib/indexed-db-service';

interface UseSyncStatusReturn {
    isOnline: boolean;
    pendingCount: number;
    failedCount: number;
    isSyncing: boolean;
    lastSync: number | null;
    forceSync: () => Promise<void>;
    clearFailed: () => Promise<void>;
}

export function useSyncStatus(storeId: string | null): UseSyncStatusReturn {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Subscribe to network status
    useEffect(() => {
        setIsOnline(syncService.getIsOnline());

        const unsubscribe = syncService.onNetworkStatusChange((online) => {
            setIsOnline(online);
        });

        return () => { unsubscribe(); };
    }, []);

    // Subscribe to sync status for the store
    useEffect(() => {
        if (!storeId) return;

        const updateStatus = async () => {
            try {
                const status = await syncService.getSyncStatus(storeId);
                setPendingCount(status.pendingCount);
                setFailedCount(status.failedCount);
                setLastSync(status.lastSyncTimestamp);
            } catch (error) {
                console.error('Failed to get sync status:', error);
            }
        };

        // Initial update
        updateStatus();

        // Subscribe to changes
        const unsubscribe = syncService.onSyncStatusChange(storeId, (status: SyncStatus) => {
            setPendingCount(status.pendingCount);
            setFailedCount(status.failedCount);
            setLastSync(status.lastSyncTimestamp);
        });

        return () => { unsubscribe(); };
    }, [storeId]);

    // Monitor syncing state
    useEffect(() => {
        if (pendingCount > 0 && isOnline) {
            setIsSyncing(true);

            const timeout = setTimeout(() => {
                setIsSyncing(false);
            }, 5000);

            return () => clearTimeout(timeout);
        } else {
            setIsSyncing(false);
        }
    }, [pendingCount, isOnline]);

    const forceSync = async () => {
        if (!storeId) {
            throw new Error('No store ID provided');
        }

        setIsSyncing(true);
        try {
            await syncService.forceSyncStore(storeId);
        } finally {
            setIsSyncing(false);
        }
    };

    const clearFailed = async () => {
        if (!storeId) {
            throw new Error('No store ID provided');
        }

        await syncService.clearFailedOperations(storeId);
    };

    return {
        isOnline,
        pendingCount,
        failedCount,
        isSyncing,
        lastSync,
        forceSync,
        clearFailed,
    };
}
