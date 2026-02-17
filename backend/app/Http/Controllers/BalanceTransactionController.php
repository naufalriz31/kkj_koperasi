<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class BalanceTransactionController extends Controller
{
    /**
     * Handle Top Up dan Withdraw
     */
    public function store(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'type' => 'required|in:topup,withdraw',
            'proof' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = Auth::user();
        $amount = $request->amount;

        // Validasi Saldo jika Withdraw
        if ($request->type === 'withdraw' && $user->tapro_balance < $amount) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi untuk penarikan ini.'], 400);
        }

        // Handle upload file bukti transfer
        $proofPath = null;
        if ($request->hasFile('proof')) {
            $path = $request->file('proof')->store('transaction-proofs', 'public');
            $proofPath = url('/storage/' . $path);
        }

        // 2. DB Transaction
        return DB::transaction(function () use ($user, $amount, $request, $proofPath) {
            
            // Status: Topup butuh verifikasi admin (pending), Withdraw biasanya langsung diproses (atau pending sesuai kebijakan)
            $status = ($request->type === 'topup') ? 'pending' : 'success';

            // Simpan ke tabel transactions (Tabel utama yang digunakan dashboard admin)
            $txId = DB::table('transactions')->insertGetId([
                'user_id' => $user->id,
                'type' => $request->type,
                'amount' => $amount,
                'status' => $status,
                'proof_url' => $proofPath,
                'description' => $request->type === 'topup' ? 'Isi Saldo Tapro' : 'Penarikan Saldo Tapro',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $newBalance = $user->tapro_balance;

            // Update Saldo HANYA jika status success (biasanya withdraw)
            if ($status === 'success') {
                $newBalance = $user->tapro_balance - $amount;
                DB::table('users')->where('id', $user->id)->update([
                    'tapro_balance' => $newBalance
                ]);
            }

            // 3. Notifikasi
            DB::table('notifications')->insert([
                'user_id' => $user->id,
                'title' => $request->type === 'topup' ? 'Permintaan Top Up' : 'Penarikan Berhasil',
                'message' => $request->type === 'topup' 
                    ? 'Permintaan pengisian saldo sedang diverifikasi admin.' 
                    : 'Penarikan saldo sebesar ' . number_format($amount) . ' berhasil.',
                'type' => $status === 'success' ? 'success' : 'info',
                'created_at' => now(),
            ]);

            return response()->json([
                'message' => 'Transaksi berhasil dicatat!',
                'status' => $status,
                'new_balance' => $newBalance
            ], 200);
        });
    }

    /**
     * Handle Transfer Antar Anggota
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'target_member_id' => 'required|exists:users,member_id',
            'amount' => 'required|numeric|min:1000',
            'pin' => 'required' // Opsional: Tambahkan validasi Hash::check pin di sini
        ]);

        $sender = Auth::user();
        $receiver = User::where('member_id', $request->target_member_id)->first();
        $amount = $request->amount;

        if ($sender->id === $receiver->id) {
            return response()->json(['message' => 'Tidak bisa transfer ke diri sendiri'], 400);
        }

        if ($sender->tapro_balance < $amount) {
            return response()->json(['message' => 'Saldo tidak mencukupi'], 400);
        }

        return DB::transaction(function () use ($sender, $receiver, $amount) {
            // 1. Potong Saldo Pengirim
            DB::table('users')->where('id', $sender->id)->decrement('tapro_balance', $amount);

            // 2. Tambah Saldo Penerima
            DB::table('users')->where('id', $receiver->id)->increment('tapro_balance', $amount);

            // 3. Catat Transaksi Pengirim
            DB::table('transactions')->insert([
                'user_id' => $sender->id,
                'type' => 'withdraw',
                'amount' => $amount,
                'status' => 'success',
                'description' => "Transfer ke {$receiver->name} ({$receiver->member_id})",
                'created_at' => now(),
            ]);

            // 4. Catat Transaksi Penerima
            DB::table('transactions')->insert([
                'user_id' => $receiver->id,
                'type' => 'topup',
                'amount' => $amount,
                'status' => 'success',
                'description' => "Terima transfer dari {$sender->name}",
                'created_at' => now(),
            ]);

            // 5. Notifikasi Penerima
            DB::table('notifications')->insert([
                'user_id' => $receiver->id,
                'title' => 'Saldo Masuk! 💸',
                'message' => "Anda menerima transfer sebesar Rp " . number_format($amount) . " dari {$sender->name}.",
                'type' => 'success',
                'created_at' => now(),
            ]);

            return response()->json(['message' => 'Transfer berhasil dikirim!']);
        });
    }
}