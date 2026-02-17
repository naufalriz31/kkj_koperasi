<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CreditCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    // =========================================================================
    // 1. DASHBOARD & FINANCIAL STATS
    // =========================================================================
    public function getStats()
    {
        return response()->json([
            'pending_users_count' => User::where('status', 'pending')->count(),
            'pending_transactions_count' => DB::table('transactions')->where('status', 'pending')->count(),
            'pending_loans_count' => DB::table('loans')->where('status', 'pending')->count(),
            'pending_restructures_count' => DB::table('loans')->where('restructure_status', 'pending')->count(),
            'pending_tamasa_count' => DB::table('tamasa_transactions')->where('status', 'pending')->count(),
            'pending_pawn_count' => DB::table('pawn_transactions')->where('status', 'pending')->count(),
            'pending_orders_count' => DB::table('shop_orders')->where('status', 'diproses')->count(),
            'pending_lhu_count' => DB::table('lhu_distributions')->where('status', 'waiting')->count(),
            'active_inflip_count' => DB::table('inflip_projects')->where('status', 'open')->count(),
            'pending_withdrawals_count' => DB::table('savings_withdrawals')->where('status', 'pending')->count(),
            'first_restructure_id' => DB::table('loans')->where('restructure_status', 'pending')->first()?->id
        ]);
    }

    public function getProfitLoss()
    {
        $toko = DB::table('shop_orders')->where('status', 'selesai')->sum('total_amount');
        $tamasa = DB::table('tamasa_transactions')->where('status', 'approved')->sum('setoran') * 0.05;
        $gadai = DB::table('pawn_transactions')->where('status', 'approved')->count() * 10000;
        $lhu = DB::table('lhu_distributions')->orderBy('created_at', 'desc')->first();

        return response()->json([
            'toko_income' => (int)$toko,
            'tamasa_margin' => (int)$tamasa,
            'gadai_fees' => (int)$gadai,
            'total_income' => (int)($toko + $tamasa + $gadai),
            'operational_costs' => $lhu ? (int)$lhu->operational_cost : 0
        ]);
    }

    // =========================================================================
    // 2. USER MANAGEMENT
    // =========================================================================
    public function indexUsers(Request $request)
    {
        $status = $request->query('status', 'pending');
        return response()->json(User::where('role', '!=', 'admin')->where('status', $status)->latest()->get());
    }

    public function verifyUser($id)
    {
        $user = User::findOrFail($id);
        $memberId = 'KKJ' . date('Ymd') . str_pad($user->id, 4, '0', STR_PAD_LEFT);
        $user->update(['status' => 'active', 'member_id' => $memberId]);
        
        $this->sendNotification($user->id, 'Akun Terverifikasi ✅', 'Akun Anda aktif. Silakan gunakan layanan KKJ.');
        return response()->json(['message' => 'User verified', 'member_id' => $memberId]);
    }

    // =========================================================================
    // 3. TAMASA (EMAS) MANAGEMENT
    // =========================================================================
    public function indexTamasa(Request $request)
    {
        $status = $request->query('status', 'pending');
        $data = DB::table('tamasa_transactions')
            ->join('users', 'tamasa_transactions.user_id', '=', 'users.id')
            ->select('tamasa_transactions.*', 'users.name', 'users.member_id')
            ->where('tamasa_transactions.status', $status)
            ->latest()->get();

        $currentPrice = DB::table('gold_prices')->latest()->first();

        return response()->json([
            'current_price' => $currentPrice ? $currentPrice->buy_price : 0,
            'transactions' => $data
        ]);
    }

    public function updateGoldPrice(Request $request)
    {
        DB::table('gold_prices')->insert([
            'buy_price' => $request->buy_price,
            'created_at' => now()
        ]);
        return response()->json(['message' => 'Harga emas diperbarui']);
    }

    public function approveTamasa($id)
    {
        $tx = DB::table('tamasa_transactions')->where('id', $id)->first();
        DB::transaction(function () use ($tx) {
            DB::table('tamasa_balances')->updateOrInsert(
                ['user_id' => $tx->user_id],
                ['total_gram' => DB::raw("total_gram + $tx->estimasi_gram")]
            );
            DB::table('tamasa_transactions')->where('id', $tx->id)->update(['status' => 'approved', 'approved_at' => now()]);
        });
        return response()->json(['message' => 'TAMASA Approved']);
    }

    // =========================================================================
    // 4. GADAI MANAGEMENT
    // =========================================================================
    public function indexPawn(Request $request)
    {
        $status = $request->query('status', 'pending');
        $data = DB::table('pawn_transactions')
            ->join('users', 'pawn_transactions.user_id', '=', 'users.id')
            ->select('pawn_transactions.*', 'users.name', 'users.member_id')
            ->where('pawn_transactions.status', $status)
            ->latest()->get();
        return response()->json($data);
    }

    public function approvePawn(Request $request, $id)
    {
        DB::transaction(function () use ($request, $id) {
            $pawn = DB::table('pawn_transactions')->where('id', $id)->first();
            User::where('id', $pawn->user_id)->increment('tapro_balance', $request->loan_amount);
            DB::table('pawn_transactions')->where('id', $id)->update([
                'status' => 'approved', 
                'loan_amount' => $request->loan_amount
            ]);
            DB::table('transactions')->insert([
                'user_id' => $pawn->user_id, 'type' => 'topup', 'amount' => $request->loan_amount,
                'status' => 'success', 'description' => "Pencairan Gadai: $pawn->item_name", 'created_at' => now()
            ]);
        });
        return response()->json(['message' => 'Gadai dicairkan']);
    }

    // =========================================================================
    // 5. PENARIKAN SIMPANAN (WITHDRAWALS)
    // =========================================================================
    public function indexWithdrawals(Request $request)
    {
        $status = $request->query('status', 'pending');
        $data = DB::table('savings_withdrawals')
            ->join('users', 'savings_withdrawals.user_id', '=', 'users.id')
            ->select('savings_withdrawals.*', 'users.name', 'users.member_id', 'users.tapro_balance', 'users.simwa_balance', 'users.simpok_balance')
            ->where('savings_withdrawals.status', $status)
            ->latest()->get();
        return response()->json($data);
    }

    public function approveWithdrawal($id)
    {
        $req = DB::table('savings_withdrawals')->where('id', $id)->first();
        $column = $req->type . '_balance';

        DB::transaction(function () use ($req, $column, $id) {
            User::where('id', $req->user_id)->decrement($column, $req->amount);
            DB::table('savings_withdrawals')->where('id', $id)->update(['status' => 'approved']);
            DB::table('transactions')->insert([
                'user_id' => $req->user_id, 'type' => 'withdraw', 'amount' => $req->amount,
                'status' => 'success', 'description' => "Penarikan: " . strtoupper($req->type), 'created_at' => now()
            ]);
        });
        return response()->json(['message' => 'Penarikan disetujui']);
    }

    // =========================================================================
    // 6. LHU EXECUTION
    // =========================================================================
    public function executeLhu($id)
    {
        $dist = DB::table('lhu_distributions')->where('id', $id)->first();
        $details = DB::table('lhu_member_details')->where('lhu_id', $id)->get();

        DB::transaction(function () use ($details, $dist, $id) {
            foreach ($details as $item) {
                User::where('id', $item->user_id)->increment('tapro_balance', $item->total_received);
                DB::table('transactions')->insert([
                    'user_id' => $item->user_id, 'type' => 'topup', 'amount' => $item->total_received,
                    'status' => 'success', 'description' => "LHU $dist->period_month/$dist->period_year", 'created_at' => now()
                ]);
            }
            DB::table('lhu_distributions')->where('id', $id)->update(['status' => 'approved']);
        });
        return response()->json(['message' => 'LHU dicairkan']);
    }

    // =========================================================================
    // HELPERS & CATALOG
    // =========================================================================
    private function sendNotification($userId, $title, $message)
    {
        DB::table('notifications')->insert([
            'user_id' => $userId, 'title' => $title, 'message' => $message,
            'type' => 'info', 'created_at' => now()
        ]);
    }

    public function indexCatalog() { return response()->json(CreditCatalog::latest()->get()); }
    
    public function storeCatalog(Request $request) {
        $item = CreditCatalog::create($request->all());
        return response()->json($item, 201);
    }

    public function updateCatalog(Request $request, $id) {
        $item = CreditCatalog::findOrFail($id);
        $item->update($request->all());
        return response()->json($item);
    }

    public function deleteCatalog($id) {
        CreditCatalog::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}