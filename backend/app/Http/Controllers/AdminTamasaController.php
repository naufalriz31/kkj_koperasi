<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AdminPawnController extends Controller
{
    /**
     * Get List Pengajuan Gadai untuk Dashboard Admin
     * Sinkron dengan tab 'Permintaan Baru' dan 'Riwayat' di Frontend
     */
    public function index(Request $request)
    {
        // Filter status berdasarkan query params dari React
        // Jika status=history, ambil data yang sudah diproses
        $status = $request->query('status') === 'history' 
            ? ['approved', 'completed', 'rejected'] 
            : ['pending'];

        $data = DB::table('pawn_transactions')
            ->join('users', 'pawn_transactions.user_id', '=', 'users.id')
            ->select(
                'pawn_transactions.*', 
                'users.name as user_name', 
                'users.member_id'
            )
            ->whereIn('pawn_transactions.status', $status)
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
                return response()->json(['message' => 'Data tidak ditemukan atau sudah diproses'], 404);
            }

            // 1. Update status gadai menjadi approved
            DB::table('pawn_transactions')->where('id', $id)->update([
                'status' => 'approved',
                'updated_at' => now()
            ]);

            // 2. Tambah Saldo Tapro User secara otomatis (Pencairan Dana)
            DB::table('users')->where('id', $pawn->user_id)->increment('tapro_balance', $pawn->loan_amount);

            // 3. Catat riwayat saldo di balance_transactions agar muncul di dompet user
            DB::table('balance_transactions')->insert([
                'user_id' => $pawn->user_id,
                'type' => 'pawn_disbursement',
                'amount' => $pawn->loan_amount,
                'status' => 'success',
                'description' => "Pencairan Gadai: " . $pawn->item_name,
                'transaction_code' => 'PWN-' . strtoupper(uniqid()),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Kirim notifikasi ke user bahwa dana sudah cair
            DB::table('notifications')->insert([
                'user_id' => $pawn->user_id,
                'title' => 'Gadai Disetujui! ✅',
                'message' => "Dana gadai {$pawn->item_name} sebesar " . number_format($pawn->loan_amount) . " telah masuk ke Saldo Tapro.",
                'type' => 'success',
                'is_read' => 0,
                'created_at' => now(),
            ]);

            return response()->json(['message' => 'Gadai disetujui & dana cair ke Tapro!']);
        });
    }

    /**
     * Tolak Pengajuan Gadai (Reject)
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string'
        ]);

        $pawn = DB::table('pawn_transactions')->where('id', $id)->first();

        if (!$pawn || $pawn->status !== 'pending') {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        DB::table('pawn_transactions')->where('id', $id)->update([
            'status' => 'rejected',
            'updated_at' => now()
        ]);

        // Notifikasi penolakan
        DB::table('notifications')->insert([
            'user_id' => $pawn->user_id,
            'title' => 'Gadai Ditolak ❌',
            'message' => "Mohon maaf, pengajuan gadai {$pawn->item_name} ditolak. " . ($request->reason ? "Alasan: " . $request->reason : ""),
            'type' => 'danger',
            'is_read' => 0,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Pengajuan gadai berhasil ditolak.']);
    }
}