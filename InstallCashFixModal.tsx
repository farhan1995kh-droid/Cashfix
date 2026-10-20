import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  WifiOff,
  Zap,
  Printer,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Tablet,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useDeviceAndPwa } from '../hooks/useDeviceAndPwa';
import { usePos } from '../context/PosContext';

interface InstallCashFixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallCashFixModal: React.FC<InstallCashFixModalProps> = ({ isOpen, onClose }) => {
  const { language } = usePos();
  const { isIos, isAndroid, isStandalone, canInstallPrompt, promptInstall } = useDeviceAndPwa();
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isIos ? 'ios' : 'android');
  const [installedStatus, setInstalledStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isRtl = language === 'ar';

  const handleNativeInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstalledStatus('accepted');
      setTimeout(() => {
        onClose();
      }, 2500);
    } else if (outcome === 'dismissed') {
      setInstalledStatus('dismissed');
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header with Gradient Accent */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">
                  {isRtl ? 'تثبيت تطبيق CashFix' : 'Install CashFix App'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[10px] font-black uppercase">
                  iOS & Android
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                {isRtl
                  ? 'يعمل بكامل وظائفه بدون إنترنت مع شاشة كاملة وطباعة سريعة'
                  : 'Full offline availability, zero browser bars, high-speed printing'}
              </p>
            </div>
          </div>

          {/* Standalone Status Pill */}
          {isStandalone && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                {isRtl
                  ? 'تم تثبيت CashFix بالفعل ويعمل كـتطبيق أصلي مثبت!'
                  : 'CashFix is already installed and running as a native standalone app!'}
              </span>
            </div>
          )}
        </div>

        {/* OS Platform Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {/* Apple Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.83 1.45-.59.68-1.12 1.77-.98 2.82 1.12.09 2.22-.55 2.85-1.32z" />
            </svg>
            <span>Apple iOS (iPhone & iPad)</span>
            {isIos && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {/* Android Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.1 12 8.1s-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
            </svg>
            <span>Android (Tablet & Phone)</span>
            {isAndroid && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* iOS INSTRUCTIONS */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Tablet className="w-4 h-4 text-blue-600" />
                  <span>
                    {isRtl
                      ? 'خطوات التثبيت على أجهزة آبل (آيفون وآيباد) عبر Safari:'
                      : 'Steps to install CashFix on iPhone & iPad via Safari:'}
                  </span>
                </h3>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isRtl ? 'اضغط على زر المشاركة (Share)' : 'Tap the Share button in Safari'}</span>
                    <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    {isRtl
                      ? 'موجود في أسفل الشاشة على الآيفون أو في أعلى الشاشة بجانب شريط العناوين على الآيباد.'
                      : 'Found at the bottom bar on iPhone, or top bar near address on iPad.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>
                      {isRtl ? 'اختر "إضافة إلى الصفحة الرئيسية"' : 'Select "Add to Home Screen"'}
                    </span>
                    <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    {isRtl
                      ? 'مرر للأسفل في قائمة الخيارات وانقر على خيار "إضافة إلى الصفحة الرئيسية (+)".'
                      : 'Scroll down the Safari action menu and tap "Add to Home Screen".'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900">
                    {isRtl ? 'اضغط على "إضافة" (Add) في الزاوية العلوية' : 'Tap "Add" in the top right corner'}
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    {isRtl
                      ? 'سيظهر أيقونة تطبيق CashFix على شاشتك الرئيسية فوراً ويعمل بكامل الشاشة وبدون إنترنت!'
                      : 'CashFix will appear on your iOS home screen as a standalone full-screen native app!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ANDROID INSTRUCTIONS & 1-TAP INSTALL */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isRtl
                      ? 'تثبيت بنقرة واحدة على أجهزة أندرويد (أجهزة الكاشير وهواتف أندرويد):'
                      : '1-Tap instant install for Android tablets, POS terminals & phones:'}
                  </span>
                </h3>
              </div>

              {/* Native Prompt Button if available */}
              {canInstallPrompt ? (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-2xl font-black text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    {isRtl ? 'تثبيت CashFix الآن على أندرويد' : 'Install CashFix on Android Now'}
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">
                        {isRtl ? 'افتح قائمة المتصفح (⋮ الثلاث نقاط)' : 'Tap the browser menu (⋮ 3 dots)'}
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {isRtl
                          ? 'في الزاوية العلوية لمتصفح Chrome أو Edge على جهاز أندرويد.'
                          : 'In the top right corner of Chrome or Edge on Android.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>
                          {isRtl
                            ? 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"'
                            : 'Select "Install app" or "Add to Home screen"'}
                        </span>
                        <Download className="w-3.5 h-3.5 text-emerald-600 inline" />
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {isRtl
                          ? 'سيتم تنزيل أيقونة التطبيق والعمل في وضع الشاشة الكاملة مثل أي تطبيق أندرويد أصلي.'
                          : 'The app icon is added to your app drawer and launches in fullscreen kiosk mode.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {installedStatus === 'accepted' && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isRtl ? 'جاري التثبيت على جهازك...' : 'Installing CashFix on your device...'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Key POS Features included on both iOS & Android */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              {isRtl ? 'مميزات النظام المثبت على الهواتف والأجهزة اللوحية' : 'Mobile & Tablet App Capabilities'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-700">
                  {isRtl ? 'يعمل 100% أوفلاين' : '100% Offline Ready'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-700">
                  {isRtl ? 'طباعة حرارية 80mm' : 'Wi-Fi POS Thermal'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-slate-700">
                  {isRtl ? 'شاشة كاملة بدون متصفح' : 'Fullscreen POS Mode'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-700">
                  {isRtl ? 'أمان وتحقق 2FA' : '2FA WhatsApp Security'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">{isRtl ? 'تم نسخ الرابط!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{isRtl ? 'نسخ رابط التطبيق' : 'Copy App URL'}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold transition-all cursor-pointer"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
