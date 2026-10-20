import { Order, OrderPayment, CashierUser } from '../types/pos';
import { posDb } from '../utils/indexedDB';
import { syncEngine } from '../utils/syncEngine';

const STORAGE_PREFIX = 'tabsense_pos_';

export interface DailySalesSummary {
  date: string;
  totalOrders: number;
  completedOrders: number;
  refundedOrders: number;
  grossSales: number;
  totalDiscounts: number;
  totalTax: number;
  netSales: number;
  cashSales: number;
  madaSales: number;
  onlineSales: number;
  dueSales: number;
  avgOrderValue: number;
}

/**
 * Order Service
 * Handles instant order finalization, sales metrics computation,
 * and offline-safe persistence independent of hardware peripherals.
 */
export const OrderService = {
  /**
   * Generates a finalized completed order object with guaranteed IDs and numbers
   */
  finalizeCompletedOrder(
    orderToPay: Order,
    payment: OrderPayment,
    currentUser: CashierUser | null,
    language: 'en' | 'ar',
    existingOrders: Order[]
  ): Order {
    // 1. Resolve permanent unique ID
    const isTempId = !orderToPay.id || orderToPay.id.startsWith('CART-');
    const finalId = isTempId ? `ORD-${Date.now().toString().slice(-6)}` : orderToPay.id;

    // 2. Resolve daily sequential order number for today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = existingOrders.filter(
      (o) => new Date(o.createdAt).getTime() >= todayStart
    );
    const maxDaily = todayOrders.reduce((max, o) => Math.max(max, o.dailyOrderNumber || 0), 0);
    const finalDailyNumber =
      orderToPay.dailyOrderNumber && orderToPay.dailyOrderNumber > 0
        ? orderToPay.dailyOrderNumber
        : maxDaily + 1;

    return {
      ...orderToPay,
      id: finalId,
      dailyOrderNumber: finalDailyNumber,
      status: 'completed',
      payment,
      completedAt: now.toISOString(),
      cashierId: currentUser?.id || orderToPay.cashierId,
      cashierName: currentUser
        ? language === 'ar'
          ? currentUser.nameAr || currentUser.nameEn
          : currentUser.nameEn
        : orderToPay.cashierName || 'Cashier',
    };
  },

  /**
   * Persists completed order to IndexedDB and triggers background sync.
   * Completely independent of printing status.
   */
  async persistOrder(order: Order): Promise<void> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    try {
      await posDb.saveOrder(order, isOnline);
      if (isOnline) {
        // Fire-and-forget sync
        syncEngine.triggerSync().catch(() => {});
      }
    } catch (err) {
      console.warn('OrderService: Failed to persist order to IndexedDB:', err);
    }
  },

  /**
   * Filter orders by specific calendar date (YYYY-MM-DD)
   */
  filterOrdersByDate(orders: Order[], targetDateStr: string): Order[] {
    return orders.filter((order) => {
      const orderDate = order.completedAt || order.createdAt;
      if (!orderDate) return false;
      const orderDateStr = new Date(orderDate).toISOString().slice(0, 10);
      return orderDateStr === targetDateStr;
    });
  },

  /**
   * Calculate comprehensive per-day sales summary
   */
  calculateDailySummary(orders: Order[], dateStr: string): DailySalesSummary {
    const dayOrders = this.filterOrdersByDate(orders, dateStr);

    let grossSales = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    let cashSales = 0;
    let madaSales = 0;
    let onlineSales = 0;
    let dueSales = 0;
    let completedCount = 0;
    let refundedCount = 0;

    dayOrders.forEach((o) => {
      if (o.status === 'completed') {
        completedCount++;
        grossSales += o.subtotal || o.total;
        totalDiscounts += o.discountAmount || 0;
        totalTax += o.taxAmount || 0;

        // Handle Split (Mixed) Payments vs Single Payment
        if (o.payment?.isSplit && Array.isArray(o.payment.splits) && o.payment.splits.length > 0) {
          o.payment.splits.forEach((split) => {
            const splitMethod = split.method;
            if (splitMethod === 'cash') {
              cashSales += split.amount;
            } else if (splitMethod === 'mada' || splitMethod === 'visa') {
              madaSales += split.amount;
            } else if (splitMethod === 'due') {
              dueSales += split.amount;
            } else if (splitMethod === 'online') {
              onlineSales += split.amount;
            }
          });
        } else {
          const method = o.payment?.method;
          const isOnline = o.orderMode === 'online' || method === 'online';

          if (isOnline) {
            onlineSales += o.total;
          } else if (method === 'cash') {
            cashSales += o.total;
          } else if (method === 'mada' || method === 'visa') {
            madaSales += o.total;
          } else if (method === 'due') {
            dueSales += o.total;
          }
        }
      } else if (o.status === 'refunded' || o.refund) {
        refundedCount++;
      }
    });

    const netSales = Math.max(0, grossSales - totalDiscounts);
    const avgOrderValue = completedCount > 0 ? netSales / completedCount : 0;

    return {
      date: dateStr,
      totalOrders: dayOrders.length,
      completedOrders: completedCount,
      refundedOrders: refundedCount,
      grossSales,
      totalDiscounts,
      totalTax,
      netSales,
      cashSales,
      madaSales,
      onlineSales,
      dueSales,
      avgOrderValue,
    };
  },
};
