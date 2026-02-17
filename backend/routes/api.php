<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Import Semua Controller
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BalanceTransactionController;
use App\Http\Controllers\PawnTransactionController;
use App\Http\Controllers\SavingsController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\GoldController;
use App\Http\Controllers\FinancingController;
use App\Http\Controllers\InflipController;
use App\Http\Controllers\LhuController;
use App\Http\Controllers\KabarController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// =========================================================================
// 1. PUBLIC ROUTES
// =========================================================================

// Solusi untuk error "Route [login] not defined" saat akses via browser
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated. Silakan login melalui aplikasi.'], 401);
})->name('login');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/shop/products', [ShopController::class, 'index']); 
Route::get('/kabar', [KabarController::class, 'indexActive']); 


// =========================================================================
// 2. PROTECTED ROUTES (Member & Admin)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // --- USER PROFILE & SILA CONTEXT ---
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::get('/user/financial-summary', [UserController::class, 'getSilaContext']); 
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- WALLET & BALANCE ---
    Route::get('/balance/history', [BalanceTransactionController::class, 'index']); 
    Route::post('/balance/topup', [BalanceTransactionController::class, 'store']); 
    Route::post('/transfer', [BalanceTransactionController::class, 'transfer']); 

    // --- PAWN (PEGADAIAN) ---
    Route::post('/pawn/apply', [PawnTransactionController::class, 'store']); 

    // --- GOLD (TAMASA) ---
    Route::get('/gold/info', [GoldController::class, 'info']); 
    Route::post('/gold/buy', [GoldController::class, 'buy']);  

    // --- INFLIP (PROPERTI) ---
    Route::get('/inflip/projects', [InflipController::class, 'indexUser']); 
    Route::post('/inflip/invest', [InflipController::class, 'invest']); 

    // --- FINANCING (PEMBIAYAAN) ---
    Route::get('/financing/catalog', [AdminController::class, 'indexCatalog']); 
    Route::post('/financing/apply', [FinancingController::class, 'apply']); 

    // --- NOTIFICATIONS ---
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // =========================================================================
    // 3. ADMIN ONLY ROUTES
    // =========================================================================
    Route::prefix('admin')->group(function () {
        
        // Dashboard
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/financial/profit-loss', [AdminController::class, 'getProfitLoss']);

        // Manajemen Anggota
        Route::get('/users', [AdminController::class, 'indexUsers']);
        Route::post('/users/{id}/verify', [AdminController::class, 'verifyUser']);
        Route::post('/users/{id}/reject', [AdminController::class, 'rejectUser']);
        Route::post('/users/{id}/reset-pin', [AdminController::class, 'resetPin']);

        // Manajemen Transaksi
        Route::get('/transactions', [AdminController::class, 'indexTransactions']);
        Route::post('/transactions/{id}/approve', [AdminController::class, 'approveTransaction']);

        // Manajemen Katalog Barang (Gudang Kredit)
        Route::get('/catalog', [AdminController::class, 'indexCatalog']);
        Route::post('/catalog', [AdminController::class, 'storeCatalog']);
        Route::put('/catalog/{id}', [AdminController::class, 'updateCatalog']);
        Route::delete('/catalog/{id}', [AdminController::class, 'deleteCatalog']);

        // Manajemen Toko (Pelengkap rute CRUD)
        Route::get('/shop/products', [AdminController::class, 'indexShopProducts']);
        Route::post('/shop/products', [AdminController::class, 'storeShopProduct']);
        Route::post('/shop/upload', [AdminController::class, 'uploadShopImage']);
        Route::delete('/shop/products/{id}', [AdminController::class, 'deleteShopProduct']);

        // Manajemen TAMASA
        Route::get('/tamasa', [AdminController::class, 'indexTamasa']); 
        Route::post('/tamasa/price', [AdminController::class, 'updateGoldPrice']);
        Route::post('/tamasa/transactions/{id}/approve', [AdminController::class, 'approveTamasa']);

        // Manajemen Gadai
        Route::get('/pawn/transactions', [AdminController::class, 'indexPawn']);
        Route::post('/pawn/transactions/{id}/approve', [AdminController::class, 'approvePawn']);
        Route::post('/pawn/transactions/{id}/reject', [AdminController::class, 'rejectPawn']);

        // Manajemen Penarikan Simpanan
        Route::get('/savings/withdrawals', [AdminController::class, 'indexWithdrawals']);
        Route::post('/savings/withdrawals/{id}/approve', [AdminController::class, 'approveWithdrawal']);

        // Manajemen LHU
        Route::get('/lhu', [AdminController::class, 'indexLhu']);
        Route::post('/lhu/generate', [AdminController::class, 'generateLhu']);
        Route::post('/lhu/{id}/execute', [AdminController::class, 'executeLhu']);

        // Manajemen Kabar
        Route::get('/kabar', [KabarController::class, 'index']);
        Route::get('/kabar/{id}', [KabarController::class, 'show']);
        Route::post('/kabar', [KabarController::class, 'store']);
        Route::put('/kabar/{id}', [KabarController::class, 'update']);
        Route::patch('/kabar/{id}/toggle', [KabarController::class, 'toggleActive']);
        Route::delete('/kabar/{id}', [KabarController::class, 'destroy']);

        // Manajemen INFLIP
        Route::get('/inflip', [InflipController::class, 'indexAdmin']);
        Route::post('/inflip', [InflipController::class, 'store']);
        Route::put('/inflip/{id}', [InflipController::class, 'update']);
        Route::delete('/inflip/{id}', [InflipController::class, 'destroy']);
    });
});