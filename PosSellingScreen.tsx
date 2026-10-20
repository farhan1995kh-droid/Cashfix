import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Percent,
  Clock,
  CreditCard,
  Tag,
  Coffee,
  Flame,
  CupSoda,
  Cookie,
  Cake,
  UtensilsCrossed,
  Filter,
  Check,
  Edit3,
  X,
  AlertCircle,
  Folder,
  FolderOpen,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldAlert,
  Lock,
  ShoppingCart,
  ShoppingBag,
  ChevronUp,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatCurrency, getTranslation } from '../utils/translations';
import { Category, Product } from '../types/pos';

interface PosSellingScreenProps {
  onOpenPaymentModal: () => void;
  onOpenHoldOrderModal: () => void;
}

export const PosSellingScreen: React.FC<PosSellingScreenProps> = ({
  onOpenPaymentModal,
  onOpenHoldOrderModal,
}) => {
  const {
    language,
    categories,
    products,
    orderSources,
    selectedSourceId,
    setSelectedSourceId,
    cart,
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
    settings,
    currentShift,
    openStartShiftModal,
    currentUser,
    addProduct,
  } = usePos();

  const isRtl = language === 'ar';

  // Category Folder State: 'folders_overview' | specific categoryId
  const [activeFolderId, setActiveFolderId] = useState<string>('folders_overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [tempDiscountType, setTempDiscountType] = useState<'percentage' | 'fixed'>(discountType);
  const [tempDiscountVal, setTempDiscountVal] = useState<string>(discountValue ? discountValue.toString() : '');

  // Cashier permission & quick add modal states
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [isQuickAddProductModalOpen, setIsQuickAddProductModalOpen] = useState(false);
  const [newProductNameEn, setNewProductNameEn] = useState('');
  const [newProductNameAr, setNewProductNameAr] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');

  // Responsive Mobile & Tablet state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isTabletCartCollapsed, setIsTabletCartCollapsed] = useState(false);

  // Note editing state for cart items
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteText, setItemNoteText] = useState<string>('');

  // Total cart item count
  const totalCartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Listen for custom event from Header mobile cart button
  React.useEffect(() => {
    const handleOpenCart = () => setIsMobileCartOpen(true);
    window.addEventListener('open-mobile-cart', handleOpenCart);
    return () => window.removeEventListener('open-mobile-cart', handleOpenCart);
  }, []);

  // Icon mapping helper
  const getCategoryIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'CupSoda':
        return <CupSoda className={className} />;
      case 'Cookie':
        return <Cookie className={className} />;
      case 'Cake':
        return <Cake className={className} />;
      default:
        return <UtensilsCrossed className={className} />;
    }
  };

  // Get count of products in each category
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Active Category Details
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeFolderId);
  }, [categories, activeFolderId]);

  // Filtered products inside selected category folder (or all if activeFolderId === 'all')
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeFolderId === 'all' || activeFolderId === 'folders_overview'
          ? true
          : p.categoryId === activeFolderId;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeFolderId, searchQuery]);

  const handleOpenNoteModal = (itemId: string, existingNote = '') => {
    setEditingNoteItemId(itemId);
    setItemNoteText(existingNote || '');
  };

  const handleSaveItemNote = () => {
    if (editingNoteItemId) {
      updateItemNotes(editingNoteItemId, itemNoteText);
      setEditingNoteItemId(null);
      setItemNoteText('');
    }
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscountVal) || 0;
    setDiscount(tempDiscountType, val);
    setIsDiscountModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-62px)] overflow-hidden bg-slate-50 text-slate-800">
      {/* SHIFT CLOSED BANNER */}
      {!currentShift && (
        <div className="bg-amber-50 border-b border-amber-200 p-2.5 text-center text-xs text-amber-800 font-bold flex items-center justify-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>
            {language === 'ar'
              ? 'الوردية مغلقة حالياً. يرجى فتح الوردية لبدء المبيعات.'
              : 'Shift is closed. Open shift to register transactions.'}
          </span>
          <button
            onClick={openStartShiftModal}
            className="underline font-black text-blue-700 hover:text-blue-900 ml-2"
          >
            {getTranslation('startDay', language)}
          </button>
        </div>
      )}

      {/* LEFT / MAIN COLUMN: Product Catalog organized by Category Folders (White & Blue Theme) */}
      <section className="flex-1 flex flex-col border-r rtl:border-r-0 rtl:border-l border-slate-200 overflow-hidden bg-slate-50 relative pb-16 md:pb-0">
        {/* Top Control Bar: Search & Order Sources */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslation('searchProducts', language)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Order Source Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {orderSources
              .filter((s) => s.isActive)
              .map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSourceId(source.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedSourceId === source.id
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {isRtl ? source.nameAr : source.nameEn}
                </button>
              ))}
          </div>
        </div>

        {/* CATEGORY FOLDERS BAR: Clean folders representation */}
        <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shadow-xs">
          {/* Folder Navigation Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 py-0.5">
            {/* Category Folders Overview Button */}
            <button
              onClick={() => setActiveFolderId('folders_overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                activeFolderId === 'folders_overview'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مجلدات الأصناف' : 'Category Folders'}</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 rounded-full ${
                activeFolderId === 'folders_overview' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {categories.length}
              </span>
            </button>

            {/* Individual Category Folders (Coffee, Pastry, Cold drinks, etc.) */}
            {categories.map((cat) => {
              const count = categoryProductCounts[cat.id] || 0;
              const isSelected = activeFolderId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFolderId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                  }`}
                >
                  {isSelected ? <FolderOpen className="w-3.5 h-3.5 text-white" /> : <Folder className="w-3.5 h-3.5 text-blue-500" />}
                  <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions: + Add Product (if cashier permitted) & Folder Explorer Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                const canAdd = currentUser?.role === 'admin' || currentUser?.permissions?.canAddProducts;
                if (!canAdd) {
                  setPermissionWarning(
                    language === 'ar'
                      ? `عذراً! هذا الكاشير (${currentUser?.nameAr || currentUser?.nameEn}) مسموح له فقط بأخذ الطلبات، ولا يملك صلاحية إضافة أو تعديل المنتجات في المنيو. تواصل مع الإدارة لمنح الصلاحية.`
                      : `Access Restricted: Cashier (${currentUser?.nameEn}) has limited access (Orders Only) and cannot add products. Please ask store management for catalog permissions.`
                  );
                  return;
                }
                setNewProductCategoryId(activeCategory?.id || categories[0]?.id || 'cat_coffee');
                setNewProductNameEn('');
                setNewProductNameAr('');
                setNewProductPrice('');
                setIsQuickAddProductModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              title={language === 'ar' ? 'إضافة منتج جديد للمجلد' : 'Add product to folder'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'إضافة صنف' : '+ Product'}</span>
            </button>

            {/* Folder Explorer Toggle */}
            <button
              onClick={() => setActiveFolderId(activeFolderId === 'folders_overview' ? 'all' : 'folders_overview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-colors ${
                activeFolderId === 'folders_overview'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Browse Category Folders"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{language === 'ar' ? 'استعراض المجلدات' : 'Folder Grid'}</span>
            </button>

            {/* Tablet Cart Toggle (Visible on tablet screens) */}
            <button
              onClick={() => setIsTabletCartCollapsed(!isTabletCartCollapsed)}
              className="hidden md:flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shrink-0 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors active:scale-95"
              title={isTabletCartCollapsed ? 'Show Cart Panel' : 'Hide Cart Panel'}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>
                {isTabletCartCollapsed
                  ? language === 'ar'
                    ? 'عرض السلة'
                    : 'Show Cart'
                  : language === 'ar'
                  ? 'إخفاء السلة'
                  : 'Full Menu'}
              </span>
              {totalCartItemCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-mono">
                  {totalCartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ACTIVE FOLDER BREADCRUMB HEADER (When inside a specific category folder) */}
        {activeCategory && activeFolderId !== 'all' && activeFolderId !== 'folders_overview' && (
          <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFolderId('folders_overview')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-black shadow-xs transition-all active:scale-95 group"
              >
                {isRtl ? <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />}
                <Folder className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'رجوع للمجلدات' : '← Category Folders'}</span>
              </button>
              <span className="text-slate-300 font-bold">/</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  {getCategoryIcon(activeCategory.icon, "w-4 h-4")}
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    {isRtl ? activeCategory.nameAr : activeCategory.nameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {filteredProducts.length} {language === 'ar' ? 'أصناف في هذا المجلد' : 'items inside folder'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveFolderId('folders_overview')}
              className="text-xs font-bold text-slate-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100/50 transition-colors"
            >
              ✕ {language === 'ar' ? 'إغلاق المجلد' : 'Close Folder'}
            </button>
          </div>
        )}

        {/* FOLDERS OVERVIEW GRID (Primary Front Screen: Shows Category Folders only) */}
        {activeFolderId === 'folders_overview' && !searchQuery ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? 'مجلدات وتصنيفات الأطعمة والمشروبات' : 'Menu Category Folders'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar'
                    ? 'اضغط على أي مجلد لفتح الأصناف التابعة له وإضافتها للطلب'
                    : 'Tap any category folder to browse and select products inside'}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                {categories.length} {language === 'ar' ? 'مجلدات' : 'Folders'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5">
              {categories.map((cat) => {
                const count = categoryProductCounts[cat.id] || 0;
                const sampleProducts = products.filter((p) => p.categoryId === cat.id).slice(0, 3);
                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveFolderId(cat.id)}
                    className="group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 p-4 shadow-xs hover:shadow-lg cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Folder Tab accent */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100" />

                    <div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs ring-2 ring-blue-100">
                          {getCategoryIcon(cat.icon, "w-6 h-6")}
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs font-mono font-black border border-slate-200 group-hover:border-blue-200">
                          {count} {language === 'ar' ? 'أصناف' : 'Items'}
                        </span>
                      </div>

                      <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {isRtl ? cat.nameAr : cat.nameEn}
                      </h4>
                      <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                        {isRtl ? cat.nameEn : cat.nameAr}
                      </span>
                    </div>

                    {/* Mini item names preview */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      {sampleProducts.map((sp) => (
                        <div key={sp.id} className="truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span className="truncate">{isRtl ? sp.nameAr : sp.nameEn}</span>
                        </div>
                      ))}
                      {count > 3 && (
                        <div className="text-[10px] text-blue-600 font-bold pt-0.5">
                          +{count - 3} {language === 'ar' ? 'أصناف إضافية داخل المجلد' : 'more items in folder'}
                        </div>
                      )}
                    </div>

                    {/* Open folder button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-black text-blue-600 group-hover:text-blue-800 flex items-center gap-1">
                        <span>{language === 'ar' ? 'عرض الأصناف' : 'Open Folder'}</span>
                        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                      <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* PRODUCTS GRID (Inside Selected Category Folder or Search Results) */
          <div className="flex-1 p-3 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Search className="w-10 h-10 mb-2 opacity-30 text-slate-500" />
                <p className="text-sm font-semibold text-slate-600">
                  {language === 'ar' ? 'لا توجد منتجات مطابقة في هذا المجلد' : 'No matching products in this folder'}
                </p>
                <button
                  onClick={() => {
                    setActiveFolderId('folders_overview');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100"
                >
                  {language === 'ar' ? 'الرجوع للمجلدات' : 'Back to Category Folders'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {filteredProducts.map((product) => {
                  const inCartItem = cart.find((i) => i.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (product.isAvailable) {
                          addToCart(product);
                        }
                      }}
                      className={`relative group flex flex-col bg-white rounded-2xl border ${
                        inCartItem
                          ? 'border-blue-600 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-300'
                      } overflow-hidden cursor-pointer transition-all active:scale-[0.98] select-none shadow-xs hover:shadow-md ${
                        !product.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {/* In-cart count badge */}
                      {inCartItem && (
                        <span className="absolute top-2 right-2 rtl:right-auto rtl:left-2 z-10 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                          {inCartItem.quantity}
                        </span>
                      )}

                      {/* Image / Thumbnail */}
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.nameEn}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!product.isAvailable && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[11px] font-black text-white uppercase tracking-wider">
                            {getTranslation('outOfStock', language)}
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">
                            {isRtl ? product.nameAr : product.nameEn}
                          </h3>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {isRtl ? product.nameEn : product.nameAr}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-black text-blue-600 block">
                              {formatCurrency(
                                selectedSourceId === 'src_online'
                                  ? (product.onlinePrice ?? product.price)
                                  : product.price,
                                language,
                                settings.currencyEn,
                                settings.currencyAr
                              )}
                            </span>
                            {selectedSourceId === 'src_online' && product.onlinePrice && product.onlinePrice !== product.price && (
                              <span className="text-[9px] text-amber-600 font-bold block">
                                {language === 'ar' ? 'سعر التطبيقات' : 'Online Price'}
                              </span>
                            )}
                          </div>
                          <button
                            disabled={!product.isAvailable}
                            className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 flex items-center justify-center transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* RIGHT COLUMN (Desktop & Tablet): Active Cart, Discounts & Fast Settle Controls */}
      <section
        className={`${
          isTabletCartCollapsed ? 'hidden' : 'hidden md:flex'
        } w-full md:w-[320px] lg:w-[380px] xl:w-[420px] bg-white flex-col border-t md:border-t-0 border-slate-200 shadow-xl shrink-0 transition-all duration-200`}
      >
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-sm uppercase tracking-wider text-slate-800">
              {getTranslation('currentOrder', language)}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold">
              {totalCartItemCount} {getTranslation('itemsCount', language)}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{getTranslation('clearCart', language)}</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                <Coffee className="w-8 h-8 opacity-40 text-blue-600" />
              </div>
              <p className="text-xs max-w-xs">{getTranslation('emptyCart', language)}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-xs text-slate-800 truncate">
                      {isRtl ? item.product.nameAr : item.product.nameEn}
                    </span>
                    <span className="font-mono text-xs font-black text-blue-700 shrink-0">
                      {formatCurrency(
                        (item.customPrice ?? item.product.price) * item.quantity,
                        language,
                        settings.currencyEn,
                        settings.currencyAr
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    @ {formatCurrency(item.customPrice ?? item.product.price, language, settings.currencyEn, settings.currencyAr)}
                  </div>

                  {item.itemNotes && (
                    <div className="mt-1 text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center justify-between">
                      <span className="truncate">*{item.itemNotes}</span>
                      <button
                        onClick={() => handleOpenNoteModal(item.id, item.itemNotes)}
                        className="text-[10px] text-blue-600 hover:text-blue-900 underline ml-2 shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  )}

                  {!item.itemNotes && (
                    <button
                      onClick={() => handleOpenNoteModal(item.id)}
                      className="mt-1 text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>{getTranslation('itemNotes', language)}</span>
                    </button>
                  )}
                </div>

                {/* Quantity Controls Stepper */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary & Discount Line */}
        <div className="p-3.5 bg-white border-t border-slate-200 space-y-2 text-xs">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-slate-500">
            <span>{getTranslation('subtotal', language)}</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(cartSubtotal, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </div>

          {/* Discount Button & Line */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 underline underline-offset-2 transition-colors"
            >
              <Tag className="w-3 h-3" />
              <span>
                {discountValue > 0
                  ? `${getTranslation('discount', language)} (${discountValue}${discountType === 'percentage' ? '%' : ' SAR'})`
                  : getTranslation('addDiscount', language)}
              </span>
            </button>
            <span className="font-mono font-semibold text-rose-600">
              {cartDiscountAmount > 0
                ? `-${formatCurrency(cartDiscountAmount, language, settings.currencyEn, settings.currencyAr)}`
                : '0.00'}
            </span>
          </div>

          {/* VAT Included (Tax-Inclusive Pricing) */}
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>
              {getTranslation('vat', language)} ({settings.vatPercentage}% {language === 'ar' ? 'مشمولة بالسعر' : 'Included in Price'})
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(cartTaxAmount, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-black text-sm text-slate-900">{getTranslation('total', language)}</span>
            <span className="font-mono text-xl font-black text-blue-600">
              {formatCurrency(cartTotal, language, settings.currencyEn, settings.currencyAr)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2">
          {/* Hold Order Button (Advance Orders Queue) */}
          <button
            disabled={cart.length === 0}
            onClick={() => {
              if (
                currentUser &&
                currentUser.role !== 'admin' &&
                currentUser.permissions &&
                !currentUser.permissions.canHoldOrders
              ) {
                setPermissionWarning(
                  language === 'ar'
                    ? `عذراً! الكاشير (${currentUser.nameAr || currentUser.nameEn}) ليس لديه صلاحية تعليق الطلبات.`
                    : `Access Denied: Cashier (${currentUser.nameEn}) does not have permission to hold orders.`
                );
                return;
              }
              onOpenHoldOrderModal();
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 border border-slate-200 transition-all active:scale-95 text-xs font-bold shadow-xs cursor-pointer"
          >
            <Clock className="w-4 h-4 mb-1 text-amber-500" />
            <span>{getTranslation('holdOrder', language)}</span>
          </button>

          {/* Quick Pay / Settle Button (Blue Main Theme) */}
          <button
            disabled={cart.length === 0}
            onClick={() => {
              if (
                currentUser &&
                currentUser.role !== 'admin' &&
                currentUser.permissions &&
                !currentUser.permissions.canTakeOrders
              ) {
                setPermissionWarning(
                  language === 'ar'
                    ? `عذراً! الكاشير (${currentUser.nameAr || currentUser.nameEn}) لديه صلاحية محدودة فقط وليس لديه إذن أخذ الطلبات والدفع. تواصل مع الإدارة لتفعيل الصلاحية.`
                    : `Access Denied: Cashier (${currentUser.nameEn}) has limited permissions and is NOT authorized to take orders or collect payments.`
                );
                return;
              }
              onOpenPaymentModal();
            }}
            className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>{getTranslation('quickPay', language)}</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FLOATING MOBILE BOTTOM CART BAR (Visible only on < md screens) */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 shadow-2xl flex items-center justify-between gap-2.5">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left rtl:text-right cursor-pointer"
        >
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                totalCartItemCount > 0
                  ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400/30'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
            </div>
            {totalCartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 rtl:-right-auto rtl:-left-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-sm animate-pulse">
                {totalCartItemCount}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-slate-900 truncate">
                {totalCartItemCount > 0
                  ? `${totalCartItemCount} ${getTranslation('itemsCount', language)}`
                  : getTranslation('emptyCart', language)}
              </span>
            </div>
            <div className="font-mono text-sm font-black text-blue-600 truncate">
              {formatCurrency(cartTotal, language, settings.currencyEn, settings.currencyAr)}
              <span className="text-[9px] font-sans font-bold text-slate-400 ml-1 rtl:ml-0 rtl:mr-1">
                ({language === 'ar' ? 'شامل الضريبة' : 'VAT Incl.'})
              </span>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            if (cart.length > 0) {
              setIsMobileCartOpen(true);
            }
          }}
          disabled={cart.length === 0}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>{language === 'ar' ? 'عرض السلة والدفع' : 'View Cart & Pay'}</span>
          {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ============================================================== */}
      {/* MOBILE CART BOTTOM SHEET DRAWER (Smooth slide-up on mobile)     */}
      {/* ============================================================== */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative z-10 w-full bg-white rounded-t-3xl max-h-[92dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-slate-200 overflow-hidden text-slate-800">
            {/* Grab Handle */}
            <div className="pt-2.5 pb-1 flex justify-center cursor-pointer" onClick={() => setIsMobileCartOpen(false)}>
              <div className="w-12 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Mobile Drawer Header */}
            <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  {getTranslation('currentOrder', language)}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold">
                  {totalCartItemCount} {getTranslation('itemsCount', language)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{getTranslation('clearCart', language)}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  aria-label="Close Cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Mobile Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 bg-slate-50/50">
              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <Coffee className="w-8 h-8 opacity-40 text-blue-600" />
                  </div>
                  <p className="text-xs max-w-xs">{getTranslation('emptyCart', language)}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {isRtl ? item.product.nameAr : item.product.nameEn}
                        </span>
                        <span className="font-mono text-xs font-black text-blue-700 shrink-0">
                          {formatCurrency(
                            (item.customPrice ?? item.product.price) * item.quantity,
                            language,
                            settings.currencyEn,
                            settings.currencyAr
                          )}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        @ {formatCurrency(item.customPrice ?? item.product.price, language, settings.currencyEn, settings.currencyAr)}
                      </div>

                      {item.itemNotes && (
                        <div className="mt-1 text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center justify-between">
                          <span className="truncate">*{item.itemNotes}</span>
                          <button
                            onClick={() => handleOpenNoteModal(item.id, item.itemNotes)}
                            className="text-[10px] text-blue-600 hover:text-blue-900 underline ml-2 shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      {!item.itemNotes && (
                        <button
                          onClick={() => handleOpenNoteModal(item.id)}
                          className="mt-1 text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>{getTranslation('itemNotes', language)}</span>
                        </button>
                      )}
                    </div>

                    {/* Touch-Friendly Quantity Stepper for Mobile (40px touch targets) */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors text-sm font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-blue-50 active:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors text-sm font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pricing Summary in Mobile Drawer */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>{getTranslation('subtotal', language)}</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(cartSubtotal, language, settings.currencyEn, settings.currencyAr)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 underline underline-offset-2 transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  <span>
                    {discountValue > 0
                      ? `${getTranslation('discount', language)} (${discountValue}${discountType === 'percentage' ? '%' : ' SAR'})`
                      : getTranslation('addDiscount', language)}
                  </span>
                </button>
                <span className="font-mono font-semibold text-rose-600">
                  {cartDiscountAmount > 0
                    ? `-${formatCurrency(cartDiscountAmount, language, settings.currencyEn, settings.currencyAr)}`
                    : '0.00'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>
                  {getTranslation('vat', language)} ({settings.vatPercentage}% {language === 'ar' ? 'مشمولة بالسعر' : 'Included in Price'})
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(cartTaxAmount, language, settings.currencyEn, settings.currencyAr)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-black text-sm text-slate-900">{getTranslation('total', language)}</span>
                <span className="font-mono text-xl font-black text-blue-600">
                  {formatCurrency(cartTotal, language, settings.currencyEn, settings.currencyAr)}
                </span>
              </div>
            </div>

            {/* Action Buttons in Mobile Drawer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2">
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  if (
                    currentUser &&
                    currentUser.role !== 'admin' &&
                    currentUser.permissions &&
                    !currentUser.permissions.canHoldOrders
                  ) {
                    setPermissionWarning(
                      language === 'ar'
                        ? `عذراً! الكاشير (${currentUser.nameAr || currentUser.nameEn}) ليس لديه صلاحية تعليق الطلبات.`
                        : `Access Denied: Cashier (${currentUser.nameEn}) does not have permission to hold orders.`
                    );
                    return;
                  }
                  setIsMobileCartOpen(false);
                  onOpenHoldOrderModal();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 border border-slate-200 transition-all active:scale-95 text-xs font-bold shadow-xs min-h-[48px] cursor-pointer"
              >
                <Clock className="w-4 h-4 mb-1 text-amber-500" />
                <span>{getTranslation('holdOrder', language)}</span>
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  if (
                    currentUser &&
                    currentUser.role !== 'admin' &&
                    currentUser.permissions &&
                    !currentUser.permissions.canTakeOrders
                  ) {
                    setPermissionWarning(
                      language === 'ar'
                        ? `عذراً! الكاشير (${currentUser.nameAr || currentUser.nameEn}) لديه صلاحية محدودة فقط وليس لديه إذن أخذ الطلبات والدفع. تواصل مع الإدارة لتفعيل الصلاحية.`
                        : `Access Denied: Cashier (${currentUser.nameEn}) has limited permissions and is NOT authorized to take orders or collect payments.`
                    );
                    return;
                  }
                  setIsMobileCartOpen(false);
                  onOpenPaymentModal();
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm shadow-md shadow-blue-500/25 transition-all active:scale-95 min-h-[48px] cursor-pointer"
              >
                <CreditCard className="w-5 h-5" />
                <span>{getTranslation('quickPay', language)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editing Modal */}
      {editingNoteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-800">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span>{getTranslation('itemNotes', language)}</span>
            </h3>
            <textarea
              rows={3}
              value={itemNoteText}
              onChange={(e) => setItemNoteText(e.target.value)}
              placeholder="e.g. Extra hot, skim milk, no sugar / بدون سكر، حار زيادة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingNoteItemId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItemNote}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Configuration Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" />
                <span>{getTranslation('addDiscount', language)}</span>
              </h3>
              <button onClick={() => setIsDiscountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle % vs SAR */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setTempDiscountType('percentage')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tempDiscountType === 'percentage'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setTempDiscountType('fixed')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tempDiscountType === 'fixed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fixed Amount (SAR)
              </button>
            </div>

            {/* Discount Value Input */}
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                {tempDiscountType === 'percentage' ? 'Discount Percentage (0 - 100%)' : 'Discount Amount (SAR)'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={tempDiscountVal}
                onChange={(e) => setTempDiscountVal(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Quick Presets */}
            {tempDiscountType === 'percentage' && (
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20, 25, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setTempDiscountVal(pct.toString())}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-mono font-bold text-slate-700 border border-slate-200"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setDiscount('percentage', 0);
                  setIsDiscountModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-rose-600 text-xs font-semibold"
              >
                Remove
              </button>
              <button
                onClick={handleApplyDiscount}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal (For users with canAddProducts permission) */}
      {isQuickAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {language === 'ar' ? 'إضافة صنف جديد للمجلد' : 'Quick Add Item to Catalog'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Authorized Cashier: {currentUser?.nameEn}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const priceNum = parseFloat(newProductPrice);
                if (!newProductNameEn || isNaN(priceNum) || priceNum <= 0) return;
                addProduct({
                  nameEn: newProductNameEn.trim(),
                  nameAr: newProductNameAr.trim() || newProductNameEn.trim(),
                  price: priceNum,
                  categoryId: newProductCategoryId || categories[0]?.id || 'cat_coffee',
                  image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
                  descriptionEn: 'Freshly prepared item',
                  descriptionAr: 'صنف طازج ولذيذ',
                  isAvailable: true,
                });
                setIsQuickAddProductModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Product Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Caramel Latte"
                  value={newProductNameEn}
                  onChange={(e) => setNewProductNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  اسم المنتج (بالعربية)
                </label>
                <input
                  type="text"
                  placeholder="مثال: لاتيه فانيلا كراميل"
                  value={newProductNameAr}
                  onChange={(e) => setNewProductNameAr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Price ({settings.currencyEn}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.5"
                    required
                    placeholder="18.00"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Category Folder *
                  </label>
                  <select
                    value={newProductCategoryId}
                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isRtl ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Granular Permission Denied Modal */}
      {permissionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-rose-200 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center ring-4 ring-rose-50">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {language === 'ar' ? 'صلاحية غير مصرح بها' : 'Permission Restricted'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed px-2">
                {permissionWarning}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 text-left rtl:text-right space-y-1">
              <span className="font-bold text-slate-700 block">
                Current User: {currentUser?.nameEn} ({currentUser?.role})
              </span>
              <span>
                {language === 'ar'
                  ? 'يمكن لمدير النظام ضبط الصلاحيات في لوحة الإدارة (صلاحية أخذ طلبات فقط / صلاحية إضافة منتجات)'
                  : 'Management can adjust granular permissions in the Admin Panel (Cashier Management).'}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPermissionWarning(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md"
              >
                {language === 'ar' ? 'فهمت ذلك' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
