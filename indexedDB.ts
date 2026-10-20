/**
 * CashFix IndexedDB Offline Storage & Synchronization Engine
 * Provides persistent local database storage for Orders, Inventory, and Background Sync Queue.
 * Works seamlessly 100% offline and flushes changes to the cloud when connectivity is restored.
 */

import { Order, CartItem, Product } from '../types/pos';

export interface InventoryRecord {
  id: string; // product id
  nameEn: string;
  nameAr: string;
  stockQuantity: number;
  lowStockThreshold: number;
  lastUpdated: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'INVENTORY_ADJUSTMENT';
  payload: any;
  timestamp: string;
  retryCount: number;
}

const DB_NAME = 'cashfix_pos_db';
const DB_VERSION = 1;

class CashFixIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public getDb(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Orders Store
          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('createdAt', 'createdAt', { unique: false });
            orderStore.createIndex('status', 'status', { unique: false });
            orderStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          }

          // 2. Inventory Store (Local Stock levels)
          if (!db.objectStoreNames.contains('inventory')) {
            db.createObjectStore('inventory', { keyPath: 'id' });
          }

          // 3. Sync Queue (Offline mutations to push to cloud)
          if (!db.objectStoreNames.contains('sync_queue')) {
            const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 4. Shifts Store
          if (!db.objectStoreNames.contains('shifts')) {
            db.createObjectStore('shifts', { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  // --- ORDERS OPERATIONS ---
  public async saveOrder(order: Order, isOnline = true): Promise<void> {
    const db = await this.getDb();
    const orderWithSync: Order = {
      ...order,
      syncStatus: isOnline ? 'synced' : 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['orders', 'sync_queue'], 'readwrite');
      const orderStore = tx.objectStore('orders');
      orderStore.put(orderWithSync);

      // If offline or pending sync, add to background sync queue
      if (!isOnline) {
        const syncStore = tx.objectStore('sync_queue');
        const queueItem: SyncQueueItem = {
          id: `sync_${order.id}_${Date.now()}`,
          type: 'CREATE_ORDER',
          payload: orderWithSync,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        };
        syncStore.put(queueItem);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllOrders(): Promise<Order[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readonly');
      const store = tx.objectStore('orders');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async markOrderSynced(orderId: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readwrite');
      const store = tx.objectStore('orders');
      const getReq = store.get(orderId);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, syncStatus: 'synced', syncedAt: new Date().toISOString() };
          store.put(updated);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- INVENTORY OPERATIONS ---
  public async initInventoryFromProducts(products: Product[]): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inventory', 'readwrite');
      const store = tx.objectStore('inventory');

      for (const p of products) {
        const getReq = store.get(p.id);
        getReq.onsuccess = () => {
          if (!getReq.result) {
            // Default stock for standard coffees/food items: 50 units
            const defaultStock = p.stockQuantity !== undefined ? p.stockQuantity : 45;
            store.put({
              id: p.id,
              nameEn: p.nameEn,
              nameAr: p.nameAr,
              stockQuantity: defaultStock,
              lowStockThreshold: 10,
              lastUpdated: new Date().toISOString(),
            } as InventoryRecord);
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllInventory(): Promise<Record<string, InventoryRecord>> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inventory', 'readonly');
      const store = tx.objectStore('inventory');
      const request = store.getAll();

      request.onsuccess = () => {
        const records: InventoryRecord[] = request.result || [];
        const map: Record<string, InventoryRecord> = {};
        records.forEach((r) => {
          map[r.id] = r;
        });
        resolve(map);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async deductInventoryForOrder(items: CartItem[]): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['inventory', 'sync_queue'], 'readwrite');
      const invStore = tx.objectStore('inventory');
      const syncStore = tx.objectStore('sync_queue');

      const adjustments: Array<{ productId: string; quantity: number }> = [];

      for (const item of items) {
        const prodId = item.product.id;
        const qty = item.quantity;
        adjustments.push({ productId: prodId, quantity: qty });

        const req = invStore.get(prodId);
        req.onsuccess = () => {
          if (req.result) {
            const current = req.result as InventoryRecord;
            const updatedStock = Math.max(0, current.stockQuantity - qty);
            invStore.put({
              ...current,
              stockQuantity: updatedStock,
              lastUpdated: new Date().toISOString(),
            });
          }
        };
      }

      // Add to sync queue for cloud inventory sync
      syncStore.put({
        id: `sync_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'INVENTORY_ADJUSTMENT',
        payload: adjustments,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      } as SyncQueueItem);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updateStockQuantity(productId: string, newStock: number): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['inventory', 'sync_queue'], 'readwrite');
      const store = tx.objectStore('inventory');
      const syncStore = tx.objectStore('sync_queue');
      const req = store.get(productId);

      req.onsuccess = () => {
        if (req.result) {
          const current = req.result as InventoryRecord;
          store.put({
            ...current,
            stockQuantity: newStock,
            lastUpdated: new Date().toISOString(),
          });
        }
      };

      syncStore.put({
        id: `sync_stock_${Date.now()}_${productId}`,
        type: 'INVENTORY_ADJUSTMENT',
        payload: [{ productId, quantity: newStock, isSetAbsolute: true }],
        timestamp: new Date().toISOString(),
        retryCount: 0,
      } as SyncQueueItem);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async restockInventoryForItems(items: CartItem[]): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['inventory', 'sync_queue'], 'readwrite');
      const invStore = tx.objectStore('inventory');
      const syncStore = tx.objectStore('sync_queue');

      const adjustments: Array<{ productId: string; quantity: number }> = [];

      for (const item of items) {
        const prodId = item.product.id;
        const qty = item.quantity;
        adjustments.push({ productId: prodId, quantity: -qty }); // negative adjustment indicates return/restock

        const req = invStore.get(prodId);
        req.onsuccess = () => {
          if (req.result) {
            const current = req.result as InventoryRecord;
            const updatedStock = current.stockQuantity + qty;
            invStore.put({
              ...current,
              stockQuantity: updatedStock,
              lastUpdated: new Date().toISOString(),
            });
          }
        };
      }

      syncStore.put({
        id: `sync_restock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'INVENTORY_ADJUSTMENT',
        payload: adjustments,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      } as SyncQueueItem);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- SYNC QUEUE OPERATIONS ---
  public async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getPendingSyncCount(): Promise<number> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const posDb = new CashFixIndexedDB();
