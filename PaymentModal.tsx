import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Smartphone,
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Unlock,
  AlertCircle,
  User,
  Phone,
  ArrowRight,
  ShoppingBag,
  Store,
  Utensils,
  Car,
  QrCode,
  Bike,
  Layers,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Order, OrderPayment, PaymentMethod, OrderSource, CartItem, SplitPaymentEntry } from '../types/pos';
import { DELIVERY_PLATFORMS } from '../data/initialData';

interface PaymentModalProps {
  orderToPay: Order | null;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ orderToPay, onClose }) => {
  const {
    language,
    settings,
    completeOrderPayment,
    currentShift,
    openStartShiftModal,
    findCustomerByPhone,
    orderSources,
    selectedSourceId,
    setSelectedSourceId,
  } = usePos();

  const isRtl = language === 'ar';
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [chosenSourceId, setChosenSourceId] = useState<string>('src_offline');
  const [selectedDeliveryPlatform, setSelectedDeliveryPlatform] = useState<string>('hungerstation');
  const [tableOrPlate, setTableOrPlate] = useState<string>('');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Due / Credit customer fields
  const [dueCustomerName, setDueCustomerName] = useState<string>('');
  const [dueCustomerPhone, setDueCustomerPhone] = useState<string>('');
  const [dueCustomerRecognized, setDueCustomerRecognized] = useState<{ name: string; orderCount: number } | null>(null);
  const [dueNotes, setDueNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Split Payment (Mixed Payment Methods) state
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCashTendered, setSplitCashTendered] = useState<string>('');
  const [splitMada, setSplitMada] = useState<string>('');
  const [splitDue, setSplitDue] = useState<string>('');
  const [showSplitDue, setShowSplitDue] = useState<boolean>(false);

  // Check if current order is an Online Order (Third-party delivery platforms)
  const isOnlineOrder =
    chosenSourceId === 'src_online' ||
    Boolean(orderSources.find((s) => s.id === chosenSourceId)?.isDelivery);

  // DUAL PRICING: Dynamically reprice order items based on whether order type is Online vs Offline
  const repricedItems: CartItem[] = useMemo(() => {
    if (!orderToPay) return [];
    return orderToPay.items.map((item: CartItem) => {
      const activeUnitPrice = isOnlineOrder
        ? (item.product.onlinePrice ?? item.product.price)
        : item.product.price;
      return {
        ...item,
        customPrice: activeUnitPrice,
      };
    });
  }, [orderToPay, isOnlineOrder]);

  const repricedSubtotal = useMemo(() => {
    return repricedItems.reduce(
      (sum: number, item: CartItem) => sum + (item.customPrice ?? item.product.price) * item.quantity,
      0
    );
  }, [repricedItems]);

  const discountAmount = useMemo(() => {
    if (!orderToPay || orderToPay.discountValue <= 0) return 0;
    if (orderToPay.discountType === 'percentage') {
      return (repricedSubtotal * orderToPay.discountValue) / 100;
    }
    return Math.min(repricedSubtotal, orderToPay.discountValue);
  }, [orderToPay, repricedSubtotal]);

  const orderTotal = Math.max(0, repricedSubtotal - discountAmount);
  const numTendered = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, numTendered - orderTotal);

  // Split payment mathematical calculations
  const numSplitCash = Math.max(0, parseFloat(splitCash) || 0);
  const numSplitMada = Math.max(0, parseFloat(splitMada) || 0);
  const numSplitDue = showSplitDue ? Math.max(0, parseFloat(splitDue) || 0) : 0;
  const totalSplitEntered = Math.round((numSplitCash + numSplitMada + numSplitDue) * 100) / 100;
  const splitRemaining = Math.round((orderTotal - totalSplitEntered) * 100) / 100;
  const isSplitBalanced = Math.abs(splitRemaining) < 0.01 && totalSplitEntered > 0;

  // Change calculation for Cash portion in split payments
  const numSplitCashTendered = parseFloat(splitCashTendered) || 0;
  const splitCashChangeDue =
    numSplitCash > 0 && numSplitCashTendered > numSplitCash
      ? Math.round((numSplitCashTendered - numSplitCash) * 100) / 100
      : 0;

  const handleFillRemainder = (target: 'cash' | 'mada' | 'due') => {
    if (splitRemaining <= 0) return;
    if (target === 'cash') {
      const nextVal = Math.round((numSplitCash + splitRemaining) * 100) / 100;
      setSplitCash(nextVal.toFixed(2));
    } else if (target === 'mada') {
      const nextVal = Math.round((numSplitMada + splitRemaining) * 100) / 100;
      setSplitMada(nextVal.toFixed(2));
    } else if (target === 'due') {
      const nextVal = Math.round((numSplitDue + splitRemaining) * 100) / 100;
      setSplitDue(nextVal.toFixed(2));
    }
  };

  const handleFiftyFiftySplit = () => {
    const half = Math.round((orderTotal / 2) * 100) / 100;
    const remainder = Math.round((orderTotal - half) * 100) / 100;
    setSplitCash(half.toFixed(2));
    setSplitMada(remainder.toFixed(2));
    setSplitDue('');
    setShowSplitDue(false);
    setSplitCashTendered('');
  };

  const handleResetSplits = () => {
    setSplitCash('');
    setSplitMada('');
    setSplitDue('');
    setShowSplitDue(false);
    setSplitCashTendered('');
  };

  const handleDuePhoneChange = (val: string) => {
    setDueCustomerPhone(val);
    const matched = findCustomerByPhone(val);
    if (matched) {
      setDueCustomerRecognized({ name: matched.name, orderCount: matched.orderCount });
      setDueCustomerName(matched.name);
    } else {
      setDueCustomerRecognized(null);
    }
  };

  useEffect(() => {
    if (orderToPay) {
      const initialSource = orderToPay.sourceId || selectedSourceId || 'src_offline';
      setChosenSourceId(initialSource);
      const isOnline = initialSource === 'src_online';
      if (isOnline) {
        setSelectedMethod('online');
      } else {
        setSelectedMethod('cash');
      }
      setTableOrPlate(orderToPay.tableOrPlate || '');
      if (orderToPay.customerName) setDueCustomerName(orderToPay.customerName);
      if (orderToPay.customerPhone) setDueCustomerPhone(orderToPay.customerPhone);
    }
  }, [orderToPay, selectedSourceId]);

  // When orderTotal updates or online mode changes, keep tender amount updated
  useEffect(() => {
    if (isOnlineOrder || selectedMethod !== 'cash') {
      setTenderedAmount(orderTotal.toFixed(2));
    }
  }, [orderTotal, isOnlineOrder, selectedMethod]);

  if (!orderToPay) return null;

  // Quick cash tender amount options (Exact, next 10, 50, 100, 500 SAR)
  const quickTenders = [
    orderTotal,
    Math.ceil(orderTotal / 10) * 10,
    50,
    100,
    200,
    500,
  ].filter((v, idx, arr) => v >= orderTotal && arr.indexOf(v) === idx);

  const getSourceIcon = (src: OrderSource) => {
    const id = src.id.toLowerCase();
    const name = src.nameEn.toLowerCase();
    if (name.includes('dine') || name.includes('table') || id.includes('dine')) return <Utensils className="w-4 h-4 text-emerald-600" />;
    if (name.includes('car') || name.includes('drive') || id.includes('car')) return <Car className="w-4 h-4 text-amber-600" />;
    if (name.includes('takeaway') || name.includes('takeout') || id.includes('takeaway')) return <ShoppingBag className="w-4 h-4 text-purple-600" />;
    if (name.includes('qr') || id.includes('qr')) return <QrCode className="w-4 h-4 text-sky-600" />;
    if (src.isDelivery || name.includes('hunger') || name.includes('jahez') || name.includes('toyou') || name.includes('keeta')) {
      return <Bike className="w-4 h-4 text-indigo-600" />;
    }
    return <Store className="w-4 h-4 text-blue-600" />;
  };

  const handleCompleteSale = async () => {
    setErrorMsg('');

    // If shift is closed, prompt cashier
    if (!currentShift) {
      setErrorMsg(
        language === 'ar'
          ? 'الوردية مغلقة! يرجى فتح الوردية أولاً لتسجيل العمليات.'
          : 'Shift is closed! Please open a shift first.'
      );
      return;
    }

    // Validation for Cash
    if (selectedMethod === 'cash' && numTendered < orderTotal) {
      setErrorMsg(
        language === 'ar'
          ? 'المبلغ المدفوع أقل من إجمالي الفاتورة!'
          : 'Tendered cash is less than the order total!'
      );
      return;
    }

    // Validation for Due / Credit
    if (selectedMethod === 'due') {
      if (!dueCustomerName.trim() || !dueCustomerPhone.trim()) {
        setErrorMsg(
          language === 'ar'
            ? 'اسم العميل ورقم الجوال مطلوبان لتسجيل الحساب الآجل!'
            : 'Debtor customer name and phone are required for Due/Credit sales!'
        );
        return;
      }
    }

    // Validation for Split Payments (Mixed Methods)
    if (selectedMethod === 'split') {
      if (!isSplitBalanced) {
        if (splitRemaining > 0) {
          setErrorMsg(
            language === 'ar'
              ? `مجموع الدفع المجزأ (${totalSplitEntered.toFixed(2)} ر.س) لا يطابق إجمالي الفاتورة (${orderTotal.toFixed(2)} ر.س)! المتبقي للتوزيع: ${splitRemaining.toFixed(2)} ر.س`
              : `Split amounts sum (${totalSplitEntered.toFixed(2)} SAR) does not match Total Bill (${orderTotal.toFixed(2)} SAR)! Remaining: ${splitRemaining.toFixed(2)} SAR`
          );
        } else {
          setErrorMsg(
            language === 'ar'
              ? `مجموع الدفع المجزأ (${totalSplitEntered.toFixed(2)} ر.س) يتجاوز إجمالي الفاتورة بمقدار ${Math.abs(splitRemaining).toFixed(2)} ر.س!`
              : `Split amounts sum (${totalSplitEntered.toFixed(2)} SAR) exceeds Total Bill by ${Math.abs(splitRemaining).toFixed(2)} SAR!`
          );
        }
        return;
      }

      if (numSplitCash > 0 && numSplitCashTendered > 0 && numSplitCashTendered < numSplitCash) {
        setErrorMsg(
          language === 'ar'
            ? `المبلغ المستلم نقداً (${numSplitCashTendered.toFixed(2)} ر.س) أقل من حصة الكاش (${numSplitCash.toFixed(2)} ر.س)!`
            : `Cash tendered (${numSplitCashTendered.toFixed(2)} SAR) is less than required cash portion (${numSplitCash.toFixed(2)} SAR)!`
        );
        return;
      }

      if (numSplitDue > 0 && (!dueCustomerName.trim() || !dueCustomerPhone.trim())) {
        setErrorMsg(
          language === 'ar'
            ? 'اسم العميل ورقم الجوال مطلوبان لتسجيل حصة الحساب الآجل في الدفع المجزأ!'
            : 'Debtor customer name and phone are required for the Due/Credit portion!'
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const chosenSource = orderSources.find((s) => s.id === chosenSourceId) || orderSources[0];

      let payment: OrderPayment;

      if (isOnlineOrder) {
        // FOR ONLINE ORDERS: Already prepaid by third-party delivery platforms
        const chosenPlatform =
          DELIVERY_PLATFORMS.find((p) => p.id === selectedDeliveryPlatform) || DELIVERY_PLATFORMS[0];
        payment = {
          method: 'online',
          deliveryPlatformName: isRtl ? chosenPlatform.nameAr : chosenPlatform.nameEn,
          tenderAmount: orderTotal,
          changeDue: 0,
          paidAt: new Date().toISOString(),
        };
      } else if (selectedMethod === 'split') {
        // FOR SPLIT / MIXED PAYMENTS
        const splits: SplitPaymentEntry[] = [];
        if (numSplitCash > 0) {
          splits.push({
            method: 'cash',
            amount: numSplitCash,
            cashTendered: numSplitCashTendered > numSplitCash ? numSplitCashTendered : numSplitCash,
            changeDue: splitCashChangeDue,
          });
        }
        if (numSplitMada > 0) {
          splits.push({
            method: 'mada',
            amount: numSplitMada,
          });
        }
        if (numSplitDue > 0) {
          splits.push({
            method: 'due',
            amount: numSplitDue,
            dueCustomer: {
              name: dueCustomerName.trim(),
              phone: dueCustomerPhone.trim(),
              notes: dueNotes.trim(),
            },
          });
        }

        const totalTender =
          (numSplitCashTendered > numSplitCash ? numSplitCashTendered : numSplitCash) +
          numSplitMada +
          numSplitDue;

        payment = {
          method: 'split',
          isSplit: true,
          splits,
          tenderAmount: totalTender,
          changeDue: splitCashChangeDue,
          paidAt: new Date().toISOString(),
          dueCustomer:
            numSplitDue > 0
              ? {
                  name: dueCustomerName.trim(),
                  phone: dueCustomerPhone.trim(),
                  notes: dueNotes.trim(),
                }
              : undefined,
        };
      } else {
        // FOR OFFLINE ORDERS: Strictly Single Cash, Mada, or Due / Credit
        payment = {
          method: selectedMethod === 'due' ? 'due' : selectedMethod === 'mada' ? 'mada' : 'cash',
          tenderAmount: selectedMethod === 'cash' ? numTendered : orderTotal,
          changeDue: selectedMethod === 'cash' ? changeDue : 0,
          paidAt: new Date().toISOString(),
          dueCustomer:
            selectedMethod === 'due'
              ? {
                  name: dueCustomerName.trim(),
                  phone: dueCustomerPhone.trim(),
                  notes: dueNotes.trim(),
                }
              : undefined,
        };
      }

      const updatedOrderToPay: Order = {
        ...orderToPay,
        sourceId: chosenSource.id,
        sourceNameEn: chosenSource.nameEn,
        sourceNameAr: chosenSource.nameAr,
        items: repricedItems,
        subtotal: repricedSubtotal,
        discountAmount,
        total: orderTotal,
        tableOrPlate: tableOrPlate.trim() || orderToPay.tableOrPlate,
      };

      await completeOrderPayment(updatedOrderToPay, payment);
      onClose();
    } catch (e) {
      console.error(e);
      setErrorMsg('Payment settlement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96dvh] sm:max-h-[94vh] text-slate-800">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
              #{orderToPay.dailyOrderNumber}
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                {getTranslation('checkoutTitle', language)}
              </h2>
              <span className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:inline block truncate">
                {language === 'ar' ? 'حدد قناة الطلب وطريقة الدفع لإتمام الفاتورة' : 'Select Order Source & Payment Method'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right rtl:text-left">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                {getTranslation('total', language)} (VAT Incl.)
              </span>
              <span className="font-mono text-base sm:text-xl font-black text-blue-600">
                {formatCurrency(orderTotal, language, settings.currencyEn, settings.currencyAr)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-COLUMN SPLIT CHECKOUT BODY (Left: Order Source, Right: Payment Method) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 text-xs">
          {/* ================= COLUMN 1 (5 cols): ORDER SOURCE SELECTION ================= */}
          <div className="md:col-span-5 flex flex-col space-y-4 border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-slate-200 pb-4 md:pb-0 md:pr-5 rtl:md:pr-0 rtl:md:pl-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                {language === 'ar' ? '1. قناة ومصدر الطلب (Order Source)' : '1. Select Order Channel / Source'}
              </span>
              <p className="text-[11px] text-slate-500">
                {language === 'ar'
                  ? 'اختر القناة المحددة للطلب (كاونتر، محلي، سفري، تطبيقات التوصيل)'
                  : 'Choose customer ordering channel (Walk-in, Dine-in, Delivery App)'}
              </p>
            </div>

            {/* Order Sources Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {orderSources
                .filter((s) => s.isActive)
                .map((src) => {
                  const isSelected = chosenSourceId === src.id;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setChosenSourceId(src.id)}
                      className={`p-3 rounded-2xl border text-left rtl:text-right transition-all flex flex-col justify-between gap-1 shadow-2xs ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-900 font-black'
                          : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {getSourceIcon(src)}
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="mt-1">
                        <span className="text-xs font-bold block truncate leading-tight">
                          {isRtl ? src.nameAr : src.nameEn}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {isRtl ? src.nameEn : src.nameAr}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Table / Car Plate input */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                {language === 'ar' ? 'رقم الطاولة أو لوحة السيارة (اختياري)' : 'Table # or Car Plate (Optional)'}
              </label>
              <input
                type="text"
                value={tableOrPlate}
                onChange={(e) => setTableOrPlate(e.target.value)}
                placeholder="e.g. Table 4 / طاولة 4"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Order Items Preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'ar' ? 'الأصناف في الفاتورة:' : 'Order Items:'} ({repricedItems.length})
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-[11px]">
                {repricedItems.map((it: CartItem, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span className="truncate">
                      {it.quantity}x {isRtl ? it.product.nameAr : it.product.nameEn}
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
                      {((it.customPrice ?? it.product.price) * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2 (7 cols): PAYMENT METHOD & SETTLEMENT ================= */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                {isOnlineOrder
                  ? language === 'ar'
                    ? '2. اختيار شركة التوصيل (الطلب مدفوع مسبقاً عبر المنصة)'
                    : '2. Select Delivery Platform (Prepaid by App)'
                  : language === 'ar'
                  ? '2. طريقة الدفع والحساب (Payment Method)'
                  : '2. Payment Method & Settlement'}
              </span>
            </div>

            {/* CASE A: ONLINE ORDERS -> ONLY display names of food delivery companies / platforms */}
            {isOnlineOrder ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DELIVERY_PLATFORMS.map((platform) => {
                    const isSelected = selectedDeliveryPlatform === platform.id;
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => setSelectedDeliveryPlatform(platform.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-900 font-black'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center">
                          <Bike className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold block truncate">
                          {isRtl ? platform.nameAr : platform.nameEn}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {isRtl ? platform.nameEn : platform.nameAr}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white mt-0.5">
                            {language === 'ar' ? 'مدفوع إلكترونياً' : 'Prepaid'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Platform Prepaid Guarantee Notice */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? `طلب مدفوع مسبقاً عبر ${
                            DELIVERY_PLATFORMS.find((p) => p.id === selectedDeliveryPlatform)?.nameAr || 'المنصة'
                          }`
                        : `Prepaid by ${
                            DELIVERY_PLATFORMS.find((p) => p.id === selectedDeliveryPlatform)?.nameEn || 'Platform'
                          }`}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    {language === 'ar'
                      ? 'الطلب مسدد بالكامل مسبقاً من خلال تطبيق التوصيل، لا يلزم تحصيل أي مبالغ نقدية أو بنكية من السائق.'
                      : 'Orders coming from third-party delivery platforms are prepaid. No cash or card collection needed at the counter.'}
                  </p>
                  <div className="pt-1 flex items-center justify-between font-mono font-black text-xs text-blue-950">
                    <span>{language === 'ar' ? 'المبلغ المحاسب للمنصة:' : 'Billed to Platform:'}</span>
                    <span>{orderTotal.toFixed(2)} SAR</span>
                  </div>
                </div>
              </div>
            ) : (
              /* CASE B: OFFLINE ORDERS -> Strictly 1. Cash, 2. Mada, 3. Due / Credit */
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 1. Cash */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cash')}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs ${
                      selectedMethod === 'cash'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-700 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold">{getTranslation('cash', language)}</span>
                  </button>

                  {/* 2. Mada */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('mada')}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs ${
                      selectedMethod === 'mada'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-700 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold">{getTranslation('mada', language)}</span>
                  </button>

                  {/* 3. Due / Credit */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('due')}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs ${
                      selectedMethod === 'due'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 text-amber-800 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">{getTranslation('dueCredit', language)}</span>
                  </button>

                  {/* 4. Split Payment (Mixed Methods) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod('split');
                      // If no split amounts are set yet, pre-fill with 50/50 for convenience
                      if (!splitCash && !splitMada && !splitDue) {
                        const half = Math.round((orderTotal / 2) * 100) / 100;
                        const remainder = Math.round((orderTotal - half) * 100) / 100;
                        setSplitCash(half.toFixed(2));
                        setSplitMada(remainder.toFixed(2));
                      }
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs relative ${
                      selectedMethod === 'split'
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20 text-purple-800 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold">{getTranslation('splitPayment', language)}</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700">
                      Mixed
                    </span>
                  </button>
                </div>

                {/* CASH PAYMENT TENDER & CHANGE CALCULATION */}
                {selectedMethod === 'cash' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-bold">
                        {getTranslation('tenderAmount', language)} ({settings.currencyEn})
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Exact: {orderTotal.toFixed(2)} SAR
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={tenderedAmount}
                        onChange={(e) => setTenderedAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xl font-black font-mono text-blue-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {quickTenders.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTenderedAmount(amt.toFixed(2))}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-mono font-bold text-xs border border-slate-200 shadow-2xs transition-all active:scale-95"
                        >
                          {amt.toFixed(2)} SAR
                        </button>
                      ))}
                    </div>

                    {/* Change Calculation Display */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{getTranslation('changeDue', language)}</span>
                      <span
                        className={`font-mono text-xl font-black ${
                          changeDue > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {formatCurrency(changeDue, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                    </div>
                  </div>
                )}

                {/* MADA TERMINAL CONFIRMATION BANNER */}
                {selectedMethod === 'mada' && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 text-blue-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>{language === 'ar' ? 'الدفع عبر جهاز مدى (Mada POS Terminal)' : 'Mada Terminal Payment'}</span>
                    </div>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      {language === 'ar'
                        ? 'قم بتمرير أو إدخال بطاقة مدى في جهاز الشبكة البنكية، ثم انقر على إتمام الدفع لطباعة الفواتير.'
                        : 'Tap or insert Mada card on the POS payment terminal, then finalize below to print receipts.'}
                    </p>
                    <div className="pt-1 flex items-center justify-between font-mono font-black text-xs text-blue-900">
                      <span>Authorized Amount:</span>
                      <span>{orderTotal.toFixed(2)} SAR</span>
                    </div>
                  </div>
                )}

                {/* SPLIT / MIXED PAYMENT INTERACTIVE CONTROLS */}
                {selectedMethod === 'split' && (
                  <div className="space-y-3.5 p-4 bg-purple-50/40 rounded-2xl border border-purple-200 text-slate-800">
                    {/* Header with Balance Indicator & Quick Controls */}
                    <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {language === 'ar' ? 'إجمالي الفاتورة المطلوبة' : 'Grand Total Due'}
                          </span>
                          <span className="font-mono text-lg font-black text-slate-900">
                            {orderTotal.toFixed(2)} SAR
                          </span>
                        </div>

                        <div className="text-right rtl:text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {language === 'ar' ? 'المجموع المدخل' : 'Allocated Split'}
                          </span>
                          <span className="font-mono text-lg font-black text-purple-700">
                            {totalSplitEntered.toFixed(2)} SAR
                          </span>
                        </div>
                      </div>

                      {/* Status Banner */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        {isSplitBalanced ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {language === 'ar' ? 'المبلغ مطابق 100% وجاهز للدفع ✓' : 'Amounts Matched & Balanced 100% ✓'}
                            </span>
                          </div>
                        ) : splitRemaining > 0 ? (
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              {language === 'ar'
                                ? `متبقي للتوزيع: ${splitRemaining.toFixed(2)} ر.س`
                                : `Remaining to allocate: ${splitRemaining.toFixed(2)} SAR`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              {language === 'ar'
                                ? `زيادة عن الفاتورة بمقدار: ${Math.abs(splitRemaining).toFixed(2)} ر.س`
                                : `Exceeds total by: ${Math.abs(splitRemaining).toFixed(2)} SAR`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleFiftyFiftySplit}
                            className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition-all"
                            title="Split 50% Cash & 50% Mada"
                          >
                            50/50
                          </button>
                          <button
                            type="button"
                            onClick={handleResetSplits}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 transition-all"
                            title="Reset all splits"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{language === 'ar' ? 'تصفير' : 'Reset'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 1. Cash Split Row */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Banknote className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">
                              {language === 'ar' ? 'حصة الدفع نقداً (Cash)' : 'Cash Payment Portion'}
                            </span>
                          </div>
                        </div>

                        {splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFillRemainder('cash')}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{language === 'ar' ? 'إضافة المتبقي' : '+ Fill Remainder'}</span>
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={splitCash}
                          onChange={(e) => setSplitCash(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                        <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2 text-[11px] font-bold text-slate-400">
                          {settings.currencyEn}
                        </span>
                      </div>

                      {/* Cash Tendered & Change Due inside Split */}
                      {numSplitCash > 0 && (
                        <div className="mt-2 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-emerald-900">
                              {language === 'ar' ? 'المبلغ المستلم نقداً (Tendered Cash):' : 'Cash Tendered by Customer:'}
                            </span>
                            <span className="text-slate-500">
                              Portion: {numSplitCash.toFixed(2)} SAR
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              value={splitCashTendered}
                              onChange={(e) => setSplitCashTendered(e.target.value)}
                              placeholder={numSplitCash.toFixed(2)}
                              className="w-32 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />

                            {/* Quick Tender Bills */}
                            <div className="flex flex-wrap gap-1">
                              {[
                                numSplitCash,
                                Math.ceil(numSplitCash / 10) * 10,
                                20,
                                50,
                                100,
                                200,
                                500,
                              ]
                                .filter((v, idx, arr) => v >= numSplitCash && arr.indexOf(v) === idx)
                                .slice(0, 4)
                                .map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setSplitCashTendered(amt.toFixed(2))}
                                    className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold"
                                  >
                                    {amt}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Split Cash Change Due Output */}
                          <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                            <span className="font-extrabold text-emerald-950">
                              {language === 'ar' ? 'باقي النقد للعميل (Change Due):' : 'Change Due to Customer:'}
                            </span>
                            <span
                              className={`font-mono text-sm font-black ${
                                splitCashChangeDue > 0 ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {formatCurrency(splitCashChangeDue, language, settings.currencyEn, settings.currencyAr)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Mada Card Split Row */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">
                              {language === 'ar' ? 'حصة بطاقة مدى / شبكة (Mada Card)' : 'Mada Card Portion'}
                            </span>
                          </div>
                        </div>

                        {splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFillRemainder('mada')}
                            className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{language === 'ar' ? 'إضافة المتبقي' : '+ Fill Remainder'}</span>
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={splitMada}
                          onChange={(e) => setSplitMada(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                        <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2 text-[11px] font-bold text-slate-400">
                          {settings.currencyEn}
                        </span>
                      </div>
                    </div>

                    {/* 3. Due / Credit Customer Split Row (Optional) */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showSplitDue}
                            onChange={(e) => setShowSplitDue(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-slate-800">
                            {language === 'ar' ? 'حصة حساب آجل / ذمم (Due / Credit)' : 'Add Due / Credit Portion'}
                          </span>
                        </label>

                        {showSplitDue && splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFillRemainder('due')}
                            className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{language === 'ar' ? 'إضافة المتبقي' : '+ Fill Remainder'}</span>
                          </button>
                        )}
                      </div>

                      {showSplitDue && (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              value={splitDue}
                              onChange={(e) => setSplitDue(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                            />
                            <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2 text-[11px] font-bold text-slate-400">
                              {settings.currencyEn}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <input
                                type="tel"
                                value={dueCustomerPhone}
                                onChange={(e) => handleDuePhoneChange(e.target.value)}
                                placeholder="Customer Phone (05...)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={dueCustomerName}
                                onChange={(e) => setDueCustomerName(e.target.value)}
                                placeholder="Debtor Name *"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DUE / CREDIT ACCOUNT DETAILS (WHEN NOT SPLIT) */}
            {selectedMethod === 'due' && (
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>{language === 'ar' ? 'تسجيل كحساب آجل (ذمم مدينة)' : 'Record as Due / Customer Account'}</span>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Customer Phone (Auto-search) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={dueCustomerPhone}
                    onChange={(e) => handleDuePhoneChange(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  />
                  {dueCustomerRecognized && (
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      ✓ Recognized client: {dueCustomerRecognized.name} ({dueCustomerRecognized.orderCount} visits)
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={dueCustomerName}
                    onChange={(e) => setDueCustomerName(e.target.value)}
                    placeholder="e.g. Abdullah Al-Ghamdi"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteSale}
                className="flex-1 py-3 px-3 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 min-h-[46px] cursor-pointer"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isSubmitting
                    ? (language === 'ar' ? 'جارِ المعالجة...' : 'Settling...')
                    : (language === 'ar' ? 'إتمام المحاسبة وطباعة الفاتورة (نسختين)' : 'Complete & Print Memos (2 Slips)')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
