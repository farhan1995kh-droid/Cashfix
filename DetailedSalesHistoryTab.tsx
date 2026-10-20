import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Receipt,
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Bike,
  Store,
  QrCode,
  Utensils,
  Car,
  ShoppingBag,
  User,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  TrendingUp,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Order, CartItem } from '../types/pos';
import { OrderService } from '../services/orderService';
import { DELIVERY_PLATFORMS } from '../data/initialData';

interface DetailedSalesHistoryTabProps {
  onCloseParentModal?: () => void;
}

export const DetailedSalesHistoryTab: React.FC<DetailedSalesHistoryTabProps> = ({
  onCloseParentModal,
}) => {
  const { language, orders, settings, setPrintableReceiptOrder, setReceiptMode } = usePos();
  const isRtl = language === 'ar';

  // Default to today's date in local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'mada' | 'online' | 'due' | 'split'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'offline' | 'online' | 'qr'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [detailModalOrder, setDetailModalOrder] = useState<Order | null>(null);

  // Quick Date Helpers
  const handleSetQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Filter orders for the selected date
  const dateOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = o.completedAt || o.createdAt;
      if (!orderDate) return false;
      const datePart = new Date(orderDate).toISOString().slice(0, 10);
      return datePart === selectedDate;
    });
  }, [orders, selectedDate]);

  // Compute per-day analytics summary for the selected date
  const daySummary = useMemo(() => {
    return OrderService.calculateDailySummary(orders, selectedDate);
  }, [orders, selectedDate]);

  // Filtered transactions based on search, method, and channel
  const filteredOrders = useMemo(() => {
    return dateOrders.filter((o) => {
      // 1. Search Query (Order ID, Customer Name, Phone, Table)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = o.id.toLowerCase().includes(q);
        const dailyNoMatch = o.dailyOrderNumber?.toString().includes(q);
        const nameMatch = (o.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (o.customerPhone || '').toLowerCase().includes(q);
        const debtorMatch = (o.payment?.dueCustomer?.name || '').toLowerCase().includes(q);
        const debtorPhoneMatch = (o.payment?.dueCustomer?.phone || '').toLowerCase().includes(q);
        const tableMatch = (o.tableOrPlate || '').toLowerCase().includes(q);
        if (!idMatch && !dailyNoMatch && !nameMatch && !phoneMatch && !debtorMatch && !debtorPhoneMatch && !tableMatch) {
          return false;
        }
      }

      // 2. Payment Method Filter
      if (methodFilter !== 'all') {
        const m = o.payment?.method;
        const isSplit = o.payment?.isSplit;
        if (methodFilter === 'split') {
          if (!isSplit && m !== 'split') return false;
        } else if (methodFilter === 'cash') {
          const hasCash = m === 'cash' || (isSplit && o.payment?.splits?.some((s) => s.method === 'cash'));
          if (!hasCash) return false;
        } else if (methodFilter === 'mada') {
          const hasMada =
            m === 'mada' ||
            m === 'visa' ||
            (isSplit && o.payment?.splits?.some((s) => s.method === 'mada' || s.method === 'visa'));
          if (!hasMada) return false;
        } else if (methodFilter === 'online') {
          const hasOnline =
            m === 'online' ||
            o.orderMode === 'online' ||
            (isSplit && o.payment?.splits?.some((s) => s.method === 'online'));
          if (!hasOnline) return false;
        } else if (methodFilter === 'due') {
          const hasDue = m === 'due' || (isSplit && o.payment?.splits?.some((s) => s.method === 'due'));
          if (!hasDue) return false;
        }
      }

      // 3. Channel Filter
      if (channelFilter !== 'all') {
        const isOnline = o.orderMode === 'online' || o.payment?.method === 'online';
        const isQr = o.id.startsWith('QR-') || o.sourceId === 'src_offline';
        if (channelFilter === 'online' && !isOnline) return false;
        if (channelFilter === 'qr' && !isQr) return false;
        if (channelFilter === 'offline' && (isOnline || isQr)) return false;
      }

      return true;
    });
  }, [dateOrders, searchQuery, methodFilter, channelFilter]);

  // Reprint Receipt Action
  const handleReprintReceipt = (order: Order) => {
    setReceiptMode('both');
    setPrintableReceiptOrder(order);
  };

  // Helper for Payment Method Badge
  const renderPaymentBadge = (order: Order) => {
    // 1. Split Payment
    if (order.payment?.isSplit && order.payment.splits && order.payment.splits.length > 0) {
      return (
        <div className="inline-flex flex-col gap-1 items-start rtl:items-end">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>{isRtl ? 'دفع مجزأ' : 'Split Payment'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
            {order.payment.splits.map((s, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold"
              >
                {s.method === 'cash' ? '💵' : s.method === 'mada' ? '💳' : s.method === 'due' ? '📑' : '🌐'}{' '}
                {s.amount.toFixed(0)}
              </span>
            ))}
          </div>
        </div>
      );
    }

    const method = order.payment?.method;
    const isOnline = order.orderMode === 'online' || method === 'online';

    if (isOnline) {
      const platformName = order.payment?.deliveryPlatformName || order.deliveryPlatformName || 'Online App';
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bike className="w-3.5 h-3.5" />
          <span>{platformName}</span>
        </span>
      );
    }
    if (method === 'cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Banknote className="w-3.5 h-3.5" />
          <span>{isRtl ? 'كاش (نقد)' : 'Cash'}</span>
        </span>
      );
    }
    if (method === 'mada' || method === 'visa') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CreditCard className="w-3.5 h-3.5" />
          <span>{isRtl ? 'مدى (بطاقة)' : 'Mada / Card'}</span>
        </span>
      );
    }
    if (method === 'due') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          <span>{isRtl ? 'آجل (ذمم)' : 'Due / Credit'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
        <span>{method || 'Paid'}</span>
      </span>
    );
  };

  // Helper for Order Type Channel Badge
  const renderChannelBadge = (order: Order) => {
    const isOnline = order.orderMode === 'online' || order.payment?.method === 'online';
    const isQr = order.id.startsWith('QR-');

    if (isOnline) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800">
          <Bike className="w-3 h-3" />
          <span>Online Delivery</span>
        </span>
      );
    }
    if (isQr) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800">
          <QrCode className="w-3 h-3" />
          <span>QR Menu</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
        <Store className="w-3 h-3" />
        <span>Offline POS</span>
      </span>
    );
  };

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Date Selection & Search Filter Bar */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Calendar Date Picker & Quick Days */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleSetQuickDate(0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedDate === todayStr
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isRtl ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(1)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                {isRtl ? 'أمس' : 'Yesterday'}
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(7)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                {isRtl ? 'قبل 7 أيام' : '7 Days Ago'}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
            <input
              type="text"
              placeholder={isRtl ? 'بحث برقم الطلب، اسم العميل، الجوال...' : 'Search by Order #, Customer, Phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Pills (Payment Method & Channel) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 rtl:mr-0 rtl:ml-1">
              {isRtl ? 'طريقة الدفع:' : 'Payment:'}
            </span>
            {[
              { id: 'all', label: isRtl ? 'الكل' : 'All Methods' },
              { id: 'cash', label: isRtl ? 'كاش' : 'Cash' },
              { id: 'mada', label: isRtl ? 'مدى' : 'Mada' },
              { id: 'split', label: isRtl ? 'مجزأ (متعدد)' : 'Split' },
              { id: 'online', label: isRtl ? 'تطبيقات' : 'Delivery Apps' },
              { id: 'due', label: isRtl ? 'آجل' : 'Due/Credit' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodFilter(m.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  methodFilter === m.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 rtl:mr-0 rtl:ml-1">
              {isRtl ? 'القناة:' : 'Channel:'}
            </span>
            {[
              { id: 'all', label: isRtl ? 'كل القنوات' : 'All Channels' },
              { id: 'offline', label: isRtl ? 'كاشير محلي' : 'Offline POS' },
              { id: 'online', label: isRtl ? 'توصيل' : 'Online' },
              { id: 'qr', label: isRtl ? 'باركود QR' : 'QR Menu' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannelFilter(c.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  channelFilter === c.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Executive Day Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Net Revenue */}
        <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            {isRtl ? `صافي مبيعات (${selectedDate})` : `Net Sales (${selectedDate})`}
          </span>
          <span className="font-mono text-xl font-black text-slate-900 mt-0.5 block">
            {formatCurrency(daySummary.netSales, language, settings.currencyEn, settings.currencyAr)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {daySummary.completedOrders} {isRtl ? 'عملية بيع مكتملة' : 'completed orders'}
          </span>
        </div>

        {/* Cash Sales */}
        <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            {isRtl ? 'مبيعات الكاش (نقد)' : 'Cash Sales'}
          </span>
          <span className="font-mono text-lg font-black text-emerald-800 mt-0.5 block">
            {formatCurrency(daySummary.cashSales, language, settings.currencyEn, settings.currencyAr)}
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 block">
            {isRtl ? 'محصلة في درج الكاشير' : 'In register drawer'}
          </span>
        </div>

        {/* Mada / Card Sales */}
        <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-200 shadow-2xs">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
            {isRtl ? 'مبيعات مدى والبطاقات' : 'Mada / Card Sales'}
          </span>
          <span className="font-mono text-lg font-black text-sky-800 mt-0.5 block">
            {formatCurrency(daySummary.madaSales, language, settings.currencyEn, settings.currencyAr)}
          </span>
          <span className="text-[10px] text-sky-600 mt-1 block">
            {isRtl ? 'تحصيل شبكة إلكتروني' : 'POS Network terminal'}
          </span>
        </div>

        {/* Online & Due Combined */}
        <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              {isRtl ? 'التطبيقات والآجل' : 'Online & Due'}
            </span>
            <span className="font-mono text-xs font-bold text-slate-500">
              Avg: {daySummary.avgOrderValue.toFixed(1)}
            </span>
          </div>
          <span className="font-mono text-lg font-black text-indigo-900 mt-0.5 block">
            {formatCurrency(daySummary.onlineSales + daySummary.dueSales, language, settings.currencyEn, settings.currencyAr)}
          </span>
          <span className="text-[10px] text-indigo-600 mt-1 block">
            Online: {daySummary.onlineSales.toFixed(0)} | Due: {daySummary.dueSales.toFixed(0)} SAR
          </span>
        </div>
      </div>

      {/* 3. Detailed Per-Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h4 className="font-extrabold text-xs text-slate-900">
              {isRtl ? 'سجل العمليات والطلبات الفردية' : 'Individual Transaction History & Audit'}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
              {filteredOrders.length} {isRtl ? 'عملية' : 'records'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Date: {selectedDate}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-xs text-slate-600">
              {isRtl ? 'لا توجد عمليات مبيعات مسجلة في هذا التاريخ' : 'No sales transactions recorded for this date.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isRtl ? 'اختر تاريخاً آخر أو قم بإتمام مبيعات من شاشة الكاشير.' : 'Select another date or complete checkout from the POS screen.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50/70 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3"># & Order ID</th>
                  <th className="p-3">{isRtl ? 'الوقت' : 'Time'}</th>
                  <th className="p-3">{isRtl ? 'نوع الطلب' : 'Order Type'}</th>
                  <th className="p-3">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</th>
                  <th className="p-3">{isRtl ? 'العميل' : 'Customer'}</th>
                  <th className="p-3">{isRtl ? 'الأصناف' : 'Items'}</th>
                  <th className="p-3 text-right rtl:text-left">{isRtl ? 'الإجمالي' : 'Total'}</th>
                  <th className="p-3 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const timeFormatted = new Date(order.completedAt || order.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        {/* Order ID & Daily # */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center font-mono">
                              #{order.dailyOrderNumber || 1}
                            </span>
                            <div>
                              <span className="font-mono font-bold text-slate-900 block text-xs">
                                {order.id}
                              </span>
                              <span className={`text-[10px] font-semibold ${order.status === 'completed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {order.status === 'completed' ? (isRtl ? 'مكتمل ✓' : 'Completed') : (isRtl ? 'مرتجع' : 'Refunded')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="p-3 whitespace-nowrap font-mono text-slate-600 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{timeFormatted}</span>
                          </span>
                        </td>

                        {/* Order Type */}
                        <td className="p-3 whitespace-nowrap">
                          {renderChannelBadge(order)}
                          {order.tableOrPlate && (
                            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                              {order.tableOrPlate}
                            </span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="p-3 whitespace-nowrap">
                          {renderPaymentBadge(order)}
                        </td>

                        {/* Customer */}
                        <td className="p-3">
                          {order.customerPhone || order.payment?.dueCustomer?.phone ? (
                            <div>
                              <span className="font-bold text-slate-800 block text-xs truncate max-w-[120px]">
                                {order.customerName || order.payment?.dueCustomer?.name || (isRtl ? 'عميل' : 'Customer')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {order.customerPhone || order.payment?.dueCustomer?.phone}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              {isRtl ? 'عميل عادي' : 'Walk-in'}
                            </span>
                          )}
                        </td>

                        {/* Items Summary */}
                        <td className="p-3 max-w-[180px]">
                          <span className="text-xs text-slate-700 font-medium truncate block">
                            {order.items.map((i) => `${i.quantity}x ${isRtl ? i.product.nameAr : i.product.nameEn}`).join(', ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.items.reduce((s, i) => s + i.quantity, 0)} {isRtl ? 'قطعة' : 'units'}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="p-3 whitespace-nowrap text-right rtl:text-left">
                          <span className="font-mono text-xs font-black text-slate-900 block">
                            {formatCurrency(order.total, language, settings.currencyEn, settings.currencyAr)}
                          </span>
                          {order.discountAmount > 0 && (
                            <span className="text-[10px] font-mono text-rose-500 font-semibold block">
                              -{order.discountAmount.toFixed(1)} SAR
                            </span>
                          )}
                        </td>

                        {/* Actions (Reprint & View Details) */}
                        <td className="p-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Reprint Receipt */}
                            <button
                              type="button"
                              onClick={() => handleReprintReceipt(order)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 active:scale-90 transition-all border border-blue-200 cursor-pointer"
                              title={isRtl ? 'إعادة طباعة الفاتورة' : 'Reprint Thermal Receipt'}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* View Full Details Modal */}
                            <button
                              type="button"
                              onClick={() => setDetailModalOrder(order)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                              title={isRtl ? 'عرض تفاصيل الطلب الكاملة' : 'View Full Details'}
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span className="hidden sm:inline">{isRtl ? 'تفاصيل' : 'Details'}</span>
                            </button>

                            {/* Toggle Inline Accordion */}
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Inline Line-Item Breakdown */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={8} className="p-3 border-y border-blue-100">
                            <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className="font-bold text-slate-700">
                                  {isRtl ? 'تفاصيل الأصناف والأسعار:' : 'Line Item Details:'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Cashier: {order.cashierName || 'Cashier'}
                                </span>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="py-1.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-blue-700">
                                        {item.quantity}x
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {isRtl ? item.product.nameAr : item.product.nameEn}
                                      </span>
                                      {item.itemNotes && (
                                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                          {item.itemNotes}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-mono text-slate-700">
                                      {formatCurrency(
                                        (item.customPrice ?? item.product.price) * item.quantity,
                                        language,
                                        settings.currencyEn,
                                        settings.currencyAr
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800">
                                <span>{isRtl ? 'المجموع شامل الضريبة:' : 'Total Amount (VAT Included):'}</span>
                                <span className="font-mono text-blue-600 font-black">
                                  {formatCurrency(order.total, language, settings.currencyEn, settings.currencyAr)}
                                </span>
                              </div>

                              {order.payment?.isSplit && order.payment.splits && (
                                <div className="mt-2 p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 text-xs space-y-1.5">
                                  <span className="font-extrabold text-purple-900 block">
                                    {isRtl ? 'تفصيل الدفع المجزأ:' : 'Split Payment Breakdown:'}
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {order.payment.splits.map((s, sIdx) => (
                                      <div
                                        key={sIdx}
                                        className="bg-white px-2.5 py-1.5 rounded-lg border border-purple-100 flex items-center gap-2 shadow-2xs"
                                      >
                                        <span className="font-bold text-slate-800">
                                          {s.method === 'cash'
                                            ? '💵 Cash / نقداً'
                                            : s.method === 'mada'
                                            ? '💳 Mada / مدى'
                                            : s.method === 'due'
                                            ? '📑 Due / آجل'
                                            : '🌐 Online'}
                                          :
                                        </span>
                                        <span className="font-mono font-black text-purple-700">
                                          {s.amount.toFixed(2)} SAR
                                        </span>
                                        {s.method === 'cash' && s.cashTendered && s.cashTendered > s.amount && (
                                          <span className="text-[10px] text-emerald-700 font-mono">
                                            (Tender: {s.cashTendered.toFixed(2)} | Change: {(s.changeDue || 0).toFixed(2)})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Full Transaction Detail Popup Modal */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-black text-sm">
                    {isRtl ? `تفاصيل الفاتورة #${detailModalOrder.dailyOrderNumber}` : `Transaction #${detailModalOrder.dailyOrderNumber}`}
                  </h3>
                  <span className="text-[11px] text-blue-100 font-mono">
                    ID: {detailModalOrder.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOrder(null)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isRtl ? 'التاريخ والوقت' : 'Date & Time'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                    {new Date(detailModalOrder.completedAt || detailModalOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isRtl ? 'الكاشير' : 'Cashier'}
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detailModalOrder.cashierName || 'Cashier'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isRtl ? 'قناة الطلب' : 'Channel'}
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {detailModalOrder.sourceNameEn}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isRtl ? 'طريقة الدفع' : 'Payment Method'}
                  </span>
                  <div className="mt-0.5">
                    {renderPaymentBadge(detailModalOrder)}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {(detailModalOrder.customerPhone || detailModalOrder.payment?.dueCustomer?.phone) && (
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {detailModalOrder.customerName || detailModalOrder.payment?.dueCustomer?.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {detailModalOrder.customerPhone || detailModalOrder.payment?.dueCustomer?.phone}
                      </span>
                    </div>
                  </div>
                  {detailModalOrder.tableOrPlate && (
                    <span className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-mono text-[11px] font-bold">
                      {detailModalOrder.tableOrPlate}
                    </span>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-xs block">
                  {isRtl ? 'الأصناف المطلوبة:' : 'Ordered Items:'}
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                  {detailModalOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600">{item.quantity}x</span>
                          <span className="font-bold text-slate-800">
                            {isRtl ? item.product.nameAr : item.product.nameEn}
                          </span>
                        </div>
                        {item.itemNotes && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                            {item.itemNotes}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(
                          (item.customPrice ?? item.product.price) * item.quantity,
                          language,
                          settings.currencyEn,
                          settings.currencyAr
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span>{detailModalOrder.subtotal.toFixed(2)} SAR</span>
                </div>
                {detailModalOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>{isRtl ? 'الخصم المطبق:' : 'Discount:'}</span>
                    <span>-{detailModalOrder.discountAmount.toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? 'الضريبة (15% شاملة):' : 'VAT (15% Included):'}</span>
                  <span>{detailModalOrder.taxAmount.toFixed(2)} SAR</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>{isRtl ? 'المبلغ الإجمالي النهائي:' : 'Net Total Paid:'}</span>
                  <span className="text-blue-600">{detailModalOrder.total.toFixed(2)} SAR</span>
                </div>
              </div>

              {/* Split Payment Breakdown */}
              {detailModalOrder.payment?.isSplit && detailModalOrder.payment.splits && (
                <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                  <span className="font-extrabold text-xs text-purple-900 block">
                    {isRtl ? 'تفصيل الدفع المجزأ (Mixed Payment Breakdown):' : 'Split Payment Breakdown:'}
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {detailModalOrder.payment.splits.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-xl border border-purple-100 flex items-center justify-between shadow-2xs"
                      >
                        <span className="font-bold text-slate-800">
                          {s.method === 'cash'
                            ? '💵 Cash / نقداً'
                            : s.method === 'mada'
                            ? '💳 Mada / مدى'
                            : s.method === 'due'
                            ? '📑 Due / آجل'
                            : '🌐 Online'}
                        </span>
                        <div className="text-right rtl:text-left font-mono">
                          <span className="font-bold text-slate-900">{s.amount.toFixed(2)} SAR</span>
                          {s.method === 'cash' && s.cashTendered && s.cashTendered > s.amount && (
                            <span className="block text-[10px] text-emerald-700">
                              Tendered: {s.cashTendered.toFixed(2)} SAR (Change: {(s.changeDue || 0).toFixed(2)} SAR)
                            </span>
                          )}
                          {s.method === 'due' && s.dueCustomer?.name && (
                            <span className="block text-[10px] text-amber-700">
                              Debtor: {s.dueCustomer.name} ({s.dueCustomer.phone})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleReprintReceipt(detailModalOrder);
                  setDetailModalOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'إعادة طباعة الفاتورة' : 'Reprint Thermal Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
