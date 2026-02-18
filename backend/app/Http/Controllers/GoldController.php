<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GoldController extends Controller
{
    public function info()
    {
        $price = DB::table('gold_prices')->latest()->first();
        return response()->json($price);
    }

    public function buy(Request $request)
    {
        // Logika beli emas sementara
        return response()->json(['message' => 'Fitur beli emas akan segera hadir']);
    }

    public function sell(Request $request)
    {
        return response()->json(['message' => 'Fitur jual emas akan segera hadir']);
    }
}