import React, { useState, useEffect } from 'react';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'settings'>('pos');
  const [cart, setCart] = useState<Array<{ id: number; name: string; price: number; qty: number }>>([]);
  const [cashAmount, setCashAmount] = useState('');
  const [madaAmount, setMadaAmount] = useState('');

  const products = [
    { id: 1, name: language === 'en' ? 'Chicken Burger' : 'بర్గر دجاج', price: 25 },
    { id: 2, name: language === 'en' ? 'Beef Burger' : 'بర్గر لحم', price: 30 },
    { id: 3, name: language === 'en' ? 'French Fries' : 'بطاطس مقلية', price: 10 },
    { id: 4, name: language === 'en' ? 'Pepsi' : 'بيبسي', price: 5 },
  ];

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div style={{ direction: language === 'ar' ? 'rtl' : 'ltr', padding: '16px', maxWidth: '480px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Cashfix POS</h2>
        <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} style={{ padding: '6px 12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {products.map(p => (
          <button key={p.id} onClick={() => addToCart(p)} style={{ padding: '16px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
            <div style={{ color: '#28a745', marginTop: '4px' }}>{p.price} SAR</div>
          </button>
        ))}
      </div>

      <div style={{ background: '#f1f3f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{language === 'en' ? 'Current Order' : 'الطلب الحالي'}</h3>
        {cart.length === 0 ? (
          <p style={{ color: '#666', margin: 0 }}>{language === 'en' ? 'Cart is empty' : 'السلة فارغة'}</p>
        ) : (
          cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>{item.name} x {item.qty}</span>
              <span>{item.price * item.qty} SAR</span>
            </div>
          ))
        )}
        <hr style={{ border: '0', borderTop: '1px solid #ddd', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
          <span>{language === 'en' ? 'Total:' : 'المجموع:'}</span>
          <span>{total} SAR</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input type="number" placeholder={language === 'en' ? 'Cash Amount' : 'مبلغ النقود'} value={cashAmount} onChange={e => setCashAmount(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        <input type="number" placeholder={language === 'en' ? 'Mada Card Amount' : 'مبلغ بطاقة مدى'} value={madaAmount} onChange={e => setMadaAmount(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        <button onClick={() => alert('Payment Settled Successfully!')} style={{ padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
          {language === 'en' ? 'Complete Split Payment' : 'إتمام الدفع المقسم'}
        </button>
      </div>
    </div>
  );
        }
