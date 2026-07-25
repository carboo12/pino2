/**
 * IndexedDB Service for Offline Data Persistence
 * 
 * Manages local storage of pending operations, sync status, and offline cache
 * to ensure data integrity when working without internet connection.
 */

const DB_NAME = 'multitienda_offline_db';
const DB_VERSION = 1;

// Store names
const STORES = {
    PENDING_OPERATIONS: 'pendingOperations',
    SYNC_STATUS: 'syncStatus',
    OFFLINE_CACHE: 'offlineCache',
} as const;

export interface PendingOperation {
    id: string;
    operationId: string;
    storeId: string;
    type: 'SALE' | 'ORDER' | 'COLLECTION' | 'RETURN' | 'INVENTORY' | 'PRODUCT' | 'CLIENT';
    priority: 'high' | 'medium' | 'low';
    data: any;
    timestamp: number;
    retryCount: number;
    lastError?: string;
    status: 'pending' | 'processing' | 'failed';
}

export interface SyncStatus {
    storeId: string;
    lastSyncTimestamp: number;
    pendingCount: number;
    failedCount: number;
    isOnline: boolean;
    lastError?: string;
}

class IndexedDBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize IndexedDB database and create object stores
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create pending operations store
                if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
                    const pendingStore = db.createObjectStore(STORES.PENDING_OPERATIONS, { keyPath: 'id' });
                    pendingStore.createIndex('storeId', 'storeId', { unique: false });
                    pendingStore.createIndex('priority', 'priority', { unique: false });
                    pendingStore.createIndex('status', 'status', { unique: false });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create sync status store
                if (!db.objectStoreNames.contains(STORES.SYNC_STATUS)) {
                    db.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'storeId' });
                }

                // Create offline cache store
                if (!db.objectStoreNames.contains(STORES.OFFLINE_CACHE)) {
                    const cacheStore = db.createObjectStore(STORES.OFFLINE_CACHE, { keyPath: 'key' });
                    cacheStore.createIndex('storeId', 'storeId', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Save a pending operation to the queue
     */
    async savePendingOperation(operation: PendingOperation): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
            const request = store.put(operation);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to save pending operation'));
        });
    }

    /**
     * Get all pending operations for a specific store
     */
    async getPendingOperations(storeId: string): Promise<PendingOperation[]> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PENDING_OPERATIONS], 'readonly');
            const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
            const index = store.index('storeId');
            const request = index.getAll(storeId);

            request.onsuccess = () => {
                const operations = request.result as PendingOperation[];
                // Sort by priority (high > medium > low) and then by timestamp
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                operations.sort((a, b) => {
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                    return a.timestamp - b.timestamp;
                });
                resolve(operations);
            };
            request.onerror = () => reject(new Error('Failed to get pending operations'));
        });
    }

    /**
     * Get all pending operations across all stores
     */
    async getAllPendingOperations(): Promise<PendingOperation[]> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PENDING_OPERATIONS], 'readonly');
            const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
            const request = store.getAll();

            request.onsuccess = () => {
                const operations = request.result as PendingOperation[];
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                operations.sort((a, b) => {
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                    return a.timestamp - b.timestamp;
                });
                resolve(operations);
            };
            request.onerror = () => reject(new Error('Failed to get all pending operations'));
        });
    }

    /**
     * Remove a pending operation from the queue
     */
    async removePendingOperation(operationId: string): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
            const request = store.delete(operationId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to remove pending operation'));
        });
    }

    /**
     * Update the status of a pending operation
     */
    async updateOperationStatus(
        operationId: string,
        status: PendingOperation['status'],
        error?: string
    ): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
            const getRequest = store.get(operationId);

            getRequest.onsuccess = () => {
                const operation = getRequest.result as PendingOperation;
                if (!operation) {
                    reject(new Error('Operation not found'));
                    return;
                }

                operation.status = status;
                if (error) operation.lastError = error;
                if (status === 'failed') operation.retryCount++;

                const putRequest = store.put(operation);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(new Error('Failed to update operation status'));
            };

            getRequest.onerror = () => reject(new Error('Failed to get operation'));
        });
    }

    /**
     * Update sync status for a store
     */
    async updateSyncStatus(status: SyncStatus): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.SYNC_STATUS], 'readwrite');
            const store = transaction.objectStore(STORES.SYNC_STATUS);
            const request = store.put(status);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to update sync status'));
        });
    }

    /**
     * Get sync status for a specific store
     */
    async getSyncStatus(storeId: string): Promise<SyncStatus | null> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.SYNC_STATUS], 'readonly');
            const store = transaction.objectStore(STORES.SYNC_STATUS);
            const request = store.get(storeId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new Error('Failed to get sync status'));
        });
    }

    /**
     * Get sync status for all stores
     */
    async getAllSyncStatus(): Promise<SyncStatus[]> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.SYNC_STATUS], 'readonly');
            const store = transaction.objectStore(STORES.SYNC_STATUS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as SyncStatus[]);
            request.onerror = () => reject(new Error('Failed to get all sync status'));
        });
    }

    /**
     * Clear all pending operations for a store (use with caution)
     */
    async clearPendingOperations(storeId: string): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('Database not initialized');

        const operations = await this.getPendingOperations(storeId);

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_OPERATIONS);

            let completed = 0;
            operations.forEach((op) => {
                const request = store.delete(op.id);
                request.onsuccess = () => {
                    completed++;
                    if (completed === operations.length) resolve();
                };
                request.onerror = () => reject(new Error('Failed to clear operations'));
            });

            if (operations.length === 0) resolve();
        });
    }

    /**
     * Get count of pending operations by store
     */
    async getPendingCount(storeId: string): Promise<number> {
        const operations = await this.getPendingOperations(storeId);
        return operations.filter(op => op.status === 'pending').length;
    }

    /**
     * Get count of failed operations by store
     */
    async getFailedCount(storeId: string): Promise<number> {
        const operations = await this.getPendingOperations(storeId);
        return operations.filter(op => op.status === 'failed').length;
    }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
