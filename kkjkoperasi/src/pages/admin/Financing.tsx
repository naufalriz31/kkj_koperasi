import React, { useEffect, useState } from 'react';
import API from '../../api/api'; 
import {
    Check, X, Loader2, RefreshCw, ArrowLeft, Search,
    ChevronRight, Calendar, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export const AdminFinancing = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'history'>('pending');

    // --- 1. FETCH DATA PEMBIAYAAN ---
    const fetchLoans = async () => {
        setLoading(true);
        try {
            // [FIX]: Memanggil endpoint /admin/financing/all sesuai rute Laravel
            const response = await API.get('/admin/financing/all', {
                params: { status: activeTab }
            });
            setLoans(response.data || []);
        } catch (error) {
            console.error("Gagal mengambil data:", error);
            toast.error("Gagal mengambil data pembiayaan"); // Error yang muncul di image_acdd1b.png
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [activeTab]);

    // --- 2. LOGIC APPROVE (SETUJUI) ---
    const handleApprove = async (loan: any) => {
        const confirm = window.confirm(`Setujui pembiayaan ${loan.type} untuk ${loan.user_name || 'Anggota'}?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses persetujuan...');
        try {
            // Mengirim request ke rute approve di AdminController
            await API.post(`/admin/financing/${loan.id}/approve`);
            toast.success('Pengajuan Berhasil Disetujui ✅', { id: toastId });
            fetchLoans(); // Refresh data setelah sukses
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal menyetujui";
            toast.error(msg, { id: toastId });
        }
    };

    // --- 3. LOGIC REJECT (TOLAK) ---
    const handleReject = async (id: number) => {
        const reason = window.prompt("Alasan penolakan (opsional):");
        if (reason === null) return; 

        const toastId = toast.loading('Memproses penolakan...');
        try {
            // Mengirim request ke rute reject di AdminController
            await API.post(`/admin/financing/${id}/reject`, { reason });
            toast.success('Pengajuan Telah Ditolak ❌', { id: toastId });
            fetchLoans();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal menolak";
            toast.error(msg, { id: toastId });
        }
    };

    // Helper: Render Detail Item (Parsing JSON dari Database)
    const renderDetailBadge = (loan: any) => {
        if (!loan.details) return null;
        try {
            // Data details disimpan sebagai JSON di database
            const details = typeof loan.details === 'string' ? JSON.parse(loan.details) : loan.details;
            const text = details.item_name || details.business_name || details.training_name || details.child_name || "Detail Lainnya";
            
            return (
                <div className="flex items-center gap-1.5 mt-1.5">
                    <Info size={10} className="text-blue-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                        {text}
                    </span>
                </div>
            );
        } catch (e) { return null; }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            {/* HEADER */}
            <div className="mb-8">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-[#136f42] transition-colors mb-4 w-fit text-[10px] font-black uppercase tracking-[0.2em]">
                    <ArrowLeft size={16} strokeWidth={3} /> Kembali ke Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Manajemen Pembiayaan</h1>
                        <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">Verifikasi dan Monitoring Kredit Anggota</p>
                    </div>

                    <button
                        onClick={fetchLoans}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-[#136f42] transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* TAB NAVIGASI */}
                <div className="flex items-center gap-8 border-b border-slate-200 mt-10 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'pending', label: 'Menunggu Approval' },
                        { id: 'approved', label: 'Pinjaman Berjalan' },
                        { id: 'history', label: 'Riwayat & Arsip' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap",
                                activeTab === tab.id ? "text-[#136f42]" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#136f42] rounded-t-full" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT LIST */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-24 text-center flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-[#136f42]" size={40} strokeWidth={3} />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Sinkronisasi Tabel...</span>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
                        <Search size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Tidak ada data di kategori ini</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {loans.map((loan) => (
                            <div key={loan.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

                                    {/* INFO ANGGOTA & PRODUK */}
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-[#136f42] text-xl border border-slate-100 group-hover:bg-[#136f42] group-hover:text-white transition-all duration-500">
                                            {loan.user_name?.charAt(0) || 'M'}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-[1000] text-slate-800 uppercase tracking-tight text-lg leading-none">
                                                    {loan.user_name}
                                                </h3>
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black">
                                                    #{loan.member_id || 'TEMP-ID'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="text-[#136f42]">{loan.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span>{loan.duration} Bulan</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} /> {format(new Date(loan.created_at), 'dd MMM yyyy', { locale: indonesia })}
                                                </span>
                                            </div>
                                            {renderDetailBadge(loan)}
                                        </div>
                                    </div>

                                    {/* NOMINAL & STATUS */}
                                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-10 w-full lg:w-auto border-t lg:border-t-0 border-slate-50 pt-5 lg:pt-0">
                                        <div className="text-left lg:text-right">
                                            <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-1">Total Pembiayaan</p>
                                            <p className="font-[1000] text-slate-900 text-xl tracking-tighter leading-none">{formatRupiah(loan.amount)}</p>
                                        </div>

                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                                            loan.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            loan.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            "bg-rose-50 text-rose-600 border-rose-100"
                                        )}>
                                            {loan.status}
                                        </div>

                                        {/* AKSI */}
                                        <div className="flex items-center gap-2">
                                            {loan.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(loan)}
                                                        className="h-11 px-6 bg-[#136f42] hover:bg-[#0f5c35] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all flex items-center gap-2 active:scale-95"
                                                    >
                                                        <Check size={16} strokeWidth={3} /> Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(loan.id)}
                                                        className="h-11 px-6 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                    >
                                                        Tolak
                                                    </button>
                                                </>
                                            ) : (
                                                <Link
                                                    to={`/admin/pembiayaan/${loan.id}`}
                                                    className="h-11 w-11 bg-slate-50 text-slate-400 hover:bg-[#136f42] hover:text-white rounded-2xl flex items-center justify-center transition-all border border-slate-100 active:scale-95"
                                                >
                                                    <ChevronRight size={20} strokeWidth={3} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};