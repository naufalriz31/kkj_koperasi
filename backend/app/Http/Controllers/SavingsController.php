<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SavingsController extends Controller
{
    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'target_type' => 'required|string',
        ]);

        $user = Auth::user();
        $amount = $request->amount;
        $targetType = $request->target_type;
        $targetColumn = $targetType . '_balance';

        if ($user->tapro_balance < $amount) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi'], 400);
        }

        // Pastikan kolom tujuan valid
        $allowedColumns = [
            'simwa_balance', 'simpok_balance', 'simade_balance', 
            'sipena_balance', 'sihara_balance', 'siqurma_balance', 
            'siuji_balance', 'siwalima_balance'
        ];

        if (!in_array($targetColumn, $allowedColumns)) {
            return response()->json(['message' => 'Jenis simpanan tidak valid'], 400);
        }

        return DB::transaction(function () use ($user, $amount, $targetColumn, $targetType, $request) {
            // 1. Kurangi Tapro
            DB::table('users')->where('id', $user->id)->decrement('tapro_balance', $amount);

            // 2. Tambah Simpanan Tujuan
            DB::table('users')->where('id', $user->id)->increment($targetColumn, $amount);

            // 3. Catat Transaksi
            DB::table('balance_transactions')->insert([
                'user_id' => $user->id,
                'type' => 'deposit_' . $targetType,
                'amount' => $amount,
                'status' => 'success',
                'description' => $request->description ?? "Setor ke $targetType",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Setoran berhasil diproses']);
        });
    }
}