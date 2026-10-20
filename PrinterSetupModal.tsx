import React, { useState } from 'react';
import {
  Printer,
  X,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Radio,
  Sliders,
  DollarSign,
  FileText,
  Sparkles,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { EscPosDriver } from '../utils/escpos';
import { DiscoveredPrinter } from '../types/pos';

export const PrinterSetupModal: React.FC = () => {
  const {
    language,
    isPrinterSetupModalOpen,
    closePrinterSetupModal,
    printerConfig,
    updatePrinterConfig,
    kickCashDrawer,
    setPrintableReceiptOrder,
    setReceiptMode,
    orders,
    categories,
    products,
  } = usePos();

  const isRtl = language === 'ar';

  const [ip, setIp] = useState(printerConfig.ip);
  const [port, setPort] = useState(printerConfig.port.toString());
  const [printerName, setPrinterName] = useState(printerConfig.printerName);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(printerConfig.paperWidth);
  const [autoDrawerKick, setAutoDrawerKick] = useState(printerConfig.autoDrawerKick);

  const [isScanning, setIsScanning] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isPrinterSetupModalOpen) return null;

  const handleScanNetwork = async () => {
    setIsScanning(true);
    setStatusMessage(null);
    try {
      const results = await EscPosDriver.discoverPrinters();
      setDiscoveredPrinters(results);
    } catch {
      setStatusMessage(language === 'ar' ? 'فشل البحث عن الطابعات' : 'Printer discovery failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDiscovered = (p: DiscoveredPrinter) => {
    setIp(p.ip);
    setPort(p.port.toString());
    setPrinterName(p.name);
    setStatusMessage(
      language === 'ar'
        ? `تم اختيار الطابعة (${p.name} - ${p.ip})`
        : `Selected printer ${p.name} (${p.ip})`
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrinterConfig({
      ip: ip.trim(),
      port: parseInt(port, 10) || 9100,
      printerName: printerName.trim(),
      paperWidth,
      autoDrawerKick,
      isConnected: true,
      lastConnected: new Date().toISOString(),
    });
    setStatusMessage(language === 'ar' ? 'تم حفظ إعدادات الطابعة بنجاح' : 'Printer settings saved successfully!');
    setTimeout(() => {
      closePrinterSetupModal();
    }, 800);
  };

  const handleTestDrawer = async () => {
    await kickCashDrawer();
    setStatusMessage(language === 'ar' ? 'تم إرسال إشارة فتح الدرج (ESC/POS Pulse)' : 'Cash drawer kick pulse sent!');
  };

  const handleTestPrintKitchen = () => {
    const sampleOrder = orders[0] || {
      id: 'TEST-001',
      dailyOrderNumber: 99,
      createdAt: new Date().toISOString(),
      sourceId: 'src_walkin',
      sourceNameEn: 'Walk-in Counter',
      sourceNameAr: 'كاونتر محلي',
      items: [
        { id: '1', product: products[0], quantity: 2, itemNotes: 'Extra hot, oat milk' },
        { id: '2', product: products[1] || products[0], quantity: 1 },
      ],
      subtotal: 35,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 15,
      taxAmount: 4.56,
      total: 35,
      status: 'completed',
      customerName: 'Test Kitchen Print',
      tableOrPlate: 'Table 4',
    };
    setReceiptMode('kitchen');
    setPrintableReceiptOrder(sampleOrder as any);
  };

  const handleTestPrintCustomer = () => {
    const sampleOrder = orders[0] || {
      id: 'TEST-001',
      dailyOrderNumber: 99,
      createdAt: new Date().toISOString(),
      sourceId: 'src_walkin',
      sourceNameEn: 'Walk-in Counter',
      sourceNameAr: 'كاونتر محلي',
      items: [
        { id: '1', product: products[0], quantity: 2, itemNotes: 'Extra hot, oat milk' },
        { id: '2', product: products[1] || products[0], quantity: 1 },
      ],
      subtotal: 35,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 15,
      taxAmount: 4.56,
      total: 35,
      status: 'completed',
      customerName: 'Test Customer Tax Memo',
      tableOrPlate: 'Table 4',
    };
    setReceiptMode('customer');
    setPrintableReceiptOrder(sampleOrder as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                {language === 'ar' ? 'إعداد الطابعة الحرارية (80mm)' : 'Thermal Receipt Printer Setup'}
              </h2>
              <span className="text-[11px] text-slate-500">
                {language === 'ar' ? 'إعدادات شبكة Wi-Fi، مقاس الورق، ودرج الكاش' : 'Wi-Fi LAN / IP Configuration, ESC/POS & Drawer Kick'}
              </span>
            </div>
          </div>

          <button
            onClick={closePrinterSetupModal}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Active Status Badge */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Wifi className="w-5 h-5 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div>
                <span className="font-black text-slate-900 block text-xs">
                  {printerConfig.printerName}
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  {printerConfig.ip}:{printerConfig.port} • {printerConfig.paperWidth}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleScanNetwork}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? (language === 'ar' ? 'جارِ البحث...' : 'Scanning...') : (language === 'ar' ? 'بحث عن الطابعات' : 'Discover LAN')}</span>
            </button>
          </div>

          {/* Discovered Printers list if scanned */}
          {discoveredPrinters.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'ar' ? 'الطابعات المكتشفة على الشبكة المحلية:' : 'Discovered Network Printers:'}
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {discoveredPrinters.map((p) => (
                  <div
                    key={p.ip}
                    onClick={() => handleSelectDiscovered(p)}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-500 cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{p.name} ({p.model})</span>
                      <span className="font-mono text-[11px] text-slate-500">{p.ip}:{p.port} • {p.latencyMs}ms</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-md bg-blue-50">
                      Select
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {language === 'ar' ? 'اسم الطابعة' : 'Printer Label / Model'}
              </label>
              <input
                type="text"
                required
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Epson TM-T88VI (Kitchen/Counter)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {language === 'ar' ? 'عنوان الآي بي (IP Address)' : 'Printer IP Address'}
                </label>
                <input
                  type="text"
                  required
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="192.168.1.185"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {language === 'ar' ? 'المنفذ (Port)' : 'RAW Port (Default: 9100)'}
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="9100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Paper Width Toggle */}
            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {language === 'ar' ? 'عرض الورق الحراري' : 'Thermal Paper Width'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm (Standard POS)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58mm (Compact Mobile)
                </button>
              </div>
            </div>

            {/* Auto Drawer Kick Toggle */}
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-blue-50/50">
              <input
                type="checkbox"
                checked={autoDrawerKick}
                onChange={(e) => setAutoDrawerKick(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">
                  {language === 'ar' ? 'فتح درج النقدية تلقائياً عند الدفع النقدي' : 'Auto Kick Cash Drawer on Cash Payment'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'إرسال نبضة ESC/POS المكونة من 5 بايتات' : 'Sends standard ESC/POS pulse (0x1B 0x70)'}
                </span>
              </div>
            </label>

            {/* Hardware Test Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'ar' ? 'اختبار الأجهزة والطباعة:' : 'Hardware Diagnostics & Test Print:'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleTestDrawer}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'فتح الدرج' : 'Kick Drawer'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestPrintKitchen}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs active:scale-95 transition-all border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{language === 'ar' ? 'تذكرة مطبخ' : 'Kitchen Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestPrintCustomer}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs active:scale-95 transition-all border border-slate-200"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'ar' ? 'فاتورة عميل' : 'Customer Memo'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closePrinterSetupModal}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20"
              >
                {language === 'ar' ? 'حفظ الإعدادات' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
