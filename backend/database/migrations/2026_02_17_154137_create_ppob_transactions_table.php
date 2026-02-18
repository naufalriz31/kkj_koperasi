<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ppob_transactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('transaction_code')->unique(); // Kode unik transaksi
    $table->string('service_code'); // Contoh: 'PLN', 'PULSA_TSEL'
    $table->string('target_number'); // No HP atau ID Pelanggan
    $table->decimal('amount', 15, 2); // Harga beli dari provider
    $table->decimal('total_price', 15, 2); // Harga jual ke anggota (termasuk admin fee)
    $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
    $table->string('ref_id')->nullable(); // ID Referensi dari provider PPOB
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppob_transactions');
    }
};
