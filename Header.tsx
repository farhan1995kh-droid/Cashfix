import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Globe,
  Printer,
  Unlock,
  Clock,
  FileText,
  ShieldCheck,
  UserCheck,
  LogOut,
  QrCode,
  RotateCcw,
  ShoppingBag,
  Bell,
  Sparkles,
  ChevronRight,
  Store,
  Sliders,
  DollarSign,
  Coffee,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Receipt,
  Lock,
  Maximize,
  Minimize,
  ShoppingCart,
  TrendingUp,
  WifiOff,
  Cloud,
  CloudOff,
  Database,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';

interface HeaderProps {
  currentTab: 'pos' | 'held' | 'sales' | 'refunds' | 'admin' | 'customer';
  setCurrentTab: (tab: 'pos' | 'held' | 'sales' | 'refunds' | 'admin' | 'customer') => void;
  onOpenPinModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenPinModal }) => {
  const {
    language,
    toggleLanguage,
    currentUser,
    settings,
    currentShift,
    openStartShiftModal,
    openCloseShiftModal,
    heldOrders,
    printerConfig,
    kickCashDrawer,
    refreshPos,
    isRefreshing,
    isManagementUnlocked,
    openManagementLockModal,
    setBranchLocation,
    openLiveSalesModal,
    cart,
    syncStatus,
    triggerManualSync,
  } = usePos();

  const totalCartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);

  const isRtl = language === 'ar';
  const shopName = isRtl ? settings.shopNameAr : settings.shopNameEn;
  const branchLocation = isRtl
    ? settings.branchLocationAr || 'الفرع الرئيسي - العليا، الرياض'
    : settings.branchLocationEn || 'Olaya Main Branch, Riyadh';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRefreshClick = () => {
    refreshPos();
    setShowRefreshToast(true);
    setTimeout(() => setShowRefreshToast(false), 2000);
  };

  const handleNav = (tab: 'pos' | 'held' | 'sales' | 'refunds' | 'admin' | 'customer') => {
    if (tab === 'admin') {
      if (!isManagementUnlocked) {
        setIsSidebarOpen(false);
        openManagementLockModal();
        return;
      }
      setCurrentTab('admin');
    } else {
      setCurrentTab(tab);
    }
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* MINIMAL TOP HEADER (WHITE MAIN THEME WITH BLUE ACCENTS) */}
      <header className="bg-white border-b border-slate-200 text-slate-800 select-none sticky top-0 z-40 shadow-xs">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: 3-Bar (Hamburger) Button + Branding (Shop Name + Branch Location ONLY) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* 3-BAR HAMBURGER MENU BUTTON */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all active:scale-95 flex items-center justify-center shadow-xs shrink-0"
              title="Menu / القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo & Shop Name + Branch Location ONLY underneath */}
            <div
              className="flex items-center gap-2 cursor-pointer group min-w-0"
              onClick={() => setCurrentTab('pos')}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={shopName}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/30 shadow-xs group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-xs text-xs shrink-0">
                  CF
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 leading-tight truncate">
                    {shopName}
                  </h1>
                  <span className="hidden sm:inline-block text-[9px] font-black px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 border border-blue-200 uppercase">
                    POS
                  </span>
                </div>
                {/* Branch Location ONLY directly under shop name */}
                <div className="relative">
                  {currentUser?.role === 'admin' || isManagementUnlocked ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBranchDropdownOpen(!isBranchDropdownOpen);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 px-1 py-0.5 rounded-md mt-0.5 transition-colors cursor-pointer group text-left rtl:text-right"
                      title={language === 'ar' ? 'تبديل موقع الفرع (صلاحية المدير)' : 'Switch branch location (Admin only)'}
                    >
                      <MapPin className="w-3 h-3 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate max-w-[130px] sm:max-w-xs underline decoration-blue-300 decoration-dotted underline-offset-2">
                        {branchLocation}
                      </span>
                    </button>
                  ) : (
                    /* Cashier cannot switch branch */
                    <div
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 px-1 py-0.5 rounded-md mt-0.5 select-none"
                      title={language === 'ar' ? 'الفرع محدد بواسطة الإدارة ولا يمكن تغييره' : 'Assigned branch set by Admin (Cannot be switched)'}
                    >
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[130px] sm:max-w-xs font-bold text-slate-800">
                        {branchLocation}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-extrabold flex items-center gap-0.5">
                        <Lock className="w-2 h-2 text-slate-500" />
                        <span>{language === 'ar' ? 'فرع محدد' : 'Assigned'}</span>
                      </span>
                    </div>
                  )}

                  {/* Branch Switcher Dropdown (Admin only) */}
                  {(currentUser?.role === 'admin' || isManagementUnlocked) && isBranchDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsBranchDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 text-slate-800">
                        <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            {language === 'ar' ? 'اختر موقع الفرع' : 'Select Branch Location'}
                          </span>
                          <span className="text-[10px] text-blue-600 font-bold">
                            {(settings.availableBranches?.length || 3)} {language === 'ar' ? 'فروع' : 'branches'}
                          </span>
                        </div>
                        <div className="py-1 space-y-0.5">
                          {(settings.availableBranches?.length
                            ? settings.availableBranches
                            : [
                                'Olaya Main Branch, Riyadh',
                                'Airport Terminal 5 Branch',
                                'King Fahd Road Branch',
                                'Al Nakheel Mall Express',
                              ]
                          )
                            .map((item, idx) => {
                              if (typeof item === 'string') {
                                return {
                                  id: `br_${idx}`,
                                  nameEn: item,
                                  nameAr:
                                    item === 'Olaya Main Branch, Riyadh'
                                      ? 'الفرع الرئيسي - العليا، الرياض'
                                      : item,
                                };
                              }
                              return item as { id: string; nameEn: string; nameAr: string };
                            })
                            .map((br) => {
                              const isCurrent =
                                (isRtl ? settings.branchLocationAr : settings.branchLocationEn) ===
                                (isRtl ? br.nameAr : br.nameEn);
                              return (
                                <button
                                  key={br.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBranchLocation(br.nameEn, br.nameAr);
                                    setIsBranchDropdownOpen(false);
                                  }}
                                  className={`w-full text-left rtl:text-right px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                                    isCurrent
                                      ? 'bg-blue-50 text-blue-700 font-bold'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <MapPin
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isCurrent ? 'text-blue-600' : 'text-slate-400'
                                      }`}
                                    />
                                    <span className="truncate">{isRtl ? br.nameAr : br.nameEn}</span>
                                  </div>
                                  {isCurrent && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Exact sequence: Hold Order -> Refresh -> Language -> Last: Cashier User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* MOBILE QUICK CART BUTTON (Visible on < md screens when in POS tab) */}
            {currentTab === 'pos' && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-mobile-cart'));
                }}
                className="md:hidden relative flex items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 shadow-xs active:scale-95 transition-all cursor-pointer"
                title={language === 'ar' ? 'عرض السلة' : 'Open Cart'}
              >
                <ShoppingCart className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}

            {/* OFFLINE & INDEXEDDB SYNC INDICATORS */}
            {!isOnline ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500 text-white text-[11px] font-black shadow-xs animate-pulse shrink-0"
                title={
                  language === 'ar'
                    ? `وضع عدم الاتصال: المبيعات والمخزون تُحفظ محلياً في قاعدة بيانات IndexedDB (${syncStatus.pendingCount} طلبات بانتظار المزامنة للسحاب فور عودة النت)`
                    : `Offline Mode: Orders & inventory saved in IndexedDB (${syncStatus.pendingCount} pending cloud sync)`
                }
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'ar'
                    ? syncStatus.pendingCount > 0 ? `أوفلاين (${syncStatus.pendingCount} محفوظ)` : 'أوفلاين (IndexedDB)'
                    : syncStatus.pendingCount > 0 ? `Offline (${syncStatus.pendingCount} local)` : 'Offline (IndexedDB)'}
                </span>
              </div>
            ) : syncStatus.isSyncing ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-black shadow-xs shrink-0"
                title="Syncing IndexedDB orders to cloud..."
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden md:inline">
                  {language === 'ar' ? 'مزامنة السحاب...' : 'Syncing...'}
                </span>
              </div>
            ) : syncStatus.pendingCount > 0 ? (
              <button
                onClick={() => triggerManualSync()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                title={language === 'ar' ? 'مزامنة الطلبات غير المتزامنة مع السحاب الآن' : 'Push IndexedDB changes to cloud now'}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {language === 'ar' ? `مزامنة (${syncStatus.pendingCount})` : `Sync (${syncStatus.pendingCount})`}
                </span>
              </button>
            ) : null}

            {/* 1. HOLD ORDER OPTION */}
            <button
              onClick={() => setCurrentTab('held')}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                heldOrders.length > 0
                  ? 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
              }`}
              title="Hold Orders / الطلبات المعلقة"
            >
              <Clock className={`w-3.5 h-3.5 ${heldOrders.length > 0 ? 'text-amber-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'الطلبات المعلقة' : 'Hold Orders'}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  heldOrders.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {heldOrders.length}
              </span>
            </button>

            {/* 2. REFRESH BUTTON */}
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-slate-700 hover:text-blue-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title={language === 'ar' ? 'تحديث ومزامنة النظام' : 'Refresh & Synchronize POS'}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-600 ${
                  isRefreshing ? 'animate-spin text-blue-600' : ''
                }`}
              />
              <span className="hidden md:inline">
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </span>
            </button>

            {/* 3. LANGUAGE SWITCHER */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Switch Language / تبديل اللغة"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{getTranslation('switchToLang', language)}</span>
            </button>

            {/* FULLSCREEN MODE FOR TABLET & LAPTOP */}
            <button
              onClick={toggleFullScreen}
              className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-slate-700 hover:text-blue-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title={isFullscreen ? (language === 'ar' ? 'تصغير الشاشة' : 'Exit Fullscreen') : (language === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline text-[11px]">{isFullscreen ? 'Exit' : 'Full'}</span>
            </button>

            {/* 4. LAST: CASHIER USER */}
            <button
              onClick={onOpenPinModal}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-800 transition-all shadow-xs active:scale-95"
              title="Cashier User / Switch PIN"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br ${
                  currentUser?.avatarColor || 'from-blue-600 to-indigo-800'
                } flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0`}
              >
                {currentUser?.nameEn ? currentUser.nameEn[0] : 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left rtl:text-right leading-tight">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[90px]">
                  {isRtl ? currentUser?.nameAr || currentUser?.nameEn : currentUser?.nameEn}
                </span>
                <span className="text-[10px] text-blue-600 font-extrabold capitalize">
                  {currentUser?.role === 'admin'
                    ? isRtl ? 'مدير' : 'Manager'
                    : isRtl ? 'كاشير' : 'Cashier'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Transient Refresh Toast */}
        {showRefreshToast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {language === 'ar'
                ? 'تم تحديث النظام ومزامنة القوائم بنجاح'
                : 'POS State & Catalog Refreshed'}
            </span>
          </div>
        )}
      </header>

      {/* 3-BAR SIDE NAVIGATION DRAWER (WHITE & BLUE THEME) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div
            className={`relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 border-r rtl:border-r-0 rtl:border-l border-slate-200 animate-in ${
              isRtl ? 'slide-in-from-right' : 'slide-in-from-left'
            } duration-200`}
          >
            {/* Drawer Top Branding */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={shopName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/30 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-white text-base">
                    CF
                  </div>
                )}
                <div>
                  <h2 className="font-extrabold text-base leading-tight">{shopName}</h2>
                  <span className="text-xs text-blue-100 opacity-90 block">Cashfix POS</span>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Cashier Info Card */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                    currentUser?.avatarColor || 'from-blue-600 to-indigo-800'
                  } flex items-center justify-center font-bold text-xs text-white shadow-xs`}
                >
                  {currentUser?.nameEn ? currentUser.nameEn[0] : 'U'}
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 leading-tight">
                    {isRtl ? currentUser?.nameAr : currentUser?.nameEn}
                  </span>
                  <span className="text-[10px] text-blue-600 font-extrabold uppercase">
                    {currentUser?.role === 'admin' ? 'Store Admin' : 'Cashier'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  onOpenPinModal();
                }}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 text-xs font-semibold shadow-xs flex items-center gap-1"
                title={getTranslation('logout', language)}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[10px]">PIN</span>
              </button>
            </div>

            {/* Shift Operations Quick Bar */}
            <div className="p-3 bg-blue-50/50 border-b border-blue-100">
              {currentShift ? (
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">
                      Shift Started: {new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      Float: {formatCurrency(currentShift.openingFloat, language, settings.currencyEn, settings.currencyAr)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      openCloseShiftModal();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    {getTranslation('closeDay', language)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    openStartShiftModal();
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{getTranslation('startDay', language)}</span>
                </button>
              )}
            </div>

            {/* Main Navigation Menu List */}
            <nav className="flex-1 p-3 overflow-y-auto space-y-1 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                {language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu Options'}
              </span>

              {/* 📊 Live Shift Sales Summary Card (Direct 1-tap access for cashier & admin) */}
              <div className="mb-2 p-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl shadow-sm">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    openLiveSalesModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left rtl:text-right">
                      <span className="font-extrabold text-xs leading-tight">
                        {language === 'ar' ? 'ملخص مبيعات الوردية' : "Live Shift Sales Summary"}
                      </span>
                      <span className="text-[10px] text-blue-100 opacity-90">
                        {language === 'ar' ? 'إجمالي، كاش، مدى، وتطبيقات التوصيل' : 'Gross, Cash, Mada & Apps'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500 text-white animate-pulse">
                    LIVE
                  </span>
                </button>
              </div>

              {/* 1. POS Screen */}
              <button
                onClick={() => handleNav('pos')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold transition-all ${
                  currentTab === 'pos'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-blue-500 currentTab === pos && text-white" />
                  <span>{getTranslation('posScreen', language)}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 2. Held Orders */}
              <button
                onClick={() => handleNav('held')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold transition-all ${
                  currentTab === 'held'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500 currentTab === held && text-white" />
                  <span>{getTranslation('heldOrders', language)}</span>
                </div>
                {heldOrders.length > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-500 text-white animate-pulse">
                    {heldOrders.length}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 opacity-50" />
                )}
              </button>

              {/* 3. Sales List (Separate from Refunds) */}
              <button
                onClick={() => handleNav('sales')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold transition-all ${
                  currentTab === 'sales'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className={`w-5 h-5 ${currentTab === 'sales' ? 'text-white' : 'text-blue-600'}`} />
                  <span>{getTranslation('salesList', language)}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 4. Refunds List (Separate from Sales) */}
              <button
                onClick={() => handleNav('refunds')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold transition-all ${
                  currentTab === 'refunds'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className={`w-5 h-5 ${currentTab === 'refunds' ? 'text-white' : 'text-rose-600'}`} />
                  <span>{getTranslation('refundsList', language)}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 6. Management & Store Settings (Locked with 2FA WhatsApp verification) */}
              <button
                onClick={() => handleNav('admin')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold transition-all ${
                  currentTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-5 h-5 ${currentTab === 'admin' ? 'text-white' : 'text-indigo-600'}`} />
                  <div className="flex items-center gap-1.5">
                    <span>{getTranslation('adminPanel', language)}</span>
                    {!isManagementUnlocked && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>2FA</span>
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 6. Customer QR Menu Simulator */}
              <button
                onClick={() => handleNav('customer')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold transition-all ${
                  currentTab === 'customer'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="w-5 h-5 text-sky-500" />
                  <span>{getTranslation('customerMenu', language)}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* 6. Customer CRM Directory */}
              <button
                onClick={() => handleNav('admin')}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'ar' ? 'سجل العملاء والبيانات المحفوظة' : 'Customer Directory (CRM)'}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* Hardware Actions */}
              <div className="pt-3 border-t border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                  {language === 'ar' ? 'العتاد والأجهزة' : 'Hardware & Drawer'}
                </span>

                <button
                  onClick={() => {
                    kickCashDrawer();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Unlock className="w-4 h-4 text-blue-600" />
                    <span>{getTranslation('openDrawer', language)} (Pulse)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">[27, 112, 0]</span>
                </button>

                <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-700">{printerConfig.printerName.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">
                    {printerConfig.ip}:9100
                  </span>
                </div>
              </div>
            </nav>

            {/* Bottom Footer Info */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 font-bold text-blue-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                <span>{getTranslation('switchToLang', language)}</span>
              </button>
              <span className="text-[10px] font-mono font-semibold">CashFix v2.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
