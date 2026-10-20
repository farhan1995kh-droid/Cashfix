import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Delete,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { getTranslation } from '../utils/translations';

interface PinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: 'admin' | 'cashier';
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  onClose,
  requiredRole,
}) => {
  const { language, cashiers, loginWithPin, currentUser } = usePos();
  const isRtl = language === 'ar';
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      // Auto submit on 4th digit
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (enteredPin: string) => {
    const result = loginWithPin(enteredPin);
    if (result.success && result.user) {
      if (requiredRole === 'admin' && result.user.role !== 'admin') {
        setErrorMsg(
          language === 'ar'
            ? 'هذه الشاشة تتطلب صلاحية المشرف (Admin) فقط!'
            : 'Admin privileges required for this section!'
        );
        setPin('');
        return;
      }
      onClose();
      setPin('');
    } else {
      setErrorMsg(result.error || (language === 'ar' ? 'رمز الدخول غير صحيح' : 'Invalid PIN code'));
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col items-center space-y-5 text-slate-800">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">
                {language === 'ar' ? 'تسجيل الدخول بالرمز السري' : 'Quick PIN Authentication'}
              </h3>
              <span className="text-[10px] text-slate-500">
                {requiredRole === 'admin' ? 'Admin Access Required' : 'Cashier / Admin PIN'}
              </span>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-600 ring-4 ring-blue-500/20 scale-110'
                    : 'bg-slate-100 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 animate-pulse text-center">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* NumPad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-mono font-bold text-xl border border-slate-200 hover:border-blue-200 active:scale-95 transition-all shadow-2xs flex items-center justify-center select-none"
            >
              {digit}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200 active:scale-95 transition-all flex items-center justify-center select-none"
          >
            CLEAR
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-mono font-bold text-xl border border-slate-200 hover:border-blue-200 active:scale-95 transition-all shadow-2xs flex items-center justify-center select-none"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 active:scale-95 transition-all flex items-center justify-center select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick User Profiles */}
        <div className="w-full pt-2 border-t border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 text-center">
            {language === 'ar' ? 'المستخدمون المتاحون للتجربة السريعة' : 'Quick Demo Profiles'}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {cashiers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setPin(c.pin);
                  verifyPin(c.pin);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-[11px] text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${c.role === 'admin' ? 'bg-blue-600' : 'bg-slate-400'}`} />
                <span>{c.nameEn.split(' ')[0]}</span>
                <span className="font-mono text-slate-400 text-[10px]">({c.pin})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
