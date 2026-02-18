<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class GoldTransactionController extends Controller
{
    /**
     * Ambil Info Harga Emas & Saldo Emas User
     * Menghubungkan data dari tabel tamasa_balances ke UI Tamasa
     */
    public function info()
{
    $user = Auth::user();
    
    // [PERBAIKAN]: Ambil harga terbaru yang di-update admin dari tabel gold_prices
    $latestPrice = DB::table('gold_prices')->orderBy('created_at', 'desc')->first();
    
    // Ambil saldo emas terbaru dari database
    $balance = DB::table('tamasa_balances')
        ->where('user_id', $user->id)
        ->first();

    return response()->json([
        // Gunakan harga dari database, jika masih kosong baru gunakan fallback 1.300.000
        'buy_price' => $latestPrice ? (int)$latestPrice->buy_price : 1300000, 
        'sell_price' => $latestPrice ? (int)$latestPrice->sell_price : 1200000, 
        'user_balance' => $balance ? (float)$balance->amount_gram : 0,
    ]);
}

    /**
     * Proses Pembelian Emas (Potong Tapro & Tambah Gram Emas)
     * Menggunakan DB Transaction untuk memastikan data konsisten
     */
    public function buy(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'gram' => 'required|numeric',
            'pin' => 'required|string',
        ]);

        $user = User::find(Auth::id());

        // 2. Validasi Keamanan PIN
        if ($user->pin !== $request->pin) {
            return response()->json(['message' => 'PIN Transaksi salah!'], 401);
        }

        // 3. Validasi Kecukupan Saldo Tapro
        if ($user->tapro_balance < $request->amount) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi.'], 400);
        }

        return DB::transaction(function () use ($user, $request) {
            // 4. Potong Saldo Tapro User
            $user->decrement('tapro_balance', $request->amount);

            // 5. Update Saldo Emas (Gunakan kolom amount_gram sesuai struktur database)
            $currentBalance = DB::table('tamasa_balances')->where('user_id', $user->id)->first();

            if ($currentBalance) {
                // Jika sudah ada record, tambahkan gram emasnya
                DB::table('tamasa_balances')
                    ->where('user_id', $user->id)
                    ->increment('amount_gram', $request->gram, ['updated_at' => now()]);
            } else {
                // Jika user pertama kali beli, buat record baru
                DB::table('tamasa_balances')->insert([
                    'user_id' => $user->id,
                    'amount_gram' => $request->gram,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 6. Catat Riwayat Transaksi (Status: Success agar langsung muncul di riwayat)
            DB::table('balance_transactions')->insert([
                'user_id' => $user->id,
                'type' => 'tamasa_buy',
                'amount' => -$request->amount, // Nominal uang keluar (negatif)
                'status' => 'success',
                'description' => "Pembelian Emas " . number_format($request->gram, 4) . " gr",
                'transaction_code' => 'TMS-' . strtoupper(uniqid()),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 7. Kirim Notifikasi Transaksi Berhasil
            DB::table('notifications')->insert([
                'user_id' => $user->id,
                'title' => 'Pembelian Emas Berhasil 🪙',
                'message' => 'Anda telah berhasil membeli emas sebesar ' . number_format($request->gram, 4) . ' gram.',
                'type' => 'success',
                'is_read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Pembelian Berhasil!',
                'user' => User::find($user->id) // Kirim data user terbaru untuk refresh saldo Tapro di UI
            ]);
        });
    }
}