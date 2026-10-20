/**
 * CashFix Background Cloud Synchronization Engine
 * Automatically monitors network connectivity and flushes offline IndexedDB orders and inventory changes to the cloud.
 */

import { posDb, SyncQueueItem } from './indexedDB';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

class BackgroundSyncEngine {
  private isSyncing = false;
  private syncTimer: number | null = null;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.setupListeners();
    this.startPeriodicSync();
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('🌐 Connection restored. Starting automatic cloud sync from IndexedDB...');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });
  }

  private startPeriodicSync(): void {
    if (typeof window === 'undefined') return;

    // Check and attempt sync every 25 seconds when online
    this.syncTimer = window.setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.triggerSync();
      }
    }, 25000);
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    // Emit initial state
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    try {
      const pendingCount = await posDb.getPendingSyncCount();
      const status: SyncStatus = {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isSyncing: this.isSyncing,
        pendingCount,
        lastSyncTime: this.lastSyncTime,
        lastError: this.lastError,
      };

      this.listeners.forEach((l) => l(status));
    } catch {
      // IndexedDB not ready or error
    }
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, error: 'Sync already in progress' };
    if (!navigator.onLine) {
      this.notifyListeners();
      return { success: false, syncedCount: 0, error: 'Device is offline' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notifyListeners();

    let syncedCount = 0;

    try {
      const queue = await posDb.getPendingSyncQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        this.lastSyncTime = new Date().toISOString();
        this.notifyListeners();
        return { success: true, syncedCount: 0 };
      }

      // Group orders and inventory updates
      const pendingOrders: any[] = [];
      const pendingInventory: any[] = [];
      const queueIdsToRemove: string[] = [];
      const orderIdsToMarkSynced: string[] = [];

      for (const item of queue) {
        if (item.type === 'CREATE_ORDER') {
          pendingOrders.push(item.payload);
          queueIdsToRemove.push(item.id);
          orderIdsToMarkSynced.push(item.payload.id);
        } else if (item.type === 'INVENTORY_ADJUSTMENT') {
          pendingInventory.push(item.payload);
          queueIdsToRemove.push(item.id);
        }
      }

      // Post to /api/sync endpoint on backend
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: pendingOrders,
          inventoryUpdates: pendingInventory,
          syncedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Remove from queue in IndexedDB
        for (const id of queueIdsToRemove) {
          await posDb.removeSyncQueueItem(id);
        }

        // Mark orders as synced in IndexedDB
        for (const ordId of orderIdsToMarkSynced) {
          await posDb.markOrderSynced(ordId);
        }

        syncedCount = queueIdsToRemove.length;
        this.lastSyncTime = new Date().toISOString();
        console.log(`✓ Cloud Sync successful: Flushed ${syncedCount} changes from IndexedDB to server.`);
      } else {
        throw new Error(`Sync server responded with ${response.status}`);
      }
    } catch (err: any) {
      console.warn('Cloud sync error (will retry automatically):', err);
      this.lastError = err?.message || 'Sync failed';
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { success: !this.lastError, syncedCount, error: this.lastError || undefined };
  }
}

export const syncEngine = new BackgroundSyncEngine();
