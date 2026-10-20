import { Order } from '../types/pos';
import { posDb } from '../utils/indexedDB';

/**
 * DB Service
 * High-level database abstraction for CashFix POS.
 * Encapsulates IndexedDB and storage operations for scalability.
 */
export const DbService = {
  async saveOrder(order: Order, isOnline = true): Promise<void> {
    return posDb.saveOrder(order, isOnline);
  },

  async getAllOrders(): Promise<Order[]> {
    return posDb.getAllOrders();
  },

  async markOrderSynced(orderId: string): Promise<void> {
    return posDb.markOrderSynced(orderId);
  },

  async getPendingSyncCount(): Promise<number> {
    return posDb.getPendingSyncCount();
  },
};
