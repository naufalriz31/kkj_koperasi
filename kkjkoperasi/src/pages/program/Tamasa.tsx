import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, Wallet, ChevronRight, Info, AlertCircle, Loader2, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const Tamasa = () => {
  const navigate = useNavigate();
  // Ambil user dan updateUser agar saldo Tapro langsung berkurang setelah beli
  const { user, checkSession, updateUser } = useAuthStore();

  const [monthlyAmount, setMonthlyAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [goldPrice, setGoldPrice] = useState(0); 
  const [userBalanceGram, setUserBalanceGram] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // --- 1. FETCH DATA EMAS DARI LARAVEL ---
  const fetchGoldData = useCallback(async () => {
    try {
        // [FIX]: Mengambil harga emas hari ini dan saldo emas user dari MySQL
        const response = await API.get('/gold/info');
        setGoldPrice(response.data.buy_price || 1300000);
        setUserBalanceGram(response.data.user_balance || 0);
    } catch (err) {
        console.error("Error fetching gold data:", err);
        setGoldPrice(1300000); // Harga standar jika API gagal
    } finally {
        setIsDataLoading(false);
    }
  }, []);

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    const initPage = async () => {
      setIsDataLoading(true);
      if (!user) await checkSession();
      await fetchGoldData();
      setIsAuthChecking(false);
    };
    initPage();
  }, [user, checkSession, fetchGoldData]);

  // --- LOGIC PERHITUNGAN ---
  const cleanAmount = monthlyAmount ? parseInt(monthlyAmount.replace(/\D/g, '')) : 0;
  const cleanDuration = duration ? parseInt(duration) : 1;
  const simulationTotal = cleanAmount * cleanDuration;
  const amountToPay = cleanAmount;
  const gramToGet = amountToPay > 0 && goldPrice > 0 ? amountToPay / goldPrice : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setMonthlyAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
  };

  const handleInitialSubmit = () => {
    if (goldPrice <= 0) return toast.error("Gagal memuat harga emas. Silakan refresh.");
    if (cleanAmount < 10000) return toast.error("Minimal pembelian Rp 10.000");
    if (amountToPay > (user?.tapro_balance || 0)) return toast.error("Saldo Tapro tidak mencukupi!");
    setShowPinModal(true);
  };

  // --- 3. EKSEKUSI PEMBELIAN KE BACKEND ---
  const executeTransaction = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Memproses pembelian emas...");

    try {
      // [FIX]: Payload disesuaikan agar menyertakan PIN untuk validasi backend
      const payload = {
        amount: amountToPay,
        gram: gramToGet,
        price_per_gram: goldPrice,
        pin: user?.pin // [PENTING] Kirim PIN agar transaksi sah
      };

      const response = await API.post('/gold/buy', payload);

      // Update saldo Tapro di layar secara real-time
      if (response.data.user) {
          updateUser(response.data.user);
      }

      toast.success("Pembelian Berhasil! Menunggu verifikasi admin.", { id: toastId });
      
      // Reset Form
      setMonthlyAmount('');
      setDuration('');
      setShowPinModal(false);

      // Refresh Data Emas terbaru
      fetchGoldData(); 

    } catch (err: any) {
      const msg = err.response?.data?.message || "Transaksi Gagal";
      toast.error(msg, { id: toastId });
      setShowPinModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#136f42] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Menyiapkan Tabungan Emas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">TAMASA (Tabungan Emas)</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* KOLOM KIRI: INFO SALDO EMAS */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 opacity-90">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Wallet size={20} /></div>
                  <span className="text-xs font-black tracking-[0.2em] uppercase">Total Saldo Emas</span>
                </div>

                {isDataLoading ? (
                  <div className="h-12 w-48 bg-white/30 rounded-xl animate-pulse mb-3"></div>
                ) : (
                  <h2 className="text-5xl lg:text-6xl font-[1000] mb-3 tracking-tighter">
                    {userBalanceGram.toFixed(4)} <span className="text-2xl font-medium opacity-80">gram</span>
                  </h2>
                )}

                <div className="inline-flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] text-yellow-100 uppercase font-black tracking-widest">Estimasi Nilai:</span>
                  <span className="text-lg font-black text-white">
                    {formatRupiah(userBalanceGram * goldPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h4 className="font-black text-[#136f42] mb-4 flex items-center gap-2 text-xs uppercase tracking-widest"><Info size={16} /> Panduan Menabung</h4>
              <div className="space-y-4">
                {[
                  "Tentukan nominal saldo Tapro yang ingin dikonversi.",
                  "Masukkan target durasi untuk melihat simulasi hasil.",
                  "Konfirmasi dengan PIN Keamanan Anda."
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-lg bg-green-50 text-[#136f42] flex items-center justify-center font-bold text-xs shrink-0 border border-green-100">{i+1}</span>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: FORM PEMBELIAN */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden lg:sticky lg:top-28">
            <div className="bg-slate-50 px-8 py-6 border-b border-gray-100">
              <h2 className="font-black text-[#136f42] text-xl flex items-center gap-2 uppercase tracking-tighter">
                <TrendingUp size={24} /> Beli Emas Sekarang
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Metode: Potong Saldo Tapro</p>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nominal Beli</label>
                  <span className="text-[10px] text-[#136f42] font-black bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    TAPRO: {formatRupiah(user?.tapro_balance || 0)}
                  </span>
                </div>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300 text-2xl group-focus-within:text-[#136f42] transition-colors">Rp</span>
                  <input 
                    type="text" 
                    value={monthlyAmount} 
                    onChange={handleAmountChange} 
                    placeholder="Min 10.000" 
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl font-black text-3xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target (Bulan)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="12" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Harga/gr Hari Ini</label>
                  <div className="w-full px-5 py-4 bg-emerald-50/50 border border-emerald-100 rounded-xl font-black text-[#136f42] text-sm flex items-center h-[58px]">
                    {formatRupiah(goldPrice)}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Estimasi Emas Didapat</span>
                  <span className="font-black text-amber-700 bg-white px-4 py-1.5 rounded-xl border border-amber-200 shadow-sm text-lg">
                    {gramToGet.toFixed(4)} <span className="text-xs">gr</span>
                  </span>
                </div>
                
                {cleanDuration > 1 && cleanAmount > 0 && (
                  <div className="bg-white/60 p-4 rounded-2xl border border-amber-200 flex gap-3">
                    <Calculator size={16} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-900 leading-relaxed font-bold uppercase tracking-tight">
                      Simulasi: Menabung {formatRupiah(cleanAmount)}/bln selama {cleanDuration} bln = <span className="text-amber-600">± {formatRupiah(simulationTotal)}</span>
                    </p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleInitialSubmit} 
                disabled={isSubmitting || goldPrice === 0 || cleanAmount === 0} 
                className="w-full bg-[#136f42] text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-[#0f5c35] transition-all shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Beli Emas <ChevronRight size={20} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        // [PENTING]: Memanggil executeTransaction saat PIN divalidasi lokal sukses
        onSuccess={executeTransaction} 
        title="Konfirmasi Tabungan Emas" 
      />
    </div>
  );
};