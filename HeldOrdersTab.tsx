import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  CreditCard,
  User,
  Phone,
  MapPin,
  Utensils,
  AlertCircle,
  FileText,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Order } from '../types/pos';

interface HeldOrdersTabProps {
  onSettleOrder: (order: Order) => void;
}

export const HeldOrdersTab: React.FC<HeldOrdersTabProps> = ({ onSettleOrder }) => {
  const { language, heldOrders, settings, declineIncomingQrOrder } = usePos();
  const isRtl = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHeldOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return heldOrders;
    return heldOrders.filter((order) => {
      const matchNumber = order.dailyOrderNumber.toString().includes(q) || order.id.toLowerCase().includes(q);
      const matchCustomer = order.customerName?.toLowerCase().includes(q);
      const matchPhone = order.customerPhone?.includes(q);
      const matchTable = order.tableOrPlate?.toLowerCase().includes(q);
      return matchNumber || matchCustomer || matchPhone || matchTable;
    });
  }, [heldOrders, searchQuery]);

  const getTimeElapsed = (heldAt?: string, createdAt?: string) => {
    const timeStr = heldAt || createdAt;
    if (!timeStr) return '0m';
    const diffMs = Date.now() - new Date(timeStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return language === 'ar' ? 'الآن' : 'Just now';
    return `${mins}m ${language === 'ar' ? 'مضت' : 'ago'}`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] bg-slate-50 text-slate-800 overflow-hidden">
      {/* Top Banner / Explainer */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>{getTranslation('heldOrdersTitle', language)}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-mono font-bold">
              {heldOrders.length} {language === 'ar' ? 'معلق' : 'Held'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {getTranslation('heldOrdersSubtitle', language)}
          </p>
        </div>

        {/* Search Bar for Quick Customer Lookup */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation('searchHeldOrders', language)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Held Orders Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredHeldOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              <Clock className="w-8 h-8 opacity-40 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-700">
              {getTranslation('noHeldOrders', language)}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {language === 'ar'
                ? 'عند استلام طلبات من قائمة الباركود QR أو تعليق طلب يدوي، ستظهر هنا حتى يقوم العميل بالدفع والاستلام.'
                : 'Incoming QR orders and held cashier orders will stay queued here until customer pays.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHeldOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Order Top Strip */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-mono font-black text-sm flex items-center justify-center">
                      #{order.dailyOrderNumber}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {isRtl ? order.sourceNameAr : order.sourceNameEn}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{order.id}</span>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      {getTranslation('unpaidPreparing', language)}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {getTimeElapsed(order.heldAt, order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Order Customer & Location Metadata */}
                <div className="p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">
                        {order.customerName || (language === 'ar' ? 'عميل غير مسجل' : 'Guest Customer')}
                      </span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-1 font-mono text-blue-600 text-[11px] font-bold">
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {order.tableOrPlate && (
                    <div className="flex items-center gap-1.5 text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                      <span className="font-bold">{order.tableOrPlate}</span>
                      <span className="text-slate-500">({order.orderType || 'Dine-In'})</span>
                    </div>
                  )}

                  {order.customerNote && (
                    <div className="text-[11px] text-blue-800 bg-blue-50/60 border border-blue-100 p-2 rounded-lg italic">
                      *{order.customerNote}
                    </div>
                  )}

                  {/* Items Preview */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} {language === 'ar' ? 'أصناف في الطلب' : 'Items'}
                    </span>
                    <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                          <span>
                            {item.quantity}x {isRtl ? item.product.nameAr : item.product.nameEn}
                          </span>
                          <span className="font-mono text-slate-500">
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
                </div>

                {/* Card Bottom: Total & Settle Actions */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{getTranslation('total', language)}</span>
                    <span className="text-base font-black font-mono text-blue-600">
                      {formatCurrency(order.total, language, settings.currencyEn, settings.currencyAr)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => declineIncomingQrOrder(order.id)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 text-xs font-semibold"
                      title={getTranslation('cancelHeld', language)}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Settle & Bill Button */}
                    <button
                      onClick={() => onSettleOrder(order)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{getTranslation('settleAndBill', language)}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
