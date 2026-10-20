import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  Globe,
  Clock,
  Printer,
  FileText,
  User,
  Phone,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Filter,
  Check,
  ChevronRight,
  Receipt,
  X,
  Layers,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Order, RefundPaymentMethod } from '../types/pos';

interface SalesAndRefundsViewProps {
  initialTab?: 'sales' | 'refunds';
}

export const SalesAndRefundsView: React.FC<SalesAndRefundsViewProps> = ({
  initialTab = 'sales',
}) => {
  const {
    language,
    orders,
    processRefund,
    settings,
    currentUser,
    cashiers,
    setPrintableReceiptOrder,
  } = usePos();

  const isRtl = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'refunds'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Selected Order for Refunding
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<RefundPaymentMethod>('mada');
  const [refundReason, setRefundReason] = useState<string>('Customer Request / طلب العميل');
  const [refundNote, setRefundNote] = useState<string>('');

  // Supervisor PIN override state (if cashier has limited permissions)
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [supervisorOverrideActive, setSupervisorOverrideActive] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Separate List of Sales (Completed orders)
  const completedSalesOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completed');
  }, [orders]);

  // 2. Separate List of Refunds (Refunded orders)
  const refundedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'refunded' || !!o.refund);
  }, [orders]);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return completedSalesOrders.filter((o) => {
      const matchQuery =
        !q ||
        o.dailyOrderNumber.toString().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.tableOrPlate?.toLowerCase().includes(q);

      const isSplit = o.payment?.isSplit;
      const matchMethod =
        methodFilter === 'all' ||
        (methodFilter === 'split' && (isSplit || o.payment?.method === 'split')) ||
        (methodFilter === 'cash' && (o.payment?.method === 'cash' || o.payment?.splits?.some((s) => s.method === 'cash'))) ||
        (methodFilter === 'mada' && (o.payment?.method === 'mada' || o.payment?.splits?.some((s) => s.method === 'mada'))) ||
        (methodFilter === 'online' && (o.payment?.method === 'online' || o.payment?.splits?.some((s) => s.method === 'online'))) ||
        o.payment?.method === methodFilter;

      return matchQuery && matchMethod;
    });
  }, [completedSalesOrders, searchQuery, methodFilter]);

  // Filtered Refunds
  const filteredRefunds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return refundedOrders.filter((o) => {
      const matchQuery =
        !q ||
        o.dailyOrderNumber.toString().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.refund?.cashierName.toLowerCase().includes(q);

      const matchMethod =
        methodFilter === 'all' || o.refund?.method === methodFilter;

      return matchQuery && matchMethod;
    });
  }, [refundedOrders, searchQuery, methodFilter]);

  // Open refund dialog for an order
  const handleOpenRefundDialog = (order: Order) => {
    setRefundingOrder(order);
    setRefundType('full');
    setRefundAmount(order.total.toFixed(2));

    // Default refund method based on original payment method
    if (order.payment?.method === 'cash') {
      setRefundMethod('cash');
    } else if (order.payment?.method === 'online') {
      setRefundMethod('online');
    } else if (order.payment?.method === 'mada') {
      setRefundMethod('mada');
    } else {
      setRefundMethod('visa');
    }

    setRefundNote('');
    setSupervisorPin('');
    setSupervisorOverrideActive(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Perform refund execution
  const handleConfirmRefund = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!refundingOrder) return;

    // Check permissions
    const canRefund =
      currentUser?.permissions?.canProcessRefunds ||
      currentUser?.role === 'admin' ||
      supervisorOverrideActive;

    if (!canRefund) {
      // Validate supervisor PIN
      const adminCashier = cashiers.find((c) => c.role === 'admin' && c.isActive);
      const isPinCorrect =
        supervisorPin === (adminCashier?.pin || '1234') || supervisorPin === '9999';

      if (!isPinCorrect) {
        setErrorMsg(
          language === 'ar'
            ? 'هذا الكاشير مسموح له فقط بأخذ الطلبات! يرجى إدخال رمز المشرف (PIN) الصحيح للموافقة على الاسترجاع.'
            : 'Permission Denied: Cashier is only authorized to take orders. Please enter valid Manager PIN.'
        );
        return;
      }
    }

    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال مبلغ استرجاع صحيح'
          : 'Please enter a valid refund amount'
      );
      return;
    }

    if (amountNum > refundingOrder.total) {
      setErrorMsg(
        language === 'ar'
          ? 'مبلغ الاسترجاع لا يمكن أن يتجاوز إجمالي الفاتورة'
          : 'Refund amount cannot exceed order total'
      );
      return;
    }

    const success = processRefund(refundingOrder.id, {
      amount: amountNum,
      type: refundType,
      reason: refundReason.trim(),
      method: refundMethod, // 'cash' | 'mada' | 'online' | 'visa' | 'card'
      refundMethodNote: refundNote.trim() || undefined,
    });

    if (success) {
      setSuccessMsg(
        language === 'ar'
          ? `تم استرجاع الطلب #${refundingOrder.dailyOrderNumber} بنجاح عبر (${getRefundMethodLabel(refundMethod, language)})`
          : `Order #${refundingOrder.dailyOrderNumber} refunded successfully via (${getRefundMethodLabel(refundMethod, language)})`
      );
      setRefundingOrder(null);
      // Automatically switch to refunds list so cashier can see it!
      setActiveSubTab('refunds');
    }
  };

  const getRefundMethodLabel = (method: string, lang: 'en' | 'ar') => {
    switch (method) {
      case 'cash':
        return lang === 'ar' ? 'نقداً (الصندوق)' : 'Cash (Register Drawer)';
      case 'mada':
        return lang === 'ar' ? 'شبكة مدى (بطاقة)' : 'Mada Debit Card';
      case 'online':
        return lang === 'ar' ? 'طلب أونلاين / بوابة دفع' : 'Online Order / QR Gateway';
      case 'visa':
      case 'card':
        return lang === 'ar' ? 'بطاقة ائتمانية (فيزا)' : 'Credit Card (Visa/Master)';
      default:
        return method;
    }
  };

  // Metrics
  const totalSalesRevenue = completedSalesOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRefundsAmount = refundedOrders.reduce(
    (sum, o) => sum + (o.refund?.amount || o.total),
    0
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Top Banner & Tab Toggles */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              {activeSubTab === 'sales'
                ? getTranslation('salesList', language)
                : getTranslation('refundsList', language)}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeSubTab === 'sales'
              ? getTranslation('salesListSubtitle', language)
              : getTranslation('refundsListSubtitle', language)}
          </p>
        </div>

        {/* Dedicated Separate Toggle Tabs: Sales vs Refunds */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setActiveSubTab('sales');
              setMethodFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'sales'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{getTranslation('salesList', language)}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeSubTab === 'sales' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {completedSalesOrders.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('refunds');
              setMethodFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'refunds'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{getTranslation('refundsList', language)}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeSubTab === 'refunds' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 font-bold'
              }`}
            >
              {refundedOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">
              {language === 'ar' ? 'إجمالي المبيعات المكتملة:' : 'Total Completed Sales:'}
            </span>
            <span className="font-mono font-black text-blue-700 text-sm">
              {formatCurrency(totalSalesRevenue, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </div>

          <div className="w-px h-4 bg-slate-300 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">
              {language === 'ar' ? 'إجمالي المرتجعات:' : 'Total Refunds Issued:'}
            </span>
            <span className="font-mono font-black text-rose-600 text-sm">
              {formatCurrency(totalRefundsAmount, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </div>
        </div>

        {/* Search & Method Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">{language === 'ar' ? 'جميع طرق الدفع' : 'All Methods'}</option>
            <option value="split">{language === 'ar' ? '🔀 دفع مجزأ (متعدد)' : '🔀 Split Payment'}</option>
            <option value="cash">{language === 'ar' ? '💵 نقدي' : '💵 Cash'}</option>
            <option value="mada">{language === 'ar' ? '💳 مدى' : '💳 Mada'}</option>
            <option value="online">{language === 'ar' ? '🌐 أونلاين' : '🌐 Online QR'}</option>
            <option value="visa">{language === 'ar' ? '💳 فيزا' : '💳 Visa'}</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslation('searchOrderByNumber', language)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN LIST VIEW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* TAB 1: SALES LIST */}
        {activeSubTab === 'sales' && (
          <>
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-sm text-slate-700">
                  {language === 'ar' ? 'لا توجد فواتير مبيعات مطابقة' : 'No sales orders found'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'الفواتير المكتملة ستظهر هنا فور إتمام البيع من شاشة الكاشير'
                    : 'Completed orders appear here once checked out from POS'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSales.map((order) => {
                  const paymentMethod = order.payment?.method || 'cash';
                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header: Order #, Status, Time */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-200">
                              #{order.dailyOrderNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {order.orderType === 'dine_in'
                                ? language === 'ar' ? 'محلي' : 'Dine-In'
                                : order.orderType === 'takeaway'
                                ? language === 'ar' ? 'سفري' : 'Takeaway'
                                : language === 'ar' ? 'استلام سيارة' : 'Car Pickup'}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Customer & Cashier */}
                        <div className="py-2.5 space-y-1 text-xs">
                          {order.customerName && (
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="flex items-center gap-1 font-bold text-slate-800">
                                <User className="w-3.5 h-3.5 text-blue-500" />
                                <span>{order.customerName}</span>
                              </span>
                              {order.customerPhone && (
                                <span className="font-mono text-[11px] text-slate-500">
                                  {order.customerPhone}
                                </span>
                              )}
                            </div>
                          )}

                          {order.tableOrPlate && (
                            <div className="text-[11px] text-blue-600 font-bold">
                              📍 {order.tableOrPlate}
                            </div>
                          )}

                          {/* Items summary */}
                          <div className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-50">
                            {order.items
                              .map(
                                (i) =>
                                  `${i.quantity}x ${
                                    language === 'ar' ? i.product.nameAr : i.product.nameEn
                                  }`
                              )
                              .join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Payment method, Amount, Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          {/* Payment badge */}
                          {order.payment?.isSplit && order.payment.splits ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                              <Layers className="w-3 h-3 text-purple-600" />
                              <span>{language === 'ar' ? 'دفع مجزأ' : 'Split'}</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black uppercase ${
                                paymentMethod === 'cash'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : paymentMethod === 'mada'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : paymentMethod === 'online'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {paymentMethod === 'cash' && <Banknote className="w-3 h-3 text-emerald-600" />}
                              {paymentMethod === 'mada' && <CreditCard className="w-3 h-3 text-sky-600" />}
                              {paymentMethod === 'online' && <Globe className="w-3 h-3 text-purple-600" />}
                              {paymentMethod === 'visa' && <CreditCard className="w-3 h-3 text-indigo-600" />}
                              <span>{paymentMethod}</span>
                            </span>
                          )}

                          <div className="font-mono font-black text-slate-900 text-sm mt-1">
                            {formatCurrency(order.total, language, settings.currencyEn, settings.currencyAr)}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPrintableReceiptOrder(order)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Print Thermal Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenRefundDialog(order)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'استرجاع' : 'Refund'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: REFUNDS LIST (EXPLICIT REFUND METHODS AUDIT) */}
        {activeSubTab === 'refunds' && (
          <>
            {filteredRefunds.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <RotateCcw className="w-10 h-10 mx-auto mb-2 text-rose-300" />
                <p className="font-bold text-sm text-slate-700">
                  {language === 'ar' ? 'لا توجد عمليات استرجاع مسجلة' : 'No refunded orders recorded'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar'
                    ? 'العمليات المستردة ستظهر هنا مع بيان تفاصيل طريقة رد المبلغ (نقداً، مدى، أو أونلاين)'
                    : 'Refunded transactions appear here detailing payout method (Cash, Mada, or Online)'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredRefunds.map((order) => {
                  const ref = order.refund;
                  const refundMethodType = ref?.method || 'cash';
                  return (
                    <div
                      key={order.id}
                      className="bg-white border-2 border-rose-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header: Refund Voucher # & Date */}
                        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              <span>Ref #{order.dailyOrderNumber}</span>
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              {ref?.type === 'full' ? (language === 'ar' ? 'استرجاع كامل' : 'Full Refund') : (language === 'ar' ? 'استرجاع جزئي' : 'Partial')}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ref?.refundedAt
                              ? new Date(ref.refundedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>

                        {/* HIGH VISIBILITY REFUND METHOD (User requirement: "kivabe refund holo like kon option e refund holo cash naki mada naki online order e eta ullekh korte hobe") */}
                        <div className="my-3 p-3 bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl border border-rose-200 space-y-1.5">
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900 flex items-center justify-between">
                            <span>{language === 'ar' ? 'طريقة رد المبلغ للعميل:' : 'Refund Payout Method:'}</span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {ref?.cashierName ? `By: ${ref.cashierName}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {refundMethodType === 'cash' && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
                                <Banknote className="w-4 h-4" />
                                <span>{language === 'ar' ? '💵 نقداً (صندوق الكاشير)' : '💵 CASH (Register Drawer)'}</span>
                              </div>
                            )}

                            {refundMethodType === 'mada' && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 text-white font-black text-xs shadow-xs">
                                <CreditCard className="w-4 h-4" />
                                <span>{language === 'ar' ? '💳 شبكة مدى (بطاقة بنكية)' : '💳 MADA DEBIT CARD'}</span>
                              </div>
                            )}

                            {refundMethodType === 'online' && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs shadow-xs">
                                <Globe className="w-4 h-4" />
                                <span>{language === 'ar' ? '🌐 طلب أونلاين (بوابة الدفع)' : '🌐 ONLINE ORDER / QR'}</span>
                              </div>
                            )}

                            {(refundMethodType === 'visa' || refundMethodType === 'card') && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs">
                                <CreditCard className="w-4 h-4" />
                                <span>{language === 'ar' ? '💳 بطاقة ائتمان (فيزا)' : '💳 CREDIT CARD (VISA)'}</span>
                              </div>
                            )}
                          </div>

                          {ref?.refundMethodNote && (
                            <p className="text-[11px] text-slate-600 italic pt-1">
                              📌 {ref.refundMethodNote}
                            </p>
                          )}
                        </div>

                        {/* Customer & Reason */}
                        <div className="space-y-1 text-xs">
                          {order.customerName && (
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="font-bold">{order.customerName}</span>
                              <span className="font-mono text-slate-400">{order.customerPhone}</span>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-800">
                              {language === 'ar' ? 'السبب:' : 'Reason:'}{' '}
                            </span>
                            <span>{ref?.reason || 'Customer request'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Amounts & Print */}
                      <div className="pt-3 border-t border-rose-100 flex items-center justify-between gap-2 mt-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            {language === 'ar' ? 'المبلغ المسترد' : 'Refunded Amount'}
                          </span>
                          <span className="font-mono font-black text-rose-600 text-base">
                            -
                            {formatCurrency(
                              ref?.amount || order.total,
                              language,
                              settings.currencyEn,
                              settings.currencyAr
                            )}
                          </span>
                        </div>

                        <button
                          onClick={() => setPrintableReceiptOrder(order)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'طباعة السند' : 'Print Slip'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* REFUND MODAL DIALOG (WITH METHOD SELECTION & CASHIER PRIVILEGE CONTROL) */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {language === 'ar'
                      ? `استرجاع الطلب #${refundingOrder.dailyOrderNumber}`
                      : `Issue Refund for Order #${refundingOrder.dailyOrderNumber}`}
                  </h3>
                  <p className="text-xs text-rose-100">
                    {language === 'ar'
                      ? 'حدد طريقة صرف المبلغ (نقداً، مدى، أو أونلاين)'
                      : 'Specify the payout refund method (Cash, Mada, or Online)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRefundingOrder(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order quick overview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">
                    {refundingOrder.customerName || 'Walk-in Customer'}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Original Payment: {refundingOrder.payment?.method.toUpperCase()}
                  </span>
                </div>
                <div className="text-right rtl:text-left">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Billed</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatCurrency(
                      refundingOrder.total,
                      language,
                      settings.currencyEn,
                      settings.currencyAr
                    )}
                  </span>
                </div>
              </div>

              {/* Refund Type: Full vs Partial */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRefundType('full');
                    setRefundAmount(refundingOrder.total.toFixed(2));
                  }}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all ${
                    refundType === 'full'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {language === 'ar' ? 'استرجاع كامل (100%)' : 'Full Refund (100%)'}
                </button>

                <button
                  type="button"
                  onClick={() => setRefundType('partial')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all ${
                    refundType === 'partial'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {language === 'ar' ? 'استرجاع جزئي' : 'Partial Refund'}
                </button>
              </div>

              {/* Refund Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">
                  {language === 'ar' ? 'مبلغ الاسترجاع (ر.س)' : 'Refund Amount (SAR)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={refundType === 'full'}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl p-3 font-mono text-base font-black text-slate-900 focus:outline-none"
                />
              </div>

              {/* MANDATORY REFUND METHOD SELECTION (User requirement: "kon option e refund holo cash naki mada naki online order e eta ullekh korte hobe") */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-800 block">
                  {language === 'ar'
                    ? 'طريقة رد المبلغ للعميل (إلزامية)'
                    : 'Select Refund Payment Method (Required):'}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {/* Cash */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('cash')}
                    className={`p-3 rounded-2xl border text-left rtl:text-right flex items-center gap-2.5 transition-all ${
                      refundMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">
                        {language === 'ar' ? 'نقداً (الصندوق)' : 'Cash'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {language === 'ar' ? 'فتح درج النقد' : 'Kicks cash drawer'}
                      </span>
                    </div>
                  </button>

                  {/* Mada */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('mada')}
                    className={`p-3 rounded-2xl border text-left rtl:text-right flex items-center gap-2.5 transition-all ${
                      refundMethod === 'mada'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-sm ring-1 ring-sky-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">
                        {language === 'ar' ? 'شبكة مدى' : 'Mada Card'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {language === 'ar' ? 'عكس عبر جهاز الشبكة' : 'POS terminal refund'}
                      </span>
                    </div>
                  </button>

                  {/* Online Order */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('online')}
                    className={`p-3 rounded-2xl border text-left rtl:text-right flex items-center gap-2.5 transition-all ${
                      refundMethod === 'online'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm ring-1 ring-purple-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">
                        {language === 'ar' ? 'طلب أونلاين' : 'Online / QR Order'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {language === 'ar' ? 'إرجاع لبوابة الدفع' : 'Payment gateway reverse'}
                      </span>
                    </div>
                  </button>

                  {/* Visa / MasterCard */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('visa')}
                    className={`p-3 rounded-2xl border text-left rtl:text-right flex items-center gap-2.5 transition-all ${
                      refundMethod === 'visa'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">
                        {language === 'ar' ? 'فيزا / بطاقة' : 'Credit Card (Visa)'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {language === 'ar' ? 'إرجاع للبطاقة' : 'Credit reversal'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Refund Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'ar' ? 'سبب الاسترجاع' : 'Refund Reason'}
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="Customer Request / طلب العميل">Customer Request / طلب العميل</option>
                  <option value="Wrong Item Prepared / خطأ في تجهيز الطلب">Wrong Item Prepared / خطأ في تجهيز الطلب</option>
                  <option value="Drink Temperature / Item Quality / جودة المنتج">Drink Temperature / Item Quality / جودة المنتج</option>
                  <option value="Order Delayed / تأخر الطلب">Order Delayed / تأخر الطلب</option>
                  <option value="Accidental Double Charge / خصم مكرر">Accidental Double Charge / خصم مكرر</option>
                </select>
              </div>

              {/* Reference / Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'ar' ? 'مرجع أو ملاحظة الاسترجاع (اختياري)' : 'Refund Reference / Slip Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder={
                    refundMethod === 'mada'
                      ? 'e.g. Mada POS RRN #982144'
                      : refundMethod === 'online'
                      ? 'e.g. Online Refund TXN #882194'
                      : 'e.g. Cash returned from register #1'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* CASHIER PRIVILEGE RESTRICTION CHECK (User requirement: "management caile user ke limited access dite pare like ei cashier sudhu order nite parbe onno cashier product add korte parbe amon") */}
              {!currentUser?.permissions?.canProcessRefunds && currentUser?.role !== 'admin' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? 'تنبيه الصلاحيات: هذا الكاشير مسموح له فقط بأخذ الطلبات!'
                        : 'Cashier Permission Limit: Current cashier can only take orders.'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    {language === 'ar'
                      ? 'لإتمام هذا الاسترجاع، يجب إدخال رمز المشرف (Manager PIN) للموافقة:'
                      : 'Manager authorization is required. Please enter supervisor PIN:'}
                  </p>
                  <input
                    type="password"
                    maxLength={4}
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    placeholder="Enter Manager PIN (1234)"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundingOrder(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmRefund}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md shadow-rose-500/25 flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {language === 'ar'
                    ? `تأكيد الاسترجاع (${getRefundMethodLabel(refundMethod, language)})`
                    : `Confirm Refund via (${getRefundMethodLabel(refundMethod, language)})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
