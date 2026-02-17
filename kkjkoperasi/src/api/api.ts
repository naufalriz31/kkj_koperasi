import axios from 'axios';
// Tambahkan kata "type" sebelum kurung kurawal
import type { PawnTransaction, BalanceTransaction } from '../types';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// Otomatis memasukkan Token ke setiap permintaan
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- DAFTAR FUNGSI API ---

export const ajukanGadai = (data: FormData | Partial<PawnTransaction>) => 
    API.post<{message: string, data: PawnTransaction}>('/pawn/apply', data);

export const getRiwayatGadai = () => 
    API.get<PawnTransaction[]>('/pawn/history');

export const updateSaldo = (data: FormData | Partial<BalanceTransaction>) => 
    API.post<{message: string, data: BalanceTransaction}>('/balance/topup', data);

export default API;