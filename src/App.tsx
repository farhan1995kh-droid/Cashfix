import React, { useState, useEffect, useMemo } from 'react';

const INITIAL_BRANCHES = [
  { id: 'br_1', nameEn: 'Olaya Main Branch, Riyadh', nameAr: 'الفرع الرئيسي - العليا، الرياض' },
  { id: 'br_2', nameEn: 'Airport Terminal 5 Branch', nameAr: 'فرع المطار - صالة 5' },
  { id: 'br_3', nameEn: 'King Fahd Road Branch', nameAr: 'فرع طريق الملك فهد' },
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
  { id: 'p_4', catId: 'coffee', nameEn: 'Americano (Double Shot)', nameAr: 'أمريكانو دبل شوت', price: 14.00 },
  { id: 'p_5', catId: 'cold', nameEn: 'Blueberry Mojito', nameAr: 'موهيتو توت أزرق بارد', price: 19.00 },
  { id: 'p_6', catId: 'cold', nameEn: 'Iced Matcha Latte', nameAr: 'آيس ماتشا لاتيه', price: 23.00 },
  { id: 'p_7', catId: 'bakery', nameEn: 'Butter Croissant', nameAr: 'كرواسون زبدة فرنسي', price: 12.00 },
  { id: 'p_8', catId: 'desserts', nameEn: 'San Sebastian Cheesecake', nameAr: 'تشيز كيك سان سيباستيان', price: 26.00 },
];

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const [currentBranch, setCurrentBranch] = useState(INITIAL_BRANCHES[0].nameEn);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<Array<{ id: string; nameEn: string; nameAr: string; price: number; qty: number }>>([]);
  
  // Payment states
  const [cashAmount, setCashAmount] = useState('');
  const [madaAmount, setMadaAmount] = useState('');
  const [orderCompleted, setOrderCompleted] = useState(false);

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const vatAmount = useMemo(() => cartSubtotal * 0.15, [cartSubtotal]);
  const grandTotal = useMemo(() => cartSubtotal, [cartSubtotal]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return INITIAL_PRODUCTS;
    return INITIAL_PRODUCTS.filter(p => p.catId === selectedCategory);
  }, [selectedCategory]);

  const addToCart = (product: typeof INITIAL_PRODUCTS[0]) => {
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
    }).filter(Boolean) as any);
  };

  const handleCompletePayment = () => {
    if (cart.length === 0) return;
    setOrderCompleted(true);
    setTimeout(() => {
      setCart([]);
      setCashAmount('');
      setMadaAmount('');
      setOrderCompleted(false);
    }, 2500);
  };

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', maxWidth: '480px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '30px' }}>
      
      {/* Top Header */}
      <header style={{ background: '#1e293b', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#38bdf8' }}>Cashfix POS ⚡</h1>
          <select 
            value={currentBranch} 
            onChange={(e) => setCurrentBranch(e.target.value)}
            style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '12px', marginTop: '2px', outline: 'none' }}
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
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
        >
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </header>

      {/* Categories Bar */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <button 
          onClick={() => setSelectedCategory('all')}
          style={{ padding: '8px 14px', borderRadius: '8px', background: selectedCategory === 'all' ? '#2563eb' : '#334155', color: '#fff', border: 'none', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isRtl ? 'الكل' : 'All Items'}
        </button>
        {INITIAL_CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{ padding: '8px 14px', borderRadius: '8px', background: selectedCategory === cat.id ? '#2563eb' : '#334155', color: '#fff', border: 'none', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {cat.icon} {isRtl ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 12px 0' }}>{isRtl ? 'قائمة المنتجات' : 'Products Menu'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {filteredProducts.map(p => (
            <div 
              key={p.id}
              onClick={() => addToCart(p)}
              style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', minHeight: '38px' }}>
                {isRtl ? p.nameAr : p.nameEn}
              </div>
              <div style={{ color: '#34d399', fontWeight: '800', fontSize: '15px' }}>
                {p.price.toFixed(2)} SAR
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Split Payment Section */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            {isRtl ? 'الطلب الحالي (Cart)' : 'Current Order'}
          </h3>

          {cart.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '15px 0', fontSize: '13px' }}>
              {isRtl ? 'السلة فارغة، قم بإضافة منتجات' : 'Cart is empty. Select products.'}
            </p>
          ) : (
            <div>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '13px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{isRtl ? item.nameAr : item.nameEn}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>{(item.price * item.qty).toFixed(2)} SAR</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{ background: '#334155', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{ background: '#2563eb', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #334155', marginTop: '12px', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>{isRtl ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                  <span>{vatAmount.toFixed(2)} SAR</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', color: '#34d399', marginTop: '6px' }}>
                  <span>{isRtl ? 'المجموع الكلي:' : 'Grand Total:'}</span>
                  <span>{grandTotal.toFixed(2)} SAR</span>
                </div>
              </div>

              {/* Split Payment Inputs */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                  {isRtl ? 'خيارات الدفع (نقدي / مدى):' : 'Split Payment (Cash / Mada):'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input 
                    type="number" 
                    placeholder={isRtl ? 'مبلغ نقدي (Cash)' : 'Cash Amount'}
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    style={{ background: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  <input 
                    type="number" 
                    placeholder={isRtl ? 'مبلغ مدى (Mada)' : 'Mada Amount'}
                    value={madaAmount}
                    onChange={(e) => setMadaAmount(e.target.value)}
                    style={{ background: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <button 
                onClick={handleCompletePayment}
                style={{ width: '100%', marginTop: '14px', background: orderCompleted ? '#059669' : '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.3s' }}
              >
                {orderCompleted 
                  ? (isRtl ? '✓ تم إتمام الدفع بنجاح!' : '✓ Payment Completed!') 
                  : (isRtl ? 'إتمام الدفع (Complete Split Payment)' : 'Complete Split Payment')}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
