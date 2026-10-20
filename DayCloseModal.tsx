import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Share2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Clock,
  User,
  X,
  ExternalLink,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { ZReportData } from '../types/pos';
import { EscPosDriver } from '../utils/escpos';

export const DayCloseModal: React.FC = () => {
  const {
    language,
    isCloseShiftModalOpen,
    closeCloseShiftModal,
    currentShift,
    calculateCurrentZReport,
    closeShift,
    settings,
    setPrintableZReport,
  } = usePos();

  const isRtl = language === 'ar';
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<ZReportData | null>(null);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>('');

  const numCounted = parseFloat(actualCashInput) || 0;

  // Real-time calculation as cashier types physical count
  const livePreview = useMemo(() => {
    if (!currentShift) return null;
    return calculateCurrentZReport(numCounted);
  }, [currentShift, calculateCurrentZReport, numCounted]);

  if (!isCloseShiftModalOpen || !currentShift) return null;

  const handleGenerateAndClose = () => {
    const finalReport = closeShift(numCounted);
    setGeneratedReport(finalReport);
    handleSendPushNotification(finalReport);
  };

  const handleSendPushNotification = (report: ZReportData) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`📊 ${settings.shopNameEn} - Z-Report Closed`, {
          body: `Net Revenue: ${report.netRevenue.toFixed(2)} SAR | Cash Diff: ${report.variance >= 0 ? '+' : ''}${report.variance.toFixed(2)} SAR by ${report.cashierName}`,
          icon: settings.logoUrl,
        });
        setPushStatusMessage(language === 'ar' ? 'تم إرسال الإشعار الفوري للمشرف بنجاح!' : 'Push Notification dispatched to Admin!');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(`📊 ${settings.shopNameEn} - Z-Report Closed`, {
              body: `Net: ${report.netRevenue.toFixed(2)} SAR by ${report.cashierName}`,
            });
          }
        });
      }
    } else {
      setPushStatusMessage(language === 'ar' ? 'تم حفظ التقرير في النظام' : 'Report recorded in audit system');
    }
  };

  // One-tap WhatsApp Dispatch generator (wa.me)
  const handleOpenWhatsApp = (report: ZReportData) => {
    const cleanPhone = (settings.adminWhatsApp || '+966501234567').replace(/[^0-9]/g, '');
    const varLabel = report.variance < 0 ? '❌ عجز (Shortage)' : report.variance > 0 ? '✅ فائض (Overage)' : '✨ مطابق (Balanced)';

    const text = `*📊 DAILY SALES Z-REPORT | تقرير الإغلاق اليومي*
━━━━━━━━━━━━━━━━━
🏪 *${settings.shopNameEn}*
📍 *${settings.shopNameAr}*
━━━━━━━━━━━━━━━━━
👤 *Cashier / الكاشير:* ${report.cashierName}
📅 *Date / التاريخ:* ${new Date(report.endTime).toLocaleDateString()}
⏰ *Shift:* ${new Date(report.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ➔ ${new Date(report.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
🧾 *Total Orders:* ${report.orderCount} | *Refunds:* ${report.refundCount}

💳 *SALES BY PAYMENT METHOD:*
💵 Cash (نقدي): ${report.cashSales.toFixed(2)} SAR
💳 Mada (مدى): ${report.madaSales.toFixed(2)} SAR
💳 Visa / MC: ${report.visaSales.toFixed(2)} SAR
📱 Online (إلكتروني): ${report.onlineSales.toFixed(2)} SAR
📑 Due / Credit (آجل): ${report.dueSales.toFixed(2)} SAR
🔻 Discounts: -${report.totalDiscounts.toFixed(2)} SAR
↩️ Refunds: -${report.totalRefunds.toFixed(2)} SAR
━━━━━━━━━━━━━━━━━
💰 *NET REVENUE (صافي الإيرادات):* *${report.netRevenue.toFixed(2)} SAR*
━━━━━━━━━━━━━━━━━
💼 *CASH DRAWER RECONCILIATION:*
🔹 Opening Float: ${report.openingFloat.toFixed(2)} SAR
🔹 Cash Sales: +${report.cashSales.toFixed(2)} SAR
🔹 Expected in Drawer: *${report.expectedCashInDrawer.toFixed(2)} SAR*
💵 Actual Counted: *${report.actualCashCounted.toFixed(2)} SAR*
⚖️ *Variance / الفرق:* *${report.variance >= 0 ? '+' : ''}${report.variance.toFixed(2)} SAR* (${varLabel})
━━━━━━━━━━━━━━━━━
Sent via KAS GOBN POS System`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handlePrintSlip = (report: ZReportData) => {
    setPrintableZReport(report);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                {getTranslation('dayCloseTitle', language)}
              </h2>
              <span className="text-[11px] text-slate-500">
                {getTranslation('dayCloseSubtitle', language)}
              </span>
            </div>
          </div>
          <button
            onClick={closeCloseShiftModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!generatedReport ? (
            <>
              {/* Cashier and Shift Summary Header */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">{getTranslation('activeCashier', language)}</span>
                  <span className="font-bold text-slate-900 text-sm">{currentShift.cashierName}</span>
                </div>
                <div className="text-right rtl:text-left">
                  <span className="text-slate-500 block">{getTranslation('openingCashAmount', language)}</span>
                  <span className="font-mono font-bold text-blue-600">
                    {formatCurrency(currentShift.openingFloat, language, settings.currencyEn, settings.currencyAr)}
                  </span>
                </div>
              </div>

              {/* Physical Cash Counting Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {getTranslation('actualCashCounted', language)} *
                </label>
                <div className="relative">
                  <Banknote className="w-5 h-5 text-blue-600 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-14 rtl:pl-14 rtl:pr-11 py-3 text-2xl font-black font-mono text-blue-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    SAR
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar'
                    ? 'عد جميع الأوراق النقدية والعملات المعدنية الموجودة فعلياً في الدرج الآن.'
                    : 'Count all physical bills and coins inside the cash drawer now.'}
                </p>
              </div>

              {/* Live Reconciliation Breakdown Preview */}
              {livePreview && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 block">{getTranslation('grossSales', language)}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(livePreview.totalGrossSales, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{getTranslation('netRevenue', language)}</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {formatCurrency(livePreview.netRevenue, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Cash Sales (المبيعات النقدية)</span>
                      <span className="font-mono text-slate-800">
                        {formatCurrency(livePreview.cashSales, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mada & Card (الشبكة والبطاقات)</span>
                      <span className="font-mono text-slate-800">
                        {formatCurrency(
                          livePreview.madaSales + livePreview.visaSales + livePreview.onlineSales,
                          language,
                          settings.currencyEn,
                          settings.currencyAr
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Cash Balancing */}
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">{getTranslation('expectedCash', language)}</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(livePreview.expectedCashInDrawer, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">{getTranslation('cashDifference', language)}</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          livePreview.variance < 0
                            ? 'text-rose-600'
                            : livePreview.variance > 0
                            ? 'text-emerald-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {livePreview.variance >= 0 ? '+' : ''}
                        {formatCurrency(livePreview.variance, language, settings.currencyEn, settings.currencyAr)}
                        <span className="text-[10px] block font-normal">
                          {livePreview.variance < 0
                            ? getTranslation('shortage', language)
                            : livePreview.variance > 0
                            ? getTranslation('overage', language)
                            : getTranslation('balanced', language)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm & Close Button */}
              <button
                onClick={handleGenerateAndClose}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{getTranslation('confirmCloseShift', language)}</span>
              </button>
            </>
          ) : (
            /* Z-REPORT GENERATED VIEW */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-emerald-800">
                    {language === 'ar' ? 'تم إغلاق الوردية وتوليد تقرير Z بنجاح!' : 'Day Closed & Z-Report Generated!'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {language === 'ar'
                      ? 'تم تسجيل كافة العمليات والمجاميع، يمكنك الآن إرسال التقرير للمشرف أو طباعته.'
                      : 'Audit is finalized. Dispatch reports via WhatsApp, Push, or Thermal Print.'}
                  </p>
                </div>
              </div>

              {pushStatusMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{pushStatusMessage}</span>
                </div>
              )}

              {/* Full Z-Report Summary Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-500 font-bold border-b border-slate-200 pb-2">
                  <span>METRIC / البند</span>
                  <span>AMOUNT (SAR)</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Sales:</span>
                  <span className="text-slate-800 font-bold">{generatedReport.totalGrossSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discounts:</span>
                  <span className="text-rose-600">-{generatedReport.totalDiscounts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span className="text-slate-800">{generatedReport.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refunds:</span>
                  <span className="text-rose-600">-{generatedReport.totalRefunds.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-700 font-bold pt-1 border-t border-slate-200">
                  <span>NET REVENUE:</span>
                  <span>{generatedReport.netRevenue.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Expected Cash in Drawer:</span>
                  <span>{generatedReport.expectedCashInDrawer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Actual Cash Counted:</span>
                  <span>{generatedReport.actualCashCounted.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between font-bold pt-1 border-t border-slate-200 ${
                    generatedReport.variance < 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  <span>VARIANCE (الفرق):</span>
                  <span>
                    {generatedReport.variance >= 0 ? '+' : ''}
                    {generatedReport.variance.toFixed(2)} SAR
                  </span>
                </div>
              </div>

              {/* ACTION DISPATCH BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. WHATSAPP INSTANT NOTIFICATION */}
                <button
                  onClick={() => handleOpenWhatsApp(generatedReport)}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{getTranslation('sendWhatsAppReport', language)}</span>
                </button>

                {/* 2. PRINT 80MM Z-REPORT */}
                <button
                  onClick={() => handlePrintSlip(generatedReport)}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{getTranslation('printZReport', language)}</span>
                </button>
              </div>

              <button
                onClick={closeCloseShiftModal}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Done / إغلاق النافذة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
