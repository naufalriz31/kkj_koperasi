<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Import All Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BalanceTransactionController;
use App\Http\Controllers\PawnTransactionController;
use App\Http\Controllers\AdminPawnController; 
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminTamasaController;
use App\Http\Controllers\KabarController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\InflipController;
use App\Http\Controllers\GoldTransactionController;

/*
|--------------------------------------------------------------------------
| API Routes - Koperasi KKJ Mitra Sejahtera
|--------------------------------------------------------------------------
*/

// =========================================================================
// 1. PUBLIC ROUTES (Tanpa Login)
// =========================================================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// [FIX]: Katalog Pembiayaan (Hanya untuk Simulasi Cicilan di Formulir)
Route::get('/shop/products', [ShopController::class, 'index']); 

// [NEW]: Katalog Belanja Toko (Hanya untuk Pembelian Tunai/Self-Pickup)
Route::get('/store/products', [ShopController::class, 'indexStore']); 

Route::get('/kabar', [KabarController::class, 'indexActive']); 
Route::get('/kabar/{id}', [KabarController::class, 'show']);

Route::get('/login-error', function () {
    return response()->json(['message' => 'Sesi berakhir. Silakan login kembali.'], 401);
})->name('login');


// =========================================================================
// 2. PROTECTED ROUTES (Wajib Login via Sanctum)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // --- PROFIL & AUTH ---
    Route::get('/user/profile', [AuthController::class, 'user']); 
    Route::post('/profile/update', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'updateAvatar']);
    Route::match(['post', 'put'], '/profile/pin', [AuthController::class, 'updatePin']); 
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- FINANSIAL & WALLET (MEMBER) ---
    Route::get('/balance/history', [BalanceTransactionController::class, 'index']); 
    Route::post('/balance/topup', [BalanceTransactionController::class, 'store']);  
    Route::post('/transfer', [BalanceTransactionController::class, 'transfer']);    
    Route::post('/check-user', [AuthController::class, 'checkUser']);               
    
    // [NEW]: Checkout Katalog Belanja (Bayar Tunai pake Saldo Tapro)
    Route::post('/shop/checkout', [ShopController::class, 'checkout']);

    // --- PROGRAM UNGGULAN (MEMBER) ---
    
    // MODUL PEMBIAYAAN / KREDIT BARANG (MEMBER)
    Route::prefix('financing')->group(function () {
        Route::post('/apply', [PawnTransactionController::class, 'storeFinancing']); 
        Route::get('/history', [PawnTransactionController::class, 'financingHistory']); 
        Route::get('/loan/{id}', [PawnTransactionController::class, 'show']); // Untuk image_ad4d37.jpg
        
        // [NEW]: Rute Pembayaran Angsuran (Bayar Cicilan Bulanan)
        Route::post('/pay-installment', [PawnTransactionController::class, 'payInstallment']); 
    });

    // TAMASA (Emas)
    Route::get('/gold/info', [GoldTransactionController::class, 'info']); 
    Route::post('/gold/buy', [GoldTransactionController::class, 'buy']);   

    // INFLIP (Properti)
    Route::get('/inflip/projects', [InflipController::class, 'indexUser']);
    Route::get('/inflip/portfolio', [InflipController::class, 'getPortfolio']); 
    Route::post('/inflip/invest', [InflipController::class, 'invest']);

    // PEGADAIAN (Gadai Barang Member)
    Route::post('/pawn/apply', [PawnTransactionController::class, 'store']);
    Route::get('/pawn/history', [PawnTransactionController::class, 'history']); 
    Route::post('/pawn/redeem/{id}', [PawnTransactionController::class, 'redeem']);

    // --- NOTIFIKASI ---
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);


    // =========================================================================
    // 3. ADMIN ONLY ROUTES (Prefix: /api/admin/...)
    // =========================================================================
    Route::prefix('admin')->group(function () {
        
        // Dashboard & Statistik
        Route::get('/stats', [AdminController::class, 'getStats']); 
        Route::get('/financial/profit-loss', [AdminController::class, 'getProfitLoss']);

        // Manajemen Anggota
        Route::get('/users', [AdminController::class, 'indexUsers']);
        Route::post('/users/{id}/verify', [AdminController::class, 'verifyUser']);
        Route::post('/users/{id}/reject', [AdminController::class, 'rejectUser']);
        Route::post('/users/{id}/reset-pin', [AdminController::class, 'resetPin']);

        // Manajemen Transaksi Wallet (Topup/Withdraw)
        Route::get('/transactions', [AdminController::class, 'indexTransactions']);
        Route::post('/transactions/{id}/approve', [AdminController::class, 'approveTransaction']);

        // Manajemen TAMASA (Emas Admin)
        Route::get('/tamasa', [AdminTamasaController::class, 'index']);                        
        Route::post('/tamasa/price', [AdminTamasaController::class, 'updatePrice']);           
        Route::post('/tamasa/transactions/{id}/approve', [AdminTamasaController::class, 'approve']); 
        Route::post('/tamasa/transactions/{id}/reject', [AdminTamasaController::class, 'reject']);   

        // Manajemen PEGADAIAN (Admin)
        Route::get('/pegadaian', [AdminPawnController::class, 'index']); 
        Route::post('/pegadaian/{id}/approve', [AdminPawnController::class, 'approve']);
        Route::post('/pegadaian/{id}/reject', [AdminPawnController::class, 'reject']);

        // MANAJEMEN PEMBIAYAAN & KATALOG (ADMIN)
        Route::prefix('financing')->group(function () {
            // Pengajuan & Persetujuan
            Route::get('/all', [AdminController::class, 'getAllFinancings']); 
            Route::post('/{id}/approve', [AdminController::class, 'approveFinancing']);
            Route::post('/{id}/reject', [AdminController::class, 'rejectFinancing']);

            // Gudang Kredit (Manajemen Katalog)
            Route::get('/catalog', [AdminController::class, 'indexCatalog']);
            Route::post('/catalog', [AdminController::class, 'storeCatalog']);
            Route::put('/catalog/{id}', [AdminController::class, 'updateCatalog']);
            Route::delete('/catalog/{id}', [AdminController::class, 'deleteCatalog']);
        });

        // Manajemen Berita KKJ (Admin)
        Route::get('/kabar', [KabarController::class, 'index']); 
        Route::post('/kabar', [KabarController::class, 'store']);
        Route::put('/kabar/{id}', [KabarController::class, 'update']);
        Route::delete('/kabar/{id}', [KabarController::class, 'destroy']);

        // Manajemen INFLIP (Admin)
        Route::get('/inflip', [InflipController::class, 'indexAdmin']);
        Route::post('/inflip', [InflipController::class, 'store']);
    });
});