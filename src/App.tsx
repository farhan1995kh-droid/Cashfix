import React, { useState, useEffect, useMemo, createElement as h } from 'react';

const INITIAL_BRANCHES = [
  { id: 'br_1', nameEn: 'Olaya Main Branch, Riyadh', nameAr: 'الفرع الرئيسي - العليا، الرياض' },
  { id: 'br_2', nameEn: 'Airport Terminal 5 Branch', nameAr: 'فرع المطار - صالة 5' },
  { id: 'br_3', nameEn: 'King Fahd Road Branch', nameAr: 'فرع طريق الملك فهد' },
  { id: 'br_4', nameEn: 'Al Nakheel Mall Express', nameAr: 'فرع النخيل مول - الرياض' },
];

const INITIAL_CASHIERS = [
  { id: 'c_1', nameEn: 'Sultan Al-Otaibi', nameAr: 'سلطان العتيبي', role: 'admin', pin: '1234', branch: 'Olaya Main Branch, Riyadh' },
  { id: 'c_2', nameEn: 'Omar Al-Ghamdi', nameAr: 'عمر الغامدي', role: 'cashier', pin: '0000', branch: 'Olaya Main Branch, Riyadh' },
  { id: 'c_3', nameEn: 'Sarah Al-Shehri', nameAr: 'سارة الشهري', role: 'cashier', pin: '1111', branch: 'Al Nakheel Mall Express' },
];

const INITIAL_CATEGORIES = [
  { id: 'coffee', nameEn: 'Coffee & Espresso', nameAr: 'القهوة والإسبريسو', icon: '☕' },
  { id: 'tea', nameEn: 'Tea & Warm Drinks', nameAr: 'الشاي والمشروبات الدافئة', icon: '🍵' },
  { id: 'cold', nameEn: 'Cold Drinks & Mojito', nameAr: 'المشروبات الباردة والموهيتو', icon: '🧊' },
  { id: 'bakery', nameEn: 'Bakery & Pastries', nameAr: 'المخبوزات والكرواسون', icon: '🥐' },
  { id: 'desserts', nameEn: 'Desserts & Sweets', nameAr: 'الحلويات والكيك', icon: '🍰' },
];

