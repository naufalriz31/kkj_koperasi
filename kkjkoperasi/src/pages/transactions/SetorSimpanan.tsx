import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import {
    ArrowLeft, Wallet, CheckCircle, Save,
    PiggyBank, School, Heart, Plane, Gift,
    Loader2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal'; // Sesuaikan path jika ada di folder ui

export const SetorSimpanan = () => {
    const navigate = useNavigate();
    // [PENTING] Ambil user, checkSession, dan updateUser
    const { user, checkSession, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);

    const [selectedSimpanan, setSelectedSimpanan] = useState<any>(null);
    const [amount, setAmount] = useState<string>('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ID harus sama persis dengan nama kolom di database MySQL
    const simpananOptions = [
        { id: 'simwa_balance', name: 'Simpanan Wajib', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', desc: 'Kewajiban rutin anggota' },
        { id: 'simpok_balance', name: 'Simpanan Pokok', icon: Save, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Simpanan dasar keanggotaan' },
        { id: 'simade_balance', name: 'Masa Depan', icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Tabungan jangka panjang' },
        { id: 'sipena_balance', name: 'Pendidikan', icon: School, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Persiapan biaya sekolah' },
        { id: 'sihara_balance', name: 'Hari Raya', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Tunjangan hari raya mandiri' },
        { id: 'siqurma_balance', name: 'Qurban', icon: Heart, color: 'text-red-600', bg: 'bg-red-50', desc: 'Tabungan ibadah qurban' },
        { id: 'siuji_balance', name: 'Haji / Umroh', icon: Plane, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Simpanan tanah suci' },
        { id: 'siwalima_balance', name: 'Walimah', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', desc: 'Persiapan biaya pernikahan' },
    ];

    useEffect(() => {
        const init = async () => {
            if (!user) await checkSession();
            setLoading(false);
        };
        init();
    }, [user, checkSession]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
    };

    const handleInitialSubmit = () => {
        const cleanAmount = amount ? parseInt(amount.replace(/\./g, '')) : 0;
        if (!selectedSimpanan) return toast.error("Pilih jenis simpanan tujuan dulu");
        if (cleanAmount < 10000) return toast.error("Minimal setor Rp 10.000");
        if (cleanAmount > (user?.tapro_balance || 0)) return toast.error("Saldo Tapro tidak mencukupi!");
        
        setShowPinModal(true);
    };

    // [FUNGSI UTAMA] Dipanggil saat PIN Benar
    const executeTransfer = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading("Memproses pemindahan saldo...");
        const cleanAmount = parseInt(amount.replace(/\./g, ''));

        try {
            // [FIX] Mengirim data sesuai format yang diminta BalanceTransactionController
            const payload = {
                type: 'internal',                // Kode rahasia untuk backend (transfer internal)
                target_account: selectedSimpanan.id, // Kolom tujuan (misal: simwa_balance)
                amount: cleanAmount,
                pin: user?.pin                   // [PENTING] Kirim PIN user untuk validasi server
            };

            const response = await API.post('/transfer', payload);

            // Update Saldo di Tampilan secara Realtime
            if (response.data.user) {
                updateUser(response.data.user);
            }

            toast.success("Saldo berhasil dipindahkan!", { id: toastId });
            setAmount('');
            setSelectedSimpanan(null);
            
            // Redirect ke dashboard atau riwayat
            navigate('/');

        } catch (err: any) {
            console.error(err);
            // Tampilkan pesan error asli dari backend jika ada
            const msg = err.response?.data?.message || "Gagal memproses transaksi";
            toast.error(msg, { id: toastId });
        } finally {
            setIsSubmitting(false);
            setShowPinModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#136f42]" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Setor Simpanan</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">
                
                {/* Sumber Dana */}
                <div className="bg-[#136f42] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <p className="text-green-100/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Sumber Dana Utama</p>
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet size={18} className="text-[#aeea00]" />
                            <span className="font-bold text-sm">Saldo Tapro</span>
                        </div>
                        <h2 className="text-3xl font-black font-mono tracking-tighter">
                            {user ? formatRupiah(user.tapro_balance) : 'Rp 0'}
                        </h2>
                    </div>
                </div>

                {/* Pilih Tujuan */}
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Pilih Tujuan Simpanan</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {simpananOptions.map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => setSelectedSimpanan(item)} 
                                className={cn(
                                    "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                    selectedSimpanan?.id === item.id 
                                    ? 'border-[#136f42] bg-green-50/50 ring-1 ring-[#136f42] shadow-md' 
                                    : 'border-gray-100 bg-white hover:border-green-200 shadow-sm'
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm", item.bg, item.color)}>
                                    <item.icon size={20} />
                                </div>
                                <h4 className={cn("font-bold text-sm mb-1 tracking-tight", selectedSimpanan?.id === item.id ? 'text-[#136f42]' : 'text-gray-800')}>
                                    {item.name}
                                </h4>
                                <p className="text-[10px] text-gray-400 leading-tight font-medium line-clamp-2">{item.desc}</p>
                                {selectedSimpanan?.id === item.id && (
                                    <div className="absolute top-3 right-3 text-[#136f42] animate-in zoom-in-50">
                                        <CheckCircle size={18} fill="currentColor" className="text-white shadow-sm" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Nominal */}
                {selectedSimpanan && (
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-green-50 animate-in slide-in-from-bottom-6 duration-500">
                        <div className="flex items-center justify-between mb-5">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal Setoran</span>
                            <span className="text-[10px] font-black text-[#136f42] bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-tighter">
                                Ke: {selectedSimpanan.name}
                            </span>
                        </div>
                        
                        <div className="relative group mb-6">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl">Rp</span>
                            <input 
                                type="text" 
                                value={amount} 
                                onChange={handleAmountChange} 
                                placeholder="0" 
                                className="w-full pl-14 pr-4 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-3xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all placeholder:text-gray-200" 
                                autoFocus 
                            />
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl flex gap-3 items-start border border-amber-100 mb-8 shadow-sm">
                            <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                Pastikan tujuan benar. Saldo Tapro akan langsung dipotong.
                            </p>
                        </div>

                        <button 
                            onClick={handleInitialSubmit} 
                            disabled={isSubmitting} 
                            className="w-full bg-[#136f42] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#0f5c35] transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Lanjut Konfirmasi"}
                        </button>
                    </div>
                )}
            </div>

            {/* PIN MODAL */}
            <PinModal 
                isOpen={showPinModal} 
                onClose={() => setShowPinModal(false)} 
                // [PENTING] onSuccess dipanggil ketika PIN di modal sudah cocok dengan user.pin
                onSuccess={executeTransfer} 
                title="Konfirmasi Setoran" 
            />
        </div>
    );
};