import React, { useState, useEffect, useMemo, createElement as h } from 'react';

const INITIAL_BRANCHES = [
  { id: 'br_1', nameEn: 'Olaya Main Branch, Riyadh', nameAr: 'الفرع الرئيسي - العليا، الرياض' },
  { id: 'br_2', nameEn: 'Airport Terminal 5 Branch', nameAr: 'فرع المطار - صالة 5' },
];

const INITIAL_CATEGORIES = [
  { id: 'coffee', nameEn: 'Coffee & Espresso', nameAr: 'القهوة والإسبريسو', icon: '☕' },
  { id: 'cold', nameEn: 'Cold Drinks & Mojito', nameAr: 'المشروبات الباردة والموهيتو', icon: '🧊' },
  { id: 'bakery', nameEn: 'Bakery & Pastries', nameAr: 'المخبوزات والكرواسون', icon: '🥐' },
  { id: 'desserts', nameEn: 'Desserts & Sweets', nameAr: 'الحلويات والكيك', icon: '🍰' },
];

const INITIAL_PRODUCTS = [
  { id: 'p_1', catId: 'coffee', nameEn: 'Spanish Latte (Hot)', nameAr: 'سبانش لاتيه حار', price: 18.00 },
  { id: 'p_2', catId: 'coffee', nameEn: 'Iced Spanish Latte', nameAr: 'آيس سبانش لاتيه', price: 20.00 },
  { id: 'p_3', catId: 'coffee', nameEn: 'Flat White (Specialty)', nameAr: 'فلات وايت مختصة', price: 16.00 },
  { id: 'p_4', catId: 'cold', nameEn: 'Blueberry Mojito', nameAr: 'موهيتو توت أزرق بارد', price: 19.00 },
  { id: 'p_5', catId: 'bakery', nameEn: 'Butter Croissant', nameAr: 'كرواسون زبدة فرنسي', price: 12.00 },
  { id: 'p_6', catId: 'desserts', nameEn: 'San Sebastian Cheesecake', nameAr: 'تشيز كيك سان سيباستيان', price: 26.00 },
];

export default function App() {
  const [lang, setLang] = useState('en');
  const isRtl = lang === 'ar';
  const [currentBranch, setCurrentBranch] = useState(INITIAL_BRANCHES[0].nameEn);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<Array<any>>([]);
  const [orders, setOrders] = useState<Array<any>>([]);

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const vatAmount = useMemo(() => cartSubtotal * 0.15, [cartSubtotal]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return INITIAL_PRODUCTS;
    return INITIAL_PRODUCTS.filter(p => p.catId === selectedCategory);
  }, [selectedCategory]);

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
      method,
      completedAt: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    alert(isRtl ? 'تم إتمام الدفع بنجاح!' : 'Payment Completed Successfully!');
  };

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', maxWidth: '480px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '16px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '14px', borderRadius: '12px', marginBottom: '14px', border: '1px solid #334155' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>Cashfix POS Pro ⚡</h2>
          <select 
            value={currentBranch} 
            onChange={e => setCurrentBranch(e.target.value)}
            style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '11px', marginTop: '4px', outline: 'none', cursor: 'pointer' }}
          >
            {INITIAL_BRANCHES.map(b => (
              <option key={b.id} value={b.nameEn} style={{ background: '#1e293b', color: '#fff' }}>
                {isRtl ? b.nameAr : b.nameEn}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
        <button 
          onClick={() => setSelectedCategory('all')}
          style={{ padding: '8px 12px', borderRadius: '8px', background: selectedCategory === 'all' ? '#2563eb' : '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          {isRtl ? 'الكل' : 'All'}
        </button>
        {INITIAL_CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: selectedCategory === cat.id ? '#2563eb' : '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            {cat.icon} {isRtl ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {filteredProducts.map(p => (
          <div 
            key={p.id}
            onClick={() => addToCart(p)}
            style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', minHeight: '32px', color: '#e2e8f0' }}>
              {isRtl ? p.nameAr : p.nameEn}
            </div>
            <div style={{ color: '#34d399', fontWeight: 'bold', fontSize: '13px' }}>
              {p.price.toFixed(2)} SAR
            </div>
          </div>
        ))}
      </div>

      {/* Cart Section */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px', color: '#38bdf8' }}>
          {isRtl ? 'الطلب الحالي' : 'Current Order'}
        </h3>
        
        {cart.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: '10px 0' }}>
            {isRtl ? 'السلة فارغة' : 'Cart is empty'}
          </p>
        ) : (
          <div>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{isRtl ? item.nameAr : item.nameEn}</div>
                  <div style={{ color: '#34d399' }}>{(item.price * item.qty).toFixed(2)} SAR</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ background: '#334155', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 'bold' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ background: '#2563eb', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid #334155', marginTop: '10px', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            <span>VAT (15%):</span>
            <span>{vatAmount.toFixed(2)} SAR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', color: '#34d399' }}>
            <span>{isRtl ? 'الإجمالي:' : 'Total:'}</span>
            <span>{cartSubtotal.toFixed(2)} SAR</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
          <button 
            onClick={() => completePayment('cash')}
            disabled={cart.length === 0}
            style={{ padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
          >
            {isRtl ? 'نقدي (Cash)' : 'Pay Cash'}
          </button>
          <button 
            onClick={() => completePayment('mada')}
            disabled={cart.length === 0}
            style={{ padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
          >
            {isRtl ? 'مدى (Mada)' : 'Pay Mada'}
          </button>
        </div>
      </div>

    </div>
  );
}
