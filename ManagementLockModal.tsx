import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Phone,
  Sparkles,
  Copy,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { getTranslation } from '../utils/translations';

interface ManagementLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManagementLockModal: React.FC<ManagementLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    language,
    settings,
    cashiers,
    twoFactorTargetPhone,
    sendManagementWhatsApp2FA,
    verifyManagement2FA,
    twoFactorLastSentCode,
  } = usePos();

  const isRtl = language === 'ar';

  const [pin, setPin] = useState('');
  const [code, setCode] = useState('');
  const [hasSentWhatsApp, setHasSentWhatsApp] = useState(false);
  const [sentCodePreview, setSentCodePreview] = useState<string | null>(null);
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const adminCashier = cashiers.find((c) => c.role === 'admin' && c.isActive);

  const handleSendWhatsAppCode = () => {
    setErrorMsg('');
    const res = sendManagementWhatsApp2FA();
    setHasSentWhatsApp(true);
    setSentCodePreview(res.code);
    setWhatsappDirectUrl(res.whatsappUrl);
  };

  const handleQuickFillCode = () => {
    if (sentCodePreview) {
      setCode(sentCodePreview);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pin) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال رمز المشرف (PIN)' : 'Please enter manager PIN');
      return;
    }

    if (!code) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام المرسل عبر واتساب'
          : 'Please enter the 6-digit WhatsApp 2FA code'
      );
      return;
    }

    const result = verifyManagement2FA(pin.trim(), code.trim());
    if (result.success) {
      onSuccess();
    } else {
      setErrorMsg(result.error || (language === 'ar' ? 'فشل التحقق' : 'Verification failed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  {getTranslation('managementLockTitle', language)}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  2FA Lock
                </span>
              </div>
              <p className="text-xs text-blue-100">
                {getTranslation('managementLockSubtitle', language)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Manager PIN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'ar' ? 'الخطوة 1: رمز المشرف (Manager PIN)' : 'Step 1: Manager Master PIN'}
                </span>
              </label>
              <span className="text-[11px] text-slate-400">
                {adminCashier ? adminCashier.nameEn : 'Manager'} (Default: 1234)
              </span>
            </div>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-slate-900 placeholder-slate-300 focus:outline-none transition-all shadow-inner"
              autoFocus
            />
          </div>

          {/* STEP 2: WhatsApp Two-Step Verification */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'ar'
                    ? 'الخطوة 2: التحقق عبر واتساب (WhatsApp 2FA)'
                    : 'Step 2: WhatsApp Two-Step Verification'}
                </span>
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{twoFactorTargetPhone}</span>
              </span>
            </div>

            {/* Send Code Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSendWhatsAppCode}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>
                  {hasSentWhatsApp
                    ? language === 'ar'
                      ? 'إعادة إرسال الرمز لواتساب'
                      : 'Resend WhatsApp Code'
                    : getTranslation('sendWhatsappCode', language)}
                </span>
              </button>

              {whatsappDirectUrl && (
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Open in WhatsApp Web / App"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
            </div>

            {/* Notification Simulation Card */}
            {hasSentWhatsApp && sentCodePreview && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between text-emerald-900 font-bold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {language === 'ar'
                        ? 'تم إرسال كود التحقق لواتساب المشرف'
                        : '2FA Code Dispatched to Management WhatsApp'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFillCode}
                    className="px-2 py-0.5 rounded-lg bg-emerald-200 hover:bg-emerald-300 text-emerald-900 font-black text-[10px] transition-colors"
                  >
                    {language === 'ar' ? 'تعبئة تلقائية' : 'Quick Fill'}
                  </button>
                </div>
                <div className="p-2 bg-white rounded-xl border border-emerald-200 font-mono text-center flex items-center justify-between px-3">
                  <span className="text-slate-500 text-[11px]">OTP Code:</span>
                  <span className="font-extrabold text-base tracking-widest text-emerald-700">
                    {sentCodePreview}
                  </span>
                  <span className="text-[10px] text-slate-400">5 min expiry</span>
                </div>
              </div>
            )}

            {/* Code Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">
                {language === 'ar' ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter 6-digit WhatsApp Code'}
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-center text-xl font-mono tracking-widest text-slate-900 placeholder-slate-300 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>{getTranslation('unlockManagement', language)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
