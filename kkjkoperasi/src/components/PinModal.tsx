import React, { useEffect, useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, title = "Masukkan PIN Transaksi" }) => {
    const { user, checkSession } = useAuthStore();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    // [PERBAIKAN 1]: Jalankan sinkronisasi data segera setelah Modal terbuka
    useEffect(() => {
        if (isOpen) {
            checkSession();
        }
    }, [isOpen, checkSession]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // [PERBAIKAN 2]: Ambil data user paling segar langsung dari Store (bukan dari variabel user di atas)
            // Ini untuk memastikan data hasil checkSession terbaru yang digunakan
            const freshUser = useAuthStore.getState().user;

            // 1. Validasi keberadaan PIN
            if (!freshUser?.pin) {
                toast.error("PIN belum terdeteksi. Silakan Refresh halaman atau Login ulang.");
                onClose();
                return;
            }

            // 2. Validasi kecocokan PIN (Database Anda menyimpan '111111')
            if (pin === freshUser.pin) {
                toast.success("PIN Benar!");
                setPin('');
                onSuccess(); // Jalankan transaksi (Tarik Tunai / Beli Emas)
                onClose();   
            } else {
                toast.error("PIN Salah! Silakan coba lagi.");
                setPin('');
            }
        } catch (error) {
            toast.error("Gagal memvalidasi keamanan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#136f42]">
                        <Lock size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Masukkan 6 digit PIN transaksi Anda.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border-b-2 border-gray-300 focus:border-[#136f42] outline-none mb-6"
                        placeholder="••••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={loading || pin.length < 6}
                        className="w-full bg-[#136f42] text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-[#0f5c35] transition-all active:scale-95"
                    >
                        {loading ? 'Memeriksa...' : 'Konfirmasi PIN'}
                    </button>
                </form>
            </div>
        </div>
    );
};