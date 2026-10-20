import React, { useState, useMemo } from 'react';
import {
  Globe,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  Utensils,
  AlertCircle,
  X,
  Search,
  Sparkles,
  Folder,
  FolderOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { CartItem, Product } from '../types/pos';

export const CustomerQrView: React.FC = () => {
  const {
    language,
    toggleLanguage,
    categories,
    products,
    settings,
    submitCustomerQrOrder,
    findCustomerByPhone,
  } = usePos();

  const isRtl = language === 'ar';
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer local cart
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Mandatory fields for checkout:
  // a. Customer Phone (triggers automatic name lookup)
  // b. Customer Name (Auto-populated if saved)
  // c. Order Type / Note (Table #, Takeaway, Car Plate)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [recognizedCustomer, setRecognizedCustomer] = useState<{ name: string; orderCount: number } | null>(null);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'car_pickup'>('dine_in');
  const [tableOrPlate, setTableOrPlate] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle phone input with automatic customer name retrieval
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

  // Submitted order state
  const [lastSubmittedOrderNumber, setLastSubmittedOrderNumber] = useState<number | null>(null);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCustomerCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          product,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCustomerCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartSubtotal = useMemo(() => {
    return customerCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [customerCart]);

  // VAT is included in product prices (no extra tax added)
  const cartTotal = cartSubtotal;
  const cartTax = (cartTotal * (settings.vatPercentage || 15)) / (100 + (settings.vatPercentage || 15));

  const handlePlaceOrder = () => {
    setErrorMsg('');

    if (customerCart.length === 0) {
      setErrorMsg(language === 'ar' ? 'السلة فارغة' : 'Your cart is empty');
      return;
    }

    // MANDATORY FIELD: Customer Phone Number
    if (!customerPhone.trim()) {
      setErrorMsg(
        language === 'ar'
          ? 'رقم الهاتف مطلوب لإتمام وتتبع الطلب'
          : 'Customer Phone Number is required'
      );
      return;
    }

    // Customer Name, Table Number, and Car Number are OPTIONAL
    const order = submitCustomerQrOrder({
      items: customerCart,
      customerPhone: customerPhone.trim(),
      customerName: customerName.trim() || (language === 'ar' ? 'عميل الباركود' : 'QR Guest'),
      orderType,
      tableOrPlate: tableOrPlate.trim() || undefined,
      customerNote: customerNote.trim() || undefined,
    });

    setLastSubmittedOrderNumber(order.dailyOrderNumber);
    setCustomerCart([]);
    setIsCartDrawerOpen(false);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q);
      return matchCat && matchSearch && p.isAvailable;
    });
  }, [products, selectedCategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans max-w-md mx-auto border-x border-slate-200 shadow-xl relative pb-24">
      {/* Customer Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={settings.shopNameEn}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/20"
            />
          )}
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 line-clamp-1">
              {isRtl ? settings.shopNameAr : settings.shopNameEn}
            </h1>
            <span className="text-[10px] text-blue-600 font-bold block">
              {getTranslation('welcomeCustomer', language)}
            </span>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-xs border border-slate-200"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{getTranslation('switchToLang', language)}</span>
        </button>
      </header>

      {/* Confirmation View If Just Ordered */}
      {lastSubmittedOrderNumber !== null ? (
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center animate-bounce shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
              {language === 'ar' ? 'طلبك قيد المراجعة الفورية' : 'Order Received in Kitchen'}
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              {getTranslation('orderPlacedSuccess', language)}
            </h2>
            <div className="mt-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 block">{language === 'ar' ? 'رقم طلبك' : 'Your Order #'}</span>
              <span className="text-4xl font-black font-mono text-blue-600">
                #{lastSubmittedOrderNumber}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            {getTranslation('orderPlacedMessage', language)}
          </p>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            {language === 'ar'
              ? 'تنبيه: يتم سداد الفاتورة نقداً أو عبر مدى عند استلام طلبك من الكاونتر.'
              : 'Notice: Payment is completed at the counter upon order collection.'}
          </div>

          <button
            onClick={() => setLastSubmittedOrderNumber(null)}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
          >
            {language === 'ar' ? 'طلب صنف آخر' : 'Order Something Else'}
          </button>
        </div>
      ) : (
        <>
          {/* Hero Banner & Search */}
          <div className="p-4 bg-white border-b border-slate-200 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation('searchProducts', language)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Category Folders Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto mt-3 pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategoryId === 'all'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{getTranslation('allCategories', language)}</span>
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    {isSelected ? <FolderOpen className="w-3 h-3 text-white" /> : <Folder className="w-3 h-3 text-blue-500" />}
                    <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Items List */}
          <div className="p-4 space-y-3">
            {filteredProducts.map((prod) => {
              const inCart = customerCart.find((i) => i.product.id === prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3 flex gap-3 shadow-xs hover:border-blue-300 transition-all"
                >
                  <img
                    src={prod.image}
                    alt={prod.nameEn}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 leading-tight">
                        {isRtl ? prod.nameAr : prod.nameEn}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {isRtl ? prod.descriptionAr : prod.descriptionEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-xs font-black text-blue-600">
                        {formatCurrency(prod.price, language, settings.currencyEn, settings.currencyAr)}
                      </span>

                      {inCart ? (
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleUpdateQuantity(inCart.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold w-4 text-center text-slate-800">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(inCart.id, 1)}
                            className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating Bottom Cart Bar */}
      {customerCart.length > 0 && lastSubmittedOrderNumber === null && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 z-40 bg-gradient-to-t from-white via-white/95 to-transparent">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/25 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-blue-700 text-xs flex items-center justify-center font-mono font-bold">
                {customerCart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
              <span className="text-xs uppercase tracking-wider">{language === 'ar' ? 'عرض السلة والطلب' : 'View Cart & Order'}</span>
            </div>

            <span className="font-mono text-sm">
              {formatCurrency(cartTotal, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </button>
        </div>
      )}

      {/* Checkout Drawer */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-800">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>{language === 'ar' ? 'تفاصيل الطلب والبيانات' : 'Review & Place Order'}</span>
              </h3>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Type Toggle */}
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  {language === 'ar' ? 'نوع الطلب' : 'Order Type'}
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setOrderType('dine_in')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      orderType === 'dine_in'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {getTranslation('dineIn', language)}
                  </button>
                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      orderType === 'takeaway'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {getTranslation('takeaway', language)}
                  </button>
                  <button
                    onClick={() => setOrderType('car_pickup')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      orderType === 'car_pickup'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {getTranslation('carPickup', language)}
                  </button>
                </div>
              </div>

              {/* Mandatory Customer Info with Auto-Fill */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold block">
                      {getTranslation('customerPhone', language)} *
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {language === 'ar' ? 'أدخل رقمك لاسترجاع اسمك تلقائياً' : 'Auto-fills your name'}
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {recognizedCustomer && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? `مرحباً بك مجدداً ${recognizedCustomer.name}! تم استرجاع اسمك المحفوظ (${recognizedCustomer.orderCount} طلبات سابقة)`
                        : `Welcome back, ${recognizedCustomer.name}! Name auto-filled from your previous ${recognizedCustomer.orderCount} visits.`}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">
                      {getTranslation('customerName', language)}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {language === 'ar' ? '(اختياري)' : '(Optional)'}
                    </span>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: عبدالله (اختياري)' : 'e.g. Abdullah (Optional)'}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">
                      {orderType === 'dine_in'
                        ? (language === 'ar' ? 'رقم الطاولة' : 'Table Number')
                        : orderType === 'car_pickup'
                        ? (language === 'ar' ? 'رقم / لوحة السيارة' : 'Car Number / Plate')
                        : (language === 'ar' ? 'ملاحظة الاستلام' : 'Pickup Note')}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {language === 'ar' ? '(اختياري)' : '(Optional)'}
                    </span>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tableOrPlate}
                      onChange={(e) => setTableOrPlate(e.target.value)}
                      placeholder={
                        orderType === 'dine_in'
                          ? (language === 'ar' ? 'طاولة 4 (اختياري)' : 'Table 4 (Optional)')
                          : orderType === 'car_pickup'
                          ? (language === 'ar' ? 'لوحة السيارة أ ب ج 1234 (اختياري)' : 'White GMC 1234 (Optional)')
                          : (language === 'ar' ? 'ملاحظة الاستلام (اختياري)' : 'Pickup Note (Optional)')
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {language === 'ar' ? 'ملاحظات إضافية على الطلب' : 'Special Kitchen Instructions (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. Extra hot, low sugar..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Items List in Drawer */}
              <div className="space-y-2">
                <span className="font-bold text-slate-600 block">{language === 'ar' ? 'الأصناف في السلة' : 'Items in Cart'}</span>
                <div className="divide-y divide-slate-100 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {customerCart.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between">
                      <span className="text-slate-800">
                        {item.quantity}x {isRtl ? item.product.nameAr : item.product.nameEn}
                      </span>
                      <span className="font-mono text-blue-700 font-bold">
                        {formatCurrency(item.product.price * item.quantity, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between font-bold text-slate-900">
                    <span>{getTranslation('total', language)}</span>
                    <span className="font-mono text-blue-600 text-sm font-black">
                      {formatCurrency(cartTotal, language, settings.currencyEn, settings.currencyAr)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-4 bg-white border-t border-slate-200">
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                {getTranslation('placeQrOrder', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
