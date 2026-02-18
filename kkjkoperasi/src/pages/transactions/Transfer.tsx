import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Phone, Send, Search, UserCheck, Wallet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';
import { PinModal } from '../../components/PinModal';

export const Transfer = () => {
    const navigate = useNavigate();
    // [PENTING] Tambahkan updateUser dari store
    const { user, updateUser } = useAuthStore();

    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // --- FORMAT RUPIAH ---
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); 
        if (rawValue) {
            const formattedValue = parseInt(rawValue).toLocaleString('id-ID');
            setAmount(formattedValue);
        } else {
            setAmount('');
        }
    };

    // --- CEK PENERIMA ---
    const checkRecipient = async () => {
        if (phone.length < 10) return;
        setIsChecking(true);
        setRecipientName(null);

        try {
            // Memanggil endpoint checkUser di AuthController/BalanceController
            const response = await API.post('/check-user', { phone });
            
            if (response.data.exists) {
                setRecipientName(response.data.name);
                toast.success(`Penerima: ${response.data.name}`);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Nomor tidak terdaftar';
            toast.error(msg);
        } finally {
            setIsChecking(false);
        }
    };

    // --- EKSEKUSI KIRIM SALDO ---
    const executeTransfer = async () => {
        setIsLoading(true);
        const toastId = toast.loading('Memproses transfer...');
        const nominal = parseInt(amount.replace(/\./g, ''));

        try {
            // [FIX]: Menyesuaikan Payload dengan BalanceTransactionController.php
            const payload = {
                type: 'external',    // Menandakan transfer antar anggota
                to_phone: phone,     // Nomor HP tujuan
                amount: nominal,     // Jumlah transfer
                pin: user?.pin       // Kirim PIN untuk validasi server
            };

            const response = await API.post('/transfer', payload);

            // Update Saldo Realtime di Frontend
            if (response.data.user) {
                updateUser(response.data.user);
            }

            toast.success('Transfer Berhasil!', { id: toastId });
            
            // Arahkan ke halaman sukses atau riwayat
            navigate('/transaksi/riwayat');

        } catch (error: any) {
            console.error("Transfer Error:", error);
            const msg = error.response?.data?.message || 'Transfer gagal diproses';
            toast.error(msg, { id: toastId });
        } finally {
            setIsLoading(false);
            setShowPinModal(false);
        }
    };

    const handleTransferClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nominal = parseInt(amount.replace(/\./g, ''));

        if (!recipientName) {
            toast.error('Cek nomor tujuan terlebih dahulu.');
            return;
        }
        if (!nominal || nominal < 10000) {
            toast.error('Minimal transfer Rp 10.000');
            return;
        }
        if (nominal > (user?.tapro_balance || 0)) {
            toast.error('Saldo Tapro tidak mencukupi.');
            return;
        }

        setShowPinModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-bold">Kirim Saldo</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6">
                
                {/* INFO SALDO */}
                <div className="bg-[#136f42] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <p className="text-green-100/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Saldo Tersedia</p>
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet size={18} className="text-[#aeea00]" />
                            <span className="font-bold text-sm">Tapro Balance</span>
                        </div>
                        <h2 className="text-3xl font-black font-mono tracking-tight">
                            {user ? formatRupiah(user.tapro_balance) : 'Rp 0'}
                        </h2>
                    </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleTransferClick} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                    
                    {/* NOMOR TUJUAN */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp Tujuan</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full pl-12 h-12 text-sm font-bold bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#136f42] outline-none transition-all"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setRecipientName(null);
                                    }}
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={checkRecipient}
                                disabled={isChecking || phone.length < 10}
                                className="bg-green-50 text-[#136f42] px-4 rounded-xl border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-all flex items-center justify-center"
                            >
                                {isChecking ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            </button>
                        </div>
                        
                        {recipientName && (
                            <div className="bg-green-50 text-[#136f42] p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-green-100 animate-in zoom-in-95">
                                <UserCheck size={18} /> Penerima: {recipientName}
                            </div>
                        )}
                    </div>

                    {/* NOMINAL */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Transfer</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl group-focus-within:text-[#136f42]">Rp</span>
                            <input
                                type="text"
                                placeholder="0"
                                className="w-full pl-12 h-14 text-2xl font-black bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all"
                                value={amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={!recipientName || isLoading || !amount}
                        className="w-full h-14 bg-[#136f42] hover:bg-[#0f5c35] text-white rounded-2xl shadow-lg shadow-green-900/10 font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> KIRIM SEKARANG</>}
                    </Button>
                </form>
            </div>

            {/* MODAL PIN */}
            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={executeTransfer} // Berjalan otomatis saat validasi PIN sukses
                title="Konfirmasi Keamanan"
            />
        </div>
    );
};