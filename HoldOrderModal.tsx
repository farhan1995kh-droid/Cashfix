import React, { useState } from 'react';
import {
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';

interface HoldOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HoldOrderModal: React.FC<HoldOrderModalProps> = ({ isOpen, onClose }) => {
  const { language, holdCurrentCartOrder, cartTotal, settings, findCustomerByPhone } = usePos();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [recognizedCustomer, setRecognizedCustomer] = useState<{ name: string; orderCount: number } | null>(null);
  const [tableOrPlate, setTableOrPlate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    const matched = findCustomerByPhone(val);
    if (matched) {
      setRecognizedCustomer({ name: matched.name, orderCount: matched.orderCount });
      setCustomerName(matched.name);
    } else {
      setRecognizedCustomer(null);
    }
  };

  const handleConfirmHold = (e: React.FormEvent) => {
    e.preventDefault();
    holdCurrentCartOrder(customerName.trim(), customerPhone.trim(), tableOrPlate.trim(), notes.trim());
    onClose();
    setCustomerName('');
    setCustomerPhone('');
    setRecognizedCustomer(null);
    setTableOrPlate('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-slate-800 max-h-[96dvh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                {getTranslation('holdOrder', language)}
              </h2>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block">
                {language === 'ar' ? 'تعليق الطلب في قائمة الانتظار للمحاسبة لاحقاً' : 'Move to Advance Orders queue (Unpaid)'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleConfirmHold} className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-xs overflow-y-auto flex-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500">{getTranslation('total', language)}</span>
            <span className="font-mono text-base font-black text-blue-600">
              {formatCurrency(cartTotal, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold block">
                {getTranslation('customerPhone', language)} (Optional)
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">
                {language === 'ar' ? 'البحث التلقائي عن اسم العميل' : 'Auto-fetches customer name'}
              </span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {recognizedCustomer && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {language === 'ar'
                  ? `عميل مسجل: ${recognizedCustomer.name} (${recognizedCustomer.orderCount} طلبات سابقة)`
                  : `Customer auto-detected: ${recognizedCustomer.name} (${recognizedCustomer.orderCount} prior visits)`}
              </span>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {getTranslation('customerName', language)} (Optional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Khalid Al-Mutairi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {getTranslation('yourTableOrPlate', language)} (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableOrPlate}
                onChange={(e) => setTableOrPlate(e.target.value)}
                placeholder="Table 3 / Car Plate 4492"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {language === 'ar' ? 'ملاحظة خاصة على الطلب' : 'Special Instructions / Notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Call customer when order is bagged"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>{getTranslation('holdOrder', language)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
