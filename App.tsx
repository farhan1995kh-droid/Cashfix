import React, { useState, useEffect } from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { Header } from './components/Header';
import { PosSellingScreen } from './components/PosSellingScreen';
import { HeldOrdersTab } from './components/HeldOrdersTab';
import { CustomerQrView } from './components/CustomerQrView';
import { AdminPanel } from './components/AdminPanel';
import { IncomingQrAlarmModal } from './components/IncomingQrAlarmModal';
import { DayStartModal } from './components/DayStartModal';
import { DayCloseModal } from './components/DayCloseModal';
import { PaymentModal } from './components/PaymentModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { SalesAndRefundsView } from './components/SalesAndRefundsView';
import { HoldOrderModal } from './components/HoldOrderModal';
import { PinLoginModal } from './components/PinLoginModal';
import { ManagementLockModal } from './components/ManagementLockModal';
import { LiveSalesSummaryModal } from './components/LiveSalesSummaryModal';
import { Order } from './types/pos';

function MainApp() {
  const {
    activePayingOrder,
    setActivePayingOrder,
    cart,
    cartTotal,
    selectedSourceId,
    orderSources,
    currentUser,
    isManagementLockModalOpen,
    closeManagementLockModal,
    isLiveSalesModalOpen,
    closeLiveSalesModal,
  } = usePos();

  // Navigation tab for Cashier POS interface
  const [currentTab, setCurrentTab] = useState<'pos' | 'held' | 'sales' | 'refunds' | 'admin' | 'customer'>('pos');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // Check URL query param: if `?mode=customer`, switch directly to customer self-ordering mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'customer') {
      setCurrentTab('customer');
    }
  }, []);

  // When cashier taps "Pay & Settle" on POS selling screen, prepare temporary order for PaymentModal
  const handleOpenPaymentFromCart = () => {
    if (cart.length === 0) return;
    const src = orderSources.find((s) => s.id === selectedSourceId) || orderSources[0];

    const tempCartOrder: Order = {
      id: `CART-${Date.now().toString().slice(-4)}`,
      dailyOrderNumber: 0,
      createdAt: new Date().toISOString(),
      sourceId: src.id,
      sourceNameEn: src.nameEn,
      sourceNameAr: src.nameAr,
      items: [...cart],
      subtotal: cart.reduce((s, i) => s + (i.customPrice ?? i.product.price) * i.quantity, 0),
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 15,
      taxAmount: (cartTotal * 15) / 115,
      total: cartTotal,
      status: 'held',
      cashierId: currentUser?.id,
      cashierName: currentUser?.nameEn,
    };
    setActivePayingOrder(tempCartOrder);
  };

  const handleSettleHeldOrder = (order: Order) => {
    setActivePayingOrder(order);
  };

  // If in pure customer self-ordering screen (from scanning QR code on phone)
  if (currentTab === 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Subtle toggle back to cashier mode for dev/demo */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
          <span className="font-semibold text-blue-700">📱 Customer Mobile Self-Ordering View</span>
          <button
            onClick={() => setCurrentTab('pos')}
            className="text-blue-600 hover:text-blue-800 font-extrabold hover:underline"
          >
            ← Switch to Cashier Tablet POS
          </button>
        </div>
        <CustomerQrView />
        <IncomingQrAlarmModal />
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] max-h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Top Tablet Header with Language Switcher, Active Shift, Held Counter */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenPinModal={() => setIsPinModalOpen(true)}
      />

      {/* Main Tab Screen */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'pos' && (
          <PosSellingScreen
            onOpenPaymentModal={handleOpenPaymentFromCart}
            onOpenHoldOrderModal={() => setIsHoldModalOpen(true)}
          />
        )}

        {currentTab === 'held' && (
          <HeldOrdersTab onSettleOrder={handleSettleHeldOrder} />
        )}

        {currentTab === 'sales' && <SalesAndRefundsView initialTab="sales" />}

        {currentTab === 'refunds' && <SalesAndRefundsView initialTab="refunds" />}

        {currentTab === 'admin' && <AdminPanel />}
      </main>

      {/* Global Modals */}
      {/* 1. Flashing Continuous 15s Alarm Modal for Incoming QR Orders */}
      <IncomingQrAlarmModal />

      {/* 2. Mandatory Day Start / Open Shift Modal */}
      <DayStartModal />

      {/* 3. Day Close (Z-Report) Modal with WhatsApp / Push notifications */}
      <DayCloseModal />

      {/* 4. Payment Settlement Modal (Cash Tender, Mada, Visa, Online, Due) */}
      <PaymentModal
        orderToPay={activePayingOrder}
        onClose={() => setActivePayingOrder(null)}
      />

      {/* 5. 80mm Thermal Receipt Preview & Print Slip */}
      <ThermalReceiptModal />

      {/* 6. Hold Order Form Modal */}
      <HoldOrderModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
      />

      {/* 7. PIN Login / Switch Cashier NumPad Modal */}
      <PinLoginModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* 8. Management 2-Step WhatsApp Security Lock Modal */}
      <ManagementLockModal
        isOpen={isManagementLockModalOpen}
        onClose={closeManagementLockModal}
        onSuccess={() => setCurrentTab('admin')}
      />

      {/* 9. Live Shift / Today's Sales Summary Modal (Accessible to Cashier & Admin) */}
      <LiveSalesSummaryModal
        isOpen={isLiveSalesModalOpen}
        onClose={closeLiveSalesModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <PosProvider>
      <MainApp />
    </PosProvider>
  );
}
