export type Language = 'en' | 'ar';

export type UserRole = 'admin' | 'cashier';

export interface CashierPermissions {
  canTakeOrders: boolean; // Take orders & checkout
  canAddProducts: boolean; // Add, edit or delete menu items in catalog
  canProcessRefunds: boolean; // Process full or partial refunds
  canHoldOrders: boolean; // Hold or release advance orders
  canViewReports: boolean; // Access Z-report and shift revenue history
  canAccessManagement: boolean; // Access management & store settings
}

export interface CashierUser {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  pin: string; // 4-digit PIN
  role: UserRole;
  isActive: boolean;
  avatarColor: string;
  permissions?: CashierPermissions;
  assignedBranchEn?: string; // Admin assigns cashier to specific branch
  assignedBranchAr?: string;
}

export interface StoreSettings {
  shopNameEn: string;
  shopNameAr: string;
  logoUrl: string;
  addressEn: string;
  addressAr: string;
  branchLocationEn: string; // Branch location shown under shop name
  branchLocationAr: string;
  availableBranches?: string[];
  phone: string;
  taxNumber: string; // VAT registration #
  vatPercentage: number; // e.g., 15
  vatInclusive?: boolean; // VAT included in product prices (no extra added)
  currencyEn: string; // e.g., 'SAR'
  currencyAr: string; // e.g., 'ر.س'
  adminWhatsApp: string; // e.g., '+966501234567'
  receiptFooterEn: string;
  receiptFooterAr: string;
  autoPrintReceipt: boolean;
  autoDrawerKick: boolean;
  soundEnabled: boolean;
}

export type OrderMode = 'offline' | 'online';

export interface DeliveryPlatform {
  id: string;
  nameEn: string;
  nameAr: string;
  badgeColor: string;
  logoBg: string;
}

export interface OrderSource {
  id: string;
  nameEn: string;
  nameAr: string;
  badgeColor: string;
  isDelivery: boolean;
  isActive: boolean;
  isCustom?: boolean;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number; // Offline Order Price (Dine-In, Phone, QR)
  onlinePrice?: number; // Online Order Price (Delivery Apps: HungerStation, Jahez, etc.)
  categoryId: string;
  image: string;
  isAvailable: boolean;
  barcode?: string;
  taxRate?: number; // defaults to store tax if not set
  stockQuantity?: number; // Tracked inventory quantity in IndexedDB
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  product: Product;
  quantity: number;
  itemNotes?: string;
  customPrice?: number;
}

export type OrderStatus =
  | 'incoming_qr' // New QR order requiring manual acceptance (triggers continuous 15s alarm)
  | 'held' // In Advance / Held Orders queue (Preparing / Unpaid)
  | 'completed' // Billed and paid (added to active sales)
  | 'refunded' // Fully or partially refunded
  | 'cancelled'; // Rejected or voided

export type PaymentMethod = 'cash' | 'mada' | 'visa' | 'online' | 'due' | 'split';

export type RefundPaymentMethod = 'cash' | 'mada' | 'online' | 'visa' | 'card';

export interface SplitPaymentEntry {
  method: 'cash' | 'mada' | 'visa' | 'due' | 'online';
  amount: number;
  deliveryPlatformName?: string;
  cashTendered?: number; // Cash given by customer if > amount
  changeDue?: number; // Change returned to customer for cash portion
  cardTransactionRef?: string;
  dueCustomer?: {
    name: string;
    phone: string;
    notes?: string;
  };
}

export interface OrderPayment {
  method: PaymentMethod;
  deliveryPlatformName?: string; // HungerStation, Jahez, ToYou, Keeta, Ninja, etc.
  tenderAmount: number;
  changeDue: number;
  paidAt: string;
  isSplit?: boolean;
  splits?: SplitPaymentEntry[];
  dueCustomer?: {
    name: string;
    phone: string;
    notes?: string;
  };
  cardTransactionRef?: string;
}

export interface OrderRefund {
  refundedAt: string;
  amount: number;
  type: 'full' | 'partial';
  reason: string;
  method: RefundPaymentMethod; // cash, mada, online, visa, card
  cashierName: string;
  refundMethodNote?: string;
  transactionRef?: string;
}

export interface Order {
  id: string;
  dailyOrderNumber: number; // e.g. 1, 2, 3
  createdAt: string;
  sourceId: string;
  sourceNameEn: string;
  sourceNameAr: string;
  items: CartItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: OrderStatus;
  cashierId?: string;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  customerNote?: string;
  orderType?: 'dine_in' | 'takeaway' | 'car_pickup';
  tableOrPlate?: string;
  orderMode?: OrderMode; // 'offline' | 'online'
  deliveryPlatformName?: string; // e.g. 'HungerStation', 'Jahez', 'ToYou', 'Keeta'
  payment?: OrderPayment;
  refund?: OrderRefund;
  acceptedAt?: string;
  heldAt?: string;
  completedAt?: string;
  escalatedToAdmin?: boolean; // if unaccepted > 30s
  syncStatus?: 'synced' | 'pending'; // IndexedDB offline sync tracking
  syncedAt?: string;
}

export interface ShiftRecord {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  isOpen: boolean;
  openingFloat: number; // starting cash in drawer
  actualCashCounted?: number;
  expectedCash?: number;
  variance?: number; // actual - expected (negative = shortage, positive = overage)
  closedAt?: string;
  zReport?: ZReportData;
}

export interface ZReportData {
  shiftId: string;
  shopNameEn: string;
  shopNameAr: string;
  cashierName: string;
  startTime: string;
  endTime: string;
  openingFloat: number;
  // Payment breakdowns
  cashSales: number;
  madaSales: number;
  visaSales: number;
  onlineSales: number;
  dueSales: number;
  totalGrossSales: number;
  totalDiscounts: number;
  totalTax: number;
  totalRefunds: number;
  netRevenue: number; // Completed billed sales minus refunds
  orderCount: number;
  refundCount: number;
  // Cash drawer balancing
  expectedCashInDrawer: number; // openingFloat + cashSales - cashRefunds
  actualCashCounted: number;
  variance: number; // actual - expected
  generatedAt: string;
}

export interface DiscoveredPrinter {
  ip: string;
  port: number;
  name: string;
  model: string;
  mac: string;
  status: 'online' | 'offline';
  isDefault: boolean;
  latencyMs: number;
}

export interface PrinterConfig {
  ip: string;
  port: number;
  printerName: string;
  paperWidth: '80mm' | '58mm';
  autoDrawerKick: boolean;
  isConnected: boolean;
  lastConnected?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  firstVisit: string;
  lastVisit: string;
  orderCount: number;
  totalSpent: number;
  notes?: string;
}
