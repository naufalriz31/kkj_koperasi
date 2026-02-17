<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
// Import Controller yang sudah kita buat tadi
use App\Http\Controllers\PawnTransactionController;
use App\Http\Controllers\BalanceTransactionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 1. Alamat untuk mengambil data user (Bawaan Laravel Sanctum)
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// 2. Alamat untuk Transaksi Gadai (Pawn)
// Endpoint: POST http://127.0.0.1:8000/api/pawn
Route::post('/pawn', [PawnTransactionController::class, 'store']);
Route::get('/pawn', [PawnTransactionController::class, 'index']);

// 3. Alamat untuk Transaksi Saldo (Topup/Withdraw)
// Endpoint: POST http://127.0.0.1:8000/api/balance
Route::post('/balance', [BalanceTransactionController::class, 'store']);
Route::get('/balance', [BalanceTransactionController::class, 'index']);