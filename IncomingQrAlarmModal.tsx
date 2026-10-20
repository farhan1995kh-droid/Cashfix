import React from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  User,
  Utensils,
  MapPin,
  Volume2,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';

export const IncomingQrAlarmModal: React.FC = () => {
  const {
    language,
    incomingQrOrder,
    isAlarmEscalated,
    alarmSecondsElapsed,
    acceptIncomingQrOrder,
    declineIncomingQrOrder,
    settings,
  } = usePos();

  if (!incomingQrOrder) return null;

  const isRtl = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl bg-white border-4 ${
          isAlarmEscalated
            ? 'border-rose-600 animate-alarm-pulse shadow-2xl shadow-rose-600/30'
            : 'border-blue-600 shadow-2xl shadow-blue-500/20'
        } rounded-3xl overflow-hidden transition-all text-slate-800`}
      >
        {/* Flashing Urgency Top Banner */}
        <div
          className={`py-3.5 px-6 flex items-center justify-between ${
            isAlarmEscalated
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <BellRing className="w-7 h-7 animate-bounce text-white" />
            <div>
              <h2 className="font-black text-lg md:text-xl tracking-tight leading-none text-white">
                {getTranslation('alarmModalTitle', language)}
              </h2>
              <span className="text-xs font-bold text-blue-100 opacity-90">
                {getTranslation('alarmNotice', language)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-mono font-black">
            <Volume2 className="w-4 h-4 animate-ping" />
            <span>15s LOOP</span>
          </div>
        </div>

        {/* 30s Escalation Secondary Alert Banner */}
        {isAlarmEscalated && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center gap-3 text-rose-800 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{getTranslation('escalationWarning', language)}</span>
            <span className="ml-auto font-mono text-rose-700 font-extrabold bg-rose-100 px-2 py-0.5 rounded">
              {alarmSecondsElapsed}s WAITING
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800 max-h-[75vh] overflow-y-auto">
          {/* Order Header / Identification */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                {language === 'ar' ? 'رقم الطلب الجديد' : 'Incoming Order #'}
              </span>
              <div className="text-2xl font-black text-blue-600 tracking-tight">
                #{incomingQrOrder.dailyOrderNumber}{' '}
                <span className="text-xs font-mono text-slate-400 font-normal">
                  ({incomingQrOrder.id})
                </span>
              </div>
            </div>
            <div className="text-right rtl:text-left">
              <span className="text-xs text-slate-500 font-medium">
                {language === 'ar' ? 'الوقت المنقضي' : 'Waiting Timer'}
              </span>
              <div className="flex items-center gap-1.5 text-lg font-mono font-bold text-rose-600">
                <Clock className="w-4 h-4" />
                <span>{alarmSecondsElapsed}s</span>
              </div>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                  {getTranslation('customerName', language)}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {incomingQrOrder.customerName || (language === 'ar' ? 'عميل غير مسجل' : 'Guest Customer')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                  {getTranslation('customerPhone', language)}
                </span>
                <span className="text-sm font-mono font-bold text-emerald-700">
                  {incomingQrOrder.customerPhone || '-'}
                </span>
              </div>
            </div>

            {incomingQrOrder.tableOrPlate && (
              <div className="flex items-center gap-3 md:col-span-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">
                    {language === 'ar' ? 'الطاولة / لوحة السيارة / الموقع' : 'Table / Car Plate / Location'}
                  </span>
                  <span className="text-sm font-extrabold text-blue-800">
                    {incomingQrOrder.tableOrPlate} ({incomingQrOrder.orderType || 'Dine-In'})
                  </span>
                </div>
              </div>
            )}

            {incomingQrOrder.customerNote && (
              <div className="md:col-span-2 text-xs bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-900">
                <span className="font-bold">{language === 'ar' ? 'ملاحظة العميل: ' : 'Customer Note: '}</span>
                {incomingQrOrder.customerNote}
              </div>
            )}
          </div>

          {/* Ordered Items List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ar' ? 'الأصناف المطلوبة' : 'Ordered Items'}</span>
            </h4>
            <div className="divide-y divide-slate-100 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
              {incomingQrOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center font-mono">
                      {item.quantity}x
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isRtl ? item.product.nameAr : item.product.nameEn}
                      </span>
                      {item.itemNotes && (
                        <span className="text-[10px] text-blue-600 italic">*{item.itemNotes}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700">
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

          {/* Total Preview */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500">{getTranslation('total', language)} (Incl. VAT)</span>
              <div className="text-xs text-slate-400">
                {language === 'ar' ? 'الدفع يتم لاحقاً عند الاستلام' : 'Unpaid - Collected upon handover'}
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600 font-mono">
              {formatCurrency(incomingQrOrder.total, language, settings.currencyEn, settings.currencyAr)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => declineIncomingQrOrder()}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-bold transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>{getTranslation('rejectOrder', language)}</span>
          </button>

          <button
            onClick={() => acceptIncomingQrOrder()}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm md:text-base shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{getTranslation('acceptAndHold', language)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
