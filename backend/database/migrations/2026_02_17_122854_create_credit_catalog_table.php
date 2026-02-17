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
        Schema::create('credit_catalog', function (Blueprint $table) {
            $table->id(); // PENTING: Sebagai Primary Key untuk database MySQL
            $table->string('name');
            $table->bigInteger('price');
            $table->bigInteger('dp');
            $table->bigInteger('tax')->default(0);
            $table->json('tenors'); // Menyimpan array [3, 6, 12] sebagai JSON
            $table->timestamps(); // Mencatat created_at dan updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_catalog');
    }
};