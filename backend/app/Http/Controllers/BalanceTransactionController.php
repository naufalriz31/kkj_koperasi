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
     * 1. HANDLE TOP UP (Upload Bukti Transfer)
     */
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'type' => 'required|in:topup', 
            'proof' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
        ]);

        $user = Auth::user();
        $amount = $request->amount;

        $proofPath = null;
        if ($request->hasFile('proof')) {
            $path = $request->file('proof')->store('transaction-proofs', 'public');
            $proofPath = url('/storage/' . $path);
        }

        return DB::transaction(function () use ($user, $amount, $request, $proofPath) {
            $txId = DB::table('balance_transactions')->insertGetId([
                'user_id' => $user->id,
                'type' => 'topup',
                'amount' => $amount,
                'status' => 'pending', // Menunggu Admin
                'proof_url' => $proofPath,
                'description' => 'Isi Saldo Tapro via Transfer',
                'transaction_code' => 'TOPUP-' . time() . rand(100, 999),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Notifikasi ke User
            DB::table('notifications')->insert([
                'user_id' => $user->id,
                'title' => 'Top Up Diproses',
                'message' => 'Permintaan Rp ' . number_format($amount) . ' sedang diverifikasi admin.',
                'type' => 'info',
                'is_read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Top Up berhasil diajukan. Tunggu verifikasi admin.',
                'transaction_id' => $txId
            ], 201);
        });
    }

    /**
     * 2. HANDLE TRANSAKSI KELUAR (Transfer, Setor Simpanan, Withdraw)
     * Menggunakan PIN sebagai validasi
     */
    public function transfer(Request $request)
    {
        // A. Validasi Input
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'pin'    => 'required|string', 
            'type'   => 'required|string', // 'internal', 'external', 'withdraw'
        ]);

        $user = Auth::user(); 
        $amount = $request->amount;

        // B. Cek PIN (Wajib)
        if (!$user->pin || $user->pin !== $request->pin) {
            return response()->json(['message' => 'PIN Transaksi Salah!'], 401);
        }

        // C. Cek Saldo Cukup
        if ($user->tapro_balance < $amount) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi.'], 400);
        }

        // D. Eksekusi Database (Pakai Try-Catch agar tidak Loading Terus jika Error)
        try {
            return DB::transaction(function () use ($user, $amount, $request) {
                
                // Variabel default
                $status = 'success';
                $code = time();
                $desc = '';
                $proofUrl = null;

                // --- SKENARIO 1: SETOR SIMPANAN (INTERNAL) ---
                if ($request->type === 'internal') {
                    $target = $request->target_account ?? 'simwa_balance';
                    
                    // Cek nama kolom valid agar tidak error SQL
                    $validTargets = [
                        'simwa_balance', 'simpok_balance', 'simade_balance',
                        'sipena_balance', 'sihara_balance', 'siqurma_balance',
                        'siuji_balance', 'siwalima_balance'
                    ];

                    if (!in_array($target, $validTargets)) {
                        throw new \Exception("Jenis simpanan tidak valid.");
                    }

                    // Potong Tapro -> Tambah Simpanan
                    DB::table('users')->where('id', $user->id)->decrement('tapro_balance', $amount);
                    DB::table('users')->where('id', $user->id)->increment($target, $amount);

                    $desc = "Setor ke " . $this->getAccountName($target);
                    $code = 'INT-' . time();
                }

                // --- SKENARIO 2: TRANSFER SESAMA (EXTERNAL) ---
                else if ($request->type === 'external') {
                    $receiver = User::where('phone', $request->to_phone)->first();
                    if (!$receiver) throw new \Exception("Penerima tidak ditemukan");
                    if ($receiver->id === $user->id) throw new \Exception("Tidak bisa transfer ke diri sendiri");

                    // Potong Sender -> Tambah Receiver
                    DB::table('users')->where('id', $user->id)->decrement('tapro_balance', $amount);
                    DB::table('users')->where('id', $receiver->id)->increment('tapro_balance', $amount);

                    // Notif ke Penerima
                    DB::table('notifications')->insert([
                        'user_id' => $receiver->id,
                        'title' => 'Dana Masuk! 💸',
                        'message' => "Terima Rp " . number_format($amount) . " dari " . $user->name,
                        'type' => 'success',
                        'is_read' => 0, 'created_at' => now(), 'updated_at' => now()
                    ]);

                    $desc = "Transfer ke " . $receiver->name;
                    $code = 'TRF-' . time();
                }

                // --- SKENARIO 3: TARIK TUNAI (WITHDRAW) ---
                else if ($request->type === 'withdraw') {
                    // Potong saldo sekarang juga
                    DB::table('users')->where('id', $user->id)->decrement('tapro_balance', $amount);

                    $bankInfo = $request->bank_name ? " ({$request->bank_name})" : "";
                    $desc = "Penarikan Tunai" . $bankInfo;
                    $code = 'WD-' . time();
                    
                    // Status Pending karena butuh Admin transfer uang fisik/bank
                    $status = 'pending'; 
                } 
                
                else {
                    throw new \Exception("Tipe transaksi tidak dikenali");
                }

                // --- SIMPAN RIWAYAT TRANSAKSI ---
                DB::table('balance_transactions')->insert([
                    'user_id' => $user->id,
                    'type' => $request->type === 'internal' ? 'transfer_internal' : $request->type,
                    'amount' => -$amount, // Negatif = Uang Keluar
                    'status' => $status,
                    'description' => $desc,
                    'transaction_code' => $code,
                    'proof_url' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // --- AMBIL DATA TERBARU UNTUK FRONTEND ---
                $freshUser = User::find($user->id);

                return response()->json([
                    'message' => 'Transaksi Berhasil!',
                    'user' => $freshUser // Frontend pakai ini untuk update saldo realtime
                ]);
            });

        } catch (\Exception $e) {
            // Tangkap error agar frontend tidak stuck loading
            return response()->json(['message' => 'Gagal: ' . $e->getMessage()], 500);
        }
    }

    /**
     * 3. LIST RIWAYAT
     */
    public function index(Request $request) {
        $transactions = DB::table('balance_transactions')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($transactions);
    }

    // Helper Nama Simpanan
    private function getAccountName($column) {
        $names = [
            'simwa_balance' => 'Simpanan Wajib',
            'simpok_balance' => 'Simpanan Pokok',
            'simade_balance' => 'Simpanan Masa Depan',
            'sipena_balance' => 'Simpanan Pendidikan',
            'sihara_balance' => 'Simpanan Hari Raya',
            'siqurma_balance' => 'Simpanan Qurban',
            'siuji_balance' => 'Simpanan Haji/Umroh',
            'siwalima_balance' => 'Simpanan Walimah',
        ];
        return $names[$column] ?? 'Simpanan Lain';
    }
}