import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/api';
import { 
    Plus, ArrowRight, Clock, CheckCircle2, XCircle, 
    ShoppingBag, Briefcase, BookOpen, GraduationCap, Loader2 
} from 'lucide-react';
import { formatRupiah, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export const FinancingMenu = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- 1. FETCH HISTORY (RIWAYAT) ---
    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            // Memanggil endpoint riwayat khusus pembiayaan katalog/usaha
            const response = await API.get('/financing/history');
            setHistory(response.data || []);
        } catch (error) {
            console.error("Gagal memuat riwayat pembiayaan");
            toast.error("Gagal memuat data pinjaman"); // Menangani notifikasi error
            setHistory([]); 
        } finally {
            // Menghentikan animasi "SINKRONISASI DATA"
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Helper untuk Icon berdasarkan tipe pengajuan
    const getIcon = (type: string) => {
        switch (type) {
            case 'Kredit Barang': return <ShoppingBag className="text-emerald-600" size={20} />;
            case 'Modal Usaha': return <Briefcase className="text-blue-600" size={20} />;
            case 'Biaya Pelatihan': return <BookOpen className="text-amber-600" size={20} />;
            case 'Biaya Pendidikan': return <GraduationCap className="text-rose-600" size={20} />;
            default: return <Clock size={20} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
            {/* HERO SECTION - Banner Hijau Khas KKJ */}
            <div className="p-4 lg:p-8">
                <div className="relative bg-[#136f42] rounded-[2.5rem] p-10 md:p-14 overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                                <Plus size={16} className="text-[#aeea00]" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Financing Service</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-[1000] text-white tracking-tighter uppercase leading-none">
                                PEMBIAYAAN
                            </h1>
                            <p className="text-green-100/70 text-sm font-medium max-w-md leading-relaxed">
                                Solusi dana amanah untuk mendukung kebutuhan modal usaha, pendidikan, dan kesehatan Anda.
                            </p>
                        </div>

                        <button 
                            onClick={() => navigate('/pembiayaan/ajukan')}
                            className="group bg-[#aeea00] hover:bg-white text-[#0f5c35] px-8 py-5 rounded-[2rem] font-[1000] text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl shadow-green-900/40 active:scale-95"
                        >
                            <Plus size={18} strokeWidth={3} /> Ajukan Sekarang
                        </button>
                    </div>
                </div>
            </div>

            {/* SEKSI RIWAYAT PENGAJUAN */}
            <div className="max-w-5xl mx-auto px-6 space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-xs font-[1000] text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">Riwayat Pengajuan</h2>
                    <div className="h-px bg-slate-200 w-full"></div>
                </div>

                {isLoading ? (
                    /* ANIMASI LOADING SAAT SINKRONISASI */
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <Loader2 className="animate-spin text-[#136f42]" size={48} strokeWidth={3} />
                            <div className="absolute inset-0 blur-xl bg-green-400/20 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sinkronisasi Data...</span>
                    </div>
                ) : history.length === 0 ? (
                    /* TAMPILAN KOSONG */
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Clock size={32} />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Belum Ada Pengajuan</h3>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Pengajuan yang Anda buat akan muncul di sini.</p>
                    </div>
                ) : (
                    /* DAFTAR ITEM RIWAYAT */
                    <div className="grid grid-cols-1 gap-4">
                        {history.map((item) => (
                            <Link 
                                to={`/pembiayaan/${item.id}`} 
                                key={item.id}
                                className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-[#136f42]/30 hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500 flex items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-green-50">
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                        <h4 className="font-[1000] text-slate-800 text-lg tracking-tight uppercase group-hover:text-[#136f42] transition-colors">
                                            {item.amount ? formatRupiah(item.amount) : 'Menunggu Rincian'}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            item.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            item.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                            "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {item.status === 'approved' && <CheckCircle2 size={10} />}
                                            {item.status === 'rejected' && <XCircle size={10} />}
                                            {item.status === 'pending' && <Clock size={10} />}
                                            {item.status}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#136f42] group-hover:text-white transition-all">
                                        <ArrowRight size={18} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};