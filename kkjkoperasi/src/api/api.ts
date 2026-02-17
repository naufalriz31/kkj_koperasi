import axios from 'axios';
import { PawnTransaction, BalanceTransaction } from '../types';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    // Hapus header Content-Type global agar otomatis menyesuaikan saat ada upload file
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- DAFTAR FUNGSI API ---

// Sesuaikan endpoint dengan routes/api.php
export const ajukanGadai = (data: FormData | Partial<PawnTransaction>) => 
    API.post<{message: string, data: PawnTransaction}>('/pawn/apply', data);

export const getRiwayatGadai = () => 
    API.get<PawnTransaction[]>('/pawn/history');

// Gunakan FormData jika Anda mengirim file bukti transfer (proof)
export const updateSaldo = (data: FormData | Partial<BalanceTransaction>) => 
    API.post<{message: string, data: BalanceTransaction}>('/balance/topup', data);

export default API;