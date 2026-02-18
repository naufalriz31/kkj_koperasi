import React, { useEffect, useState } from "react";
import API from "../../api/api"; 
import { useNavigate, Link } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Scale, 
    ExternalLink, Archive, Clock, CheckCircle, Calendar, Coins, CalendarDays, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminPegadaian = () => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // --- STATE UNTUK MODAL APPROVAL ---
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [taksiranCair, setTaksiranCair] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // [FIX]: Endpoint disesuaikan dengan api.php (/admin/pegadaian)
            const response = await API.get('/admin/pegadaian', {
                params: { status: activeTab }
            });
            setDataList(response.data || []);
        } catch (err: any) {
            toast.error("Gagal memuat data gadai");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 1. BUKA MODAL APPROVE
    const openApproveModal = (req: any) => {
        setSelectedReq(req);
        // Default taksiran diisi dengan nominal yang diminta user
        setTaksiranCair(Number(req.loan_amount) || 0); 
        setIsApproveModalOpen(true);
    };

    // 2. HANDLE INPUT FORMAT RUPIAH
    const handleTaksiranChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); 
        setTaksiranCair(Number(rawValue));
    };

    // 3. SUBMIT APPROVAL
    const handleSubmitApprove = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReq) return;
        if (taksiranCair <= 0) return toast.error("Nominal taksiran harus diisi!");

        setIsProcessing(true);
        const toastId = toast.loading("Memproses pencairan dana...");

        try {
            // [FIX]: Endpoint /admin/pegadaian/{id}/approve
            await API.post(`/admin/pegadaian/${selectedReq.id}/approve`, {
                loan_amount: taksiranCair
            });

            toast.success("Gadai disetujui & Dana cair ke Tapro!", { id: toastId });
            setIsApproveModalOpen(false);
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            toast.error("Gagal: " + msg, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // 4. HANDLE REJECT
    const handleReject = async (req: any) => {
        const reason = window.prompt("Alasan penolakan:", "Foto kurang jelas / Kadar emas tidak sesuai");
        if (reason === null) return; // Jika tekan cancel di prompt

        const toastId = toast.loading("Memproses penolakan...");
        try {
            // [FIX]: Endpoint /admin/pegadaian/{id}/reject
            await API.post(`/admin/pegadaian/${req.id}/reject`, {
                reason: reason
            });
            
            toast.success("Pengajuan berhasil ditolak", { id: toastId });
            fetchData();
        } catch (err: any) { 
            toast.error("Gagal memproses penolakan", { id: toastId }); 
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#136f42] mb-4 transition-colors text-xs font-black uppercase tracking-widest">
                    <ArrowLeft size={16} strokeWidth={3} /> Kembali
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-[1000] text-slate-900 tracking-tighter uppercase">Approval Gadai</h1>
                        <p className="text-sm text-slate-400 font-medium">Verifikasi & Taksiran Gadai Emas Syariah Anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit mb-8 border border-slate-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'pending' ? "bg-white text-[#136f42] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Clock size={14} /> Permintaan Baru
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'history' ? "bg-white text-[#136f42] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Archive size={14} /> Riwayat (Selesai)
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-24 text-center flex flex-col items-center">
                        <Loader2 className="animate-spin text-[#136f42] mb-4" size={40} />
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Menyinkronkan Data...</span>
                    </div>
                ) : dataList.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                            <Scale size={40} />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Antrean {activeTab === 'pending' ? 'Pending' : 'Riwayat'} Kosong</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {dataList.map((req) => (
                            <div key={req.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-8 hover:shadow-xl transition-all duration-500 group">
                                
                                {/* Image Preview */}
                                <div className="w-full lg:w-56 h-56 bg-slate-50 rounded-3xl overflow-hidden shrink-0 relative group border border-slate-100 shadow-inner">
                                    <img src={req.image_url} alt="Emas" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <a href={req.image_url} target="_blank" rel="noreferrer" className="bg-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"><ExternalLink size={14} /> Lihat Foto Asli</a>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-green-50 text-[#136f42] rounded-2xl flex items-center justify-center shadow-sm border border-green-100">
                                                <Coins size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter leading-none mb-2">{req.item_name}</h3>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span className="text-[#136f42]">{req.user_name}</span>
                                                    <span>•</span>
                                                    <span className="font-mono text-slate-300">{req.member_id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", 
                                                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                req.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            )}>
                                                {req.status}
                                            </span>
                                            <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase tracking-tighter">
                                                {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="grid grid-cols-4 gap-4 bg-slate-50/80 p-5 rounded-3xl border border-slate-100 text-center">
                                        <div>
                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Berat</p>
                                            <p className="text-sm font-black text-slate-900">{req.weight} gr</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Karat</p>
                                            <p className="text-sm font-black text-slate-900">{req.karat} K</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Tenor</p>
                                            <p className="text-sm font-black text-[#136f42]">{req.tenor_months} Bln</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Kondisi</p>
                                            <p className="text-[10px] font-bold text-slate-900 truncate" title={req.condition_item}>{req.condition_item}</p>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between bg-[#136f42]/5 px-6 py-4 rounded-2xl border border-[#136f42]/10">
                                        <span className="text-[10px] font-black text-[#136f42] uppercase tracking-[0.2em]">Permintaan Dana:</span>
                                        <span className="font-[1000] text-[#136f42] text-xl tracking-tighter">{formatRupiah(req.loan_amount)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-row lg:flex-col justify-center gap-3 lg:border-l lg:pl-8 border-slate-100 min-w-[220px]">
                                    {req.status === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => openApproveModal(req)}
                                                className="flex-1 lg:w-full py-4 bg-[#136f42] text-white rounded-2xl hover:bg-[#0f5c35] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all active:scale-95"
                                            >
                                                <Check size={18} strokeWidth={3} /> Setujui & Cairkan
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req)} 
                                                className="flex-1 lg:w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <X size={18} strokeWidth={3} /> Tolak Pengajuan
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center w-full">
                                            <CheckCircle size={32} className={cn(req.status === 'rejected' ? "text-rose-300" : "text-[#136f42]", "mb-3")} />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                                Status<br/>{req.status}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL APPROVAL / TAKSIRAN */}
            {isApproveModalOpen && selectedReq && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-[1000] text-slate-900 uppercase tracking-tighter">Proses Taksiran</h2>
                            <button onClick={() => setIsApproveModalOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
                        </div>

                        <div className="mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Rincian Barang Jaminan</p>
                            <div className="space-y-2">
                                <p className="text-sm font-black text-slate-900 uppercase">{selectedReq.item_name}</p>
                                <p className="text-[11px] font-bold text-[#136f42] uppercase tracking-tight">
                                    {selectedReq.weight} Gram • {selectedReq.karat} Karat • {selectedReq.tenor_months} Bulan
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitApprove}>
                            <div className="mb-8">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                    Tentukan Nilai Taksiran Cair (Rp)
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl group-focus-within:text-[#136f42] transition-colors">Rp</span>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="0" 
                                        value={taksiranCair ? taksiranCair.toLocaleString('id-ID') : ''}
                                        onChange={handleTaksiranChange}
                                        className="w-full border border-slate-200 rounded-2xl pl-16 pr-6 py-5 font-[1000] text-2xl text-slate-900 outline-none focus:ring-4 focus:ring-green-50 focus:border-[#136f42] transition-all"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-4 ml-1 font-bold uppercase leading-relaxed">
                                    * Dana akan langsung dikirim ke <span className="text-[#136f42]">Saldo Tapro</span> {selectedReq.user_name}.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    type="submit" 
                                    disabled={isProcessing}
                                    className="flex-1 bg-[#136f42] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all hover:bg-[#0f5c35] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Konfirmasi & Cairkan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};