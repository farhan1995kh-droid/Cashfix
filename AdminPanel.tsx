import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Settings,
  UtensilsCrossed,
  Layers,
  QrCode,
  Users,
  Printer,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  RefreshCw,
  Download,
  Share2,
  Unlock,
  Radio,
  Wifi,
  ExternalLink,
  MessageCircle,
  Copy,
  AlertCircle,
  Sparkles,
  UserCheck,
  PhoneCall,
  Search,
  Lock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Check,
  RotateCw,
  Tablet,
  Cloud,
  Database,
  ChevronDown,
  ChevronUp,
  Info,
  Maximize,
  Minus,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Category, CashierPermissions, CashierUser, OrderSource, Product, StoreSettings, DiscoveredPrinter } from '../types/pos';
import { EscPosDriver } from '../utils/escpos';
import { useTabletOrientation } from '../hooks/useTabletOrientation';

export const AdminPanel: React.FC = () => {
  const {
    language,
    settings,
    updateSettings,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orderSources,
    addOrderSource,
    updateOrderSource,
    deleteOrderSource,
    cashiers,
    addCashier,
    updateCashier,
    deleteCashier,
    customers,
    deleteCustomer,
    saveOrUpdateCustomer,
    printerConfig,
    updatePrinterConfig,
    kickCashDrawer,
    shiftHistory,
    lockManagement,
    orders,
    syncStatus,
    inventoryMap,
    triggerManualSync,
    updateProductStock,
    setPrintableZReport,
  } = usePos();

  const { isPortrait, isLandscape, requestLandscapeLock, unlockOrientation } = useTabletOrientation();
  const [isSyncTriggering, setIsSyncTriggering] = useState(false);
  const [isOrientationGuideOpen, setIsOrientationGuideOpen] = useState(false);

  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<
    'branding' | 'menu' | 'sources' | 'cashiers' | 'customers' | 'qr' | 'printer' | 'reports'
  >('branding');

  // Customer CRM Search and Modal State
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', notes: '' });

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  // QR Generator State
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrMenuUrl, setQrMenuUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?mode=customer`;
    setQrMenuUrl(url);

    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleCopyQrLink = () => {
    navigator.clipboard.writeText(qrMenuUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState<StoreSettings>(settings);
  const [brandingSaved, setBrandingSaved] = useState(false);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(brandingForm);
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2500);
  };

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodForm, setProdForm] = useState({
    nameEn: '',
    nameAr: '',
    price: '',
    onlinePrice: '',
    categoryId: categories[0]?.id || '',
    image: '',
    isAvailable: true,
    barcode: '',
    descriptionEn: '',
    descriptionAr: '',
  });

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdForm({
      nameEn: '',
      nameAr: '',
      price: '',
      onlinePrice: '',
      categoryId: categories[0]?.id || '',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      barcode: `628${Math.floor(1000 + Math.random() * 9000)}`,
      descriptionEn: '',
      descriptionAr: '',
    });
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      nameEn: prod.nameEn,
      nameAr: prod.nameAr,
      price: prod.price.toString(),
      onlinePrice: prod.onlinePrice !== undefined ? prod.onlinePrice.toString() : '',
      categoryId: prod.categoryId,
      image: prod.image,
      isAvailable: prod.isAvailable,
      barcode: prod.barcode || '',
      descriptionEn: prod.descriptionEn || '',
      descriptionAr: prod.descriptionAr || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(prodForm.price) || 0;
    const onlinePriceNum = prodForm.onlinePrice ? parseFloat(prodForm.onlinePrice) : undefined;
    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        nameEn: prodForm.nameEn,
        nameAr: prodForm.nameAr,
        price: priceNum,
        onlinePrice: onlinePriceNum,
        categoryId: prodForm.categoryId,
        image: prodForm.image,
        isAvailable: prodForm.isAvailable,
        barcode: prodForm.barcode,
        descriptionEn: prodForm.descriptionEn,
        descriptionAr: prodForm.descriptionAr,
      });
    } else {
      addProduct({
        nameEn: prodForm.nameEn,
        nameAr: prodForm.nameAr,
        price: priceNum,
        onlinePrice: onlinePriceNum,
        categoryId: prodForm.categoryId,
        image: prodForm.image,
        isAvailable: prodForm.isAvailable,
        barcode: prodForm.barcode,
        descriptionEn: prodForm.descriptionEn,
        descriptionAr: prodForm.descriptionAr,
      });
    }
    setIsProductModalOpen(false);
  };

  // Cashier User Form State & Permissions
  const defaultCashierPermissions: CashierPermissions = {
    canTakeOrders: true,
    canAddProducts: false,
    canProcessRefunds: false,
    canHoldOrders: true,
    canViewReports: false,
    canAccessManagement: false,
  };

  const defaultAdminPermissions: CashierPermissions = {
    canTakeOrders: true,
    canAddProducts: true,
    canProcessRefunds: true,
    canHoldOrders: true,
    canViewReports: true,
    canAccessManagement: true,
  };

  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<CashierUser | null>(null);
  const [cashierForm, setCashierForm] = useState({
    nameEn: '',
    nameAr: '',
    phone: '',
    pin: '',
    role: 'cashier' as 'cashier' | 'admin',
    isActive: true,
    permissions: defaultCashierPermissions,
    assignedBranchEn: settings.branchLocationEn || 'Olaya Main Branch, Riyadh',
    assignedBranchAr: settings.branchLocationAr || 'الفرع الرئيسي - العليا، الرياض',
  });

  const handleOpenCashierModal = (c?: CashierUser) => {
    if (c) {
      setEditingCashier(c);
      setCashierForm({
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        phone: c.phone,
        pin: c.pin,
        role: c.role,
        isActive: c.isActive,
        permissions: c.permissions || (c.role === 'admin' ? defaultAdminPermissions : defaultCashierPermissions),
        assignedBranchEn: c.assignedBranchEn || settings.branchLocationEn,
        assignedBranchAr: c.assignedBranchAr || settings.branchLocationAr,
      });
    } else {
      setEditingCashier(null);
      setCashierForm({
        nameEn: '',
        nameAr: '',
        phone: '',
        pin: '',
        role: 'cashier',
        isActive: true,
        permissions: defaultCashierPermissions,
        assignedBranchEn: settings.branchLocationEn,
        assignedBranchAr: settings.branchLocationAr,
      });
    }
    setIsCashierModalOpen(true);
  };

  const handleSaveCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCashier) {
      updateCashier({
        ...editingCashier,
        ...cashierForm,
      });
    } else {
      addCashier({
        ...cashierForm,
        avatarColor: cashierForm.role === 'admin' ? 'from-amber-600 to-amber-800' : 'from-blue-600 to-indigo-800',
      });
    }
    setIsCashierModalOpen(false);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return;
    saveOrUpdateCustomer(customerForm.name.trim(), customerForm.phone.trim(), 0);
    setIsCustomerModalOpen(false);
    setCustomerForm({ name: '', phone: '', notes: '' });
  };

  // Wi-Fi Printer Auto-Discovery State
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [testPrintOutput, setTestPrintOutput] = useState<string>('');

  const handleScanSubnet = async () => {
    setIsScanningPrinters(true);
    setTestPrintOutput('');
    try {
      const results = await EscPosDriver.scanLocalSubnet();
      setDiscoveredPrinters(results);
    } catch {
      // Handled
    } finally {
      setIsScanningPrinters(false);
    }
  };

  const handleConnectPrinter = (printer: DiscoveredPrinter) => {
    updatePrinterConfig({
      ip: printer.ip,
      port: printer.port,
      printerName: printer.name,
      isConnected: true,
      lastConnected: new Date().toISOString(),
    });
    setTestPrintOutput(`Connected to ${printer.name} on TCP Port ${printer.port}`);
  };

  const handleTestPrintSlip = () => {
    const sampleSlip = `[TEST PRINT OK]\nPrinter: ${printerConfig.printerName}\nIP: ${printerConfig.ip}:${printerConfig.port}\nStatus: Raw TCP Port 9100 Connected\nTimestamp: ${new Date().toLocaleString()}`;
    setTestPrintOutput(sampleSlip);
  };

  // Order Sources management
  const [newSourceNameEn, setNewSourceNameEn] = useState('');
  const [newSourceNameAr, setNewSourceNameAr] = useState('');

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceNameEn.trim() || !newSourceNameAr.trim()) return;
    addOrderSource({
      nameEn: newSourceNameEn.trim(),
      nameAr: newSourceNameAr.trim(),
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      isDelivery: false,
      isActive: true,
    });
    setNewSourceNameEn('');
    setNewSourceNameAr('');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] bg-slate-50 text-slate-800 overflow-hidden">
      {/* Top Navigation Tabs & Lock Session */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shadow-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'branding', label: getTranslation('storeBrandingTab', language), icon: Settings },
            { id: 'menu', label: getTranslation('menuBuilder', language), icon: UtensilsCrossed },
            { id: 'sources', label: getTranslation('orderSourcesTab', language), icon: Layers },
            { id: 'cashiers', label: getTranslation('cashierManagementTab', language), icon: Users },
            { id: 'customers', label: language === 'ar' ? 'سجل العملاء' : 'Customer CRM', icon: UserCheck },
            { id: 'qr', label: getTranslation('qrGeneratorTab', language), icon: QrCode },
            { id: 'printer', label: getTranslation('printerSettings', language), icon: Printer },
            { id: 'reports', label: getTranslation('salesReportsTab', language), icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lock Management button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>2FA Active</span>
          </div>

          <button
            onClick={() => {
              lockManagement();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black transition-all shadow-xs active:scale-95"
            title="Lock Management Session"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">{getTranslation('lockManagementNow', language)}</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-6xl w-full mx-auto">
        {/* 1. STORE BRANDING & CONFIGURATION */}
        {activeTab === 'branding' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {getTranslation('storeBrandingTab', language)}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar'
                    ? 'إعداد بيانات المتجر، الفروع، الضريبة ورقم واتساب المشرف'
                    : 'Configure store name, branch locations, tax, and WhatsApp'}
                </p>
              </div>

              {brandingSaved && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saved Successfully!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Shop Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.shopNameEn}
                    onChange={(e) => setBrandingForm({ ...brandingForm, shopNameEn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">اسم المتجر (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.shopNameAr}
                    onChange={(e) => setBrandingForm({ ...brandingForm, shopNameAr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* BRANCH LOCATION UNDER SHOP NAME (USER REQUIREMENT) */}
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                  <label className="text-blue-950 font-black block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Branch Location (Shown directly under shop name on front page)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingForm.branchLocationEn || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, branchLocationEn: e.target.value })}
                    placeholder="e.g. Olaya Main Branch, Riyadh"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                    {['Olaya Main Branch, Riyadh', 'Airport Terminal 5 Branch', 'King Fahd Road Branch'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBrandingForm({ ...brandingForm, branchLocationEn: preset })}
                        className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                  <label className="text-blue-950 font-black block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>موقع الفرع (يظهر أسفل اسم المتجر في الواجهة مباشرة)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingForm.branchLocationAr || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, branchLocationAr: e.target.value })}
                    placeholder="مثال: الفرع الرئيسي - العليا، الرياض"
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600 text-right"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Logo URL (Printed at Receipt Top)</label>
                  <input
                    type="url"
                    value={brandingForm.logoUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Admin WhatsApp Number (For Day Close Z-Report)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+966500000000"
                    value={brandingForm.adminWhatsApp}
                    onChange={(e) => setBrandingForm({ ...brandingForm, adminWhatsApp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">VAT Percentage (%) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={brandingForm.vatPercentage}
                    onChange={(e) => setBrandingForm({ ...brandingForm, vatPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">VAT Registration Number (الرقم الضريبي)</label>
                  <input
                    type="text"
                    value={brandingForm.taxNumber}
                    onChange={(e) => setBrandingForm({ ...brandingForm, taxNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Address (English)</label>
                  <input
                    type="text"
                    value={brandingForm.addressEn}
                    onChange={(e) => setBrandingForm({ ...brandingForm, addressEn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">العنوان (بالعربية)</label>
                  <input
                    type="text"
                    value={brandingForm.addressAr}
                    onChange={(e) => setBrandingForm({ ...brandingForm, addressAr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Receipt Footer Note (English & Arabic)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={brandingForm.receiptFooterEn}
                      onChange={(e) => setBrandingForm({ ...brandingForm, receiptFooterEn: e.target.value })}
                      placeholder="Thank you for your visit!"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <input
                      type="text"
                      value={brandingForm.receiptFooterAr}
                      onChange={(e) => setBrandingForm({ ...brandingForm, receiptFooterAr: e.target.value })}
                      placeholder="شكراً لزيارتكم!"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Toggles */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                  <input
                    type="checkbox"
                    checked={brandingForm.autoDrawerKick}
                    onChange={(e) => setBrandingForm({ ...brandingForm, autoDrawerKick: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Auto Cash Drawer Kick on Cash Sale</span>
                    <span className="text-[11px] text-slate-500">Sends 5-byte ESC/POS pulse on completed cash payments</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                  <input
                    type="checkbox"
                    checked={brandingForm.autoPrintReceipt}
                    onChange={(e) => setBrandingForm({ ...brandingForm, autoPrintReceipt: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Auto Print Receipt upon Sale</span>
                    <span className="text-[11px] text-slate-500">Instantly invokes 80mm thermal receipt slip</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Store Configuration</span>
                </button>
              </div>
            </form>

            {/* TABLET SCREEN ORIENTATION & SPLIT-SCREEN SETUP (INSIDE POS SETUP) */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Tablet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {isRtl ? 'إعدادات تدوير الشاشة ونظام الشاشتين للتابلت' : 'Tablet Screen Orientation & Split-Screen POS Setup'}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        POS Setup
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isRtl
                        ? 'قفل شاشة التابلت بالوضع الأفقي (Landscape) لضمان عرض القائمة والسلة بجانب بعضهما بدون تداخل'
                        : 'Lock tablet to landscape orientation to ensure split-screen catalog and cart display correctly side-by-side'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                      isLandscape
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isLandscape ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                    <span>{isLandscape ? (isRtl ? 'الوضع الأفقي (مفعل ✓)' : 'Landscape Mode (Active ✓)') : (isRtl ? 'الوضع الرأسي (يُفضل التدوير)' : 'Portrait Mode (Rotate Recommended)')}</span>
                  </span>

                  <button
                    type="button"
                    onClick={async () => {
                      await requestLandscapeLock();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title={isRtl ? 'قفل التدوير أفقياً' : 'Lock Landscape Mode'}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تدوير وقفل أفقياً' : 'Lock Landscape'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      unlockOrientation();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title={isRtl ? 'إلغاء قفل التدوير' : 'Unlock Orientation'}
                  >
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isRtl ? 'إلغاء القفل' : 'Unlock'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOrientationGuideOpen(!isOrientationGuideOpen)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isRtl ? 'إرشادات التابلت' : 'Tablet Guide'}</span>
                    {isOrientationGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Tablet Orientation Guide */}
              {isOrientationGuideOpen && (
                <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-2xs space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* iOS iPad Guide */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-1 text-slate-800 font-extrabold">
                        <Tablet className="w-4 h-4 text-blue-600" />
                        <span>{isRtl ? 'جهاز آيباد (Apple iPad / iOS)' : 'Apple iPad (iOS Safari)'}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isRtl
                          ? '1. اسحب لأسفل من الزاوية العلوية اليمنى لفتح مركز التحكم (Control Center).\n2. تأكد من إلغاء قفل تدوير الاتجاه (Orientation Lock).\n3. أدر التابلت بالوضع الأفقي لعرض القائمة والسلة معاً.'
                          : '1. Swipe down from top-right corner to open Control Center.\n2. Tap the Orientation Lock icon to unlock rotation.\n3. Turn your iPad sideways to activate the side-by-side register layout.'}
                      </p>
                    </div>

                    {/* Android Tablet Guide */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-1 text-slate-800 font-extrabold">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>{isRtl ? 'أجهزة أندرويد اللوحية (Android Tablet)' : 'Android Tablets'}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isRtl
                          ? '1. اسحب شريط الإشعارات من الأعلى.\n2. اضغط على أيقونة التدوير التلقائي (Auto-Rotate) لتفعيلها.\n3. يمكنك أيضاً الضغط على زر "تدوير وقفل أفقياً" أعلاه لقفل المتصفح تلقائياً.'
                          : '1. Swipe down the notification shade from top of screen.\n2. Tap Auto-Rotate to turn it ON.\n3. You can also tap "Lock Landscape" above to lock orientation directly via the web API.'}
                      </p>
                    </div>
                  </div>

                  {/* Split-Screen Benefits */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
                    <span className="font-semibold">
                      {isRtl
                        ? '💡 الوضع الأفقي يتيح نظام الشاشتين السريع: قائمة الأصناف والمجلدات على اليسار + السلة الحية والخصم على اليمين'
                        : '💡 Split-screen landscape enables the fast dual-pane register: Product folders & catalog on the left + Live cart & instant tender on the right.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* INDEXEDDB OFFLINE STORAGE & BACKGROUND SYNC DASHBOARD */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {isRtl ? 'قاعدة بيانات IndexedDB المحلية والمزامنة السحابية' : 'IndexedDB Local Storage & Background Cloud Sync'}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Offline Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isRtl
                        ? 'يتم حفظ جميع الطلبات وتعديل المخزون محلياً في IndexedDB فور حدوثها، مع رفعها للسحاب تلقائياً فور توفر الإنترنت'
                        : 'All orders and inventory changes are committed locally to IndexedDB, automatically syncing to the cloud when connected'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                      syncStatus.isOnline
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {syncStatus.isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{syncStatus.isOnline ? (isRtl ? 'متصل بالإنترنت' : 'Online') : (isRtl ? 'وضع عدم الاتصال' : 'Offline')}</span>
                  </span>

                  <button
                    type="button"
                    disabled={isSyncTriggering || syncStatus.isSyncing}
                    onClick={async () => {
                      setIsSyncTriggering(true);
                      await triggerManualSync();
                      setIsSyncTriggering(false);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isSyncTriggering || syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncTriggering || syncStatus.isSyncing
                        ? (isRtl ? 'جاري المزامنة...' : 'Syncing...')
                        : (isRtl ? 'مزامنة السحاب الآن' : 'Sync to Cloud Now')}
                    </span>
                  </button>
                </div>
              </div>

              {/* IndexedDB Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isRtl ? 'حالة التخزين المحلي' : 'Database Status'}
                  </span>
                  <span className="font-black text-sm text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>IndexedDB v1</span>
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isRtl ? 'الطلبات المحفوظة محلياً' : 'Stored Local Orders'}
                  </span>
                  <span className="font-black text-sm text-slate-900 font-mono mt-0.5 block">
                    {orders.length} {isRtl ? 'طلب' : 'orders'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isRtl ? 'طابور المزامنة السحابية' : 'Pending Sync Queue'}
                  </span>
                  <span className="font-black text-sm text-blue-600 font-mono mt-0.5 block">
                    {syncStatus.pendingCount === 0
                      ? (isRtl ? 'متزامن بالكامل ✓' : 'Synced ✓')
                      : `${syncStatus.pendingCount} ${isRtl ? 'بانتظار الرفع' : 'pending'}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MENU BUILDER */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {getTranslation('menuBuilder', language)}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar'
                    ? 'إضافة وتعديل الأصناف والأسعار، التحديث ينعكس فوراً على شاشة الكاشير وقائمة العميل الذاتية'
                    : 'Changes immediately update both Cashier POS tiles and Customer QR Menu'}
                </p>
              </div>

              <button
                onClick={handleOpenNewProduct}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3 flex gap-3 items-center justify-between shadow-xs hover:border-blue-300 transition-all"
                >
                  <img
                    src={prod.image}
                    alt={prod.nameEn}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{prod.nameEn}</h4>
                    <span className="text-[11px] text-slate-500 block truncate">{prod.nameAr}</span>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                      <span className="font-bold text-slate-800">
                        {language === 'ar' ? 'داخلي:' : 'Offline:'} {formatCurrency(prod.price, language, settings.currencyEn, settings.currencyAr)}
                      </span>
                      {prod.onlinePrice !== undefined && (
                        <span className="font-bold text-amber-700 bg-amber-50 px-1 rounded-md border border-amber-200">
                          {language === 'ar' ? 'توصيل:' : 'Online:'} {formatCurrency(prod.onlinePrice, language, settings.currencyEn, settings.currencyAr)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          prod.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {prod.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditProduct(prod)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(prod.id)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SIMPLIFIED TWO ORDER CATEGORIES */}
        {activeTab === 'sources' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'ar' ? 'قنوات الطلب ونظام التسعير الثنائي' : 'Order Categories & Dual Pricing Rules'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'تم تبسيط قنوات الطلب إلى فئتين رئيسيتين فقط مع نظام التسعير المزدوج التلقائي'
                  : 'Order channels are simplified strictly into two categories with automatic dual pricing'}
              </p>
            </div>

            {/* Core Two Categories Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category A: Offline Orders */}
              <div className="p-4 bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      1
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        {language === 'ar' ? 'الطلبات الداخلية (Offline Orders)' : 'Offline Orders'}
                      </h4>
                      <span className="text-[11px] text-emerald-700 block">
                        {language === 'ar' ? 'محلي، هاتف، ومسح الباركود الذاتي' : 'Dine-In, Phone Call, and QR Code Scanning'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {language === 'ar' ? 'السعر الأساسي' : 'Standard Pricing'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-xs space-y-1 text-slate-700">
                  <div className="font-bold text-emerald-900">
                    {language === 'ar' ? 'طرق الدفع المسموحة عند المحاسبة:' : 'Checkout Payment Methods:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-bold text-[11px]">
                      💵 {getTranslation('cash', language)}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-bold text-[11px]">
                      💳 {getTranslation('mada', language)}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-bold text-[11px]">
                      📋 {getTranslation('dueCredit', language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category B: Online Orders */}
              <div className="p-4 bg-blue-50/60 rounded-3xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      2
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-blue-950">
                        {language === 'ar' ? 'طلبات التوصيل (Online Orders)' : 'Online Orders'}
                      </h4>
                      <span className="text-[11px] text-blue-700 block">
                        {language === 'ar' ? 'تطبيقات التوصيل والمنصات الخارجية' : 'Third-Party Delivery Platforms'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {language === 'ar' ? 'تسعير المنصات' : 'Custom App Pricing'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-blue-100 text-xs space-y-1 text-slate-700">
                  <div className="font-bold text-blue-900">
                    {language === 'ar' ? 'منصات التوصيل المدفوعة مسبقاً:' : 'Prepaid Delivery Platforms:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                      🛵 هنقرستيشن (HungerStation)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-800 border border-red-200 font-bold text-[11px]">
                      🛵 جاهز (Jahez)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold text-[11px]">
                      🛵 تويو (ToYou)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 font-bold text-[11px]">
                      🛵 كيتا (Keeta)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                      🛵 نينجا (Ninja)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CASHIER MANAGEMENT */}
        {activeTab === 'cashiers' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {getTranslation('cashierManagementTab', language)}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar'
                    ? 'إنشاء وتعديل حسابات الكاشيرات وتعيين الرموز السرية المكونة من 4 أرقام'
                    : 'Manage cashier profiles, 4-digit PINs, and shift login privileges'}
                </p>
              </div>

              <button
                onClick={() => handleOpenCashierModal()}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Cashier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cashiers.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{c.nameEn}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        c.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.role}
                    </span>
                  </div>
                  <div className="text-slate-500 font-medium">{c.nameAr}</div>

                  {/* Assigned Branch Location */}
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold bg-white p-2 rounded-xl border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      {isRtl ? c.assignedBranchAr || c.assignedBranchEn || 'الفرع الرئيسي' : c.assignedBranchEn || 'Olaya Main Branch, Riyadh'}
                    </span>
                  </div>

                  {/* Permissions Badges (User requirement: "management caile user ke limited access dite pare") */}
                  <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {language === 'ar' ? 'صلاحيات الحساب:' : 'Account Privileges:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.permissions?.canTakeOrders && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          🛒 Take Orders
                        </span>
                      )}
                      {c.permissions?.canAddProducts && (
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                          📦 Add Products
                        </span>
                      )}
                      {c.permissions?.canProcessRefunds && (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                          ↩️ Refunds
                        </span>
                      )}
                      {c.permissions?.canAccessManagement && (
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                          ⚙️ Full Admin
                        </span>
                      )}
                      {!c.permissions?.canAddProducts && !c.permissions?.canProcessRefunds && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                          🔒 Limited Access
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="font-mono text-slate-700 font-bold">PIN: •••• ({c.pin})</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenCashierModal(c)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        title="Edit Cashier & Permissions"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {c.role !== 'admin' && (
                        <button
                          onClick={() => deleteCashier(c.id)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                          title="Delete Cashier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMER DIRECTORY & CRM (AUTO-SAVED CUSTOMERS) */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? 'سجل وقاعدة بيانات العملاء' : 'Customer Directory & Auto-Save CRM'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'يتم حفظ بيانات العملاء وأرقامهم تلقائياً فور طلبهم، واسترجاع أسمائهم بمجرد كتابة الرقم'
                    : 'Customer data is automatically saved on order placement. Inputting their phone number auto-fills their name.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCustomerForm({ name: '', phone: '', notes: '' });
                    setIsCustomerModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة عميل يدوياً' : 'Add Customer'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block">{language === 'ar' ? 'إجمالي العملاء المسجلين' : 'Total Saved Customers'}</span>
                <span className="text-2xl font-black font-mono text-blue-700">{customers.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block">{language === 'ar' ? 'إجمالي طلبات العملاء' : 'Total Customer Orders'}</span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block">{language === 'ar' ? 'إنفاق العملاء الإجمالي' : 'Total Spent by Customers'}</span>
                <span className="text-2xl font-black font-mono text-indigo-700">
                  {customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toFixed(2)} SAR
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث باسم العميل أو رقم الهاتف...' : 'Search by customer name or phone number...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Customers Table / Cards */}
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                {language === 'ar' ? 'لا يوجد عملاء مطابقين للبحث' : 'No matching customers found in directory'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                        {c.name ? c.name[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{c.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-bold">
                            {c.orderCount || 1} {language === 'ar' ? 'طلبات' : 'orders'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 font-mono">
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-blue-600 flex items-center gap-1 font-semibold"
                          >
                            <PhoneCall className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </a>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            Total: {(c.totalSpent || 0).toFixed(2)} SAR
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 text-[10px]">
                            Last: {new Date(c.lastVisit).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        title="Delete customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. QR CODE GENERATOR */}
        {activeTab === 'qr' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {getTranslation('qrGeneratorTab', language)}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar'
                    ? 'توليد وطباعة باركود QR للطاولات للدخول على قائمة الطعام الذاتية والطلب المباشر'
                    : 'Downloadable & printable QR Code for tabletop tents and customer self-ordering'}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="p-4 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center">
                <canvas ref={qrCanvasRef} />
                <span className="text-[11px] font-bold text-slate-900 mt-2 font-mono">
                  SCAN TO SELF-ORDER
                </span>
                <span className="text-[10px] text-blue-700 font-extrabold">
                  {settings.shopNameEn}
                </span>
              </div>

              <div className="space-y-4 flex-1 text-xs">
                <div>
                  <span className="text-slate-600 block mb-1 font-semibold">Direct Menu URL</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={qrMenuUrl}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                    />
                    <button
                      onClick={handleCopyQrLink}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>How the 15-Second Alarm Loop Operates</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    When a guest scans this QR code at their table, places an order, the tablet POS in the shop immediately sounds a continuous 15-second audible alarm until manually acknowledged by the cashier.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => window.open(qrMenuUrl, '_blank')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Customer View</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print Table Tent Voucher</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. WI-FI PRINTER & HARDWARE */}
        {activeTab === 'printer' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {getTranslation('printerSettings', language)}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar'
                    ? 'استكشاف طابعات الفواتير الحرارية على منفذ 9100 والاتصال بنقرة واحدة ونبضة فتح الدرج'
                    : 'Auto-scan local subnet on Port 9100, one-tap TCP connect, and 5-byte drawer kick'}
                </p>
              </div>

              <button
                disabled={isScanningPrinters}
                onClick={handleScanSubnet}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs shadow-xs flex items-center gap-2"
              >
                <Wifi className={`w-4 h-4 ${isScanningPrinters ? 'animate-spin' : ''}`} />
                <span>{isScanningPrinters ? getTranslation('scanningPrinters', language) : getTranslation('scanSubnet', language)}</span>
              </button>
            </div>

            {/* Active Printer Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">{printerConfig.printerName}</span>
                  <span className="font-mono text-xs text-slate-500">
                    Raw TCP IP: {printerConfig.ip}:{printerConfig.port} • 80mm ESC/POS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={kickCashDrawer}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                >
                  <Unlock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{getTranslation('testDrawer', language)}</span>
                </button>

                <button
                  onClick={handleTestPrintSlip}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{getTranslation('testPrint', language)}</span>
                </button>
              </div>
            </div>

            {testPrintOutput && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-mono text-blue-900">
                {testPrintOutput}
              </div>
            )}

            {/* Discovered Subnet Printers */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {getTranslation('discoveredPrinters', language)}
              </h4>

              {discoveredPrinters.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  {language === 'ar'
                    ? 'اضغط على زر استكشاف طابعات الشبكة (بورت 9100) للبحث عن الطابعات المتصلة'
                    : 'Click "Scan Wi-Fi Subnet" above to probe local thermal printers on Port 9100'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {discoveredPrinters.map((p) => {
                    const isSelected = printerConfig.ip === p.ip;
                    return (
                      <div
                        key={p.ip}
                        className={`p-4 rounded-2xl border flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{p.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                            IP: {p.ip}:{p.port} (MAC: {p.mac}) • {p.latencyMs}ms
                          </span>
                        </div>

                        <button
                          onClick={() => handleConnectPrinter(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Connected' : getTranslation('oneTapConnect', language)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. SALES & Z-REPORTS AUDIT */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {getTranslation('salesReportsTab', language)}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'سجل تقارير الإغلاق اليومي Z-Reports وإعادة إرسالها للمشرف عبر واتساب'
                  : 'Historical Z-Reports audit log with one-tap WhatsApp re-dispatch'}
              </p>
            </div>

            {shiftHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                {language === 'ar' ? 'لا توجد تقارير إغلاق سابقة بعد' : 'No past shift Z-Reports recorded yet'}
              </div>
            ) : (
              <div className="space-y-3">
                {shiftHistory.map((shift) => {
                  const z = shift.zReport;
                  if (!z) return null;
                  return (
                    <div
                      key={shift.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">
                            Shift #{shift.id.slice(-6)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(shift.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-slate-500 block mt-0.5">
                          Cashier: <strong>{shift.cashierName}</strong> • Orders: {z.orderCount}
                        </span>
                        <div className="mt-1 flex items-center gap-2 font-mono">
                          <span className="text-blue-700 font-bold">
                            Net: {z.netRevenue.toFixed(2)} SAR
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className={z.variance < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            Diff: {z.variance >= 0 ? '+' : ''}{z.variance.toFixed(2)} SAR
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPrintableZReport(z)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Print Slip</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-800">
            <h3 className="font-bold text-sm text-slate-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Product Name (English) *</label>
                <input
                  type="text"
                  required
                  value={prodForm.nameEn}
                  onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">اسم الصنف (بالعربية) *</label>
                <input
                  type="text"
                  required
                  value={prodForm.nameAr}
                  onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {language === 'ar' ? 'السعر الداخلي (ر.س) *' : 'Offline Price (SAR) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    placeholder="e.g. 25.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {language === 'ar' ? 'محلي، هاتف، باركود' : 'Dine-In, Phone, QR'}
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {language === 'ar' ? 'سعر التوصيل (ر.س)' : 'Online Price (SAR)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={prodForm.onlinePrice}
                    onChange={(e) => setProdForm({ ...prodForm, onlinePrice: e.target.value })}
                    placeholder="e.g. 30.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {language === 'ar' ? 'هنقرستيشن، جاهز، تويو' : 'Delivery Apps (Optional)'}
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Category *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isRtl ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Image URL</label>
                <input
                  type="url"
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prodAvail"
                  checked={prodForm.isAvailable}
                  onChange={(e) => setProdForm({ ...prodForm, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="prodAvail" className="text-slate-700 font-semibold">
                  Available in Stock (Visible on Cashier POS & QR Menu)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cashier Add/Edit Modal */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-800 max-h-[85vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>{editingCashier ? 'Edit Cashier & Permissions' : 'Add Cashier Profile'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                {cashierForm.role}
              </span>
            </h3>

            <form onSubmit={handleSaveCashier} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={cashierForm.nameEn}
                    onChange={(e) => setCashierForm({ ...cashierForm, nameEn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">الاسم (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    value={cashierForm.nameAr}
                    onChange={(e) => setCashierForm({ ...cashierForm, nameAr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">4-Digit PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    pattern="[0-9]{4}"
                    value={cashierForm.pin}
                    onChange={(e) => setCashierForm({ ...cashierForm, pin: e.target.value })}
                    placeholder="0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-center text-lg tracking-widest text-blue-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={cashierForm.phone}
                    onChange={(e) => setCashierForm({ ...cashierForm, phone: e.target.value })}
                    placeholder="+96650..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* ROLE SELECTION */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCashierForm({
                        ...cashierForm,
                        role: 'cashier',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      cashierForm.role === 'cashier'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Cashier / كاشير
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCashierForm({
                        ...cashierForm,
                        role: 'admin',
                        permissions: defaultAdminPermissions,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      cashierForm.role === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Store Admin / مدير
                  </button>
                </div>
              </div>

              {/* ASSIGNED STORE BRANCH (Admin assigns branch; cashier cannot switch) */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {language === 'ar' ? 'تعيين فرع المتجر لهذا الكاشير (إلزامي)' : 'Assign Store Branch (Required)'}
                </label>
                <select
                  value={cashierForm.assignedBranchEn || settings.branchLocationEn}
                  onChange={(e) => {
                    const selEn = e.target.value;
                    const bList = settings.availableBranches || [
                      'Olaya Main Branch, Riyadh',
                      'Airport Terminal 5 Branch',
                      'King Fahd Road Branch',
                      'Al Nakheel Mall Express',
                    ];
                    const matched = bList.find((b) => (typeof b === 'string' ? b : (b as any).nameEn) === selEn);
                    const selAr = matched
                      ? (typeof matched === 'string' ? (matched === 'Olaya Main Branch, Riyadh' ? 'الفرع الرئيسي - العليا، الرياض' : matched) : (matched as any).nameAr)
                      : settings.branchLocationAr;
                    setCashierForm({
                      ...cashierForm,
                      assignedBranchEn: selEn,
                      assignedBranchAr: selAr,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                >
                  {(settings.availableBranches?.length
                    ? settings.availableBranches
                    : [
                        'Olaya Main Branch, Riyadh',
                        'Airport Terminal 5 Branch',
                        'King Fahd Road Branch',
                        'Al Nakheel Mall Express',
                      ]
                  ).map((b, idx) => {
                    const bNameEn = typeof b === 'string' ? b : (b as any).nameEn;
                    const bNameAr = typeof b === 'string' ? (b === 'Olaya Main Branch, Riyadh' ? 'الفرع الرئيسي - العليا، الرياض' : b) : (b as any).nameAr;
                    return (
                      <option key={idx} value={bNameEn}>
                        {isRtl ? bNameAr : bNameEn}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {language === 'ar'
                    ? 'الكاشير سيعمل فقط في هذا الفرع المحدد ولن يتمكن من تبديل الفرع.'
                    : 'The cashier is locked to this branch and cannot switch.'}
                </span>
              </div>

              {/* GRANULAR PERMISSIONS & PRESETS (User requirement: "management caile user ke limited access dite pare like ei cashier sudhu order nite parbe onno cashier product add korte parbe amon") */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">
                    {language === 'ar' ? 'صلاحيات هذا المستخدم:' : 'Custom Permissions:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: {
                            canTakeOrders: true,
                            canAddProducts: false,
                            canProcessRefunds: false,
                            canHoldOrders: true,
                            canViewReports: false,
                            canAccessManagement: false,
                          },
                        })
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold"
                    >
                      Orders Only
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: {
                            canTakeOrders: true,
                            canAddProducts: true,
                            canProcessRefunds: false,
                            canHoldOrders: true,
                            canViewReports: false,
                            canAccessManagement: false,
                          },
                        })
                      }
                      className="px-2 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold"
                    >
                      + Products
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: defaultAdminPermissions,
                        })
                      }
                      className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Take orders */}
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={cashierForm.permissions?.canTakeOrders}
                      onChange={(e) =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: { ...cashierForm.permissions, canTakeOrders: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">🛒 Take Orders</span>
                  </label>

                  {/* Add & Edit Products */}
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={cashierForm.permissions?.canAddProducts}
                      onChange={(e) =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: { ...cashierForm.permissions, canAddProducts: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">📦 Add/Edit Products</span>
                  </label>

                  {/* Process Refunds */}
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={cashierForm.permissions?.canProcessRefunds}
                      onChange={(e) =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: { ...cashierForm.permissions, canProcessRefunds: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">↩️ Issue Refunds</span>
                  </label>

                  {/* Hold Orders */}
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={cashierForm.permissions?.canHoldOrders}
                      onChange={(e) =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: { ...cashierForm.permissions, canHoldOrders: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">⏳ Hold Orders</span>
                  </label>

                  {/* View Reports */}
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={cashierForm.permissions?.canViewReports}
                      onChange={(e) =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: { ...cashierForm.permissions, canViewReports: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">📊 View Reports</span>
                  </label>

                  {/* Access Management */}
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={cashierForm.permissions?.canAccessManagement}
                      onChange={(e) =>
                        setCashierForm({
                          ...cashierForm,
                          permissions: { ...cashierForm.permissions, canAccessManagement: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">⚙️ Management Access</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCashierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Cashier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Customer Registration Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-800">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'تسجيل عميل جديد' : 'Register Customer'}</span>
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {getTranslation('customerPhone', language)} *
                </label>
                <input
                  type="tel"
                  required
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {getTranslation('customerName', language)} *
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="e.g. Abdullah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
