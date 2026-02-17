<?php

namespace App\Http\Controllers;

use App\Models\PawnTransaction;
use Illuminate\Http\Request;

class PawnTransactionController extends Controller
{
    /**
     * Menyimpan data pengajuan gadai baru dari Frontend.
     */
    public function store(Request $request)
    {
        // 1. Validasi Input
        // Memastikan barang dan nominal sudah diisi dan sesuai format
        $validated = $request->validate([
            'item_name'   => 'required|string|max:255',
            'loan_amount' => 'required|numeric|min:1000',
        ]);

        try {
            // 2. Simpan ke Database MySQL (Tabel: pawn_transactions)
            // Sementara user_id diset ke 1 (karena belum ada sistem login)
            $transaction = PawnTransaction::create([
                'user_id'     => 1, 
                'item_name'   => $validated['item_name'],
                'loan_amount' => $validated['loan_amount'],
                'status'      => 'pending', // Status awal pengajuan
            ]);

            // 3. Respon Sukses
            return response()->json([
                'status'  => 'success',
                'message' => 'Pengajuan gadai berhasil disimpan di MySQL!',
                'data'    => $transaction
            ], 201);

        } catch (\Exception $e) {
            // Respon jika terjadi kesalahan server
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menyimpan data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mengambil semua daftar transaksi gadai (opsional).
     */
    public function index()
    {
        $transactions = PawnTransaction::all();
        return response()->json($transactions);
    }
}