const INITIAL_PRODUCTS = [
  { id: 'p_1', catId: 'coffee', nameEn: 'Spanish Latte (Hot)', nameAr: 'سبانش لاتيه حار', price: 18.00 },
  { id: 'p_2', catId: 'coffee', nameEn: 'Iced Spanish Latte', nameAr: 'آيس سبانش لاتيه', price: 20.00 },
  { id: 'p_3', catId: 'coffee', nameEn: 'Flat White (Specialty)', nameAr: 'فلات وايت مختصة', price: 16.00 },
  { id: 'p_4', catId: 'coffee', nameEn: 'Americano (Double Shot)', nameAr: 'أمريكانو دبل شوت', price: 14.00 },
  { id: 'p_5', catId: 'coffee', nameEn: 'V60 Drip (Ethiopian)', nameAr: 'قهوة مقطرة V60 إثيوبي', price: 22.00 },
  { id: 'p_6', catId: 'cold', nameEn: 'Blueberry Mojito', nameAr: 'موهيتو توت أزرق بارد', price: 19.00 },
  { id: 'p_7', catId: 'cold', nameEn: 'Iced Matcha Latte', nameAr: 'آيس ماتشا لاتيه', price: 23.00 },
  { id: 'p_8', catId: 'bakery', nameEn: 'Butter Croissant', nameAr: 'كرواسون زبدة فرنسي', price: 12.00 },
  { id: 'p_9', catId: 'bakery', nameEn: 'Almond Chocolate Croissant', nameAr: 'كرواسون شوكولاتة ولوز', price: 15.00 },
  { id: 'p_10', catId: 'desserts', nameEn: 'San Sebastian Cheesecake', nameAr: 'تشيز كيك سان سيباستيان', price: 26.00 },
  { id: 'p_11', catId: 'desserts', nameEn: 'Chocolate Fudge Brownie', nameAr: 'براوني الشوكولاتة الفاخر', price: 18.00 },
  { id: 'p_12', catId: 'tea', nameEn: 'Moroccan Mint Tea Pot', nameAr: 'براد شاي مغربي بالنعناع', price: 15.00 },
];

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('cf_lang') || 'en');
  const isRtl = lang === 'ar';

  const [branches] = useState(INITIAL_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState(() => localStorage.getItem('cf_branch') || INITIAL_BRANCHES[0].nameEn);
  const [currentUser] = useState(INITIAL_CASHIERS[0]);
  
  const [cart, setCart] = useState<Array<any>>([]);
  const [orders, setOrders] = useState<Array<any>>(() => {
    const s = localStorage.getItem('cf_orders');
    return s ? JSON.parse(s) : [];
  });

  const [tab, setTab] = useState('pos'); // pos, sales
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment states
  const [cashTendered, setCashTendered] = useState('');
  const [madaAmount, setMadaAmount] = useState('');
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  useEffect(() => { localStorage.setItem('cf_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('cf_branch', currentBranch); }, [currentBranch]);
  useEffect(() => { localStorage.setItem('cf_orders', JSON.stringify(orders)); }, [orders]);

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const vatRate = 0.15;
  const vatAmount = useMemo(() => cartSubtotal * (vatRate / (1 + vatRate)), [cartSubtotal]);

  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter(p => {
      const matchCat = selectedCategory === 'all' || p.catId === selectedCategory;
      const matchQuery = !searchQuery ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameAr.includes(searchQuery);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const nextQty = i.qty + delta;
        return nextQty > 0 ? { ...i, qty: nextQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const completePayment = (method: string) => {
    if (cart.length === 0) return;

    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      items: [...cart],
      total: cartSubtotal,
      vat: vatAmount,
      branch: currentBranch,
      cashier: isRtl ? currentUser.nameAr : currentUser.nameEn,
      method,
      completedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    setLastReceipt(newOrder);
    setCart([]);
    setCashTendered('');
    setMadaAmount('');
    alert(isRtl ? 'تم إتمام الدفع بنجاح!' : 'Payment Completed Successfully!');
  };

  return h('div', { className: 'flex flex-col h-screen w-screen bg-slate-900 text-slate-100 font-sans overflow-hidden', dir: isRtl ? 'rtl' : 'ltr' },
    
    // Header
    h('header', { className: 'h-16 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0 shadow-md' },
      h('div', { className: 'flex items-center gap-3' },
        h('div', { className: 'w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg font-black text-white' }, '⚡'),
        h('div', null,
          h('div', { className: 'font-black text-base text-white flex items-center gap-2' },
            isRtl ? 'كاش فيكس' : 'CashFix POS',
            h('span', { className: 'text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold' }, 'PRO')
          ),
          h('select', {
            value: currentBranch,
            onChange: (e: any) => setCurrentBranch(e.target.value),
            className: 'bg-transparent text-slate-300 text-xs font-bold border-none outline-none cursor-pointer'
          }, branches.map(b => h('option', { key: b.id, value: b.nameEn, className: 'bg-slate-800 text-white' }, isRtl ? b.nameAr : b.nameEn)))
        )
      ),

      // Tabs & Language Toggle
      h('div', { className: 'flex items-center gap-3' },
        h('div', { className: 'flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 gap-1' },
          h('button', {
            onClick: () => setTab('pos'),
            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'pos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`
          }, isRtl ? 'نقطة البيع' : 'POS'),
          h('button', {
            onClick: () => setTab('sales'),
            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'sales' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`
          }, isRtl ? 'المبيعات' : 'Sales')
        ),
        h('button', {
          onClick: () => setLang(lang === 'en' ? 'ar' : 'en'),
          className: 'px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition-all'
        }, lang === 'en' ? 'العربية' : 'English')
      )
    ),

    // Main Content
    tab === 'pos' ? h('div', { className: 'flex flex-1 overflow-hidden' },
      
      // Left: Products Area
      h('div', { className: 'flex-1 flex flex-col p-4 overflow-y-auto bg-slate-950' },
        // Categories
        h('div', { className: 'flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0' },
          h('button', {
            onClick: () => setSelectedCategory('all'),
            className: `px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`
          }, isRtl ? 'الكل' : 'All'),
          INITIAL_CATEGORIES.map(cat => h('button', {
            key: cat.id,
            onClick: () => setSelectedCategory(cat.id),
            className: `px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`
          }, cat.icon, isRtl ? cat.nameAr : cat.nameEn))
        ),

        // Products Grid
        h('div', { className: 'grid grid-cols-2 md:grid-cols-3 gap-3' },
          filteredProducts.map(p => h('div', {
            key: p.id,
            onClick: () => addToCart(p),
            className: 'bg-slate-900 border border-slate-800 hover:border-blue-500 p-3 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow hover:shadow-lg group'
          },
            h('div', { className: 'font-bold text-sm text-slate-200 group-hover:text-blue-400 mb-2' }, isRtl ? p.nameAr : p.nameEn),
            h('div', { className: 'text-emerald-400 font-extrabold text-sm' }, `${p.price.toFixed(2)} SAR`)
          ))
        )
      ),

      // Right: Cart & Checkout
      h('div', { className: 'w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0' },
        h('div', { className: 'p-4 border-b border-slate-800 font-black text-sm text-slate-200' }, isRtl ? 'الطلب الحالي (Cart)' : 'Current Order'),
        
        h('div', { className: 'flex-1 p-4 overflow-y-auto space-y-3' },
          cart.length === 0 ? h('div', { className: 'text-center text-slate-500 text-xs py-10' }, isRtl ? 'السلة فارغة' : 'Cart is empty') :
          cart.map((item: any) => h('div', { key: item.id, className: 'flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50' },
            h('div', { className: 'flex-1 pr-2' },
              h('div', { className: 'font-bold text-xs text-slate-200' }, isRtl ? item.nameAr : item.nameEn),
              h('div', { className: 'text-[11px] text-emerald-400 font-semibold' }, `${(item.price * item.qty).toFixed(2)} SAR`)
            ),
            h('div', { className: 'flex items-center gap-2' },
              h('button', { onClick: () => updateQty(item.id, -1), className: 'w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white flex items-center justify-center' }, '-'),
              h('span', { className: 'text-xs font-bold w-4 text-center' }, item.qty),
              h('button', { onClick: () => updateQty(item.id, 1), className: 'w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white flex items-center justify-center' }, '+')
            )
          ))
        ),

        // Cart Summary & Checkout Actions
        h('div', { className: 'p-4 bg-slate-800 border-t border-slate-700 space-y-3' },
          h('div', { className: 'flex justify-between text-xs text-slate-400' },
            h('span', null, isRtl ? 'الضريبة (15%):' : 'VAT (15%):'),
            h('span', null, `${vatAmount.toFixed(2)} SAR`)
          ),
          h('div', { className: 'flex justify-between text-base font-black text-white' },
            h('span', null, isRtl ? 'الإجمالي:' : 'Total:'),
            h('span', { className: 'text-emerald-400' }, `${cartSubtotal.toFixed(2)} SAR`)
          ),
          h('div', { className: 'grid grid-cols-2 gap-2 pt-2' },
            h('button', {
              onClick: () => completePayment('cash'),
              disabled: cart.length === 0,
              className: 'py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow transition-all'
            }, isRtl ? 'دفع نقدي (Cash)' : 'Pay Cash'),
            h('button', {
              onClick: () => completePayment('mada'),
              disabled: cart.length === 0,
              className: 'py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow transition-all'
            }, isRtl ? 'بطاقة مدى (Mada)' : 'Pay Mada')
          )
        )
      )
    ) :

    // Sales History Tab
    h('div', { className: 'flex-1 p-6 overflow-y-auto bg-slate-950' },
      h('h2', { className: 'text-lg font-black mb-4 text-white' }, isRtl ? 'سجل المبيعات اليومية' : 'Sales History'),
      orders.length === 0 ? h('div', { className: 'text-slate-500 text-sm' }, isRtl ? 'لا توجد طلبات مكتملة حتى الآن' : 'No completed orders yet') :
      h('div', { className: 'space-y-3' },
        orders.map((ord: any) => h('div', { key: ord.id, className: 'bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center' },
          h('div', null,
            h('div', { className: 'font-black text-sm text-blue-400' }, ord.id),
            h('div', { className: 'text-xs text-slate-400 mt-1' }, `${new Date(ord.completedAt).toLocaleTimeString()} | ${ord.branch}`)
          ),
          h('div', { className: 'text-right' },
            h('div', { className: 'font-extrabold text-emerald-400 text-sm' }, `${ord.total.toFixed(2)} SAR`),
            h('div', { className: 'text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold mt-1 inline-block uppercase' }, ord.method)
          )
        ))
      )
    )
  );
    }
            
