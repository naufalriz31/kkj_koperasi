import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import {
  ArrowLeft, Upload, Loader2, Clock, CheckCircle,
  Coins, Scale, Camera, AlertCircle, ShoppingBag,
  History, ShieldCheck, Info, CalendarDays, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const Pegadaian = () => {
  const navigate = useNavigate();
  const { user, checkSession, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  
  const [formData, setFormData] = useState({ 
    itemName: '', 
    weight: '', 
    karat: '24', 
    condition: 'Baik', 
    tenor: '4', 
    loanAmount: '' 
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [itemToRedeem, setItemToRedeem] = useState<any>(null);
  const [showRedeemDetails, setShowRedeemDetails] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) await checkSession();
      if (activeTab === 'history') fetchHistory();
    };
    init();
  }, [user, activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await API.get('/pawn/history');
      setHistory(response.data || []);
    } catch (err) {
      console.error("Gagal memuat riwayat:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'loanAmount') {
        const raw = value.replace(/\D/g, '');
        setFormData({ ...formData, [name]: raw ? parseInt(raw).toLocaleString('id-ID') : '' });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return toast.error("Ukuran foto maksimal 5MB");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Wajib upload foto barang");
    
    const cleanLoan = formData.loanAmount.replace(/\./g, '');
    if (!cleanLoan || parseInt(cleanLoan) < 100000) return toast.error("Minimal pinjaman Rp 100.000");

    setIsSubmitting(true);
    const toastId = toast.loading("Mengunggah pengajuan...");

    try {
      const formPayload = new FormData();
      formPayload.append('image', imageFile);
      formPayload.append('item_name', formData.itemName);
      formPayload.append('item_weight', formData.weight); 
      formPayload.append('item_karat', formData.karat);
      formPayload.append('item_condition', formData.condition);
      formPayload.append('tenor_bulan', formData.tenor);
      formPayload.append('loan_amount', cleanLoan);

      await API.post('/pawn/apply', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Pengajuan berhasil dikirim!", { id: toastId });
      setFormData({ itemName: '', weight: '', karat: '24', condition: 'Baik', tenor: '4', loanAmount: '' });
      setImageFile(null);
      setImagePreview(null);
      setActiveTab('history');
      fetchHistory();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Terjadi kesalahan server";
      toast.error("Gagal: " + msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRedeem = (item: any) => {
    setItemToRedeem(item);
    setShowRedeemDetails(true);
  };

  const proceedToPin = () => {
    // FIX PERHITUNGAN: Gunakan Math.round untuk menghilangkan desimal ,01
    const loanVal = Number(itemToRedeem?.loan_amount || 0);
    const feeVal = Math.round(loanVal * 0.05); 
    const totalVal = loanVal + feeVal;

    if ((user?.tapro_balance || 0) < totalVal) {
      return toast.error("Saldo Tapro tidak cukup.");
    }
    setShowRedeemDetails(false);
    setShowPinModal(true);
  };

  const executeRedeem = async () => {
    if (!itemToRedeem) return;
    const toastId = toast.loading("Memproses penebusan...");
    try {
      const res = await API.post(`/pawn/redeem/${itemToRedeem.id}`);
      if (res.data.user) updateUser(res.data.user);
      toast.success("Barang berhasil ditebus!", { id: toastId });
      fetchHistory();
      setItemToRedeem(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal menebus barang";
      toast.error(msg, { id: toastId });
    } finally {
        setShowPinModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-black text-gray-900 leading-none uppercase tracking-tighter">Gadai Syariah</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="bg-[#136f42] rounded-[2.5rem] p-8 lg:p-12 text-white shadow-xl relative overflow-hidden flex items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-[#aeea00]" size={20} />
              <span className="font-black tracking-[0.3em] text-[#aeea00] text-[10px] uppercase">Amanah & Profesional</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-[1000] mb-3 leading-tight tracking-tighter uppercase text-white">Taksiran Tinggi, <br /> Dana Cepat Cair</h2>
            <p className="text-green-50/70 text-sm font-medium leading-relaxed">Gadaikan emas Anda dengan biaya titip yang transparan. Dana langsung masuk ke saldo Tapro setelah disetujui admin.</p>
          </div>
          <Coins size={180} className="hidden lg:block absolute -right-10 -bottom-10 opacity-10 rotate-12" />
        </div>

        <div className="flex p-2 bg-green-900/5 rounded-[1.5rem] w-full max-w-sm mx-auto border border-green-100 shadow-sm">
          <button onClick={() => setActiveTab('apply')} className={cn("flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'apply' ? "bg-white text-[#136f42] shadow-sm border border-green-50" : "text-gray-400")}>
            <Upload size={16} /> Pengajuan
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'history' ? "bg-white text-[#136f42] shadow-sm border border-green-50" : "text-gray-400")}>
            <History size={16} /> Riwayat
          </button>
        </div>

        {activeTab === 'apply' ? (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Camera size={14} className="text-[#136f42]" /> Foto Barang Jaminan
                </label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={cn("border-2 border-dashed rounded-3xl p-8 text-center transition-all min-h-[220px] flex flex-col items-center justify-center bg-slate-50 group-hover:bg-green-50/50", imagePreview ? "border-[#136f42]" : "border-slate-200")}>
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-48 w-full object-contain rounded-2xl shadow-xl" />
                    ) : (
                        <div className="text-slate-400">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                <Camera size={32} className="text-[#136f42]" />
                            </div>
                            <p className="text-sm font-black text-slate-600 uppercase tracking-tight">Ambil Foto Perhiasan</p>
                            <p className="text-[10px] mt-1 font-bold text-slate-400">Gunakan pencahayaan yang terang</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perhiasan / Logam Mulia</label>
                    <input required name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Cth: Gelang Emas 24K" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-black transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Berat (Gram)</label>
                      <input required type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.00" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-50 outline-none text-sm font-black" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kadar (Karat)</label>
                      <select name="karat" value={formData.karat} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-black cursor-pointer">
                        <option value="24">24K</option>
                        <option value="22">22K</option>
                        <option value="18">18K</option>
                      </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-rose-500">Nominal Pinjaman (Rp)</label>
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                        <input required name="loanAmount" value={formData.loanAmount} onChange={handleChange} placeholder="Min 100.000" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-50 focus:border-rose-400 outline-none text-sm font-black transition-all" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenor Gadai</label>
                    <select name="tenor" value={formData.tenor} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-black">
                        <option value="4">4 Bulan (Maksimal)</option>
                        <option value="3">3 Bulan</option>
                        <option value="2">2 Bulan</option>
                        <option value="1">1 Bulan</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi & Kelengkapan Barang</label>
                  <input required name="condition" value={formData.condition} onChange={handleChange} placeholder="Cth: Kondisi mulus, ada surat toko" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-50 outline-none text-sm font-bold" />
              </div>
              
              <div className="bg-amber-50 p-6 rounded-3xl flex gap-4 border border-amber-100 shadow-sm">
                <AlertCircle size={24} className="text-amber-600 shrink-0 mt-1" />
                <p className="text-[11px] text-amber-900 leading-relaxed font-bold uppercase">
                    Admin akan menaksir nilai barang. Jika disetujui, dana dicairkan ke <span className="text-[#136f42]">Saldo Tapro</span> dikurangi biaya admin awal.
                </p>
              </div>

              <button disabled={isSubmitting} className="w-full bg-[#136f42] text-white py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-900/20 active:scale-95 transition-all hover:bg-[#0f5c35] disabled:opacity-50 flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>KIRIM PENGAJUAN <CheckCircle size={18} /></>}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {loadingHistory ? (
                <div className="text-center py-32"><Loader2 className="animate-spin mx-auto text-[#136f42]" size={40} /></div>
            ) : history.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <Scale size={60} className="mx-auto text-slate-100 mb-6" />
                    <h3 className="font-black text-slate-300 uppercase tracking-[0.4em] text-xs">Belum ada riwayat</h3>
                </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-6 hover:shadow-xl transition-all group">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                    <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.item_name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-slate-900 text-base tracking-tight uppercase truncate pr-2">{item.item_name}</h4>
                      <div className={cn(
                          "px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          item.status === 'approved' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                          item.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                          "bg-slate-50 text-slate-400 border-slate-100"
                      )}>
                          {item.status}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{item.weight}gr • {item.karat}K • {item.tenor_months} Bln</p>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                      <div>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Pinjaman Cair</p>
                          <p className="font-black text-[#136f42] text-base tracking-tighter">{formatRupiah(item.loan_amount)}</p>
                      </div>
                      {item.status === 'approved' && (
                        <button onClick={() => handleOpenRedeem(item)} className="bg-[#136f42] hover:bg-[#0f5c35] text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-900/10 transition-all active:scale-90 flex items-center gap-2">
                            <ShoppingBag size={14} /> TEBUS
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL REDEEM */}
      {showRedeemDetails && itemToRedeem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter">Rincian Pelunasan</h3>
              <button onClick={() => setShowRedeemDetails(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-inner">
                <img src={itemToRedeem.image_url} className="w-20 h-20 rounded-2xl object-cover bg-white shadow-sm border border-slate-100" alt="" />
                <div>
                  <h4 className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tight">{itemToRedeem.item_name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{itemToRedeem.weight}gr • {itemToRedeem.karat}K</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <span>Pokok Gadai</span>
                    <span className="text-slate-900">{formatRupiah(Number(itemToRedeem.loan_amount))}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <span>Biaya Titip (5%)</span>
                    {/* FIX: Math.round agar tidak muncul desimal ,01 */}
                    <span className="text-rose-500">{formatRupiah(Math.round(Number(itemToRedeem.loan_amount) * 0.05))}</span>
                </div>
                <div className="border-t-2 border-dashed border-slate-100 my-4"></div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-[1000] text-slate-900 uppercase tracking-widest">Total Bayar</span>
                    <span className="font-black text-[#136f42] text-3xl tracking-tighter">
                        {/* FIX: Math.round total untuk koreksi presisi floating point */}
                        {formatRupiah(
                            Math.round(Number(itemToRedeem.loan_amount)) + 
                            Math.round(Number(itemToRedeem.loan_amount) * 0.05)
                        )}
                    </span>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-[1.5rem] flex gap-4 border border-blue-100 shadow-inner">
                <Info size={24} className="text-blue-600 shrink-0" />
                <p className="text-[10px] text-blue-800 leading-relaxed font-bold uppercase">
                    Pembayaran akan dipotong dari <span className="text-blue-600">Saldo Tapro</span> Anda. Pastikan saldo mencukupi.
                </p>
              </div>

              <button onClick={proceedToPin} className="w-full bg-[#136f42] text-white py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-green-900/20 active:scale-95 transition-all hover:bg-[#0f5c35]">
                KONFIRMASI & PELUNASAN
              </button>
            </div>
          </div>
        </div>
      )}

      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        onSuccess={executeRedeem} 
        title="KONFIRMASI GADAI" 
      />
    </div>
  );
};