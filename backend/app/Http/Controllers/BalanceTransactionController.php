<?php

namespace App\Http\Controllers;

use App\Models\BalanceTransaction;
use Illuminate\Http\Request;

class BalanceTransactionController extends Controller
{
    /**
     * Menyimpan transaksi saldo (Top-up / Withdraw) ke MySQL.
     */
    public function store(Request $request)
    {
        // 1. Validasi Input
        $validated = $request->validate([
            'type'   => 'required|in:topup,withdraw,transfer',
            'amount' => 'required|numeric|min:1000',
        ]);

        try {
            // 2. Simpan ke tabel balance_transactions
            // user_id sementara diset 1 sebelum ada sistem login
            $transaction = BalanceTransaction::create([
                'user_id' => 1,
                'type'    => $validated['type'],
                'amount'  => $validated['amount'],
                'status'  => 'success', // Langsung sukses untuk simulasi awal
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi ' . $validated['type'] . ' berhasil dicatat!',
                'data'    => $transaction
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mencatat transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menampilkan riwayat transaksi saldo.
     */
    public function index()
    {
        $history = BalanceTransaction::where('user_id', 1)->latest()->get();
        return response()->json($history);
    }
}