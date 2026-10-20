import { Order, PrinterConfig } from '../types/pos';
import { EscPosDriver } from '../utils/escpos';

/**
 * Printer Service
 * Decouples all thermal printing and cash drawer hardware actions from sales recording.
 * All hardware actions run asynchronously in the background and NEVER block order completion.
 */
export const PrinterService = {
  /**
   * Kicks cash drawer in the background without awaiting or blocking the POS
   */
  kickDrawerInBackground(printerConfig: PrinterConfig): void {
    // Non-blocking background execution
    setTimeout(async () => {
      try {
        await EscPosDriver.kickCashDrawer(printerConfig);
      } catch (err) {
        console.warn('PrinterService: Drawer kick failed (non-blocking):', err);
      }
    }, 10);
  },

  /**
   * Attempts background raw ESC/POS thermal printing over network TCP port 9100.
   * If offline or unavailable, fails gracefully without affecting sales or transaction data.
   */
  async printReceiptRaw(
    order: Order,
    printerConfig: PrinterConfig,
    memoType: 'customer' | 'kitchen' | 'both' = 'both'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // In web environment, if network raw TCP bridge exists, call /api/printers/print
      const response = await fetch('/api/printers/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerIp: printerConfig.ip,
          printerPort: printerConfig.port || 9100,
          orderId: order.id,
          memoType,
        }),
      });

      if (response.ok) {
        return { success: true, message: 'Printed successfully via Raw TCP' };
      }
      return { success: false, message: `Printer status: ${response.status}` };
    } catch (e: any) {
      console.warn('PrinterService: Background print skipped (client-side or offline):', e);
      return { success: false, message: e?.message || 'Print network unavailable' };
    }
  },
};
