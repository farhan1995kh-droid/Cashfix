import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  User,
  Phone,
  Clock,
  X,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Order } from '../types/pos';

export const RefundModal: React.FC = () => {
  const { language, orders, processRefund, settings } = usePos();
  const isRtl = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Refund form states
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card'>('cash');
  const [refundReason, setRefundReason] = useState<string>('Customer Request / طلب العميل');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Only completed orders can be refunded
  const eligibleOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completed');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return eligibleOrders;
    return eligibleOrders.filter(
      (o) =>
        o.dailyOrderNumber.toString().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q)
    );
  }, [eligibleOrders, searchQuery]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setRefundType('full');
    setRefundAmount(order.total.toFixed(2));
    setRefundMethod(order.payment?.method === 'cash' ? 'cash' : 'card');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleProcessRefund = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedOrder) return;
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال مبلغ استرجاع صحيح' : 'Please enter a valid refund amount');
      return;
    }

    if (amountNum > selectedOrder.total) {
      setErrorMsg(language === 'ar' ? 'مبلغ الاسترجاع لا يمكن أن يتجاوز إجمالي الفاتورة' : 'Refund amount cannot exceed order total');
      return;
    }

    const success = processRefund(selectedOrder.id, {
      amount: amountNum,
      type: refundType,
      reason: refundReason.trim(),
      method: refundMethod,
    });

    if (success) {
      setSuccessMsg(language === 'ar' ? 'تمت عملية الاسترجاع بنجاح وتحديث الصندوق' : 'Refund processed successfully!');
      setSelectedOrder(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] bg-slate-50 text-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <span>{getTranslation('refundTitle', language)}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ar'
              ? 'البحث في فواتير اليوم المكتملة وتنفيذ استرجاع كامل أو جزئي (نقداً أو شبكة)'
              : "Look up today's completed sales and process full or partial refunds"}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation('searchOrderByNumber', language)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {successMsg && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* Left: Orders List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            {language === 'ar' ? 'الفواتير المكتملة اليوم' : 'Eligible Completed Orders'} ({filteredOrders.length})
          </span>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              {language === 'ar' ? 'لا توجد فواتير مكتملة مطابقة للبحث' : 'No completed orders found'}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-mono font-black text-xs flex items-center justify-center">
                      #{order.dailyOrderNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {order.customerName || (language === 'ar' ? 'عميل كاونتر' : 'Counter Guest')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({order.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {order.items.length} items • Paid via {order.payment?.method.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <span className="font-mono text-sm font-black text-blue-600">
                      {formatCurrency(order.total, language, settings.currencyEn, settings.currencyAr)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Refund Action Form */}
        <div className="w-full lg:w-[420px] bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          {selectedOrder ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-blue-600 uppercase font-black tracking-wider block">
                    Refund for Order #{selectedOrder.dailyOrderNumber}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{selectedOrder.customerName || 'Customer'}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Full vs Partial Toggle */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  {language === 'ar' ? 'نوع الاسترجاع' : 'Refund Type'}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      setRefundType('full');
                      setRefundAmount(selectedOrder.total.toFixed(2));
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      refundType === 'full' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {language === 'ar' ? 'استرجاع كامل' : 'Full Refund'}
                  </button>
                  <button
                    onClick={() => setRefundType('partial')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      refundType === 'partial' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {language === 'ar' ? 'استرجاع جزئي' : 'Partial Refund'}
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  {getTranslation('refundAmount', language)} (Max: {selectedOrder.total.toFixed(2)} SAR)
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={refundType === 'full'}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-black font-mono text-blue-700 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              {/* Method Toggle: Cash vs Card */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  {getTranslation('refundMethod', language)}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRefundMethod('cash')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      refundMethod === 'cash'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>{getTranslation('cash', language)} (Drawer)</span>
                  </button>
                  <button
                    onClick={() => setRefundMethod('card')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      refundMethod === 'card'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card / Mada</span>
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  {getTranslation('refundReason', language)}
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleProcessRefund}
                className="w-full mt-4 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{getTranslation('confirmRefund', language)}</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2 p-6">
              <RotateCcw className="w-8 h-8 opacity-40 text-blue-600" />
              <p className="text-xs">
                {language === 'ar'
                  ? 'حدد فاتورة من القائمة للبدء في إجراءات الاسترجاع'
                  : 'Select an order from the list to process a refund'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
