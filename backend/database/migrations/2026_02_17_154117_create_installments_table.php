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
        Schema::create('installments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('financing_id')->constrained()->onDelete('cascade');
    $table->integer('installment_number'); // Cicilan ke-1, ke-2, dst.
    $table->decimal('amount', 15, 2); // Jumlah yang harus dibayar
    $table->decimal('amount_paid', 15, 2)->default(0); // Jumlah yang sudah dibayar
    $table->date('due_date'); // Jatuh tempo
    $table->date('paid_at')->nullable(); // Tanggal bayar
    $table->enum('status', ['unpaid', 'paid', 'overdue'])->default('unpaid');
    $table->string('payment_method')->nullable(); // Transfer/Potong Saldo
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
