
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<title>CashFix - Bilingual POS System (Single-File Standalone)</title>
<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- React 18 & ReactDOM CDN -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<!-- Google Fonts: Cairo (Arabic) & Plus Jakarta Sans -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">

<style>
body {
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
user-select: none;
-webkit-user-select: none;
-webkit-tap-highlight-color: transparent;
}
[dir="rtl"] {
font-family: 'Cairo', system-ui, -apple-system, sans-serif;
}
.font-mono {
font-family: 'JetBrains Mono', monospace;
}
.thermal-receipt {
width: 100%;
max-width: 380px;
background: #ffffff;
color: #111827;
font-family: 'JetBrains Mono', monospace;
}
@media print {
body * {
visibility: hidden;
}
#print-area, #print-area * {
visibility: visible;
}
#print-area {
position: absolute;
left: 0;
top: 0;
width: 80mm;
}
}
</style>
</head>
<body class="bg-slate-900 text-slate-800 antialiased overflow-hidden">
<div id="root"></div>

<script>
const { useState, useEffect, useMemo, createElement: h } = React;

// --- INITIAL DATA & CONFIG ---
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
{ id: 'p_1', catId: 'coffee', nameEn: 'Spanish Latte (Hot)', nameAr: 'سبانش لاتيه حار', price: 18.00, img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300' },
{ id: 'p_2', catId: 'coffee', nameEn: 'Iced Spanish Latte', nameAr: 'آيس سبانش لاتيه', price: 20.00, img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300' },
{ id: 'p_3', catId: 'coffee', nameEn: 'Flat White (Specialty)', nameAr: 'فلات وايت مختصة', price: 16.00, img: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=300' },
{ id: 'p_4', catId: 'coffee', nameEn: 'Americano (Double Shot)', nameAr: 'أمريكانو دبل شوت', price: 14.00, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300' },
{ id: 'p_5', catId: 'coffee', nameEn: 'V60 Drip (Ethiopian)', nameAr: 'قهوة مقطرة V60 إثيوبي', price: 22.00, img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300' },
{ id: 'p_6', catId: 'cold', nameEn: 'Blueberry Mojito', nameAr: 'موهيتو توت أزرق بارد', price: 19.00, img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300' },
{ id: 'p_7', catId: 'cold', nameEn: 'Iced Matcha Latte', nameAr: 'آيس ماتشا لاتيه', price: 23.00, img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300' },
{ id: 'p_8', catId: 'bakery', nameEn: 'Butter Croissant', nameAr: 'كرواسون زبدة فرنسي', price: 12.00, img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300' },
{ id: 'p_9', catId: 'bakery', nameEn: 'Almond Chocolate Croissant', nameAr: 'كرواسون شوكولاتة ولوز', price: 15.00, img: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=300' },
{ id: 'p_10', catId: 'desserts', nameEn: 'San Sebastian Cheesecake', nameAr: 'تشيز كيك سان سيباستيان', price: 26.00, img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300' },
{ id: 'p_11', catId: 'desserts', nameEn: 'Chocolate Fudge Brownie', nameAr: 'براوني الشوكولاتة الفاخر', price: 18.00, img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300' },
{ id: 'p_12', catId: 'tea', nameEn: 'Moroccan Mint Tea Pot', nameAr: 'براد شاي مغربي بالنعناع', price: 15.00, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300' },
 ];

// --- MAIN COMPONENT ---
function CashFixApp() {
// Storage states
const [lang, setLang] = useState(() => localStorage.getItem('cf_lang') || 'en');
const isRtl = lang === 'ar';

const [branches, setBranches] = useState(() => {
const s = localStorage.getItem('cf_branches');
return s ? JSON.parse(s) : INITIAL_BRANCHES;
});

const [cashiers, setCashiers] = useState(() => {
const s = localStorage.getItem('cf_cashiers');
return s ? JSON.parse(s) : INITIAL_CASHIERS;
});

const [currentUser, setCurrentUser] = useState(() => {
const s = localStorage.getItem('cf_user');
return s ? JSON.parse(s) : INITIAL_CASHIERS[0];
});

const [currentBranch, setCurrentBranch] = useState(() => {
return localStorage.getItem('cf_branch') || INITIAL_BRANCHES[0].nameEn;
});

const [currentShift, setCurrentShift] = useState(() => {
const s = localStorage.getItem('cf_shift');
return s ? JSON.parse(s) : {
id: 'shift_init',
cashierId: INITIAL_CASHIERS[0].id,
cashierName: INITIAL_CASHIERS[0].nameEn,
startTime: new Date().toISOString(),
openingFloat: 500,
isOpen: true
};
});

const [cart, setCart] = useState([]);
const [orders, setOrders] = useState(() => {
const s = localStorage.getItem('cf_orders');
return s ? JSON.parse(s) : [];
});

const [heldOrders, setHeldOrders] = useState(() => {
const s = localStorage.getItem('cf_held');
return s ? JSON.parse(s) : [];
});

// UI navigation
const [tab, setTab] = useState('pos'); // pos, sales, admin
const [selectedCategory, setSelectedCategory] = useState('all');
const [searchQuery, setSearchQuery] = useState('');

// Modals
const [payingOrder, setPayingOrder] = useState(null); // active checkout
const [isSplit, setIsSplit] = useState(false);
const [splitAmounts, setSplitAmounts] = useState({ cash: 0, mada: 0, visa: 0, due: 0 });
const [cashTendered, setCashTendered] = useState('');
const [lastReceipt, setLastReceipt] = useState(null);

// Security / PIN Modals
const [isPinModalOpen, setIsPinModalOpen] = useState(false);
const [selectedTargetCashier, setSelectedTargetCashier] = useState(null);
const [pinInput, setPinInput] = useState('');
const [pinError, setPinError] = useState('');

// Day Start Modal
const [isDayStartOpen, setIsDayStartOpen] = useState(false);
const [startCashier, setStartCashier] = useState(currentUser);
const [startPin, setStartPin] = useState('');
const [startFloat, setStartFloat] = useState('500');
const [startError, setStartError] = useState('');

// Day Close Modal
const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
const [countedCash, setCountedCash] = useState('');

// Save to localStorage on change
useEffect(() => { localStorage.setItem('cf_lang', lang); }, [lang]);
useEffect(() => { localStorage.setItem('cf_branches', JSON.stringify(branches)); }, [branches]);
useEffect(() => { localStorage.setItem('cf_cashiers', JSON.stringify(cashiers)); }, [cashiers]);
useEffect(() => { localStorage.setItem('cf_user', JSON.stringify(currentUser)); }, [currentUser]);
useEffect(() => { localStorage.setItem('cf_branch', currentBranch); }, [currentBranch]);
useEffect(() => {
if (currentShift) localStorage.setItem('cf_shift', JSON.stringify(currentShift));
else localStorage.removeItem('cf_shift');
}, [currentShift]);
useEffect(() => { localStorage.setItem('cf_orders', JSON.stringify(orders)); }, [orders]);
useEffect(() => { localStorage.setItem('cf_held', JSON.stringify(heldOrders)); }, [heldOrders]);

// Cart calculations
const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
const vatRate = 0.15;
const vatAmount = useMemo(() => cartSubtotal * (vatRate / (1 + vatRate)), [cartSubtotal]);
const cartNetSubtotal = useMemo(() => cartSubtotal - vatAmount, [cartSubtotal, vatAmount]);

// Filtered products
const filteredProducts = useMemo(() => {
return INITIAL_PRODUCTS.filter(p => {
const matchCat = selectedCategory === 'all' || p.catId === selectedCategory;
const matchQuery = !searchQuery ||
p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
p.nameAr.includes(searchQuery);
return matchCat && matchQuery;
});
}, [selectedCategory, searchQuery]);

// Cart helpers
const addToCart = (product) => {
setCart(prev => {
const exists = prev.find(i => i.id === product.id);
if (exists) {
return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
}
return [...prev, { ...product, qty: 1 }];
});
};

const updateQty = (id, delta) => {
setCart(prev => prev.map(i => {
if (i.id === id) {
const nextQty = i.qty + delta;
return nextQty > 0 ? { ...i, qty: nextQty } : null;
}
return i;
}).filter(Boolean));
};

// Open Checkout
const openCheckout = () => {
if (cart.length === 0) return;
setIsSplit(false);
setSplitAmounts({ cash: cartSubtotal, mada: 0, visa: 0, due: 0 });
setCashTendered(cartSubtotal.toString());
setPayingOrder({
id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
items: [...cart],
total: cartSubtotal,
vat: vatAmount,
createdAt: new Date().toISOString(),
branch: currentBranch,
cashier: isRtl ? currentUser.nameAr : currentUser.nameEn,
});
};

// Complete Order Settlement
const completePayment = (singleMethod) => {
if (!payingOrder) return;

let paymentData = {};
if (isSplit) {
const totalSplit = Number(splitAmounts.cash || 0) + Number(splitAmounts.mada || 0) + Number(splitAmounts.visa || 0) + Number(splitAmounts.due || 0);
if (Math.abs(totalSplit - payingOrder.total) > 0.05) {
alert(isRtl ? خطأ: مجموع مبالغ الدفع (${totalSplit.toFixed(2)}) لا يطابق إجمالي الفاتورة (${payingOrder.total.toFixed(2)}) : Validation Error: Sum of split payments (${totalSplit.toFixed(2)}) does not match Total (${payingOrder.total.toFixed(2)}));
return;
}
const cashRequired = Number(splitAmounts.cash || 0);
const tendered = Number(cashTendered) || cashRequired;
const change = tendered > cashRequired ? tendered - cashRequired : 0;

paymentData = {
isSplit: true,
method: 'split',
splits: [
{ method: 'cash', amount: cashRequired, tendered, change },
{ method: 'mada', amount: Number(splitAmounts.mada || 0) },
{ method: 'visa', amount: Number(splitAmounts.visa || 0) },
{ method: 'due', amount: Number(splitAmounts.due || 0) }
 ].filter(s => s.amount > 0),
tendered,
change
};
} else {
const tendered = Number(cashTendered) || payingOrder.total;
const change = singleMethod === 'cash' && tendered > payingOrder.total ? tendered - payingOrder.total : 0;
paymentData = {
isSplit: false,
method: singleMethod,
amount: payingOrder.total,
tendered: singleMethod === 'cash' ? tendered : payingOrder.total,
change
};
}

const finalOrder = {
...payingOrder,
payment: paymentData,
completedAt: new Date().toISOString(),
status: 'completed'
};

setOrders(prev => [finalOrder, ...prev]);
setLastReceipt(finalOrder);
setCart([]);
setPayingOrder(null);
};

// Shift metrics calculation
const shiftMetrics = useMemo(() => {
if (!currentShift) return { totalSales: 0, cash: 0, mada: 0, visa: 0, due: 0, count: 0 };
const shiftStart = new Date(currentShift.startTime).getTime();
const shiftOrders = orders.filter(o => new Date(o.completedAt || o.createdAt).getTime() >= shiftStart);

let totalSales = 0, cash = 0, mada = 0, visa = 0, due = 0;
shiftOrders.forEach(o => {
totalSales += o.total;
if (o.payment?.isSplit) {
o.payment.splits.forEach(s => {
if (s.method === 'cash') cash += s.amount;
else if (s.method === 'mada') mada += s.amount;
else if (s.method === 'visa') visa += s.amount;
else if (s.method === 'due') due += s.amount;
});
} else {
const m = o.payment?.method;
if (m === 'cash') cash += o.total;
else if (m === 'mada') mada += o.total;
else if (m === 'visa') visa += o.total;
else if (m === 'due') due += o.total;
}
});
return { totalSales, cash, mada, visa, due, count: shiftOrders.length };
}, [currentShift, orders]);

// Cashier PIN switch verification
const handleSwitchVerify = (digit) => {
const nextPin = pinInput + digit;
setPinInput(nextPin);
setPinError('');
if (nextPin.length === 4) {
if (!selectedTargetCashier) {
const matched = cashiers.find(c => c.pin === nextPin);
if (matched) {
setCurrentUser(matched);
setIsPinModalOpen(false);
setPinInput('');
} else {
setPinError(isRtl ? 'رمز الدخول غير صحيح' : 'Invalid PIN code');
setPinInput('');
}
} else {
if (selectedTargetCashier.pin === nextPin) {
setCurrentUser(selectedTargetCashier);
setIsPinModalOpen(false);
setSelectedTargetCashier(null);
setPinInput('');
} else {
setPinError(isRtl ? 'الرمز السري غير مطابق لهذا الكاشير' : 'Incorrect PIN for selected cashier');
setPinInput('');
}
}
}
};

// Day Start Handler
const handleDayStartSubmit = (e) => {
e.preventDefault();
if (!startCashier) return;
if (startCashier.pin !== startPin.trim()) {
setStartError(isRtl ? 'الرمز السري غير صحيح للكاشير!' : 'Incorrect PIN code for cashier!');
setStartPin('');
return;
}
const floatVal = parseFloat(startFloat) || 0;
const newShift = {
id: 'shift_' + Date.now(),
cashierId: startCashier.id,
cashierName: isRtl ? startCashier.nameAr : startCashier.nameEn,
startTime: new Date().toISOString(),
openingFloat: floatVal,
isOpen: true
};
setCurrentUser(startCashier);
setCurrentShift(newShift);
setIsDayStartOpen(false);
setStartPin('');
setStartError('');
};

// Day Close Handler
const handleDayCloseSubmit = () => {
const counted = parseFloat(countedCash) || 0;
const expected = currentShift.openingFloat + shiftMetrics.cash;
const variance = counted - expected;

alert(isRtl
? تم إغلاق الوردية وطباعة تقرير Z!\nالإيراد: ${shiftMetrics.totalSales.toFixed(2)} ر.س\nالنقد بالدرج: ${counted.toFixed(2)} ر.س\nالفارق: ${variance >= 0 ? '+' : ''}${variance.toFixed(2)} ر.س
: Shift Closed (Z-Report)!\nTotal Sales: ${shiftMetrics.totalSales.toFixed(2)} SAR\nActual Cash: ${counted.toFixed(2)} SAR\nVariance: ${variance >= 0 ? '+' : ''}${variance.toFixed(2)} SAR);

setCurrentShift(null);
setIsDayCloseOpen(false);
setCountedCash('');
};

return h('div', { className: 'flex flex-col h-screen w-screen bg-slate-900 text-slate-100 font-sans', dir: isRtl ? 'rtl' : 'ltr' },
// --- TOP NAVIGATION HEADER ---
h('header', { className: 'h-16 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0 shadow-md' },
h('div', { className: 'flex items-center gap-3' },
h('div', { className: 'w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg font-black text-white' }, '⚡'),
h('div', null,
h('div', { className: 'font-black text-base text-white flex items-center gap-2' },
isRtl ? 'كاش فيكس' : 'CashFix POS',
h('span', { className: 'text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold' }, 'PRO')
),
h('div', { className: 'text-xs text-slate-400 font-semibold flex items-center gap-1' },
'📍 ',
h('select', {
value: currentBranch,
onChange: e => setCurrentBranch(e.target.value),
className: 'bg-transparent text-slate-300 font-bold border-none outline-none cursor-pointer'
}, branches.map(b => h('option', { key: b.id, value: b.nameEn, className: 'bg-slate-800 text-white' }, isRtl ? b.nameAr : b.nameEn)))
)
)
),

// Center Tabs
h('div', { className: 'flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-700 gap-1' },
h('button', {
onClick: () => setTab('pos'),
className: px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'pos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}}, isRtl ? 'نقطة البيع (POS)' : 'Cashier Register'), h('button', { onClick: () =&gt; setTab('sales'), className:px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'sales' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}
}, isRtl ? 'سجل المبيعات' : 'Sales History'),
curr


  
