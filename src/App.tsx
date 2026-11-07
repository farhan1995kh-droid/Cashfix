import React, { useState, useEffect, useMemo } from 'react';

const INITIAL_BRANCHES = [
  { id: 'br_1', nameEn: 'Olaya Main Branch, Riyadh', nameAr: 'الفرع الرئيسي - العليا، الرياض' },
  { id: 'br_2', nameEn: 'Airport Terminal 5 Branch', nameAr: 'فرع المطار - صالة 5' },
];

const INITIAL_PRODUCTS = [
  { id: 'p_1', catId: 'coffee', nameEn: 'Spanish Latte (Hot)', nameAr: 'سبانش لاتيه حار', price: 18.00 },
  { id: 'p_2', catId: 'coffee', nameEn: 'Iced Spanish Latte', nameAr: 'آيس سبانش لاتيه', price: 20.00 },
  { id: 'p_3', catId: 'coffee', nameEn: 'Flat White (Specialty)', nameAr: 'فلات وايت مختصة', price: 16.00 },
  { id: 'p_4', catId: 'coffee', nameEn: 'Americano (Double Shot)', nameAr: 'أمريكانو دبل شوت', price: 14.00 },
  { id: 'p_5', catId: 'cold', nameEn: 'Blueberry Mojito', nameAr: 'موهيتو توت أزرق بارد', price: 19.00 },
  { id: 'p_6', catId: 'bakery', nameEn: 'Butter Croissant', nameAr: 'كرواسون زبدة فرنسي', price: 12.00 },
];

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const [currentBranch, setCurrentBranch] = useState(INITIAL_BRANCHES[0].nameEn);
  const [cart, setCart] = useState<Array<{ id: string; nameEn: string; nameAr: string; price: number; qty: number }>>([]);
  const [cashTendered, setCashTendered] = useState('');
  const [madaAmount, setMadaAmount] = useState('');

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);

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

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', padding: '16px', maxWidth: '480px', margin: '0 auto', background: '#fff', minHeight: '100vh', color: '#111' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Cashfix POS</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{currentBranch}</p>
        </div>
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} style={{ padding: '6px 12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {INITIAL_PRODUCTS.map(p => (
          <button key={p.id} onClick={() => addToCart(p)} style={{ padding: '14px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: isRtl ? 'right' : 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{isRtl ? p.nameAr : p.nameEn}</div>
            <div style={{ color: '#28a745', marginTop: '4px', fontWeight: 600 }}>{p.price} SAR</div>
          </button>
        ))}
      </div>

      <div style={{ background: '#f1f3f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{isRtl ? 'الطلب الحالي' : 'Current Order'}</h3>
        {cart.length === 0 ? (
          <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>{isRtl ? 'السلة فارغة' : 'Cart is empty'}</p>
        ) : (
          cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
              <span>{isRtl ? item.nameAr : item.nameEn} x {item.qty}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{item.price * item.qty} SAR</span>
                <button onClick={() => updateQty(item.id, -1)} style={{ background: '#ccc', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                <button onClick={() => updateQty(item.id, 1)} style={{ background: '#007bff', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
              </div>
            </div>
          ))
        )}
        <hr style={{ border: '0', borderTop: '1px solid #ddd', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
          <span>{isRtl ? 'المجموع الكلي:' : 'Total:'}</span>
          <span style={{ color: '#28a745' }}>{cartSubtotal} SAR</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input type="number" placeholder={isRtl ? 'مبلغ النقود (Cash)' : 'Cash Amount'} value={cashTendered} onChange={e => setCashTendered(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        <input type="number" placeholder={isRtl ? 'مبلغ بطاقة مدى (Mada)' : 'Mada Card Amount'} value={madaAmount} onChange={e => setMadaAmount(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        <button onClick={() => alert(isRtl ? 'تم إتمام الدفع بنجاح!' : 'Payment Completed Successfully!')} style={{ padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
          {isRtl ? 'إتمام الدفع' : 'Complete Payment'}
        </button>
      </div>
    </div>
  );
              }
