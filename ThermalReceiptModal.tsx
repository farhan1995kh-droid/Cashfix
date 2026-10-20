import React, { useEffect, useRef, useState } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Receipt,
  FileText,
  UtensilsCrossed,
  Layers,
  Copy,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';

export const ThermalReceiptModal: React.FC = () => {
  const {
    language,
    printableReceiptOrder,
    setPrintableReceiptOrder,
    printableZReport,
    setPrintableZReport,
    settings,
    printerConfig,
    receiptMode,
    setReceiptMode,
  } = usePos();

  const isRtl = language === 'ar';
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeOrder = printableReceiptOrder;
  const activeZReport = printableZReport;
  const isOpen = Boolean(activeOrder || activeZReport);

  // Active view tab inside modal: 'both' | 'kitchen' | 'customer'
  const [activeTab, setActiveTab] = useState<'both' | 'kitchen' | 'customer'>('both');

  useEffect(() => {
    if (receiptMode) {
      setActiveTab(receiptMode);
    }
  }, [receiptMode]);

  // Generate QR code for customer receipt
  useEffect(() => {
    if (activeOrder && qrCanvasRef.current) {
      const qrPayload = JSON.stringify({
        seller: settings.shopNameEn,
        vat_no: settings.taxNumber,
        timestamp: activeOrder.createdAt,
        total: activeOrder.total.toFixed(2),
        vat: activeOrder.taxAmount.toFixed(2),
        order_id: activeOrder.id,
      });

      QRCode.toCanvas(qrCanvasRef.current, qrPayload, {
        width: 120,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [activeOrder, settings]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setPrintableReceiptOrder(null);
    setPrintableZReport(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-slate-800">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                {activeZReport
                  ? (language === 'ar' ? 'تقرير الإغلاق اليومي (Z-Report)' : '80mm Thermal Z-Report')
                  : (language === 'ar' ? 'معاينة وطباعة الفاتورة والطلبات' : '80mm Thermal Memo & Receipt')}
              </h3>
              {activeOrder && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Order #{activeOrder.dailyOrderNumber} • {activeOrder.sourceNameEn}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ar' ? 'طباعة الآن' : 'Print Slip'}</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs (For Regular Orders & Held Orders) */}
        {activeOrder && !activeZReport && (
          <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('both')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'both'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'كلا النسختين (مطبخ + عميل)' : 'Both Memos (2 Copies)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('kitchen')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'kitchen'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ar' ? 'نسخة المطعم / المطبخ' : '1. Restaurant Copy'}</span>
              </button>

              <button
                onClick={() => setActiveTab('customer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'customer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'ar' ? 'فاتورة تفاصيل العميل' : '2. Customer Memo'}</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              80mm ESC/POS
            </span>
          </div>
        )}

        {/* 80mm Thermal Receipt Body (Printed Area) */}
        <div
          id="thermal-receipt-printable"
          className="p-4 overflow-y-auto bg-slate-200/80 flex flex-col md:flex-row items-center md:items-start justify-center gap-4"
        >
          {/* 1. RESTAURANT / KITCHEN COPY MEMO */}
          {activeOrder && (activeTab === 'both' || activeTab === 'kitchen') && (
            <div
              id="kitchen-receipt-printable"
              className={`w-[320px] max-w-full bg-white text-black p-4 sm:p-5 rounded-xl shadow-lg font-mono text-[11px] leading-tight select-text border border-slate-300 thermal-memo-slip ${
                activeTab === 'both' ? 'slip-break' : ''
              }`}
            >
              <div className="space-y-3">
                {/* Kitchen Header */}
                <div className="text-center pb-2 border-b-2 border-black space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest bg-black text-white px-2 py-0.5 rounded">
                    RESTAURANT / KITCHEN COPY
                  </span>
                  <div className="text-xs font-black uppercase mt-1">نسخة تجهيز المطبخ والمشروبات</div>
                  <h2 className="font-extrabold text-sm uppercase">{settings.shopNameEn}</h2>
                  <div className="text-[10px] text-gray-700 font-bold">
                    {settings.branchLocationEn || 'Main Branch'}
                  </div>
                </div>

                {/* Big Order Number & Source */}
                <div className="bg-gray-100 p-2 rounded-lg text-center border border-gray-300 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-600 block">Daily Order #</span>
                  <span className="text-3xl font-black text-black block tracking-tight">
                    #{activeOrder.dailyOrderNumber}
                  </span>
                  <span className="text-xs font-extrabold text-blue-800 uppercase block">
                    {activeOrder.sourceNameEn} ({activeOrder.sourceNameAr})
                  </span>
                </div>

                {/* Order Metadata (No pricing) */}
                <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-400 pb-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Time / الوقت:</span>
                    <span>{new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date / التاريخ:</span>
                    <span>{new Date(activeOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier / الكاشير:</span>
                    <span className="font-bold">{activeOrder.cashierName || 'Cashier'}</span>
                  </div>
                  {activeOrder.customerName && (
                    <div className="flex justify-between font-bold">
                      <span>Customer / العميل:</span>
                      <span>{activeOrder.customerName}</span>
                    </div>
                  )}
                  {activeOrder.tableOrPlate && (
                    <div className="flex justify-between font-black text-xs text-black">
                      <span>Table / Plate (طاولة/سيارة):</span>
                      <span className="bg-yellow-200 px-1 rounded">{activeOrder.tableOrPlate}</span>
                    </div>
                  )}
                </div>

                {/* Items Preparation List (Clean: Item, Quantity, Custom Notes) */}
                <div className="space-y-2 py-1">
                  <div className="flex justify-between font-black border-b border-black pb-1 text-xs">
                    <span>QTY & ITEM / الصنف والكمية</span>
                  </div>
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="pb-2 border-b border-dashed border-gray-300 space-y-0.5">
                      <div className="flex items-start gap-2 text-xs font-black">
                        <span className="bg-black text-white px-1.5 py-0.2 rounded text-[11px] shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="leading-tight">
                          <span>{item.product.nameEn}</span>
                          <span className="block text-[10px] text-gray-700 font-bold">{item.product.nameAr}</span>
                        </div>
                      </div>
                      {item.itemNotes && (
                        <div className="mt-1 p-1 bg-yellow-100 rounded border border-yellow-300 text-[10px] font-bold text-amber-900">
                          ⚡ ملاحظة: {item.itemNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Kitchen Footer */}
                <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[10px] text-gray-500 font-bold">
                  <div>*** نرجو سرعة التجهيز والجودة ***</div>
                  <div>--- Kitchen Ticket End ---</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CUSTOMER TAX INVOICE DETAILS MEMO */}
          {activeOrder && (activeTab === 'both' || activeTab === 'customer') && (
            <div
              id="customer-receipt-printable"
              className="w-[320px] max-w-full bg-white text-black p-4 sm:p-5 rounded-xl shadow-lg font-mono text-[11px] leading-tight select-text border border-slate-300 thermal-memo-slip"
            >
              <div className="space-y-3">
                {/* Shop Branding */}
                <div className="text-center space-y-1">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt={settings.shopNameEn}
                      className="w-12 h-12 mx-auto rounded-full object-cover filter grayscale contrast-125 mb-1"
                    />
                  )}
                  <h2 className="font-black text-sm uppercase">{settings.shopNameEn}</h2>
                  <h3 className="font-bold text-xs">{settings.shopNameAr}</h3>
                  <p className="text-[10px] text-gray-700">{settings.branchLocationEn}</p>
                  <p className="text-[10px] text-gray-700">{settings.branchLocationAr}</p>
                  {settings.taxNumber && (
                    <p className="text-[10px] font-bold">الرقم الضريبي: {settings.taxNumber}</p>
                  )}
                </div>

                <div className="border-t border-b border-dashed border-gray-400 py-1 text-center font-bold text-[10px]">
                  SIMPLIFIED TAX INVOICE / فاتورة ضريبية مبسطة
                </div>

                {/* Metadata */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between font-bold">
                    <span>Order / الطلب: #{activeOrder.dailyOrderNumber}</span>
                    <span>{new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Date / التاريخ: {new Date(activeOrder.createdAt).toLocaleDateString()}</span>
                    <span>{activeOrder.sourceNameEn}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cashier / الكاشير:</span>
                    <span>{activeOrder.cashierName || 'Cashier'}</span>
                  </div>
                  {activeOrder.customerName && (
                    <div className="flex justify-between font-semibold">
                      <span>Customer: {activeOrder.customerName}</span>
                      <span>{activeOrder.customerPhone || ''}</span>
                    </div>
                  )}
                </div>

                {/* Items Table with Prices */}
                <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold border-b border-gray-300 pb-1">
                    <span>Item / الصنف</span>
                    <span>Total (SAR)</span>
                  </div>
                  {activeOrder.items.map((item, idx) => {
                    const itemPrice = item.customPrice ?? item.product.price;
                    const lineTotal = itemPrice * item.quantity;
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-semibold">
                          <span>
                            {item.quantity}x {item.product.nameEn}
                          </span>
                          <span>{lineTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 pl-2">
                          <span>{item.product.nameAr}</span>
                          <span>@ {itemPrice.toFixed(2)}</span>
                        </div>
                        {item.itemNotes && (
                          <div className="text-[9px] italic text-gray-600 pl-2">
                            *{item.itemNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals & Tax Inclusive Breakdown */}
                <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal (VAT Inclusive):</span>
                    <span>{activeOrder.total.toFixed(2)} SAR</span>
                  </div>
                  {activeOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Discount ({activeOrder.discountValue}{activeOrder.discountType === 'percentage' ? '%' : ' SAR'}):</span>
                      <span>-{activeOrder.discountAmount.toFixed(2)} SAR</span>
                    </div>
                  )}
                  {/* Tax is already included in prices */}
                  <div className="flex justify-between text-gray-600 text-[9px]">
                    <span>VAT ({activeOrder.taxRate || 15}% Included / مشمولة):</span>
                    <span>{activeOrder.taxAmount.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[9px]">
                    <span>Amount Excl. VAT (قبل الضريبة):</span>
                    <span>{(activeOrder.total - activeOrder.taxAmount).toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-gray-400">
                    <span>TOTAL / الإجمالي المدفوع:</span>
                    <span>{activeOrder.total.toFixed(2)} SAR</span>
                  </div>
                </div>

                {/* Settlement Method */}
                {activeOrder.payment && (
                  <div className="border-t border-dashed border-gray-400 pt-2 text-[10px] space-y-0.5">
                    {activeOrder.payment.isSplit && activeOrder.payment.splits && activeOrder.payment.splits.length > 0 ? (
                      <>
                        <div className="flex justify-between font-black text-black">
                          <span>PAYMENT: SPLIT (دفع متعدد مجزأ)</span>
                          <span className="font-mono">{activeOrder.total.toFixed(2)} SAR</span>
                        </div>
                        <div className="pl-1 space-y-0.5 pt-0.5 border-t border-dotted border-gray-300">
                          {activeOrder.payment.splits.map((s, idx) => (
                            <div key={idx} className="space-y-0.2">
                              <div className="flex justify-between font-bold">
                                <span>
                                  • Paid {s.method === 'cash' ? 'Cash / نقداً' : s.method === 'mada' ? 'Mada / مدى' : s.method === 'due' ? 'Due / آجل' : 'Online'}:
                                </span>
                                <span>{s.amount.toFixed(2)} SAR</span>
                              </div>
                              {s.method === 'cash' && s.cashTendered && s.cashTendered > s.amount && (
                                <div className="flex justify-between text-[9px] text-gray-600 pl-2">
                                  <span>Tendered: {s.cashTendered.toFixed(2)} SAR</span>
                                  <span>Change / الباقي: {(s.changeDue || 0).toFixed(2)} SAR</span>
                                </div>
                              )}
                              {s.method === 'due' && s.dueCustomer?.name && (
                                <div className="text-[9px] text-gray-600 pl-2">
                                  Debtor: {s.dueCustomer.name} ({s.dueCustomer.phone})
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {activeOrder.payment.changeDue > 0 && (
                          <div className="flex justify-between font-bold text-gray-700 pt-0.5 border-t border-dotted border-gray-300">
                            <span>Total Cash Change / إجمالي الفكة:</span>
                            <span>{activeOrder.payment.changeDue.toFixed(2)} SAR</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between font-bold">
                          <span>Payment Method / طريقة الدفع:</span>
                          <span className="uppercase">{activeOrder.payment.method}</span>
                        </div>
                        {activeOrder.payment.method === 'cash' && (
                          <>
                            <div className="flex justify-between text-gray-600">
                              <span>Tendered / المدفوع نقداً:</span>
                              <span>{activeOrder.payment.tenderAmount?.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Change / الباقي:</span>
                              <span>{activeOrder.payment.changeDue?.toFixed(2)} SAR</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ZATCA QR Code */}
                <div className="py-2 flex flex-col items-center justify-center">
                  <canvas ref={qrCanvasRef} className="mx-auto" />
                  <span className="text-[8px] text-gray-500 font-mono mt-0.5">
                    فاتورة ضريبية إلكترونية معتمدة
                  </span>
                </div>

                {/* Receipt Footer */}
                <div className="text-center pt-1 border-t border-dashed border-gray-400 text-[9px] text-gray-600">
                  <p>{settings.receiptFooterEn}</p>
                  <p>{settings.receiptFooterAr}</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Z-REPORT VIEW */}
          {activeZReport && (
            <div
              id="zreport-receipt-printable"
              className="w-[340px] max-w-full bg-white text-black p-4 sm:p-5 rounded-xl shadow-lg font-mono text-[11px] leading-tight select-text border border-slate-300 thermal-memo-slip"
            >
              <div className="space-y-3">
                <div className="text-center pb-2 border-b-2 border-black space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest bg-black text-white px-2 py-0.5 rounded">
                    OFFICIAL Z-REPORT
                  </span>
                  <div className="text-xs font-black uppercase mt-1">تقرير الإغلاق المالي لوردية الكاشير</div>
                  <h2 className="font-extrabold text-sm uppercase">{activeZReport.shopNameEn}</h2>
                  <div className="text-[10px] text-gray-700">{settings.branchLocationEn}</div>
                </div>

                <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-400 pb-2">
                  <div className="flex justify-between">
                    <span>Shift ID:</span>
                    <span className="font-bold">{activeZReport.shiftId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-bold">{activeZReport.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start:</span>
                    <span>{new Date(activeZReport.startTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Close:</span>
                    <span>{new Date(activeZReport.endTime).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold">
                    <span>Opening Float (عهدة البداية):</span>
                    <span>{activeZReport.openingFloat.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Sales (نقداً):</span>
                    <span>{activeZReport.cashSales.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mada Sales (مدى):</span>
                    <span>{activeZReport.madaSales.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visa/Card Sales:</span>
                    <span>{activeZReport.visaSales.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Online/Apps Sales:</span>
                    <span>{activeZReport.onlineSales.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold border-t border-gray-300 pt-1">
                    <span>Total Refunds (المرتجعات):</span>
                    <span>-{activeZReport.totalRefunds.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between font-black text-xs border-t border-black pt-1">
                    <span>Net Sales (صافي المبيعات):</span>
                    <span>{activeZReport.netRevenue.toFixed(2)} SAR</span>
                  </div>
                </div>

                {/* Cash Drawer Reconciliation */}
                <div className="p-2 bg-gray-100 rounded border border-gray-300 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Expected Cash:</span>
                    <span>{activeZReport.expectedCashInDrawer.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Counted Cash:</span>
                    <span>{activeZReport.actualCashCounted.toFixed(2)} SAR</span>
                  </div>
                  <div className={`flex justify-between font-black ${
                    activeZReport.variance === 0 ? 'text-emerald-700' : activeZReport.variance > 0 ? 'text-blue-700' : 'text-rose-700'
                  }`}>
                    <span>Variance (الفارق):</span>
                    <span>{activeZReport.variance.toFixed(2)} SAR</span>
                  </div>
                </div>

                <div className="text-center pt-2 text-[9px] text-gray-500">
                  Generated at {new Date(activeZReport.generatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
