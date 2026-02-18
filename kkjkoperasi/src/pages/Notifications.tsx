import React, { useEffect, useState } from 'react';
import API from '../api/api'; // [PERBAIKAN] Ganti Supabase ke API Axios
import { useAuthStore } from '../store/useAuthStore';
import { Bell, ArrowLeft, CheckCircle, MailOpen, CheckSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const Notifications = () => {
    const { user, fetchUnreadCount } = useAuthStore();
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Panggil fetch notifikasi saat halaman dibuka
        fetchNotifs();
    }, []);

    const fetchNotifs = async () => {
        try {
            setLoading(true);
            // [PERBAIKAN] Ambil data dari endpoint Laravel: GET /api/notifications
            const response = await API.get('/notifications');
            setNotifs(response.data || []);
            
            // Sinkronkan badge navbar
            fetchUnreadCount();
        } catch (error) {
            console.error("Gagal mengambil notifikasi:", error);
            toast.error("Gagal memuat notifikasi");
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (id: number | string) => {
        // Optimistic Update UI biar instan
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

        try {
            // [PERBAIKAN] Update status dibaca ke Laravel: PATCH /api/notifications/{id}/read
            await API.patch(`/notifications/${id}/read`);
            
            // Update Lonceng di Navbar
            fetchUnreadCount();
        } catch (error) {
            console.error("Gagal update status baca:", error);
        }
    };

    const markAllRead = async () => {
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic Update UI
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));

        try {
            // [PERBAIKAN] Gunakan endpoint massal jika tersedia, atau loop update
            // Untuk kesederhanaan, kita panggil update per ID atau buat endpoint khusus di Laravel nanti
            await Promise.all(unreadIds.map(id => API.patch(`/notifications/${id}/read`)));
            
            toast.success("Semua ditandai sudah dibaca");
            fetchUnreadCount();
        } catch (error) {
            toast.error("Gagal memperbarui beberapa notifikasi");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-50 rounded-full transition-colors text-[#136f42]">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Kotak Masuk</h1>
                </div>

                {notifs.some(n => !n.is_read) && (
                    <button
                        onClick={markAllRead}
                        className="text-xs font-black text-[#136f42] hover:bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors uppercase tracking-tighter"
                    >
                        <CheckSquare size={14} /> Baca Semua
                    </button>
                )}
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-[#136f42]" size={32} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat Notifikasi...</p>
                    </div>
                ) : notifs.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                            <MailOpen size={36} className="text-gray-200" />
                        </div>
                        <p className="font-bold text-sm text-gray-400 uppercase tracking-widest">Belum ada notifikasi baru</p>
                    </div>
                ) : (
                    notifs.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => !n.is_read && markRead(n.id)}
                            className={`relative p-5 rounded-[1.5rem] border transition-all duration-200 cursor-pointer group ${
                                n.is_read
                                    ? 'bg-white border-gray-100 opacity-70'
                                    : 'bg-white border-green-100 shadow-lg shadow-green-900/5 hover:border-green-300'
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0">
                                        {n.is_read ? (
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                                                <MailOpen size={18} />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#136f42] relative">
                                                <Bell size={18} />
                                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className={`font-black text-[15px] mb-1 tracking-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {n.title}
                                        </h3>
                                        <p className={`text-sm leading-relaxed font-medium ${!n.is_read ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                            {format(new Date(n.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                        </p>
                                    </div>
                                </div>

                                {n.is_read && (
                                    <CheckCircle size={16} className="text-green-500 opacity-40" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};