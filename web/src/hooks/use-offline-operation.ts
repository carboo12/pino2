/**
 * useOfflineOperation Hook
 * 
 * Custom hook for executing operations with offline support
 * Automatically enqueues operations for batch sync processing
 */

import { useState } from 'react';
import { syncService, type OperationType, type OperationPriority } from '@/lib/sync-service';
import { logError } from '@/lib/error-logger';

interface UseOfflineOperationOptions {
    storeId: string;
    type: OperationType;
    priority?: OperationPriority;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

interface UseOfflineOperationReturn {
    execute: (data: Record<string, unknown>) => Promise<void>;
    isPending: boolean;
    error: Error | null;
}

export function useOfflineOperation(
    options: UseOfflineOperationOptions
): UseOfflineOperationReturn {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = async (data: Record<string, unknown>) => {
        setIsPending(true);
        setError(null);

        try {
            await syncService.enqueuePendingOperation({
                storeId: options.storeId,
                type: options.type,
                priority: options.priority || 'medium',
                data,
            });

            options.onSuccess?.();
        } catch (err: any) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);

            await logError(error, {
                location: 'use-offline-operation',
                additionalInfo: {
                    storeId: options.storeId,
                    type: options.type,
                },
            });

            options.onError?.(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    };

    return {
        execute,
        isPending,
        error,
    };
}
