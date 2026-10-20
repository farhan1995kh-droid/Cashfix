import React, { useState } from 'react';
import {
  Sparkles,
  Banknote,
  Clock,
  UserCheck,
  ShieldAlert,
  X,
  Lock,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { getTranslation } from '../utils/translations';

export const DayStartModal: React.FC = () => {
  const {
    language,
    isStartShiftModalOpen,
    closeStartShiftModal,
    startShift,
    currentUser,
    settings,
  } = usePos();

  const isRtl = language === 'ar';
  const [openingFloat, setOpeningFloat] = useState<string>('500.00');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isStartShiftModalOpen) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const floatNum = parseFloat(openingFloat);
    if (isNaN(floatNum) || floatNum < 0) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال رصيد نقدي صحيح (0 أو أكثر)' : 'Please enter a valid cash float (0 or greater)');
      return;
    }
    startShift(floatNum);
  };

  const cashierName = isRtl ? currentUser?.nameAr : currentUser?.nameEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                {getTranslation('dayStartTitle', language)}
              </h2>
              <span className="text-[11px] text-slate-500">
                {language === 'ar' ? 'تسجيل فتح الصندوق وبداية اليوم' : 'Register opening drawer balance'}
              </span>
            </div>
          </div>
          <button
            onClick={closeStartShiftModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Active Cashier Info */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  {getTranslation('activeCashier', language)}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {cashierName || 'Cashier'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Opening Float Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {getTranslation('openingCashAmount', language)} *
            </label>
            <div className="relative">
              <Banknote className="w-5 h-5 text-blue-600 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="any"
                min="0"
                required
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-14 rtl:pl-14 rtl:pr-11 py-3 text-xl font-black font-mono text-blue-700 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <span className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {isRtl ? settings.currencyAr : settings.currencyEn}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'ar'
                ? 'النقد الاحتياطي (الفكة) الموجود في الدرج قبل بدء أي عملية بيع.'
                : 'Initial change/float cash placed in the cash drawer at shift opening.'}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            {[200, 300, 500, 1000].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setOpeningFloat(preset.toFixed(2))}
                className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-mono font-bold text-slate-700 border border-slate-200 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{getTranslation('confirmStartShift', language)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
