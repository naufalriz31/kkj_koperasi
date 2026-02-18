// User Profile
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'rejected';
  tapro_balance: number;
  pin?: string;         // Tambahan agar Profile.tsx tidak error
  created_at?: string;  // Tambahan agar Home.tsx tidak error
  updated_at?: string;
}

export type UserProfile = User;

// Transaksi Saldo
export interface BalanceTransaction {
  id: number;
  user_id: number;
  type: 'topup' | 'transfer' | 'payment' | 'withdrawal';
  amount: number;
  description: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  reference_id?: string;
}

// Gadai (Pawn)
export interface PawnTransaction {
  id: number;
  user_id: number;
  item_name: string;
  item_condition: string;
  estimated_value: number;
  loan_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  description?: string;
  image_url?: string; // Tambahkan ini jika ada upload foto
  created_at: string;
}

// Pembiayaan (Financing) - BARU
export interface Financing {
  id: number;
  user_id: number;
  type: 'cash' | 'goods';
  amount: number;
  duration_months: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid_off';
  created_at: string;
}

// Emas (Tamasa) - BARU
export interface GoldPrice {
  id: number;
  buy_price: number;
  sell_price: number;
  updated_at: string;
}

export interface TamasaBalance {
  amount_grams: number;
}