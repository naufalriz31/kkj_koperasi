<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CreditCatalog; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // =========================================================================
    // 1. DASHBOARD & FINANCIAL STATS
    // =========================================================================
    
    /**
     * Mengambil data statistik untuk Badge Notifikasi di Dashboard Admin
     */
    public function getStats()
    {
        return response()->json([
            'total_users' => User::count(),
            'pending_users_count' => User::where('status', 'pending')->count(),
            'pending_transactions_count' => DB::table('balance_transactions')->where('status', 'pending')->count(),
            'pending_loans_count' => DB::table('financing_transactions')->where('status', 'pending')->count(), 
            'pending_tamasa_count' => DB::table('tamasa_transactions')->where('status', 'pending')->count(),
            'pending_pawn_count' => DB::table('pawn_transactions')->where('status', 'pending')->count(),
            'pending_orders_count' => DB::table('shop_orders')->where('status', 'diproses')->count(),
            'pending_lhu_count' => DB::table('lhu_distributions')->where('status', 'waiting')->count(),
            'active_inflip_count' => DB::table('inflip_projects')->where('status', 'open')->count(),
            'pending_withdrawals_count' => DB::table('savings_withdrawals')->where('status', 'pending')->count(),
        ]);
    }

    /**
     * Menghitung estimasi Laba Rugi Koperasi
     */
    public function getProfitLoss()
    {
        $toko = DB::table('shop_orders')->where('status', 'selesai')->sum('total_price') ?? 0;
        $tamasa = DB::table('tamasa_transactions')->where('status', 'approved')->sum('amount') * 0.05; 
        $gadai = DB::table('pawn_transactions')->where('status', 'approved')->count() * 10000;
        
        $lhu = DB::table('lhu_distributions')->orderBy('created_at', 'desc')->first();

        return response()->json([
            'toko_income' => (int)$toko,
            'tamasa_margin' => (int)$tamasa,
            'gadai_fees' => (int)$gadai,
            'total_income' => (int)($toko + $tamasa + $gadai),
            'operational_costs' => $lhu ? (int)$lhu->total_profit : 0 
        ]);
    }

    // =========================================================================
    // 2. USER MANAGEMENT (Verifikasi Anggota)
    // =========================================================================

    public function indexUsers(Request $request)
    {
        $query = User::where('role', '!=', 'admin');

        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->whereIn('status', ['active', 'rejected']); 
            } else {
                $query->where('status', $request->status);
            }
        }

        return response()->json($query->latest()->get());
    }

    public function verifyUser($id)
    {
        $user = User::findOrFail($id);
        $memberId = 'KKJ' . date('Ymd') . str_pad($user->id, 4, '0', STR_PAD_LEFT);
        
        $user->update([
            'status' => 'active', 
            'member_id' => $memberId,
            'email_verified_at' => now()
        ]);
        
        $this->sendNotification($user->id, 'Akun Terverifikasi ✅', 'Selamat! Akun Anda telah aktif.');
        
        return response()->json(['message' => 'User berhasil diverifikasi', 'member_id' => $memberId, 'user' => $user]);
    }

    public function rejectUser($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'rejected']);
        return response()->json(['message' => 'Pendaftaran ditolak', 'user' => $user]);
    }

    public function resetPin($id)
    {
        $user = User::findOrFail($id);
        $user->update(['pin' => null]);
        $this->sendNotification($user->id, 'PIN Direset 🔒', 'Admin telah mereset PIN Anda.');
        return response()->json(['message' => 'PIN berhasil direset']);
    }

    // =========================================================================
    // 3. TRANSACTION MANAGEMENT (TOP UP & WITHDRAW)
    // =========================================================================

    public function indexTransactions(Request $request)
    {
        $status = $request->query('status', 'pending');
        $query = DB::table('balance_transactions')
            ->join('users', 'balance_transactions.user_id', '=', 'users.id')
            ->select('balance_transactions.*', 'users.name as user_name', 'users.member_id', 'users.email');

        if (in_array($status, ['history', 'success', 'approved', 'riwayat'])) {
            $query->where('balance_transactions.status', '!=', 'pending');
        } else {
            $query->where('balance_transactions.status', 'pending');
        }

        return response()->json($query->latest()->get());
    }

    public function approveTransaction($id)
    {
        $tx = DB::table('balance_transactions')->where('id', $id)->first();
        if (!$tx || $tx->status !== 'pending') return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);

        DB::transaction(function () use ($tx) {
            if ($tx->type === 'topup') User::where('id', $tx->user_id)->increment('tapro_balance', $tx->amount);
            DB::table('balance_transactions')->where('id', $tx->id)->update(['status' => 'success', 'updated_at' => now()]);
            $this->sendNotification($tx->user_id, 'Transaksi Berhasil ✅', "Top Up sebesar Rp " . number_format($tx->amount) . " telah disetujui.");
        });

        return response()->json(['message' => 'Transaksi disetujui']);
    }

    // =========================================================================
    // 4. MANAGEMENT PEMBIAYAAN & KATALOG (ADMIN)
    // =========================================================================

    /**
     * Mengambil semua pengajuan pembiayaan dari member
     */
    public function getAllFinancings(Request $request)
    {
        $status = $request->query('status', 'pending');
        $query = DB::table('financing_transactions')
            ->join('users', 'financing_transactions.user_id', '=', 'users.id')
            ->select('financing_transactions.*', 'users.name as user_name', 'users.member_id');

        if ($status === 'pending') {
            $query->where('financing_transactions.status', 'pending');
        } elseif ($status === 'approved') {
            $query->where('financing_transactions.status', 'approved');
        } else {
            $query->whereIn('financing_transactions.status', ['rejected', 'completed']);
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Menyetujui pengajuan pembiayaan member
     */
    public function approveFinancing($id)
    {
        $find = DB::table('financing_transactions')->where('id', $id)->first();
        if (!$find) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        DB::table('financing_transactions')->where('id', $id)->update([
            'status' => 'approved',
            'updated_at' => now()
        ]);

        $this->sendNotification($find->user_id, 'Pembiayaan Disetujui 🟢', "Pengajuan $find->type Anda telah disetujui oleh Admin.");
        return response()->json(['message' => 'Pengajuan berhasil disetujui']);
    }

    /**
     * Menolak pengajuan pembiayaan member
     */
    public function rejectFinancing($id)
    {
        $find = DB::table('financing_transactions')->where('id', $id)->first();
        if (!$find) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        DB::table('financing_transactions')->where('id', $id)->update([
            'status' => 'rejected',
            'updated_at' => now()
        ]);

        $this->sendNotification($find->user_id, 'Pembiayaan Ditolak 🔴', "Mohon maaf, pengajuan $find->type Anda belum dapat kami setujui.");
        return response()->json(['message' => 'Pengajuan telah ditolak']);
    }

    // --- KATALOG CRUD ---
    public function indexCatalog() { return response()->json(CreditCatalog::latest()->get()); }
    
    public function storeCatalog(Request $request) 
    {
        $validated = $request->validate([
            'name' => 'required|string', 'price' => 'required|numeric',
            'category' => 'required|string', 'tenors' => 'required',
            'dp' => 'nullable|numeric', 'tax' => 'nullable|numeric', 'image_url' => 'nullable|string'
        ]);
        return response()->json(CreditCatalog::create($validated), 201);
    }

    public function updateCatalog(Request $request, $id) 
    {
        $item = CreditCatalog::findOrFail($id);
        $item->update($request->all());
        return response()->json($item);
    }

    public function deleteCatalog($id) 
    {
        CreditCatalog::findOrFail($id)->delete();
        return response()->json(['message' => 'Produk katalog berhasil dihapus']);
    }

    // =========================================================================
    // 5. HELPERS
    // =========================================================================
    
    private function sendNotification($userId, $title, $message)
    {
        DB::table('notifications')->insert([
            'user_id' => $userId, 'title' => $title, 'message' => $message,
            'is_read' => false, 'type' => 'info', 'created_at' => now(), 'updated_at' => now()
        ]);
    }
}