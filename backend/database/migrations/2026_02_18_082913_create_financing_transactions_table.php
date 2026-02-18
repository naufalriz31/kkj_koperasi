<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financing_transactions', function (Blueprint $column) {
            $column->id();
            $column->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $column->string('type'); // 'Kredit Barang', 'Modal Usaha', dll
            $column->bigInteger('amount');
            $column->integer('duration'); // Tenor bulan
            $column->bigInteger('monthly_payment');
            $column->json('details')->nullable(); // Untuk menyimpan info item_id, item_name, dll
            $column->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $column->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financing_transactions');
    }
};