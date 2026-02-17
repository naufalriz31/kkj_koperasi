<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index() {
    return DB::table('shop_products')->where('is_active', true)->get();
}

public function checkout(Request $request) {
    // Validasi PIN User di sini
    // Validasi Saldo
    // Insert ke tabel shop_orders & shop_order_items
    // Insert notifikasi
    return response()->json(['message' => 'Order created']);
}
    //
}
