import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import API from '../api/api';

// Definisi Tipe Data User (Sesuai database Laravel)
export interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;       // 'admin' | 'member'
    status: string;     // 'active' | 'pending' | 'rejected'
    member_id?: string;
    phone?: string;
    avatar_url?: string;
    
    // Saldo-saldoan
    tapro_balance?: number;
    simpok_balance?: number;
    simwa_balance?: number;
}

interface AuthState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    unreadCount: number;

    // Actions
    setAuth: (user: UserProfile, token: string) => void;
    logout: () => void;
    checkSession: () => Promise<void>;
    updateUser: (updates: Partial<UserProfile>) => void; // Update sebagian data (misal saldo aja)
    fetchUnreadCount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false, // Default false agar tidak loading terus saat refresh
            unreadCount: 0,

            // 1. LOGIN BERHASIL
            setAuth: (user, token) => {
                // Simpan token ke localStorage 'fisik' agar Axios Interceptor bisa baca
                localStorage.setItem('token', token);
                
                // Simpan ke State (Persist akan otomatis simpan ini juga)
                set({ 
                    user, 
                    token, 
                    isAuthenticated: true, 
                    isLoading: false 
                });

                // Ambil notifikasi setelah login
                get().fetchUnreadCount();
            },

            // 2. UPDATE DATA USER (Tanpa Reload)
            // Berguna saat Top Up sukses, kita update saldo di frontend langsung
            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }));
            },

            // 3. LOGOUT
            logout: () => {
                localStorage.removeItem('token'); // Hapus token fisik
                set({ 
                    user: null, 
                    token: null, 
                    isAuthenticated: false, 
                    unreadCount: 0 
                });
            },

            // 4. CEK SESSION (Validasi Token ke Server)
            // Dipanggil di App.tsx atau layout utama
            checkSession: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    get().logout();
                    return;
                }

                try {
                    // Panggil API Laravel untuk minta data user terbaru
                    const response = await API.get('/user/profile');
                    
                    // Update data user di state dengan yang terbaru dari server
                    set({ 
                        user: response.data, 
                        isAuthenticated: true 
                    });
                    
                    // Sekalian update notifikasi
                    get().fetchUnreadCount();

                } catch (error) {
                    console.error("Session expired:", error);
                    // Jika token tidak valid/expired di server, logout paksa
                    get().logout();
                }
            },

            // 5. AMBIL JUMLAH NOTIFIKASI
            fetchUnreadCount: async () => {
                const { isAuthenticated } = get();
                if (!isAuthenticated) return;

                try {
                    const response = await API.get('/notifications/unread-count');
                    set({ unreadCount: response.data.count || 0 });
                } catch (error) {
                    console.error("Gagal load notifikasi");
                }
            }
        }),
        {
            name: 'kkj-auth-storage', // Nama key di LocalStorage browser
            storage: createJSONStorage(() => localStorage), // Wajib definisikan storage
            // Hanya simpan field tertentu agar tidak berat/error
            partialize: (state) => ({ 
                user: state.user, 
                token: state.token, 
                isAuthenticated: state.isAuthenticated 
            }),
        }
    )
);