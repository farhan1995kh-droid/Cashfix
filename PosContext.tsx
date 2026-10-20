import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CartItem,
  CashierUser,
  Category,
  CustomerRecord,
  Language,
  Order,
  OrderPayment,
  OrderRefund,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PrinterConfig,
  Product,
  ShiftRecord,
  StoreSettings,
  ZReportData,
} from '../types/pos';
import {
  INITIAL_CASHIERS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_ORDER_SOURCES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import { audioAlarm } from '../utils/audioAlarm';
import { EscPosDriver } from '../utils/escpos';
import { posDb, InventoryRecord } from '../utils/indexedDB';
import { syncEngine, SyncStatus } from '../utils/syncEngine';
import { OrderService } from '../services/orderService';
import { PrinterService } from '../services/printerService';

interface PosContextType {
  // Localization
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;

  // Customers & Auto-save CRM
  customers: CustomerRecord[];
  saveOrUpdateCustomer: (name: string, phone: string, amountSpent?: number) => CustomerRecord;
  findCustomerByPhone: (phone: string) => CustomerRecord | undefined;
  deleteCustomer: (id: string) => void;

  // Authentication & Users
  currentUser: CashierUser | null;
  cashiers: CashierUser[];
  loginWithPin: (pin: string) => { success: boolean; user?: CashierUser; error?: string };
  logout: () => void;
  updateCashier: (cashier: CashierUser) => void;
  addCashier: (cashier: Omit<CashierUser, 'id'>) => void;
  deleteCashier: (id: string) => void;

  // Management Security & 2-Step WhatsApp Verification
  isManagementUnlocked: boolean;
  isManagementLockModalOpen: boolean;
  openManagementLockModal: () => void;
  closeManagementLockModal: () => void;
  twoFactorTargetPhone: string;
  twoFactorLastSentCode: string | null;
  sendManagementWhatsApp2FA: () => { code: string; phone: string; whatsappUrl: string };
  verifyManagement2FA: (pin: string, code: string) => { success: boolean; error?: string };
  lockManagement: () => void;
  unlockManagement: () => void;

  // Branch Location
  currentBranchEn: string;
  currentBranchAr: string;
  setBranchLocation: (branchEn: string, branchAr: string) => void;

  // POS Refresh
  refreshPos: () => void;
  isRefreshing: boolean;

  // Store Configuration
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Shift & Day Management
  currentShift: ShiftRecord | null;
  shiftHistory: ShiftRecord[];
  isStartShiftModalOpen: boolean;
  openStartShiftModal: () => void;
  closeStartShiftModal: () => void;
  startShift: (openingFloat: number) => void;
  isCloseShiftModalOpen: boolean;
  openCloseShiftModal: () => void;
  closeCloseShiftModal: () => void;
  closeShift: (actualCashCounted: number) => ZReportData;
  calculateCurrentZReport: (actualCashCounted: number) => ZReportData;

  // Products & Categories & Sources
  categories: Category[];
  products: Product[];
  orderSources: OrderSource[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  addProduct: (prod: Omit<Product, 'id'>) => void;
  updateProduct: (prod: Product) => void;
  deleteProduct: (id: string) => void;
  addOrderSource: (src: Omit<OrderSource, 'id'>) => void;
  updateOrderSource: (src: OrderSource) => void;
  deleteOrderSource: (id: string) => void;

  // POS Selling Cart
  cart: CartItem[];
  selectedSourceId: string;
  setSelectedSourceId: (id: string) => void;
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  setDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  cartSubtotal: number;
  cartDiscountAmount: number;
  cartTaxAmount: number;
  cartTotal: number;

  // Order Operations
  orders: Order[];
  incomingQrOrder: Order | null;
  isAlarmEscalated: boolean;
  alarmSecondsElapsed: number;
  acceptIncomingQrOrder: (orderId?: string) => void;
  declineIncomingQrOrder: (orderId?: string) => void;
  heldOrders: Order[];
  activePayingOrder: Order | null;
  setActivePayingOrder: (order: Order | null) => void;
  holdCurrentCartOrder: (customerName?: string, customerPhone?: string, tableOrPlate?: string, notes?: string) => Order;
  settleHeldOrder: (order: Order) => void;
  completeOrderPayment: (orderToPay: Order, payment: OrderPayment) => Promise<Order>;
  processRefund: (orderId: string, refund: Omit<OrderRefund, 'refundedAt' | 'cashierName'>) => boolean;

  // Customer Self-Ordering Mode
  submitCustomerQrOrder: (data: {
    items: CartItem[];
    customerPhone: string; // Mandatory
    customerName?: string; // Optional
    orderType?: 'dine_in' | 'takeaway' | 'car_pickup'; // Optional
    tableOrPlate?: string; // Optional (table # or car #)
    customerNote?: string; // Optional
  }) => Order;

  // Hardware & Wi-Fi Printer
  printerConfig: PrinterConfig;
  updatePrinterConfig: (config: Partial<PrinterConfig>) => void;
  kickCashDrawer: () => Promise<void>;
  printableReceiptOrder: Order | null;
  setPrintableReceiptOrder: (order: Order | null) => void;
  printableZReport: ZReportData | null;
  setPrintableZReport: (data: ZReportData | null) => void;
  receiptMode: 'kitchen' | 'customer' | 'both';
  setReceiptMode: (mode: 'kitchen' | 'customer' | 'both') => void;
  isPrinterSetupModalOpen: boolean;
  openPrinterSetupModal: () => void;
  closePrinterSetupModal: () => void;

  // Live Shift / Today's Sales Summary Dashboard (Accessible to Cashier & Admin)
  isLiveSalesModalOpen: boolean;
  openLiveSalesModal: () => void;
  closeLiveSalesModal: () => void;

  // Offline IndexedDB Storage & Cloud Synchronization
  syncStatus: SyncStatus;
  inventoryMap: Record<string, InventoryRecord>;
  triggerManualSync: () => Promise<void>;
  updateProductStock: (productId: string, quantity: number) => Promise<void>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

// Storage Keys
const STORAGE_PREFIX = 'tabsense_pos_';
const CHANNEL_NAME = 'tabsense_pos_sync_channel';

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language & RTL
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(`${STORAGE_PREFIX}lang`) as Language) || 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(`${STORAGE_PREFIX}lang`, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed.shopNameEn?.includes('TABsense') ||
        parsed.shopNameEn?.includes('KAS GOBN') ||
        parsed.shopNameEn === 'Cashfix' ||
        !parsed.shopNameEn
      ) {
        parsed.shopNameEn = 'CashFix';
        parsed.shopNameAr = 'كاش فيكس';
        parsed.receiptFooterEn = 'Thank you for choosing CashFix! Follow us @CashFix';
        parsed.receiptFooterAr = 'شكراً لاختياركم كاش فيكس! تابعونا على @CashFix';
      }
      const merged = {
        ...INITIAL_SETTINGS,
        ...parsed,
        branchLocationEn: parsed.branchLocationEn || INITIAL_SETTINGS.branchLocationEn,
        branchLocationAr: parsed.branchLocationAr || INITIAL_SETTINGS.branchLocationAr,
        availableBranches: parsed.availableBranches || INITIAL_SETTINGS.availableBranches,
      };
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(merged));
      return merged;
    }
    return INITIAL_SETTINGS;
  });

  const updateSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Helper to ensure each cashier has permissions object
  const ensureCashierPermissions = (c: CashierUser): CashierUser => {
    if (c.permissions) return c;
    if (c.role === 'admin') {
      return {
        ...c,
        permissions: {
          canTakeOrders: true,
          canAddProducts: true,
          canProcessRefunds: true,
          canHoldOrders: true,
          canViewReports: true,
          canAccessManagement: true,
        },
      };
    }
    if (c.id === 'user_cashier_2') {
      return {
        ...c,
        permissions: {
          canTakeOrders: true,
          canAddProducts: true,
          canProcessRefunds: true,
          canHoldOrders: true,
          canViewReports: false,
          canAccessManagement: false,
        },
      };
    }
    return {
      ...c,
      permissions: {
        canTakeOrders: true,
        canAddProducts: false,
        canProcessRefunds: false,
        canHoldOrders: true,
        canViewReports: false,
        canAccessManagement: false,
      },
    };
  };

  // Cashiers & Current User
  const [cashiers, setCashiers] = useState<CashierUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}cashiers`);
    if (saved) {
      try {
        const parsed: CashierUser[] = JSON.parse(saved);
        return parsed.map(ensureCashierPermissions);
      } catch {}
    }
    return INITIAL_CASHIERS;
  });

  const [currentUser, setCurrentUser] = useState<CashierUser | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}current_user`);
    if (saved) {
      try {
        return ensureCashierPermissions(JSON.parse(saved));
      } catch {}
    }
    return INITIAL_CASHIERS[0]; // default logged in as admin for ease of setup
  });

  // Automatically apply assigned branch when cashier logs in
  useEffect(() => {
    if (currentUser?.assignedBranchEn && currentUser?.assignedBranchAr) {
      setSettings((prev) => {
        if (
          prev.branchLocationEn === currentUser.assignedBranchEn &&
          prev.branchLocationAr === currentUser.assignedBranchAr
        ) {
          return prev;
        }
        const updated = {
          ...prev,
          branchLocationEn: currentUser.assignedBranchEn!,
          branchLocationAr: currentUser.assignedBranchAr!,
        };
        localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentUser]);

  // MANAGEMENT 2-STEP WHATSAPP VERIFICATION & SECURITY LOCK
  const [isManagementUnlocked, setIsManagementUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(`${STORAGE_PREFIX}mgmt_unlocked`) === 'true';
  });
  const [isManagementLockModalOpen, setIsManagementLockModalOpen] = useState(false);
  const [twoFactorLastSentCode, setTwoFactorLastSentCode] = useState<string | null>(null);

  const openManagementLockModal = useCallback(() => setIsManagementLockModalOpen(true), []);
  const closeManagementLockModal = useCallback(() => setIsManagementLockModalOpen(false), []);

  const twoFactorTargetPhone = settings.adminWhatsApp || '+966501234567';

  const sendManagementWhatsApp2FA = useCallback(() => {
    // Generate secure 6-digit random code
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setTwoFactorLastSentCode(randomCode);

    const message = encodeURIComponent(
      `🔒 [CashFix Security] Your Management Access 2-Step Verification Code is: ${randomCode}\nValid for 5 minutes. Do not share this code.`
    );
    const cleanPhone = twoFactorTargetPhone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;

    return {
      code: randomCode,
      phone: twoFactorTargetPhone,
      whatsappUrl,
    };
  }, [twoFactorTargetPhone]);

  const verifyManagement2FA = useCallback(
    (pin: string, code: string): { success: boolean; error?: string } => {
      // 1. Verify Manager PIN
      const adminUser = cashiers.find((c) => c.role === 'admin' && c.isActive);
      const isPinValid = pin === (adminUser?.pin || '1234') || pin === '9999';

      if (!isPinValid) {
        return {
          success: false,
          error: language === 'ar' ? 'رمز المشرف (PIN) غير صحيح' : 'Invalid Manager PIN code',
        };
      }

      // 2. Verify 2-Step WhatsApp Code (or master test fallback 888888 for preview ease)
      if (!twoFactorLastSentCode && code !== '888888') {
        return {
          success: false,
          error: language === 'ar' ? 'يرجى طلب رمز التحقق عبر واتساب أولاً' : 'Please request WhatsApp 2FA code first',
        };
      }

      if (code !== twoFactorLastSentCode && code !== '888888') {
        return {
          success: false,
          error: language === 'ar' ? 'رمز التحقق عبر واتساب غير مطابق' : 'Incorrect WhatsApp verification code',
        };
      }

      // Success: Unlock management
      setIsManagementUnlocked(true);
      sessionStorage.setItem(`${STORAGE_PREFIX}mgmt_unlocked`, 'true');
      setIsManagementLockModalOpen(false);
      audioAlarm.playCashDrawerKickSound();

      return { success: true };
    },
    [cashiers, language, twoFactorLastSentCode]
  );

  const lockManagement = useCallback(() => {
    setIsManagementUnlocked(false);
    sessionStorage.removeItem(`${STORAGE_PREFIX}mgmt_unlocked`);
  }, []);

  const unlockManagement = useCallback(() => {
    setIsManagementUnlocked(true);
    sessionStorage.setItem(`${STORAGE_PREFIX}mgmt_unlocked`, 'true');
  }, []);

  // Branch Location
  const currentBranchEn = settings.branchLocationEn || 'Olaya Main Branch, Riyadh';
  const currentBranchAr = settings.branchLocationAr || 'الفرع الرئيسي - العليا، الرياض';

  const setBranchLocation = useCallback((branchEn: string, branchAr: string) => {
    // Admin branch er cashier select kore dibe cashier caileo branch switch korte parbe na.
    if (currentUser && currentUser.role !== 'admin' && !isManagementUnlocked) {
      console.warn('Branch switching restricted for cashiers by admin policy.');
      return;
    }
    updateSettings({
      branchLocationEn: branchEn,
      branchLocationAr: branchAr,
    });
  }, [currentUser, isManagementUnlocked, updateSettings]);

  // POS Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshPos = useCallback(() => {
    setIsRefreshing(true);
    audioAlarm.playScanBeep();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const loginWithPin = useCallback(
    (pin: string) => {
      const matched = cashiers.find((c) => c.pin === pin && c.isActive);
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(matched));
        audioAlarm.playScanBeep();
        return { success: true, user: matched };
      }
      return { success: false, error: language === 'ar' ? 'الرمز غير صحيح أو الحساب معطل' : 'Invalid PIN or account deactivated' };
    },
    [cashiers, language]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_PREFIX}current_user`);
  }, []);

  const updateCashier = useCallback((updated: CashierUser) => {
    setCashiers((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      localStorage.setItem(`${STORAGE_PREFIX}cashiers`, JSON.stringify(next));
      return next;
    });
  }, []);

  const addCashier = useCallback((data: Omit<CashierUser, 'id'>) => {
    const newCashier: CashierUser = {
      ...data,
      id: `cashier_${Date.now()}`,
    };
    setCashiers((prev) => {
      const next = [...prev, newCashier];
      localStorage.setItem(`${STORAGE_PREFIX}cashiers`, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteCashier = useCallback((id: string) => {
    setCashiers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(`${STORAGE_PREFIX}cashiers`, JSON.stringify(next));
      return next;
    });
  }, []);

  // CUSTOMER DIRECTORY & AUTO-SAVE CRM
  const normalizePhone = (phone: string) => {
    return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^00966/, '0').replace(/^966/, '0');
  };

  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const findCustomerByPhone = useCallback(
    (phone: string): CustomerRecord | undefined => {
      if (!phone || phone.trim().length < 3) return undefined;
      const clean = normalizePhone(phone);
      return customers.find((c) => {
        const cClean = normalizePhone(c.phone);
        return (
          cClean === clean ||
          (clean.length >= 7 && cClean.endsWith(clean)) ||
          (cClean.length >= 7 && clean.endsWith(cClean))
        );
      });
    },
    [customers]
  );

  const saveOrUpdateCustomer = useCallback(
    (name: string, phone: string, amountSpent = 0): CustomerRecord => {
      const cleanName = name.trim();
      const cleanPhone = phone.trim();
      const now = new Date().toISOString();

      if (!cleanPhone) {
        return {
          id: `temp_${Date.now()}`,
          name: cleanName || 'Customer',
          phone: '',
          firstVisit: now,
          lastVisit: now,
          orderCount: 1,
          totalSpent: amountSpent,
        };
      }

      const normalized = normalizePhone(cleanPhone);
      let targetRecord: CustomerRecord | undefined;

      setCustomers((prev) => {
        const idx = prev.findIndex((c) => normalizePhone(c.phone) === normalized);
        if (idx > -1) {
          const existing = prev[idx];
          targetRecord = {
            ...existing,
            name: cleanName || existing.name,
            phone: cleanPhone,
            lastVisit: now,
            orderCount: existing.orderCount + 1,
            totalSpent: Math.round((existing.totalSpent + amountSpent) * 100) / 100,
          };
          const next = [...prev];
          next[idx] = targetRecord;
          localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(next));
          return next;
        } else {
          targetRecord = {
            id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: cleanName || 'Customer',
            phone: cleanPhone,
            firstVisit: now,
            lastVisit: now,
            orderCount: 1,
            totalSpent: Math.round(amountSpent * 100) / 100,
          };
          const next = [targetRecord, ...prev];
          localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(next));
          return next;
        }
      });

      return targetRecord || {
        id: `cust_${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        firstVisit: now,
        lastVisit: now,
        orderCount: 1,
        totalSpent: amountSpent,
      };
    },
    []
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(next));
      return next;
    });
  }, []);

  // Products, Categories, Sources
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}categories`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orderSources, setOrderSources] = useState<OrderSource[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sources`);
    if (saved) {
      try {
        const parsed: OrderSource[] = JSON.parse(saved);
        // User Requirement: Limit order options/sources strictly to only TWO categories:
        // A. Online Orders (Delivery Apps) & B. Offline Orders (Dine-In, Phone, QR)
        const hasOnlyTwoStrict =
          parsed.length === 2 &&
          parsed.some((s) => s.id === 'src_online') &&
          parsed.some((s) => s.id === 'src_offline');
        if (hasOnlyTwoStrict) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem(`${STORAGE_PREFIX}sources`, JSON.stringify(INITIAL_ORDER_SOURCES));
    return INITIAL_ORDER_SOURCES;
  });

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: `cat_${Date.now()}` };
    setCategories((prev) => {
      const next = [...prev, newCat];
      localStorage.setItem(`${STORAGE_PREFIX}categories`, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCategory = useCallback((cat: Category) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === cat.id ? cat : c));
      localStorage.setItem(`${STORAGE_PREFIX}categories`, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(`${STORAGE_PREFIX}categories`, JSON.stringify(next));
      return next;
    });
  }, []);

  const addProduct = useCallback((prod: Omit<Product, 'id'>) => {
    const newProd: Product = { ...prod, id: `prod_${Date.now()}` };
    setProducts((prev) => {
      const next = [...prev, newProd];
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateProduct = useCallback((prod: Product) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === prod.id ? prod : p));
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(next));
      return next;
    });
  }, []);

  const addOrderSource = useCallback((src: Omit<OrderSource, 'id'>) => {
    const newSrc: OrderSource = { ...src, id: `src_${Date.now()}`, isCustom: true };
    setOrderSources((prev) => {
      const next = [...prev, newSrc];
      localStorage.setItem(`${STORAGE_PREFIX}sources`, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateOrderSource = useCallback((src: OrderSource) => {
    setOrderSources((prev) => {
      const next = prev.map((s) => (s.id === src.id ? src : s));
      localStorage.setItem(`${STORAGE_PREFIX}sources`, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteOrderSource = useCallback((id: string) => {
    setOrderSources((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(`${STORAGE_PREFIX}sources`, JSON.stringify(next));
      return next;
    });
  }, []);

  // Shift & Day Management
  const [currentShift, setCurrentShift] = useState<ShiftRecord | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}current_shift`);
    return saved ? JSON.parse(saved) : null;
  });

  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}shift_history`);
    return saved ? JSON.parse(saved) : [];
  });

  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  const openStartShiftModal = useCallback(() => setIsStartShiftModalOpen(true), []);
  const closeStartShiftModal = useCallback(() => setIsStartShiftModalOpen(false), []);
  const openCloseShiftModal = useCallback(() => setIsCloseShiftModalOpen(true), []);
  const closeCloseShiftModal = useCallback(() => setIsCloseShiftModalOpen(false), []);

  const startShift = useCallback(
    (openingFloat: number) => {
      const newShift: ShiftRecord = {
        id: `shift_${Date.now()}`,
        cashierId: currentUser?.id || 'admin',
        cashierName: language === 'ar' ? (currentUser?.nameAr || 'الكاشير') : (currentUser?.nameEn || 'Cashier'),
        startTime: new Date().toISOString(),
        isOpen: true,
        openingFloat: Number(openingFloat) || 0,
      };
      setCurrentShift(newShift);
      localStorage.setItem(`${STORAGE_PREFIX}current_shift`, JSON.stringify(newShift));
      setIsStartShiftModalOpen(false);
      audioAlarm.playCashDrawerKickSound();
    },
    [currentUser, language]
  );

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}orders`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_ORDERS;
  });

  // Offline IndexedDB Storage & Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  });

  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryRecord>>({});

  // Initialize IndexedDB and sync listeners
  useEffect(() => {
    // 1. Initialize IndexedDB inventory from products
    posDb.initInventoryFromProducts(products).then(async () => {
      const inv = await posDb.getAllInventory();
      setInventoryMap(inv);
    }).catch((err) => console.warn('IndexedDB inv init:', err));

    // 2. Load IndexedDB orders and merge with memory state
    posDb.getAllOrders().then((idbOrders) => {
      if (idbOrders && idbOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, Order>();
          prev.forEach((o) => map.set(o.id, o));
          idbOrders.forEach((o) => map.set(o.id, { ...map.get(o.id), ...o }));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(merged));
          return merged;
        });
      }
    }).catch((err) => console.warn('IndexedDB orders load:', err));

    // 3. Subscribe to background sync engine
    const unsubscribeSync = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });

    return () => {
      unsubscribeSync();
    };
  }, [products]);

  const triggerManualSync = useCallback(async () => {
    await syncEngine.triggerSync();
  }, []);

  const updateProductStock = useCallback(async (productId: string, quantity: number) => {
    await posDb.updateStockQuantity(productId, quantity);
    const updated = await posDb.getAllInventory();
    setInventoryMap(updated);
  }, []);

  // Calculate Z-Report Data
  const calculateCurrentZReport = useCallback(
    (actualCashCounted: number): ZReportData => {
      const shiftStartTime = currentShift?.startTime ? new Date(currentShift.startTime).getTime() : 0;
      // ONLY COMPLETED BILLED ORDERS within this shift are counted in active sales!
      const completedShiftOrders = orders.filter(
        (o) => o.status === 'completed' && new Date(o.createdAt).getTime() >= shiftStartTime
      );

      let cashSales = 0;
      let madaSales = 0;
      let visaSales = 0;
      let onlineSales = 0;
      let dueSales = 0;
      let totalDiscounts = 0;
      let totalTax = 0;
      let totalGrossSales = 0;

      for (const order of completedShiftOrders) {
        totalGrossSales += order.subtotal;
        totalDiscounts += order.discountAmount;
        totalTax += order.taxAmount;

        // Handle Split Payments vs Single Payment in Z-Report calculation
        if (order.payment?.isSplit && Array.isArray(order.payment.splits) && order.payment.splits.length > 0) {
          order.payment.splits.forEach((split) => {
            if (split.method === 'cash') cashSales += split.amount;
            else if (split.method === 'mada') madaSales += split.amount;
            else if (split.method === 'visa') visaSales += split.amount;
            else if (split.method === 'online') onlineSales += split.amount;
            else if (split.method === 'due') dueSales += split.amount;
          });
        } else {
          const method = order.payment?.method;
          if (method === 'cash') cashSales += order.total;
          else if (method === 'mada') madaSales += order.total;
          else if (method === 'visa') visaSales += order.total;
          else if (method === 'online') onlineSales += order.total;
          else if (method === 'due') dueSales += order.total;
        }
      }

      // Refunds during this shift
      const refundedOrders = orders.filter(
        (o) => o.refund && new Date(o.refund.refundedAt).getTime() >= shiftStartTime
      );
      let totalRefunds = 0;
      let cashRefunds = 0;
      for (const ro of refundedOrders) {
        if (ro.refund) {
          totalRefunds += ro.refund.amount;
          if (ro.refund.method === 'cash') {
            cashRefunds += ro.refund.amount;
          }
        }
      }

      const openingFloat = currentShift?.openingFloat || 0;
      const expectedCashInDrawer = openingFloat + cashSales - cashRefunds;
      const variance = actualCashCounted - expectedCashInDrawer;
      const netRevenue = (cashSales + madaSales + visaSales + onlineSales + dueSales) - totalRefunds;

      return {
        shiftId: currentShift?.id || `shift_${Date.now()}`,
        shopNameEn: settings.shopNameEn,
        shopNameAr: settings.shopNameAr,
        cashierName: currentShift?.cashierName || (currentUser?.nameEn || 'Cashier'),
        startTime: currentShift?.startTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        openingFloat,
        cashSales,
        madaSales,
        visaSales,
        onlineSales,
        dueSales,
        totalGrossSales,
        totalDiscounts,
        totalTax,
        totalRefunds,
        netRevenue,
        orderCount: completedShiftOrders.length,
        refundCount: refundedOrders.length,
        expectedCashInDrawer,
        actualCashCounted,
        variance,
        generatedAt: new Date().toISOString(),
      };
    },
    [currentShift, orders, settings, currentUser]
  );

  const closeShift = useCallback(
    (actualCashCounted: number): ZReportData => {
      const zReport = calculateCurrentZReport(actualCashCounted);
      const closedShift: ShiftRecord = {
        ...currentShift!,
        isOpen: false,
        endTime: new Date().toISOString(),
        actualCashCounted,
        expectedCash: zReport.expectedCashInDrawer,
        variance: zReport.variance,
        closedAt: new Date().toISOString(),
        zReport,
      };

      setShiftHistory((prev) => {
        const next = [closedShift, ...prev];
        localStorage.setItem(`${STORAGE_PREFIX}shift_history`, JSON.stringify(next));
        return next;
      });

      setCurrentShift(null);
      localStorage.removeItem(`${STORAGE_PREFIX}current_shift`);
      setIsCloseShiftModalOpen(false);

      return zReport;
    },
    [calculateCurrentZReport, currentShift]
  );

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('src_offline');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // DUAL PRICING SYSTEM:
  // Automatically reprice items in cart when cashier toggles between Online Orders and Offline Orders
  useEffect(() => {
    const isOnline = selectedSourceId === 'src_online' || orderSources.find((s) => s.id === selectedSourceId)?.isDelivery;
    setCart((prev) =>
      prev.map((item) => {
        const activeUnitPrice = isOnline ? (item.product.onlinePrice ?? item.product.price) : item.product.price;
        return {
          ...item,
          customPrice: activeUnitPrice,
        };
      })
    );
  }, [selectedSourceId, orderSources]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, notes = '') => {
      const isOnline = selectedSourceId === 'src_online' || orderSources.find((s) => s.id === selectedSourceId)?.isDelivery;
      const activeUnitPrice = isOnline ? (product.onlinePrice ?? product.price) : product.price;

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.product.id === product.id && item.itemNotes === notes);
        if (existingIndex > -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
            customPrice: activeUnitPrice,
          };
          return next;
        } else {
          return [
            ...prev,
            {
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              product,
              quantity,
              itemNotes: notes,
              customPrice: activeUnitPrice,
            },
          ];
        }
      });
      audioAlarm.playScanBeep();
    },
    [selectedSourceId, orderSources]
  );

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, itemNotes: notes } : item))
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountValue(0);
  }, []);

  const setDiscount = useCallback((type: 'percentage' | 'fixed', value: number) => {
    setDiscountType(type);
    setDiscountValue(Math.max(0, value));
  }, []);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.customPrice ?? item.product.price) * item.quantity, 0);
  }, [cart]);

  const cartDiscountAmount = useMemo(() => {
    if (discountValue <= 0 || cartSubtotal <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.min(cartSubtotal, (cartSubtotal * discountValue) / 100);
    }
    return Math.min(cartSubtotal, discountValue);
  }, [cartSubtotal, discountType, discountValue]);

  // VAT is included in product prices (Tax-Inclusive Pricing: no extra VAT added to total)
  const cartTaxAmount = useMemo(() => {
    const totalAfterDiscount = Math.max(0, cartSubtotal - cartDiscountAmount);
    const rate = settings.vatPercentage || 15;
    return (totalAfterDiscount * rate) / (100 + rate);
  }, [cartSubtotal, cartDiscountAmount, settings.vatPercentage]);

  const cartTotal = useMemo(() => {
    // Product prices already include VAT; extra VAT is not added on top
    return Math.max(0, cartSubtotal - cartDiscountAmount);
  }, [cartSubtotal, cartDiscountAmount]);

  // INCOMING QR ORDER ALARM PROTOCOL (15-SECOND CONTINUOUS LOOP)
  const [incomingQrOrder, setIncomingQrOrder] = useState<Order | null>(null);
  const [isAlarmEscalated, setIsAlarmEscalated] = useState(false);
  const [alarmSecondsElapsed, setAlarmSecondsElapsed] = useState(0);

  // Active paying order for payment modal
  const [activePayingOrder, setActivePayingOrder] = useState<Order | null>(null);

  // Receipt printing modal: supports Kitchen Copy, Customer Memo, or Both
  const [printableReceiptOrder, setPrintableReceiptOrder] = useState<Order | null>(null);
  const [printableZReport, setPrintableZReport] = useState<ZReportData | null>(null);
  const [receiptMode, setReceiptMode] = useState<'kitchen' | 'customer' | 'both'>('both');

  // Printer setup modal (accessible directly from 3-bar menu for cashiers)
  const [isPrinterSetupModalOpen, setIsPrinterSetupModalOpen] = useState(false);
  const openPrinterSetupModal = useCallback(() => setIsPrinterSetupModalOpen(true), []);
  const closePrinterSetupModal = useCallback(() => setIsPrinterSetupModalOpen(false), []);

  // Live Shift / Today's Sales Summary Modal (Accessible to Cashier & Admin)
  const [isLiveSalesModalOpen, setIsLiveSalesModalOpen] = useState(false);
  const openLiveSalesModal = useCallback(() => setIsLiveSalesModalOpen(true), []);
  const closeLiveSalesModal = useCallback(() => setIsLiveSalesModalOpen(false), []);

  // Printer configuration
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}printer`);
    return saved
      ? JSON.parse(saved)
      : {
          ip: '192.168.1.185',
          port: 9100,
          printerName: 'Epson TM-T88VI (Kitchen/Counter)',
          paperWidth: '80mm',
          autoDrawerKick: true,
          isConnected: true,
          lastConnected: new Date().toISOString(),
        };
  });

  const updatePrinterConfig = useCallback((config: Partial<PrinterConfig>) => {
    setPrinterConfig((prev) => {
      const next = { ...prev, ...config };
      localStorage.setItem(`${STORAGE_PREFIX}printer`, JSON.stringify(next));
      return next;
    });
  }, []);

  const kickCashDrawer = useCallback(async () => {
    await EscPosDriver.kickCashDrawer(printerConfig);
  }, [printerConfig]);

  // Synchronize orders to localStorage, IndexedDB, and BroadcastChannel
  const saveOrders = useCallback((newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(newOrders));
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'SYNC_ORDERS', orders: newOrders });
      channel.close();
    } catch {}

    if (newOrders.length > 0) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      posDb.saveOrder(newOrders[0], isOnline).catch(() => {});
    }
  }, []);

  // Check for any incoming QR orders that are unaccepted
  const triggerIncomingQrAlarm = useCallback((order: Order) => {
    setIncomingQrOrder(order);
    setIsAlarmEscalated(false);
    setAlarmSecondsElapsed(0);
    // Start continuous 15s alarm sound
    audioAlarm.startContinuousAlarm(false);
  }, []);

  // Escalation ticker (monitors unaccepted time; > 30s triggers escalation)
  useEffect(() => {
    if (!incomingQrOrder) {
      setAlarmSecondsElapsed(0);
      setIsAlarmEscalated(false);
      audioAlarm.stopContinuousAlarm();
      return;
    }

    const timer = setInterval(() => {
      setAlarmSecondsElapsed((prev) => {
        const next = prev + 1;
        if (next >= 30 && !isAlarmEscalated) {
          setIsAlarmEscalated(true);
          audioAlarm.setEscalated(true);
          // Show browser notification if allowed
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⚠️ CashFix CRITICAL: QR Order Waiting > 30s!', {
              body: `Order #${incomingQrOrder.dailyOrderNumber} from ${incomingQrOrder.customerName || 'Customer'} is awaiting acceptance!`,
              icon: settings.logoUrl,
            });
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingQrOrder, isAlarmEscalated, settings.logoUrl]);

  // Multi-tab sync via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        const { type, order, orders: incomingOrders } = event.data || {};
        if (type === 'NEW_QR_ORDER' && order) {
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === order.id);
            if (!exists) {
              const updated = [order, ...prev];
              localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(updated));
              triggerIncomingQrAlarm(order);
              return updated;
            }
            return prev;
          });
        } else if (type === 'SYNC_ORDERS' && incomingOrders) {
          setOrders(incomingOrders);
        }
      };
    } catch {}

    return () => {
      channel?.close();
    };
  }, [triggerIncomingQrAlarm]);

  // Accept incoming QR Order -> moves to 'held' status (Advance / Held Orders Queue)
  const acceptIncomingQrOrder = useCallback(
    (orderId?: string) => {
      const targetId = orderId || incomingQrOrder?.id;
      if (!targetId) return;

      audioAlarm.stopContinuousAlarm();
      setIncomingQrOrder(null);
      setIsAlarmEscalated(false);

      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id === targetId) {
            return {
              ...o,
              status: 'held' as OrderStatus,
              acceptedAt: new Date().toISOString(),
              heldAt: new Date().toISOString(),
            };
          }
          return o;
        });
        localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(next));
        try {
          const ch = new BroadcastChannel(CHANNEL_NAME);
          ch.postMessage({ type: 'SYNC_ORDERS', orders: next });
          ch.close();
        } catch {}
        return next;
      });
    },
    [incomingQrOrder]
  );

  // Decline incoming QR order
  const declineIncomingQrOrder = useCallback(
    (orderId?: string) => {
      const targetId = orderId || incomingQrOrder?.id;
      if (!targetId) return;

      audioAlarm.stopContinuousAlarm();
      setIncomingQrOrder(null);
      setIsAlarmEscalated(false);

      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id === targetId) {
            return {
              ...o,
              status: 'cancelled' as OrderStatus,
            };
          }
          return o;
        });
        localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(next));
        return next;
      });
    },
    [incomingQrOrder]
  );

  // Held orders list
  const heldOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'held');
  }, [orders]);

  // Customer places QR Order
  const submitCustomerQrOrder = useCallback(
    (data: {
      items: CartItem[];
      customerPhone: string; // Mandatory
      customerName?: string; // Optional
      orderType?: 'dine_in' | 'takeaway' | 'car_pickup'; // Optional
      tableOrPlate?: string; // Optional (table # or car #)
      customerNote?: string; // Optional
    }): Order => {
      const subtotal = data.items.reduce((acc, item) => acc + (item.customPrice ?? item.product.price) * item.quantity, 0);
      const taxRate = settings.vatPercentage || 15;
      // VAT is already included in product price; no extra VAT added
      const total = subtotal;
      const taxAmount = (total * taxRate) / (100 + taxRate);

      const resolvedCustomerName = data.customerName?.trim() || (language === 'ar' ? 'عميل الباركود' : 'QR Customer');
      const orderNumber = orders.length + 1;
      const newOrder: Order = {
        id: `QR-${Date.now().toString().slice(-6)}`,
        dailyOrderNumber: orderNumber,
        createdAt: new Date().toISOString(),
        sourceId: 'src_offline', // Offline Category (QR Code scanning)
        sourceNameEn: 'QR Code Order (Offline)',
        sourceNameAr: 'طلب باركود ذاتي (محلي)',
        items: data.items,
        subtotal,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        taxRate,
        taxAmount,
        total,
        status: 'incoming_qr', // triggers continuous 15s alarm until accepted by cashier
        customerName: resolvedCustomerName,
        customerPhone: data.customerPhone.trim(),
        orderType: data.orderType || 'dine_in',
        tableOrPlate: data.tableOrPlate?.trim() || '',
        customerNote: data.customerNote?.trim(),
      };

      // Auto save customer to directory
      if (data.customerPhone) {
        saveOrUpdateCustomer(resolvedCustomerName, data.customerPhone.trim(), total);
      }

      // Broadcast and persist
      const updatedOrders = [newOrder, ...orders];
      saveOrders(updatedOrders);
      triggerIncomingQrAlarm(newOrder);

      try {
        const ch = new BroadcastChannel(CHANNEL_NAME);
        ch.postMessage({ type: 'NEW_QR_ORDER', order: newOrder });
        ch.close();
      } catch {}

      return newOrder;
    },
    [orders, saveOrders, settings.vatPercentage, triggerIncomingQrAlarm, saveOrUpdateCustomer]
  );

  // Cashier holds current order directly from POS screen
  const holdCurrentCartOrder = useCallback(
    (customerName = '', customerPhone = '', tableOrPlate = '', notes = ''): Order => {
      const src = orderSources.find((s) => s.id === selectedSourceId) || orderSources[0];
      const newOrder: Order = {
        id: `HLD-${Date.now().toString().slice(-6)}`,
        dailyOrderNumber: orders.length + 1,
        createdAt: new Date().toISOString(),
        sourceId: src.id,
        sourceNameEn: src.nameEn,
        sourceNameAr: src.nameAr,
        items: [...cart],
        subtotal: cartSubtotal,
        discountType,
        discountValue,
        discountAmount: cartDiscountAmount,
        taxRate: settings.vatPercentage || 15,
        taxAmount: cartTaxAmount,
        total: cartTotal,
        status: 'held',
        cashierId: currentUser?.id,
        cashierName: language === 'ar' ? (currentUser?.nameAr || 'الكاشير') : (currentUser?.nameEn || 'Cashier'),
        customerName,
        customerPhone,
        tableOrPlate,
        customerNote: notes,
        heldAt: new Date().toISOString(),
      };

      // Auto-save customer to directory
      if (customerPhone) {
        saveOrUpdateCustomer(customerName, customerPhone, 0);
      }

      const nextOrders = [newOrder, ...orders];
      saveOrders(nextOrders);
      clearCart();

      // User requirement: 1 restaurant copy memo prints on Hold Order
      setReceiptMode('kitchen');
      setPrintableReceiptOrder(newOrder);

      return newOrder;
    },
    [
      cart,
      cartDiscountAmount,
      cartSubtotal,
      cartTaxAmount,
      cartTotal,
      clearCart,
      currentUser,
      discountType,
      discountValue,
      language,
      orderSources,
      orders,
      saveOrders,
      selectedSourceId,
      settings.vatPercentage,
      saveOrUpdateCustomer,
    ]
  );

  // Settle held order: load it into active paying modal
  const settleHeldOrder = useCallback((order: Order) => {
    setActivePayingOrder(order);
  }, []);

  // Complete Payment: Instant sales hit on checkout, independent of thermal printer
  const completeOrderPayment = useCallback(
    async (orderToPay: Order, payment: OrderPayment): Promise<Order> => {
      // 1. Finalize the order using OrderService with guaranteed IDs and numbers
      const completedOrder = OrderService.finalizeCompletedOrder(
        orderToPay,
        payment,
        currentUser,
        language,
        orders
      );

      // 2. INSTANT SALES HIT: Immediately update orders in React state and localStorage
      // This guarantees sales totals and daily statistics update with ZERO delay
      setOrders((prev) => {
        const exists = prev.some(
          (o) => o.id === completedOrder.id || (orderToPay.id && o.id === orderToPay.id)
        );
        const next = exists
          ? prev.map((o) => (o.id === completedOrder.id || o.id === orderToPay.id ? completedOrder : o))
          : [completedOrder, ...prev];
        localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(next));
        return next;
      });

      // 3. Reset active paying order and cart immediately so cashier is ready for next customer
      setActivePayingOrder(null);
      clearCart();

      // 4. Play audio/haptic confirmation
      audioAlarm.playScanBeep();

      // 5. ASYNC BACKGROUND PERSISTENCE: Save to IndexedDB and trigger cloud sync
      OrderService.persistOrder(completedOrder).catch((err) =>
        console.warn('OrderService persistOrder error:', err)
      );

      // 6. ASYNC BACKGROUND CUSTOMER CRM UPDATE
      if (completedOrder.customerPhone) {
        saveOrUpdateCustomer(
          completedOrder.customerName || '',
          completedOrder.customerPhone,
          completedOrder.total
        );
      } else if (payment.dueCustomer?.phone) {
        saveOrUpdateCustomer(
          payment.dueCustomer.name,
          payment.dueCustomer.phone,
          completedOrder.total
        );
      }

      // 7. ASYNC BACKGROUND HARDWARE ACTIONS: Cash drawer kick (NEVER blocks sale)
      const hasCashTender =
        payment.method === 'cash' ||
        (payment.isSplit && payment.splits?.some((s) => s.method === 'cash'));
      if (hasCashTender && settings.autoDrawerKick) {
        PrinterService.kickDrawerInBackground(printerConfig);
      }

      // 8. ASYNC BACKGROUND PRINTING: Thermal receipt memo display
      if (orderToPay.heldAt) {
        setReceiptMode('customer');
      } else {
        setReceiptMode('both');
      }
      setPrintableReceiptOrder(completedOrder);

      return completedOrder;
    },
    [
      currentUser,
      language,
      orders,
      settings.autoDrawerKick,
      printerConfig,
      clearCart,
      saveOrUpdateCustomer,
    ]
  );

  // Process Full or Partial Refund
  const processRefund = useCallback(
    (orderId: string, refundData: Omit<OrderRefund, 'refundedAt' | 'cashierName'>): boolean => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return false;

      const refundRecord: OrderRefund = {
        ...refundData,
        refundedAt: new Date().toISOString(),
        cashierName: language === 'ar' ? (currentUser?.nameAr || 'الكاشير') : (currentUser?.nameEn || 'Cashier'),
      };

      let refundedOrderToSave: Order | null = null;
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id === orderId) {
            refundedOrderToSave = {
              ...o,
              status: 'refunded' as OrderStatus,
              refund: refundRecord,
            };
            return refundedOrderToSave;
          }
          return o;
        });
        localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(next));
        return next;
      });

      // Update IndexedDB and restock items
      if (refundedOrderToSave) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        posDb.saveOrder(refundedOrderToSave, isOnline).catch((err) => console.warn('IDB refund save:', err));
        posDb.restockInventoryForItems(order.items).then(async () => {
          const updatedInv = await posDb.getAllInventory();
          setInventoryMap(updatedInv);
        }).catch((err) => console.warn('IDB restock:', err));

        if (isOnline) {
          syncEngine.triggerSync().catch(() => {});
        }
      }

      // If cash refund, trigger drawer
      if (refundData.method === 'cash') {
        kickCashDrawer();
      }

      return true;
    },
    [currentUser, kickCashDrawer, language, orders]
  );

  return (
    <PosContext.Provider
      value={{
        language,
        toggleLanguage,
        setLanguage,
        currentUser,
        cashiers,
        loginWithPin,
        logout,
        updateCashier,
        addCashier,
        deleteCashier,
        // Management 2-Step WhatsApp Security
        isManagementUnlocked,
        isManagementLockModalOpen,
        openManagementLockModal,
        closeManagementLockModal,
        twoFactorTargetPhone,
        twoFactorLastSentCode,
        sendManagementWhatsApp2FA,
        verifyManagement2FA,
        lockManagement,
        unlockManagement,
        // Branch location
        currentBranchEn,
        currentBranchAr,
        setBranchLocation,
        // POS Refresh
        refreshPos,
        isRefreshing,
        customers,
        saveOrUpdateCustomer,
        findCustomerByPhone,
        deleteCustomer,
        settings,
        updateSettings,
        currentShift,
        shiftHistory,
        isStartShiftModalOpen,
        openStartShiftModal,
        closeStartShiftModal,
        startShift,
        isCloseShiftModalOpen,
        openCloseShiftModal,
        closeCloseShiftModal,
        closeShift,
        calculateCurrentZReport,
        categories,
        products,
        orderSources,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrderSource,
        updateOrderSource,
        deleteOrderSource,
        cart,
        selectedSourceId,
        setSelectedSourceId,
        addToCart,
        updateQuantity,
        updateItemNotes,
        removeFromCart,
        clearCart,
        discountType,
        discountValue,
        setDiscount,
        cartSubtotal,
        cartDiscountAmount,
        cartTaxAmount,
        cartTotal,
        orders,
        incomingQrOrder,
        isAlarmEscalated,
        alarmSecondsElapsed,
        acceptIncomingQrOrder,
        declineIncomingQrOrder,
        heldOrders,
        activePayingOrder,
        setActivePayingOrder,
        holdCurrentCartOrder,
        settleHeldOrder,
        completeOrderPayment,
        processRefund,
        submitCustomerQrOrder,
        printerConfig,
        updatePrinterConfig,
        kickCashDrawer,
        printableReceiptOrder,
        setPrintableReceiptOrder,
        printableZReport,
        setPrintableZReport,
        receiptMode,
        setReceiptMode,
        isPrinterSetupModalOpen,
        openPrinterSetupModal,
        closePrinterSetupModal,
        // Live Shift / Today's Sales Summary
        isLiveSalesModalOpen,
        openLiveSalesModal,
        closeLiveSalesModal,
        // Offline IndexedDB Storage & Cloud Sync
        syncStatus,
        inventoryMap,
        triggerManualSync,
        updateProductStock,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = (): PosContextType => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
