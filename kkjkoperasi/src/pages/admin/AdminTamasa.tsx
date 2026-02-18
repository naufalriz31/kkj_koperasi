import React, { useEffect, useState } from "react";
import API from "../../api/api"; 
import { useNavigate } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Clock, Coins, 
    FileText, Calendar, Loader2, Archive, CheckCircle, Save, TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";
import { Link } from "react-router-dom";

export const AdminTamasa = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // --- STATE HARGA EMAS ---
    const [currentGoldPrice, setCurrentGoldPrice] = useState(0);
    const [newPriceInput, setNewPriceInput] = useState('');
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Panggil API Laravel: GET /admin/tamasa
            const response = await API.get('/admin/tamasa', {
                params: { status: activeTab }
            });
            
            setCurrentGoldPrice(response.data.current_price || 0);
            setTransactions(response.data.transactions || []);
        } catch (err: any) {
            console.error(err);
            toast.error("Gagal memuat data TAMASA");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setNewPriceInput(rawValue ? parseInt(rawValue).toLocaleString('id-ID') : '');
    };

    const handleUpdateGoldPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseInt(newPriceInput.replace(/\./g, ''));
        
        if (!priceNum || priceNum < 100000) return toast.error("Harga tidak valid!");

        setIsUpdatingPrice(true);
        const toastId = toast.loading("Mengupdate harga...");

        try {
            await API.post('/admin/tamasa/price', { buy_price: priceNum });
            toast.success("Harga Emas Berhasil Diperbarui!", { id: toastId });
            setCurrentGoldPrice(priceNum);
            setNewPriceInput('');
        } catch (err: any) {
            toast.error("Gagal update harga", { id: toastId });
        } finally {
            setIsUpdatingPrice(false);
        }
    };

    const handleApprove = async (tx: any) => {
        const confirm = window.confirm(`Setujui pembelian emas ${tx.estimasi_gram.toFixed(4)} gram?`);
        if (!confirm) return;
        const toastId = toast.loading("Memproses...");

        try {
            await API.post(`/admin/tamasa/transactions/${tx.id}/approve`);
            toast.success("Pembelian emas disetujui!", { id: toastId });
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal menyetujui";
            toast.error(msg, { id: toastId });
        }
    };

    const handleReject = async (tx: any) => {
        const reason = window.prompt("Alasan penolakan (dana akan dikembalikan ke saldo user):");
        if (reason === null) return;

        const toastId = toast.loading("Menolak...");
        try {
            await API.post(`/admin/tamasa/transactions/${tx.id}/reject`, { reason });
            toast.success("Ditolak & Dana Dikembalikan", { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error("Gagal menolak transaksi", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#F8FAFC] font-sans">
            
            {/* HEADER */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-[#136f42] mb-4 w-fit transition-colors text-xs font-black uppercase tracking-widest">
                    <ArrowLeft size={16} strokeWidth={3} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Manajemen TAMASA</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kontrol harga emas & verifikasi setoran anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                    </button>
                </div>
            </div>

            {/* --- PANEL KONTROL HARGA --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-[#136f42] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-green-900/20 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                        <Coins size={250} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-green-200 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Harga Emas Hari Ini</p>
                        <h2 className="text-5xl font-[1000] tracking-tighter">{formatRupiah(currentGoldPrice)}<span className="text-sm font-bold text-green-300 ml-2 uppercase">/gram</span></h2>
                        <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                            <Clock size={12} className="text-[#aeea00]" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Update: {format(new Date(), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                    <div className="hidden lg:block relative z-10">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center border border-white/20">
                            <TrendingUp size={40} className="text-[#aeea00]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Perbarui Harga Pasar</h3>
                    <form onSubmit={handleUpdateGoldPrice} className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">Rp</span>
                            <input 
                                type="text"
                                placeholder="Input harga baru..."
                                value={newPriceInput}
                                onChange={handlePriceInputChange}
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-800 focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all placeholder:text-slate-200"
                            />
                        </div>
                        <button 
                            disabled={isUpdatingPrice || !newPriceInput}
                            className="bg-[#136f42] text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0f5c35] transition-all shadow-xl shadow-green-900/10 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {isUpdatingPrice ? <Loader2 className="animate-spin" /> : <Save size={20} />} UPDATE
                        </button>
                    </form>
                </div>
            </div>

            {/* TAB MENU */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('pending')} className={cn("pb-4 px-6 text-[11px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2", activeTab === 'pending' ? "text-[#136f42]" : "text-slate-400 hover:text-slate-600")}>
                    <Clock size={16} /> Menunggu Konfirmasi
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#136f42] rounded-t-full"></div>}
                </button>
                <button onClick={() => setActiveTab('history')} className={cn("pb-4 px-6 text-[11px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2", activeTab === 'history' ? "text-[#136f42]" : "text-slate-400 hover:text-slate-600")}>
                    <Archive size={16} /> Riwayat Transaksi
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#136f42] rounded-t-full"></div>}
                </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-[#136f42]" size={40} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                            {activeTab === 'pending' ? <Clock size={40} /> : <CheckCircle size={40} />}
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak ada data di tab {activeTab}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 hover:shadow-2xl hover:shadow-green-900/5 transition-all group">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-green-50 text-[#136f42] rounded-2xl flex items-center justify-center border border-green-100 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                                                <Coins size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-[1000] text-slate-900 tracking-tighter leading-none mb-2 uppercase">{tx.user_name}</h3>
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">{tx.user_member_id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-2 border shadow-sm",
                                                tx.status === 'success' || tx.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                tx.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            )}>
                                                {tx.status}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-end gap-2">
                                                <Calendar size={12} className="text-slate-300" /> {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group-hover:bg-green-50/50 transition-colors">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Setoran Tunai</p>
                                            <p className="text-3xl font-black text-[#136f42] tracking-tighter">{formatRupiah(tx.setoran)}</p>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group-hover:bg-amber-50/50 transition-colors">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Perolehan Emas</p>
                                            <p className="text-3xl font-black text-amber-600 tracking-tighter">
                                                {Number(tx.estimasi_gram).toFixed(4)} <span className="text-sm font-bold text-slate-300 ml-1 uppercase">gr</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {tx.approved_at && (
                                        <div className="flex items-center gap-3 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 w-fit px-5 py-2 rounded-full border border-emerald-100">
                                            <CheckCircle size={14} /> Selesai pada {format(new Date(tx.approved_at), 'dd MMM yyyy', { locale: indonesia })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center gap-4 md:border-l md:pl-10 border-slate-100 min-w-[240px]">
                                    {tx.status === 'pending' ? (
                                        <>
                                            <button onClick={() => handleApprove(tx)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                                                <Check size={20} strokeWidth={3} /> SETUJUI
                                            </button>
                                            <button onClick={() => handleReject(tx)} className="w-full py-5 bg-white text-rose-600 border border-rose-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                                                <X size={20} strokeWidth={3} /> TOLAK
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center opacity-50 grayscale">
                                            <FileText size={40} className="text-slate-300 mb-3" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Arsip Transaksi<br/>Permanen</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="text-center mt-12 opacity-20">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Internal Core Tamasa v3.0</p>
            </div>
        </div>
    );
};