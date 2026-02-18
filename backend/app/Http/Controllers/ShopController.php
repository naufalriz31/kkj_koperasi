<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class ShopController extends Controller
{
    /**
     * =========================================================================
     * 1. KATALOG PEMBIAYAAN (KHUSUS ELEKTRONIK / CICILAN)
     * =========================================================================
     * Digunakan oleh Formulir Pembiayaan untuk simulasi angsuran.
     * Hanya menampilkan barang dengan category 'kredit' (HP, TV, Motor).
     */
    public function index()
    {
        // [FIX]: Filter hanya kategori 'kredit' agar Sembako tidak muncul di sini
        $products = DB::table('credit_catalog')
            ->where('category', 'kredit') 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($products);
    }

    /**
     * =========================================================================
     * 2. KATALOG BELANJA (KHUSUS BAHAN POKOK / TUNAI)
     * =========================================================================
     * Digunakan oleh Dashboard Utama untuk pembelian langsung (Self-Pickup).
     * Hanya menampilkan barang dengan category 'belanja' (Beras, Gula, Ikan).
     */
    public function indexStore()
    {
        // [FIX]: Filter hanya kategori 'belanja' agar HP/TV tidak muncul di katalog toko
        $products = DB::table('credit_catalog')
            ->where('category', 'belanja') 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($products);
    }

    /**
     * =========================================================================
     * 3. PROSES CHECKOUT (PEMBAYARAN TUNAI)
     * =========================================================================
     * Menggunakan saldo Tapro untuk pembelian langsung di katalog belanja.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'pin'         => 'required',
            'items'       => 'required|array',
            'total_price' => 'required|numeric'
        ]);

        $user = User::find(Auth::id());

        // 1. Validasi PIN Keamanan
        if ($user->pin !== $request->pin) {
            return response()->json(['message' => 'PIN yang Anda masukkan salah'], 403);
        }

        // 2. Validasi Saldo Tapro (Dompet Digital Member)
        if ($user->tapro_balance < $request->total_price) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi'], 400);
        }

        return DB::transaction(function () use ($user, $request) {
            // 3. Potong Saldo Member
            $user->decrement('tapro_balance', $request->total_price);

            // 4. Catat Transaksi Induk (Order)
            $orderId = DB::table('shop_orders')->insertGetId([
                'user_id'          => $user->id,
                'total_price'      => $request->total_price,
                'status'           => 'diproses',
                'transaction_code' => 'INV-' . strtoupper(uniqid()),
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            // 5. Catat Rincian Item yang Dibeli (Order Items)
            foreach ($request->items as $item) {
                DB::table('shop_order_items')->insert([
                    'order_id'     => $orderId,
                    'product_name' => $item['name'],
                    'price'        => $item['price'],
                    'quantity'     => $item['quantity'],
                    'created_at'   => now(),
                ]);
            }

            // 6. Catat di Riwayat Transaksi Saldo (History Transaksi)
            DB::table('balance_transactions')->insert([
                'user_id'          => $user->id,
                'type'             => 'purchase',
                'amount'           => -$request->total_price,
                'status'           => 'success',
                'description'      => "Pembelian di Katalog Belanja #$orderId",
                'transaction_code' => 'TX-' . strtoupper(uniqid()),
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            // 7. Kirim Notifikasi Aplikasi
            DB::table('notifications')->insert([
                'user_id'    => $user->id,
                'title'      => 'Pesanan Berhasil 🛒',
                'message'    => 'Pesanan Anda senilai ' . number_format($request->total_price) . ' sedang diproses.',
                'type'       => 'success',
                'is_read'    => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message'  => 'Pesanan berhasil dibuat',
                'order_id' => $orderId,
                'user'     => $user
            ]);
        });
    }
}