<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class PawnTransactionController extends Controller
{
    /**
     * =========================================================================
     * 1. FITUR GADAI (EMAS/BARANG) - Tabel: pawn_transactions
     * =========================================================================
     */

    public function store(Request $request)
    {
        $request->validate([
            'item_name'      => 'required|string|max:255',
            'item_weight'    => 'required|numeric', 
            'item_karat'     => 'required|string',
            'loan_amount'    => 'required|numeric|min:100000',
            'tenor_bulan'    => 'required|integer',
            'item_condition' => 'required|string',
            'image'          => 'required|image|mimes:jpeg,png,jpg|max:2048', 
        ]);

        $user = Auth::user();
        $path = $request->file('image')->store('pawn', 'public');
        $imageUrl = url('/storage/' . $path);

        return DB::transaction(function () use ($user, $request, $imageUrl) {
            $id = DB::table('pawn_transactions')->insertGetId([
                'user_id'        => $user->id,
                'item_name'      => $request->item_name,
                'weight'         => $request->item_weight,
                'karat'          => $request->item_karat,
                'loan_amount'    => $request->loan_amount,
                'tenor_months'   => $request->tenor_bulan,
                'condition_item' => $request->item_condition,
                'image_url'      => $imageUrl,
                'status'         => 'pending', 
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            DB::table('notifications')->insert([
                'user_id'    => $user->id,
                'title'      => 'Pengajuan Gadai Terkirim ⚖️',
                'message'    => 'Gadai barang ' . $request->item_name . ' sedang diverifikasi admin.',
                'type'       => 'info',
                'is_read'    => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Pengajuan berhasil!', 'id' => $id], 201);
        });
    }

    public function history()
    {
        $data = DB::table('pawn_transactions')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($data);
    }

    public function redeem(Request $request, $id)
    {
        $user = User::find(Auth::id());
        $pawn = DB::table('pawn_transactions')->where('id', $id)->first();

        if (!$pawn || $pawn->status !== 'approved') {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $loanAmount = (float) $pawn->loan_amount;
        $adminFee = round($loanAmount * 0.05); 
        $totalPay = $loanAmount + $adminFee;

        if ($user->tapro_balance < $totalPay) {
            return response()->json(['message' => 'Saldo tidak cukup'], 400);
        }

        return DB::transaction(function () use ($user, $pawn, $totalPay, $id) {
            $user->decrement('tapro_balance', $totalPay);
            DB::table('pawn_transactions')->where('id', $id)->update(['status' => 'completed', 'updated_at' => now()]);
            DB::table('balance_transactions')->insert([
                'user_id' => $user->id, 'type' => 'pawn_redeem', 'amount' => -$totalPay,
                'status' => 'success', 'description' => "Penebusan Gadai: " . $pawn->item_name,
                'transaction_code' => 'RD-' . strtoupper(uniqid()), 'created_at' => now()
            ]);
            return response()->json(['message' => 'Barang berhasil ditebus!', 'user' => $user]);
        });
    }

    /**
     * =========================================================================
     * 2. FITUR PEMBIAYAAN KATALOG - Tabel: financing_transactions
     * =========================================================================
     */

    public function storeFinancing(Request $request)
    {
        $request->validate([
            'type'            => 'required|string',
            'amount'          => 'required|numeric',
            'duration'        => 'required|integer',
            'monthly_payment' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            $user = Auth::user();
            $id = DB::table('financing_transactions')->insertGetId([
                'user_id'         => $user->id,
                'type'            => $request->type,
                'amount'          => $request->amount,
                'duration'        => $request->duration,
                'monthly_payment' => round($request->monthly_payment), 
                'details'         => json_encode($request->details),   
                'status'          => 'pending',
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);

            DB::table('notifications')->insert([
                'user_id' => $user->id, 'title' => 'Pengajuan Pembiayaan 📝',
                'message' => 'Pengajuan ' . $request->type . ' Anda telah kami terima.',
                'type' => 'info', 'is_read' => 0, 'created_at' => now()
            ]);

            return response()->json(['message' => 'Pengajuan berhasil dikirim!', 'id' => $id]);
        });
    }

    /**
     * Menampilkan daftar riwayat pengajuan pembiayaan member
     */
    public function financingHistory()
    {
        $data = DB::table('financing_transactions')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();
        return response()->json($data);
    }

    /**
     * [FIX]: Fungsi untuk menampilkan detail pinjaman dan jadwal angsuran
     * Diperlukan untuk masuk ke halaman image_ad4d37.jpg
     */
    public function show($id)
    {
        // 1. Ambil data utama pinjaman dari tabel financing_transactions
        $financing = DB::table('financing_transactions')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$financing) {
            return response()->json(['message' => 'Data pinjaman tidak ditemukan'], 404);
        }

        // 2. Ambil jadwal angsuran dari tabel financing_installments
        $installments = DB::table('financing_installments')
            ->where('financing_id', $id)
            ->orderBy('installment_number', 'asc')
            ->get();

        return response()->json([
            'financing' => $financing,
            'installments' => $installments
        ]);
    }
}