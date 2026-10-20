import React, { useMemo, useState } from 'react';
import {
  X,
  TrendingUp,
  Banknote,
  CreditCard,
  FileSpreadsheet,
  Bike,
  Tag,
  RotateCcw,
  Clock,
  Printer,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Receipt,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/translations';
import { DELIVERY_PLATFORMS } from '../data/initialData';
import { ZReportData } from '../types/pos';
import { DetailedSalesHistoryTab } from './DetailedSalesHistoryTab';

interface LiveSalesSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveSalesSummaryModal: React.FC<LiveSalesSummaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    language,
    orders,
    currentShift,
    settings,
    currentUser,
    kickCashDrawer,
    setPrintableZReport,
  } = usePos();

  const isRtl = language === 'ar';
  const [activeMainTab, setActiveMainTab] = useState<'summary' | 'history'>('summary');

  // Determine shift start filter timestamp
  const shiftStartTime = useMemo(() => {
    if (currentShift?.startTime) {
      return new Date(currentShift.startTime).getTime();
    }
    // Fallback: Beginning of today (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, [currentShift]);

  // Real-time calculation from start of shift/day until right now
  const metrics = useMemo(() => {
    // 1. Shift completed orders
    const shiftOrders = orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      return orderTime >= shiftStartTime && o.status === 'completed';
    });

    // 2. Shift refunds
    const shiftRefunds = orders.filter((o) => {
      const refundTime = o.refund?.refundedAt
        ? new Date(o.refund.refundedAt).getTime()
        : new Date(o.createdAt).getTime();
      return refundTime >= shiftStartTime && (o.status === 'refunded' || Boolean(o.refund));
    });

    // Sales by Payment Method
    let cashSales = 0;
    let madaSales = 0;
    let dueSales = 0;
    let onlineSales = 0;
    let grossSales = 0;
    let totalDiscounts = 0;

    // Delivery platform breakdown mapping
    const platformBreakdown: Record<string, { count: number; total: number; nameEn: string; nameAr: string }> = {};
    DELIVERY_PLATFORMS.forEach((p) => {
      platformBreakdown[p.id] = { count: 0, total: 0, nameEn: p.nameEn, nameAr: p.nameAr };
    });
    // Add fallback for unmapped/custom online orders
    platformBreakdown['other_online'] = {
      count: 0,
      total: 0,
      nameEn: 'Other Delivery Apps',
      nameAr: 'تطبيقات أخرى',
    };

    shiftOrders.forEach((o) => {
      grossSales += o.subtotal || o.total;
      totalDiscounts += o.discountAmount || 0;

      // Handle Split (Mixed) Payment methods vs Single Payment
      if (o.payment?.isSplit && Array.isArray(o.payment.splits) && o.payment.splits.length > 0) {
        o.payment.splits.forEach((split) => {
          if (split.method === 'cash') {
            cashSales += split.amount;
          } else if (split.method === 'mada' || split.method === 'visa') {
            madaSales += split.amount;
          } else if (split.method === 'due') {
            dueSales += split.amount;
          } else if (split.method === 'online') {
            onlineSales += split.amount;
            const pName = (split.deliveryPlatformName || o.deliveryPlatformName || '').toLowerCase().trim();
            let matched = false;
            for (const p of DELIVERY_PLATFORMS) {
              if (
                pName === p.id.toLowerCase() ||
                pName === p.nameEn.toLowerCase() ||
                pName === p.nameAr.toLowerCase()
              ) {
                platformBreakdown[p.id].count += 1;
                platformBreakdown[p.id].total += split.amount;
                matched = true;
                break;
              }
            }
            if (!matched) {
              platformBreakdown['other_online'].count += 1;
              platformBreakdown['other_online'].total += split.amount;
            }
          }
        });
      } else {
        const method = o.payment?.method;
        const isOnline = o.orderMode === 'online' || method === 'online';

        if (isOnline) {
          onlineSales += o.total;
          const platformName = (o.deliveryPlatformName || o.payment?.deliveryPlatformName || '').toLowerCase().trim();
          
          let matched = false;
          for (const p of DELIVERY_PLATFORMS) {
            if (
              platformName === p.id.toLowerCase() ||
              platformName === p.nameEn.toLowerCase() ||
              platformName === p.nameAr.toLowerCase()
            ) {
              platformBreakdown[p.id].count += 1;
              platformBreakdown[p.id].total += o.total;
              matched = true;
              break;
            }
          }
          if (!matched) {
            platformBreakdown['other_online'].count += 1;
            platformBreakdown['other_online'].total += o.total;
          }
        } else if (method === 'cash') {
          cashSales += o.total;
        } else if (method === 'mada') {
          madaSales += o.total;
        } else if (method === 'due') {
          dueSales += o.total;
        } else if (method === 'visa') {
          // Visa credit card categorized with mada/card
          madaSales += o.total;
        }
      }
    });

    // Total Refunds & Cash Refunds
    let totalRefundsAmount = 0;
    let cashRefundsAmount = 0;
    let nonCashRefundsAmount = 0;

    shiftRefunds.forEach((o) => {
      const amt = o.refund?.amount ?? o.total;
      totalRefundsAmount += amt;
      if (o.refund?.method === 'cash') {
        cashRefundsAmount += amt;
      } else {
        nonCashRefundsAmount += amt;
      }
    });

    // Net Sales
    const netSales = Math.max(0, grossSales - totalDiscounts - totalRefundsAmount);

    // Opening Float
    const openingFloat = currentShift?.openingFloat ?? 0;

    // Expected Cash in Drawer right now:
    // Opening Cash Float + Cash Sales - Cash Refunds/Payouts
    const expectedCashInDrawer = Math.max(0, openingFloat + cashSales - cashRefundsAmount);

    const completedOrderCount = shiftOrders.length;
    const avgOrderValue = completedOrderCount > 0 ? netSales / completedOrderCount : 0;

    return {
      completedOrderCount,
      refundCount: shiftRefunds.length,
      grossSales,
      totalDiscounts,
      totalRefundsAmount,
      cashRefundsAmount,
      nonCashRefundsAmount,
      netSales,
      cashSales,
      madaSales,
      dueSales,
      onlineSales,
      platformBreakdown,
      openingFloat,
      expectedCashInDrawer,
      avgOrderValue,
    };
  }, [orders, shiftStartTime, currentShift]);

  if (!isOpen) return null;

  // Print Interim X-Report
  const handlePrintXReport = () => {
    const reportData: ZReportData = {
      shiftId: currentShift?.id || `LIVE-${new Date().toISOString().slice(0, 10)}`,
      shopNameEn: settings.shopNameEn,
      shopNameAr: settings.shopNameAr,
      cashierName: currentUser?.nameEn || 'Current Cashier',
      startTime: currentShift?.startTime || new Date(shiftStartTime).toISOString(),
      endTime: new Date().toISOString(),
      openingFloat: metrics.openingFloat,
      cashSales: metrics.cashSales,
      madaSales: metrics.madaSales,
      visaSales: 0,
      onlineSales: metrics.onlineSales,
      dueSales: metrics.dueSales,
      totalGrossSales: metrics.grossSales,
      totalDiscounts: metrics.totalDiscounts,
      totalTax: (metrics.netSales * (settings.vatPercentage || 15)) / (100 + (settings.vatPercentage || 15)),
      totalRefunds: metrics.totalRefundsAmount,
      netRevenue: metrics.netSales,
      expectedCashInDrawer: metrics.expectedCashInDrawer,
      actualCashCounted: metrics.expectedCashInDrawer,
      variance: 0,
      orderCount: metrics.completedOrderCount,
      refundCount: metrics.refundCount,
      generatedAt: new Date().toISOString(),
    };

    setPrintableZReport(reportData);
  };

  const shiftDurationFormatted = () => {
    if (!currentShift?.startTime) return isRtl ? 'الوردية غير مفتوحة' : 'Today (00:00 - Now)';
    const diffMs = Date.now() - new Date(currentShift.startTime).getTime();
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return isRtl ? `${hrs} ساعة و ${mins} دقيقة` : `${hrs}h ${mins}m active`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl max-h-[94vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  {isRtl ? 'ملخص مبيعات الوردية واليوم المباشر' : "Live Shift / Today's Sales Summary"}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{isRtl ? 'مباشر وتلقائي' : 'Real-Time Live'}</span>
                </span>
              </div>
              <p className="text-xs text-blue-100 opacity-90 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{shiftDurationFormatted()}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{currentUser?.nameEn || 'Cashier'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isRtl ? settings.branchLocationAr : settings.branchLocationEn}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintXReport}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title={isRtl ? 'طباعة تقرير قراءة الوردية X-Report' : 'Print Interim X-Report Slip'}
            >
              <Printer className="w-4 h-4" />
              <span>{isRtl ? 'طباعة إيصال X-Report' : 'Print X-Slip'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Live Shift Summary vs Detailed Sales History / Per-Day Breakdown */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMainTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'summary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isRtl ? 'ملخص مبيعات الوردية' : 'Live Shift Summary'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isRtl ? 'سجل المبيعات والتفصيل اليومي' : 'Detailed Sales History / Per-Day Breakdown'}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        {activeMainTab === 'history' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
            <DetailedSalesHistoryTab onCloseParentModal={onClose} />
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* SECTION 1: TOP EXECUTIVE CARDS (Gross, Net, Expected Cash) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Gross Sales */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {isRtl ? 'إجمالي المبيعات الإجمالية (Gross)' : 'Total Gross Sales'}
              </span>
              <span className="font-mono text-2xl font-black text-slate-900 block">
                {formatCurrency(metrics.grossSales, language, settings.currencyEn, settings.currencyAr)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {metrics.completedOrderCount} {isRtl ? 'طلبات مكتملة' : 'completed orders'}
              </span>
            </div>

            {/* Total Net Sales */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                {isRtl ? 'صافي المبيعات (Net Revenue)' : 'Total Net Sales'}
              </span>
              <span className="font-mono text-2xl font-black text-blue-800 block">
                {formatCurrency(metrics.netSales, language, settings.currencyEn, settings.currencyAr)}
              </span>
              <span className="text-[10px] text-blue-600 mt-1 block">
                {isRtl
                  ? `بعد خصم الخصومات (${metrics.totalDiscounts.toFixed(2)}) والمرتجعات`
                  : `Net after discounts & refunds`}
              </span>
            </div>

            {/* Expected Cash in Drawer Right Now (Highlight) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                  {isRtl ? 'النقد المتوقع بالدرج الآن' : 'Expected Cash in Drawer Right Now'}
                </span>
                <span className="p-1 rounded-md bg-white/20">
                  <Banknote className="w-4 h-4 text-white" />
                </span>
              </div>
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight block">
                {formatCurrency(metrics.expectedCashInDrawer, language, settings.currencyEn, settings.currencyAr)}
              </span>
              <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-100">
                <span>
                  {isRtl
                    ? `عهد البداية (${metrics.openingFloat.toFixed(0)}) + الكاش (${metrics.cashSales.toFixed(0)})`
                    : `Float: ${metrics.openingFloat} + Cash Sales: ${metrics.cashSales}`}
                </span>
                <button
                  onClick={() => kickCashDrawer()}
                  className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Test Cash Drawer Pulse"
                >
                  <Unlock className="w-3 h-3" />
                  <span>{isRtl ? 'فتح الدرج' : 'Open Drawer'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: BREAKDOWN BY PAYMENT METHODS (Cash, Mada, Due, Online) */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>{isRtl ? 'تفصيل المبيعات حسب طريقة الدفع' : 'Sales Breakdown by Payment Method'}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Cash Sales */}
              <div className="p-3.5 bg-white border border-emerald-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="font-bold text-xs">{isRtl ? 'مبيعات الكاش' : 'Cash Sales'}</span>
                  <Banknote className="w-4 h-4" />
                </div>
                <span className="font-mono text-lg font-black text-slate-900 block">
                  {formatCurrency(metrics.cashSales, language, settings.currencyEn, settings.currencyAr)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isRtl ? 'مقبوضات الصندوق النقدي' : 'Cash drawer receipts'}
                </span>
              </div>

              {/* 2. Mada Card Sales */}
              <div className="p-3.5 bg-white border border-blue-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between text-blue-700 mb-1">
                  <span className="font-bold text-xs">{isRtl ? 'مبيعات مدى / بطاقة' : 'Mada Card Sales'}</span>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="font-mono text-lg font-black text-slate-900 block">
                  {formatCurrency(metrics.madaSales, language, settings.currencyEn, settings.currencyAr)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isRtl ? 'أجهزة نقاط البيع والشبكة' : 'POS network terminals'}
                </span>
              </div>

              {/* 3. Due / Credit Sales */}
              <div className="p-3.5 bg-white border border-amber-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between text-amber-700 mb-1">
                  <span className="font-bold text-xs">{isRtl ? 'مبيعات الذمم / الآجل' : 'Due / Credit Sales'}</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="font-mono text-lg font-black text-slate-900 block">
                  {formatCurrency(metrics.dueSales, language, settings.currencyEn, settings.currencyAr)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isRtl ? 'حسابات العملاء الآجلة' : 'Deferred receivables'}
                </span>
              </div>

              {/* 4. Total Online Orders */}
              <div className="p-3.5 bg-white border border-indigo-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between text-indigo-700 mb-1">
                  <span className="font-bold text-xs">{isRtl ? 'طلبات الأونلاين' : 'Total Online Orders'}</span>
                  <Bike className="w-4 h-4" />
                </div>
                <span className="font-mono text-lg font-black text-indigo-900 block">
                  {formatCurrency(metrics.onlineSales, language, settings.currencyEn, settings.currencyAr)}
                </span>
                <span className="text-[10px] text-indigo-500 font-bold block mt-0.5">
                  {isRtl ? 'مسددة عبر تطبيقات التوصيل' : 'Prepaid via delivery apps'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ONLINE ORDERS BREAKDOWN BY DELIVERY APPS */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-blue-600" />
                <h4 className="font-black text-xs text-slate-900">
                  {isRtl
                    ? 'تفصيل طلبات الأونلاين حسب منصات وشركات التوصيل'
                    : 'Online Orders Breakdown by Delivery Platform'}
                </h4>
              </div>
              <span className="font-mono font-bold text-xs text-blue-700">
                {isRtl ? 'الإجمالي:' : 'Total:'}{' '}
                {formatCurrency(metrics.onlineSales, language, settings.currencyEn, settings.currencyAr)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {DELIVERY_PLATFORMS.map((platform) => {
                const data = metrics.platformBreakdown[platform.id] || { count: 0, total: 0 };
                return (
                  <div
                    key={platform.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${platform.logoBg}`} />
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {isRtl ? platform.nameAr : platform.nameEn}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {data.count} {isRtl ? 'طلب' : 'orders'}
                      </span>
                    </div>
                    <span className="font-mono font-black text-sm text-slate-900 mt-2 block">
                      {data.total.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">SAR</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: DISCOUNTS & REFUNDS & DRAWER MATH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Discounts & Refunds Box */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-500" />
                <span>{isRtl ? 'الخصومات والمرتجعات الصادرة اليوم' : 'Discounts & Refunds Processed'}</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-semibold">
                    {isRtl ? 'إجمالي الخصومات الممنوحة:' : 'Total Discounts Given:'}
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    -{metrics.totalDiscounts.toFixed(2)} SAR
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                  <div>
                    <span className="text-rose-800 font-bold block">
                      {isRtl ? 'إجمالي المرتجعات:' : 'Total Refunds Processed:'}
                    </span>
                    <span className="text-[10px] text-rose-600">
                      {isRtl
                        ? `كاش: ${metrics.cashRefundsAmount.toFixed(2)} | بطاقة: ${metrics.nonCashRefundsAmount.toFixed(2)}`
                        : `Cash: ${metrics.cashRefundsAmount.toFixed(2)} | Card: ${metrics.nonCashRefundsAmount.toFixed(2)}`}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    -{metrics.totalRefundsAmount.toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </div>

            {/* Cash Drawer Reconciliation Equation Box */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'معادلة مطابقة صندوق الكاشير' : 'Cash Drawer Reconciliation Formula'}</span>
              </h4>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? '(+) عهدة الصباح الافتتاحية:' : '(+) Opening Cash Float:'}</span>
                  <span className="font-bold">{metrics.openingFloat.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{isRtl ? '(+) مبيعات الكاش المحصلة:' : '(+) Cash Sales Collected:'}</span>
                  <span>+{metrics.cashSales.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>{isRtl ? '(-) مرتجعات الكاش الصادرة:' : '(-) Cash Refunds Paid Out:'}</span>
                  <span>-{metrics.cashRefundsAmount.toFixed(2)} SAR</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>{isRtl ? '(=) النقد الواجب توفره بالدرج:' : '(=) Expected Cash in Drawer:'}</span>
                  <span className="text-emerald-700">{metrics.expectedCashInDrawer.toFixed(2)} SAR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Bottom Actions Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isRtl
                ? 'يتم تحديث التقرير فورياً مع كل طلب أو عملية دفع جديدة'
                : 'Updates instantly in real-time as orders settle'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintXReport}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isRtl ? 'طباعة قراءة الوردية X-Report' : 'Print Interim X-Slip'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
