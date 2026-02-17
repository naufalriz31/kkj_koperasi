<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel untuk master harga emas harian
        Schema::create('gold_prices', function (Blueprint $table) {
            $table->id();
            $table->decimal('buy_price', 15, 2); 
            $table->decimal('sell_price', 15, 2);
            $table->timestamps();
        });

        // Tabel untuk saldo emas per anggota
        Schema::create('tamasa_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount_grams', 10, 4)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Penting: Hapus tabel anak dulu, baru tabel master
        Schema::dropIfExists('tamasa_balances');
        Schema::dropIfExists('gold_prices');
    }
};