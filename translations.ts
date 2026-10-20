import { Language } from '../types/pos';

export const translations = {
  // Navigation & General
  appTitle: { en: 'KAS GOBN POS & QR System', ar: 'كاس غوبن - نقطة البيع والطلب الذاتي' },
  posScreen: { en: 'Cashier POS', ar: 'نقطة بيع الكاشير' },
  heldOrders: { en: 'Advance / Held Orders', ar: 'الطلبات المسبقة / المعلقة' },
  refunds: { en: 'Refund Lookup', ar: 'إرجاع واسترداد' },
  adminPanel: { en: 'Admin Settings', ar: 'إعدادات الإدارة' },
  customerMenu: { en: 'Customer QR Menu', ar: 'قائمة الطلب الذاتي للعميل' },
  language: { en: 'English', ar: 'العربية' },
  switchToLang: { en: 'العربية', ar: 'English' },
  logout: { en: 'Lock / Switch PIN', ar: 'قفل / تبديل الرمز' },
  activeShift: { en: 'Active Shift', ar: 'الوردية الحالية' },
  noActiveShift: { en: 'Shift Closed', ar: 'الوردية مغلقة' },
  startDay: { en: 'Start Day / Open Shift', ar: 'بدء اليوم / فتح الوردية' },
  closeDay: { en: 'Close Day / End Shift', ar: 'إغلاق اليوم / تقرير Z' },
  connectedPrinter: { en: 'Wi-Fi Printer', ar: 'طابعة واي فاي' },
  online: { en: 'Connected', ar: 'متصل' },
  offline: { en: 'Not Connected', ar: 'غير متصل' },
  openDrawer: { en: 'Open Cash Drawer', ar: 'فتح درج النقود' },
  printReceipt: { en: 'Print Receipt', ar: 'طباعة الفاتورة' },

  // POS Selling Screen
  searchProducts: { en: 'Search products by name or code...', ar: 'ابحث عن منتج بالاسم أو الرمز...' },
  allCategories: { en: 'All Items', ar: 'جميع الأصناف' },
  currentOrder: { en: 'Current Order', ar: 'الطلب الحالي' },
  orderSource: { en: 'Order Source', ar: 'مصدر الطلب' },
  emptyCart: { en: 'Cart is empty. Tap products to add.', ar: 'السلة فارغة. اضغط على الأصناف للإضافة.' },
  itemNotes: { en: 'Add Note / Special Request', ar: 'إضافة ملاحظة أو طلب خاص' },
  clearCart: { en: 'Clear Cart', ar: 'مسح السلة' },
  subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
  discount: { en: 'Discount', ar: 'الخصم' },
  addDiscount: { en: 'Add Discount', ar: 'إضافة خصم' },
  vat: { en: 'VAT', ar: 'ضريبة القيمة المضافة' },
  total: { en: 'Total Amount', ar: 'المجموع الكلي' },
  holdOrder: { en: 'Hold Order (Advance)', ar: 'تعليق الطلب (مسبق)' },
  quickPay: { en: 'Pay & Settle', ar: 'دفع ومحاسبة' },
  itemsCount: { en: 'Items', ar: 'أصناف' },
  outOfStock: { en: 'Out of Stock', ar: 'نفد من المخزون' },

  // Alarm & Incoming QR Order
  alarmModalTitle: { en: '⚠️ NEW INCOMING QR ORDER! (Action Required)', ar: '⚠️ تنبيه: طلب ذاتي جديد بالانتظار! (مطلوب إجراء فوري)' },
  alarmNotice: {
    en: 'Continuous 15-second alarm is sounding. You must manually accept this order to stop the alert.',
    ar: 'الإنذار الصوتي متواصل كل 15 ثانية. يجب قبول الطلب يدوياً لإيقاف التنبيه.',
  },
  escalationWarning: {
    en: '🚨 CRITICAL WARNING: Order has been waiting for over 30 seconds! Push alert sent to Admin.',
    ar: '🚨 تحذير عاجل: مرت أكثر من 30 ثانية دون قبول! تم إرسال إشعار فوري للمشرف.',
  },
  acceptAndHold: { en: 'Accept & Move to Hold Orders', ar: 'قبول ونقل إلى الطلبات المعلقة' },
  rejectOrder: { en: 'Decline / Void Order', ar: 'رفض وإلغاء الطلب' },
  qrOrderAlertText: { en: 'Customer placed order via QR Menu', ar: 'طلب جديد عبر مسح الباركود' },
  customerDetails: { en: 'Customer Details', ar: 'بيانات العميل' },
  customerName: { en: 'Customer Name', ar: 'اسم العميل' },
  customerPhone: { en: 'Customer Phone', ar: 'رقم هاتف العميل' },
  orderTypeOrNote: { en: 'Table / Note', ar: 'الطاولة / الملاحظة' },

  // Advance / Held Orders
  heldOrdersTitle: { en: 'Advance & QR Held Orders Queue', ar: 'قائمة الطلبات المسبقة والذاتية المعلقة' },
  heldOrdersSubtitle: {
    en: 'Orders stay unpaid in this queue until customer pays. They are NOT included in sales until settled.',
    ar: 'تبقى الطلبات غير مدفوعة في هذه القائمة ولا تدخل في المبيعات اليومية حتى يسدد العميل الفاتورة.',
  },
  searchHeldOrders: { en: 'Search by Order #, Customer Name, or Phone...', ar: 'بحث برقم الطلب، اسم العميل، أو الجوال...' },
  noHeldOrders: { en: 'No pending held orders right now.', ar: 'لا توجد طلبات معلقة حالياً.' },
  settleAndBill: { en: 'Settle & Bill', ar: 'محاسبة وسداد الفاتورة' },
  cancelHeld: { en: 'Cancel Order', ar: 'إلغاء الطلب' },
  unpaidPreparing: { en: 'Preparing / Unpaid', ar: 'قيد التحضير / غير مسدد' },
  timeElapsed: { en: 'Time Elapsed', ar: 'الوقت المنقضي' },

  // Payments & Checkout
  checkoutTitle: { en: 'Order Settlement & Payment', ar: 'محاسبة وسداد الطلب' },
  paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع' },
  cash: { en: 'Cash', ar: 'نقدي' },
  mada: { en: 'Mada', ar: 'مدى' },
  visa: { en: 'Visa / MasterCard', ar: 'فيزا / ماستركارد' },
  onlinePay: { en: 'Online Payment', ar: 'دفع إلكتروني' },
  dueCredit: { en: 'Due / Credit (Unpaid)', ar: 'آجل / على الحساب' },
  splitPayment: { en: 'Split Payment', ar: 'دفع مجزأ' },
  tenderAmount: { en: 'Tendered Cash', ar: 'المبلغ المدفوع نقداً' },
  changeDue: { en: 'Change Due', ar: 'المتبقي للعميل (الفكة)' },
  quickTender: { en: 'Quick Cash Amounts', ar: 'مبالغ سريعة' },
  exactAmount: { en: 'Exact Amount', ar: 'المبلغ بالضبط' },
  creditCustomerName: { en: 'Debtor Name (Required)', ar: 'اسم العميل الآجل (مطلوب)' },
  creditCustomerPhone: { en: 'Debtor Phone (Required)', ar: 'رقم جوال العميل (مطلوب)' },
  completeAndPrint: { en: 'Complete Sale & Print Receipt', ar: 'إتمام البيع وطباعة الفاتورة' },
  processing: { en: 'Processing...', ar: 'جاري المعالجة...' },

  // Shift & Day Start / Close
  dayStartTitle: { en: 'Start Day / Open Shift', ar: 'بدء اليوم / فتح وردية الكاشير' },
  dayStartSubtitle: {
    en: 'Enter opening cash balance in the drawer to begin registering transactions.',
    ar: 'أدخل الرصيد الافتتاحي للنقد في الصندوق لبدء تسجيل العمليات.',
  },
  activeCashier: { en: 'Active Cashier', ar: 'الكاشير المسؤول' },
  openingCashAmount: { en: 'Opening Cash Float (SAR)', ar: 'الرصيد النقدي الافتتاحي (ر.س)' },
  confirmStartShift: { en: 'Open Shift & Unlock POS', ar: 'فتح الوردية وتفعيل الكاشير' },

  dayCloseTitle: { en: 'End Day / Shift Close (Z-Report)', ar: 'إغلاق اليوم والوردية (تقرير Z اليومي)' },
  dayCloseSubtitle: {
    en: 'Count all physical cash in the drawer and generate the final end-of-day sales audit.',
    ar: 'قم بعدّ النقد الفعلي في الصندوق لإنشاء وتوليد تقرير المبيعات النهائي.',
  },
  actualCashCounted: { en: 'Actual Physical Cash Counted (SAR)', ar: 'النقد الفعلي المعدود في الصندوق (ر.س)' },
  expectedCash: { en: 'System Expected Cash', ar: 'النقد المتوقع في النظام' },
  cashDifference: { en: 'Cash Shortage / Overage', ar: 'فرق الصندوق (عجز / زيادة)' },
  shortage: { en: 'Shortage (Deficit)', ar: 'عجز في الصندوق' },
  overage: { en: 'Overage (Surplus)', ar: 'فائض في الصندوق' },
  balanced: { en: 'Perfect Match (0.00)', ar: 'مطابق تماماً (0.00)' },
  grossSales: { en: 'Total Gross Sales', ar: 'إجمالي المبيعات' },
  netRevenue: { en: 'Net Revenue', ar: 'صافي الإيرادات' },
  sendWhatsAppReport: { en: 'Send WhatsApp to Admin', ar: 'إرسال التقرير للمشرف عبر واتساب' },
  sendPushNotification: { en: 'Send Instant Push Notification', ar: 'إرسال إشعار فوري للجوال' },
  printZReport: { en: 'Print 80mm Z-Report Slip', ar: 'طباعة تقرير Z على الطابعة' },
  confirmCloseShift: { en: 'Confirm & Close Day', ar: 'تأكيد إغلاق اليوم نهائياً' },

  // Refunds
  refundTitle: { en: 'Process Refund', ar: 'إجراء عملية استرجاع' },
  searchOrderByNumber: { en: 'Lookup Order by # or Phone', ar: 'البحث عن الطلب بالرقم أو الجوال' },
  refundAmount: { en: 'Refund Amount', ar: 'مبلغ الاسترجاع' },
  refundReason: { en: 'Reason for Refund', ar: 'سبب الاسترجاع' },
  refundMethod: { en: 'Refund Method', ar: 'طريقة رد المبلغ' },
  confirmRefund: { en: 'Confirm & Issue Refund', ar: 'تأكيد الاسترجاع وطباعة السند' },

  // Hardware & Wi-Fi Printer
  printerSettings: { en: 'Wi-Fi Thermal Printer & Cash Drawer', ar: 'طابعة الإيصالات ودرج النقود' },
  scanSubnet: { en: 'Scan Wi-Fi Subnet (Port 9100)', ar: 'استكشاف طابعات الشبكة (بورت 9100)' },
  scanningPrinters: { en: 'Scanning Local Subnet on Port 9100...', ar: 'جاري استكشاف الطابعات على الشبكة المحلية...' },
  discoveredPrinters: { en: 'Discovered Wi-Fi Thermal Printers', ar: 'طابعات الفواتير المكتشفة' },
  oneTapConnect: { en: 'One-Tap Connect', ar: 'اتصال بنقرة واحدة' },
  testPrint: { en: 'Test Print Slip', ar: 'طباعة تجريبية' },
  testDrawer: { en: 'Test Open Drawer (ESC/POS)', ar: 'اختبار فتح الدرج (نبضة ESC/POS)' },
  manualIpSetup: { en: 'Manual Printer IP Configuration', ar: 'إعداد يدوي لعنوان IP الطابعة' },
  printerIpAddress: { en: 'Printer IP Address (e.g. 192.168.1.185)', ar: 'عنوان IP للطابعة (مثلاً 192.168.1.185)' },
  printerPort: { en: 'Raw Socket Port', ar: 'منفذ السوكيت الخام' },

  // Customer Self-Ordering Menu View
  welcomeCustomer: { en: 'Scan & Order at Your Convenience', ar: 'اطلب واستمتع بخدمة سريعة' },
  yourTableOrPlate: { en: 'Table # or Car Plate #', ar: 'رقم الطاولة أو لوحة السيارة' },
  placeQrOrder: { en: 'Submit Order (Pay at Counter)', ar: 'تأكيد وإرسال الطلب (الدفع عند الاستلام)' },
  orderPlacedSuccess: { en: 'Order Sent to Cashier!', ar: 'تم إرسال طلبك إلى الكاشير بنجاح!' },
  orderPlacedMessage: {
    en: 'Your order is being reviewed by the cashier. Please pay at the counter when ready.',
    ar: 'طلبك قيد المراجعة لدى الكاشير. يمكنك التوجه للمحاسب لسداد الفاتورة واستلام الطلب.',
  },
  dineIn: { en: 'Dine-In', ar: 'محلي (داخل المطعم)' },
  takeaway: { en: 'Takeaway', ar: 'سفري' },
  carPickup: { en: 'Car Pickup', ar: 'استلام في السيارة' },

  // Admin Configuration
  adminSettingsTitle: { en: 'Store Settings & Administration', ar: 'إعدادات المتجر والإدارة' },
  menuBuilder: { en: 'Menu Builder', ar: 'إدارة قائمة الطعام والأسعار' },
  orderSourcesTab: { en: 'Order Sources', ar: 'قنوات ومصادر الطلب' },
  qrGeneratorTab: { en: 'QR Code Generator', ar: 'توليد وطباعة باركود الطاولات' },
  cashierManagementTab: { en: 'Cashier Profiles & PINs', ar: 'إدارة الكاشيرات والرموز السرية' },
  storeBrandingTab: { en: 'Store Branding & Tax', ar: 'بيانات المتجر والضريبة' },
  salesReportsTab: { en: 'Z-Reports & Sales History', ar: 'سجل المبيعات وتقارير Z' },

  // Sales List & Refund List
  salesList: { en: 'Sales Transactions', ar: 'فواتير المبيعات' },
  salesListSubtitle: { en: 'All settled and completed customer sales', ar: 'جميع فواتير المبيعات المكتملة والمسددة' },
  refundsList: { en: 'Refunds History', ar: 'سجل المرتجعات' },
  refundsListSubtitle: { en: 'Audit log of refunded orders with payout methods', ar: 'سجل العمليات المستردة مع بيان طريقة صرف الاسترجاع' },
  refundViaCash: { en: 'Cash Refund', ar: 'استرجاع نقدي (الصندوق)' },
  refundViaMada: { en: 'Mada Card Refund', ar: 'استرجاع عبر شبكة مدى' },
  refundViaOnline: { en: 'Online Order Refund', ar: 'استرجاع طلب أونلاين' },
  refundViaCard: { en: 'Credit Card / Visa Refund', ar: 'استرجاع بطاقة ائتمان' },
  refundMethodNote: { en: 'Refund Reference / Receipt Note', ar: 'ملاحظة أو مرجع الاسترجاع' },
  refundMethodSelectPrompt: { en: 'How was the refund paid to the customer?', ar: 'كيف تم رد المبلغ للعميل؟ (حدد الخيار)' },

  // Management Lock & 2FA
  managementLockTitle: { en: 'Management Security Access', ar: 'قفل أمان إدارة النظام' },
  managementLockSubtitle: { en: 'Enter Manager PIN and 2-Step WhatsApp Code', ar: 'أدخل رمز المشرف ورمز التحقق بخطوتين عبر واتساب' },
  sendWhatsappCode: { en: 'Send 2FA Code to WhatsApp', ar: 'إرسال رمز التحقق إلى واتساب الإدارة' },
  whatsappCodePlaceholder: { en: 'Enter 6-digit WhatsApp Code', ar: 'أدخل رمز الواتساب المكون من 6 أرقام' },
  unlockManagement: { en: 'Verify & Unlock Management', ar: 'تحقق وفتح إدارة النظام' },
  lockManagementNow: { en: 'Lock Management', ar: 'قفل الإدارة' },

  // Cashier Permissions
  permissionsTitle: { en: 'Role Privileges & Access Limits', ar: 'صلاحيات وقيود المستخدم' },
  canTakeOrders: { en: 'Take Orders & Checkout', ar: 'أخذ الطلبات وإنهاء الفواتير' },
  canAddProducts: { en: 'Add & Edit Menu Products', ar: 'إضافة وتعديل أصناف المنيو' },
  canProcessRefunds: { en: 'Process Order Refunds', ar: 'إجراء عمليات الاسترجاع' },
  canHoldOrders: { en: 'Park / Hold Advance Orders', ar: 'تعليق الطلبات المسبقة' },
  canViewReports: { en: 'View Financial & Z-Reports', ar: 'عرض التقارير المالية واليومية' },
  canAccessManagement: { en: 'Full Management Panel Access', ar: 'الدخول الكامل لإدارة النظام' },
  permissionDeniedTakeOrdersOnly: {
    en: 'Permission Restricted: This cashier is only authorized to take orders.',
    ar: 'الصلاحية مقيدة: هذا الكاشير مسموح له فقط بأخذ الطلبات.',
  },
};

export function getTranslation(key: keyof typeof translations, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item.en;
}

export function formatCurrency(amount: number, lang: Language, currencyEn = 'SAR', currencyAr = 'ر.س'): string {
  const formatted = (amount || 0).toFixed(2);
  return lang === 'ar' ? `${formatted} ${currencyAr}` : `${currencyEn} ${formatted}`;
}
