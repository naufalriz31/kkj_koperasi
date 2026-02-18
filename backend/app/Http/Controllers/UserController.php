<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * [PERBAIKAN] Mengambil profil terbaru user yang sedang login
     * Fungsi ini sangat penting untuk sinkronisasi saldo di dashboard.
     */
    public function profile()
    {
        // Cari user secara manual berdasarkan ID auth agar data 'fresh' dari database
        $user = User::find(Auth::id()); 

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        return response()->json($user);
    }

    /**
     * Mengambil ringkasan finansial user (Context untuk SILA / AI Assistant)
     */
    public function getSilaContext()
    {
        // Ambil data terbaru
        $user = User::find(Auth::id());

        return response()->json([
            'name'          => $user->name,
            'member_id'     => $user->member_id,
            'tapro_balance' => $user->tapro_balance,
            
            // Simpanan-simpanan lainnya
            'savings' => [
                'simwa'    => $user->simwa_balance,
                'simpok'   => $user->simpok_balance,
                'sipena'   => $user->sipena_balance,
                'siqurma'  => $user->siqurma_balance,
            ],

            // Pinjaman Aktif
            'active_loans' => DB::table('loans')
                ->where('user_id', $user->id)
                ->whereIn('status', ['approved', 'active'])
                ->get(),

            // Tagihan Belum Lunas (Angsuran)
            'unpaid_installments' => DB::table('installments')
                ->where('user_id', $user->id)
                ->where('status', 'unpaid')
                ->orderBy('due_date', 'asc')
                ->get(),

            // Data TAMASA (Emas)
            'tamasa_balance' => DB::table('tamasa_balances')
                ->where('user_id', $user->id)
                ->first(),

            // Total Investasi INFLIP (Properti)
            'inflip_total_investment' => DB::table('inflip_investments')
                ->where('user_id', $user->id)
                ->sum('amount'),

            // 5 Transaksi Terakhir (Menggunakan tabel balance_transactions terbaru)
            'recent_transactions' => DB::table('balance_transactions')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Memperbarui profil user dasar
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        // Gunakan update pada instance user yang aktif
        $user->name = $request->name;
        $user->phone = $request->phone;
        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user'    => $user
        ]);
    }
}