import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import { 
    ArrowLeft, CreditCard, Banknote, AlertCircle, 
    Wallet, PiggyBank, CheckCircle, Loader2, Landmark,
    Save, School, Gift, Heart, Plane
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah, cn } from '../../lib/utils';
import { PinModal } from '../../components/PinModal'; // Pastikan path benar

export const Withdraw = () => {
    const navigate = useNavigate();
    // [PENTING] Ambil updateUser agar saldo di frontend langsung berubah
    const { user, checkSession, updateUser } = useAuthStore();

    // STATE UTAMA
    const [sourceType, setSourceType] = useState<'tapro' | 'simpanan'>('tapro');
    const [selectedSimpanan, setSelectedSimpanan] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // Daftar Opsi Simpanan (Pastikan ID match dengan kolom DB jika nanti backend support tarik dari simpanan)
    const simpananOptions = [
        { id: 'simwa_balance', name: 'Simpanan Wajib', col: 'simwa_balance', icon: CheckCircle },
        { id: 'simpok_balance', name: 'Simpanan Pokok', col: 'simpok_balance', icon: Save },
        { id: 'simade_balance', name: 'Masa Depan', col: 'simade_balance', icon: PiggyBank },
        { id: 'sipena_balance', name: 'Pendidikan', col: 'sipena_balance', icon: School },
        { id: 'sihara_balance', name: 'Hari Raya', col: 'sihara_balance', icon: Gift },
        { id: 'siqurma_balance', name: 'Qurban', col: 'siqurma_balance', icon: Heart },
        { id: 'siuji_balance', name: 'Haji / Umroh', col: 'siuji_balance', icon: Plane },
        { id: 'siwalima_balance', name: 'Walimah', col: 'siwalima_balance', icon: Heart },
    ];

    useEffect(() => {
        if (!user) checkSession();
    }, [user, checkSession]);

    // Fungsi mendapatkan saldo aktif
    const getActiveBalance = () => {
        if (sourceType === 'tapro') return user?.tapro_balance || 0;
        // Gunakan 'as any' untuk akses dinamis
        if (selectedSimpanan) return (user as any)?.[selectedSimpanan.col] || 0;
        return 0;
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
    };

    // Validasi Awal sebelum buka PIN
    const handleWithdrawClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\./g, ''));

        if (sourceType === 'simpanan' && !selectedSimpanan) {
            return toast.error('Pilih jenis simpanan dulu!');
        }
        if (!nominal || nominal < 50000) {
            return toast.error('Minimal penarikan Rp 50.000');
        }
        if (nominal > getActiveBalance()) {
            return toast.error('Saldo tidak mencukupi!');
        }
        if (!bankName.trim() || !accountNumber.trim()) {
            return toast.error('Info rekening wajib diisi!');
        }

        setShowPinModal(true);
    };

    // [FUNGSI UTAMA] Eksekusi Penarikan ke Backend
    const executeWithdraw = async () => {
        setIsLoading(true);
        const toastId = toast.loading('Mengirim permintaan penarikan...');
        const nominal = parseInt(amount.replace(/\./g, ''));

        try {
            // [FIX] Menggunakan endpoint /transfer sesuai Controller backend baru
            const payload = {
                type: 'withdraw',       // Kode perintah untuk backend
                amount: nominal,
                pin: user?.pin,         // [PENTING] Kirim PIN User
                bank_name: bankName,    // Data tambahan (opsional/disimpan di description backend)
                account_number: accountNumber
            };

            const response = await API.post('/transfer', payload);

            // Update Saldo Realtime
            if (response.data.user) {
                updateUser(response.data.user);
            }

            toast.success('Penarikan Berhasil!', { id: toastId });
            navigate('/transaksi/sukses', { 
                state: { 
                    amount: nominal, 
                    type: 'Tarik Tunai', 
                    date: new Date().toLocaleString() 
                } 
            });

        } catch (error: any) {
            console.error("Withdraw Error:", error);
            const msg = error.response?.data?.message || 'Gagal memproses penarikan';
            toast.error(msg, { id: toastId });
        } finally {
            setIsLoading(false);
            setShowPinModal(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 transition">
                        <ArrowLeft size={20} className="text-[#136f42]" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Tarik Tunai</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">
                
                {/* 1. KATEGORI SUMBER DANA */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => { setSourceType('tapro'); setSelectedSimpanan(null); }}
                        className={cn(
                            "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                            sourceType === 'tapro' ? "bg-[#136f42] border-[#136f42] text-white shadow-lg" : "bg-white border-gray-200 text-gray-500"
                        )}
                    >
                        <Wallet size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Saldo Tapro</span>
                    </button>
                    <button 
                        onClick={() => setSourceType('simpanan')}
                        className={cn(
                            "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                            sourceType === 'simpanan' ? "bg-[#136f42] border-[#136f42] text-white shadow-lg" : "bg-white border-gray-200 text-gray-500"
                        )}
                    >
                        <PiggyBank size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Non-Tapro</span>
                    </button>
                </div>

                {/* 2. SALDO CARD */}
                <div className="rounded-3xl bg-[#136f42] p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-[#aeea00] uppercase tracking-[0.2em] mb-1">
                            {sourceType === 'tapro' ? 'Saldo Dompet Tapro' : selectedSimpanan ? selectedSimpanan.name : 'Pilih Jenis Simpanan'}
                        </p>
                        <h2 className="text-3xl font-black tracking-tight">
                            {formatRupiah(getActiveBalance())}
                        </h2>

                        {/* List Opsi Simpanan */}
                        {sourceType === 'simpanan' && (
                            <div className="mt-4 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {simpananOptions.map((opt) => (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setSelectedSimpanan(opt)}
                                        className={cn(
                                            "w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all text-xs font-bold",
                                            selectedSimpanan?.id === opt.id 
                                                ? "bg-white text-[#136f42] border-white shadow-lg" 
                                                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <opt.icon size={14} />
                                            <span>{opt.name}</span>
                                        </div>
                                        <span className="opacity-80 font-mono">{formatRupiah((user as any)?.[opt.col] || 0)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. FORM INPUT */}
                <form onSubmit={handleWithdrawClick} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Penarikan</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 group-focus-within:text-[#136f42] transition-colors">Rp</span>
                            <input
                                type="text"
                                placeholder="0"
                                className="w-full pl-12 h-14 text-xl font-black bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rekening Tujuan</label>
                        <div className="relative">
                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Nama Bank (BCA, Mandiri, dll)"
                                className="w-full pl-12 h-12 text-sm font-bold bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#136f42] outline-none"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Nomor Rekening"
                                className="w-full pl-12 h-12 text-sm font-bold bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#136f42] outline-none"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || (parseInt(amount.replace(/\D/g, '')) > getActiveBalance())}
                        className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-[#136f42] text-white hover:bg-[#0f5c35] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Banknote size={18} className="mr-2" /> AJUKAN PENARIKAN</>}
                    </button>
                </form>

                {/* INFO */}
                <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                        Permintaan penarikan akan diverifikasi Admin dalam waktu 1x24 jam kerja.
                    </p>
                </div>
            </div>

            {/* PIN MODAL */}
            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                // [PENTING] Panggil executeWithdraw SAAT PIN BENAR
                onSuccess={executeWithdraw} 
                title="Konfirmasi Penarikan"
            />
        </div>
    );
};