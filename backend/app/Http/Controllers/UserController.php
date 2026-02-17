<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Mengambil profil dasar user yang sedang login
     */
    public function profile()
    {
        $user = Auth::user();
        return response()->json($user);
    }

    /**
     * Mengambil ringkasan finansial user (Context untuk SILA)
     */
    public function getSilaContext()
    {
        $user = Auth::user();

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

            // 5 Transaksi Terakhir
            'recent_transactions' => DB::table('transactions')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Memperbarui profil user
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($request->only('name', 'phone'));

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user'    => $user
        ]);
    }
}