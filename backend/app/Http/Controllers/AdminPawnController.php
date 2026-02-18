<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminPawnController extends Controller
{
    /**
     * Get List Pengajuan Gadai untuk Dashboard Admin
     */
    public function index(Request $request)
    {
        // Filter status berdasarkan tab (Permintaan Baru = pending)
        $status = $request->query('status') === 'history' ? 'completed' : 'pending';

        $data = DB::table('pawn_transactions')
            ->join('users', 'pawn_transactions.user_id', '=', 'users.id')
            ->select(
                'pawn_transactions.*', 
                'users.name as user_name', 
                'users.member_id'
            )
            ->where('pawn_transactions.status', $status)
            ->orderBy('pawn_transactions.created_at', 'desc')
            ->get();

        return response()->json($data);
    }

    /**
     * Setujui Gadai (Approve) & Cairkan Dana ke Tapro
     */
    public function approve(Request $request, $id)
    {
        return DB::transaction(function () use ($id) {
            $pawn = DB::table('pawn_transactions')->where('id', $id)->first();
            if (!$pawn || $pawn->status !== 'pending') {
                return response()->json(['message' => 'Data tidak ditemukan'], 404);
            }

            // 1. Update status gadai menjadi approved
            DB::table('pawn_transactions')->where('id', $id)->update([
                'status' => 'approved',
                'updated_at' => now()
            ]);

            // 2. Tambah Saldo Tapro User secara otomatis
            DB::table('users')->where('id', $pawn->user_id)->increment('tapro_balance', $pawn->loan_amount);

            // 3. Catat riwayat saldo (balance_transactions)
            DB::table('balance_transactions')->insert([
                'user_id' => $pawn->user_id,
                'type' => 'pawn_disbursement',
                'amount' => $pawn->loan_amount,
                'status' => 'success',
                'description' => "Pencairan Gadai: " . $pawn->item_name,
                'transaction_code' => 'PWN-' . time(),
                'created_at' => now(),
            ]);

            return response()->json(['message' => 'Gadai disetujui & dana cair ke Tapro!']);
        });
    }
}