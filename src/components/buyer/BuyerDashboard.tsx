"use client";

import { useState, FormEvent, useMemo } from "react";
import { 
  Store as StoreIcon, 
  Landmark, 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Receipt, 
  ShoppingCart,
  Plus,
  Minus,
  Search,
  ArrowRight,
  X
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { StatusBadge, getEffectiveInvoiceStatus } from "@/components/shared/StatusBadge";
import { formatIDR, formatDate } from "@/utils/formatters";

// --- DUMMY DATA PRODUK ---
const PRODUCTS = [
  { id: "P01", name: "Semen Portland 50kg", price: 65000, category: "Material", image: "/images/semen.jpg" },
  { id: "P02", name: "Besi Beton 10mm (Ulir)", price: 75000, category: "Baja", image: "/images/besi-beton.jpg" },
  { id: "P03", name: "Cat Tembok Putih 25kg", price: 1250000, category: "Finishing", image: "/images/cat-tembok.jpg" },
  { id: "P04", name: "Keramik Lantai 60x60", price: 150000, category: "Lantai", image: "/images/keramik.jpg" },
  { id: "P05", name: "Paku Payung Baja 1kg", price: 25000, category: "Material", image: "/images/paku.jpg" },
  { id: "P06", name: "Pipa PVC 4 inch tebal", price: 95000, category: "Plumbing", image: "/images/pipa-pvc.jpg" },
  { id: "P07", name: "Kabel Listrik NYM 50m", price: 450000, category: "Elektrikal", image: "/images/kabel.jpg" },
  { id: "P08", name: "Batu Bata Merah (1000 pcs)", price: 800000, category: "Material", image: "/images/bata-merah.jpg" },
  { id: "P09", name: "Pasir Beton (1 Pick-up)", price: 350000, category: "Material", image: "/images/pasir.jpg" },
  { id: "P10", name: "Lampu LED Philips 18W", price: 45000, category: "Elektrikal", image: "/images/lampu-led.jpg" },
  { id: "P11", name: "Pompa Air Shimizu", price: 600000, category: "Plumbing", image: "/images/pompa-air.jpg" },
  { id: "P12", name: "Engsel Pintu Set Stainless", price: 35000, category: "Aksesoris", image: "/images/engsel.jpg" },
];

export function BuyerDashboard({ storeId }: { storeId: string }) {
  const { state, invoicesForStore, activeStore, recordPayment, addInvoice, storeCredits } = useAppState();
  
  // STATE NAVIGASI
  const [activeTab, setActiveTab] = useState<"STORE" | "BANK" | "DASHBOARD">("STORE");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // STATE TOKO (CART)
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false); // State untuk Drawer Keranjang

  // STATE BANK (TRANSFER)
  const [transferAmount, setTransferAmount] = useState("");
  const [inputVa, setInputVa] = useState("");
  const [bankError, setBankError] = useState("");

  // STATE DASHBOARD
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // --- LOGIKA DATA DASHBOARD ---
  const invoices = useMemo(() => {
    return invoicesForStore(storeId).slice().sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [invoicesForStore, storeId]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "ALL") return invoices;
    return invoices.filter((inv) => {
      const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
      return effStatus === statusFilter;
    });
  }, [invoices, statusFilter, state.systemTime]);

  const totalAmountAll = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalPaidAll = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalUnpaidAll = invoices.reduce((acc, inv) => {
    const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
    if (effStatus !== "PAID" && effStatus !== "OVERDUE") {
      return acc + (inv.amount - inv.amountPaid);
    }
    return acc;
  }, 0);
  const currentStoreCredit = storeCredits[storeId] || 0;
  const storeVaNumber = `BCA-88001-${storeId.replace('ST-', '')}`;

  // --- LOGIKA TOKO (CART) ---
  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotalPrice = PRODUCTS.reduce((acc, p) => acc + (p.price * (cart[p.id] || 0)), 0);

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[productId] || 0) + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = (productId: string) => {
    updateCart(productId, 1);
    showToast("Produk ditambahkan ke keranjang");
  };

  const handleCheckout = () => {
    if (cartTotalItems === 0) return;

    const sysTime = new Date(state.systemTime || Date.now());
    sysTime.setDate(sysTime.getDate() + 2); // Tempo 2 hari
    const dueDate = sysTime.toISOString().split("T")[0];

    const itemName = `Pesanan E-Commerce (${cartTotalItems} Item)`;

    addInvoice({
      storeId,
      itemName,
      amount: cartTotalPrice,
      dueDate,
    });

    setCart({});
    setIsCartOpen(false); // Tutup drawer
    showToast(`Pesanan berhasil dibuat! Tagihan Rp ${formatIDR(cartTotalPrice)} telah ditambahkan.`);
    setActiveTab("DASHBOARD"); 
  };

  // --- LOGIKA M-BANKING ---
  const handleBankTransfer = (e: FormEvent) => {
    e.preventDefault();
    setBankError("");

    if (inputVa !== storeVaNumber) {
      setBankError("Nomor Virtual Account tidak dikenali / salah.");
      return;
    }

    const parsedAmount = Number(transferAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setBankError("Masukkan nominal transfer yang valid.");
      return;
    }

    const payment = recordPayment({ storeId, amount: parsedAmount });
    
    let msg = `Transfer Rp ${formatIDR(parsedAmount)} berhasil!`;
    if (payment.allocation.creditApplied > 0) {
      msg += ` Sisa Rp ${formatIDR(payment.allocation.creditApplied)} masuk ke Store Credit.`;
    }

    setTransferAmount("");
    setInputVa("");
    showToast(msg);
    setActiveTab("DASHBOARD"); 
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ================= RENDER TABS =================

  const renderStoreTab = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Katalog B2B & Grosir</h2>
          <p className="text-sm text-slate-500">Pilih barang, beli, dan bayar dengan tempo 2 hari ke depan.</p>
        </div>
        
        {/* Tombol Buka Keranjang (Sticky / Floating effect) */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="relative">
            <ShoppingCart size={22} className="text-slate-600 group-hover:text-teal-600 transition-colors" />
            {cartTotalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartTotalItems}
              </span>
            )}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Keranjang</p>
            <p className="text-sm font-bold font-mono text-slate-800">{formatIDR(cartTotalPrice)}</p>
          </div>
        </button>
      </div>

      {/* Grid Produk */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {PRODUCTS.map(product => {
          return (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:border-teal-300 transition-all group">
              {/* Tempat Gambar */}
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={(e) => { 
                    // Fallback jika gambar tidak ditemukan di folder public
                    e.currentTarget.src = `https://placehold.co/400x400/e2e8f0/94a3b8?text=${encodeURIComponent(product.name)}` 
                  }} 
                />
                <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-600 text-[9px] font-bold uppercase rounded-md shadow-sm">
                  {product.category}
                </span>
              </div>
              
              {/* Detail & Tombol */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{product.name}</h3>
                  <p className="text-teal-700 font-mono font-bold text-sm mt-1">{formatIDR(product.price)}</p>
                </div>
                <button 
                  onClick={() => handleAddToCart(product.id)}
                  className="w-full py-2 bg-white border border-teal-600 text-teal-700 text-xs font-bold rounded-xl hover:bg-teal-50 transition-colors"
                >
                  + Keranjang
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* DRAWER KERANJANG (Tokopedia Style) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay Gelap */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" 
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Panel Keranjang */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header Keranjang */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Keranjang Belanja 
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{cartTotalItems}</span>
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Isi Keranjang */}
            <div className="flex-1 overflow-y-auto p-5">
              {cartTotalItems === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <ShoppingCart size={48} className="text-slate-200" />
                  <p className="text-sm font-medium">Keranjangmu masih kosong</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const product = PRODUCTS.find(p => p.id === id)!;
                    return (
                      <div key={id} className="flex gap-4 pb-4 border-b border-slate-50 last:border-0">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200"
                          onError={(e) => { e.currentTarget.src = `https://placehold.co/100x100/e2e8f0/94a3b8?text=Img` }}
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">{product.name}</h4>
                          <p className="text-teal-700 font-mono font-bold text-xs mt-1">{formatIDR(product.price)}</p>
                          
                          <div className="flex items-center justify-end mt-2">
                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                              <button onClick={() => updateCart(id, -1)} className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md">
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{qty}</span>
                              <button onClick={() => updateCart(id, 1)} className="p-1 hover:bg-teal-50 text-slate-500 hover:text-teal-600 rounded-md">
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Checkout */}
            <div className="p-5 border-t border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase">Total Harga</span>
                <span className="text-lg font-bold font-mono text-slate-900">{formatIDR(cartTotalPrice)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cartTotalItems === 0}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                  cartTotalItems > 0 
                    ? "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/30" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                Beli ({cartTotalItems})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBankTab = () => (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center py-10">
      <div className="w-full max-w-sm rounded-[2rem] bg-gradient-to-b from-blue-900 to-blue-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/20">
            <Landmark className="text-blue-200" size={24} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">Mobile Banking</h2>
          <p className="text-blue-200/70 text-xs mt-1">Simulasi transfer pihak ketiga</p>
        </div>

        <form onSubmit={handleBankTransfer} className="relative z-10 space-y-4">
          <div className="bg-white p-5 rounded-2xl space-y-4 shadow-inner">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                Nomor Virtual Account
              </label>
              <input
                type="text"
                value={inputVa}
                onChange={(e) => setInputVa(e.target.value)}
                placeholder="Contoh: BCA-88001-001"
                className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-sm font-mono font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
              />
              <button 
                type="button" 
                onClick={() => setInputVa(storeVaNumber)}
                className="text-[10px] text-blue-600 font-semibold mt-1 hover:underline"
              >
                *Auto-fill VA Toko Saya
              </button>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                Nominal Transfer (Rp)
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0"
                className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-xl font-mono font-bold text-blue-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {bankError && (
              <p className="text-xs font-semibold text-rose-500 bg-rose-50 p-2 rounded-lg text-center">
                {bankError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:from-blue-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2"
          >
            TRANSFER SEKARANG <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );

  const renderDashboardTab = () => (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Dashboard: {activeStore.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 px-3 py-1 text-xs font-mono font-medium text-teal-300">
              <CreditCard size={13} />
              VA: {storeVaNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sistem Virtual Account Permanent Open-Amount & Auto-Clearing Otomatis
          </p>
        </div>
      </div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] xl:text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Total Seluruh Tagihan</p>
            <p className="text-sm xl:text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(totalAmountAll)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 flex-shrink-0"><Wallet size={18} /></div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] xl:text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Sudah Terbayar</p>
            <p className="text-sm xl:text-base font-bold font-mono text-emerald-600 mt-1">{formatIDR(totalPaidAll)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 flex-shrink-0"><ShieldCheck size={18} /></div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] xl:text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Belum Terbayar</p>
            <p className="text-sm xl:text-base font-bold font-mono text-rose-600 mt-1">{formatIDR(totalUnpaidAll)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 flex-shrink-0"><Receipt size={18} /></div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] xl:text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Store Credit Aktif</p>
            <p className="text-sm xl:text-base font-bold font-mono text-teal-700 mt-1">{formatIDR(currentStoreCredit)}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700 flex-shrink-0"><CreditCard size={18} /></div>
        </div>

      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Daftar Tagihan Berjalan</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            <option value="ALL">Semua Status</option>
            <option value="UNPAID">Belum Dibayar (Unpaid)</option>
            <option value="PARTIAL">Sebagian (Partial)</option>
            <option value="PAID">Lunas (Paid)</option>
            <option value="OVERDUE">Terlambat (Overdue)</option>
          </select>
        </div>

        {invoices.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3"><Search size={24} /></div>
            <p className="text-sm font-semibold text-slate-700">Tidak ada tagihan</p>
            <p className="text-xs text-slate-400 mt-1">Belum ada pesanan aktif. Silakan belanja di tab Toko.</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">Tidak ada tagihan yang sesuai dengan filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Nama Item / Invoice</th>
                  <th className="px-6 py-4">Nominal Total</th>
                  <th className="px-6 py-4">Progres Terbayar</th>
                  <th className="px-6 py-4">Jatuh Tempo</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const effectiveStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{inv.itemName}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">{formatIDR(inv.amount)}</td>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-teal-700">{formatIDR(inv.amountPaid)} / {formatIDR(inv.amount)}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4"><StatusBadge status={effectiveStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    // PERBAIKAN: w-full agar tidak gepeng, dan flex-1 untuk area konten
<div className="flex flex-col md:flex-row h-[calc(100vh-100px)] w-full max-w-[1600px] mx-auto bg-slate-50/50 rounded-3xl border border-slate-200/60 overflow-hidden relative">      
      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[200] flex items-center gap-3 rounded-full bg-slate-900 px-5 py-3 text-white shadow-2xl animate-in slide-in-from-top-5 fade-in duration-300">
          <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
<div className="w-full md:w-56 flex-shrink-0 bg-white border-r border-slate-200/60 p-5 flex flex-col gap-6">        <div className="px-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Navigasi User</h2>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("STORE")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "STORE" ? "bg-teal-50 text-teal-700 shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <StoreIcon size={18} className={activeTab === "STORE" ? "text-teal-600" : "text-slate-400"} />
              E-Commerce / Toko
            </button>
            <button
              onClick={() => setActiveTab("BANK")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "BANK" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Landmark size={18} className={activeTab === "BANK" ? "text-blue-600" : "text-slate-400"} />
              M-Banking (Simulasi)
            </button>
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "DASHBOARD" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard size={18} className={activeTab === "DASHBOARD" ? "text-slate-300" : "text-slate-400"} />
              Dashboard Tagihan
            </button>
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {/* PERBAIKAN: flex-1 dan min-w-0 agar area kanan bisa merenggang sempurna dan tidak tumpah */}
      <div className="flex-1 min-w-0 p-6 md:p-8 bg-slate-50/50 overflow-y-auto">
        {activeTab === "STORE" && renderStoreTab()}
        {activeTab === "BANK" && renderBankTab()}
        {activeTab === "DASHBOARD" && renderDashboardTab()}
      </div>
    </div>
  );
}